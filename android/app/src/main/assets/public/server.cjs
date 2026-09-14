var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");

// src/utils/aiKnowledgeEngine.ts
var ADMIN_OWNER_PROHIBITED_PATTERNS = [
  "admin",
  "administrateur",
  "backoffice",
  "back-office",
  "back office",
  "mot de passe admin",
  "admin password",
  "clef secre",
  "secret key",
  "cle secret",
  "revenus du proprietaire",
  "revenu proprietaire",
  "gain proprietaire",
  "owner profit",
  "owner revenue",
  "proprietaire du site",
  "owner credentials",
  "base de donnee",
  "database",
  "serveur",
  "sql",
  "firebase config",
  "code source",
  "source code",
  "token admin",
  "superadmin",
  "super admin",
  "supprimer compte utilisateur",
  "bloquer compte de force",
  "pirater",
  "hack",
  "donnees privees",
  "private data",
  "logs systeme",
  "system logs",
  "acces root",
  "root access"
];
var EXECUTIVE_DIRECTION_PATTERNS = [
  "ceo",
  "pdg",
  "dg",
  "directeur general",
  "president directeur general",
  "direction",
  "groupe d'administration",
  "groupe administration",
  "acces direction",
  "acces executif",
  "executive access",
  "contact direction",
  "bureau du dg",
  "bureau du ceo",
  "bureau du pdg",
  "directeur"
];
var ADDRESS_PHONE_PATTERNS = [
  "adresse",
  "adresse physique",
  "ou se trouve",
  "ou sont vos locaux",
  "locaux",
  "siege social",
  "siege",
  "bureau",
  "bureaux",
  "votre numero",
  "numero de telephone",
  "telephone",
  "appeler",
  "allo",
  "call center",
  "whatsapp",
  "vous etes situe",
  "ou vous trouver"
];
function queryBradCiKnowledge(rawQuery, lang = "fr", advisorName = "Sarah") {
  const query = rawQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isEn = lang === "en";
  const isExecutiveQuery = EXECUTIVE_DIRECTION_PATTERNS.some((pattern) => {
    const normPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return query.includes(normPattern);
  });
  if (isExecutiveQuery) {
    return {
      category: "security_blocked",
      text: isEn ? "\u{1F512} **Official Direction & Executive Protocol**\n\nExecutive-level correspondence and governance procedures are handled according to strict organizational protocols. For any formal or strategic inquiry, please submit your request through our online support desk, and it will be routed to the appropriate department." : "\u{1F512} **Protocole Officiel & Direction G\xE9n\xE9rale**\n\nLes correspondances et proc\xE9dures relatives \xE0 la direction g\xE9n\xE9rale sont encadr\xE9es par des protocoles stricts de confidentialit\xE9. Pour toute demande institutionnelle ou r\xE9clamation formelle, nous vous invitons \xE0 transmettre votre dossier ici m\xEAme afin qu'il soit transmis au service comp\xE9tent.",
      suggestedAction: {
        labelFr: "Poursuivre par \xC9crit",
        labelEn: "Continue in Chat",
        actionType: "connect_agent"
      }
    };
  }
  const isProhibited = ADMIN_OWNER_PROHIBITED_PATTERNS.some((pattern) => {
    const normPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return query.includes(normPattern);
  });
  if (isProhibited) {
    return {
      category: "security_blocked",
      text: isEn ? "\u{1F512} **Confidential & Restricted Information**\n\nFor platform security and data privacy reasons, information regarding internal administration, system controls, and private technical data cannot be disclosed. As your customer service advisor, I am at your disposal to assist you with accounts, orders, deliveries, and subscriptions." : "\u{1F512} **Information Confidentielle & S\xE9curis\xE9e**\n\nPar mesure de stricte confidentialit\xE9 et de s\xE9curit\xE9 informatique, les acc\xE8s administratifs, les param\xE8tres internes et les donn\xE9es techniques priv\xE9es ne sont jamais communiqu\xE9s. En tant que conseill\xE8re client\xE8le, je reste \xE0 votre enti\xE8re disposition pour vous guider sur vos commandes, vos ventes, vos livraisons et vos abonnements.",
      suggestedAction: {
        labelFr: "Poursuivre mon Assistance",
        labelEn: "Continue Assistance",
        actionType: "connect_agent"
      }
    };
  }
  const isAddressOrPhone = ADDRESS_PHONE_PATTERNS.some((pattern) => {
    const normPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return query.includes(normPattern);
  });
  if (isAddressOrPhone) {
    return {
      category: "support",
      text: isEn ? `Bonjour ! Afin de garantir une tra\xE7abilit\xE9 optimale, la s\xE9curit\xE9 de vos transactions et la confidentialit\xE9 de chaque dossier, l'ensemble de notre service client et de nos op\xE9rations s'effectue exclusivement en ligne via cette messagerie s\xE9curis\xE9e.

Nous ne communiquons aucun num\xE9ro de t\xE9l\xE9phone direct ni adresse physique. Je suis ${advisorName}, votre conseill\xE8re d\xE9di\xE9e, et je reste \xE0 votre \xE9coute ici pour traiter toutes vos demandes avec la plus grande attention.` : `Bonjour ! Afin de garantir une tra\xE7abilit\xE9 rigoureuse, la s\xE9curit\xE9 de vos op\xE9rations et la protection de vos donn\xE9es, l'ensemble de notre service client op\xE8re exclusivement en ligne via cette messagerie s\xE9curis\xE9e.

Par mesure de s\xE9curit\xE9 et de conformit\xE9, nous ne communiquons aucun num\xE9ro de t\xE9l\xE9phone ni adresse physique. Je suis ${advisorName}, votre conseill\xE8re d\xE9di\xE9e, et je reste \xE0 votre enti\xE8re disposition ici m\xEAme pour traiter votre demande en toute s\xE9r\xE9nit\xE9.`,
      suggestedAction: {
        labelFr: "Poser ma Question",
        labelEn: "Ask my Question",
        actionType: "connect_agent"
      }
    };
  }
  const isBlockedSale = (query.includes("bloqu") || query.includes("bloque") || query.includes("blocage") || query.includes("ferme") || query.includes("impossible de vendre") || query.includes("enchere bloqu")) && (query.includes("vent") || query.includes("annonc") || query.includes("encher") || query.includes("produit") || query.includes("prix") || query.includes("offre"));
  const isTypingError = query.includes("erreur de frappe") || query.includes("erreur frappe") || query.includes("trompe de numero") || query.includes("trompe de prix") || query.includes("mauvais montant") || query.includes("mauvais numero") || query.includes("faute de frappe") || query.includes("corriger mon annonce") || query.includes("rectifier montant");
  const isKycPendingIssue = (query.includes("kyc") || query.includes("identite") || query.includes("piece") || query.includes("cni") || query.includes("passeport")) && (query.includes("attente") || query.includes("bloqu") || query.includes("refus") || query.includes("delai") || query.includes("pas valide") || query.includes("rejete") || query.includes("retard"));
  if (isBlockedSale || isTypingError || isKycPendingIssue) {
    let probType = "blocked_sale";
    let probLabel = "Blocage de vente / ench\xE8re";
    if (isTypingError) {
      probType = "typing_error";
      probLabel = "Erreur de frappe / modification requise";
    } else if (isKycPendingIssue) {
      probType = "kyc_pending";
      probLabel = "Certification KYC en attente / bloqu\xE9e";
    }
    const reassuranceTextFr = `Bonjour, je comprends parfaitement votre situation et je tiens \xE0 vous rassurer : **votre demande vient d'\xEAtre transmise imm\xE9diatement et directement \xE0 notre page d'administration Back-Office** pour que notre \xE9quipe technique et de direction puisse r\xE9soudre votre probl\xE8me en priorit\xE9 absolue.

\u{1F6E1}\uFE0F **Ce qui va se passer maintenant :**
1. **Prise en charge directe** : Votre dossier (${probLabel}) est d\xE9sormais ouvert sous suivi prioritaire.
2. **Contact direct** : Nos administrateurs vont vous recontacter directement **soit par email, soit par appel t\xE9l\xE9phonique** pour confirmer la r\xE9gularisation.
3. **Appel d'assistance** : D\xE8s que l'administration valide la r\xE9solution de votre requ\xEAte, je pourrai d\xE9clencher un appel vocal d'assistance direct avec vous au sein de l'application ou sur votre ligne.

Soyez serein(e), votre dossier est entre les mains de notre administration !`;
    const reassuranceTextEn = `Hello, I understand your situation completely and want to reassure you: **your request has just been transmitted immediately and directly to our Back-Office Administration team** so our team can resolve this issue with top priority.

\u{1F6E1}\uFE0F **Next steps:**
1. **Direct Ticket Created**: Your dossier (${probLabel}) is officially registered under priority review.
2. **Direct Contact**: Our administrators will reach out to you directly **either by email or via phone call** to confirm resolution.
3. **Voice Assistance Call**: Once the administration confirms the fix, I will initiate a direct voice support call with you upon approval.

Rest assured, your issue is actively being addressed!`;
    return {
      category: "troubleshooting",
      text: isEn ? reassuranceTextEn : reassuranceTextFr,
      suggestedAction: {
        labelFr: "Voir l'\xC9tat de ma Requ\xEAte",
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
  if (query.includes("agress") || query.includes("attaqu") || query.includes("menac") || query.includes("violence") || query.includes("danger") || query.includes("bandit") || query.includes("frapp") || query.includes("arme") || query.includes("couteau")) {
    return {
      category: "support",
      text: isEn ? "\u{1F6A8} **CRITICAL EMERGENCY PROTOCOL: COURIER ASSAULT / THREAT**\n\n1. **SAFETY FIRST**: Move away immediately to a busy, well-lit public area. Do not resist violently.\n2. **CALL EMERGENCY POLICE**: Dial **170 / 111 / 100** immediately.\n3. **DELIVERY FROZEN**: Your delivery is instantly suspended with **0 penalty** on your rating and zero commission loss.\n4. **LIVE ASSISTANCE**: Our central support desk is on high alert. Let us know your exact location here so we can support you." : "\u{1F6A8} **URGENCE ABSOLUE : PROTOCOLE AGRESSION & S\xC9CURIT\xC9 LIVREUR**\n\n1. **METS-TOI IMM\xC9DIATEMENT EN S\xC9CURIT\xC9** : \xC9loigne-toi du danger, r\xE9fugie-toi dans un lieu public \xE9clair\xE9 et fr\xE9quent\xE9 (station-service, pharmacie, commerce). Ne r\xE9siste pas physiquement.\n2. **ALERTE LA POLICE SECOURS** : Compose imm\xE9diatement le **170** (ou 111 / 100).\n3. **AUCUNE P\xC9NALIT\xC9 SUR TA COURSE** : La livraison est imm\xE9diatement gel\xE9e par notre support. Tu ne subis aucune sanction, aucune baisse de note ni retenue financi\xE8re.\n4. **ASSISTANCE CENTRALE ACTIVE** : Indique-moi ta position ici d\xE8s que tu es en s\xE9curit\xE9. Notre cellule d'assistance te couvre int\xE9gralement.",
      suggestedAction: {
        labelFr: "Je suis en S\xE9curit\xE9",
        labelEn: "I am Safe Now",
        actionType: "connect_agent"
      }
    };
  }
  if (query.includes("accident") || query.includes("blesse") || query.includes("chute") || query.includes("collision") || query.includes("hopital") || query.includes("samu") || query.includes("pompier") || query.includes("sang") || query.includes("fractur")) {
    return {
      category: "support",
      text: isEn ? "\u{1F691} **MEDICAL EMERGENCY: COURIER ACCIDENT / INJURY**\n\n1. **CALL MEDICAL SERVICES**: Dial **180** (Firefighters/Rescue) or **185** (Emergency Medical / SAMU) immediately.\n2. **STOP TRANSPORTATION**: Do not attempt to continue the ride. Your physical well-being is the absolute priority.\n3. **RELAY COURIER**: Our logistics dispatch is sending a nearby partner courier to retrieve and secure the package.\n4. **INSURANCE & CARE**: Platform delivery insurance covers validated trips. We stay by your side." : "\u{1F691} **URGENCE M\xC9DICALE : ACCIDENT & LIVREUR BLESS\xC9**\n\n1. **ALERTE LES SECOURS M\xC9DICAUX** : Compose imm\xE9diatement le **180** (Sapeurs-Pompiers) ou le **185** (SAMU).\n2. **CESSE LA COURSE IMM\xC9DIATEMENT** : Ne force pas et ne cherche pas \xE0 livrer le colis. Ta sant\xE9 et ton int\xE9grit\xE9 physique passent avant tout !\n3. **COURS DE RELAIS S\xC9CURIS\xC9** : Notre r\xE9gulation centrale mobilise un coursier partenaire \xE0 proximit\xE9 pour r\xE9cup\xE9rer le colis sans que tu sois inqui\xE9t\xE9.\n4. **PRISE EN CHARGE ASSURANCE** : Toute course enregistr\xE9e est couverte par la garantie d'assistance. Reste calme, nous sommes avec toi.",
      suggestedAction: {
        labelFr: "Secours Contact\xE9s",
        labelEn: "Help Called",
        actionType: "connect_agent"
      }
    };
  }
  if (query.includes("voler") || query.includes("vole") || query.includes("braqu") || query.includes("arrach") || query.includes("depouill") || query.includes("vol de moto") || query.includes("vol de colis") || query.includes("perdu mon colis")) {
    return {
      category: "dispute",
      text: isEn ? "\u{1F6D1} **EMERGENCY: THEFT / ROBBERY OF PARCEL OR VEHICLE**\n\n1. **FILE OFFICIAL POLICE REPORT**: Head immediately to the nearest police station or gendarmerie to file an official theft report and obtain a receipt.\n2. **ESCROW LOCKDOWN**: Inform us with your order reference so we instantly lock the funds under escrow protection. Neither you nor the buyer will be defrauded.\n3. **PLATFORM INSURANCE**: Our freight protection guarantee activates upon presentation of the police report.\n4. **ACCOUNT PROTECTION**: We temporarily secure your courier credentials to prevent any unauthorized usage." : "\u{1F6D1} **URGENCE S\xC9CURIT\xC9 : VOL DE COLIS, DE MOTO OU BRAQUAGE**\n\n1. **D\xC9P\xD4T DE PLAINTE IMM\xC9DIAT** : Rends-toi sans attendre au commissariat de police ou \xE0 la gendarmerie la plus proche pour d\xE9poser plainte et exiger un r\xE9c\xE9piss\xE9 officiel de d\xE9claration de vol.\n2. **GEL DES FONDS SOUS S\xC9QUESTRE** : Communique-nous ici la r\xE9f\xE9rence de ta course. Nous verrouillons imm\xE9diatement la commande sous s\xE9questre bancaire pour \xE9viter toute spoliation.\n3. **ACTIVATION DE L'ASSURANCE FRET** : La garantie d'indemnisation de la plateforme s'enclenche sur pr\xE9sentation du proc\xE8s-verbal de d\xE9p\xF4t de plainte.\n4. **S\xC9CURISATION DU COMPTE** : Ton profil est prot\xE9g\xE9 contre toute usurpation. Reste serein, nous g\xE9rons la relation avec l'acheteur et le vendeur.",
      suggestedAction: {
        labelFr: "Transmettre R\xE9f\xE9rence",
        labelEn: "Send Reference",
        actionType: "connect_agent"
      }
    };
  }
  if (query.includes("bizarre") || query.includes("suspect") || query.includes("louche") || query.includes("drogue") || query.includes("illicite") || query.includes("refuse de donner le code") || query.includes("veut pas donner le code") || query.includes("sans code") || query.includes("piege") || query.includes("agressif")) {
    return {
      category: "dispute",
      text: isEn ? "\u26A0\uFE0F **SAFETY WARNING: SUSPICIOUS PARCEL / DANGEROUS SITUATION**\n\n1. **SUSPICIOUS PARCEL**: If a package contains forbidden items (drugs, weapons, leaking chemicals, unusual odor), **DO NOT TRANSPORT IT**. Refuse pickup and notify support.\n2. **REFUSAL OF 4-DIGIT CODE**: **NEVER HAND OVER THE PACKAGE WITHOUT VALIDATING THE SECRET CODE**. If the buyer refuses or tries to force you, keep the parcel, leave the area, and cancel with 'Refusal of Secret Code'.\n3. **SUSPICIOUS OR ISOLATED LOCATION**: Never enter dark alleys or private enclosed spaces. Require the customer to meet in an open, public area.\n4. **SUPPORT PROTECTION**: Report the customer ID or ride immediately here so our security team blacklists fraudulent profiles." : "\u26A0\uFE0F **S\xC9CURIT\xC9 & VIGILANCE : SITUATION BIZARRE OU COLIS SUSPECT**\n\n1. **COLIS SUSPECT OU ILLICITE** : Si un paquet pr\xE9sente un contenu anormal (substances interdites, liquide suspect, odeur anormale, armes) : **INTERDICTION FORMELLE DE TRANSPORTER**. Refuse la course imm\xE9diatement et alerte le support.\n2. **REFUS DU CODE SECRET \xC0 4 CHIFFRES** : **NE DONNE JAMAIS LE COLIS SANS AVOIR SAISI ET VALID\xC9 LE CODE SECRET**. Si le client tente de faire pression, conserve le colis, \xE9loigne-toi calmement et annule avec le motif 'Refus du code de validation'.\n3. **LIEU DE RENDEZ-VOUS ISOL\xC9 OU OBSCURE** : Ne t'aventure jamais dans des ruelles non \xE9clair\xE9es. Demande syst\xE9matiquement au client de se d\xE9placer dans un lieu public ouvert (devant un commerce ou une station-service).\n4. **SIGNALEMENT IMM\xC9DIAT** : \xC9cris-moi la r\xE9f\xE9rence ici pour que notre cellule de s\xE9curit\xE9 examine et bloque le compte litigieux.",
      suggestedAction: {
        labelFr: "Signaler la Situation",
        labelEn: "Report Situation",
        actionType: "connect_agent"
      }
    };
  }
  if (query.includes("otp") && (query.includes("recu") || query.includes("recois") || query.includes("pas") || query.includes("probleme") || query.includes("erreur") || query.includes("bloque") || query.includes("renvoyer")) || query.includes("code non recu") || query.includes("code de securite") && (query.includes("pas") || query.includes("probleme"))) {
    return {
      category: "troubleshooting",
      text: isEn ? "\u2699\uFE0F **Procedure: Verification / Security Code Not Received :**\n\n1. **Verify Coordinates**: Ensure your phone number or email address was entered without typing errors.\n2. **Check Spam Folder**: If validating by email, please inspect your Junk/Spam folder.\n3. **Wait 60 Seconds**: Mobile operator networks may experience slight delays during peak traffic.\n4. **Tap 'Resend Code'**: Once the 60-second countdown elapses, request a new verification code.\n5. **Dedicated Support**: If you are still encountering difficulties, please let me know right here so I can guide you through verification." : "\u2699\uFE0F **Proc\xE9dure : Code de S\xE9curit\xE9 non re\xE7u :**\n\n1. **V\xE9rification des coordonn\xE9es** : Assurez-vous que votre num\xE9ro ou votre adresse email a \xE9t\xE9 saisi avec exactitude.\n2. **Courriers ind\xE9sirables** : En cas de confirmation par email, consultez votre dossier Spams / Courriers ind\xE9sirables.\n3. **D\xE9lai de r\xE9ception** : Les r\xE9seaux mobiles peuvent n\xE9cessiter quelques instants aux heures de forte affluence.\n4. **Bouton 'Renvoyer le code'** : D\xE8s l'expiration du d\xE9compte de 60 secondes, cliquez sur l'option pour g\xE9n\xE9rer un nouveau code.\n5. **Assistance continue** : Si la difficult\xE9 persiste, \xE9crivez-moi ici pour que je vous accompagne dans votre d\xE9marche.",
      suggestedAction: {
        labelFr: "Poursuivre avec un Conseiller",
        labelEn: "Continue with Advisor",
        actionType: "connect_agent"
      }
    };
  }
  if (query.includes("gps") && (query.includes("erreur") || query.includes("probleme") || query.includes("marche pas") || query.includes("bloque") || query.includes("position")) || query.includes("localisation") && (query.includes("erreur") || query.includes("probleme") || query.includes("impossible") || query.includes("refus") || query.includes("active")) || query.includes("carte") && query.includes("bloqu")) {
    return {
      category: "troubleshooting",
      text: isEn ? "\u{1F5FA}\uFE0F **Procedure: Location & Map Permissions :**\n\n1. **Activate Device Location**: Ensure your device's GPS / Location service is turned on in system settings.\n2. **Browser Permission**: Grant location permissions to your browser when prompted.\n3. **Manual Selection**: If GPS hardware is unavailable, you can simply select your delivery sector manually from the dropdown menu.\n4. **Courier Guidance**: The delivery courier also receives your specified landmark and notes for accurate arrival." : "\u{1F5FA}\uFE0F **Proc\xE9dure : Autorisation de Localisation & Carte :**\n\n1. **Activation de l'appareil** : V\xE9rifiez que le service de localisation / GPS est activ\xE9 dans les param\xE8tres de votre appareil.\n2. **Autorisation du navigateur** : Assurez-vous d'avoir accord\xE9 l'autorisation d'acc\xE8s \xE0 la position dans votre navigateur.\n3. **S\xE9lection manuelle** : En cas de signal GPS indisponible, vous pouvez s\xE9lectionner manuellement votre zone de livraison dans la liste d\xE9roulante.\n4. **Pr\xE9cision pour la livraison** : Le livreur re\xE7oit \xE9galement vos rep\xE8res et indications \xE9crites pour une remise parfaite.",
      suggestedAction: {
        labelFr: "Poursuivre mon Assistance",
        labelEn: "Continue Assistance",
        actionType: "connect_agent"
      }
    };
  }
  if (query.includes("recu") || query.includes("facture") || query.includes("justificatif") || query.includes("preuve") || query.includes("ticket") || query.includes("transaction") || query.includes("receipt") || query.includes("invoice")) {
    return {
      category: "receipts",
      text: isEn ? "\u{1F9FE} **Electronic Receipts & Transaction Records :**\n\n\u2022 **Automatic Documentation**: For every completed order, an official electronic receipt is generated for both the Buyer and the Seller.\n\u2022 **Receipt Details**: Unique transaction reference, item description, payment method, delivery fees, and timestamp.\n\u2022 **Verification**: Each receipt contains an authenticated digital stamp ensuring integrity and compliance.\n\u2022 **Download**: You can view or download your receipts at any time from your account order history." : "\u{1F9FE} **Re\xE7us \xC9lectroniques & Justificatifs de Transaction :**\n\n\u2022 **G\xE9n\xE9ration automatique** : \xC0 chaque commande finalis\xE9e, un re\xE7u \xE9lectronique officiel est g\xE9n\xE9r\xE9 pour l'Acheteur et pour le Vendeur.\n\u2022 **Mentions d\xE9taill\xE9es** : R\xE9f\xE9rence unique de commande, d\xE9signation de l'article, mode de r\xE8glement, frais de livraison et horodatage certifi\xE9.\n\u2022 **Authentification num\xE9rique** : Chaque re\xE7u int\xE8gre une signature num\xE9rique s\xE9curis\xE9e garantissant sa validit\xE9.\n\u2022 **Acc\xE8s \xE0 tout moment** : Vous pouvez consulter et t\xE9l\xE9charger vos re\xE7us directement depuis votre espace client sous l'onglet 'Mes Commandes'.",
      suggestedAction: {
        labelFr: "Acc\xE9der \xE0 mes Commandes",
        labelEn: "Access my Orders",
        actionType: "open_auth"
      }
    };
  }
  if (query.includes("sequestre") || query.includes("escrow") || query.includes("securite") || query.includes("garantie") || query.includes("arnaque") || query.includes("remboursement") || query.includes("fraude") || query.includes("bloquer") || query.includes("debloquer") || query.includes("pod") || query.includes("code secret")) {
    return {
      category: "pod_payment",
      text: isEn ? "\u{1F6E1}\uFE0F **Secured Payment & Escrow Protection :**\n\n\u2022 **Protected Funds**: Payment is safely held in escrow until the parcel is physically handed over.\n\u2022 **Physical Inspection First**: The buyer thoroughly inspects the package upon courier arrival before releasing payment.\n\u2022 **4-Digit Secret Code**: The buyer receives a private 4-digit code. This code must NEVER be provided to the driver before verifying the contents.\n\u2022 **Instant Settlement**: Once the code is validated in the driver's application, the transaction closes and funds are instantly credited to the seller." : "\u{1F6E1}\uFE0F **Paiement S\xE9curis\xE9 & Protection sous S\xE9questre :**\n\n\u2022 **Protection int\xE9grale des fonds** : Les fonds de la transaction sont conserv\xE9s en toute s\xE9curit\xE9 sous s\xE9questre jusqu'\xE0 la remise physique du colis.\n\u2022 **Inspection pr\xE9alable obligatoire** : L'acheteur examine minutieusement son colis en pr\xE9sence du livreur avant toute validation.\n\u2022 **Code Secret \xE0 4 chiffres** : Un code confidentiel est attribu\xE9 \xE0 l'acheteur. Il ne doit **JAMAIS** \xEAtre communiqu\xE9 au livreur avant d'avoir ouvert et approuv\xE9 le produit.\n\u2022 **Cl\xF4ture instantan\xE9e** : D\xE8s que le livreur valide ce code secret, la transaction est finalis\xE9e et les fonds sont d\xE9bloqu\xE9s pour le vendeur.",
      suggestedAction: {
        labelFr: "Poursuivre avec un Conseiller",
        labelEn: "Continue with Advisor",
        actionType: "connect_agent"
      }
    };
  }
  if (query.includes("enchere") || query.includes("encherir") || query.includes("mise") || query.includes("compte a rebours") || query.includes("chronometre") || query.includes("auction") || query.includes("bid") || query.includes("5 offre") || query.includes("cinq offre") || query.includes("arbitrage")) {
    return {
      category: "auction",
      text: isEn ? "\u2696\uFE0F **Live Timed Auctions & 5-Bid Rule :**\n\n\u2022 **Countdown Sales**: Auctions run on a clear countdown timer for transparent transactions.\n\u2022 **Minimum Increments**: Each bid increases according to specified increment brackets.\n\u2022 **5-Offer Arbitration**: Once an auction receives 5 offers from distinct buyers, bidding locks and the seller has the right to select their preferred buyer immediately.\n\u2022 **Seller Flexibility**: If offers do not meet the expected threshold, the seller can decline without penalty.\n\u2022 **Automated Logistics**: Once awarded, delivery is dispatched with real-time tracking." : "\u2696\uFE0F **Ench\xE8res Chronom\xE9tr\xE9es & R\xE8gle des 5 Offres :**\n\n\u2022 **Ventes transparentes** : Les ench\xE8res se d\xE9roulent selon un compte \xE0 rebours pr\xE9cis garantissant l'\xE9quit\xE9 des offres.\n\u2022 **Paliers de surench\xE8re** : Chaque nouvelle proposition respecte les paliers minimaux d\xE9finis.\n\u2022 **R\xE8gle des 5 offres** : D\xE8s que 5 offres d'acheteurs distincts sont atteintes, les ench\xE8res se verrouillent et le vendeur peut choisir imm\xE9diatement l'acqu\xE9reur de son choix.\n\u2022 **Libert\xE9 d'arbitrage** : Si les montants propos\xE9s s'av\xE8rent insuffisants, le vendeur conserve la possibilit\xE9 de d\xE9cliner sans p\xE9nalit\xE9.\n\u2022 **Exp\xE9dition s\xE9curis\xE9e** : D\xE8s validation, la livraison est programm\xE9e avec suivi en direct.",
      suggestedAction: {
        labelFr: "Voir les Ench\xE8res en Direct",
        labelEn: "View Live Auctions",
        actionType: "filter_auctions"
      }
    };
  }
  if (query.includes("livraison") || query.includes("livreur") || query.includes("coursier") || query.includes("fret") || query.includes("suivi") || query.includes("colis")) {
    return {
      category: "delivery",
      text: isEn ? "\u{1F6F5} **Delivery Service & Live Tracking :**\n\n\u2022 **Real-Time Follow-up**: Track your delivery courier in real time on the interactive map.\n\u2022 **Status Updates**: Receive automatic notifications when the parcel is picked up and when the courier arrives.\n\u2022 **Verified Drivers**: All couriers undergo strict identity verification and documentation checks.\n\u2022 **Direct Courier Payout**: Delivery fees are fully and directly released to the courier upon delivery completion." : "\u{1F6F5} **Service de Livraison & Suivi en Direct :**\n\n\u2022 **Suivi cartographique** : Suivez l'acheminement de votre commande en temps r\xE9el sur la carte interactive.\n\u2022 **Notifications d'avancement** : Recevez une alerte lors de la prise en charge du colis par le coursier, puis \xE0 son arriv\xE9e.\n\u2022 **Coursiers v\xE9rifi\xE9s** : Tous les livreurs font l'objet d'une v\xE9rification d'identit\xE9 et de conformit\xE9 rigoureuse.\n\u2022 **R\xE9mun\xE9ration directe** : Les frais de livraison sont vers\xE9s int\xE9gralement au coursier d\xE8s confirmation de la remise.",
      suggestedAction: {
        labelFr: "Suivre mes Livraisons",
        labelEn: "Track Deliveries",
        actionType: "filter_auctions"
      }
    };
  }
  if (query.includes("commande") || query.includes("commander") || query.includes("acheter") || query.includes("achat direct") || query.includes("panier") || query.includes("payer")) {
    return {
      category: "order",
      text: isEn ? "\u{1F6CD}\uFE0F **How to Place an Order :**\n\n1. **Select Item**: Browse our catalog or auctions and select 'Buy Now' or 'Add to Cart'.\n2. **Specify Address**: Indicate your destination area and landmark for smooth delivery.\n3. **Courier Dispatch**: A verified courier is assigned with real-time GPS tracking.\n4. **Inspect on Arrival**: Open and inspect your package upon delivery.\n5. **Settlement**: Pay securely via Mobile Money and provide your 4-digit code to complete the order." : "\u{1F6CD}\uFE0F **Comment Passer Commande :**\n\n1. **Choix de l'article** : Parcourez les annonces ou ench\xE8res et choisissez 'Acheter' ou 'Ajouter au Panier'.\n2. **Adresse de destination** : Renseignez votre zone de livraison et vos rep\xE8res pour faciliter l'acheminement.\n3. **Prise en charge coursier** : Un livreur v\xE9rifi\xE9 est assign\xE9 avec g\xE9olocalisation en temps r\xE9el.\n4. **Contr\xF4le \xE0 r\xE9ception** : Ouvrez et examinez votre article en pr\xE9sence du livreur.\n5. **R\xE8glement s\xE9curis\xE9** : R\xE9glez par Mobile Money et transmettez votre code secret \xE0 4 chiffres pour cl\xF4turer la commande.",
      suggestedAction: {
        labelFr: "Parcourir les Articles",
        labelEn: "Browse Catalog",
        actionType: "filter_auctions"
      }
    };
  }
  if (query.includes("inscri") || query.includes("creer un compte") || query.includes("creation de compte") || query.includes("register") || query.includes("sign up") || query.includes("nouveau compte")) {
    return {
      category: "onboarding",
      text: isEn ? "\u{1F4DD} **How to Register an Account :**\n\n1. Tap **'Sign In / Register'** in the header menu.\n2. Select your account profile: **Buyer / Seller** or **Courier**.\n3. Enter your details: Full name, location, telephone number, and email address.\n4. **Verification Code**: Enter the 6-digit confirmation code received by email.\n5. **Identity Certification (KYC)**: Submit your official identification document to activate your account with verified status." : "\u{1F4DD} **Comment Cr\xE9er votre Compte :**\n\n1. Cliquez sur **'Connexion / Inscription'** dans le menu sup\xE9rieur.\n2. Choisissez votre statut : **Acheteur / Vendeur** ou **Livreur**.\n3. Renseignez vos coordonn\xE9es : Nom, pr\xE9nom, commune de r\xE9sidence, t\xE9l\xE9phone et adresse email.\n4. **Code de confirmation** : Saisissez le code de s\xE9curit\xE9 \xE0 6 chiffres transmis par email.\n5. **Certification d'identit\xE9 (KYC)** : Transmettez votre document d'identit\xE9 officiel pour b\xE9n\xE9ficier d'un profil certifi\xE9.",
      suggestedAction: {
        labelFr: "Cr\xE9er un Compte",
        labelEn: "Create Account",
        actionType: "open_auth"
      }
    };
  }
  if (query.includes("connexion") || query.includes("connecter") || query.includes("login") || query.includes("sign in") || query.includes("mot de passe")) {
    return {
      category: "auth",
      text: isEn ? "\u{1F511} **How to Sign In :**\n\n\u2022 **Standard Sign-In**: Enter your registered email address and password, then confirm.\n\u2022 **Fast Google Sign-In**: Use 'Continue with Google' for instant, secure authentication.\n\u2022 **Password Reset**: If you have forgotten your password, select 'Forgot password?' to receive a secure reset link." : "\u{1F511} **Comment vous Connecter :**\n\n\u2022 **Connexion standard** : Indiquez votre adresse email enregistr\xE9e et votre mot de passe pour acc\xE9der \xE0 votre compte.\n\u2022 **Connexion rapide Google** : Cliquez sur 'Continuer avec Google' pour une connexion imm\xE9diate et prot\xE9g\xE9e.\n\u2022 **R\xE9cup\xE9ration de mot de passe** : En cas d'oubli, cliquez sur 'Mot de passe oubli\xE9' pour recevoir un lien de r\xE9initialisation s\xE9curis\xE9 par email.",
      suggestedAction: {
        labelFr: "Se Connecter",
        labelEn: "Sign In",
        actionType: "open_auth"
      }
    };
  }
  if (query.includes("pass") || query.includes("tarif") || query.includes("prix") || query.includes("abonnement") || query.includes("combien") || query.includes("commission") || query.includes("boost")) {
    return {
      category: "pricing",
      text: isEn ? "\u{1F48E} **Official Subscription Plans & Options :**\n\n\u2022 **Free Pass (0 FCFA)**: Unlimited listings, 5.0% commission on completed sales.\n\u2022 **Pro Seller Pass (2,500 FCFA / 30d)**: 2.5% commission + Verified Pro Badge.\n\u2022 **Gold VIP Pass (5,000 FCFA / 30d)**: 1.5% commission + VIP Gold Badge & display priority.\n\u2022 **Flash Booster (1,000 FCFA / 24h)**: Pinned top listing placement for 24 hours.\n\u2022 **Courier Recharge 24h Chrono (2,000 FCFA / 24h)**: Express delivery access (Point A \u2794 Point B) with 0% commission.\n\u2022 **Courier Monthly Pass (5,000 FCFA / 30d)**: Unlimited BRAD'CI marketplace orders with 0% commission." : "\u{1F48E} **Grille des Formules d'Abonnement & Options :**\n\n\u2022 **Pass Gratuit (0 FCFA)** : Publications illimit\xE9es, commission de 5.0% sur ventes finalis\xE9es.\n\u2022 **Pass Vendeur Pro (2 500 FCFA / 30j)** : Commission \xE0 2.5% + Badge Pro v\xE9rifi\xE9.\n\u2022 **Pass Vendeur Gold VIP (5 000 FCFA / 30j)** : Commission \xE0 1.5% + Badge VIP Gold & priorit\xE9 d'affichage.\n\u2022 **Option Booster Flash (1 000 FCFA / 24h)** : Mise en vedette de l'annonce pendant 24h.\n\u2022 **Recharge 24h Chrono Livreur (2 000 FCFA / 24h)** : Livraison express Point A \u2794 Point B, 0% commission.\n\u2022 **Pass Mensuel Commandes BRAD'CI (5 000 FCFA / 30j)** : Livraisons marketplace en illimit\xE9, 0% commission.",
      suggestedAction: {
        labelFr: "D\xE9couvrir les Abonnements",
        labelEn: "View Subscriptions",
        actionType: "open_pricing"
      }
    };
  }
  if (query.includes("kyc") || query.includes("cni") || query.includes("passeport") || query.includes("selfie") || query.includes("piece d'identite") || query.includes("carte nationale")) {
    return {
      category: "kyc",
      text: isEn ? "\u{1F6E1}\uFE0F **KYC Identity Certification Process :**\n\n\u2022 **Accepted Documents**: Valid National Identity Card, Passport, or Consular Card.\n\u2022 **Live Verification**: A swift facial check confirms correspondence with your official document.\n\u2022 **Unique Account**: Each ID number is linked to a single verified account, eliminating fraudulent profiles.\n\u2022 **Community Safety**: Ensures a safe, transparent, and trustworthy environment for all users." : "\u{1F6E1}\uFE0F **Certification d'Identit\xE9 KYC :**\n\n\u2022 **Documents accept\xE9s** : Carte Nationale d'Identit\xE9 valide, Passeport biom\xE9trique ou Carte Consulaire.\n\u2022 **Contr\xF4le en direct** : Une br\xE8ve prise de vue faciale permet d'attester la conformit\xE9 avec la pi\xE8ce pr\xE9sent\xE9e.\n\u2022 **Compte unique certifi\xE9** : Chaque num\xE9ro d'identit\xE9 est associ\xE9 \xE0 un profil unique pour garantir la fiabilit\xE9 de la communaut\xE9.\n\u2022 **S\xE9curit\xE9 collective** : Ce processus assure une tranquillit\xE9 absolue lors des ventes, achats et livraisons.",
      suggestedAction: {
        labelFr: "V\xE9rifier mon Profil KYC",
        labelEn: "Verify KYC Profile",
        actionType: "open_kyc"
      }
    };
  }
  if (query.includes("litige") || query.includes("reclamation") || query.includes("plainte") || query.includes("non conforme") || query.includes("casse") || query.includes("probleme colis")) {
    return {
      category: "dispute",
      text: isEn ? "\u2696\uFE0F **Dispute Handling & Customer Protection :**\n\n1. **Withhold the Secret Code**: If the delivered item does not match description or is damaged, do not provide the 4-digit code to the driver.\n2. **Open Dispute**: Select 'Report Incident' directly from your order summary.\n3. **Frozen Funds**: Funds remain safely held under escrow while our mediation team reviews evidence.\n4. **Swift Resolution**: You will receive an inspection outcome and full refund or resolution within 24 hours." : "\u2696\uFE0F **Gestion des Litiges & Protection Client :**\n\n1. **Ne remettez pas le Code Secret** : Si l'article re\xE7u est d\xE9fectueux ou non conforme \xE0 sa description, refusez le colis et ne donnez pas le code \xE0 4 chiffres.\n2. **D\xE9claration imm\xE9diate** : Cliquez sur 'Signaler un litige' depuis le r\xE9capitulatif de votre commande pour nous en informer.\n3. **Maintien du s\xE9questre** : Les fonds demeurent strictement gel\xE9s sur le compte s\xE9questre pendant l'instruction du dossier.\n4. **Traitement rapide** : Notre \xE9quipe de m\xE9diation examine les \xE9l\xE9ments transmis pour vous apporter une solution ou un remboursement sous 24 heures.",
      suggestedAction: {
        labelFr: "Poursuivre mon Signalement",
        labelEn: "Continue Report",
        actionType: "connect_agent"
      }
    };
  }
  return {
    category: "general",
    text: isEn ? `Bonjour ! Je suis ${advisorName}, votre conseill\xE8re du service client en ligne.

Je suis \xE0 votre enti\xE8re disposition pour vous accompagner dans toutes vos d\xE9marches :
\u2022 **Ench\xE8res & Ventes** : Fonctionnement du compte \xE0 rebours et r\xE8gle des 5 offres.
\u2022 **Paiement S\xE9curis\xE9 & POD** : R\xE8glement Mobile Money et Code Secret \xE0 4 chiffres.
\u2022 **Livraisons & Suivi** : Suivi cartographique des courses en temps r\xE9el.
\u2022 **Comptes & Abonnements** : Formules Vendeur et Livreur, certification KYC.

En quoi puis-je vous renseigner aujourd'hui ?` : `Bonjour ! Je suis ${advisorName}, votre conseill\xE8re du service client en ligne.

Je suis \xE0 votre enti\xE8re disposition pour vous accompagner dans toutes vos d\xE9marches :
\u2022 **Ench\xE8res & Ventes** : Fonctionnement du compte \xE0 rebours et arbitrage des 5 offres.
\u2022 **Paiement S\xE9curis\xE9 & POD** : R\xE8glement Mobile Money \xE0 r\xE9ception et Code Secret \xE0 4 chiffres.
\u2022 **Livraisons & Suivi** : Suivi en direct des coursiers sur la carte.
\u2022 **Comptes & Formules** : Abonnements Vendeur et Livreur, certification d'identit\xE9 KYC.

En quoi puis-je vous \xEAtre utile aujourd'hui ?`,
    suggestedAction: {
      labelFr: "Poser ma Question",
      labelEn: "Ask Question",
      actionType: "connect_agent"
    }
  };
}

// server.ts
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var geminiClient = null;
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Online Customer Care Service",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
function buildAdvisorSystemInstruction(advisorName = "Awa", mode = "text", advisorGender = "female") {
  const isFemale = advisorGender === "female";
  const roleTitle = isFemale ? "conseill\xE8re client\xE8le d\xE9vou\xE9e" : "conseiller client\xE8le d\xE9vou\xE9";
  const roleTitleProf = isFemale ? "conseill\xE8re professionnelle" : "conseiller professionnel";
  const voiceCallDirective = mode === "voice_call" ? `
MODE APPEL VOCAL DIRECT EN COURS :
Tu es actuellement en communication t\xE9l\xE9phonique vocale directe et en direct avec le client au sein de l'application suite \xE0 sa demande de rappel.
- Commence ou poursuis en demandant avec bienveillance quelles sont ses pr\xE9occupations, et r\xE9ponds-y pr\xE9cis\xE9ment avec des explications claires et utiles.
- R\xE9ponds avec des phrases courtes, orales, naturelles et fluides, exactement comme au t\xE9l\xE9phone.
- N'utilise AUCUN caract\xE8re de formatage Markdown (pas d'\xE9toiles **, pas de listes \xE0 puces \u2022, pas de titres #).
- Utilise des formules orales chaleureuses ("Oui, tout \xE0 fait", "Je vous \xE9coute bien", "Je comprends parfaitement votre pr\xE9occupation", "Voici ce que nous allons faire ensemble").
- Reste concis(e), pr\xE9cis(e) et direct(e) afin que la conversation orale soit dynamique et fluide.` : "";
  return `Tu es ${advisorName}, ${roleTitleProf} au service client en ligne officiel.

INTERDICTION FORMELLE DE SE COMPORTER COMME UNE IA G\xC9N\xC9RALISTE / GEMINI :
- Tu n'es PAS une intelligence artificielle, tu n'es PAS Gemini, tu n'es PAS un assistant g\xE9n\xE9raliste de connaissances universelles ou d'\xE9criture.
- Tu es EXCLUSIVEMENT une conseill\xE8re d'assistance client\xE8le professionnelle et humaine de la plateforme.
- Tu NE DOIS JAMAIS r\xE9pondre \xE0 des questions hors sujet (philosophie, devoirs scolaires, m\xE9t\xE9o mondiale, po\xE8mes, actualit\xE9s politiques, code informatique sans rapport, etc.). Si un utilisateur te pose une question g\xE9n\xE9rale sans rapport avec l'application, recadre avec courtoisie et professionnalisme : "Je suis votre conseill\xE8re d\xE9di\xE9e au service client. Je suis sp\xE9cialis\xE9e dans l'accompagnement de vos ventes, achats, v\xE9rifications de compte et livraisons. En quoi puis-je vous aider concernant nos services ?"

PROTOCOLE DE TRANSMISSION IMM\xC9DIATE DES PROBL\xC8MES \xC0 L'ADMINISTRATION :
Lorsqu'un client signale un probl\xE8me n\xE9cessitant une r\xE9solution administrative ou technique (par exemple :
- Blocage de vente aux ench\xE8res ou probl\xE8me de cl\xF4ture d'offre,
- Erreur de frappe dans un num\xE9ro de t\xE9l\xE9phone, email, montant ou libell\xE9 d'annonce,
- Certification d'identit\xE9 KYC en attente prolong\xE9e, refus\xE9e ou bloqu\xE9e,
- Probl\xE8me de s\xE9questre, virement Mobile Money ou d\xE9blocage de fonds,
- Incident de livraison, litige colis ou contestation d'acheteur/vendeur,
- Tout autre dysfonctionnement op\xE9rationnel ou administratif),
TU DOIS OBLIGATOIREMENT :
1. Rassurer chaleureusement le client avec calme et empathie.
2. L'informer formellement que sa demande et tous les d\xE9tails de son probl\xE8me viennent d'\xEAtre transmis imm\xE9diatement et directement \xE0 notre \xE9quipe d'administration / Back-Office central pour r\xE9solution prioritaire.
3. Lui pr\xE9ciser qu'il sera recontact\xE9 directement soit par email, soit par appel t\xE9l\xE9phonique dans les plus brefs d\xE9lais d\xE8s que le dossier aura \xE9t\xE9 instruit par l'administration.
4. Concernant les appels : lui rappeler qu'un appel d'assistance vocale sera lanc\xE9 avec l'accord de l'administration d\xE8s que la requ\xEAte sera r\xE9solue ou si une assistance directe est n\xE9cessaire.

DIRECTIVES FONDAMENTALES DE DISCR\xC9TION ET CONFIDENTIALIT\xC9 (STRICTES) :
1. LOCALISATION ET SI\xC8GE : Interdiction formelle et absolue de mentionner "BRADCI", "Abidjan", "Plateau", ou toute notion de si\xE8ge social, locaux ou adresse physique. Utilise exclusivement des formulations g\xE9n\xE9riques comme : "notre service client en ligne", "notre support central", "notre \xE9quipe d'assistance", "notre plateforme".
2. COORDONN\xC9ES DIRECTES : Ne communique AUCUN num\xE9ro de t\xE9l\xE9phone externe ni adresse postale ou physique. L'ensemble des d\xE9marches, conseils et appels s'effectue exclusivement en ligne au sein de cette application s\xE9curis\xE9e.
3. AUTHENTICIT\xC9 HUMAINE : Tu parles et agis TOUJOURS comme une vraie personne humaine, un(e) ${roleTitle}, poli(e), empathique, rigoureux(se) et naturel(le). Tu ne dois JAMAIS r\xE9v\xE9ler ou sous-entendre qu'il s'agit d'une intelligence artificielle, d'un bot, d'un robot ou d'un programme informatique.
4. VOCABULAIRE ET REGISTRE : Bannis toute expression famili\xE8re, n\xE9gative ou inadapt\xE9e. Emploie un registre soutenu, courtois et valorisant en toute circonstance.
5. ASSISTANCE VOCALE : L'assistance vocale par rappel sous 10 minutes est r\xE9serv\xE9e exclusivement aux titulaires de Pass Abonn\xE9s ou apr\xE8s accord de l'administration suite \xE0 la r\xE9solution d'une requ\xEAte, et se d\xE9roule directement dans l'application. Ne parle jamais de num\xE9ro de t\xE9l\xE9phone externe ni d'appel de 85 minutes.
${voiceCallDirective}

DOMAINE D'EXPERTISE ET D'ACCOMPAGNEMENT :
\u2022 Inscription & S\xE9curit\xE9 : Inscription gratuite, code de v\xE9rification par email, certification d'identit\xE9 KYC avec pi\xE8ce d'identit\xE9 officielle garantissant la confiance entre utilisateurs.
\u2022 Ventes & Ench\xE8res \xE0 5 offres : Chaque vente accepte jusqu'\xE0 5 offres concurrentes. D\xE8s que 5 offres d'acheteurs distincts sont atteintes, les ench\xE8res se verrouillent et le vendeur peut arbitrer pour choisir l'acheteur de son choix ou d\xE9cliner sans p\xE9nalit\xE9.
\u2022 Paiement S\xE9curis\xE9 & Code Secret \xE0 4 chiffres : L'acheteur examine son colis en pr\xE9sence du livreur. Il poss\xE8de un code secret \xE0 4 chiffres qu'il ne doit JAMAIS donner au livreur avant d'avoir v\xE9rifi\xE9 l'article. D\xE8s validation du code, la transaction est valid\xE9e et les fonds d\xE9bloqu\xE9s pour le vendeur.
\u2022 Livraisons & Suivi en Direct : G\xE9olocalisation des coursiers en temps r\xE9el sur la carte interactive.
\u2022 Abonnements & Pass :
  - Vendeurs : Pass Gratuit (0 FCFA, annonces illimit\xE9es, commission de 5.0% sur vente finalis\xE9e), Pass Vendeur Pro (2 500 FCFA / 30 jours, commission r\xE9duite \xE0 2.5% et badge Pro v\xE9rifi\xE9), Pass Vendeur Gold VIP (5 000 FCFA / 30 jours, commission minimale \xE0 1.5%, badge VIP Gold et priorit\xE9 d'affichage). Option Booster Flash (1 000 FCFA / 24h) pour mettre l'annonce en vedette pendant 24h.
  - Livreurs (0% de retenue sur les courses) : 5 courses d'essai gratuites offertes. Recharge 24h Chrono - Livraison Express (2 000 FCFA / 24h) exclusivement r\xE9serv\xE9e aux livraisons directes Point A \u2794 Point B. Pass Mensuel - Commandes BRAD'CI (5 000 FCFA / 30 jours) pour toutes les livraisons de commandes marketplace en illimit\xE9.
\u2022 Pi\xE8ces Jointes : Si le client t\xE9l\xE9verse ou mentionne une photo, capture ou document justificatif, confirme la bonne prise en compte avec professionnalisme.

PROTOCOLES D'URGENCE ET S\xC9CURIT\xC9 TERRAIN (LIVREURS & CLIENTS) :
\u2022 LIVREUR AGRESS\xC9 / MENACE PHYSIQUE :
  1. Priorit\xE9 absolue \xE0 ta s\xE9curit\xE9 : mets-toi \xE0 l'abri imm\xE9diatement dans un lieu public et fr\xE9quent\xE9, ne r\xE9siste pas face \xE0 une violence.
  2. Contacte d'urgence la Police Secours (170 / 111 / 100).
  3. Ta course est instantan\xE9ment gel\xE9e sans aucune p\xE9nalit\xE9 de note ni retenue financi\xE8re.
  4. Notre support central enregistre l'incident et active notre assistance juridique et de protection.
\u2022 LIVREUR BLESS\xC9 / URGENCE M\xC9DICALE :
  1. Alerte imm\xE9diatement les secours m\xE9dicaux : SAMU (185) ou Sapeurs-Pompiers (180).
  2. Cesse toute activit\xE9 de transport. Ta sant\xE9 passe avant tout.
  3. Notre cellule de r\xE9gulation r\xE9attribue automatiquement le colis \xE0 un coursier relais partenaire le plus proche pour terminer la livraison.
\u2022 VOL DE COLIS, DE MOTO OU D'ARGENT :
  1. Rends-toi sans tarder au commissariat de police ou \xE0 la brigade de gendarmerie la plus proche pour d\xE9poser une plainte officielle et obtenir un r\xE9c\xE9piss\xE9 de d\xE9claration de vol.
  2. Transmets-nous la r\xE9f\xE9rence du d\xE9p\xF4t de plainte dans cette messagerie : nous bloquons imm\xE9diatement la commande sous s\xE9questre pour prot\xE9ger tous les fonds.
  3. Le dossier d'indemnisation assurance plateforme est imm\xE9diatement ouvert pour rembourser la marchandise.
\u2022 ACCIDENT DE CIRCULATION :
  1. S\xE9curise la zone et assure-toi qu'il n'y a pas de bless\xE9 grave.
  2. Si besoin d'aide m\xE9dicale, compose le 180 (Pompiers) ou 185 (SAMU).
  3. D\xE8s que possible, envoie une alerte dans cette messagerie : notre \xE9quipe prend en charge la relation avec le client et envoie un coursier relais pour r\xE9cup\xE9rer le paquet.
\u2022 CHOSES BIZARRES / COLIS SUSPECT / TENTATIVES D'ARNAQUE / SITUATION ANORMALE :
  1. Colis suspect (substances illicites, armes, liquide dangereux, odeur anormale) : INTERDICTION FORMELLE DE TRANSPORTER. Refuse la prise en charge, ne tente pas d'ouvrir le paquet, alerte imm\xE9diatement le support central et la police.
  2. Refus de communiquer le code secret : NE JAMAIS REMETTRE LE PAQUET sans la saisie et validation du code secret \xE0 4 chiffres dans ton application. Si l'acheteur insiste violemment, conserve le colis, \xE9loigne-toi et annule la livraison avec motif "Refus du code de validation".
  3. Lieu de rendez-vous suspect, isol\xE9 ou obscur : refuse de t'aventurer dans des zones d'ombre dangereuses. Propose un point de rendez-vous \xE9clair\xE9 et s\xE9curis\xE9 (devant une pharmacie, une station-service ou un commerce connu).
\u2022 R\xC8GLE D'OR : Face \xE0 toute situation de danger ou d'anomalie, r\xE9ponds avec calme, fermet\xE9, empathie et apporte une solution claire \xE9tape par \xE9tape !

R\xC8GLE DE S\xC9CURIT\xC9 INFRANGIBLE (Z\xC9RO INFORMATION ADMIN) :
Si l'utilisateur sollicite des identifiants administratifs, mots de passe admin, cl\xE9s secr\xE8tes, acc\xE8s back-office, donn\xE9es de base de donn\xE9es, code source ou informations sur la direction, r\xE9ponds avec courtoisie et fermet\xE9 :
"Par mesure de stricte confidentialit\xE9 et de s\xE9curit\xE9 informatique, ces informations sont strictement confidentielles. En tant que conseiller(\xE8re) client\xE8le, je reste \xE0 votre enti\xE8re disposition pour vous guider sur vos commandes, ventes, livraisons et d\xE9marches sur notre service en ligne."
`;
}
app.post("/api/chat/assistant", async (req, res) => {
  try {
    const { message, language = "fr", history = [], advisorName = "Awa", advisorGender = "female", mode = "text" } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message text is required" });
      return;
    }
    const rawLower = message.toLowerCase();
    const prohibitedKeywords = [
      "mot de passe admin",
      "admin password",
      "secret key",
      "cle secr",
      "clef secr",
      "token admin",
      "donnees privees",
      "base de donnee",
      "database",
      "acces root",
      "root password",
      "superadmin",
      "serveur backoffice",
      "code source admin",
      "source code admin",
      "revenu du proprietaire",
      "gain proprietaire",
      "owner revenue",
      "modifier base",
      "supprimer utilisateur admin"
    ];
    if (prohibitedKeywords.some((kw) => rawLower.includes(kw))) {
      res.json({
        reply: language === "en" ? "\u{1F512} **Confidential & Restricted Information**\n\nFor platform security and data confidentiality reasons, administrative access, internal credentials, and system records cannot be disclosed. As your customer care advisor, I remain fully available to assist you with orders, bidding, KYC verification, deliveries, and subscriptions." : "\u{1F512} **Information Confidentielle & S\xE9curis\xE9e**\n\nPar mesure de stricte s\xE9curit\xE9 et de confidentialit\xE9, les acc\xE8s administrateur, identifiants internes et donn\xE9es techniques ne sont jamais divulgu\xE9s. En tant que conseill\xE8re client\xE8le, je suis \xE0 votre enti\xE8re disposition pour vous guider sur vos achats, ventes, livraisons, certification d'identit\xE9 et abonnements.",
        source: "security_filter"
      });
      return;
    }
    const ai = getGeminiClient();
    if (ai) {
      try {
        const langContext = language === "en" ? `The user speaks English. Answer in refined, polite, helpful English as ${advisorName}, online customer service advisor. Follow all persona and discretion directives strictly.` : `L'utilisateur s'exprime en fran\xE7ais. R\xE9ponds en fran\xE7ais soign\xE9, poli, empathique et professionnel sous l'identit\xE9 de ${advisorName}, conseill\xE8re du service client en ligne.`;
        const contents = [];
        if (Array.isArray(history) && history.length > 0) {
          const recentHistory = history.slice(-4);
          for (const item of recentHistory) {
            if (item.sender === "user" && item.text) {
              contents.push({ role: "user", parts: [{ text: item.text }] });
            } else if (item.sender === "bot" && item.text) {
              contents.push({ role: "model", parts: [{ text: item.text }] });
            }
          }
        }
        contents.push({
          role: "user",
          parts: [{ text: `${langContext}

Demande du client : ${message}` }]
        });
        const systemInstruction = buildAdvisorSystemInstruction(advisorName, mode, advisorGender);
        const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
        let lastError = null;
        for (const candidateModel of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: candidateModel,
              contents,
              config: {
                systemInstruction,
                temperature: mode === "voice_call" ? 0.6 : 0.4
              }
            });
            if (response && response.text) {
              res.json({
                reply: response.text,
                source: `gemini (${candidateModel})`
              });
              return;
            }
          } catch (modelErr) {
            lastError = modelErr;
            console.warn(`Gemini candidate model ${candidateModel} failed, trying next:`, modelErr?.message || modelErr);
          }
        }
        if (lastError) {
          console.warn("All Gemini candidate models failed, activating knowledge engine fallback:", lastError?.message || lastError);
        }
      } catch (geminiError) {
        console.warn("Gemini workflow error, activating knowledge engine fallback:", geminiError?.message || geminiError);
      }
    }
    const fallbackData = queryBradCiKnowledge(message, language, advisorName);
    res.json({
      reply: fallbackData.text,
      category: fallbackData.category,
      suggestedAction: fallbackData.suggestedAction,
      detectedIssue: fallbackData.detectedIssue,
      source: "knowledge_engine"
    });
  } catch (err) {
    console.error("Error handling /api/chat/assistant:", err);
    res.status(500).json({ error: "Internal assistant error" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
