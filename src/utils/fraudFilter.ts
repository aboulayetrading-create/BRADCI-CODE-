// Anti-Fraud, Anti-Direct Contact, and Security Regulation Engine for BRAD'CI

export interface FraudCheckResult {
  hasFraud: boolean;
  detectedPatterns: string[];
  message?: string;
  field?: string;
}

/**
 * Scans text content (title, description, pickupAddress, etc.) for direct phone numbers,
 * WhatsApp mentions, call mentions, external social links designed to bypass BRAD'CI escrow.
 */
export function detectFraudulentContact(text: string, fieldName = 'description'): FraudCheckResult {
  if (!text) return { hasFraud: false, detectedPatterns: [] };

  const detectedPatterns: string[] = [];
  const normalized = text.toLowerCase();

  // 1. Phone number regexes (Ivory Coast & international formats: +225, 07, 05, 01, 27, 25, 21, separated by spaces/dots/dashes/slashes)
  const phonePatterns = [
    /(?:\+225|00225)[\s.-]*(?:0[157]|2[157])[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}/gi,
    /\b(?:0[157]|2[157])[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}\b/gi,
    /\b0[157]\d{8}\b/gi, // 10-digit continuous
    /\b2[157]\d{8}\b/gi,
    /\b\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}\b/gi, // 8-digit older format
    /(?:tel|tél|cel|phone|num|contact|call|appelle?z?)[\s:]*([0-9\s.-]{8,14})/gi
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const digitsOnly = m.replace(/\D/g, '');
        // Avoid pure years (e.g. 2026) or regular prices unless it looks like a phone series
        if (digitsOnly.length >= 8 && digitsOnly.length <= 14) {
          detectedPatterns.push(m.trim());
        }
      }
    }
  }

  // 2. WhatsApp / Direct Call solicitation keywords
  const directContactKeywords = [
    'whatsapp',
    'whatsap',
    'watsap',
    'watssap',
    'wa.me',
    'écrivez-moi au',
    'ecrivez moi au',
    'contactez moi au',
    'contactez-moi au',
    'contact direct',
    'appelez au',
    'appeler au',
    'appel direct',
    'mon numéro',
    'mon numero',
    'mon num',
    'inbox direct',
    'payer hors site',
    'remise en main propre sans passer',
    'payer par cash direct',
    'joignable au',
    'dm direct',
    'virement direct',
    'hors plateforme',
    'sans commission',
    'payer main à main'
  ];

  for (const kw of directContactKeywords) {
    if (normalized.includes(kw)) {
      detectedPatterns.push(kw);
    }
  }

  const uniquePatterns = Array.from(new Set(detectedPatterns));
  if (uniquePatterns.length > 0) {
    return {
      hasFraud: true,
      detectedPatterns: uniquePatterns,
      field: fieldName,
      message: `🚨 Détection Anti-Fraude : Votre publication contient des coordonnées directes interdites (${uniquePatterns.join(', ')}). Afin de garantir la protection des paiements séquestres Wave/MoMo et la livraison sécurisée, les numéros et mentions de contact direct sont formellement prohibés.`
    };
  }

  return { hasFraud: false, detectedPatterns: [] };
}

/**
 * Checks image URLs or filenames for simulated phone number text or watermarks
 */
export function detectImageFraud(images: string[]): FraudCheckResult {
  if (!images || images.length === 0) return { hasFraud: false, detectedPatterns: [] };

  const detected: string[] = [];
  for (const img of images) {
    // Check if user uploaded a file named with phone numbers or WhatsApp keywords
    const lower = img.toLowerCase();
    if (lower.includes('whatsapp') || lower.includes('07') || lower.includes('05') || lower.includes('01') || lower.includes('contact') || lower.includes('+225')) {
      // If it contains suspicious digit sequences in filename or data URL
      const digitMatch = img.match(/(?:0[157]|2[157])\d{8}/);
      if (digitMatch) {
        detected.push(`Numéro sur image: ${digitMatch[0]}`);
      }
    }
  }

  if (detected.length > 0) {
    return {
      hasFraud: true,
      detectedPatterns: detected,
      field: 'images',
      message: `🚨 Rejet Visuel Anti-Fraude : Un numéro ou filigrane de contact a été repéré sur l'un de vos visuels. Veuillez importer une photo nette du produit sans affichage de coordonnées téléphoniques.`
    };
  }

  return { hasFraud: false, detectedPatterns: [] };
}

/**
 * Official Terms & Rules text for BRAD'CI (Acheteurs, Vendeurs & Boutiques, Livreurs)
 */
export const BRAD_CI_TERMS = {
  title: "Conditions Générales d'Utilisation & Charte de Sécurité BRAD'CI",
  lastUpdated: "24 Août 2026",
  summary: "En utilisant BRAD'CI, chaque membre s'engage à respecter le système de Séquestre Garanti, la livraison vérifiée par Code Secret et l'interdiction stricte de transaction en dehors de la plateforme.",
  rules: [
    {
      id: "escrow",
      title: "1. Paiement Séquestre Garanti (Wave, MoMo, Orange)",
      desc: "Tous les paiements sont bloqués en compte séquestre sécurisé jusqu'à ce que l'acheteur inspecte le colis et communique son Code Secret de validation au livreur. Aucun vendeur n'est payé d'avance sans validation physique du produit."
    },
    {
      id: "no_direct_contact",
      title: "2. Masquage et Interdiction de Contact Direct Pré-Achat",
      desc: "Il est strictement interdit d'afficher son numéro de téléphone, lien WhatsApp ou coordonnée sur les fiches produits, boutiques ou enchères publiques. Les coordonnées et le GPS sont UNIQUEMENT dévoilés après validation d'un achat pour coordonner la livraison."
    },
    {
      id: "fraud_strikes",
      title: "3. Système Anti-Fraude & Règle des 3 Avertissements",
      desc: "Toute tentative d'inscription de numéro de téléphone dans les descriptions, titres ou affiches visuelles entraîne le rejet immédiat de l'annonce. Au bout de 3 récidives, la boutique ou le compte enchère est immédiatement suspendu et requiert un déblocage via le support officiel."
    },
    {
      id: "stock_management",
      title: "4. Gestion Obligatoire des Stocks Boutique & Expiration Enchères",
      desc: "Les boutiques doivent obligatoirement renseigner leur stock disponible. En cas de rupture de stock, l'annonce affiche 'Stock épuisé - Nouveau stock disponible bientôt'. Si aucun réapprovisionnement n'est effectué sous 14 jours (2 semaines), le produit est automatiquement supprimé. Les enchères vendues restent affichées avec chrono 1h avant archivage."
    },
    {
      id: "secret_delivery",
      title: "5. Protocole de Livraison & Inspection Obligatoire",
      desc: "Le livreur doit présenter le code de ramassage au vendeur. L'acheteur dispose de 10 minutes pour tester et inspecter l'article en présence du livreur avant de communiquer son Code Secret de validation ou son code de retour."
    },
    {
      id: "intermediary_and_returns",
      title: "6. Rôle d'Outil de Mise en Relation & Politique de Retour",
      desc: "À l'instar des plateformes de mise en relation indépendantes, BRAD'CI agit uniquement en tant qu'outil technologique connectant acheteurs, vendeurs, expéditeurs et coursiers. La carte GPS temps réel est un service strictement dédié au suivi du colis par son propriétaire (acheteur ou expéditeur) et le coursier. En cas de non-conformité lors de l'inspection physique, l'acheteur refuse le colis sans communiquer son code secret OTP : le livreur effectue le retour immédiat et les fonds sous séquestre sont intégralement recrédités."
    }
  ]
};

/**
 * Generates an email confirmation notification simulating dispatch to the user
 */
export function generateTermsConfirmationEmail(userName: string, email: string, role: string) {
  return {
    recipientEmail: email,
    recipientName: userName,
    subject: `✅ Bienvenue sur BRAD'CI - Charte de Confiance & Conditions de Sécurité (${role.toUpperCase()})`,
    body: `Bonjour ${userName},\n\nNous vous confirmons l'enregistrement de votre profil (${role}) sur la plateforme BRAD'CI.\n\nRAPPEL DES RÈGLES DE SÉCURITÉ ESSENTIELLES :\n- 🛡️ Transactions 100% protégées par Séquestre Mobile Money (Wave, Orange, MTN, MoMo).\n- 🚫 Interdiction stricte d'échanger des numéros de téléphone ou coordonnées WhatsApp en public afin d'éviter toute arnaque.\n- 📦 Remise du colis sous Code Secret après inspection physique.\n\nMerci de votre confiance et excellentes affaires sur BRAD'CI !`
  };
}
