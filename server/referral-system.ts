/**
 * BRAD'CI - Backend Controller & Business Logic for the Referral System
 * Technology: Node.js / Express / TypeScript (SQL Database Backend)
 * 
 * Rules:
 * 1. Unique code (e.g. BRAD-89A2), link: https://bradci.com/invite?ref=BRAD-89A2
 * 2. Cap: Max 10 referees (Max 10 000 FCFA bonus)
 * 3. Reciprocal: +1000 FCFA for sponsor, +1000 FCFA for referee
 * 4. Non-withdrawable to cash, usable only for BRAD'CI purchases
 * 5. Lifecycle: PENDING_KYC -> PENDING_TRANSACTION -> COMPLETED
 */

import { Request, Response } from 'express';
import { generateReferralKycApprovedEmailHtml, generateReferralKycApprovedPushMessage } from '../src/utils/referralEmailTemplate';

export const REFERRAL_BONUS_PER_USER_FCFA = 1000;
export const MAX_REFERRALS_PER_SPONSOR = 10;
export const MAX_TOTAL_REFERRAL_BONUS_FCFA = 10000;

// Helper to generate a unique random referral code (e.g. BRAD-89A2)
export function generateUniqueReferralCode(customPrefix: string = 'BRAD'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${customPrefix}-${rand}`;
}

/**
 * 1. REGISTRATION CONTROLLER:
 * Handles new user sign-up with optional referral code
 */
export async function handleRegisterWithReferral(
  db: any, // Database Pool / ORM
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
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const cleanReferralInput = userData.referralCodeInput?.trim().toUpperCase();
    let sponsor = null;

    // Check if sponsor referral code exists
    if (cleanReferralInput) {
      const sponsorRes = await client.query(
        'SELECT id, name, email, phone, referral_code, referral_count, pending_bonus, available_bonus FROM users WHERE referral_code = $1',
        [cleanReferralInput]
      );
      if (sponsorRes.rows.length > 0) {
        sponsor = sponsorRes.rows[0];
      }
    }

    // Generate unique code for new user
    const newReferralCode = generateUniqueReferralCode('BRAD');
    const newUserId = 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    // Insert new user
    const insertUserRes = await client.query(
      `INSERT INTO users (
        id, name, first_name, last_name, email, phone, city, password_hash,
        referral_code, referred_by, referral_count, pending_bonus, available_bonus,
        is_kyc_verified, is_first_tx_done, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0, 0, false, false, NOW())
      RETURNING id, name, email, phone, referral_code, referred_by`,
      [
        newUserId,
        `${userData.firstName} ${userData.lastName}`,
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phone,
        userData.city,
        userData.passwordHash,
        newReferralCode,
        sponsor ? sponsor.referral_code : null
      ]
    );

    const newUser = insertUserRes.rows[0];

    // If sponsored, create referral record in PENDING_KYC status
    if (sponsor) {
      const referralId = 'ref_' + Date.now();
      await client.query(
        `INSERT INTO referrals (
          id, sponsor_id, referee_id, referral_code, status,
          sponsor_bonus_amount, referee_bonus_amount, created_at
        ) VALUES ($1, $2, $3, $4, 'PENDING_KYC', $5, $6, NOW())`,
        [
          referralId,
          sponsor.id,
          newUser.id,
          sponsor.referral_code,
          REFERRAL_BONUS_PER_USER_FCFA,
          REFERRAL_BONUS_PER_USER_FCFA
        ]
      );
    }

    await client.query('COMMIT');
    return { success: true, user: newUser, sponsored: !!sponsor };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 2. KYC VALIDATION CONTROLLER:
 * Called when moderation approves the referee's KYC
 * Moves referral to 'PENDING_TRANSACTION', credits +1000 FCFA pending bonus, sends notifications.
 */
export async function handleApproveKYCAndTriggerReferralBonus(
  db: any,
  emailService: any,
  notificationService: any,
  refereeUserId: string
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Update referee's KYC flag
    await client.query(
      'UPDATE users SET is_kyc_verified = true, kyc_status = $1 WHERE id = $2',
      ['verified', refereeUserId]
    );

    // 2. Check if this user was referred by someone
    const referralRes = await client.query(
      `SELECT r.*, s.name as sponsor_name, s.email as sponsor_email, s.referral_count as sponsor_count,
              u.name as referee_name, u.phone as referee_phone, u.city as referee_city
       FROM referrals r
       JOIN users s ON r.sponsor_id = s.id
       JOIN users u ON r.referee_id = u.id
       WHERE r.referee_id = $1 AND r.status = 'PENDING_KYC'`,
      [refereeUserId]
    );

    if (referralRes.rows.length > 0) {
      const ref = referralRes.rows[0];

      // Update referral status to PENDING_TRANSACTION
      await client.query(
        'UPDATE referrals SET status = $1, kyc_validated_at = NOW() WHERE id = $2',
        ['PENDING_TRANSACTION', ref.id]
      );

      // Increment pending bonus for referee (+1 000 FCFA)
      await client.query(
        'UPDATE users SET pending_bonus = pending_bonus + $1 WHERE id = $2',
        [REFERRAL_BONUS_PER_USER_FCFA, ref.referee_id]
      );

      // Increment pending bonus for sponsor (+1 000 FCFA) if sponsor hasn't already reached max 10 completed
      if (ref.sponsor_count < MAX_REFERRALS_PER_SPONSOR) {
        await client.query(
          'UPDATE users SET pending_bonus = pending_bonus + $1 WHERE id = $2',
          [REFERRAL_BONUS_PER_USER_FCFA, ref.sponsor_id]
        );
      }

      // 3. Send Email and Push Notifications to the sponsor
      const emailPayload = {
        sponsorName: ref.sponsor_name,
        sponsorEmail: ref.sponsor_email,
        refereeName: ref.referee_name,
        refereePhone: ref.referee_phone,
        refereeCommune: ref.referee_city,
        referralCode: ref.referral_code,
        sponsorCurrentCount: ref.sponsor_count,
        sponsorMaxCount: MAX_REFERRALS_PER_SPONSOR,
        pendingBonusFCFA: REFERRAL_BONUS_PER_USER_FCFA,
        totalPendingBonusFCFA: (ref.sponsor_count + 1) * REFERRAL_BONUS_PER_USER_FCFA,
        totalAvailableBonusFCFA: ref.sponsor_count * REFERRAL_BONUS_PER_USER_FCFA
      };

      const emailHtml = generateReferralKycApprovedEmailHtml(emailPayload);
      const pushMsg = generateReferralKycApprovedPushMessage(emailPayload);

      // Asynchronously deliver notifications
      if (emailService) {
        await emailService.sendMail({
          to: ref.sponsor_email,
          subject: `🎁 +1 000 FCFA en attente ! KYC validé pour votre filleul ${ref.referee_name}`,
          html: emailHtml
        });
      }

      if (notificationService) {
        await notificationService.sendPushToUser(ref.sponsor_id, {
          title: pushMsg.title,
          body: pushMsg.body,
          type: 'referral'
        });
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 3. DELIVERY OTP VALIDATION CONTROLLER:
 * Called by the driver on the ground when buyer gives the 4-digit OTP.
 * Closes the order, releases escrow, and checks if buyer or seller is completing their first transaction.
 * If so, unlocks 1 000 FCFA available bonus for referee and sponsor (capped at 10).
 */
export async function validateDeliveryOTP(
  db: any,
  notificationService: any,
  jobId: string,
  enteredOtp: string,
  driverId: string
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch delivery job
    const jobRes = await client.query(
      'SELECT * FROM delivery_jobs WHERE id = $1',
      [jobId]
    );

    if (jobRes.rows.length === 0) {
      throw new Error('Course de livraison introuvable');
    }

    const job = jobRes.rows[0];

    if (job.delivery_otp_code !== enteredOtp.trim()) {
      throw new Error('Code secret OTP incorrect');
    }

    // 2. Mark delivery job as completed
    await client.query(
      'UPDATE delivery_jobs SET status = $1, delivered_at = NOW() WHERE id = $2',
      ['delivered', jobId]
    );

    // 3. Mark product as sold
    await client.query(
      'UPDATE products SET status = $1, sold_at = NOW() WHERE id = $2',
      ['sold', job.product_id]
    );

    // 4. Release Escrow to Seller & Driver
    await client.query(
      'UPDATE escrow_records SET status = $1, released_at = NOW() WHERE product_id = $2',
      ['released', job.product_id]
    );

    // Check participants (buyer and seller) for 1st transaction referral bonus trigger
    const participants = [
      { userId: job.buyer_id, type: 'purchase' as const },
      { userId: job.seller_id, type: 'sale' as const }
    ];

    for (const p of participants) {
      if (!p.userId) continue;

      const userRes = await client.query(
        'SELECT id, name, is_first_tx_done, pending_bonus, available_bonus FROM users WHERE id = $1',
        [p.userId]
      );

      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];

        // If this user has never done their 1st transaction:
        if (!u.is_first_tx_done) {
          // Mark 1st tx done
          await client.query(
            'UPDATE users SET is_first_tx_done = true WHERE id = $1',
            [u.id]
          );

          // Find if there is a pending referral for this referee
          const refRes = await client.query(
            `SELECT r.*, s.referral_count as sponsor_count, s.id as sponsor_user_id
             FROM referrals r
             JOIN users s ON r.sponsor_id = s.id
             WHERE r.referee_id = $1 AND r.status = 'PENDING_TRANSACTION'`,
            [u.id]
          );

          if (refRes.rows.length > 0) {
            const referral = refRes.rows[0];

            // 1. Move Referee bonus from pending to available
            await client.query(
              `UPDATE users 
               SET pending_bonus = GREATEST(0, pending_bonus - $1),
                   available_bonus = available_bonus + $1
               WHERE id = $2`,
              [REFERRAL_BONUS_PER_USER_FCFA, u.id]
            );

            // 2. Move Sponsor bonus from pending to available IF count < 10
            if (referral.sponsor_count < MAX_REFERRALS_PER_SPONSOR) {
              await client.query(
                `UPDATE users 
                 SET pending_bonus = GREATEST(0, pending_bonus - $1),
                     available_bonus = available_bonus + $1,
                     referral_count = referral_count + 1
                 WHERE id = $2`,
                [REFERRAL_BONUS_PER_USER_FCFA, referral.sponsor_user_id]
              );
            } else {
              // Sponsor already maxed out at 10, clear pending
              await client.query(
                `UPDATE users 
                 SET pending_bonus = GREATEST(0, pending_bonus - $1)
                 WHERE id = $2`,
                [REFERRAL_BONUS_PER_USER_FCFA, referral.sponsor_user_id]
              );
            }

            // 3. Mark referral as COMPLETED
            await client.query(
              `UPDATE referrals 
               SET status = 'COMPLETED',
                   completed_at = NOW(),
                   first_tx_order_id = $1,
                   first_tx_type = $2
               WHERE id = $3`,
              [jobId, p.type, referral.id]
            );

            // Send celebration notifications
            if (notificationService) {
              await notificationService.sendPushToUser(u.id, {
                title: '🎁 Bonus de Parrainage Débloqué !',
                body: 'Vos 1 000 FCFA de bienvenue sont désormais disponibles pour vos achats sur BRAD\'CI !',
                type: 'referral'
              });

              await notificationService.sendPushToUser(referral.sponsor_user_id, {
                title: '🎉 +1 000 FCFA Débloqués !',
                body: `Votre filleul ${u.name} a validé sa 1ère livraison. Vos 1 000 FCFA sont disponibles !`,
                type: 'referral'
              });
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    return { success: true, message: 'Livraison validée par code OTP et bonus de parrainage débloqués avec succès' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 4. PURCHASE WITH REFERRAL BALANCE CONTROLLER:
 * Allows user to spend their available referral balance to buy an item.
 * Strictly non-withdrawable to Mobile Money.
 */
export async function payWithReferralBalance(
  db: any,
  userId: string,
  orderId: string,
  amountToDeduct: number
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT id, name, available_bonus FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userRes.rows.length === 0) {
      throw new Error('Utilisateur introuvable');
    }

    const user = userRes.rows[0];

    if (user.available_bonus < amountToDeduct) {
      throw new Error(`Solde parrainage insuffisant. Disponible: ${user.available_bonus} FCFA, Demandé: ${amountToDeduct} FCFA`);
    }

    // Deduct from available referral balance
    const newBalance = user.available_bonus - amountToDeduct;
    await client.query(
      'UPDATE users SET available_bonus = $1 WHERE id = $2',
      [newBalance, userId]
    );

    // Record transaction
    const txId = 'ref_tx_' + Date.now();
    await client.query(
      `INSERT INTO referral_transactions (
        id, user_id, order_id, amount_spent, balance_before, balance_after, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [txId, userId, orderId, amountToDeduct, user.available_bonus, newBalance]
    );

    await client.query('COMMIT');
    return {
      success: true,
      deductedAmount: amountToDeduct,
      remainingReferralBalance: newBalance
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
