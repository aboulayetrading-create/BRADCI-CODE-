import { AppLanguage } from '../types';

export interface AIKnowledgeResponse {
  text: string;
  category: 'onboarding' | 'auth' | 'order' | 'auction' | 'pod_payment' | 'delivery' | 'pricing' | 'kyc' | 'dispute' | 'support' | 'security_blocked' | 'general';
  suggestedAction?: {
    labelFr: string;
    labelEn: string;
    actionType: 'open_auth' | 'open_pricing' | 'open_kyc' | 'connect_agent' | 'filter_auctions';
  };
}

// Strictly prohibited keywords related to admin backoffice, owner data, internal DB or private credentials
const ADMIN_OWNER_PROHIBITED_PATTERNS = [
  'admin',
  'administrateur',
  'backoffice',
  'back-office',
  'back office',
  'mot de passe admin',
  'admin password',
  'clef secre',
  'secret key',
  'revenus du proprietaire',
  'revenu proprietaire',
  'gain proprietaire',
  'owner profit',
  'owner revenue',
  'proprietaire du site',
  'owner credentials',
  'base de donnee',
  'database',
  'serveur',
  'sql',
  'firebase config',
  'code source',
  'source code',
  'token admin',
  'superadmin',
  'super admin',
  'supprimer compte utilisateur',
  'bloquer compte de force',
  'pirater',
  'hack',
  'donnees privees',
  'private data',
  'logs systeme',
  'system logs',
  'acces root',
  'root access'
];

/**
 * Intelligent knowledge retrieval engine strictly scoped to public BRAD'CI platform operations
 */
export function queryBradCiKnowledge(rawQuery: string, lang: AppLanguage = 'fr'): AIKnowledgeResponse {
  const query = rawQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isEn = lang === 'en';

  // 1. STRICT SECURITY FILTER: Prevent access to admin/owner internal secrets
  const isProhibited = ADMIN_OWNER_PROHIBITED_PATTERNS.some(pattern => {
    const normPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return query.includes(normPattern);
  });

  if (isProhibited) {
    return {
      category: 'security_blocked',
      text: isEn
        ? "🔒 **Confidential & Restricted Information**\n\nFor platform security and data privacy reasons, I cannot disclose any information regarding internal administrative controls, back-office access, owner-restricted credentials, or private system data.\n\nI am exclusively designed to guide you through public BRAD'CI features: account registration, bidding on auctions, placing orders, delivery tracking, seller passes, and Wave Escrow."
        : "🔒 **Information Confidentielle & Sécurisée**\n\nPar mesure de sécurité et de stricte confidentialité, je ne transmets aucune information relative à l'administration interne, aux accès Back-Office, aux identifiants réservés au propriétaire ou aux données privées du système.\n\nJe suis conçu exclusivement pour vous guider sur les services publics de BRAD'CI : inscription, commandes, enchères, livraisons, pass vendeur et séquestre Wave.",
      suggestedAction: {
        labelFr: "Parler à un Conseiller Humain",
        labelEn: "Speak with a Human Agent",
        actionType: "connect_agent"
      }
    };
  }

  // 2. REGISTRATION & ACCOUNT CREATION (Inscription)
  if (
    query.includes('inscri') || 
    query.includes('creer un compte') || 
    query.includes('creation de compte') || 
    query.includes('register') || 
    query.includes('sign up') || 
    query.includes('nouveau compte') ||
    query.includes('compte vendeur') ||
    query.includes('compte acheteur')
  ) {
    return {
      category: 'onboarding',
      text: isEn
        ? "📝 **How to Register on BRAD'CI :**\n\n1. Click on **'Sign In / Register'** at the top right of your screen.\n2. Select your account role: **'Buyer / Seller'** (for marketplace auctions & shops) or **'Express Courier'** (for freight delivery jobs).\n3. Fill in your verified details: First name, Last name, City (Abidjan or coastal regions), Phone (+225) and Email address.\n4. **Email OTP Verification**: Enter the 6-digit security OTP code sent to your email.\n5. **Mandatory KYC Certification**: Upload your official ID (National ID Card or Passport) and take a live selfie for instant anti-fraud verification."
        : "📝 **Comment s'inscrire sur BRAD'CI :**\n\n1. Cliquez sur **'Connexion / Inscription'** en haut à droite de l'écran.\n2. Choisissez votre type de compte : **'Acheteur / Vendeur'** (pour acheter et vendre) ou **'Livreur Express'** (pour effectuer des courses).\n3. Remplissez vos coordonnées réelles : Prénom, Nom, Commune (Abidjan ou villes côtières), Téléphone (+225) et Adresse email.\n4. **Validation OTP Email** : Saisissez le code de sécurité à 6 chiffres transmis par email.\n5. **Certification KYC Obligatoire** : Téléchargez votre pièce d'identité (CNI ou Passeport) et effectuez un selfie en direct anti-fraude.",
      suggestedAction: {
        labelFr: "Ouvrir l'Inscription Sécurisée",
        labelEn: "Open Secure Registration",
        actionType: "open_auth"
      }
    };
  }

  // 3. LOGIN & AUTHENTICATION (Connexion)
  if (
    query.includes('connexion') || 
    query.includes('connecter') || 
    query.includes('login') || 
    query.includes('sign in') || 
    query.includes('mot de passe oublie') ||
    query.includes('acces compte') ||
    query.includes('google')
  ) {
    return {
      category: 'auth',
      text: isEn
        ? "🔑 **How to Sign In to BRAD'CI :**\n\n• **Standard Login**: Enter your registered Email Address and Password, then click 'Sign In'.\n• **1-Click Google Sign-In**: Click 'Continue with Google (Gmail)' for instant access.\n• *Note*: If your identity KYC is not yet validated, a reminder banner will prompt you to complete verification to unlock unlimited bids and withdrawals."
        : "🔑 **Comment se connecter sur BRAD'CI :**\n\n• **Connexion Standard** : Saisissez votre adresse email et votre mot de passe, puis cliquez sur 'Se Connecter'.\n• **Connexion 1-Clic Google** : Cliquez sur 'Continuer avec Google (Gmail)' pour un accès direct et sécurisé.\n• *Note* : Si votre certification KYC n'est pas encore finalisée, vous pourrez la compléter en un clic pour débloquer toutes vos fonctionnalités.",
      suggestedAction: {
        labelFr: "Se Connecter Maintenant",
        labelEn: "Sign In Now",
        actionType: "open_auth"
      }
    };
  }

  // 4. PLACING AN ORDER / PURCHASING (Commande / Achat direct)
  if (
    query.includes('commande') || 
    query.includes('commander') || 
    query.includes('acheter') || 
    query.includes('achat direct') || 
    query.includes('order') || 
    query.includes('buy') || 
    query.includes('panier') ||
    query.includes('payer')
  ) {
    return {
      category: 'order',
      text: isEn
        ? "🛍️ **How to Place an Order or Buy an Item (Direct Pay on Delivery) :**\n\n1. Browse the live feed or use search filters to find your desired item.\n2. Click on the product card to open details and tap **'Buy Now'** or place a bid.\n3. **Zero Upfront Fund Locking**: Your order starts in dispatch with no advance charge.\n4. **Courier Assignment & GPS**: A certified courier delivers the parcel with real-time GPS tracking (Google Maps Platform).\n5. **Direct API Payment & OTP Release**: Inspect the parcel physically upon driver arrival. Tap 'Pay & Validate' to execute direct payment via API (Wave, Orange Money, MTN MoMo, Moov, Card). Then share your 4-digit secret OTP code with the driver to finalize delivery with instant automatic split payout."
        : "🛍️ **Comment passer une commande (Paiement Direct à la Livraison) :**\n\n1. Parcourez le fil d'annonces ou recherchez l'article souhaité.\n2. Cliquez sur l'article puis sur le bouton **'Acheter Maintenant'** ou formulez une offre.\n3. **Aucun Débit Préalable** : Votre commande est transmise en livraison sans aucun blocage de fonds en amont.\n4. **Attribution du Livreur & Suivi GPS** : Un coursier certifié achemine le colis avec suivi GPS en direct (Google Maps Platform).\n5. **Paiement Direct par API & Validation OTP** : Lorsque le livreur arrive et après examen du colis, cliquez sur 'Payer et Valider' pour régler par API (Wave, Orange Money, MTN MoMo, Moov, Carte). Transmettez ensuite le code secret OTP au livreur pour clôturer la commande et répartir instantanément les fonds.",
      suggestedAction: {
        labelFr: "Voir les Annonces Disponibles",
        labelEn: "Explore Available Listings",
        actionType: "filter_auctions"
      }
    };
  }

  // 5. 5-BID ARBITRATION RULE (Règle des 5 Offres / Arbitrage)
  if (
    query.includes('5 offre') || 
    query.includes('5 enchere') || 
    query.includes('5 bid') || 
    query.includes('arbitrage') || 
    query.includes('foix off') || 
    query.includes('cinq offre') ||
    query.includes('choisir acheteur')
  ) {
    return {
      category: 'auction',
      text: isEn
        ? "⚖️ **The 5-Bid Arbitration Rule (Foix Off) :**\n\n• **Automatic Trigger**: As soon as an auction receives **5 distinct buyer offers**, the sale automatically enters 'Arbitration Mode'.\n• **Seller's Choice**: The seller can review all 5 bidders, view their profiles & ratings, and **select their preferred winning buyer**.\n• **Zero Penalty Cancellation**: The seller also has the exclusive right to cancel the auction with 0 fees if reserve requirements are not met.\n• **Delivery Dispatch**: Once awarded, the delivery order is dispatched instantly to certified couriers, with payment occurring on delivery."
        : "⚖️ **La Règle Métier des 5 Offres (Arbitrage Vendeur) :**\n\n• **Déclenchement Automatique** : Dès qu'une vente cumule **5 offres d'acheteurs distincts**, elle passe en statut 'Arbitrage 5 Offres'.\n• **Pouvoir du Vendeur** : Le vendeur n'est pas bloqué par le compte à rebours. Il peut examiner les 5 offres et **sélectionner l'acheteur final de son choix**.\n• **Annulation Sans Frais** : Le vendeur conserve le droit d'annuler la vente sans pénalité si les offres ne correspondent pas à ses attentes.\n• **Expédition & Paiement Direct** : Dès attribution, la course est envoyée aux livreurs certifiés. Le paiement aura lieu directement à la livraison.",
      suggestedAction: {
        labelFr: "Filtrer les Enchères en Arbitrage",
        labelEn: "Filter 5-Bid Auctions",
        actionType: "filter_auctions"
      }
    };
  }

  // 6. AUCTIONS & BIDDING (Enchères & Offres)
  if (
    query.includes('enchere') || 
    query.includes('encherir') || 
    query.includes('mise') || 
    query.includes('compte a rebours') || 
    query.includes('auction') || 
    query.includes('bid')
  ) {
    return {
      category: 'auction',
      text: isEn
        ? "🏷️ **How Express Auctions Work on BRAD'CI :**\n\n• **Real-Time Bidding**: Enter an offer higher than the current top bid (minimum step +1,000 FCFA).\n• **Express Timer**: Auctions last from 2h to 24h for fast clearance.\n• **Instant Outbid Alerts**: You receive instant chime & visual notifications when another buyer outbids you.\n• **5-Bid Rule**: When 5 offers are reached, the seller can award the auction to the buyer of their choice."
        : "🏷️ **Fonctionnement des Enchères Express sur BRAD'CI :**\n\n• **Enchérissement en Direct** : Proposez une offre supérieure au montant actuel (incrément minimum de +1 000 FCFA).\n• **Compte à Rebours Express** : Ventes rapides de 2h à 24h pour des transactions rapides.\n• **Alertes Instantanées** : Vous êtes notifié immédiatement si un autre acheteur surenchérit sur votre offre.\n• **Arbitrage à 5 Offres** : Dès 5 offres reçues, le vendeur peut clôturer et choisir le vainqueur.",
      suggestedAction: {
        labelFr: "Voir les Enchères en Cours",
        labelEn: "View Active Auctions",
        actionType: "filter_auctions"
      }
    };
  }

  // 7. DIRECT PAY ON DELIVERY (POD) & OTP SECURITY (Paiement Direct & OTP)
  if (
    query.includes('sequestre') || 
    query.includes('wave') || 
    query.includes('paiement') || 
    query.includes('otp') || 
    query.includes('arnaque') || 
    query.includes('securite') || 
    query.includes('remboursement') || 
    query.includes('argent') || 
    query.includes('escrow') ||
    query.includes('fraude') ||
    query.includes('pod')
  ) {
    return {
      category: 'pod_payment',
      text: isEn
        ? "🛡️ **Direct Pay on Delivery (POD) & OTP Security :**\n\n1. **Zero Upfront Locking**: No funds are frozen or blocked in advance.\n2. **Courier Arrival**: The driver arrives and triggers the 'ARRIVED' status via GPS, unlocking the 'Pay & Validate' button exclusively on the buyer's interface.\n3. **Direct API Payment**: The buyer selects their provider (Wave, Orange Money, MTN MoMo, Moov Money, or Visa/Mastercard) and completes payment.\n4. **Webhook Confirmation & OTP**: Upon payment success confirmation via webhook, the buyer receives their 4-digit secret OTP code.\n5. **Driver OTP Verification**: The driver enters the OTP code handed by the buyer to complete the order with atomic fund split."
        : "🛡️ **Paiement Direct à la Livraison (POD) & Sécurité OTP :**\n\n1. **Zéro Blocage de Fonds** : Aucun débit ni séquestre préalable n'est imposé.\n2. **Arrivée GPS du Livreur** : Le livreur signale son arrivée sur place, débloquant le bouton 'Payer et Valider' exclusivement sur l'interface de l'acheteur.\n3. **Paiement Direct par API** : L'acheteur choisit son opérateur (Wave, Orange Money, MTN MoMo, Moov Money, ou Carte Visa/Mastercard) et effectue le transfert.\n4. **Confirmation Webhook & Code OTP** : La validation du paiement génère le code secret OTP à 4 chiffres sur l'écran de l'acheteur.\n5. **Clôture par le Livreur** : Le livreur saisit le code OTP remis par l'acheteur pour valider la livraison et répartir instantanément les montants.",
      suggestedAction: {
        labelFr: "Consulter la Charte Sécurité",
        labelEn: "View Security Charter",
        actionType: "connect_agent"
      }
    };
  }

  // 8. DELIVERY & GPS TRACKING (Livraison & Suivi GPS)
  if (
    query.includes('livraison') || 
    query.includes('livreur') || 
    query.includes('gps') || 
    query.includes('google maps') || 
    query.includes('carte') || 
    query.includes('itineraire') || 
    query.includes('coursier') || 
    query.includes('fret') ||
    query.includes('transport')
  ) {
    return {
      category: 'delivery',
      text: isEn
        ? "🛵 **Delivery & Real-Time GPS Tracking :**\n\n• **Certified Couriers**: All drivers are vetted with verified government ID, motorcycle registration, and KYC.\n• **High-Precision Map Navigation**: Live route tracking powered exclusively by **Google Maps Platform** with satellite overlay and topological radar.\n• **Fair Delivery Fees**: Dynamically calculated based on distance between Abidjan communes (e.g. Cocody, Yopougon, Plateau, Marcory, Bingerville, Grand-Bassam).\n• **Courier Payout**: Drivers receive 100% of the delivery fee with zero platform deduction."
        : "🛵 **Livraison & Suivi GPS en Temps Réel :**\n\n• **Livreurs Certifiés** : Tous les coursiers sont vérifiés avec CNI, carte grise moto et certification KYC.\n• **Cartographie Haute Précision** : Suivi de parcours en direct propulsé exclusivement par **Google Maps Platform** avec vue satellite et radar topologique.\n• **Tarification Kilométrique Équitable** : Calculée automatiquement selon la distance entre les communes d'Abidjan et villes côtières.\n• **Paiement Intégral du Livreur** : 100% des frais de livraison sont reversés au livreur dès validation du code OTP.",
      suggestedAction: {
        labelFr: "Voir la Bourse de Fret Livreur",
        labelEn: "View Freight Delivery Radar",
        actionType: "filter_auctions"
      }
    };
  }

  // 9. PRICING PLANS & SELLER PASSES (Tarifs, Pass Vendeur, Pass Livreur)
  if (
    query.includes('pass') || 
    query.includes('tarif') || 
    query.includes('prix') || 
    query.includes('abonnement') || 
    query.includes('combien') || 
    query.includes('commission') || 
    query.includes('boost') || 
    query.includes('pricing') || 
    query.includes('plan')
  ) {
    return {
      category: 'pricing',
      text: isEn
        ? "💎 **Official BRAD'CI Pricing & Pass Plans :**\n\n• **Basic Account (Free)**: 3 listings offered, 10% commission on sales.\n• **Boost Flash (1,000 FCFA / listing)**: 48h pinned top placement on feed + Golden badge.\n• **Standard Pass (5,000 FCFA / month)**: Up to 15 active listings, reduced 7.5% commission + personalized shop storefront.\n• **Pro VIP Pass (10,000 FCFA / month)**: Unlimited listings, lowest 5% commission, VIP badge & top priority placement.\n• **VIP Courier Pass (6,000 FCFA / month)**: Unlimited freight jobs (starts after 5 free trial deliveries, 0% commission)."
        : "💎 **Grille Tarifaire Officielle des Pass BRAD'CI :**\n\n• **Compte Basic (Gratuit)** : 3 produits offerts, 10% de commission sur les ventes.\n• **Boost Flash (1 000 FCFA / annonce)** : Mise en avant en tête de fil pendant 48h + Badge Doré.\n• **Pass Standard (5 000 FCFA / mois)** : Jusqu'à 15 annonces actives, commission réduite à 7,5% + Vitrine Boutique.\n• **Pass Pro VIP (10 000 FCFA / mois)** : Annonces illimitées, commission minimale à 5% + Badge VIP + Visibilité maximale.\n• **Pass Livreur VIP (6 000 FCFA / mois)** : Accès illimité à la bourse de fret après 5 courses gratuites d'essai (0% commission sur vos courses).",
      suggestedAction: {
        labelFr: "Découvrir les Formules & S'Abonner",
        labelEn: "Explore Plans & Subscribe",
        actionType: "open_pricing"
      }
    };
  }

  // 10. KYC & IDENTITY VERIFICATION (KYC & Pièces)
  if (
    query.includes('kyc') || 
    query.includes('cni') || 
    query.includes('passeport') || 
    query.includes('selfie') || 
    query.includes('identite') || 
    query.includes('verification')
  ) {
    return {
      category: 'kyc',
      text: isEn
        ? "🛡️ **Mandatory KYC Identity Certification :**\n\n• **Required Documents**: National ID Card (CNI), Passport, or Consular ID.\n• **Live Selfie**: A live facial capture to ensure the applicant matches the photo on the official ID.\n• **Duplicate Prevention Engine**: Each national ID number can strictly only be linked to a single account on BRAD'CI.\n• **Why it is mandatory**: Prevents scammers, protects buyers and ensures only legitimate sellers and couriers operate on the platform."
        : "🛡️ **Certification KYC & Sécurité d'Identité :**\n\n• **Documents Acceptés** : Carte Nationale d'Identité (CNI), Passeport ou Carte Consulaire.\n• **Selfie en Direct** : Prise de vue faciale en temps réel pour certifier la correspondance avec la pièce d'identité.\n• **Système Anti-Doublons** : Un numéro de CNI ou Passeport ne peut être associé qu'à un seul compte unique sur BRAD'CI.\n• **Pourquoi c'est obligatoire** : Garantir 100% de confiance, éliminer les faux profils et sécuriser les paiements Wave.",
      suggestedAction: {
        labelFr: "Compléter ma Vérification KYC",
        labelEn: "Complete my KYC Verification",
        actionType: "open_kyc"
      }
    };
  }

  // 11. HUMAN AGENT & CONTACT (Contact Agent / Support)
  if (
    query.includes('agent') || 
    query.includes('humain') || 
    query.includes('conseiller') || 
    query.includes('service client') || 
    query.includes('telephone') || 
    query.includes('whatsapp') || 
    query.includes('parler') || 
    query.includes('contact') ||
    query.includes('support')
  ) {
    return {
      category: 'support',
      text: isEn
        ? "📞 **Connect with a Live BRAD'CI Support Agent :**\n\nOur customer advisors in Abidjan are available 24/7 to assist you:\n\n• **WhatsApp Direct Support**: Immediate chat assistance on WhatsApp.\n• **Hotline Call**: Direct phone call with a customer representative.\n• **Free Callback Request**: Leave your phone number to receive a free call within 5 minutes."
        : "📞 **Contacter un Conseiller Support BRAD'CI :**\n\nNos conseillers clientèle basés à Abidjan sont à votre disposition 24h/24 et 7j/7 :\n\n• **Assistance WhatsApp Directe** : Échangez instantanément avec un agent sur WhatsApp.\n• **Hotline Téléphonique** : Appel direct avec notre équipe support.\n• **Demande de Rappel Gratuit** : Indiquez votre numéro pour être rappelé en moins de 5 minutes.",
      suggestedAction: {
        labelFr: "Mettre en Ligne avec un Agent",
        labelEn: "Connect with Live Agent",
        actionType: "connect_agent"
      }
    };
  }

  // 12. DEFAULT FALLBACK
  return {
    category: 'general',
    text: isEn
      ? "💡 **Welcome to BRAD'CI Assistance !**\n\nI can help you with all public platform services:\n• **Registration & Login**: Steps, email OTP verification, KYC identity check.\n• **Orders & Auctions**: How to bid, buy now, and the 5-bid seller arbitration rule.\n• **Direct Pay on Delivery (POD)**: API payment upon courier arrival and OTP verification.\n• **Couriers & Delivery**: GPS tracking via Google Maps and Yango Maps.\n• **Pricing Plans**: Seller Passes (5,000 F / 10,000 F) and Courier Pass (6,000 F).\n\nFeel free to type your question, use the microphone 🎙️, or connect with a human agent below."
      : "💡 **Bienvenue sur l'Assistance BRAD'CI !**\n\nJe suis à votre service pour vous expliquer tous les aspects du site :\n• **Inscription & Connexion** : Validation par OTP email et certification KYC.\n• **Commandes & Enchères** : Offres express, achat direct et règle des 5 offres.\n• **Paiement Direct à la Livraison (POD)** : Règlement par API à l'arrivée du livreur et validation OTP.\n• **Livraison & GPS** : Suivi des coursiers avec Google Maps et Yango Maps.\n• **Pass & Tarifs** : Pass Vendeur (5 000 F / 10 000 F) et Pass Livreur (6 000 F).\n\nPosez votre question, utilisez le micro 🎙️ pour parler, ou demandez à échanger avec un agent humain ci-dessous.",
    suggestedAction: {
      labelFr: "Parler à un Agent Humain",
      labelEn: "Talk to Human Agent",
      actionType: "connect_agent"
    }
  };
}
