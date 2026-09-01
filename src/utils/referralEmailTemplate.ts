/**
 * BRAD'CI - Templates de Notifications & Emails Professionnels de Parrainage
 * Déclenchés après la validation KYC d'un filleul.
 */

export interface ReferralNotificationPayload {
  sponsorName: string;
  sponsorEmail: string;
  refereeName: string;
  refereePhone: string;
  refereeCommune?: string;
  referralCode: string;
  sponsorCurrentCount: number; // e.g. 2
  sponsorMaxCount: number; // 10
  pendingBonusFCFA: number; // 1000
  totalPendingBonusFCFA: number; // e.g. 2000
  totalAvailableBonusFCFA: number; // e.g. 3000
}

/**
 * Génère le lien direct WhatsApp pour relancer le filleul
 */
export function generateWhatsAppNudgeLink(refereePhone: string, refereeName: string, sponsorName: string): string {
  // Nettoyage du numéro de téléphone (Côte d'Ivoire indicatif +225)
  let cleanPhone = refereePhone.replace(/[\s+-]/g, '');
  if (!cleanPhone.startsWith('225') && cleanPhone.length === 10) {
    cleanPhone = '225' + cleanPhone;
  }

  const message = `Bonjour ${refereeName} ! 👋 C'est ${sponsorName}. Félicitations pour la validation de ton KYC sur BRAD'CI 🇨🇮 ! 🎉

Pour que nous débloquions chacun nos 1 000 FCFA de solde d'achat cadeau :
👉 Publie ton 1er article aux enchères ou effectue ton 1er achat sécurisé avec remise en main propre.

Dès la 1ère livraison validée par code OTP, nos 1 000 FCFA basculeront instantanément en solde utilisable. À très vite sur BRAD'CI !`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Template d'email HTML ultra-professionnel et responsive
 */
export function generateReferralKycApprovedEmailHtml(payload: ReferralNotificationPayload): string {
  const whatsappUrl = generateWhatsAppNudgeLink(payload.refereePhone, payload.refereeName, payload.sponsorName);
  const remainingSlots = Math.max(0, payload.sponsorMaxCount - payload.sponsorCurrentCount);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Validé pour votre Filleul - BRAD'CI</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060913;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #0B111E;
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .brand-logo {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #FFFFFF;
    }
    .brand-accent {
      color: #F59E0B;
    }
    .content {
      padding: 32px 24px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .hero-title {
      font-size: 22px;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 12px 0;
      line-height: 1.3;
    }
    .text-p {
      font-size: 14px;
      line-height: 1.6;
      color: #94A3B8;
      margin: 0 0 20px 0;
    }
    .card-recap {
      background-color: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 13px;
    }
    .card-row:last-child {
      border-bottom: none;
    }
    .card-label {
      color: #64748B;
    }
    .card-value {
      color: #F8FAFC;
      font-weight: 700;
    }
    .bonus-highlight {
      color: #F59E0B;
      font-weight: 800;
    }
    .btn-whatsapp {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 16px 20px;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 15px;
      border-radius: 14px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(37, 211, 102, 0.4);
      margin-bottom: 16px;
    }
    .btn-dashboard {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 14px 20px;
      background-color: #1E293B;
      color: #E2E8F0 !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      border-radius: 14px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .gauge-container {
      margin: 20px 0;
      background-color: #0F172A;
      border-radius: 12px;
      padding: 14px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .gauge-bar-bg {
      height: 8px;
      background-color: #334155;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 8px;
    }
    .gauge-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #F59E0B 0%, #10B981 100%);
      width: ${(payload.sponsorCurrentCount / payload.sponsorMaxCount) * 100}%;
    }
    .footer {
      background-color: #060913;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #475569;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="brand-logo">BRAD<span class="brand-accent">'CI</span></div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 4px; letter-spacing: 1px;">PREMIÈRE PLACE DE MARCHÉ SÉCURISÉE DE CÔTE D'IVOIRE</div>
    </div>

    <!-- Content -->
    <div class="content">
      <div style="text-align: center;">
        <span class="badge">✓ Étape 2 : KYC Filleul Validé</span>
      </div>

      <h1 class="hero-title" style="text-align: center;">
        Bonne nouvelle ${payload.sponsorName} !<br>
        <span style="color: #F59E0B;">+1 000 FCFA</span> sont en attente de déblocage 🎁
      </h1>

      <p class="text-p" style="text-align: center;">
        Votre filleul <strong style="color: #FFFFFF;">${payload.refereeName}</strong> a finalisé avec succès la vérification de son identité (KYC).
      </p>

      <!-- Details Recap -->
      <div class="card-recap">
        <div class="card-row">
          <span class="card-label">Filleul certifié :</span>
          <span class="card-value">${payload.refereeName} (${payload.refereeCommune || 'Abidjan'})</span>
        </div>
        <div class="card-row">
          <span class="card-label">Bonus en attente (Parrain) :</span>
          <span class="bonus-highlight">+1 000 FCFA</span>
        </div>
        <div class="card-row">
          <span class="card-label">Bonus en attente (Filleul) :</span>
          <span class="bonus-highlight">+1 000 FCFA</span>
        </div>
        <div class="card-row">
          <span class="card-label">Condition de déblocage :</span>
          <span class="card-value" style="color: #38BDF8;">1ère livraison validée par code OTP</span>
        </div>
      </div>

      <!-- Gauge -->
      <div class="gauge-container">
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
          <span style="color: #94A3B8;">Jauge de parrainage :</span>
          <span style="color: #F59E0B;">${payload.sponsorCurrentCount}/${payload.sponsorMaxCount} Filleuls complétés (Max 10 000 F)</span>
        </div>
        <div class="gauge-bar-bg">
          <div class="gauge-bar-fill"></div>
        </div>
        <div style="font-size: 10px; color: #64748B; margin-top: 6px;">
          ${remainingSlots > 0 ? `Il vous reste ${remainingSlots} place(s) bonus disponible(s).` : 'Plafond maximum de 10 000 FCFA atteint !'}
        </div>
      </div>

      <!-- Action Call -->
      <p class="text-p" style="margin-bottom: 20px;">
        💡 <strong>Conseil Pro :</strong> Relancez votre filleul dès maintenant pour l'aider à déposer sa première annonce ou finaliser son premier achat avec inspection physique !
      </p>

      <!-- Primary WhatsApp Button -->
      <a href="${whatsappUrl}" target="_blank" class="btn-whatsapp">
        💬 Relancer ${payload.refereeName} sur WhatsApp
      </a>

      <!-- Secondary Dashboard Button -->
      <a href="https://bradci.com/dashboard?tab=referral" target="_blank" class="btn-dashboard">
        📊 Accéder à mon Espace Parrainage
      </a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 6px 0;">© 2026 BRAD'CI - Abidjan, Côte d'Ivoire. Tous droits réservés.</p>
      <p style="margin: 0;">Les bonus de parrainage sont non-retirables en espèces et utilisables exclusivement pour vos achats sur la plateforme.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Version texte pour SMS ou Notification Push
 */
export function generateReferralKycApprovedPushMessage(payload: ReferralNotificationPayload): { title: string; body: string } {
  return {
    title: `🎉 +1 000 FCFA en attente ! KYC de ${payload.refereeName} validé`,
    body: `Relancez votre filleul pour qu'il effectue son 1er achat ou 1ère vente avec validation OTP afin de débloquer vos 1 000 FCFA utilisables !`
  };
}
