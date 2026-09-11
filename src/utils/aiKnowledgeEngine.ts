import { AppLanguage } from '../types';

export interface AIKnowledgeResponse {
  text: string;
  category: 'onboarding' | 'auth' | 'order' | 'auction' | 'pod_payment' | 'delivery' | 'receipts' | 'pricing' | 'kyc' | 'dispute' | 'troubleshooting' | 'support' | 'security_blocked' | 'general';
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

// Patterns for Executive / Direction / CEO / DG / PDG / Administration Group queries
const EXECUTIVE_DIRECTION_PATTERNS = [
  'ceo',
  'pdg',
  'dg',
  'directeur general',
  'president directeur general',
  'direction',
  'groupe d\'administration',
  'groupe administration',
  'acces direction',
  'acces executif',
  'executive access',
  'contact direction',
  'bureau du dg',
  'bureau du ceo',
  'bureau du pdg',
  'directeur'
];

/**
 * Intelligent knowledge retrieval engine strictly scoped to public BRAD'CI platform operations
 * Designed according to BRAD'CI Assistant official directives
 */
export function queryBradCiKnowledge(rawQuery: string, lang: AppLanguage = 'fr'): AIKnowledgeResponse {
  const query = rawQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isEn = lang === 'en';

  // 1. MANDATORY PROTOCOL: Executive / CEO / DG / PDG / Direction access
  const isExecutiveQuery = EXECUTIVE_DIRECTION_PATTERNS.some(pattern => {
    const normPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Check whole word or clear substring
    return query.includes(normPattern);
  });

  if (isExecutiveQuery) {
    return {
      category: 'security_blocked',
      text: isEn
        ? "🔒 **Official Direction & Executive Protocol**\n\nExecutive-level access (CEO / DG / PDG) and group administration are subject to BRAD'CI's strict security protocols. For any institutional inquiry, strategic partnership, or priority escalation, please submit an official correspondence or contact dedicated support via **support@bradci.com**."
        : "🔒 **Protocole Officiel Direction & Accès Exécutif**\n\nLes accès de niveau Direction (CEO / DG / PDG) et l'administration du groupe sont soumis aux protocoles de sécurité restreints de BRAD'CI. Pour toute demande institutionnelle, partenariat stratégique ou réclamation prioritaire, veuillez adresser un courrier officiel ou contacter le support dédié via **support@bradci.com**.",
      suggestedAction: {
        labelFr: "Écrire au Support Officiel",
        labelEn: "Contact Official Support",
        actionType: "connect_agent"
      }
    };
  }

  // 2. STRICT SECURITY FILTER: Prevent access to admin/owner internal secrets
  const isProhibited = ADMIN_OWNER_PROHIBITED_PATTERNS.some(pattern => {
    const normPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return query.includes(normPattern);
  });

  if (isProhibited) {
    return {
      category: 'security_blocked',
      text: isEn
        ? "🔒 **Confidential & Restricted Information**\n\nFor platform security and data privacy reasons, I cannot disclose any information regarding internal administrative controls, back-office access, owner-restricted credentials, or private system data.\n\nI am exclusively designed to guide you through public BRAD'CI features: account registration, bidding on auctions, placing orders, delivery tracking, seller passes, and escrow payments."
        : "🔒 **Information Confidentielle & Sécurisée**\n\nPar mesure de sécurité et de stricte confidentialité, je ne transmets aucune information relative à l'administration interne, aux accès Back-Office, aux identifiants réservés au propriétaire ou aux données privées du système.\n\nJe suis conçu exclusivement pour vous guider sur les services publics de BRAD'CI : inscription, commandes, enchères, livraisons, pass vendeur et paiements sécurisés.",
      suggestedAction: {
        labelFr: "Parler à un Conseiller Humain",
        labelEn: "Speak with a Human Agent",
        actionType: "connect_agent"
      }
    };
  }

  // 3. TECHNICAL TROUBLESHOOTING: OTP CODE NOT RECEIVED (Code OTP non reçu)
  if (
    query.includes('otp') && (query.includes('recu') || query.includes('recois') || query.includes('pas') || query.includes('probleme') || query.includes('erreur') || query.includes('bloque') || query.includes('renvoyer')) ||
    query.includes('code non recu') ||
    query.includes('code de securite') && (query.includes('pas') || query.includes('probleme'))
  ) {
    return {
      category: 'troubleshooting',
      text: isEn
        ? "⚙️ **Procedure: OTP / Security Code Not Received :**\n\n1. **Verify Coordinates**: Ensure your phone number (+225) or email was entered without typos.\n2. **Check Spam / Junk**: If validating by email, please inspect your Spam / Junk folder.\n3. **Wait 60 Seconds**: Carrier networks may take a few seconds during peak hours. Avoid multiple simultaneous clicks.\n4. **Click 'Resend Code'**: Once the 60-second timer expires, tap the 'Resend Code' button to request a fresh OTP.\n5. **Persistent Issue**: If you still do not receive the code, contact our 24/7 support team via WhatsApp or phone."
        : "⚙️ **Procédure : Code OTP / Sécurité non reçu :**\n\n1. **Vérifiez vos Coordonnées** : Assurez-vous que votre numéro de téléphone (+225) ou votre adresse email a été saisi sans faute de frappe.\n2. **Dossier Courriers Indésirables** : En cas de validation par email, vérifiez vos Spams / Courriers indésirables.\n3. **Patientez 60 Secondes** : Les réseaux mobiles peuvent nécessiter quelques instants aux heures de pointe. Évitez les clics répétés.\n4. **Cliquez sur 'Renvoyer le code'** : Dès que le compte à rebours de 60 secondes s'épuise, cliquez sur le bouton de renvoi pour générer un nouveau code OTP.\n5. **Assistance Directe** : Si le blocage persiste, basculez sur l'onglet Conseiller Humain pour une assistance immédiate.",
      suggestedAction: {
        labelFr: "Assistance Conseiller en Direct",
        labelEn: "Live Advisor Assistance",
        actionType: "connect_agent"
      }
    };
  }

  // 4. TECHNICAL TROUBLESHOOTING: GPS / LOCATION ERROR (Erreur GPS / Localisation)
  if (
    query.includes('gps') && (query.includes('erreur') || query.includes('probleme') || query.includes('marche pas') || query.includes('bloque') || query.includes('position')) ||
    query.includes('localisation') && (query.includes('erreur') || query.includes('probleme') || query.includes('impossible') || query.includes('refus') || query.includes('active')) ||
    query.includes('carte') && query.includes('bloqu')
  ) {
    return {
      category: 'troubleshooting',
      text: isEn
        ? "🗺️ **Procedure: Fixing GPS / Location Issues :**\n\n1. **Enable Device GPS**: Go to your smartphone settings and ensure Location/GPS is turned ON.\n2. **Browser Permission**: Tap the padlock icon next to the browser URL and set Location permissions to 'Allow'.\n3. **Refresh the Page**: Reload the application to allow Google Maps to acquire satellite lock.\n4. **Manual Commune Fallback**: If GPS hardware is unavailable, select your delivery commune directly from the dropdown menu (e.g. Cocody, Yopougon, Plateau, Marcory, Koumassi, Port-Bouët, Grand-Bassam).\n5. **Courier Navigation**: Couriers receive exact street instructions to complete delivery accurately."
        : "🗺️ **Procédure : Résolution des Erreurs de Localisation GPS :**\n\n1. **Activez le GPS de votre appareil** : Vérifiez dans les paramètres de votre smartphone que la 'Position / Localisation' est bien activée.\n2. **Autorisation Navigateur** : Cliquez sur l'icône de cadenas ou de réglages à gauche de la barre d'adresse de votre navigateur et cochez **'Autoriser la position'**.\n3. **Actualisez l'application** : Rafraîchissez la page pour permettre à la cartographie Google Maps de capter vos coordonnées.\n4. **Saisie Manuelle de Secours** : En cas d'indisponibilité du signal satellite, sélectionnez simplement votre commune de livraison dans le menu déroulant (Cocody, Yopougon, Plateau, Marcory, Abobo, Koumassi, Treichville, Grand-Bassam, etc.).\n5. **Assistance Livreur** : Le livreur reçoit également votre point de repère écrit pour une remise précise.",
      suggestedAction: {
        labelFr: "Contacter le Support Technique",
        labelEn: "Contact Technical Support",
        actionType: "connect_agent"
      }
    };
  }

  // 5. RECEIPTS & ELECTRONIC INVOICES (Reçus et Transactions)
  if (
    query.includes('recu') || 
    query.includes('facture') || 
    query.includes('justificatif') || 
    query.includes('preuve') || 
    query.includes('ticket') || 
    query.includes('transaction') ||
    query.includes('receipt') ||
    query.includes('invoice')
  ) {
    return {
      category: 'receipts',
      text: isEn
        ? "🧾 **Automatic Electronic Receipts & Transaction Records :**\n\n• **Dual Automatic Receipts**: Upon transaction completion, distinct electronic receipts are generated for both the **Buyer** and the **Seller**.\n• **Receipt Contents**: Unique transaction reference (UUID), item title, payment method (Wave, OM, MTN, Card), item amount, delivery fee, commission, and exact timestamp.\n• **Anti-Fraud QR Code**: Every receipt includes a verifiable QR code to prevent tampering or falsification.\n• **PDF & Print Export**: Download your receipt instantly in PDF format or view it anytime in your Profile under 'My Orders / Receipts'."
        : "🧾 **Reçus Électroniques Automatiques & Historique des Transactions :**\n\n• **Double Reçu Automatique** : Dès la validation de la commande, deux reçus électroniques distincts et certifiés sont générés automatiquement pour **l'Acheteur** et pour **le Vendeur**.\n• **Mentions Officielles** : Référence unique de transaction (UUID), désignation de l'article, canal de règlement (Wave, Orange Money, MTN, Moov, Carte bancaire), montant net en FCFA, frais de livraison, commission et horodatage certifié.\n• **QR Code Anti-Fraude** : Chaque reçu intègre un QR Code d'authentification garantissant son authenticité auprès des autorités et des tiers.\n• **Téléchargement PDF** : Vous pouvez télécharger votre reçu au format PDF ou le consulter à tout moment dans votre profil sous l'onglet 'Mes Commandes / Reçus'.",
      suggestedAction: {
        labelFr: "Accéder à mes Commandes",
        labelEn: "Access my Orders",
        actionType: "open_auth"
      }
    };
  }

  // 6. ESCROW PAYMENT & ZERO RISK POD (Paiement Séquestré / Escrow)
  if (
    query.includes('sequestre') || 
    query.includes('escrow') || 
    query.includes('securite') || 
    query.includes('garantie') || 
    query.includes('arnaque') || 
    query.includes('remboursement') || 
    query.includes('fraude') ||
    query.includes('bloquer') ||
    query.includes('debloquer')
  ) {
    return {
      category: 'pod_payment',
      text: isEn
        ? "🛡️ **Secured Escrow & Delivery Validation :**\n\n• **Funds Protection**: The buyer's money is held in complete security by BRAD'CI Escrow until the parcel is physically handed over by the courier.\n• **Physical Inspection First**: The buyer inspects the package upon courier arrival before releasing funds.\n• **Release via OTP / Signature**: The buyer enters their secret OTP code or confirms by digital signature to authorize fund release.\n• **Atomic Payout**: Funds are instantly distributed to the seller's mobile money account and courier delivery fee with 0 dispute risk."
        : "🛡️ **Paiement Séquestré (Escrow) & Garantie BRAD'CI :**\n\n• **Sécurité Absolue des Fonds** : L'argent de l'acheteur est conservé en toute sécurité sous séquestre par BRAD'CI jusqu'à la remise effective du colis par le livreur.\n• **Examen Physique Préalable** : L'acheteur inspecte d'abord le produit en présence du livreur avant toute validation de déblocage.\n• **Déblocage par Code OTP ou Signature** : L'acheteur valide la réception conforme en transmettant son Code Secret OTP ou par signature électronique.\n• **Paiement Instantané du Vendeur** : Dès la validation du code par le livreur, les fonds sont immédiatement reversés sur le compte du vendeur (Wave / Mobile Money) et la course du livreur est réglée.",
      suggestedAction: {
        labelFr: "Consulter la Charte Sécurité",
        labelEn: "View Security Charter",
        actionType: "connect_agent"
      }
    };
  }

  // 7. LIVE AUCTIONS & TIMED SALES (Enchères en Direct)
  if (
    query.includes('enchere') || 
    query.includes('encherir') || 
    query.includes('mise') || 
    query.includes('compte a rebours') || 
    query.includes('chronometre') || 
    query.includes('auction') || 
    query.includes('bid')
  ) {
    return {
      category: 'auction',
      text: isEn
        ? "⏱️ **Live Timed Auctions & Bidding Rules :**\n\n• **Timed Sales**: Auctions run on strict countdown timers (from 2h to 24h) for rapid clearance.\n• **Outbid Step**: Every new bid must exceed the current highest offer by the minimum increment (+1,000 FCFA).\n• **Real-Time Outbid Alerts**: You receive immediate push and voice chime notifications if another buyer outbids you.\n• **Auction Close**: At timer expiration, the highest bidder wins the lot and the delivery process triggers automatically.\n• **5-Bid Arbitration Rule**: If an auction reaches 5 distinct offers, the seller may choose their preferred buyer immediately or cancel with zero fee."
        : "⏱️ **Fonctionnement des Enchères en Direct Chronométrées :**\n\n• **Ventes Chronométrées** : Les enchères se déroulent avec un compte à rebours précis (de 2h à 24h) pour une liquidation rapide.\n• **Paliers de Surenchère** : Chaque nouvelle offre doit dépasser le montant précédent d'au moins le palier minimum (+1 000 FCFA).\n• **Alertes en Temps Réel** : Vous recevez une notification push et une alerte sonore instantanée dès qu'un autre acheteur surenchérit sur vous.\n• **Clôture de la Vente** : À l'expiration du chronomètre, l'enchérisseur le plus élevé remporte l'article et l'expédition se déclenche automatiquement.\n• **Règle d'Arbitrage des 5 Offres** : Dès que 5 offres d'acheteurs distincts sont atteintes, le vendeur a le droit d'attribuer la vente à l'acheteur de son choix sans attendre la fin du chrono, ou d'annuler sans pénalité si les offres sont insuffisantes.",
      suggestedAction: {
        labelFr: "Voir les Enchères en Direct",
        labelEn: "View Live Auctions",
        actionType: "filter_auctions"
      }
    };
  }

  // 8. 5-BID ARBITRATION SPECIFIC (Règle d'Arbitrage des 5 Offres)
  if (
    query.includes('5 offre') || 
    query.includes('5 enchere') || 
    query.includes('arbitrage') || 
    query.includes('cinq offre') ||
    query.includes('foix off')
  ) {
    return {
      category: 'auction',
      text: isEn
        ? "⚖️ **The 5-Bid Arbitration Rule Explained :**\n\n• **Automatic Trigger**: As soon as an auction reaches **5 offers from distinct buyers**, it automatically transitions into 'Arbitration Mode'.\n• **Seller's Right of Choice**: The seller is not forced to wait for the timer to expire. They can review bidder profiles, ratings, and locations, then select the winning buyer of their choice.\n• **Zero Penalty Cancellation**: If the offers do not meet the seller's expectations, the seller can cancel the auction with zero penalty.\n• **Dispatch & Delivery**: Once awarded, delivery is dispatched immediately with GPS tracking and escrow payment."
        : "⚖️ **Règle d'Arbitrage des 5 Offres (Spécificité BRAD'CI) :**\n\n• **Déclenchement Automatique** : Dès qu'une vente cumule **5 offres d'acheteurs distincts**, elle bascule automatiquement en statut 'Arbitrage 5 Offres'.\n• **Libre Choix du Vendeur** : Le vendeur n'est plus tributaire du compte à rebours. Il peut examiner les profils, notes et offres des 5 acheteurs pour désigner le vainqueur de son choix.\n• **Annulation Sans Pénalité** : Si les montants proposés sont jugés insuffisants par rapport à son prix de réserve, le vendeur peut annuler la vente sans aucun frais ni pénalité.\n• **Expédition Immédiate** : Dès l'attribution validée, la course est assignée à un coursier avec suivi GPS et règlement sous séquestre.",
      suggestedAction: {
        labelFr: "Voir les Ventes en Arbitrage",
        labelEn: "View 5-Bid Auctions",
        actionType: "filter_auctions"
      }
    };
  }

  // 9. REAL-TIME GPS DELIVERY & TRACKING (Livraison GPS & Suivi)
  if (
    query.includes('livraison') || 
    query.includes('livreur') || 
    query.includes('gps') || 
    query.includes('carte') || 
    query.includes('itineraire') || 
    query.includes('coursier') || 
    query.includes('fret') ||
    query.includes('suivi')
  ) {
    return {
      category: 'delivery',
      text: isEn
        ? "🛵 **GPS Delivery & Real-Time Tracking :**\n\n• **Live Map Tracking**: Follow your assigned courier's vehicle on the interactive map powered by Google Maps Platform.\n• **Automated Push Notifications**: Receive instant alerts when the courier picks up the parcel, and when they arrive at your delivery address.\n• **Vetted Couriers**: All drivers hold verified government identity cards, vehicle paperwork, and active KYC accreditation.\n• **Fair Kilometer Pricing**: Rates are calculated based on actual distance between Abidjan communes.\n• **100% Courier Payout**: 100% of the delivery fee is transferred directly to the driver upon delivery completion."
        : "🛵 **Livraison GPS & Suivi des Coursiers en Temps Réel :**\n\n• **Géolocalisation en Direct** : Suivez le déplacement du coursier en temps réel sur la carte interactive propulsée par Google Maps Platform.\n• **Notifications Automatiques** : Alertes push et notifications in-app envoyées automatiquement lors de la prise en charge du colis par le livreur, puis lors de son arrivée à votre adresse.\n• **Livreurs Certifiés** : Chaque coursier est vérifié avec pièce d'identité officielle, carte grise de la moto et validation KYC rigoureuse.\n• **Tarifs Kilométriques Justes** : Calcul automatique selon la distance entre les communes d'Abidjan et villes environnantes.\n• **Rémunération Intégrale** : 100% des frais de livraison sont reversés directement au livreur dès la validation du code secret.",
      suggestedAction: {
        labelFr: "Voir la Bourse de Fret",
        labelEn: "View Delivery Board",
        actionType: "filter_auctions"
      }
    };
  }

  // 10. ORDERS & DIRECT PURCHASES (Commandes & Achats)
  if (
    query.includes('commande') || 
    query.includes('commander') || 
    query.includes('acheter') || 
    query.includes('achat direct') || 
    query.includes('panier') ||
    query.includes('payer')
  ) {
    return {
      category: 'order',
      text: isEn
        ? "🛍️ **How to Buy or Order an Item on BRAD'CI :**\n\n1. **Select Item**: Browse listings or auctions and tap 'Buy Now' or 'Add to Cart'.\n2. **Delivery Address**: Confirm your destination commune (Abidjan or coastal towns).\n3. **Order Dispatched**: A verified courier takes charge with live GPS tracking.\n4. **Inspect on Arrival**: Physically check the goods when the driver arrives.\n5. **Secure Payment & Code**: Pay via Mobile Money (Wave, OM, MTN, Moov) or Card, then provide your secret OTP code to the driver to release the parcel and generate your electronic receipt."
        : "🛍️ **Comment Passer Commande ou Acheter sur BRAD'CI :**\n\n1. **Sélection de l'Article** : Parcourez les annonces ou enchères et cliquez sur 'Acheter Maintenant' ou 'Ajouter au Panier'.\n2. **Adresse de Livraison** : Indiquez votre commune de livraison à Abidjan ou en région côtière.\n3. **Prise en Charge Livreur** : La commande est confiée à un coursier certifié avec suivi GPS en direct.\n4. **Inspection à l'Arrivée** : Examinez physiquement le colis en présence du livreur.\n5. **Paiement & Code Secret** : Réglez via Mobile Money (Wave, Orange Money, MTN, Moov) ou Carte bancaire, puis communiquez votre Code Secret OTP au livreur pour clôturer la transaction et obtenir votre reçu électronique.",
      suggestedAction: {
        labelFr: "Parcourir les Produits",
        labelEn: "Browse Products",
        actionType: "filter_auctions"
      }
    };
  }

  // 11. REGISTRATION & ACCOUNT CREATION (Inscription)
  if (
    query.includes('inscri') || 
    query.includes('creer un compte') || 
    query.includes('creation de compte') || 
    query.includes('register') || 
    query.includes('sign up') || 
    query.includes('nouveau compte')
  ) {
    return {
      category: 'onboarding',
      text: isEn
        ? "📝 **How to Create an Account on BRAD'CI :**\n\n1. Tap **'Sign In / Register'** in the top navigation.\n2. Choose your profile role: **Buyer / Seller** or **Express Courier**.\n3. Provide your verified info: Full name, City / Commune, Phone number (+225), and Email.\n4. **Email Security Code**: Enter the 6-digit code received by email to authenticate.\n5. **KYC Certification**: Upload your official ID card (CNI or Passport) and take a live selfie to activate your account safely."
        : "📝 **Comment Créer un Compte sur BRAD'CI :**\n\n1. Cliquez sur **'Connexion / Inscription'** dans la barre de navigation supérieure.\n2. Choisissez votre rôle : **Acheteur / Vendeur** ou **Livreur Express**.\n3. Renseignez vos informations réelles : Nom, Prénom, Commune de résidence, Téléphone (+225) et Adresse email.\n4. **Code de Sécurité Email** : Saisissez le code à 6 chiffres envoyé sur votre adresse email pour authentifier votre profil.\n5. **Certification KYC** : Téléchargez votre pièce d'identité officielle (CNI ou Passeport) et réalisez un selfie en direct pour sécuriser l'écosystème.",
      suggestedAction: {
        labelFr: "Créer un Compte Maintenant",
        labelEn: "Create Account Now",
        actionType: "open_auth"
      }
    };
  }

  // 12. LOGIN & AUTHENTICATION (Connexion)
  if (
    query.includes('connexion') || 
    query.includes('connecter') || 
    query.includes('login') || 
    query.includes('sign in') || 
    query.includes('mot de passe')
  ) {
    return {
      category: 'auth',
      text: isEn
        ? "🔑 **How to Sign In to BRAD'CI :**\n\n• **Standard Email & Password**: Enter your registered email address and password, then tap 'Sign In'.\n• **1-Click Google Sign-In**: Click 'Continue with Google' for rapid, secure connection.\n• **Security Code / OTP Recovery**: If you forgot your password or need a reset, click 'Forgot password?' to receive an instant verification link."
        : "🔑 **Comment se Connecter sur BRAD'CI :**\n\n• **Connexion Classique** : Saisissez votre adresse email enregistrée et votre mot de passe, puis cliquez sur 'Se Connecter'.\n• **Connexion 1-Clic Google** : Cliquez sur 'Continuer avec Google' pour une authentification rapide et protégée.\n• **Mot de passe oublié** : Cliquez sur 'Mot de passe oublié' pour recevoir immédiatement un lien de réinitialisation sécurisé par email.",
      suggestedAction: {
        labelFr: "Se Connecter",
        labelEn: "Sign In",
        actionType: "open_auth"
      }
    };
  }

  // 13. PRICING & SELLER/COURIER PASSES (Tarifs et Pass)
  if (
    query.includes('pass') || 
    query.includes('tarif') || 
    query.includes('prix') || 
    query.includes('abonnement') || 
    query.includes('combien') || 
    query.includes('commission') || 
    query.includes('boost')
  ) {
    return {
      category: 'pricing',
      text: isEn
        ? "💎 **Official BRAD'CI Pass Plans & Pricing :**\n\n• **Basic Account (Free)**: 3 listings included, 10% sales commission.\n• **Boost Flash (1,000 FCFA / item)**: 48h pinned top placement + Golden badge.\n• **Standard Pass (5,000 FCFA / month)**: Up to 15 active listings, 7.5% reduced commission + personalized storefront.\n• **Pro VIP Pass (10,000 FCFA / month)**: Unlimited listings, lowest 5% commission, VIP badge, top search priority.\n• **Courier Pass (6,000 FCFA / month)**: Unlimited access to delivery freight jobs after 5 free trial deliveries (0% commission on rides)."
        : "💎 **Grille Tarifaire Officielle des Pass BRAD'CI :**\n\n• **Compte Gratuit Basic** : 3 annonces offertes, commission de 10% sur les ventes finalisées.\n• **Option Boost Flash (1 000 FCFA / annonce)** : Épinglage en tête de fil pendant 48h + Badge Doré attractif.\n• **Pass Standard (5 000 FCFA / mois)** : Jusqu'à 15 annonces actives, commission réduite à 7,5% + Vitrine personnalisée.\n• **Pass Pro VIP (10 000 FCFA / mois)** : Annonces illimitées, commission minimale de 5% + Badge VIP officiel + Visibilité maximale.\n• **Pass Livreur VIP (6 000 FCFA / mois)** : Accès illimité à la bourse de fret après 5 courses gratuites d'essai (0% de retenue sur vos gains de livraison).",
      suggestedAction: {
        labelFr: "Voir les Formules de Pass",
        labelEn: "View Pass Plans",
        actionType: "open_pricing"
      }
    };
  }

  // 14. KYC & IDENTITY VERIFICATION (KYC & Documents)
  if (
    query.includes('kyc') || 
    query.includes('cni') || 
    query.includes('passeport') || 
    query.includes('selfie') || 
    query.includes('piece d\'identite') ||
    query.includes('carte nationale')
  ) {
    return {
      category: 'kyc',
      text: isEn
        ? "🛡️ **Mandatory KYC Identity Certification :**\n\n• **Accepted Documents**: National Identity Card (CNI), valid Passport, or Consular Card.\n• **Live Selfie Check**: A quick real-time facial verification to ensure the applicant matches the document photo.\n• **Single Account Rule**: Each identity document number can only be registered on a single BRAD'CI account to prevent duplicate profiles.\n• **Trust Guarantee**: Protects the community against fraud, guaranteeing safe auctions and secure mobile payments."
        : "🛡️ **Certification d'Identité KYC Obligatoire :**\n\n• **Pièces Acceptées** : Carte Nationale d'Identité ivoirienne (CNI), Passeport biométrique valide ou Carte Consulaire.\n• **Contrôle Selfie en Direct** : Prise de vue faciale en temps réel pour attester la parfaite concordance avec la pièce officielle.\n• **Unicité du Compte** : Chaque numéro de pièce d'identité est strictement réservé à un compte unique afin d'éliminer les faux profils.\n• **Garantie de Confiance** : Protège l'ensemble des acheteurs, vendeurs et livreurs en garantissant un environnement certifié sans arnaque.",
      suggestedAction: {
        labelFr: "Vérifier mon Profil KYC",
        labelEn: "Verify my KYC Profile",
        actionType: "open_kyc"
      }
    };
  }

  // 15. DISPUTES & RESOLUTION (Litiges & Réclamations)
  if (
    query.includes('litige') || 
    query.includes('reclamation') || 
    query.includes('plainte') || 
    query.includes('non conforme') || 
    query.includes('casse') ||
    query.includes('probleme colis')
  ) {
    return {
      category: 'dispute',
      text: isEn
        ? "⚖️ **Dispute Management & Buyer Protection :**\n\n1. **Do Not Release the Secret Code**: If the received item is damaged, defective, or not matching the auction description, refuse delivery and do not give the secret OTP to the driver.\n2. **Report Issue Immediately**: Open the order in your dashboard and tap 'Report an Incident / Open Dispute'.\n3. **Escrow Lock**: Funds remain securely frozen under BRAD'CI escrow while our arbitration team inspects evidence (photos, video).\n4. **Fast Resolution**: You will receive a full refund or return arrangement within 24 hours."
        : "⚖️ **Gestion des Litiges & Protection BRAD'CI :**\n\n1. **Ne Transmettez pas le Code Secret** : Si le produit est non conforme, défectueux ou endommagé lors de l'inspection physique, refusez le colis et ne communiquez pas le Code Secret au livreur.\n2. **Signalement Immédiat** : Cliquez sur 'Signaler un Litige' dans les détails de votre commande pour notifier notre service médiation.\n3. **Blocage du Séquestre** : Les fonds restent intégralement gelés sur le compte séquestre BRAD'CI jusqu'à résolution.\n4. **Résolution en 24h** : Notre équipe arbitre le dossier (photos, constat livreur) et procède au remboursement immédiat si la non-conformité est avérée.",
      suggestedAction: {
        labelFr: "Ouvrir un Litige avec le Support",
        labelEn: "Open Dispute with Support",
        actionType: "connect_agent"
      }
    };
  }

  // 16. DEMANDE D'APPEL TÉLÉPHONIQUE 85 MINUTES (RÉSERVÉ EXCLUSIVEMENT AUX PASS ABONNÉS)
  if (
    query.includes('appel') || 
    query.includes('85 min') || 
    query.includes('85 minute') || 
    query.includes('demande d\'appel') || 
    query.includes('demande rappel') || 
    query.includes('rappel') || 
    query.includes('telephonique') ||
    query.includes('appeler') ||
    query.includes('au telephone')
  ) {
    return {
      category: 'support',
      text: isEn
        ? "📞 **VIP Phone Call Request (85-Minute Session - Reserved for Subscribers) :**\n\n• **Subscriber Exclusive Privilege**: The direct phone consultation (up to **85 minutes of dedicated voice assistance** with a senior BRAD'CI advisor) is strictly reserved for members holding an active subscriber pass:\n  - **Pass Vendeur Standard (5,000 FCFA/month)**\n  - **Pass Vendeur Pro Illimité (10,000 FCFA/month)**\n  - **Pass Livreur VIP (6,000 FCFA/month)**\n• **For Non-Subscribers**: You can activate a Pass directly in the 'Abonnements' menu to unlock this exclusive 85-minute phone consultation privilege immediately.\n• **24/7 Digital Support**: You can also continue chatting with me here by text and audio voice-off at any time free of charge!"
        : "📞 **Demande d'Appel Téléphonique VIP (Session 85 Minutes - Réservé aux Abonnés Pass) :**\n\n• **Privilège Exclusif aux Membres Abonnés** : La réservation d'un appel téléphonique personnalisé (jusqu'à **85 minutes d'assistance vocale dédiée** avec un conseiller senior BRAD'CI) est un service prioritaire strictement réservé aux titulaires d'un Pass Abonné :\n  - **Pass Vendeur Standard (5 000 FCFA/mois)** : 15 articles + boutique dédiée\n  - **Pass Vendeur Pro Illimité (10 000 FCFA/mois)** : Publications illimitées & visibilité maximale\n  - **Pass Livreur VIP (6 000 FCFA/mois)** : Courses illimitées à 0% de commission\n• **Pour les Utilisateurs Sans Pass** : Vous pouvez souscrire à un pass dans l'onglet 'Abonnements' pour débloquer instantanément votre droit à l'appel de 85 minutes.\n• **Assistance Écrite & Vocale Continue** : Je reste également à votre entière disposition ici même par message et voix off 24h/24 pour répondre à toutes vos questions !",
      suggestedAction: {
        labelFr: "Activer un Pass Abonné",
        labelEn: "Activate Subscriber Pass",
        actionType: "open_pricing"
      }
    };
  }

  // 17. HUMAN AGENT & PHONE / WHATSAPP SUPPORT
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
        ? "📞 **BRAD'CI Customer Service Team (Abidjan Plateau) :**\n\nI am Fatou, your dedicated customer support advisor. Our team in Plateau, Abidjan is at your service:\n\n• **Live Chat Assistance**: I answer all your questions instantly regarding your orders, bids, deliveries, and passes.\n• **VIP Phone Callback (85 min)**: Exclusively available for active Pass Abonnés via the 'Demande d'Appel' tab.\n• **WhatsApp Direct Support**: Official WhatsApp support line for urgent logistical escalation."
        : "📞 **Service Clientèle BRAD'CI (Plateau, Abidjan) :**\n\nJe suis Fatou, votre conseillère clientèle dédiée. Notre équipe au Plateau à Abidjan est à votre disposition :\n\n• **Assistance Écrite Instantanée** : Je réponds immédiatement à toutes vos questions sur vos achats, ventes, enchères, livraisons et abonnements.\n• **Rappel Téléphonique VIP (85 min)** : Réservé exclusivement aux membres abonnés titulaires d'un Pass dans l'onglet 'Demande d'Appel'.\n• **Assistance WhatsApp Officielle** : Ligne d'assistance WhatsApp pour le suivi urgent des courses.",
      suggestedAction: {
        labelFr: "Demande d'Appel (Pass Abonnés)",
        labelEn: "Phone Call Request (Subscribers)",
        actionType: "connect_agent"
      }
    };
  }

  // 18. DEFAULT FALLBACK
  return {
    category: 'general',
    text: isEn
      ? "💡 **Hello! I am Fatou, your BRAD'CI Customer Advisor.**\n\nI am at your full service to guide you through any aspect of BRAD'CI:\n• **Timed Live Auctions**: 5-bid rule, increments, and seller choice.\n• **Secured Escrow & POD**: Funds protected until delivery, verified via 4-digit secret OTP.\n• **GPS Delivery Tracking**: Live courier monitoring on Google Maps.\n• **Pass & Subscriptions**: Standard Pass (5,000 F), Pro Pass (10,000 F), Driver VIP (6,000 F).\n• **VIP Phone Calls (85 min)**: Exclusively available for subscriber pass holders.\n\nHow can I help you today?"
      : "💡 **Bonjour ! Je suis Fatou, votre conseillère au service client BRAD'CI.**\n\nJe suis à votre entière disposition pour vous accompagner dans toutes vos démarches :\n• **Enchères & Règle des 5 Offres** : Arbitrage du vendeur dès 5 offres concurrentes.\n• **Paiement à la Livraison (POD) & Code Secret** : Règlement Mobile Money à l'arrivée et code à 4 chiffres à remettre après inspection.\n• **Courses Express & Carte GPS** : Suivi des coursiers en temps réel sur Google Maps.\n• **Abonnements Pass Vendeur & Livreur** : Pass Standard (5 000 F), Pro (10 000 F), Livreur VIP (6 000 F).\n• **Demandes d'Appel VIP (85 min)** : Réservées exclusivement aux abonnés Pass.\n\nEn quoi puis-je vous être utile aujourd'hui ?",
    suggestedAction: {
      labelFr: "Demande d'Appel (Pass Abonnés)",
      labelEn: "Phone Call Request (Subscribers)",
      actionType: "connect_agent"
    }
  };
}
