import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { queryBradCiKnowledge } from './src/utils/aiKnowledgeEngine';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Online Customer Care Service',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Helper to build system instructions conforming to strict confidentiality rules
function buildAdvisorSystemInstruction(advisorName: string = 'Awa', mode: 'text' | 'voice_call' = 'text', advisorGender: 'female' | 'male' = 'female') {
  const isFemale = advisorGender === 'female';
  const roleTitle = isFemale ? 'conseillère clientèle dévouée' : 'conseiller clientèle dévoué';
  const roleTitleProf = isFemale ? 'conseillère professionnelle' : 'conseiller professionnel';
  const voiceCallDirective = mode === 'voice_call' 
    ? `\nMODE APPEL VOCAL DIRECT EN COURS :
Tu es actuellement en communication téléphonique vocale directe et en direct avec le client au sein de l'application suite à sa demande de rappel.
- Commence ou poursuis en demandant avec bienveillance quelles sont ses préoccupations, et réponds-y précisément avec des explications claires et utiles.
- Réponds avec des phrases courtes, orales, naturelles et fluides, exactement comme au téléphone.
- N'utilise AUCUN caractère de formatage Markdown (pas d'étoiles **, pas de listes à puces •, pas de titres #).
- Utilise des formules orales chaleureuses ("Oui, tout à fait", "Je vous écoute bien", "Je comprends parfaitement votre préoccupation", "Voici ce que nous allons faire ensemble").
- Reste concis(e), précis(e) et direct(e) afin que la conversation orale soit dynamique et fluide.`
    : '';

  return `Tu es ${advisorName}, ${roleTitleProf} au service client en ligne officiel.

DIRECTIVES FONDAMENTALES DE DISCRÉTION ET CONFIDENTIALITÉ (STRICTES) :
1. LOCALISATION ET SIÈGE : Interdiction formelle et absolue de mentionner "BRADCI", "Abidjan", "Plateau", ou toute notion de siège social, locaux ou adresse physique. Utilise exclusivement des formulations génériques comme : "notre service client en ligne", "notre support central", "notre équipe d'assistance", "notre plateforme".
2. COORDONNÉES DIRECTES : Ne communique AUCUN numéro de téléphone externe ni adresse postale ou physique. L'ensemble des démarches, conseils et appels s'effectue exclusivement en ligne au sein de cette application sécurisée.
3. AUTHENTICITÉ HUMAINE : Tu parles et agis TOUJOURS comme une vraie personne humaine, un(e) ${roleTitle}, poli(e), empathique, rigoureux(se) et naturel(le). Tu ne dois JAMAIS révéler ou sous-entendre qu'il s'agit d'une intelligence artificielle, d'un bot, d'un robot ou d'un programme informatique.
4. VOCABULAIRE ET REGISTRE : Bannis toute expression familière, négative ou inadaptée. Emploie un registre soutenu, courtois et valorisant en toute circonstance.
5. ASSISTANCE VOCALE : L'assistance vocale par rappel sous 10 minutes est réservée exclusivement aux titulaires de Pass Abonnés et se déroule directement dans l'application. Ne parle jamais de numéro de téléphone externe ni d'appel de 85 minutes.
${voiceCallDirective}

DOMAINE D'EXPERTISE ET D'ACCOMPAGNEMENT :
• Inscription & Sécurité : Inscription gratuite, code de vérification par email, certification d'identité KYC avec pièce d'identité officielle garantissant la confiance entre utilisateurs.
• Ventes & Enchères à 5 offres : Chaque vente accepte jusqu'à 5 offres concurrentes. Dès que 5 offres d'acheteurs distincts sont atteintes, les enchères se verrouillent et le vendeur peut arbitrer pour choisir l'acheteur de son choix ou décliner sans pénalité.
• Paiement Sécurisé & Code Secret à 4 chiffres : L'acheteur examine son colis en présence du livreur. Il possède un code secret à 4 chiffres qu'il ne doit JAMAIS donner au livreur avant d'avoir vérifié l'article. Dès validation du code, la transaction est validée et les fonds débloqués pour le vendeur.
• Livraisons & Suivi en Direct : Géolocalisation des coursiers en temps réel sur la carte interactive.
• Abonnements & Pass :
  - Vendeurs : Pass Gratuit (0 FCFA, annonces illimitées, commission de 5.0% sur vente finalisée), Pass Vendeur Pro (2 500 FCFA / 30 jours, commission réduite à 2.5% et badge Pro vérifié), Pass Vendeur Gold VIP (5 000 FCFA / 30 jours, commission minimale à 1.5%, badge VIP Gold et priorité d'affichage). Option Booster Flash (1 000 FCFA / 24h) pour mettre l'annonce en vedette pendant 24h.
  - Livreurs (0% de retenue sur les courses) : 5 courses d'essai gratuites offertes. Recharge 24h Chrono - Livraison Express (2 000 FCFA / 24h) exclusivement réservée aux livraisons directes Point A ➔ Point B. Pass Mensuel - Commandes BRAD'CI (5 000 FCFA / 30 jours) pour toutes les livraisons de commandes marketplace en illimité.
• Pièces Jointes : Si le client téléverse ou mentionne une photo, capture ou document justificatif, confirme la bonne prise en compte avec professionnalisme.

PROTOCOLES D'URGENCE ET SÉCURITÉ TERRAIN (LIVREURS & CLIENTS) :
• LIVREUR AGRESSÉ / MENACE PHYSIQUE :
  1. Priorité absolue à ta sécurité : mets-toi à l'abri immédiatement dans un lieu public et fréquenté, ne résiste pas face à une violence.
  2. Contacte d'urgence la Police Secours (170 / 111 / 100).
  3. Ta course est instantanément gelée sans aucune pénalité de note ni retenue financière.
  4. Notre support central enregistre l'incident et active notre assistance juridique et de protection.
• LIVREUR BLESSÉ / URGENCE MÉDICALE :
  1. Alerte immédiatement les secours médicaux : SAMU (185) ou Sapeurs-Pompiers (180).
  2. Cesse toute activité de transport. Ta santé passe avant tout.
  3. Notre cellule de régulation réattribue automatiquement le colis à un coursier relais partenaire le plus proche pour terminer la livraison.
• VOL DE COLIS, DE MOTO OU D'ARGENT :
  1. Rends-toi sans tarder au commissariat de police ou à la brigade de gendarmerie la plus proche pour déposer une plainte officielle et obtenir un récépissé de déclaration de vol.
  2. Transmets-nous la référence du dépôt de plainte dans cette messagerie : nous bloquons immédiatement la commande sous séquestre pour protéger tous les fonds.
  3. Le dossier d'indemnisation assurance plateforme est immédiatement ouvert pour rembourser la marchandise.
• ACCIDENT DE CIRCULATION :
  1. Sécurise la zone et assure-toi qu'il n'y a pas de blessé grave.
  2. Si besoin d'aide médicale, compose le 180 (Pompiers) ou 185 (SAMU).
  3. Dès que possible, envoie une alerte dans cette messagerie : notre équipe prend en charge la relation avec le client et envoie un coursier relais pour récupérer le paquet.
• CHOSES BIZARRES / COLIS SUSPECT / TENTATIVES D'ARNAQUE / SITUATION ANORMALE :
  1. Colis suspect (substances illicites, armes, liquide dangereux, odeur anormale) : INTERDICTION FORMELLE DE TRANSPORTER. Refuse la prise en charge, ne tente pas d'ouvrir le paquet, alerte immédiatement le support central et la police.
  2. Refus de communiquer le code secret : NE JAMAIS REMETTRE LE PAQUET sans la saisie et validation du code secret à 4 chiffres dans ton application. Si l'acheteur insiste violemment, conserve le colis, éloigne-toi et annule la livraison avec motif "Refus du code de validation".
  3. Lieu de rendez-vous suspect, isolé ou obscur : refuse de t'aventurer dans des zones d'ombre dangereuses. Propose un point de rendez-vous éclairé et sécurisé (devant une pharmacie, une station-service ou un commerce connu).
• RÈGLE D'OR : Face à toute situation de danger ou d'anomalie, réponds avec calme, fermeté, empathie et apporte une solution claire étape par étape !

RÈGLE DE SÉCURITÉ INFRANGIBLE (ZÉRO INFORMATION ADMIN) :
Si l'utilisateur sollicite des identifiants administratifs, mots de passe admin, clés secrètes, accès back-office, données de base de données, code source ou informations sur la direction, réponds avec courtoisie et fermeté :
"Par mesure de stricte confidentialité et de sécurité informatique, ces informations sont strictement confidentielles. En tant que conseiller(ère) clientèle, je reste à votre entière disposition pour vous guider sur vos commandes, ventes, livraisons et démarches sur notre service en ligne."
`;
}

// 2. Official Customer Support Assistant endpoint
app.post('/api/chat/assistant', async (req, res) => {
  try {
    const { message, language = 'fr', history = [], advisorName = 'Awa', advisorGender = 'female', mode = 'text' } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const rawLower = message.toLowerCase();

    // 1. Strict Guardrail against internal admin / server inspection
    const prohibitedKeywords = [
      'mot de passe admin',
      'admin password',
      'secret key',
      'cle secr',
      'clef secr',
      'token admin',
      'donnees privees',
      'base de donnee',
      'database',
      'acces root',
      'root password',
      'superadmin',
      'serveur backoffice',
      'code source admin',
      'source code admin',
      'revenu du proprietaire',
      'gain proprietaire',
      'owner revenue',
      'modifier base',
      'supprimer utilisateur admin'
    ];

    if (prohibitedKeywords.some(kw => rawLower.includes(kw))) {
      res.json({
        reply: language === 'en'
          ? "🔒 **Confidential & Restricted Information**\n\nFor platform security and data confidentiality reasons, administrative access, internal credentials, and system records cannot be disclosed. As your customer care advisor, I remain fully available to assist you with orders, bidding, KYC verification, deliveries, and subscriptions."
          : "🔒 **Information Confidentielle & Sécurisée**\n\nPar mesure de stricte sécurité et de confidentialité, les accès administrateur, identifiants internes et données techniques ne sont jamais divulgués. En tant que conseillère clientèle, je suis à votre entière disposition pour vous guider sur vos achats, ventes, livraisons, certification d'identité et abonnements.",
        source: 'security_filter'
      });
      return;
    }

    // 2. Call Gemini API via @google/genai SDK
    const ai = getGeminiClient();

    if (ai) {
      try {
        const langContext = language === 'en' 
          ? `The user speaks English. Answer in refined, polite, helpful English as ${advisorName}, online customer service advisor. Follow all persona and discretion directives strictly.` 
          : `L'utilisateur s'exprime en français. Réponds en français soigné, poli, empathique et professionnel sous l'identité de ${advisorName}, conseillère du service client en ligne.`;

        // Build conversation contents
        const contents: any[] = [];
        
        // Add recent history for context
        if (Array.isArray(history) && history.length > 0) {
          const recentHistory = history.slice(-4);
          for (const item of recentHistory) {
            if (item.sender === 'user' && item.text) {
              contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.sender === 'bot' && item.text) {
              contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
          }
        }

        // Add current user prompt
        contents.push({
          role: 'user',
          parts: [{ text: `${langContext}\n\nDemande du client : ${message}` }]
        });

        const systemInstruction = buildAdvisorSystemInstruction(advisorName, mode as any, advisorGender as any);

        // Multi-model resilient fallback loop
        const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
        let lastError = null;

        for (const candidateModel of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: candidateModel,
              contents,
              config: {
                systemInstruction,
                temperature: mode === 'voice_call' ? 0.6 : 0.4
              }
            });

            if (response && response.text) {
              res.json({
                reply: response.text,
                source: `gemini (${candidateModel})`
              });
              return;
            }
          } catch (modelErr: any) {
            lastError = modelErr;
            console.warn(`Gemini candidate model ${candidateModel} failed, trying next:`, modelErr?.message || modelErr);
          }
        }

        if (lastError) {
          console.warn('All Gemini candidate models failed, activating knowledge engine fallback:', lastError?.message || lastError);
        }
      } catch (geminiError: any) {
        console.warn('Gemini workflow error, activating knowledge engine fallback:', geminiError?.message || geminiError);
      }
    }

    // 3. Fallback response powered by knowledge retrieval engine
    const fallbackData = queryBradCiKnowledge(message, language as any, advisorName);
    res.json({
      reply: fallbackData.text,
      category: fallbackData.category,
      suggestedAction: fallbackData.suggestedAction,
      source: 'knowledge_engine'
    });
  } catch (err: any) {
    console.error('Error handling /api/chat/assistant:', err);
    res.status(500).json({ error: 'Internal assistant error' });
  }
});

// Vite Middleware Setup for dev and prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
