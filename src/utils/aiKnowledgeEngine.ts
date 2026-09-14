import { AppLanguage } from '../types';

export interface AIKnowledgeResponse {
  text: string;
  category: 'onboarding' | 'auth' | 'order' | 'auction' | 'pod_payment' | 'delivery' | 'receipts' | 'pricing' | 'kyc' | 'dispute' | 'troubleshooting' | 'support' | 'security_blocked' | 'general';
  suggestedAction?: {
    labelFr: string;
    labelEn: string;
    actionType: 'open_auth' | 'open_pricing' | 'open_kyc' | 'connect_agent' | 'filter_auctions';
  };
  detectedIssue?: {
    problemType: 'blocked_sale' | 'typing_error' | 'kyc_pending' | 'escrow_payment' | 'delivery_issue' | 'account_issue' | 'other';
    problemCategoryLabel: string;
    reassuranceFr: string;
    reassuranceEn: string;
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
  'cle secret',
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

// Patterns for Executive / Direction / CEO queries
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

// Patterns for physical office, phone number, headquarters queries
const ADDRESS_PHONE_PATTERNS = [
  'adresse',
  'adresse physique',
  'ou se trouve',
  'ou sont vos locaux',
  'locaux',
  'siege social',
  'siege',
  'bureau',
  'bureaux',
  'votre numero',
  'numero de telephone',
  'telephone',
  'appeler',
  'allo',
  'call center',
  'whatsapp',
  'vous etes situe',
  'ou vous trouver'
];

/**
 * Knowledge retrieval engine strictly scoped to public client operations
 * Respects strict rules of confidentiality: No physical addresses, no phone numbers, no internal secrets.
 */
export function queryBradCiKnowledge(rawQuery: string, lang: AppLanguage = 'fr', advisorName: string = 'Sarah'): AIKnowledgeResponse {
  const query = rawQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isEn = lang === 'en';

  // 1. MANDATORY PROTOCOL: Executive / CEO / DG / PDG / Direction access
  const isExecutiveQuery = EXECUTIVE_DIRECTION_PATTERNS.some(pattern => {
    const normPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return query.includes(normPattern);
  });

  if (isExecutiveQuery) {
    return {
      category: 'security_blocked',
      text: isEn
        ? "🔒 **Official Direction & Executive Protocol**\n\nExecutive-level correspondence and governance procedures are handled according to strict organizational protocols. For any formal or strategic inquiry, please submit your request through our online support desk, and it will be routed to the appropriate department."
        : "🔒 **Protocole Officiel & Direction Générale**\n\nLes correspondances et procédures relatives à la direction générale sont encadrées par des protocoles stricts de confidentialité. Pour toute demande institutionnelle ou réclamation formelle, nous vous invitons à transmettre votre dossier ici même afin qu'il soit transmis au service compétent.",
      suggestedAction: {
        labelFr: "Poursuivre par Écrit",
        labelEn: "Continue in Chat",
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
        ? "🔒 **Confidential & Restricted Information**\n\nFor platform security and data privacy reasons, information regarding internal administration, system controls, and private technical data cannot be disclosed. As your customer service advisor, I am at your disposal to assist you with accounts, orders, deliveries, and subscriptions."
        : "🔒 **Information Confidentielle & Sécurisée**\n\nPar mesure de stricte confidentialité et de sécurité informatique, les accès administratifs, les paramètres internes et les données techniques privées ne sont jamais communiqués. En tant que conseillère clientèle, je reste à votre entière disposition pour vous guider sur vos commandes, vos ventes, vos livraisons et vos abonnements.",
      suggestedAction: {
        labelFr: "Poursuivre mon Assistance",
        labelEn: "Continue Assistance",
        actionType: "connect_agent"
      }
    };
  }

  // 3. STRICT RULE: Physical Address, Headquarters & Phone Numbers
  const isAddressOrPhone = ADDRESS_PHONE_PATTERNS.some(pattern => {
    const normPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return query.includes(normPattern);
  });

  if (isAddressOrPhone) {
    return {
      category: 'support',
      text: isEn
        ? `Bonjour ! Afin de garantir une traçabilité optimale, la sécurité de vos transactions et la confidentialité de chaque dossier, l'ensemble de notre service client et de nos opérations s'effectue exclusivement en ligne via cette messagerie sécurisée.\n\nNous ne communiquons aucun numéro de téléphone direct ni adresse physique. Je suis ${advisorName}, votre conseillère dédiée, et je reste à votre écoute ici pour traiter toutes vos demandes avec la plus grande attention.`
        : `Bonjour ! Afin de garantir une traçabilité rigoureuse, la sécurité de vos opérations et la protection de vos données, l'ensemble de notre service client opère exclusivement en ligne via cette messagerie sécurisée.\n\nPar mesure de sécurité et de conformité, nous ne communiquons aucun numéro de téléphone ni adresse physique. Je suis ${advisorName}, votre conseillère dédiée, et je reste à votre entière disposition ici même pour traiter votre demande en toute sérénité.`,
      suggestedAction: {
        labelFr: "Poser ma Question",
        labelEn: "Ask my Question",
        actionType: "connect_agent"
      }
    };
  }

  // 3.B MANDATORY SUPPORT ESCALATION: BLOCKED SALES / TYPING ERRORS / KYC PENDING (User requested instant ticket + reassurance + admin call escalation)
  const isBlockedSale = (query.includes('bloqu') || query.includes('bloque') || query.includes('blocage') || query.includes('ferme') || query.includes('impossible de vendre') || query.includes('enchere bloqu')) && (query.includes('vent') || query.includes('annonc') || query.includes('encher') || query.includes('produit') || query.includes('prix') || query.includes('offre'));
  const isTypingError = query.includes('erreur de frappe') || query.includes('erreur frappe') || query.includes('trompe de numero') || query.includes('trompe de prix') || query.includes('mauvais montant') || query.includes('mauvais numero') || query.includes('faute de frappe') || query.includes('corriger mon annonce') || query.includes('rectifier montant');
  const isKycPendingIssue = (query.includes('kyc') || query.includes('identite') || query.includes('piece') || query.includes('cni') || query.includes('passeport')) && (query.includes('attente') || query.includes('bloqu') || query.includes('refus') || query.includes('delai') || query.includes('pas valide') || query.includes('rejete') || query.includes('retard'));

  if (isBlockedSale || isTypingError || isKycPendingIssue) {
    let probType: 'blocked_sale' | 'typing_error' | 'kyc_pending' = 'blocked_sale';
    let probLabel = 'Blocage de vente / enchère';
    if (isTypingError) {
      probType = 'typing_error';
      probLabel = 'Erreur de frappe / modification requise';
    } else if (isKycPendingIssue) {
      probType = 'kyc_pending';
      probLabel = 'Certification KYC en attente / bloquée';
    }

    const reassuranceTextFr = `Bonjour, je comprends parfaitement votre situation et je tiens à vous rassurer : **votre demande vient d'être transmise immédiatement et directement à notre page d'administration Back-Office** pour que notre équipe technique et de direction puisse résoudre votre problème en priorité absolue.\n\n🛡️ **Ce qui va se passer maintenant :**\n1. **Prise en charge directe** : Votre dossier (${probLabel}) est désormais ouvert sous suivi prioritaire.\n2. **Contact direct** : Nos administrateurs vont vous recontacter directement **soit par email, soit par appel téléphonique** pour confirmer la régularisation.\n3. **Appel d'assistance** : Dès que l'administration valide la résolution de votre requête, je pourrai déclencher un appel vocal d'assistance direct avec vous au sein de l'application ou sur votre ligne.\n\nSoyez serein(e), votre dossier est entre les mains de notre administration !`;
    const reassuranceTextEn = `Hello, I understand your situation completely and want to reassure you: **your request has just been transmitted immediately and directly to our Back-Office Administration team** so our team can resolve this issue with top priority.\n\n🛡️ **Next steps:**\n1. **Direct Ticket Created**: Your dossier (${probLabel}) is officially registered under priority review.\n2. **Direct Contact**: Our administrators will reach out to you directly **either by email or via phone call** to confirm resolution.\n3. **Voice Assistance Call**: Once the administration confirms the fix, I will initiate a direct voice support call with you upon approval.\n\nRest assured, your issue is actively being addressed!`;

    return {
      category: 'troubleshooting',
      text: isEn ? reassuranceTextEn : reassuranceTextFr,
      suggestedAction: {
        labelFr: "Voir l'État de ma Requête",
        labelEn: "View Ticket Status",
        actionType: "connect_agent"
      },
      detectedIssue: {
        problemType: probType,
        problemCategoryLabel: probLabel,
        reassuranceFr: reassuranceTextFr,
        reassuranceEn: reassuranceTextEn
      }
    };
  }

  // 4. PRIORITY EMERGENCY PROTOCOLS: DRIVER SAFETY, AGGRESSION, ACCIDENTS, THEFT, BIZARRE SITUATIONS
  // A. LIVREUR AGRESSÉ / MENACE / DANGER PHYSIQUE
  if (
    query.includes('agress') ||
    query.includes('attaqu') ||
    query.includes('menac') ||
    query.includes('violence') ||
    query.includes('danger') ||
    query.includes('bandit') ||
    query.includes('frapp') ||
    query.includes('arme') ||
    query.includes('couteau')
  ) {
    return {
      category: 'support',
      text: isEn
        ? "🚨 **CRITICAL EMERGENCY PROTOCOL: COURIER ASSAULT / THREAT**\n\n1. **SAFETY FIRST**: Move away immediately to a busy, well-lit public area. Do not resist violently.\n2. **CALL EMERGENCY POLICE**: Dial **170 / 111 / 100** immediately.\n3. **DELIVERY FROZEN**: Your delivery is instantly suspended with **0 penalty** on your rating and zero commission loss.\n4. **LIVE ASSISTANCE**: Our central support desk is on high alert. Let us know your exact location here so we can support you."
        : "🚨 **URGENCE ABSOLUE : PROTOCOLE AGRESSION & SÉCURITÉ LIVREUR**\n\n1. **METS-TOI IMMÉDIATEMENT EN SÉCURITÉ** : Éloigne-toi du danger, réfugie-toi dans un lieu public éclairé et fréquenté (station-service, pharmacie, commerce). Ne résiste pas physiquement.\n2. **ALERTE LA POLICE SECOURS** : Compose immédiatement le **170** (ou 111 / 100).\n3. **AUCUNE PÉNALITÉ SUR TA COURSE** : La livraison est immédiatement gelée par notre support. Tu ne subis aucune sanction, aucune baisse de note ni retenue financière.\n4. **ASSISTANCE CENTRALE ACTIVE** : Indique-moi ta position ici dès que tu es en sécurité. Notre cellule d'assistance te couvre intégralement.",
      suggestedAction: {
        labelFr: "Je suis en Sécurité",
        labelEn: "I am Safe Now",
        actionType: "connect_agent"
      }
    };
  }

  // B. ACCIDENT / LIVREUR BLESSÉ / URGENCE MÉDICALE
  if (
    query.includes('accident') ||
    query.includes('blesse') ||
    query.includes('chute') ||
    query.includes('collision') ||
    query.includes('hopital') ||
    query.includes('samu') ||
    query.includes('pompier') ||
    query.includes('sang') ||
    query.includes('fractur')
  ) {
    return {
      category: 'support',
      text: isEn
        ? "🚑 **MEDICAL EMERGENCY: COURIER ACCIDENT / INJURY**\n\n1. **CALL MEDICAL SERVICES**: Dial **180** (Firefighters/Rescue) or **185** (Emergency Medical / SAMU) immediately.\n2. **STOP TRANSPORTATION**: Do not attempt to continue the ride. Your physical well-being is the absolute priority.\n3. **RELAY COURIER**: Our logistics dispatch is sending a nearby partner courier to retrieve and secure the package.\n4. **INSURANCE & CARE**: Platform delivery insurance covers validated trips. We stay by your side."
        : "🚑 **URGENCE MÉDICALE : ACCIDENT & LIVREUR BLESSÉ**\n\n1. **ALERTE LES SECOURS MÉDICAUX** : Compose immédiatement le **180** (Sapeurs-Pompiers) ou le **185** (SAMU).\n2. **CESSE LA COURSE IMMÉDIATEMENT** : Ne force pas et ne cherche pas à livrer le colis. Ta santé et ton intégrité physique passent avant tout !\n3. **COURS DE RELAIS SÉCURISÉ** : Notre régulation centrale mobilise un coursier partenaire à proximité pour récupérer le colis sans que tu sois inquiété.\n4. **PRISE EN CHARGE ASSURANCE** : Toute course enregistrée est couverte par la garantie d'assistance. Reste calme, nous sommes avec toi.",
      suggestedAction: {
        labelFr: "Secours Contactés",
        labelEn: "Help Called",
        actionType: "connect_agent"
      }
    };
  }

  // C. VOL DE COLIS / VOL DE MOTO / BRAQUAGE
  if (
    query.includes('voler') ||
    query.includes('vole') ||
    query.includes('braqu') ||
    query.includes('arrach') ||
    query.includes('depouill') ||
    query.includes('vol de moto') ||
    query.includes('vol de colis') ||
    query.includes('perdu mon colis')
  ) {
    return {
      category: 'dispute',
      text: isEn
        ? "🛑 **EMERGENCY: THEFT / ROBBERY OF PARCEL OR VEHICLE**\n\n1. **FILE OFFICIAL POLICE REPORT**: Head immediately to the nearest police station or gendarmerie to file an official theft report and obtain a receipt.\n2. **ESCROW LOCKDOWN**: Inform us with your order reference so we instantly lock the funds under escrow protection. Neither you nor the buyer will be defrauded.\n3. **PLATFORM INSURANCE**: Our freight protection guarantee activates upon presentation of the police report.\n4. **ACCOUNT PROTECTION**: We temporarily secure your courier credentials to prevent any unauthorized usage."
        : "🛑 **URGENCE SÉCURITÉ : VOL DE COLIS, DE MOTO OU BRAQUAGE**\n\n1. **DÉPÔT DE PLAINTE IMMÉDIAT** : Rends-toi sans attendre au commissariat de police ou à la gendarmerie la plus proche pour déposer plainte et exiger un récépissé officiel de déclaration de vol.\n2. **GEL DES FONDS SOUS SÉQUESTRE** : Communique-nous ici la référence de ta course. Nous verrouillons immédiatement la commande sous séquestre bancaire pour éviter toute spoliation.\n3. **ACTIVATION DE L'ASSURANCE FRET** : La garantie d'indemnisation de la plateforme s'enclenche sur présentation du procès-verbal de dépôt de plainte.\n4. **SÉCURISATION DU COMPTE** : Ton profil est protégé contre toute usurpation. Reste serein, nous gérons la relation avec l'acheteur et le vendeur.",
      suggestedAction: {
        labelFr: "Transmettre Référence",
        labelEn: "Send Reference",
        actionType: "connect_agent"
      }
    };
  }

  // D. SITUATION BIZARRE / COLIS SUSPECT / TENTATIVE DE FRAUDE / CLIENT SUSPECT OU MENAÇANT
  if (
    query.includes('bizarre') ||
    query.includes('suspect') ||
    query.includes('louche') ||
    query.includes('drogue') ||
    query.includes('illicite') ||
    query.includes('refuse de donner le code') ||
    query.includes('veut pas donner le code') ||
    query.includes('sans code') ||
    query.includes('piege') ||
    query.includes('agressif')
  ) {
    return {
      category: 'dispute',
      text: isEn
        ? "⚠️ **SAFETY WARNING: SUSPICIOUS PARCEL / DANGEROUS SITUATION**\n\n1. **SUSPICIOUS PARCEL**: If a package contains forbidden items (drugs, weapons, leaking chemicals, unusual odor), **DO NOT TRANSPORT IT**. Refuse pickup and notify support.\n2. **REFUSAL OF 4-DIGIT CODE**: **NEVER HAND OVER THE PACKAGE WITHOUT VALIDATING THE SECRET CODE**. If the buyer refuses or tries to force you, keep the parcel, leave the area, and cancel with 'Refusal of Secret Code'.\n3. **SUSPICIOUS OR ISOLATED LOCATION**: Never enter dark alleys or private enclosed spaces. Require the customer to meet in an open, public area.\n4. **SUPPORT PROTECTION**: Report the customer ID or ride immediately here so our security team blacklists fraudulent profiles."
        : "⚠️ **SÉCURITÉ & VIGILANCE : SITUATION BIZARRE OU COLIS SUSPECT**\n\n1. **COLIS SUSPECT OU ILLICITE** : Si un paquet présente un contenu anormal (substances interdites, liquide suspect, odeur anormale, armes) : **INTERDICTION FORMELLE DE TRANSPORTER**. Refuse la course immédiatement et alerte le support.\n2. **REFUS DU CODE SECRET À 4 CHIFFRES** : **NE DONNE JAMAIS LE COLIS SANS AVOIR SAISI ET VALIDÉ LE CODE SECRET**. Si le client tente de faire pression, conserve le colis, éloigne-toi calmement et annule avec le motif 'Refus du code de validation'.\n3. **LIEU DE RENDEZ-VOUS ISOLÉ OU OBSCURE** : Ne t'aventure jamais dans des ruelles non éclairées. Demande systématiquement au client de se déplacer dans un lieu public ouvert (devant un commerce ou une station-service).\n4. **SIGNALEMENT IMMÉDIAT** : Écris-moi la référence ici pour que notre cellule de sécurité examine et bloque le compte litigieux.",
      suggestedAction: {
        labelFr: "Signaler la Situation",
        labelEn: "Report Situation",
        actionType: "connect_agent"
      }
    };
  }

  // 5. TECHNICAL TROUBLESHOOTING: OTP CODE NOT RECEIVED
  if (
    query.includes('otp') && (query.includes('recu') || query.includes('recois') || query.includes('pas') || query.includes('probleme') || query.includes('erreur') || query.includes('bloque') || query.includes('renvoyer')) ||
    query.includes('code non recu') ||
    query.includes('code de securite') && (query.includes('pas') || query.includes('probleme'))
  ) {
    return {
      category: 'troubleshooting',
      text: isEn
        ? "⚙️ **Procedure: Verification / Security Code Not Received :**\n\n1. **Verify Coordinates**: Ensure your phone number or email address was entered without typing errors.\n2. **Check Spam Folder**: If validating by email, please inspect your Junk/Spam folder.\n3. **Wait 60 Seconds**: Mobile operator networks may experience slight delays during peak traffic.\n4. **Tap 'Resend Code'**: Once the 60-second countdown elapses, request a new verification code.\n5. **Dedicated Support**: If you are still encountering difficulties, please let me know right here so I can guide you through verification."
        : "⚙️ **Procédure : Code de Sécurité non reçu :**\n\n1. **Vérification des coordonnées** : Assurez-vous que votre numéro ou votre adresse email a été saisi avec exactitude.\n2. **Courriers indésirables** : En cas de confirmation par email, consultez votre dossier Spams / Courriers indésirables.\n3. **Délai de réception** : Les réseaux mobiles peuvent nécessiter quelques instants aux heures de forte affluence.\n4. **Bouton 'Renvoyer le code'** : Dès l'expiration du décompte de 60 secondes, cliquez sur l'option pour générer un nouveau code.\n5. **Assistance continue** : Si la difficulté persiste, écrivez-moi ici pour que je vous accompagne dans votre démarche.",
      suggestedAction: {
        labelFr: "Poursuivre avec un Conseiller",
        labelEn: "Continue with Advisor",
        actionType: "connect_agent"
      }
    };
  }

  // 5. TECHNICAL TROUBLESHOOTING: GPS / LOCATION
  if (
    query.includes('gps') && (query.includes('erreur') || query.includes('probleme') || query.includes('marche pas') || query.includes('bloque') || query.includes('position')) ||
    query.includes('localisation') && (query.includes('erreur') || query.includes('probleme') || query.includes('impossible') || query.includes('refus') || query.includes('active')) ||
    query.includes('carte') && query.includes('bloqu')
  ) {
    return {
      category: 'troubleshooting',
      text: isEn
        ? "🗺️ **Procedure: Location & Map Permissions :**\n\n1. **Activate Device Location**: Ensure your device's GPS / Location service is turned on in system settings.\n2. **Browser Permission**: Grant location permissions to your browser when prompted.\n3. **Manual Selection**: If GPS hardware is unavailable, you can simply select your delivery sector manually from the dropdown menu.\n4. **Courier Guidance**: The delivery courier also receives your specified landmark and notes for accurate arrival."
        : "🗺️ **Procédure : Autorisation de Localisation & Carte :**\n\n1. **Activation de l'appareil** : Vérifiez que le service de localisation / GPS est activé dans les paramètres de votre appareil.\n2. **Autorisation du navigateur** : Assurez-vous d'avoir accordé l'autorisation d'accès à la position dans votre navigateur.\n3. **Sélection manuelle** : En cas de signal GPS indisponible, vous pouvez sélectionner manuellement votre zone de livraison dans la liste déroulante.\n4. **Précision pour la livraison** : Le livreur reçoit également vos repères et indications écrites pour une remise parfaite.",
      suggestedAction: {
        labelFr: "Poursuivre mon Assistance",
        labelEn: "Continue Assistance",
        actionType: "connect_agent"
      }
    };
  }

  // 6. RECEIPTS & ELECTRONIC INVOICES
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
        ? "🧾 **Electronic Receipts & Transaction Records :**\n\n• **Automatic Documentation**: For every completed order, an official electronic receipt is generated for both the Buyer and the Seller.\n• **Receipt Details**: Unique transaction reference, item description, payment method, delivery fees, and timestamp.\n• **Verification**: Each receipt contains an authenticated digital stamp ensuring integrity and compliance.\n• **Download**: You can view or download your receipts at any time from your account order history."
        : "🧾 **Reçus Électroniques & Justificatifs de Transaction :**\n\n• **Génération automatique** : À chaque commande finalisée, un reçu électronique officiel est généré pour l'Acheteur et pour le Vendeur.\n• **Mentions détaillées** : Référence unique de commande, désignation de l'article, mode de règlement, frais de livraison et horodatage certifié.\n• **Authentification numérique** : Chaque reçu intègre une signature numérique sécurisée garantissant sa validité.\n• **Accès à tout moment** : Vous pouvez consulter et télécharger vos reçus directement depuis votre espace client sous l'onglet 'Mes Commandes'.",
      suggestedAction: {
        labelFr: "Accéder à mes Commandes",
        labelEn: "Access my Orders",
        actionType: "open_auth"
      }
    };
  }

  // 7. ESCROW PAYMENT & ZERO RISK POD
  if (
    query.includes('sequestre') || 
    query.includes('escrow') || 
    query.includes('securite') || 
    query.includes('garantie') || 
    query.includes('arnaque') || 
    query.includes('remboursement') || 
    query.includes('fraude') ||
    query.includes('bloquer') ||
    query.includes('debloquer') ||
    query.includes('pod') ||
    query.includes('code secret')
  ) {
    return {
      category: 'pod_payment',
      text: isEn
        ? "🛡️ **Secured Payment & Escrow Protection :**\n\n• **Protected Funds**: Payment is safely held in escrow until the parcel is physically handed over.\n• **Physical Inspection First**: The buyer thoroughly inspects the package upon courier arrival before releasing payment.\n• **4-Digit Secret Code**: The buyer receives a private 4-digit code. This code must NEVER be provided to the driver before verifying the contents.\n• **Instant Settlement**: Once the code is validated in the driver's application, the transaction closes and funds are instantly credited to the seller."
        : "🛡️ **Paiement Sécurisé & Protection sous Séquestre :**\n\n• **Protection intégrale des fonds** : Les fonds de la transaction sont conservés en toute sécurité sous séquestre jusqu'à la remise physique du colis.\n• **Inspection préalable obligatoire** : L'acheteur examine minutieusement son colis en présence du livreur avant toute validation.\n• **Code Secret à 4 chiffres** : Un code confidentiel est attribué à l'acheteur. Il ne doit **JAMAIS** être communiqué au livreur avant d'avoir ouvert et approuvé le produit.\n• **Clôture instantanée** : Dès que le livreur valide ce code secret, la transaction est finalisée et les fonds sont débloqués pour le vendeur.",
      suggestedAction: {
        labelFr: "Poursuivre avec un Conseiller",
        labelEn: "Continue with Advisor",
        actionType: "connect_agent"
      }
    };
  }

  // 8. LIVE AUCTIONS & 5-BID ARBITRATION
  if (
    query.includes('enchere') || 
    query.includes('encherir') || 
    query.includes('mise') || 
    query.includes('compte a rebours') || 
    query.includes('chronometre') || 
    query.includes('auction') || 
    query.includes('bid') ||
    query.includes('5 offre') || 
    query.includes('cinq offre') ||
    query.includes('arbitrage')
  ) {
    return {
      category: 'auction',
      text: isEn
        ? "⚖️ **Live Timed Auctions & 5-Bid Rule :**\n\n• **Countdown Sales**: Auctions run on a clear countdown timer for transparent transactions.\n• **Minimum Increments**: Each bid increases according to specified increment brackets.\n• **5-Offer Arbitration**: Once an auction receives 5 offers from distinct buyers, bidding locks and the seller has the right to select their preferred buyer immediately.\n• **Seller Flexibility**: If offers do not meet the expected threshold, the seller can decline without penalty.\n• **Automated Logistics**: Once awarded, delivery is dispatched with real-time tracking."
        : "⚖️ **Enchères Chronométrées & Règle des 5 Offres :**\n\n• **Ventes transparentes** : Les enchères se déroulent selon un compte à rebours précis garantissant l'équité des offres.\n• **Paliers de surenchère** : Chaque nouvelle proposition respecte les paliers minimaux définis.\n• **Règle des 5 offres** : Dès que 5 offres d'acheteurs distincts sont atteintes, les enchères se verrouillent et le vendeur peut choisir immédiatement l'acquéreur de son choix.\n• **Liberté d'arbitrage** : Si les montants proposés s'avèrent insuffisants, le vendeur conserve la possibilité de décliner sans pénalité.\n• **Expédition sécurisée** : Dès validation, la livraison est programmée avec suivi en direct.",
      suggestedAction: {
        labelFr: "Voir les Enchères en Direct",
        labelEn: "View Live Auctions",
        actionType: "filter_auctions"
      }
    };
  }

  // 9. DELIVERY & FREIGHT
  if (
    query.includes('livraison') || 
    query.includes('livreur') || 
    query.includes('coursier') || 
    query.includes('fret') ||
    query.includes('suivi') ||
    query.includes('colis')
  ) {
    return {
      category: 'delivery',
      text: isEn
        ? "🛵 **Delivery Service & Live Tracking :**\n\n• **Real-Time Follow-up**: Track your delivery courier in real time on the interactive map.\n• **Status Updates**: Receive automatic notifications when the parcel is picked up and when the courier arrives.\n• **Verified Drivers**: All couriers undergo strict identity verification and documentation checks.\n• **Direct Courier Payout**: Delivery fees are fully and directly released to the courier upon delivery completion."
        : "🛵 **Service de Livraison & Suivi en Direct :**\n\n• **Suivi cartographique** : Suivez l'acheminement de votre commande en temps réel sur la carte interactive.\n• **Notifications d'avancement** : Recevez une alerte lors de la prise en charge du colis par le coursier, puis à son arrivée.\n• **Coursiers vérifiés** : Tous les livreurs font l'objet d'une vérification d'identité et de conformité rigoureuse.\n• **Rémunération directe** : Les frais de livraison sont versés intégralement au coursier dès confirmation de la remise.",
      suggestedAction: {
        labelFr: "Suivre mes Livraisons",
        labelEn: "Track Deliveries",
        actionType: "filter_auctions"
      }
    };
  }

  // 10. ORDERS & DIRECT PURCHASES
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
        ? "🛍️ **How to Place an Order :**\n\n1. **Select Item**: Browse our catalog or auctions and select 'Buy Now' or 'Add to Cart'.\n2. **Specify Address**: Indicate your destination area and landmark for smooth delivery.\n3. **Courier Dispatch**: A verified courier is assigned with real-time GPS tracking.\n4. **Inspect on Arrival**: Open and inspect your package upon delivery.\n5. **Settlement**: Pay securely via Mobile Money and provide your 4-digit code to complete the order."
        : "🛍️ **Comment Passer Commande :**\n\n1. **Choix de l'article** : Parcourez les annonces ou enchères et choisissez 'Acheter' ou 'Ajouter au Panier'.\n2. **Adresse de destination** : Renseignez votre zone de livraison et vos repères pour faciliter l'acheminement.\n3. **Prise en charge coursier** : Un livreur vérifié est assigné avec géolocalisation en temps réel.\n4. **Contrôle à réception** : Ouvrez et examinez votre article en présence du livreur.\n5. **Règlement sécurisé** : Réglez par Mobile Money et transmettez votre code secret à 4 chiffres pour clôturer la commande.",
      suggestedAction: {
        labelFr: "Parcourir les Articles",
        labelEn: "Browse Catalog",
        actionType: "filter_auctions"
      }
    };
  }

  // 11. REGISTRATION & ACCOUNT CREATION
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
        ? "📝 **How to Register an Account :**\n\n1. Tap **'Sign In / Register'** in the header menu.\n2. Select your account profile: **Buyer / Seller** or **Courier**.\n3. Enter your details: Full name, location, telephone number, and email address.\n4. **Verification Code**: Enter the 6-digit confirmation code received by email.\n5. **Identity Certification (KYC)**: Submit your official identification document to activate your account with verified status."
        : "📝 **Comment Créer votre Compte :**\n\n1. Cliquez sur **'Connexion / Inscription'** dans le menu supérieur.\n2. Choisissez votre statut : **Acheteur / Vendeur** ou **Livreur**.\n3. Renseignez vos coordonnées : Nom, prénom, commune de résidence, téléphone et adresse email.\n4. **Code de confirmation** : Saisissez le code de sécurité à 6 chiffres transmis par email.\n5. **Certification d'identité (KYC)** : Transmettez votre document d'identité officiel pour bénéficier d'un profil certifié.",
      suggestedAction: {
        labelFr: "Créer un Compte",
        labelEn: "Create Account",
        actionType: "open_auth"
      }
    };
  }

  // 12. LOGIN & AUTHENTICATION
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
        ? "🔑 **How to Sign In :**\n\n• **Standard Sign-In**: Enter your registered email address and password, then confirm.\n• **Fast Google Sign-In**: Use 'Continue with Google' for instant, secure authentication.\n• **Password Reset**: If you have forgotten your password, select 'Forgot password?' to receive a secure reset link."
        : "🔑 **Comment vous Connecter :**\n\n• **Connexion standard** : Indiquez votre adresse email enregistrée et votre mot de passe pour accéder à votre compte.\n• **Connexion rapide Google** : Cliquez sur 'Continuer avec Google' pour une connexion immédiate et protégée.\n• **Récupération de mot de passe** : En cas d'oubli, cliquez sur 'Mot de passe oublié' pour recevoir un lien de réinitialisation sécurisé par email.",
      suggestedAction: {
        labelFr: "Se Connecter",
        labelEn: "Sign In",
        actionType: "open_auth"
      }
    };
  }

  // 13. PRICING & SUBSCRIPTIONS
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
        ? "💎 **Official Subscription Plans & Options :**\n\n• **Free Pass (0 FCFA)**: Unlimited listings, 5.0% commission on completed sales.\n• **Pro Seller Pass (2,500 FCFA / 30d)**: 2.5% commission + Verified Pro Badge.\n• **Gold VIP Pass (5,000 FCFA / 30d)**: 1.5% commission + VIP Gold Badge & display priority.\n• **Flash Booster (1,000 FCFA / 24h)**: Pinned top listing placement for 24 hours.\n• **Courier Recharge 24h Chrono (2,000 FCFA / 24h)**: Express delivery access (Point A ➔ Point B) with 0% commission.\n• **Courier Monthly Pass (5,000 FCFA / 30d)**: Unlimited BRAD'CI marketplace orders with 0% commission."
        : "💎 **Grille des Formules d'Abonnement & Options :**\n\n• **Pass Gratuit (0 FCFA)** : Publications illimitées, commission de 5.0% sur ventes finalisées.\n• **Pass Vendeur Pro (2 500 FCFA / 30j)** : Commission à 2.5% + Badge Pro vérifié.\n• **Pass Vendeur Gold VIP (5 000 FCFA / 30j)** : Commission à 1.5% + Badge VIP Gold & priorité d'affichage.\n• **Option Booster Flash (1 000 FCFA / 24h)** : Mise en vedette de l'annonce pendant 24h.\n• **Recharge 24h Chrono Livreur (2 000 FCFA / 24h)** : Livraison express Point A ➔ Point B, 0% commission.\n• **Pass Mensuel Commandes BRAD'CI (5 000 FCFA / 30j)** : Livraisons marketplace en illimité, 0% commission.",
      suggestedAction: {
        labelFr: "Découvrir les Abonnements",
        labelEn: "View Subscriptions",
        actionType: "open_pricing"
      }
    };
  }

  // 14. KYC & IDENTITY VERIFICATION
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
        ? "🛡️ **KYC Identity Certification Process :**\n\n• **Accepted Documents**: Valid National Identity Card, Passport, or Consular Card.\n• **Live Verification**: A swift facial check confirms correspondence with your official document.\n• **Unique Account**: Each ID number is linked to a single verified account, eliminating fraudulent profiles.\n• **Community Safety**: Ensures a safe, transparent, and trustworthy environment for all users."
        : "🛡️ **Certification d'Identité KYC :**\n\n• **Documents acceptés** : Carte Nationale d'Identité valide, Passeport biométrique ou Carte Consulaire.\n• **Contrôle en direct** : Une brève prise de vue faciale permet d'attester la conformité avec la pièce présentée.\n• **Compte unique certifié** : Chaque numéro d'identité est associé à un profil unique pour garantir la fiabilité de la communauté.\n• **Sécurité collective** : Ce processus assure une tranquillité absolue lors des ventes, achats et livraisons.",
      suggestedAction: {
        labelFr: "Vérifier mon Profil KYC",
        labelEn: "Verify KYC Profile",
        actionType: "open_kyc"
      }
    };
  }

  // 15. DISPUTES & RESOLUTION
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
        ? "⚖️ **Dispute Handling & Customer Protection :**\n\n1. **Withhold the Secret Code**: If the delivered item does not match description or is damaged, do not provide the 4-digit code to the driver.\n2. **Open Dispute**: Select 'Report Incident' directly from your order summary.\n3. **Frozen Funds**: Funds remain safely held under escrow while our mediation team reviews evidence.\n4. **Swift Resolution**: You will receive an inspection outcome and full refund or resolution within 24 hours."
        : "⚖️ **Gestion des Litiges & Protection Client :**\n\n1. **Ne remettez pas le Code Secret** : Si l'article reçu est défectueux ou non conforme à sa description, refusez le colis et ne donnez pas le code à 4 chiffres.\n2. **Déclaration immédiate** : Cliquez sur 'Signaler un litige' depuis le récapitulatif de votre commande pour nous en informer.\n3. **Maintien du séquestre** : Les fonds demeurent strictement gelés sur le compte séquestre pendant l'instruction du dossier.\n4. **Traitement rapide** : Notre équipe de médiation examine les éléments transmis pour vous apporter une solution ou un remboursement sous 24 heures.",
      suggestedAction: {
        labelFr: "Poursuivre mon Signalement",
        labelEn: "Continue Report",
        actionType: "connect_agent"
      }
    };
  }

  // 16. DEFAULT FALLBACK / GREETING
  return {
    category: 'general',
    text: isEn
      ? `Bonjour ! Je suis ${advisorName}, votre conseillère du service client en ligne.\n\nJe suis à votre entière disposition pour vous accompagner dans toutes vos démarches :\n• **Enchères & Ventes** : Fonctionnement du compte à rebours et règle des 5 offres.\n• **Paiement Sécurisé & POD** : Règlement Mobile Money et Code Secret à 4 chiffres.\n• **Livraisons & Suivi** : Suivi cartographique des courses en temps réel.\n• **Comptes & Abonnements** : Formules Vendeur et Livreur, certification KYC.\n\nEn quoi puis-je vous renseigner aujourd'hui ?`
      : `Bonjour ! Je suis ${advisorName}, votre conseillère du service client en ligne.\n\nJe suis à votre entière disposition pour vous accompagner dans toutes vos démarches :\n• **Enchères & Ventes** : Fonctionnement du compte à rebours et arbitrage des 5 offres.\n• **Paiement Sécurisé & POD** : Règlement Mobile Money à réception et Code Secret à 4 chiffres.\n• **Livraisons & Suivi** : Suivi en direct des coursiers sur la carte.\n• **Comptes & Formules** : Abonnements Vendeur et Livreur, certification d'identité KYC.\n\nEn quoi puis-je vous être utile aujourd'hui ?`,
    suggestedAction: {
      labelFr: "Poser ma Question",
      labelEn: "Ask Question",
      actionType: "connect_agent"
    }
  };
}
