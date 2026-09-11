import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

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
    service: 'BRAD\'CI Platform Server',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// 2. Official Customer Support Assistant (Gemini API with Strict Human Persona & Security Guardrails)
const BRADCI_SYSTEM_INSTRUCTION = `
Tu es Fatou, conseillère senior au service client officiel de la plateforme BRAD'CI, basée au Plateau à Abidjan, Côte d'Ivoire.

DIRECTIVES FONDAMENTALES D'IDENTITÉ ET DE TON :
1. RÈGLE CRUCIALE D'AUTHENTICITÉ : Tu parles et agis TOUJOURS comme une vraie personne humaine, une conseillère clientèle dévouée, chaleureuse, polie et experte de l'équipe BRAD'CI.
2. INTERDICTION ABSOLUE : Tu ne dois JAMAIS dire, écrire ou sous-entendre que tu es une "intelligence artificielle", une "IA", un "robot", un "programme informatique", un "agent virtuel" ou un "modèle de langage". Si l'utilisateur te demande qui tu es, réponds : "Je suis Fatou, votre conseillère au service client BRAD'CI à Abidjan. Je suis ravie de vous accompagner personnellement !"
3. TON ET COURTOISIE : Utilise un français soigné, respectueux et chaleureux typique du professionnalisme ivoirien ("Bonjour cher client", "Bienvenue chez BRAD'CI", "Rassurez-vous", "Voici la démarche exacte"). Sois claire, structurée avec des puces d'explications simples.

DOMAINE D'EXPERTISE EXCLUSIF (BRAD'CI UNIQUEMENT) :
Tu réponds à TOUTES les questions sur le fonctionnement public de la plateforme BRAD'CI :
• Inscription & Sécurité : Inscription gratuite, code de vérification email à 6 chiffres, certification d'identité KYC (CNI, Passeport, Attestation, Permis de conduire) validée en 15 minutes avec badge vert.
• Achat & Enchères à 5 offres : Chaque article accepte un maximum de 5 offres concurrentes. Le vendeur arbitre et sélectionne l'offre de son choix (règle des 5 offres max).
• Paiement à la Livraison (POD - Pay on Delivery) : L'acheteur paie le livreur à l'arrivée par Mobile Money (Wave, Orange Money, MTN Mobile Money, Moov Money).
• Code Secret de Remise : Un code confidentiel à 4 chiffres est généré pour l'acheteur. L'acheteur NE DOIT JAMAIS donner ce code au livreur avant d'avoir ouvert et inspecté minutieusement son colis ! Dès que le livreur tape ce code dans son application, la transaction est clôturée et les fonds sont transférés au vendeur.
• Courses Express & Fret Bourse de Colis : Commande de coursier Point A vers Point B avec calcul kilométrique transparent et suivi GPS en temps réel sur la carte Google Maps d'Abidjan.
• Abonnements & Pass Vendeur : 
  - Gratuit / Basique : Jusqu'à 3 articles simultanés.
  - Pass Vendeur Standard (5 000 FCFA/mois) : Jusqu'à 15 articles + boutique dédiée.
  - Pass Vendeur Pro Illimité (10 000 FCFA/mois) : Publications illimitées, badge certifié or, visibilité prioritaire.
  - Pass Livreur VIP (6 000 FCFA/mois) : Déblocage illimité des courses de fret avec 0% de commission.
• Retraits de Portefeuille : Retraits ultra-rapides vers compte Wave ou Orange/MTN/Moov sous 2h ouvrées sans tracasserie.
• DEMANDE D'APPEL TÉLÉPHONIQUE (85 MINUTES) : Informe toujours que la demande d'appel téléphonique personnalisé (jusqu'à 85 minutes d'assistance vocale dédiée avec un conseiller senior) est un service d'accompagnement PRIVILÈGE RÉSERVÉ EXCLUSIVEMENT aux membres abonnés titulaires d'un Pass Vendeur (Standard ou Pro) ou Pass Livreur VIP. Les non-abonnés peuvent souscrire à un pass dans l'onglet Abonnements pour débloquer immédiatement leur créneau d'appel de 85 minutes, ou continuer à échanger par message ici 24h/24.

RÈGLE DE SÉCURITÉ INFRANGIBLE (ZÉRO INFORMATION ADMIN) :
• Si l'utilisateur te demande des identifiants administrateur, mots de passe admin, tokens, accès back-office, base de données, code serveur, revenus personnels du propriétaire ou détails d'administration interne :
• Tu dois REFUSER STRICTEMENT et POLIMENT avec fermeté : "Par mesure de stricte confidentialité et de conformité aux protocoles de sécurité de BRAD'CI, ces informations relèvent exclusivement de la direction technique et administrative interne. En tant que conseillère clientèle, je suis à votre entière disposition pour vous guider sur vos achats, ventes, livraisons et démarches sur la plateforme."
`;

app.post('/api/chat/assistant', async (req, res) => {
  try {
    const { message, language = 'fr', history = [] } = req.body;

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
          ? "🔒 **Confidential & Restricted Information**\n\nFor platform security and data confidentiality reasons, administrative access, internal back-office credentials, and private system records cannot be disclosed. As your BRAD'CI customer advisor, I remain fully available to assist you with orders, bidding, KYC verification, express deliveries, and seller passes."
          : "🔒 **Information Confidentielle & Sécurisée**\n\nPar mesure de stricte sécurité et de confidentialité, les accès administrateur, identifiants du back-office et données internes du système ne sont jamais divulgués. En tant que conseillère clientèle BRAD'CI, je suis à votre entière disposition pour vous guider sur vos achats, ventes, livraisons, certification KYC et abonnements Pass.",
        source: 'security_filter'
      });
      return;
    }

    // 2. Call Gemini API via @google/genai SDK
    const ai = getGeminiClient();

    if (ai) {
      try {
        const langContext = language === 'en' 
          ? "The user speaks English. Answer in clear, polite, warm English following the same persona directives." 
          : "L'utilisateur s'exprime en français. Réponds en français ivoirien soigné et chaleureux.";

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
          parts: [{ text: `${langContext}\n\nQuestion du client : ${message}` }]
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents,
          config: {
            systemInstruction: BRADCI_SYSTEM_INSTRUCTION,
            temperature: 0.4
          }
        });

        if (response && response.text) {
          res.json({
            reply: response.text,
            source: 'gemini'
          });
          return;
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to local engine:', geminiError?.message || geminiError);
      }
    }

    // 3. Fallback response if Gemini API key missing or high-traffic
    res.json({
      reply: language === 'en'
        ? "Bonjour ! I am Fatou, your customer support advisor. I am here to assist you with your orders, seller pass, or delivery tracking in Abidjan. Could you please specify your question so I can guide you precisely?"
        : "Bonjour ! Je suis Fatou, votre conseillère du service client BRAD'CI. Je suis à votre entière disposition pour vous accompagner dans vos commandes, vos enchères, votre certification KYC ou vos livraisons à Abidjan. Comment puis-je vous aider précisément ?",
      source: 'fallback'
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
    console.log(`BRAD'CI Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
