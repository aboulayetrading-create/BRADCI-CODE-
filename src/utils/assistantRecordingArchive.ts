import { UserRole } from '../types';

export interface RecordedChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string; // HH:mm or ISO
  attachmentName?: string;
}

export interface AssistantConversationArchive {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  userRole: UserRole;
  advisorName: string;
  advisorRole: string;
  startedAt: string; // ISO
  lastMessageAt: string; // ISO
  date?: string;
  time?: string;
  ipAddress: string;
  commune: string;
  city: string;
  country: string;
  gpsCoords: { lat: number; lng: number };
  gpsCoordinates?: { lat: number; lng: number };
  isp: string;
  networkType: '4G LTE' | '5G' | 'Fibre Optique' | 'Wi-Fi';
  device: string;
  deviceFingerprint?: string;
  browser: string;
  messagesCount: number;
  messages: RecordedChatMessage[];
  status: 'active' | 'closed';
  detectedIssue?: string;
  detectedIssues?: string[];
  resolvedByAdmin?: boolean;
}

export interface AssistantCallArchive {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  userRole: UserRole;
  advisorName: string;
  advisorRole: string;
  callType: 'incoming_callback' | 'vip_call' | 'support_ticket_call' | 'emergency_call' | 'direct_voice_assistant';
  startedAt: string; // ISO
  endedAt: string; // ISO
  date?: string;
  time?: string;
  durationSeconds: number;
  durationFormatted: string; // e.g. "04:18"
  status: 'completed' | 'missed' | 'in_progress';
  ipAddress: string;
  commune: string;
  city: string;
  gpsCoords: { lat: number; lng: number };
  gpsCoordinates?: { lat: number; lng: number };
  isp: string;
  networkType: '4G LTE' | '5G' | 'Fibre Optique' | 'Wi-Fi';
  device: string;
  deviceFingerprint?: string;
  browser: string;
  subject: string;
  transcript: Array<{
    sender: 'advisor' | 'user';
    speaker?: 'client' | 'advisor';
    speakerName?: string;
    text: string;
    time?: string;
    timestamp?: string;
  }>;
  audioSimulatedWaveData?: number[];
  adminNotes?: string;
  adminAuthorizationId?: string;
}

const CONVERSATIONS_STORAGE_KEY = 'bradci_assistant_conversation_logs_v1';
const CALLS_STORAGE_KEY = 'bradci_assistant_call_records_v1';

// Seed conversations for realism
const INITIAL_CONVERSATIONS: AssistantConversationArchive[] = [
  {
    id: 'conv-rec-8801',
    userId: 'usr-101',
    userName: 'Koffi Jean-Luc',
    userPhone: '+225 07 48 92 11 34',
    userEmail: 'koffi.jeanluc@gmail.com',
    userRole: 'client',
    advisorName: 'Awa Coulibaly',
    advisorRole: 'Responsable Enchères & Litiges Marchands',
    startedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ipAddress: '41.202.144.78',
    commune: 'Cocody',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    gpsCoords: { lat: 5.3599, lng: -3.9870 },
    isp: 'Orange Côte d\'Ivoire (AS36980)',
    networkType: '4G LTE',
    device: 'Android 14 (Samsung Galaxy S24 Ultra)',
    browser: 'Chrome Mobile 128.0',
    messagesCount: 8,
    status: 'closed',
    detectedIssue: 'Blocage enchère et vérification solde Wave',
    resolvedByAdmin: true,
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Bonjour Awa, mon enchère sur le lot de smartphones reste bloquée alors que mon solde Wave a été débité.',
        timestamp: '14:22'
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        text: 'Bonjour Monsieur Koffi, je vous rassure immédiatement. Votre transaction Wave a bien été enregistrée sous séquestre sécurisé. Je vérifie avec la cellule technique.',
        timestamp: '14:23'
      },
      {
        id: 'msg-3',
        sender: 'user',
        text: 'D\'accord merci, pouvez-vous débloquer l\'offre avant la fin du compte à rebours ?',
        timestamp: '14:25'
      },
      {
        id: 'msg-4',
        sender: 'assistant',
        text: 'Absolument. Votre offre de 180 000 FCFA est maintenant prioritaire et validée par le système. Vous avez reçu le récépissé par notification.',
        timestamp: '14:27'
      }
    ]
  },
  {
    id: 'conv-rec-8802',
    userId: 'usr-102',
    userName: 'Bamba Salimata',
    userPhone: '+225 05 74 12 88 90',
    userEmail: 'salimata.bamba@yahoo.fr',
    userRole: 'client',
    advisorName: 'Mariam Koné',
    advisorRole: 'Spécialiste KYC & Comptes Vendeurs',
    startedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    ipAddress: '160.154.99.23',
    commune: 'Plateau',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    gpsCoords: { lat: 5.3261, lng: -4.0197 },
    isp: 'MTN Côte d\'Ivoire (AS29465)',
    networkType: 'Fibre Optique',
    device: 'iOS 18.0 (iPhone 15 Pro Max)',
    browser: 'Safari Mobile 18.0',
    messagesCount: 6,
    status: 'closed',
    detectedIssue: 'Vérification biométrique KYC en attente',
    resolvedByAdmin: true,
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Bonjour, j\'ai envoyé ma CNI hier soir pour publier ma boutique de vêtements mais le statut reste En attente.',
        timestamp: '13:10'
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        text: 'Bonjour Madame Bamba. Je vois bien votre document CNI recto-verso. La pièce est très nette, je transmets pour validation immédiate.',
        timestamp: '13:12'
      },
      {
        id: 'msg-3',
        sender: 'assistant',
        text: 'C\'est fait ! Votre badge Marchand Certifié BRAD\'CI est activé. Vous pouvez dès maintenant publier vos articles en illimité.',
        timestamp: '13:14'
      }
    ]
  },
  {
    id: 'conv-rec-8803',
    userId: 'usr-103',
    userName: 'Yao Marc-Arthur',
    userPhone: '+225 01 02 33 44 55',
    userEmail: 'marc.yao@hotmail.com',
    userRole: 'driver',
    advisorName: 'Cheick Oumar Traoré',
    advisorRole: 'Coordonnateur Flotte & Logistique Grand Abidjan',
    startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    ipAddress: '105.235.66.19',
    commune: 'Yopougon',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    gpsCoords: { lat: 5.3411, lng: -4.0833 },
    isp: 'Moov Africa CI (AS37107)',
    networkType: '4G LTE',
    device: 'Android 13 (Tecno Camon 20 Pro)',
    browser: 'Chrome Mobile 126.0',
    messagesCount: 7,
    status: 'active',
    detectedIssue: 'Ajustement itinéraire carrefour Bel Air',
    resolvedByAdmin: false,
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Chef, embouteillage sévère sur la voie express Yopougon, j\'emprunte la déviation par Niangon pour livrer le colis.',
        timestamp: '14:38'
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        text: 'Bien reçu Marc-Arthur. Le radar GPS met à jour votre trajet en temps réel. Le client final est prévenu par SMS de votre arrivée estimée dans 15 minutes.',
        timestamp: '14:39'
      }
    ]
  }
];

// Seed calls for realism
const INITIAL_CALLS: AssistantCallArchive[] = [
  {
    id: 'call-rec-901',
    userId: 'usr-101',
    userName: 'Koffi Jean-Luc',
    userPhone: '+225 07 48 92 11 34',
    userEmail: 'koffi.jeanluc@gmail.com',
    userRole: 'client',
    advisorName: 'Awa Coulibaly',
    advisorRole: 'Responsable Enchères & Litiges Marchands',
    callType: 'vip_call',
    startedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
    durationSeconds: 248,
    durationFormatted: '04 min 08 s',
    status: 'completed',
    ipAddress: '41.202.144.78',
    commune: 'Cocody',
    city: 'Abidjan',
    gpsCoords: { lat: 5.3599, lng: -3.9870 },
    isp: 'Orange Côte d\'Ivoire (AS36980)',
    networkType: '4G LTE',
    device: 'Android 14 (Samsung Galaxy S24 Ultra)',
    browser: 'Chrome Mobile 128.0',
    subject: 'Assistance VIP Vente & Déblocage Enchère Téléphonie',
    transcript: [
      {
        sender: 'advisor',
        text: 'Allô Monsieur Koffi ? Ici Awa Coulibaly du support BRAD\'CI. Je vous appelle suite à votre signalement d\'enchère.',
        time: '14:27'
      },
      {
        sender: 'user',
        text: 'Oui bonjour Awa, merci pour la rapidité ! Je m\'inquiétais pour la validation de mon paiement Wave.',
        time: '14:28'
      },
      {
        sender: 'advisor',
        text: 'Je vous confirme que votre séquestre de 180 000 FCFA est parfaitement actif et garanti. Le vendeur a reçu la confirmation.',
        time: '14:29'
      },
      {
        sender: 'user',
        text: 'Parfait, c\'est rassurant. Le service client BRAD\'CI est impeccable.',
        time: '14:30'
      }
    ],
    audioSimulatedWaveData: [20, 45, 78, 92, 60, 85, 40, 70, 95, 80, 55, 30, 65, 85, 90, 75, 40, 25, 60, 80, 50, 20],
    adminNotes: 'Appel vocal complété avec succès. Client entièrement satisfait et sécurisé.'
  },
  {
    id: 'call-rec-902',
    userId: 'usr-102',
    userName: 'Bamba Salimata',
    userPhone: '+225 05 74 12 88 90',
    userEmail: 'salimata.bamba@yahoo.fr',
    userRole: 'client',
    advisorName: 'Mariam Koné',
    advisorRole: 'Spécialiste KYC & Comptes Vendeurs',
    callType: 'support_ticket_call',
    startedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 92 * 60 * 1000).toISOString(),
    durationSeconds: 195,
    durationFormatted: '03 min 15 s',
    status: 'completed',
    ipAddress: '160.154.99.23',
    commune: 'Plateau',
    city: 'Abidjan',
    gpsCoords: { lat: 5.3261, lng: -4.0197 },
    isp: 'MTN Côte d\'Ivoire (AS29465)',
    networkType: 'Fibre Optique',
    device: 'iOS 18.0 (iPhone 15 Pro Max)',
    browser: 'Safari Mobile 18.0',
    subject: 'Accompagnement configuration Boutique Pro & CNI',
    transcript: [
      {
        sender: 'advisor',
        text: 'Bonjour Madame Bamba, Mariam Koné à votre écoute pour finaliser votre compte marchand.',
        time: '13:20'
      },
      {
        sender: 'user',
        text: 'Bonjour Mariam, je voulais savoir si mes coordonnées Wave sont bien reliées pour recevoir mes retraits.',
        time: '13:21'
      },
      {
        sender: 'advisor',
        text: 'Tout est vérifié et conforme à votre CNI. Vos retraits sont instantanés avec 0 frais cachés.',
        time: '13:22'
      }
    ],
    audioSimulatedWaveData: [15, 35, 60, 80, 45, 70, 85, 90, 65, 40, 80, 75, 50, 30, 55, 70, 85, 40, 20],
    adminNotes: 'Dossier boutique validé.'
  }
];

class AssistantRecordingService {
  private static instance: AssistantRecordingService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): AssistantRecordingService {
    if (!AssistantRecordingService.instance) {
      AssistantRecordingService.instance = new AssistantRecordingService();
    }
    return AssistantRecordingService.instance;
  }

  private ensureInitialized(): void {
    try {
      if (!localStorage.getItem(CONVERSATIONS_STORAGE_KEY)) {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
      }
      if (!localStorage.getItem(CALLS_STORAGE_KEY)) {
        localStorage.setItem(CALLS_STORAGE_KEY, JSON.stringify(INITIAL_CALLS));
      }
    } catch {
      // fallback
    }
  }

  public getConversations(): AssistantConversationArchive[] {
    try {
      const data = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      const raw: AssistantConversationArchive[] = data ? JSON.parse(data) : INITIAL_CONVERSATIONS;
      return raw.map(conv => {
        const d = new Date(conv.startedAt);
        return {
          ...conv,
          date: conv.date || d.toLocaleDateString('fr-FR'),
          time: conv.time || d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          deviceFingerprint: conv.deviceFingerprint || conv.device || 'Mobile App CI',
          detectedIssues: conv.detectedIssues || (conv.detectedIssue ? [conv.detectedIssue] : []),
          gpsCoordinates: conv.gpsCoordinates || conv.gpsCoords
        };
      });
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  }

  public getCalls(): AssistantCallArchive[] {
    try {
      const data = localStorage.getItem(CALLS_STORAGE_KEY);
      const raw: AssistantCallArchive[] = data ? JSON.parse(data) : INITIAL_CALLS;
      return raw.map(c => {
        const d = new Date(c.startedAt);
        return {
          ...c,
          date: c.date || d.toLocaleDateString('fr-FR'),
          time: c.time || d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          deviceFingerprint: c.deviceFingerprint || c.device || 'Mobile App CI',
          gpsCoordinates: c.gpsCoordinates || c.gpsCoords
        };
      });
    } catch {
      return INITIAL_CALLS;
    }
  }

  public getCallsByUser(userId: string, phone?: string): AssistantCallArchive[] {
    const cleanPhone = phone ? phone.replace(/\s+/g, '') : '';
    return this.getCalls().filter(c => {
      if (c.userId === userId) return true;
      if (cleanPhone && c.userPhone.replace(/\s+/g, '').includes(cleanPhone)) return true;
      return false;
    });
  }

  public getConversationsByUser(userId: string, phone?: string): AssistantConversationArchive[] {
    const cleanPhone = phone ? phone.replace(/\s+/g, '') : '';
    return this.getConversations().filter(c => {
      if (c.userId === userId) return true;
      if (cleanPhone && c.userPhone.replace(/\s+/g, '').includes(cleanPhone)) return true;
      return false;
    });
  }

  public logChatMessage(params: {
    userId: string;
    userName: string;
    userPhone: string;
    userEmail?: string;
    userRole?: UserRole;
    advisorName: string;
    advisorRole?: string;
    sender: 'user' | 'assistant' | 'system';
    text: string;
    commune?: string;
    ipAddress?: string;
    detectedIssue?: string;
    attachmentName?: string;
  }): void {
    try {
      const all = this.getConversations();
      // Look for active conversation of this user with this advisor today
      const today = new Date().toISOString().slice(0, 10);
      let conv = all.find(c => c.userId === params.userId && c.startedAt.startsWith(today));

      const newMsg: RecordedChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: params.sender,
        text: params.text,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        attachmentName: params.attachmentName
      };

      if (conv) {
        conv.messages.push(newMsg);
        conv.messagesCount = conv.messages.length;
        conv.lastMessageAt = new Date().toISOString();
        if (params.detectedIssue) {
          conv.detectedIssue = params.detectedIssue;
          if (!conv.detectedIssues) conv.detectedIssues = [];
          if (!conv.detectedIssues.includes(params.detectedIssue)) {
            conv.detectedIssues.push(params.detectedIssue);
          }
        }
      } else {
        const now = new Date();
        const newConv: AssistantConversationArchive = {
          id: `conv-rec-${Date.now()}`,
          userId: params.userId,
          userName: params.userName,
          userPhone: params.userPhone,
          userEmail: params.userEmail || `${params.userId}@bradci.com`,
          userRole: params.userRole || 'client',
          advisorName: params.advisorName,
          advisorRole: params.advisorRole || 'Conseiller Support BRAD\'CI',
          startedAt: now.toISOString(),
          lastMessageAt: now.toISOString(),
          date: now.toLocaleDateString('fr-FR'),
          time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          ipAddress: params.ipAddress || '41.202.160.88',
          commune: params.commune || 'Cocody',
          city: 'Abidjan',
          country: 'Côte d\'Ivoire',
          gpsCoords: { lat: 5.3599, lng: -3.9870 },
          gpsCoordinates: { lat: 5.3599, lng: -3.9870 },
          isp: 'Orange Côte d\'Ivoire (AS36980)',
          networkType: '4G LTE',
          device: typeof navigator !== 'undefined' && /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS 18 (Apple iPhone)' : 'Android 14 (Samsung / Tecno)',
          deviceFingerprint: typeof navigator !== 'undefined' && /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS 18 (Apple iPhone)' : 'Android 14 (Samsung / Tecno)',
          browser: 'Navigateur Mobile WebApp',
          messagesCount: 1,
          messages: [newMsg],
          status: 'active',
          detectedIssue: params.detectedIssue,
          detectedIssues: params.detectedIssue ? [params.detectedIssue] : []
        };
        all.unshift(newConv);
      }

      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('bradci_assistant_conv_updated'));
    } catch {
      // storage error
    }
  }

  public recordCompletedCall(params: {
    userId: string;
    userName: string;
    userPhone: string;
    userEmail?: string;
    userRole?: UserRole;
    advisorName: string;
    advisorRole?: string;
    callType?: 'incoming_callback' | 'vip_call' | 'support_ticket_call' | 'emergency_call' | 'direct_voice_assistant';
    durationSeconds: number;
    subject?: string;
    transcript?: Array<{ sender?: 'advisor' | 'user'; speaker?: 'client' | 'advisor'; speakerName?: string; text: string; time?: string; timestamp?: string }>;
    commune?: string;
    ipAddress?: string;
  }): AssistantCallArchive {
    const mins = Math.floor(params.durationSeconds / 60);
    const secs = params.durationSeconds % 60;
    const durationFormatted = `${mins > 0 ? `${mins} min ` : ''}${secs} s`;

    // Generate random sound wave profile
    const wave: number[] = [];
    for (let i = 0; i < 24; i++) {
      wave.push(Math.floor(20 + Math.random() * 75));
    }

    const startDate = new Date(Date.now() - params.durationSeconds * 1000);
    const endDate = new Date();

    const normalizedTranscript = (params.transcript || [
      {
        sender: 'advisor' as const,
        speaker: 'advisor' as const,
        speakerName: params.advisorName,
        text: `Bonjour ${params.userName}, je suis ${params.advisorName} de l'assistance BRAD'CI. Comment puis-je vous aider ?`,
        time: 'Début',
        timestamp: startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      },
      {
        sender: 'user' as const,
        speaker: 'client' as const,
        speakerName: params.userName,
        text: params.subject || 'J\'avais une question sur la livraison et la validation de mon paiement.',
        time: '+01m',
        timestamp: startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    ]).map(t => ({
      sender: (t.sender || (t.speaker === 'client' ? 'user' : 'advisor')) as 'advisor' | 'user',
      speaker: (t.speaker || (t.sender === 'user' ? 'client' : 'advisor')) as 'client' | 'advisor',
      speakerName: t.speakerName || (t.sender === 'user' ? params.userName : params.advisorName),
      text: t.text,
      time: t.time || t.timestamp || '00:00',
      timestamp: t.timestamp || t.time || '00:00'
    }));

    const newCall: AssistantCallArchive = {
      id: `call-rec-${Date.now()}`,
      userId: params.userId,
      userName: params.userName,
      userPhone: params.userPhone,
      userEmail: params.userEmail || `${params.userId}@bradci.com`,
      userRole: params.userRole || 'client',
      advisorName: params.advisorName,
      advisorRole: params.advisorRole || 'Conseillère Support Client Direct',
      callType: params.callType || 'vip_call',
      startedAt: startDate.toISOString(),
      endedAt: endDate.toISOString(),
      date: startDate.toLocaleDateString('fr-FR'),
      time: startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: params.durationSeconds,
      durationFormatted,
      status: 'completed',
      ipAddress: params.ipAddress || '41.202.144.78',
      commune: params.commune || 'Cocody',
      city: 'Abidjan',
      gpsCoords: { lat: 5.3599, lng: -3.9870 },
      gpsCoordinates: { lat: 5.3599, lng: -3.9870 },
      isp: 'Orange Côte d\'Ivoire (AS36980)',
      networkType: '4G LTE',
      device: typeof navigator !== 'undefined' && /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS 18 (Apple iPhone)' : 'Android 14 (Samsung / Tecno)',
      deviceFingerprint: typeof navigator !== 'undefined' && /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS 18 (Apple iPhone)' : 'Android 14 (Samsung / Tecno)',
      browser: 'Navigateur Mobile WebApp',
      subject: params.subject || 'Assistance téléphonique prioritaire en direct',
      transcript: normalizedTranscript,
      audioSimulatedWaveData: wave,
      adminNotes: 'Enregistrement vocal automatique horodaté archivé dans les coffres-forts d\'audit BRAD\'CI.'
    };

    try {
      const calls = this.getCalls();
      calls.unshift(newCall);
      localStorage.setItem(CALLS_STORAGE_KEY, JSON.stringify(calls));
      window.dispatchEvent(new CustomEvent('bradci_assistant_call_updated'));
    } catch {
      // storage
    }

    return newCall;
  }
}

export const assistantArchive = AssistantRecordingService.getInstance();
