/**
 * BRAD'CI - Service d'authentification et d'envoi d'e-mails sécurisés via Resend API
 * https://api.resend.com/emails
 */

export interface SendOtpEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
}

/**
 * Génère le modèle HTML officiel BRAD'CI pour le code OTP
 * - Fond sombre professionnel : #06102e à #0a194f
 * - Touches orange dynamique : #f97316
 * - Code OTP à 6 chiffres grand format et haute visibilité
 * - Rappel de sécurité (validité 5 minutes, confidentialité)
 */
export function generateBradCiOtpHtml(userEmail: string, otpCode: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre Code de Sécurité BRAD'CI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06102e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #06102e; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: linear-gradient(180deg, #0a194f 0%, #06102e 100%); border: 1px solid #1e3a8a; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden;">
          
          <!-- Orange Top Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #f97316 0%, #38bdf8 100%);"></td>
          </tr>

          <!-- Header / Brand Logo -->
          <tr>
            <td align="center" style="padding: 35px 30px 20px 30px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-size: 32px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; text-transform: uppercase;">
                      BRAD<span style="color: #f97316;">'</span><span style="color: #38bdf8;">CI</span>
                    </div>
                    <div style="font-size: 9px; font-weight: 800; letter-spacing: 2.5px; color: #94a3b8; text-transform: uppercase; margin-top: 6px;">
                      ENCHÈRES • PAIEMENT SÉQUESTRÉ • LIVRAISON GPS
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 35px 30px 35px; text-align: center;">
              
              <!-- Badge -->
              <div style="display: inline-block; background-color: rgba(249, 115, 22, 0.15); border: 1px solid rgba(249, 115, 22, 0.4); border-radius: 9999px; padding: 6px 16px; margin-bottom: 18px;">
                <span style="font-size: 11px; font-weight: 700; color: #fb923c; text-transform: uppercase; letter-spacing: 1px;">
                  🔒 Code d'Authentification Unique
                </span>
              </div>

              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
                Vérification de votre Compte
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Bonjour,<br>
                Vous avez demandé à vous connecter ou à créer un compte sur la plateforme <strong>BRAD'CI</strong> avec l'adresse :<br>
                <span style="color: #38bdf8; font-weight: 600;">${userEmail}</span>
              </p>

              <!-- PROMINENT OTP CODE BOX -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #03081e; border: 2px solid #f97316; border-radius: 14px; padding: 22px 10px; max-width: 380px; box-shadow: 0 10px 25px rgba(249, 115, 22, 0.15);">
                      <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                        Votre Code à 6 Chiffres
                      </div>
                      <div style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 40px; font-weight: 900; letter-spacing: 14px; color: #f97316; padding-left: 14px;">
                        ${otpCode}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiration Notice -->
              <p style="margin: 0 0 18px 0; font-size: 12px; color: #e2e8f0;">
                ⏱️ Ce code expire dans <strong style="color: #fb923c;">5 minutes</strong>.
              </p>

              <!-- Security Warning -->
              <div style="background-color: rgba(15, 23, 42, 0.7); border: 1px solid #1e293b; border-radius: 12px; padding: 14px 18px; margin-top: 20px; text-align: left;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="28" valign="top" style="font-size: 16px;">⚠️</td>
                    <td style="font-size: 11.5px; color: #94a3b8; line-height: 1.5;">
                      <strong style="color: #f1f5f9;">Consigne de sécurité stricte :</strong> Ne communiquez jamais ce code. Aucun membre du personnel ou livreur BRAD'CI ne vous demandera votre code de vérification.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Escrow & GPS Delivery Footnote -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 18px;">
                <tr>
                  <td align="center">
                    <span style="font-size: 11px; color: #34d399; font-weight: 600; margin-right: 12px;">
                      🛡️ Paiement Séquestré Garanti
                    </span>
                    <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">
                      📍 Livraison avec Tracé GPS
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #03081e; padding: 20px 30px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                © 2026 BRAD'CI — Plateforme d'Enchères & Déstockage Express.<br>
                Abidjan, Côte d'Ivoire. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envoie le code de sécurité OTP à l'adresse e-mail via l'API Resend
 * Endpoint : POST https://api.resend.com/emails
 */
export async function sendOtpEmail(
  userEmail: string, 
  otpCode: string
): Promise<SendOtpEmailResult> {
  const cleanEmail = userEmail.trim().toLowerCase();
  
  // Clé d'API Resend configurée dans les variables d'environnement
  const resendApiKey = (
    (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_RESEND_API_KEY : '') || 
    (typeof process !== 'undefined' && process.env ? process.env.RESEND_API_KEY : '') || 
    ''
  ) as string;

  const htmlContent = generateBradCiOtpHtml(cleanEmail, otpCode);

  // Si aucune clé API n'est fournie (ex: environnement de prévisualisation sans clé configurée)
  // On passe en mode autonome avec notification claire sans bloquer l'expérience utilisateur
  if (!resendApiKey || resendApiKey.trim() === '') {
    console.info(
      `[BRAD'CI Resend API] Clé VITE_RESEND_API_KEY non renseignée.\n` +
      `-> Mode simulation actif.\n` +
      `-> E-mail destinataire : ${cleanEmail}\n` +
      `-> Code OTP généré : ${otpCode} (Valide 5 minutes)`
    );

    // Petit délai simulant la latence réseau SMTP/Resend
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      messageId: `sim_${Date.now()}`,
      isSimulated: true
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: "BRAD'CI Sécurité <onboarding@resend.dev>",
        to: [cleanEmail],
        subject: `[${otpCode}] Votre Code de Sécurité BRAD'CI (Valide 5 minutes)`,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const errorMsg = errorPayload?.message || `Erreur d'envoi Resend (${response.status})`;
      console.warn(`[BRAD'CI Resend API] Échec de l'envoi vers ${cleanEmail}:`, errorMsg);
      
      return {
        success: false,
        error: errorMsg
      };
    }

    const data = await response.json();
    console.info(`[BRAD'CI Resend API] E-mail envoyé avec succès (ID: ${data.id}) vers ${cleanEmail}`);

    return {
      success: true,
      messageId: data.id,
      isSimulated: false
    };
  } catch (err: any) {
    console.error(`[BRAD'CI Resend API] Exception réseau lors de l'appel à Resend:`, err);
    return {
      success: false,
      error: err?.message || "Erreur de connexion réseau avec le serveur Resend."
    };
  }
}
