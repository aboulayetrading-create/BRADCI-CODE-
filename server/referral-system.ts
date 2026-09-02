/**
 * BRAD'CI - Backend Controller & Business Logic for the Referral System
 * Technology: Node.js / Express / TypeScript (MySQL / MariaDB via mysql2/promise)
 * Hébergement : o2switch (cPanel / MySQL 8.0 / MariaDB 10.x)
 * 
 * Règles Métier BRAD'CI :
 * 1. Code unique généré (ex: BRAD-89A2), lien de partage : https://bradci.com/invite?ref=BRAD-89A2
 * 2. Plafond : Max 10 filleuls complétés par parrain (Gain max : 10 000 FCFA)
 * 3. Réciprocité : +1 000 FCFA pour le parrain ET +1 000 FCFA pour le filleul
 * 4. Non-retirable en Mobile Money / Cash, utilisable exclusivement pour les achats sur BRAD'CI
 * 5. Cycle de vie : PENDING_KYC -> PENDING_TRANSACTION -> COMPLETED
 */

import { Request, Response } from 'express';
import type { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { generateReferralKycApprovedEmailHtml, generateReferralKycApprovedPushMessage } from '../src/utils/referralEmailTemplate';

export const REFERRAL_BONUS_PER_USER_FCFA = 1000;
export const MAX_REFERRALS_PER_SPONSOR = 10;
export const MAX_TOTAL_REFERRAL_BONUS_FCFA = 10000;

// Type helper acceptant soit un Pool, soit une PoolConnection existante
export type MySQLDatabase = Pool | PoolConnection;

// Helper interne pour obtenir une connexion active et gérer la libération
async function acquireConnection(db: MySQLDatabase): Promise<{ connection: PoolConnection; shouldRelease: boolean }> {
  if ('getConnection' in db && typeof (db as Pool).getConnection === 'function') {
    const conn = await (db as Pool).getConnection();
    return { connection: conn, shouldRelease: true };
  }
  return { connection: db as PoolConnection, shouldRelease: false };
}

// Helper pour générer un code de parrainage alphanumérique unique (ex: BRAD-89A2)
export function generateUniqueReferralCode(customPrefix: string = 'BRAD'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${customPrefix}-${rand}`;
}

/**
 * 1. REGISTRATION CONTROLLER (MySQL / MariaDB):
 * Inscription d'un nouvel utilisateur avec code de parrainage optionnel
 */
export async function handleRegisterWithReferral(
  db: MySQLDatabase,
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    passwordHash: string;
    referralCodeInput?: string; // Saisi manuellement ou extrait de l'URL ?ref=
  }
) {
  const { connection, shouldRelease } = await acquireConnection(db);
  try {
    await connection.beginTransaction();

    const cleanReferralInput = userData.referralCodeInput?.trim().toUpperCase();
    let sponsor: any = null;

    // Vérification de l'existence du code parrain
    if (cleanReferralInput) {
      const [sponsorRows] = await connection.query<RowDataPacket[]>(
        'SELECT id, name, email, phone, referral_code, referral_count, pending_bonus, available_bonus FROM users WHERE referral_code = ? LIMIT 1',
        [cleanReferralInput]
      );
      if (sponsorRows.length > 0) {
        sponsor = sponsorRows[0];
      }
    }

    // Génération de l'identifiant et du code unique pour le nouveau membre
    const newReferralCode = generateUniqueReferralCode('BRAD');
    const newUserId = 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const fullName = `${userData.firstName} ${userData.lastName}`.trim();
    const referredByCode = sponsor ? sponsor.referral_code : null;

    // Insertion du nouvel utilisateur dans MySQL (compatible MariaDB/MySQL sans clause RETURNING)
    await connection.query<ResultSetHeader>(
      `INSERT INTO users (
        id, name, first_name, last_name, email, phone, city, password_hash,
        referral_code, referred_by, referral_count, pending_bonus, available_bonus,
        is_kyc_verified, is_first_tx_done, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, NOW())`,
      [
        newUserId,
        fullName,
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phone,
        userData.city,
        userData.passwordHash,
        newReferralCode,
        referredByCode
      ]
    );

    const newUser = {
      id: newUserId,
      name: fullName,
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      city: userData.city,
      referral_code: newReferralCode,
      referred_by: referredByCode
    };

    // Si parrainé, création du dossier de parrainage avec le statut initial PENDING_KYC
    if (sponsor) {
      const referralId = 'ref_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      await connection.query<ResultSetHeader>(
        `INSERT INTO referrals (
          id, sponsor_id, referee_id, referral_code, status,
          sponsor_bonus_amount, referee_bonus_amount, created_at
        ) VALUES (?, ?, ?, ?, 'PENDING_KYC', ?, ?, NOW())`,
        [
          referralId,
          sponsor.id,
          newUserId,
          sponsor.referral_code,
          REFERRAL_BONUS_PER_USER_FCFA,
          REFERRAL_BONUS_PER_USER_FCFA
        ]
      );
    }

    await connection.commit();
    return { success: true, user: newUser, sponsored: !!sponsor };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (shouldRelease) {
      connection.release();
    }
  }
}

/**
 * 2. KYC VALIDATION CONTROLLER (MySQL / MariaDB):
 * Déclenché dès que la modération ou le contrôle biométrique valide le KYC du filleul.
 * Fait passer le parrainage à 'PENDING_TRANSACTION', crédite +1 000 FCFA en attente (pending) et notifie.
 */
export async function handleApproveKYCAndTriggerReferralBonus(
  db: MySQLDatabase,
  emailService: any,
  notificationService: any,
  refereeUserId: string
) {
  const { connection, shouldRelease } = await acquireConnection(db);
  try {
    await connection.beginTransaction();

    // 1. Mise à jour de l'état KYC du filleul
    await connection.query<ResultSetHeader>(
      'UPDATE users SET is_kyc_verified = 1, kyc_status = ? WHERE id = ?',
      ['verified', refereeUserId]
    );

    // 2. Recherche si cet utilisateur a été parrainé (statut PENDING_KYC)
    const [referralRows] = await connection.query<RowDataPacket[]>(
      `SELECT r.*, s.name as sponsor_name, s.email as sponsor_email, s.referral_count as sponsor_count,
              u.name as referee_name, u.phone as referee_phone, u.city as referee_city
       FROM referrals r
       JOIN users s ON r.sponsor_id = s.id
       JOIN users u ON r.referee_id = u.id
       WHERE r.referee_id = ? AND r.status = 'PENDING_KYC'
       LIMIT 1`,
      [refereeUserId]
    );

    if (referralRows.length > 0) {
      const ref = referralRows[0];

      // Passage du statut à PENDING_TRANSACTION
      await connection.query<ResultSetHeader>(
        'UPDATE referrals SET status = ?, kyc_validated_at = NOW() WHERE id = ?',
        ['PENDING_TRANSACTION', ref.id]
      );

      // Crédit du bonus en attente pour le filleul (+1 000 FCFA)
      await connection.query<ResultSetHeader>(
        'UPDATE users SET pending_bonus = pending_bonus + ? WHERE id = ?',
        [REFERRAL_BONUS_PER_USER_FCFA, ref.referee_id]
      );

      // Crédit du bonus en attente pour le parrain (+1 000 FCFA) si le parrain n'a pas atteint la limite de 10
      if (Number(ref.sponsor_count) < MAX_REFERRALS_PER_SPONSOR) {
        await connection.query<ResultSetHeader>(
          'UPDATE users SET pending_bonus = pending_bonus + ? WHERE id = ?',
          [REFERRAL_BONUS_PER_USER_FCFA, ref.sponsor_id]
        );
      }

      // 3. Préparation et envoi des notifications Email & Push au parrain
      const emailPayload = {
        sponsorName: ref.sponsor_name,
        sponsorEmail: ref.sponsor_email,
        refereeName: ref.referee_name,
        refereePhone: ref.referee_phone,
        refereeCommune: ref.referee_city,
        referralCode: ref.referral_code,
        sponsorCurrentCount: Number(ref.sponsor_count),
        sponsorMaxCount: MAX_REFERRALS_PER_SPONSOR,
        pendingBonusFCFA: REFERRAL_BONUS_PER_USER_FCFA,
        totalPendingBonusFCFA: (Number(ref.sponsor_count) + 1) * REFERRAL_BONUS_PER_USER_FCFA,
        totalAvailableBonusFCFA: Number(ref.sponsor_count) * REFERRAL_BONUS_PER_USER_FCFA
      };

      const emailHtml = generateReferralKycApprovedEmailHtml(emailPayload);
      const pushMsg = generateReferralKycApprovedPushMessage(emailPayload);

      if (emailService && typeof emailService.sendMail === 'function') {
        try {
          await emailService.sendMail({
            to: ref.sponsor_email,
            subject: `🎁 +1 000 FCFA en attente ! KYC validé pour votre filleul ${ref.referee_name}`,
            html: emailHtml
          });
        } catch (e) {
          console.warn('[Referral Email Error]', e);
        }
      }

      if (notificationService && typeof notificationService.sendPushToUser === 'function') {
        try {
          await notificationService.sendPushToUser(ref.sponsor_id, {
            title: pushMsg.title,
            body: pushMsg.body,
            type: 'referral'
          });
        } catch (e) {
          console.warn('[Referral Push Error]', e);
        }
      }
    }

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (shouldRelease) {
      connection.release();
    }
  }
}

/**
 * 3. DELIVERY OTP VALIDATION CONTROLLER (MySQL / MariaDB):
 * Déclenché par le livreur lors de la saisie du code OTP à 4 chiffres à la remise du colis.
 * Clôture la livraison, libère l'Escrow et débloque le bonus de 1 000 FCFA si c'est la 1ère transaction.
 */
export async function validateDeliveryOTP(
  db: MySQLDatabase,
  notificationService: any,
  jobId: string,
  enteredOtp: string,
  driverId: string
) {
  const { connection, shouldRelease } = await acquireConnection(db);
  try {
    await connection.beginTransaction();

    // 1. Récupération de la course de livraison avec verrouillage FOR UPDATE
    const [jobRows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM delivery_jobs WHERE id = ? FOR UPDATE',
      [jobId]
    );

    if (jobRows.length === 0) {
      throw new Error('Course de livraison introuvable');
    }

    const job = jobRows[0];

    if (String(job.delivery_otp_code).trim() !== enteredOtp.trim()) {
      throw new Error('Code secret OTP incorrect');
    }

    // 2. Marquer la livraison comme terminée
    await connection.query<ResultSetHeader>(
      'UPDATE delivery_jobs SET status = ?, delivered_at = NOW() WHERE id = ?',
      ['delivered', jobId]
    );

    // 3. Marquer le produit comme vendu
    await connection.query<ResultSetHeader>(
      'UPDATE products SET status = ?, sold_at = NOW() WHERE id = ?',
      ['sold', job.product_id]
    );

    // 4. Libération des fonds sous séquestre (Escrow)
    await connection.query<ResultSetHeader>(
      'UPDATE escrow_records SET status = ?, released_at = NOW() WHERE product_id = ?',
      ['released', job.product_id]
    );

    // 5. Vérification des participants (acheteur et vendeur) pour l'attribution du bonus de 1ère transaction
    const participants = [
      { userId: job.buyer_id, type: 'purchase' as const },
      { userId: job.seller_id, type: 'sale' as const }
    ];

    for (const p of participants) {
      if (!p.userId) continue;

      const [userRows] = await connection.query<RowDataPacket[]>(
        'SELECT id, name, is_first_tx_done, pending_bonus, available_bonus FROM users WHERE id = ? FOR UPDATE',
        [p.userId]
      );

      if (userRows.length > 0) {
        const u = userRows[0];

        // Si l'utilisateur n'avait pas encore réalisé sa première transaction
        if (!u.is_first_tx_done) {
          await connection.query<ResultSetHeader>(
            'UPDATE users SET is_first_tx_done = 1 WHERE id = ?',
            [u.id]
          );

          // Recherche d'un parrainage en attente (statut PENDING_TRANSACTION)
          const [refRows] = await connection.query<RowDataPacket[]>(
            `SELECT r.*, s.referral_count as sponsor_count, s.id as sponsor_user_id
             FROM referrals r
             JOIN users s ON r.sponsor_id = s.id
             WHERE r.referee_id = ? AND r.status = 'PENDING_TRANSACTION'
             LIMIT 1`,
            [u.id]
          );

          if (refRows.length > 0) {
            const referral = refRows[0];
            const sponsorCount = Number(referral.sponsor_count);

            // A. Déblocage du bonus du filleul : passage de pending_bonus à available_bonus
            await connection.query<ResultSetHeader>(
              `UPDATE users 
               SET pending_bonus = GREATEST(0, CAST(pending_bonus AS SIGNED) - ?),
                   available_bonus = available_bonus + ?
               WHERE id = ?`,
              [REFERRAL_BONUS_PER_USER_FCFA, REFERRAL_BONUS_PER_USER_FCFA, u.id]
            );

            // B. Déblocage du bonus du parrain si sous la limite de 10 filleuls complétés
            if (sponsorCount < MAX_REFERRALS_PER_SPONSOR) {
              await connection.query<ResultSetHeader>(
                `UPDATE users 
                 SET pending_bonus = GREATEST(0, CAST(pending_bonus AS SIGNED) - ?),
                     available_bonus = available_bonus + ?,
                     referral_count = referral_count + 1
                 WHERE id = ?`,
                [REFERRAL_BONUS_PER_USER_FCFA, REFERRAL_BONUS_PER_USER_FCFA, referral.sponsor_user_id]
              );
            } else {
              // Plafond déjà atteint : apuration du pending sans augmentation de available
              await connection.query<ResultSetHeader>(
                `UPDATE users 
                 SET pending_bonus = GREATEST(0, CAST(pending_bonus AS SIGNED) - ?)
                 WHERE id = ?`,
                [REFERRAL_BONUS_PER_USER_FCFA, referral.sponsor_user_id]
              );
            }

            // C. Finalisation du dossier de parrainage -> COMPLETED
            await connection.query<ResultSetHeader>(
              `UPDATE referrals 
               SET status = 'COMPLETED',
                   completed_at = NOW(),
                   first_tx_order_id = ?,
                   first_tx_type = ?
               WHERE id = ?`,
              [jobId, p.type, referral.id]
            );

            // Notifications de félicitations
            if (notificationService && typeof notificationService.sendPushToUser === 'function') {
              try {
                await notificationService.sendPushToUser(u.id, {
                  title: '🎁 Bonus de Parrainage Débloqué !',
                  body: "Vos 1 000 FCFA de bienvenue sont désormais disponibles pour vos achats sur BRAD'CI !",
                  type: 'referral'
                });

                await notificationService.sendPushToUser(referral.sponsor_user_id, {
                  title: '🎉 +1 000 FCFA Débloqués !',
                  body: `Votre filleul ${u.name} a validé sa 1ère livraison. Vos 1 000 FCFA sont disponibles !`,
                  type: 'referral'
                });
              } catch (e) {
                console.warn('[Referral Push Notification Error]', e);
              }
            }
          }
        }
      }
    }

    await connection.commit();
    return { success: true, message: 'Livraison validée par code OTP et bonus de parrainage débloqués avec succès' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (shouldRelease) {
      connection.release();
    }
  }
}

/**
 * 4. PURCHASE WITH REFERRAL BALANCE CONTROLLER (MySQL / MariaDB):
 * Déduit le montant depuis le solde parrainage disponible (available_bonus).
 * Strictement non-retirable en cash / Mobile Money, réservé aux achats.
 */
export async function payWithReferralBalance(
  db: MySQLDatabase,
  userId: string,
  orderId: string,
  amountToDeduct: number
) {
  const { connection, shouldRelease } = await acquireConnection(db);
  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, name, available_bonus FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (userRows.length === 0) {
      throw new Error('Utilisateur introuvable');
    }

    const user = userRows[0];
    const currentBalance = Number(user.available_bonus || 0);

    if (currentBalance < amountToDeduct) {
      throw new Error(`Solde parrainage insuffisant. Disponible: ${currentBalance} FCFA, Demandé: ${amountToDeduct} FCFA`);
    }

    // Déduction du solde de parrainage disponible
    const newBalance = currentBalance - amountToDeduct;
    await connection.query<ResultSetHeader>(
      'UPDATE users SET available_bonus = ? WHERE id = ?',
      [newBalance, userId]
    );

    // Enregistrement dans le journal d'audit des transactions de parrainage
    const txId = 'ref_tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    await connection.query<ResultSetHeader>(
      `INSERT INTO referral_transactions (
        id, user_id, order_id, amount_spent, balance_before, balance_after, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [txId, userId, orderId, amountToDeduct, currentBalance, newBalance]
    );

    await connection.commit();
    return {
      success: true,
      deductedAmount: amountToDeduct,
      remainingReferralBalance: newBalance
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (shouldRelease) {
      connection.release();
    }
  }
}
