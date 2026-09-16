import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  X, 
  Send, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Check, 
  Star, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  Crown,
  Zap,
  Radio,
  Sparkles,
  AlertCircle,
  Loader2,
  Lock,
  MessageSquare,
  Bell,
  CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryBradCiKnowledge, AIKnowledgeResponse } from '../utils/aiKnowledgeEngine';
import { voiceNavigator, playSuccessChime, createPhoneRingtoneController } from '../utils/voiceNavigator';
import { AFRICAN_SUPPORT_ADVISORS, SupportAdvisor } from '../data/africanAdvisors';
import { auditLogger } from '../utils/activityAuditLogger';
import { assistantArchive } from '../utils/assistantRecordingArchive';
import { startVoiceRecording, stopVoiceRecording, isVoiceRecordingActive } from '../utils/voiceRecorder';

export const SUPPORT_ADVISORS: SupportAdvisor[] = AFRICAN_SUPPORT_ADVISORS;
export type { SupportAdvisor };

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  category?: AIKnowledgeResponse['category'];
  suggestedAction?: AIKnowledgeResponse['suggestedAction'];
  advisorName?: string;
  attachment?: ChatAttachment;
  isRelance?: boolean;
  isClosingNotice?: boolean;
  isCallRecap?: boolean;
  isVoiceSpoken?: boolean;
  isAdminDirect?: boolean;
  adminName?: string;
}

export interface SessionRating {
  stars: number;
  tags: string[];
  comment: string;
  advisorName: string;
  submittedAt: string;
}

export interface PendingCallRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  subject: string;
  notes?: string;
  requestedAt: number; // ms timestamp
}

export interface IncomingCallData {
  advisor: SupportAdvisor;
  callId: string;
  clientName: string;
  clientPhone: string;
  subject: string;
}

const STORAGE_ACTIVE_CALL_REQ = 'bradci_active_call_request';

export const AIChatSupport: React.FC = () => {
  const { 
    setPricingModalOpen, 
    setAuthModalOpen, 
    setKycModalOpen, 
    language, 
    translate,
    currentUser,
    createSupportTicket,
    supportTickets,
    addToast
  } = useApp();

  // Primary UI state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'call_request'>('chat');
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  // Attachments
  const [selectedFile, setSelectedFile] = useState<ChatAttachment | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  
  // Voice readout preference for text messages
  const [autoVoice, setAutoVoice] = useState<boolean>(() => {
    return localStorage.getItem('app_auto_voice') === 'true';
  });

  // Speech Recognition state for text input
  const [isListening, setIsListening] = useState(false);

  // Dynamic advisor rotation: track index among the 15 African Advisors
  const [advisorIndex, setAdvisorIndex] = useState<number>(() => {
    return Math.floor(Math.random() * SUPPORT_ADVISORS.length);
  });
  const currentAdvisor = SUPPORT_ADVISORS[advisorIndex % SUPPORT_ADVISORS.length];

  // Inactivity and session closure state
  const [isSessionClosed, setIsSessionClosed] = useState(false);
  const [hasSentRelance, setHasSentRelance] = useState(false);
  const [sessionRating, setSessionRating] = useState<SessionRating | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [selectedRatingTags, setSelectedRatingTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // PASS ABONNÉ STATUS (Strictly real status, NO test simulator override)
  const isPassAbonne = Boolean(
    currentUser?.sellerPlan === 'pro' ||
    currentUser?.sellerPlan === 'standard' ||
    currentUser?.driverPlan === 'vip_pass' ||
    currentUser?.isVIP ||
    currentUser?.email === 'aboulayetrading@gmail.com'
  );

  // SEARCHING FOR ADVISOR STATE (On new exchange)
  const [isSearchingAdvisor, setIsSearchingAdvisor] = useState(false);
  const [searchElapsedSeconds, setSearchElapsedSeconds] = useState(0);
  const [searchTargetSeconds, setSearchTargetSeconds] = useState(3);

  // TYPING STATE (Clean natural typing, no artificial seconds or progress bar)
  const [isTyping, setIsTyping] = useState(false);

  // ==========================================
  // CALL REQUEST & 10-MINUTE COUNTDOWN STATE
  // ==========================================
  const [pendingCallRequest, setPendingCallRequest] = useState<PendingCallRequest | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_CALL_REQ);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only keep if under 10 minutes (600,000 ms)
        if (Date.now() - parsed.requestedAt < 600000) {
          return parsed;
        }
        localStorage.removeItem(STORAGE_ACTIVE_CALL_REQ);
      }
    } catch {}
    return null;
  });

  const [callCountdownSeconds, setCallCountdownSeconds] = useState<number>(() => {
    if (!pendingCallRequest) return 600;
    const elapsed = Math.floor((Date.now() - pendingCallRequest.requestedAt) / 1000);
    return Math.max(0, 600 - elapsed);
  });

  // Call Request Form Inputs
  const [callFormName, setCallFormName] = useState(currentUser?.name || '');
  const [callFormPhone, setCallFormPhone] = useState(currentUser?.phone || '');
  const [callFormSubject, setCallFormSubject] = useState('Question ou problème sur une commande / enchère');
  const [callFormNotes, setCallFormNotes] = useState('');
  const [callFormSubmitting, setCallFormSubmitting] = useState(false);

  // Update prefilled info when currentUser changes
  useEffect(() => {
    if (currentUser?.name && !callFormName) {
      setCallFormName(currentUser.name);
    }
    if (currentUser?.phone && !callFormPhone) {
      setCallFormPhone(currentUser.phone);
    }
  }, [currentUser]);

  // ==========================================
  // INCOMING CALL & LIVE CALL STATE
  // ==========================================
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [callPhase, setCallPhase] = useState<'idle' | 'ringing' | 'connected'>('idle');
  const [callStopwatchSeconds, setCallStopwatchSeconds] = useState(0);
  const [isCallMicMuted, setIsCallMicMuted] = useState(false);
  const [isCallSpeakerMuted, setIsCallSpeakerMuted] = useState(false);
  const [isAdvisorSpeakingOnCall, setIsAdvisorSpeakingOnCall] = useState(false);
  const [isCallThinking, setIsCallThinking] = useState(false);
  const [isUserSpeakingOnCall, setIsUserSpeakingOnCall] = useState(false);
  const [callLiveTranscript, setCallLiveTranscript] = useState<string>('');
  const [callMessagesLog, setCallMessagesLog] = useState<{ sender: 'advisor' | 'user'; text: string; time: string }[]>([]);
  const [callTextInput, setCallTextInput] = useState('');
  const [callActiveAdvisor, setCallActiveAdvisor] = useState<SupportAdvisor>(currentAdvisor);

  // Ringtone controller ref
  const ringtoneControllerRef = useRef<ReturnType<typeof createPhoneRingtoneController> | null>(null);

  // Timestamps for tracking inactivity
  const lastUserActivityRef = useRef<number>(Date.now());
  const lastAdvisorMsgTimeRef = useRef<number>(Date.now());
  const typingTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const callRecognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial messages based on current advisor
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-init',
      sender: 'bot',
      advisorName: currentAdvisor.name,
      text: language === 'en' ? currentAdvisor.welcomeEn : currentAdvisor.welcomeFr,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
      suggestedAction: {
        labelFr: "Découvrir les Abonnements Pass",
        labelEn: "View Pass Subscriptions",
        actionType: "open_pricing"
      }
    }
  ]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && !isVoiceCallActive) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping, isVoiceCallActive]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Listen to live intervention messages from the Super Admin
  useEffect(() => {
    const handleAdminMessage = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.targetUserId && currentUser && detail.targetUserId !== currentUser.id && currentUser.role !== 'admin') {
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `admin-incoming-${Date.now()}`,
          sender: 'bot',
          advisorName: detail.adminName || "Direction BRAD'CI (Super Admin)",
          text: detail.messageText,
          timestamp: detail.timestamp || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          category: 'general',
          isAdminDirect: true,
          adminName: detail.adminName || "Direction BRAD'CI (Super Admin)"
        }
      ]);

      addToast(
        "Message Officiel Administrateur",
        detail.messageText.length > 80 ? detail.messageText.slice(0, 80) + '...' : detail.messageText,
        'success'
      );
    };

    window.addEventListener('bradci_admin_live_message', handleAdminMessage);
    return () => {
      window.removeEventListener('bradci_admin_live_message', handleAdminMessage);
    };
  }, [currentUser, addToast]);

  // ==========================================
  // COUNTDOWN INTERVAL FOR 10-MINUTE CALL REQUEST
  // ==========================================
  useEffect(() => {
    if (!pendingCallRequest) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pendingCallRequest.requestedAt) / 1000);
      const remaining = Math.max(0, 600 - elapsed);
      setCallCountdownSeconds(remaining);

      if (remaining <= 0) {
        // Expired after 10 minutes
        setPendingCallRequest(null);
        localStorage.removeItem(STORAGE_ACTIVE_CALL_REQ);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingCallRequest]);

  // ==========================================
  // AUTOMATIC ADVISOR ASSIGNMENT & INCOMING CALL
  // (Triggered after ~70s from request, OR via admin event)
  // ==========================================
  useEffect(() => {
    if (!pendingCallRequest || incomingCall || isVoiceCallActive) return;

    // Simulate looking for available advisors without an open chat
    // Automatically calls client within 2 minutes (e.g. at ~75s)
    const elapsedSinceReq = Date.now() - pendingCallRequest.requestedAt;
    const targetAutoCallDelayMs = Math.max(10000, 75000 - elapsedSinceReq);

    const timer = setTimeout(() => {
      // Pick an available African advisor among the 15
      const availableAdvisors = SUPPORT_ADVISORS;
      const picked = availableAdvisors[Math.floor(Math.random() * availableAdvisors.length)];

      triggerIncomingCall({
        advisor: picked,
        callId: pendingCallRequest.id,
        clientName: pendingCallRequest.clientName,
        clientPhone: pendingCallRequest.clientPhone,
        subject: pendingCallRequest.subject
      });
    }, targetAutoCallDelayMs);

    return () => clearTimeout(timer);
  }, [pendingCallRequest, incomingCall, isVoiceCallActive]);

  // Function to initiate an incoming call to the client
  const triggerIncomingCall = (data: IncomingCallData) => {
    setIncomingCall(data);
    setCallActiveAdvisor(data.advisor);

    // 1. Play realistic phone ringtone
    try {
      if (ringtoneControllerRef.current) {
        ringtoneControllerRef.current.stop();
      }
      const ringtone = createPhoneRingtoneController();
      ringtoneControllerRef.current = ringtone;
      ringtone.start();
    } catch (e) {
      console.warn('Ringtone play error:', e);
    }

    // 2. Dispatch native browser notification (displays on phone notification bar)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`📞 Appel entrant : ${data.advisor.fullName} (Support Client)`, {
            body: `Rappel d'assistance garanti suite à votre demande. Touchez ici pour décrocher.`,
            icon: '/favicon.ico',
            tag: 'bradci_call_' + data.callId,
            requireInteraction: true
          });
        } catch {}
      } else if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // 3. Vibrate device if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 600]);
      } catch {}
    }
  };

  // Listen to incoming call events dispatched by admin console or authorized tickets
  useEffect(() => {
    const handleAdminTriggerCall = (e: any) => {
      const detail = e.detail || {};
      // Pick random advisor or current advisor
      const picked = SUPPORT_ADVISORS[Math.floor(Math.random() * SUPPORT_ADVISORS.length)];
      triggerIncomingCall({
        advisor: picked,
        callId: detail.callId || `VIP-CALL-${Date.now()}`,
        clientName: detail.clientName || currentUser?.name || 'Client',
        clientPhone: detail.clientPhone || currentUser?.phone || '',
        subject: detail.subject || 'Assistance prioritaire suite à résolution administrateur'
      });
    };

    const checkAdminAuthorizedCall = () => {
      try {
        const raw = localStorage.getItem('bradci_admin_authorized_call');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (!currentUser?.phone || parsed.clientPhone === currentUser?.phone || parsed.clientName === currentUser?.name)) {
            // Find advisor or current
            const advisor = SUPPORT_ADVISORS.find(a => a.name === parsed.advisorName) || currentAdvisor;
            // Clear storage so it doesn't re-trigger
            localStorage.removeItem('bradci_admin_authorized_call');
            setIsOpen(true); // Open support assistant automatically
            triggerIncomingCall({
              advisor,
              callId: parsed.ticketId || `TKT-CALL-${Date.now()}`,
              clientName: parsed.clientName || currentUser?.name || 'Client',
              clientPhone: parsed.clientPhone || currentUser?.phone || '',
              subject: parsed.subject || 'Requête résolue par l\'Administration'
            });
          }
        }
      } catch {}
    };

    // Check immediately and on storage change
    checkAdminAuthorizedCall();

    window.addEventListener('bradci_trigger_incoming_call', handleAdminTriggerCall);
    window.addEventListener('storage', checkAdminAuthorizedCall);
    const interval = setInterval(checkAdminAuthorizedCall, 3000);

    return () => {
      window.removeEventListener('bradci_trigger_incoming_call', handleAdminTriggerCall);
      window.removeEventListener('storage', checkAdminAuthorizedCall);
      clearInterval(interval);
    };
  }, [currentUser, currentAdvisor]);

  // Cleanup ringtone if component unmounts
  useEffect(() => {
    return () => {
      if (ringtoneControllerRef.current) {
        ringtoneControllerRef.current.stop();
        ringtoneControllerRef.current = null;
      }
    };
  }, []);

  // Accept incoming call ("DÉCROCHER")
  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;

    // Immediately unlock Web Audio / Speech context from direct user tap
    voiceNavigator.unlockAudio();

    // Stop ringtone
    if (ringtoneControllerRef.current) {
      ringtoneControllerRef.current.stop();
      ringtoneControllerRef.current = null;
    }

    const assignedAdvisor = incomingCall.advisor;
    const clientName = incomingCall.clientName || currentUser?.name || 'Cher client';
    const advisorIndexNumber = SUPPORT_ADVISORS.findIndex(a => a.name === assignedAdvisor.name);

    // Open chat window and switch to voice call view
    setIsOpen(true);
    setActiveTab('chat');
    setIsVoiceCallActive(true);
    setCallPhase('connected');
    setCallStopwatchSeconds(0);
    setCallActiveAdvisor(assignedAdvisor);
    setIsAdvisorSpeakingOnCall(true);
    setIsCallThinking(false);
    setIsUserSpeakingOnCall(false);
    setCallLiveTranscript('');

    // Remove pending call request
    setPendingCallRequest(null);
    localStorage.removeItem(STORAGE_ACTIVE_CALL_REQ);
    setIncomingCall(null);
    playSuccessChime();

    // The advisor asks what the client's concern is:
    // "L'assistance lui demande les préoccupations il répond rt l'assistance lui donne les réponses"
    const introSpeech = language === 'en'
      ? assignedAdvisor.callIntroEn(clientName)
      : assignedAdvisor.callIntroFr(clientName);

    setCallMessagesLog([
      {
        sender: 'advisor',
        text: introSpeech,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Speak aloud using advisor's distinct African voice profile
    voiceNavigator.speak(
      introSpeech,
      language === 'en' ? 'en' : 'fr',
      () => {
        setIsAdvisorSpeakingOnCall(false);
      },
      {
        pitch: assignedAdvisor.pitch,
        rate: assignedAdvisor.rate,
        gender: assignedAdvisor.gender,
        advisorIndex: advisorIndexNumber >= 0 ? advisorIndexNumber : 0
      }
    );
  };

  // Reject / Dismiss incoming call
  const handleRejectIncomingCall = () => {
    if (ringtoneControllerRef.current) {
      ringtoneControllerRef.current.stop();
      ringtoneControllerRef.current = null;
    }
    setIncomingCall(null);
  };

  // ==========================================
  // INACTIVITY MONITORING & AUTO-CLOSE SESSION
  // (Every 5-10 min without reply -> close with note)
  // ==========================================
  useEffect(() => {
    if (isSessionClosed || isVoiceCallActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const userInactiveDuration = now - lastUserActivityRef.current;
      const timeSinceLastAdvisorMsg = now - lastAdvisorMsgTimeRef.current;

      // 4 minutes inactivity relance
      if (!hasSentRelance && userInactiveDuration >= 240000 && timeSinceLastAdvisorMsg >= 240000) {
        setHasSentRelance(true);
        const relanceMsg: ChatMessage = {
          id: `relance-${Date.now()}`,
          sender: 'bot',
          advisorName: currentAdvisor.name,
          text: language === 'en'
            ? "Are you still with us? I remain entirely at your service if you need any additional assistance or clarification."
            : "Êtes-vous toujours en ligne ? Je reste à votre entière disposition si vous avez besoin d'informations complémentaires.",
          timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isRelance: true
        };
        setMessages(prev => [...prev, relanceMsg]);
      }

      // 8-10 min inactivity automatic close with note
      if (userInactiveDuration >= 480000) {
        handleCloseSession(true);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [hasSentRelance, isSessionClosed, isVoiceCallActive, language, currentAdvisor.name]);

  // TIMER FOR ADVISOR SEARCHING (When user resets / starts new exchange)
  useEffect(() => {
    if (!isSearchingAdvisor) return;

    const timer = setInterval(() => {
      setSearchElapsedSeconds(prev => {
        const next = prev + 1;
        if (next >= searchTargetSeconds) {
          clearInterval(timer);
          completeAdvisorMatch();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSearchingAdvisor, searchTargetSeconds]);

  // TIMER FOR LIVE VOICE CALL STOPWATCH
  useEffect(() => {
    if (!isVoiceCallActive || callPhase !== 'connected') return;

    const interval = setInterval(() => {
      setCallStopwatchSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVoiceCallActive, callPhase]);

  // Complete advisor matching and assign new African advisor
  const completeAdvisorMatch = () => {
    setIsSearchingAdvisor(false);
    playSuccessChime();

    // Select next African advisor among 15
    const nextIndex = (advisorIndex + 1) % SUPPORT_ADVISORS.length;
    setAdvisorIndex(nextIndex);
    const newAdvisor = SUPPORT_ADVISORS[nextIndex];

    setIsSessionClosed(false);
    setHasSentRelance(false);
    setSessionRating(null);
    setRatingSubmitted(false);
    setRatingComment('');
    setSelectedRatingTags([]);
    lastUserActivityRef.current = Date.now();
    lastAdvisorMsgTimeRef.current = Date.now();

    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'bot',
      advisorName: newAdvisor.name,
      text: language === 'en' ? newAdvisor.welcomeEn : newAdvisor.welcomeFr,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
      suggestedAction: {
        labelFr: "Découvrir les Abonnements Pass",
        labelEn: "View Pass Subscriptions",
        actionType: "open_pricing"
      }
    };

    setMessages([welcomeMsg]);
  };

  // Start new exchange with advisor search
  const handleStartNewSession = () => {
    setIsSearchingAdvisor(true);
    setSearchElapsedSeconds(0);
    setSearchTargetSeconds(3);
  };

  // Close session manually or on inactivity
  const handleCloseSession = (automatic: boolean = false) => {
    if (isSessionClosed) return;
    setIsSessionClosed(true);

    const closingMsg: ChatMessage = {
      id: `close-${Date.now()}`,
      sender: 'bot',
      advisorName: currentAdvisor.name,
      text: automatic
        ? (language === 'en'
            ? `Conversation automatically closed due to inactivity. It was a pleasure assisting you! Feel free to leave a quick rating for ${currentAdvisor.name} below.`
            : `Échange clôturé automatiquement après un moment d'inactivité. C'était un plaisir de vous accompagner ! N'hésitez pas à laisser une note pour ${currentAdvisor.name} ci-dessous.`)
        : (language === 'en'
            ? `Thank you for contacting our online customer service. It was my pleasure to assist you! Please share your feedback on our support session.`
            : `Merci d'avoir contacté notre service client en ligne. Ce fut un plaisir de vous accompagner ! Merci de bien vouloir évaluer la qualité de notre échange.`),
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isClosingNotice: true
    };

    setMessages(prev => [...prev, closingMsg]);
  };

  // Toggle Voice Auto-Speech
  const toggleAutoVoice = () => {
    const next = !autoVoice;
    setAutoVoice(next);
    localStorage.setItem('app_auto_voice', String(next));
    if (!next) {
      voiceNavigator.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  // Read message out loud with advisor's voice
  const handleSpeakText = (messageId: string, text: string) => {
    // Proactively unlock audio context for Android WebViews & mobile browsers
    voiceNavigator.unlockAudio();

    if (isSpeaking && speakingMessageId === messageId) {
      voiceNavigator.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    voiceNavigator.stop();
    const cleanText = text
      .replace(/[*_~`#>]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    voiceNavigator.speak(
      cleanText, 
      language === 'en' ? 'en' : 'fr', 
      () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      },
      {
        pitch: currentAdvisor.pitch,
        rate: currentAdvisor.rate,
        gender: currentAdvisor.gender,
        advisorIndex
      }
    );
  };

  // Toggle voice recognition / native audio recording fallback
  const handleToggleListening = async () => {
    if (isListening) {
      // Arrêt de l'écoute ou de l'enregistrement
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (isVoiceRecordingActive()) {
        try {
          const audioBlob = await stopVoiceRecording();
          if (audioBlob && audioBlob.size > 0) {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                setSelectedFile({
                  id: `voice-${Date.now()}`,
                  name: `Note_vocale_${new Date().toLocaleTimeString('fr-FR').replace(/:/g, '-')}.webm`,
                  size: audioBlob.size,
                  type: audioBlob.type || 'audio/webm',
                  dataUrl: reader.result as string
                });
                if (!inputText.trim()) {
                  setInputText(translate("🎙️ [Message vocal enregistré - Prêt à envoyer]", "🎙️ [Voice note recorded - Ready to send]"));
                }
              }
            };
            reader.readAsDataURL(audioBlob);
          }
        } catch (e) {
          console.warn("Erreur arrêt note vocale:", e);
        }
      }
      setIsListening(false);
      playSuccessChime();
    } else {
      // Démarrage : essayer SpeechRecognition en créant une nouvelle instance propre
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let speechStarted = false;

      if (SpeechRecognitionClass) {
        try {
          const recog = new SpeechRecognitionClass();
          recog.continuous = false;
          recog.interimResults = true;
          recog.lang = language === 'en' ? 'en-US' : 'fr-FR';

          recog.onstart = () => {
            setIsListening(true);
          };

          recog.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript.trim()) {
              setInputText(transcript);
            }
          };

          recog.onerror = async (err: any) => {
            console.warn("SpeechRecognition error:", err?.error);
            // Fallback direct sur l'enregistrement audio si non supporté ou bloqué
            if (err?.error !== 'no-speech') {
              try {
                await startVoiceRecording();
                setIsListening(true);
              } catch {
                setIsListening(false);
              }
            } else {
              setIsListening(false);
            }
          };

          recog.onend = () => {
            setIsListening(false);
          };

          recog.start();
          recognitionRef.current = recog;
          speechStarted = true;
          setIsListening(true);
        } catch (e) {
          console.warn("SpeechRecognition start failed:", e);
        }
      }

      // Si SpeechRecognition non disponible (WebViews, Safari strict, navigateurs sans WebSpeech)
      if (!speechStarted) {
        try {
          await startVoiceRecording();
          setIsListening(true);
        } catch (e) {
          console.warn("Audio recording fallback failed:", e);
          setIsListening(false);
        }
      }
    }
  };

  const handleCancelListening = async () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (isVoiceRecordingActive()) {
      try { await stopVoiceRecording(); } catch {}
    }
    setIsListening(false);
  };

  // Continuous speech recognition for LIVE VOICE CALL
  useEffect(() => {
    if (!isVoiceCallActive || callPhase !== 'connected' || isCallMicMuted || isAdvisorSpeakingOnCall || isCallThinking) {
      if (callRecognitionRef.current) {
        try {
          callRecognitionRef.current.stop();
        } catch {}
      }
      setIsUserSpeakingOnCall(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recog = new SpeechRecognitionClass();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = language === 'en' ? 'en-US' : 'fr-FR';

        recog.onstart = () => {
          setIsUserSpeakingOnCall(true);
        };

        recog.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              const finalPhrase = event.results[i][0].transcript.trim();
              if (finalPhrase.length > 2) {
                handleUserSpeechInCall(finalPhrase);
              }
            }
          }
          setCallLiveTranscript(currentTranscript);
        };

        recog.onerror = () => {
          setIsUserSpeakingOnCall(false);
        };

        recog.onend = () => {
          setIsUserSpeakingOnCall(false);
          // Restart if still active and advisor not speaking
          if (isVoiceCallActive && callPhase === 'connected' && !isCallMicMuted && !isAdvisorSpeakingOnCall && !isCallThinking) {
            try { recog.start(); } catch {}
          }
        };

        try {
          recog.start();
          callRecognitionRef.current = recog;
        } catch {}
      } catch {}
    }

    return () => {
      if (callRecognitionRef.current) {
        try { callRecognitionRef.current.stop(); } catch {}
      }
    };
  }, [isVoiceCallActive, callPhase, isCallMicMuted, isAdvisorSpeakingOnCall, isCallThinking, language]);

  // Standard chat voice recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === 'en' ? 'en-US' : 'fr-FR';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
          playSuccessChime();
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch {}
    }
  }, [language]);

  // File attachments
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(language === 'en' ? 'File too large. Maximum size is 10 MB.' : 'Fichier trop volumineux. La taille maximale autorisée est de 10 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        id: `att-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  // ==========================================
  // SEND MESSAGE (NO ARTIFICIAL DELAY SECONDS)
  // ==========================================
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || isTyping || isSessionClosed) return;

    const isEn = language === 'en';
    const query = inputText.trim();
    const attachedFile = selectedFile;
    setSelectedFile(null);

    // Update inactivity timestamps
    lastUserActivityRef.current = Date.now();
    setHasSentRelance(false);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query || (attachedFile ? (isEn ? "Attached document" : "Document joint") : ""),
      timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
      attachment: attachedFile || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Automatic Archive Recording for Admin Security & Fraud Audit
    try {
      assistantArchive.logChatMessage({
        userId: currentUser?.id || `anon-${Date.now().toString().slice(-4)}`,
        userName: currentUser?.name || 'Visiteur En Ligne',
        userPhone: currentUser?.phone || 'Non renseigné',
        userEmail: currentUser?.email,
        userRole: currentUser?.role || 'client',
        advisorName: currentAdvisor.name,
        advisorRole: language === 'en' ? currentAdvisor.roleEn : currentAdvisor.roleFr,
        sender: 'user',
        text: userMsg.text,
        commune: currentUser?.city || 'Cocody',
        attachmentName: attachedFile?.name
      });
    } catch (e) {
      console.warn('[AssistantArchive] User message log error', e);
    }

    let finalReplyText = '';
    let category: AIKnowledgeResponse['category'] = 'general';
    let suggestedAction: AIKnowledgeResponse['suggestedAction'] | undefined = undefined;

    const promptToSend = attachedFile 
      ? `${query ? query + '\n\n' : ''}[Le client a transmis une pièce jointe : "${attachedFile.name}" (${attachedFile.type}, ${formatFileSize(attachedFile.size)})]`
      : query;

    let detectedIssueData: any = null;

    try {
      const res = await fetch('/api/chat/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          language,
          advisorName: currentAdvisor.name,
          advisorGender: currentAdvisor.gender,
          mode: 'text',
          history: messages.slice(-4).map(m => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          finalReplyText = data.reply;
          category = data.source === 'security_filter' ? 'security_blocked' : (data.category || 'general');
          suggestedAction = data.suggestedAction;
          detectedIssueData = data.detectedIssue;
        }
      }
    } catch {
      // Local fallback
    }

    if (!finalReplyText) {
      const localResponse = queryBradCiKnowledge(query || 'document joint', language, currentAdvisor.name);
      finalReplyText = localResponse.text;
      category = localResponse.category;
      suggestedAction = localResponse.suggestedAction;
      detectedIssueData = localResponse.detectedIssue;
    }

    // Check if query itself has problem characteristics even if AI replied via Gemini
    const queryNorm = (query || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isBlocked = (queryNorm.includes('bloqu') || queryNorm.includes('blocage') || queryNorm.includes('ferme') || queryNorm.includes('impossible de')) && (queryNorm.includes('vent') || queryNorm.includes('annonc') || queryNorm.includes('encher') || queryNorm.includes('produit') || queryNorm.includes('prix') || queryNorm.includes('offre'));
    const isTypoError = queryNorm.includes('erreur de frappe') || queryNorm.includes('erreur frappe') || queryNorm.includes('trompe de numero') || queryNorm.includes('trompe de prix') || queryNorm.includes('mauvais montant') || queryNorm.includes('rectifier') || queryNorm.includes('corriger');
    const isKyc = (queryNorm.includes('kyc') || queryNorm.includes('identite') || queryNorm.includes('piece') || queryNorm.includes('cni')) && (queryNorm.includes('attente') || queryNorm.includes('bloqu') || queryNorm.includes('refus') || queryNorm.includes('delai') || queryNorm.includes('retard'));
    const isProblem = isBlocked || isTypoError || isKyc || Boolean(detectedIssueData);

    if (isProblem && createSupportTicket) {
      let problemType: 'blocked_sale' | 'typing_error' | 'kyc_pending' | 'other' = 'other';
      let problemCategoryLabel = 'Problème technique / administratif';

      if (isBlocked || detectedIssueData?.problemType === 'blocked_sale') {
        problemType = 'blocked_sale';
        problemCategoryLabel = 'Blocage de vente aux enchères';
      } else if (isTypoError || detectedIssueData?.problemType === 'typing_error') {
        problemType = 'typing_error';
        problemCategoryLabel = 'Erreur de frappe / modification requise';
      } else if (isKyc || detectedIssueData?.problemType === 'kyc_pending') {
        problemType = 'kyc_pending';
        problemCategoryLabel = 'Certification KYC en attente';
      }

      // Automatically dispatch ticket to Admin Back-Office
      createSupportTicket({
        userId: currentUser?.id || `user-anon-${Date.now().toString().slice(-4)}`,
        userName: currentUser?.name || 'Client',
        userPhone: currentUser?.phone || '+225 07 00 00 00 00',
        userEmail: currentUser?.email || 'client@plateforme.ci',
        userRole: currentUser?.role || 'client',
        problemType,
        problemCategoryLabel,
        clientMessage: query || 'Signalement transmis via chat d\'assistance',
        advisorName: currentAdvisor.name,
        contactPreference: 'both'
      });
    }

    // Acknowledge attachment if present and not already acknowledged
    if (attachedFile && !finalReplyText.toLowerCase().includes('document') && !finalReplyText.toLowerCase().includes('piece')) {
      const fileAck = isEn 
        ? `📎 I have received your attachment "${attachedFile.name}". I am reviewing it carefully to assist you thoroughly.\n\n`
        : `📎 J'ai bien réceptionné votre pièce jointe "${attachedFile.name}". Je l'examine avec attention pour traiter votre demande au mieux.\n\n`;
      finalReplyText = fileAck + finalReplyText;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const sendStartTime = Date.now();
    // User requested realistic 30 seconds to 1 minute response delay (30000ms - 45000ms)
    const targetDelayMs = 30000 + Math.floor(Math.random() * 15000);

    const deliverBotResponse = () => {
      setIsTyping(false);
      lastAdvisorMsgTimeRef.current = Date.now();

      const botMsgId = `b-${Date.now()}`;
      const botReply: ChatMessage = {
        id: botMsgId,
        sender: 'bot',
        advisorName: currentAdvisor.name,
        text: finalReplyText,
        timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
        category,
        suggestedAction
      };

      setMessages(prev => [...prev, botReply]);

      // Automatic Assistant Reply Archiving for Admin Supervision
      try {
        assistantArchive.logChatMessage({
          userId: currentUser?.id || `anon-${Date.now().toString().slice(-4)}`,
          userName: currentUser?.name || 'Visiteur En Ligne',
          userPhone: currentUser?.phone || 'Non renseigné',
          userEmail: currentUser?.email,
          userRole: currentUser?.role || 'client',
          advisorName: currentAdvisor.name,
          advisorRole: language === 'en' ? currentAdvisor.roleEn : currentAdvisor.roleFr,
          sender: 'assistant',
          text: botReply.text,
          commune: currentUser?.city || 'Cocody',
          detectedIssue: category !== 'general' ? category : undefined
        });
      } catch (e) {
        console.warn('[AssistantArchive] Bot reply log error', e);
      }

      // Auto-Voice readout if enabled
      if (autoVoice) {
        setTimeout(() => {
          handleSpeakText(botMsgId, finalReplyText);
        }, 150);
      }
    };

    const elapsedMs = Date.now() - sendStartTime;
    const remainingDelay = Math.max(0, targetDelayMs - elapsedMs);

    typingTimeoutRef.current = setTimeout(() => {
      deliverBotResponse();
    }, remainingDelay);
  };

  // ==========================================
  // IN-CALL USER SPEECH (Live voice dialog)
  // ==========================================
  const handleUserSpeechInCall = async (userText: string) => {
    if (!userText.trim()) return;

    setCallLiveTranscript('');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCallMessagesLog(prev => [
      ...prev,
      { sender: 'user', text: userText, time: timeStr }
    ]);

    setIsCallThinking(true);
    setIsAdvisorSpeakingOnCall(false);

    try {
      const res = await fetch('/api/chat/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          language,
          advisorName: callActiveAdvisor.name,
          advisorGender: callActiveAdvisor.gender,
          mode: 'voice_call',
          history: callMessagesLog.slice(-4).map(m => ({
            sender: m.sender === 'advisor' ? 'bot' : 'user',
            text: m.text
          }))
        })
      });

      let reply = '';
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          reply = data.reply;
        }
      }

      if (!reply) {
        const fallback = queryBradCiKnowledge(userText, language, callActiveAdvisor.name);
        reply = fallback.text;
      }

      // Format natural spoken speech without markdown symbols or URLs
      const cleanSpokenReply = reply
        .replace(/[*_~`#>]/g, '')
        .replace(/•/g, ', ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      setIsCallThinking(false);
      setIsAdvisorSpeakingOnCall(true);

      setCallMessagesLog(prev => [
        ...prev,
        { sender: 'advisor', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);

      if (!isCallSpeakerMuted) {
        const advisorIdx = SUPPORT_ADVISORS.findIndex(a => a.name === callActiveAdvisor.name);
        voiceNavigator.speak(
          cleanSpokenReply, 
          language === 'en' ? 'en' : 'fr', 
          () => {
            setIsAdvisorSpeakingOnCall(false);
          },
          {
            pitch: callActiveAdvisor.pitch,
            rate: callActiveAdvisor.rate,
            gender: callActiveAdvisor.gender,
            advisorIndex: advisorIdx >= 0 ? advisorIdx : 0
          }
        );
      } else {
        setIsAdvisorSpeakingOnCall(false);
      }
    } catch {
      setIsCallThinking(false);
      setIsAdvisorSpeakingOnCall(false);
    }
  };

  // End live audio call
  const handleEndVoiceCall = () => {
    if (ringtoneControllerRef.current) {
      ringtoneControllerRef.current.stop();
      ringtoneControllerRef.current = null;
    }
    voiceNavigator.stop();
    setIsAdvisorSpeakingOnCall(false);
    setIsUserSpeakingOnCall(false);

    const callMins = Math.floor(callStopwatchSeconds / 60);
    const callSecs = callStopwatchSeconds % 60;
    const durationFormatted = `${callMins > 0 ? `${callMins} min ` : ''}${callSecs} s`;

    setIsVoiceCallActive(false);
    setCallPhase('idle');

    // Automatic Call Recording & Network Audit Archiving for Admin
    try {
      assistantArchive.recordCompletedCall({
        userId: currentUser?.id || `anon-${Date.now().toString().slice(-4)}`,
        userName: currentUser?.name || incomingCall?.clientName || callFormName || 'Client Appel Vocal',
        userPhone: currentUser?.phone || incomingCall?.clientPhone || callFormPhone || '+225 07 00 00 00 00',
        userEmail: currentUser?.email,
        userRole: currentUser?.role || 'client',
        advisorName: callActiveAdvisor.fullName,
        advisorRole: language === 'en' ? callActiveAdvisor.roleEn : callActiveAdvisor.roleFr,
        callType: pendingCallRequest ? 'vip_call' : 'direct_voice_assistant',
        durationSeconds: Math.max(1, callStopwatchSeconds),
        subject: incomingCall?.subject || (callMessagesLog.length > 0 ? callMessagesLog[0].text.slice(0, 50) : 'Assistance Vocale Personnalisée'),
        transcript: callMessagesLog.map(m => ({
          speaker: m.sender === 'user' ? 'client' : 'advisor',
          speakerName: m.sender === 'user' ? (currentUser?.name || 'Client') : callActiveAdvisor.fullName,
          text: m.text,
          timestamp: m.time
        })),
        commune: currentUser?.city || 'Cocody'
      });
    } catch (e) {
      console.warn('[AssistantArchive] Call record error', e);
    }

    const recapMsg: ChatMessage = {
      id: `call-recap-${Date.now()}`,
      sender: 'bot',
      advisorName: callActiveAdvisor.name,
      text: language === 'en'
        ? `📞 **Priority Callback Session Concluded**\nDuration: ${durationFormatted}\n\nYour exchange with ${callActiveAdvisor.fullName} is complete. Feel free to continue chatting here if you have any follow-up questions.`
        : `📞 **Appel Vocal Prioritaire Terminé**\nDurée de communication : ${durationFormatted}\n\nVotre échange téléphonique en direct avec votre conseiller(ère) ${callActiveAdvisor.fullName} est clôturé. Je reste à votre entière disposition dans cette messagerie pour toute question additionnelle.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCallRecap: true
    };

    setMessages(prev => [...prev, recapMsg]);
    playSuccessChime();
  };

  // ==========================================
  // SUBMIT CALL REQUEST (10 MIN COUNTDOWN)
  // ==========================================
  const handleSubmitCallRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callFormPhone.trim() || !callFormName.trim()) return;

    setCallFormSubmitting(true);

    // Request notification permission if not yet granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const newRequestData: PendingCallRequest = {
      id: `VIP-CALL-${Date.now().toString().slice(-6)}`,
      clientName: callFormName.trim(),
      clientPhone: callFormPhone.trim(),
      subject: callFormSubject,
      notes: callFormNotes.trim(),
      requestedAt: Date.now()
    };

    // 1. Create audit log & save in VIP calls list for admin page
    const createdVipCall = auditLogger.createVipCallRequest({
      userId: currentUser?.id || `usr-${Date.now()}`,
      userName: newRequestData.clientName,
      userPhone: newRequestData.clientPhone,
      userEmail: currentUser?.email || 'abonne.vip@bradci.com',
      passTier: (currentUser?.sellerPlan as any) || 'pro',
      subject: newRequestData.subject,
      preferredSlot: 'Rappel Immédiat (< 10 min)',
      notes: newRequestData.notes,
      commune: currentUser?.city || 'Cocody'
    });

    // 2. Persist in localStorage
    localStorage.setItem(STORAGE_ACTIVE_CALL_REQ, JSON.stringify(newRequestData));
    setPendingCallRequest(newRequestData);
    setCallCountdownSeconds(600); // 10 minutes

    // 3. Dispatch global event to sync admin assistance page
    window.dispatchEvent(new CustomEvent('bradci_new_vip_call', { detail: createdVipCall }));

    setCallFormSubmitting(false);
    playSuccessChime();
  };

  // Cancel call request
  const handleCancelCallRequest = () => {
    setPendingCallRequest(null);
    localStorage.removeItem(STORAGE_ACTIVE_CALL_REQ);
  };

  // Submit Rating
  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ratingObj: SessionRating = {
      stars: ratingStars,
      tags: selectedRatingTags,
      comment: ratingComment.trim(),
      advisorName: currentAdvisor.name,
      submittedAt: new Date().toISOString()
    };
    setSessionRating(ratingObj);
    setRatingSubmitted(true);
    playSuccessChime();
  };

  const toggleRatingTag = (tag: string) => {
    setSelectedRatingTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const ratingTagOptions = useMemo(() => [
    language === 'en' ? 'Quick response' : 'Réponse rapide',
    language === 'en' ? 'Clear explanation' : 'Explications très claires',
    language === 'en' ? 'Polite & helpful' : 'Conseiller(ère) très aimable',
    language === 'en' ? 'Issue resolved' : 'Problème résolu',
    language === 'en' ? 'Professional support' : 'Grand professionnalisme'
  ], [language]);

  return (
    <>
      {/* ======================================================== */}
      {/* 1. GLOBAL FLOATING INCOMING CALL OVERLAY / NOTIFICATION   */}
      {/* (Rings across the entire application even if chat closed) */}
      {/* ======================================================== */}
      {incomingCall && (
        <div 
          id="global-incoming-call-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 text-center space-y-5 animate-in zoom-in-95">
            
            {/* Pulsating Ringing Header */}
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs uppercase tracking-wider">
                <PhoneIncoming className="w-3.5 h-3.5 animate-bounce" />
                {translate("Appel Entrant • Rappel Garanti", "Incoming Call • Guaranteed Callback")}
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                {translate("Cellule d'Assistance Abonnés Pass", "Pass Subscriber Support Desk")}
              </p>
            </div>

            {/* Advisor Avatar with Pulsating Ring Effect */}
            <div className="relative inline-block my-2">
              <div className="absolute -inset-4 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none" />
              <div className="absolute -inset-2 rounded-full border border-emerald-500/60 animate-pulse pointer-events-none" />
              <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${incomingCall.advisor.avatarBg} text-white font-black text-3xl flex items-center justify-center shadow-2xl ring-4 ring-emerald-500`}>
                {incomingCall.advisor.avatarLetter}
              </div>
            </div>

            {/* Advisor Details */}
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white font-display">
                {incomingCall.advisor.fullName}
              </h3>
              <p className="text-xs text-emerald-400 font-semibold">
                {language === 'en' ? incomingCall.advisor.roleEn : incomingCall.advisor.roleFr}
              </p>
              <p className="text-[11px] text-slate-400">
                {translate("Service Client Officiel en Ligne", "Official Online Customer Care")}
              </p>
            </div>

            {/* Subject preview */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {translate("Objet de votre demande :", "Your request topic:")}
              </div>
              <p className="text-slate-200 font-medium line-clamp-2">
                {incomingCall.subject}
              </p>
            </div>

            {/* Action Buttons: DÉCROCHER / REFUSER */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Decline */}
              <button
                id="btn-incoming-call-decline"
                onClick={handleRejectIncomingCall}
                className="py-3 px-4 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{translate("Refuser", "Decline")}</span>
              </button>

              {/* Accept / Answer */}
              <button
                id="btn-incoming-call-accept"
                onClick={handleAcceptIncomingCall}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 animate-pulse"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{translate("DÉCROCHER", "ANSWER")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FLOATING TRIGGER BUTTON (Bottom right)                */}
      {/* ======================================================== */}
      {!isOpen && (
        <div id="online-customer-support-hud" className="fixed bottom-20 sm:bottom-5 right-3 sm:right-5 z-40">
          <button
            id="btn-open-support-chat"
            onClick={() => setIsOpen(true)}
            className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-2xl shadow-amber-500/30 flex items-center gap-2.5 font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="relative">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${currentAdvisor.avatarBg} text-white flex items-center justify-center font-black text-xs shadow-inner`}>
                {currentAdvisor.avatarLetter}
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xs leading-tight font-black">
                  {currentAdvisor.name}
                </span>
                {isPassAbonne ? (
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> VIP PASS
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-950/40 text-slate-900 px-1.5 py-0.2 rounded font-bold">
                    {translate("Support En Ligne", "Online Support")}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-950/80 font-medium block">
                {pendingCallRequest
                  ? translate(`Rappel en attente (${Math.floor(callCountdownSeconds / 60)}m${callCountdownSeconds % 60}s)`, `Callback pending (${Math.floor(callCountdownSeconds / 60)}m${callCountdownSeconds % 60}s)`)
                  : isPassAbonne 
                    ? translate("Support VIP • Messagerie & Rappel < 10 min", "VIP Support • Chat & Callback < 10 min")
                    : translate("Assistance Clientèle Dédiée", "Dedicated Customer Support")}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN CHAT & CALL WINDOW                               */}
      {/* ======================================================== */}
      {isOpen && (
        <div 
          id="modal-support-window" 
          className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 w-full sm:w-[460px] h-[100dvh] sm:h-[650px] sm:max-h-[88vh] bg-white dark:bg-slate-950 sm:border sm:border-slate-200 dark:sm:border-slate-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4"
        >
          {/* Header with Advisor Persona & Controls */}
          <div className="p-3.5 bg-[#1E53E5] text-white border-b border-[#1643BF] flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs text-white border border-white/20 font-black flex items-center justify-center shadow-xs text-sm`}>
                    {currentAdvisor.avatarLetter}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#1E53E5] ${isSessionClosed ? 'bg-slate-300' : 'bg-emerald-400 animate-pulse'}`} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-black text-sm text-white font-display">
                      {currentAdvisor.fullName}
                    </h4>
                    <span className="text-[9px] bg-white/20 text-white font-bold px-1.5 py-0.5 rounded border border-white/30 truncate max-w-[150px]">
                      {language === 'en' ? currentAdvisor.roleEn : currentAdvisor.roleFr}
                    </span>
                    {isPassAbonne && (
                      <span className="text-[9px] bg-[#FF5B00] text-white font-black px-1.5 py-0.5 rounded border border-white/30 flex items-center gap-0.5 shadow-xs">
                        <Crown className="w-2.5 h-2.5 text-white" /> VIP
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/80 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse"></span>
                    <span>{translate("Service Client Officiel en Ligne", "Official Online Customer Care")}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Voice auto-play toggle */}
                <button
                  id="btn-toggle-auto-voice"
                  onClick={toggleAutoVoice}
                  title={autoVoice ? translate("Désactiver la lecture vocale", "Disable voice speech") : translate("Activer la lecture vocale", "Enable voice speech")}
                  className={`p-1.5 rounded-xl border transition-all ${
                    autoVoice 
                      ? 'bg-white/25 border-white text-white' 
                      : 'bg-white/10 border-white/20 text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {autoVoice ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Close Session Button */}
                {!isSessionClosed && !isVoiceCallActive && (
                  <button
                    id="btn-end-chat-session"
                    onClick={() => handleCloseSession(false)}
                    title={translate("Clôturer la conversation", "End conversation")}
                    className="px-2 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold border border-white/20 transition-colors"
                  >
                    {translate("Terminer", "End")}
                  </button>
                )}

                {/* Close Window */}
                <button
                  id="btn-close-support-modal"
                  onClick={() => {
                    if (isVoiceCallActive) {
                      handleEndVoiceCall();
                    }
                    voiceNavigator.stop();
                    setIsSpeaking(false);
                    setIsOpen(false);
                  }}
                  className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar: Messagerie vs Demande d'Appel */}
            {!isVoiceCallActive && !isSearchingAdvisor && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-1 gap-1">
                <button
                  id="tab-chat-messaging"
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'chat'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#1E53E5] dark:text-sky-400" />
                  <span>{translate("Messagerie", "Messaging")}</span>
                </button>

                <button
                  id="tab-chat-call-request"
                  onClick={() => setActiveTab('call_request')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
                    activeTab === 'call_request'
                      ? 'bg-[#FF5B00]/15 dark:bg-amber-500/20 text-[#FF5B00] dark:text-amber-300 shadow-xs border border-[#FF5B00]/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#FF5B00]'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-[#FF5B00] dark:text-amber-400" />
                  <span>{translate("Demande d'Appel", "Call Request")}</span>

                  {pendingCallRequest ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-black text-[9px] animate-pulse">
                      {Math.floor(callCountdownSeconds / 60)}:{String(callCountdownSeconds % 60).padStart(2, '0')}
                    </span>
                  ) : isPassAbonne ? (
                    <span className="ml-1 text-[9px] bg-[#FF5B00] text-white font-black px-1.5 py-0.2 rounded">
                      &lt; 10 min
                    </span>
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500 ml-0.5" />
                  )}
                </button>
              </div>
            )}

            {/* =================================================== */}
            {/* SCREEN 1: ADVISOR MATCHING / SEARCH HUD             */}
            {/* =================================================== */}
            {isSearchingAdvisor ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-950 space-y-5 animate-in fade-in">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-amber-500 bg-amber-500/10">
                    <Radio className="w-9 h-9 animate-pulse text-amber-400" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping" />
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-base font-bold text-white font-display">
                    {translate("Attribution d'un conseiller disponible...", "Assigning an available advisor...")}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {translate("Mise en relation directe avec notre équipe du service client en ligne.", "Direct connection with our online customer care team.")}
                  </p>
                </div>
              </div>
            ) : isVoiceCallActive ? (
              /* =================================================== */
              /* SCREEN 2: IN-APP LIVE AUDIO VOICE CALL VIEW         */
              /* (100% VOCAL & AUDITIF - AUCUN TEXTE ÉCRIT)          */
              /* =================================================== */
              <div className="flex-1 p-6 flex flex-col justify-between items-center bg-slate-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-at-c from-emerald-950/25 via-slate-950/95 to-slate-950 pointer-events-none" />

                {/* Top Call Status Banner */}
                <div className="text-center pt-2 relative z-10 space-y-1.5 max-w-xs">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] tracking-wide uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {translate("Appel vocal en direct", "Live voice call")}
                  </span>
                  
                  <h3 className="text-xl font-black text-white font-display tracking-tight">
                    {callActiveAdvisor.fullName}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {language === 'en' ? callActiveAdvisor.roleEn : callActiveAdvisor.roleFr}
                  </p>
                </div>

                {/* Center Call Visualizer & Equalizer */}
                <div className="my-auto text-center relative z-10 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-tr ${callActiveAdvisor.avatarBg} text-white font-black text-4xl flex items-center justify-center shadow-2xl border-4 transition-all duration-300 ${
                      isAdvisorSpeakingOnCall 
                        ? 'border-emerald-400 ring-8 ring-emerald-500/30 scale-105 shadow-emerald-500/30' 
                        : isCallThinking
                          ? 'border-amber-400 ring-8 ring-amber-500/30 animate-pulse shadow-amber-500/30'
                          : isUserSpeakingOnCall
                            ? 'border-sky-400 ring-8 ring-sky-500/30 scale-105 shadow-sky-500/30'
                            : 'border-slate-800 shadow-slate-900/60'
                    }`}>
                      {callActiveAdvisor.avatarLetter}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Call duration timer */}
                    <div className="text-3xl font-black font-mono text-emerald-400 tracking-wider">
                      {String(Math.floor(callStopwatchSeconds / 60)).padStart(2, '0')}:{String(callStopwatchSeconds % 60).padStart(2, '0')}
                    </div>
                    
                    {/* Audio Equalizer Waveform */}
                    <div className="flex items-center justify-center gap-1.5 h-10">
                      {[45, 80, 95, 60, 100, 90, 65, 95, 75, 85, 60, 70, 90, 50].map((height, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 rounded-full transition-all duration-150 ${
                            isAdvisorSpeakingOnCall 
                              ? 'bg-emerald-400' 
                              : isCallThinking
                                ? 'bg-amber-400 animate-pulse'
                                : isUserSpeakingOnCall 
                                  ? 'bg-sky-400' 
                                  : 'bg-slate-700'
                          }`}
                          style={{
                            height: (isAdvisorSpeakingOnCall || isUserSpeakingOnCall || isCallThinking) 
                              ? `${Math.max(10, (height * ((idx % 4 + 1) / 4)) * (isAdvisorSpeakingOnCall ? 0.4 : 0.28))}px` 
                              : '6px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Call Action Controls (Microphone, Hang up, Speaker) */}
                <div className="w-full max-w-xs relative z-10 pt-4 pb-2">
                  <div className="flex items-center justify-around">
                    {/* Mic Mute / Unmute */}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => setIsCallMicMuted(!isCallMicMuted)}
                        title={isCallMicMuted ? translate("Réactiver micro", "Unmute mic") : translate("Couper micro", "Mute mic")}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                          isCallMicMuted 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' 
                            : isUserSpeakingOnCall
                              ? 'bg-sky-500 text-white ring-4 ring-sky-400/40 animate-pulse shadow-lg shadow-sky-500/40'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isCallMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isCallMicMuted ? translate("Micro coupé", "Muted") : translate("Micro", "Mic")}
                      </span>
                    </div>

                    {/* End Call (Raccrocher) */}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        id="btn-end-voice-call"
                        onClick={handleEndVoiceCall}
                        title={translate("Raccrocher", "End call")}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/40 flex items-center justify-center transition-transform active:scale-95 hover:scale-105"
                      >
                        <PhoneOff className="w-7 h-7" />
                      </button>
                      <span className="text-[10px] text-red-400 font-bold">
                        {translate("Raccrocher", "End")}
                      </span>
                    </div>

                    {/* Speaker Sound Toggle */}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => {
                          const next = !isCallSpeakerMuted;
                          setIsCallSpeakerMuted(next);
                          if (next) {
                            voiceNavigator.stop();
                            setIsAdvisorSpeakingOnCall(false);
                          }
                        }}
                        title={isCallSpeakerMuted ? translate("Activer le son", "Unmute speaker") : translate("Couper le son", "Mute speaker")}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                          isCallSpeakerMuted 
                            ? 'bg-amber-500/20 border border-amber-500 text-amber-400' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isCallSpeakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isCallSpeakerMuted ? translate("Son coupé", "Muted") : translate("Haut-parleur", "Speaker")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'call_request' ? (
              /* =================================================== */
              /* SCREEN 3: CALL REQUEST TAB (10-MIN GUARANTEE)       */
              /* =================================================== */
              <div className="flex-1 p-4 overflow-y-auto bg-slate-950 space-y-4">
                {!isPassAbonne ? (
                  // Restricted View for non-Pass users
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 text-center space-y-4 my-auto">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                      <Lock className="w-8 h-8" />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {translate("Exclusivité Pass Abonnés", "Pass Subscribers Exclusive")}
                      </span>
                      <h3 className="text-base font-black text-white font-display">
                        {translate("Service de Rappel sous 10 minutes", "10-Minute Guaranteed Callback Service")}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                        {translate(
                          "Le service de rappel direct par un conseiller dédié est réservé aux membres abonnés aux Pass Vendeur Pro, Standard ou Livreur VIP. Dès votre demande, un conseiller libre vous contacte automatiquement sous 10 minutes maximum.",
                          "Direct callback service by a dedicated advisor is reserved for Pro Seller, Standard Seller, or VIP Driver Pass holders. Once requested, an available advisor calls you within 10 minutes max."
                        )}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setPricingModalOpen(true)}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-transform active:scale-95"
                      >
                        <Crown className="w-4 h-4" />
                        <span>{translate("Souscrire à un Pass Pro / Standard", "Subscribe to Pro / Standard Pass")}</span>
                      </button>
                    </div>
                  </div>
                ) : pendingCallRequest ? (
                  // Active 10-Minute Countdown Card
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 text-center space-y-5">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-[10px] uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        {translate("Demande de Rappel Prise en Compte", "Callback Request In Progress")}
                      </span>
                      <p className="text-xs text-slate-400">
                        Ticket #{pendingCallRequest.id}
                      </p>
                    </div>

                    {/* Big Digital Clock */}
                    <div className="space-y-1">
                      <div className="text-5xl font-black font-mono text-amber-400 tracking-tight">
                        {String(Math.floor(callCountdownSeconds / 60)).padStart(2, '0')}:{String(callCountdownSeconds % 60).padStart(2, '0')}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {translate("Délai maximum garanti avant rappel automatique", "Maximum guaranteed time before callback")}
                      </p>
                    </div>

                    {/* Info Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>{translate("Bénéficiaire :", "Recipient:")}</span>
                        <strong className="text-white">{pendingCallRequest.clientName}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>{translate("Téléphone à contacter :", "Phone to reach:")}</span>
                        <span className="text-emerald-400 font-mono font-bold">{pendingCallRequest.clientPhone}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-slate-300">
                        <span className="text-[10px] text-slate-400 block">{translate("Préoccupation :", "Concern:")}</span>
                        <p className="font-semibold text-amber-300">{pendingCallRequest.subject}</p>
                      </div>
                    </div>

                    {/* Explanatory Notice */}
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 leading-relaxed text-left flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <div>
                        <strong>{translate("Transmission à l'assistance effectuée :", "Transmitted to support:")}</strong>{' '}
                        {translate(
                          "Recherche en cours d'un conseiller disponible parmi notre équipe (Awa, Fatou, Ibrahim, Aminata, Sekou...). Dès qu'un conseiller sans échange en cours est assigné (sous 2 à 10 minutes), votre appareil sonnera automatiquement. Veuillez garder votre connexion activée.",
                          "Searching for an available advisor from our team (Awa, Fatou, Ibrahim, Aminata, Sekou...). As soon as an advisor without active chat is assigned (within 2 to 10 min), your device will ring automatically. Please keep your connection active."
                        )}
                      </div>
                    </div>

                    {/* Cancel Request Button */}
                    <button
                      onClick={handleCancelCallRequest}
                      className="text-xs text-red-400 hover:text-red-300 font-bold underline"
                    >
                      {translate("Annuler cette demande de rappel", "Cancel this callback request")}
                    </button>
                  </div>
                ) : (
                  // New Call Request Form for Pass Subscribers
                  <form onSubmit={handleSubmitCallRequest} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                          {translate("Service de Rappel Garanti sous 10 minutes", "Guaranteed Callback Under 10 Minutes")}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {translate(
                          "Renseignez votre nom et numéro. Notre système recherche un conseiller libre sans chat ouvert et lance un appel automatique vers votre appareil sous 10 minutes maximum.",
                          "Fill in your name and phone. Our system searches for a free advisor without open chat and launches an automatic call to your device within 10 minutes."
                        )}
                      </p>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        {translate("Nom et Prénoms *", "Full Name *")}
                      </label>
                      <input
                        type="text"
                        required
                        value={callFormName}
                        onChange={(e) => setCallFormName(e.target.value)}
                        placeholder="Ex: Kouamé Jean"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        {translate("Numéro de téléphone joignable *", "Reachable phone number *")}
                      </label>
                      <input
                        type="tel"
                        required
                        value={callFormPhone}
                        onChange={(e) => setCallFormPhone(e.target.value)}
                        placeholder="Ex: +225 07 00 00 00 00"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    {/* Subject Select */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        {translate("Objet de votre préoccupation *", "Topic of your concern *")}
                      </label>
                      <select
                        value={callFormSubject}
                        onChange={(e) => setCallFormSubject(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Question ou problème sur une commande / enchère">Question ou problème sur une commande / enchère</option>
                        <option value="Paiement sécurisé, Mobile Money & Code secret">Paiement sécurisé, Mobile Money & Code secret</option>
                        <option value="Livraison, localisation coursier & litige colis">Livraison, localisation coursier & litige colis</option>
                        <option value="Gestion du compte, Pass Pro & certification KYC">Gestion du compte, Pass Pro & certification KYC</option>
                        <option value="Autre préoccupation urgente">Autre préoccupation urgente</option>
                      </select>
                    </div>

                    {/* Notes (Optional) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        {translate("Précisions complémentaires (facultatif)", "Additional details (optional)")}
                      </label>
                      <textarea
                        rows={2}
                        value={callFormNotes}
                        onChange={(e) => setCallFormNotes(e.target.value)}
                        placeholder={translate("Ex: Numéro de commande ou question spécifique...", "Ex: Order ID or specific inquiry...")}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={callFormSubmitting || !callFormName.trim() || !callFormPhone.trim()}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-transform active:scale-95"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{translate("Valider la demande de rappel (< 10 min)", "Submit callback request (< 10 min)")}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* =================================================== */
              /* SCREEN 4: STANDARD MESSAGING TAB                    */
              /* =================================================== */
              <>
                <div id="chat-messages-container" className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50 dark:bg-slate-950">
                  {messages.map((m) => {
                    const isBot = m.sender === 'bot';
                    const isCurrentSpeaking = speakingMessageId === m.id && isSpeaking;
                    const isSecurityBlocked = m.category === 'security_blocked';

                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                      >
                        {isBot && (
                          <div className={`w-8 h-8 rounded-full bg-[#1E53E5] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5`}>
                            {currentAdvisor.avatarLetter}
                          </div>
                        )}

                        <div className={`space-y-1.5 max-w-[84%] ${isBot ? 'items-start' : 'items-end'}`}>
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed transition-all ${
                              m.isAdminDirect
                                ? 'bg-gradient-to-br from-[#FF5B00]/15 via-white dark:via-slate-900 to-slate-50 dark:to-slate-950 border-2 border-[#FF5B00] text-slate-900 dark:text-slate-100 shadow-md'
                                : isBot
                                ? isSecurityBlocked
                                  ? 'bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-900 dark:text-red-200'
                                  : 'bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                                : 'bg-[#FF5B00] text-white font-medium ml-auto shadow-md shadow-[#FF5B00]/25'
                            }`}
                          >
                            {/* Special Admin Verified Header */}
                            {m.isAdminDirect && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/30 text-amber-300 font-black text-[10px] tracking-wide mb-2 border border-amber-400/40">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>👑 DIRECTION BRAD'CI • RÉPONSE OFFICIELLE EN DIRECT</span>
                              </div>
                            )}

                            {/* Sender Info for Bot */}
                            {isBot && !m.isAdminDirect && (
                              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="font-black text-slate-900 dark:text-white">
                                  {m.advisorName || currentAdvisor.name}
                                </span>
                                <span className="font-mono text-[9px]">
                                  {m.timestamp}
                                </span>
                              </div>
                            )}

                            {/* Attached Image / Audio / File Display */}
                            {m.attachment && (
                              <div className="mb-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                                {m.attachment.type.startsWith('image/') ? (
                                  <div className="space-y-1.5">
                                    <img 
                                      src={m.attachment.dataUrl} 
                                      alt={m.attachment.name}
                                      onClick={() => setPreviewImageModal(m.attachment?.dataUrl || null)}
                                      className="max-h-40 w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                      <span className="truncate max-w-[140px]">{m.attachment.name}</span>
                                      <span>{formatFileSize(m.attachment.size)}</span>
                                    </div>
                                  </div>
                                ) : m.attachment.type.startsWith('audio/') ? (
                                  <div className="space-y-1.5 p-1">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                                      <Mic className="w-3.5 h-3.5 text-amber-400" />
                                      <span>{translate("Note vocale enregistrée", "Recorded voice note")}</span>
                                    </div>
                                    <audio controls src={m.attachment.dataUrl} className="w-full h-8" />
                                    <div className="text-[9.5px] text-slate-400 flex justify-between items-center">
                                      <span className="truncate">{m.attachment.name}</span>
                                      <span>{formatFileSize(m.attachment.size)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold truncate text-[11px] text-white">
                                        {m.attachment.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {formatFileSize(m.attachment.size)}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message Text */}
                            <div className="whitespace-pre-line break-words">
                              {m.text}
                            </div>

                            {/* Timestamp for user */}
                            {!isBot && (
                              <div className="text-[9px] text-white/80 text-right mt-1 font-mono">
                                {m.timestamp}
                              </div>
                            )}
                          </div>

                          {/* Action Button & Speech Controls for Bot Messages */}
                          {isBot && !m.isClosingNotice && (
                            <div className="flex items-center gap-2 pt-0.5">
                              {/* Audio Readout */}
                              <button
                                onClick={() => handleSpeakText(m.id, m.text)}
                                title={isCurrentSpeaking ? translate("Arrêter", "Stop") : translate("Écouter la réponse", "Listen to answer")}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${
                                  isCurrentSpeaking 
                                    ? 'bg-[#FF5B00] text-white font-black' 
                                    : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs'
                                }`}
                              >
                                {isCurrentSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                <span>{isCurrentSpeaking ? translate("Arrêter", "Stop") : translate("Écouter", "Listen")}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Clean Animated Typing Indicator (NO artificial delay seconds or progress bars) */}
                  {isTyping && (
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs w-fit max-w-sm animate-in fade-in">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${currentAdvisor.avatarBg} text-white font-black text-[10px] flex items-center justify-center shrink-0`}>
                        {currentAdvisor.avatarLetter}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">
                          {currentAdvisor.name} {translate("est en train d'écrire...", "is typing...")}
                        </span>
                        <div className="flex gap-1 items-center ml-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Session Closed & Rating Box */}
                  {isSessionClosed && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {translate("Évaluer cet échange", "Rate this session")}
                        </span>
                        <button
                          onClick={handleStartNewSession}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-xl flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{translate("Nouvel échange", "New session")}</span>
                        </button>
                      </div>

                      {ratingSubmitted ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1">
                          <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{translate("Merci pour votre avis !", "Thank you for your feedback!")}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {translate(`Votre note pour ${currentAdvisor.name} a bien été transmise à notre équipe.`, `Your review for ${currentAdvisor.name} has been received.`)}
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleRatingSubmit} className="space-y-2.5">
                          {/* Stars */}
                          <div className="flex items-center justify-center gap-1.5 py-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingStars(star)}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star 
                                  className={`w-6 h-6 ${star <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
                                />
                              </button>
                            ))}
                          </div>

                          {/* Quick Feedback Tags */}
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {ratingTagOptions.map((tag, idx) => {
                              const isSelected = selectedRatingTags.includes(tag);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleRatingTag(tag)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                    isSelected 
                                      ? 'bg-amber-500 text-slate-950 border-amber-500' 
                                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>

                          <textarea
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            placeholder={translate("Votre commentaire ou remarque...", "Your comment or notes...")}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                            rows={2}
                          />

                          <button
                            type="submit"
                            className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors border border-slate-700"
                          >
                            {translate("Envoyer mon avis", "Submit review")}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions Shortcuts (FAQ 1-Click) */}
                {!isSessionClosed && (
                  <div className="px-2.5 py-1.5 bg-slate-100/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                    {[
                      { label: translate("🛡️ Paiement livraison", "🛡️ Delivery Payment"), q: translate("Comment fonctionne le paiement à la livraison (POD) ?", "How does Payment on Delivery work?") },
                      { label: translate("📦 Suivre colis", "📦 Track Parcel"), q: translate("Comment puis-je suivre l'arrivée de mon colis avec le coursier ?", "How do I track my parcel delivery with the courier?") },
                      { label: translate("🔨 Remporter enchère", "🔨 Win Auction"), q: translate("Quelles sont les règles pour remporter une enchère express ?", "What are the rules to win an express auction?") },
                      { label: translate("💰 Retrait Wave/OM", "💰 Wave/OM Cashout"), q: translate("Comment retirer les fonds de mon solde portefeuille ?", "How can I withdraw my wallet funds via Wave or Orange Money?") },
                      { label: translate("📞 Demander un rappel", "📞 Request Call"), q: translate("Je souhaite être rappelé rapidement par un conseiller humain.", "I would like a fast phone call from an advisor.") },
                    ].map((faq, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputText(faq.q);
                        }}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-[#FF5B00]/10 text-slate-700 dark:text-slate-300 hover:text-[#FF5B00] border border-slate-200 dark:border-slate-800 hover:border-[#FF5B00]/40 whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-xs"
                      >
                        {faq.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Microphone Recording Banner */}
                {isListening && (
                  <div className="px-3 py-2 bg-gradient-to-r from-red-950/70 to-slate-900 border-t border-red-500/40 flex items-center justify-between text-xs animate-in fade-in shrink-0">
                    <div className="flex items-center gap-2 text-red-300 min-w-0">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <span className="font-bold text-[11px] truncate">
                        {translate("Micro activé : Parlez, nous vous écoutons...", "Mic active: Speak, we are listening...")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleToggleListening}
                        className="px-2.5 py-1 bg-red-500 hover:bg-red-400 text-white rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer shadow-sm"
                      >
                        {translate("Terminer", "Done")}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelListening}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10.5px] transition-colors cursor-pointer"
                      >
                        {translate("Annuler", "Cancel")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected File / Image Attachment Preview */}
                {selectedFile && (
                  <div className="px-3.5 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {selectedFile.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="truncate text-slate-200 text-xs">{selectedFile.name}</span>
                      <span className="text-[10px] text-slate-400">({formatFileSize(selectedFile.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Bottom Input Form */}
                <form 
                  onSubmit={handleSend}
                  className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 pb-[calc(0.85rem+env(safe-area-inset-bottom,0px))]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={translate("Joindre une photo ou un document", "Attach photo or document")}
                    disabled={isSessionClosed || isTyping}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isSessionClosed
                        ? translate("Conversation clôturée - Cliquez sur Nouvel échange", "Session closed - Click New session")
                        : translate("Posez votre question à votre conseiller...", "Ask your advisor a question...")
                    }
                    disabled={isSessionClosed || isTyping}
                    className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF5B00] disabled:opacity-50"
                  />

                  {/* Mic Button */}
                  <button
                    type="button"
                    onClick={handleToggleListening}
                    disabled={isSessionClosed || isTyping}
                    title={isListening ? translate("Écoute en cours...", "Listening...") : translate("Dicter au micro", "Dictate with mic")}
                    className={`w-10 h-10 rounded-xl border transition-all shrink-0 flex items-center justify-center cursor-pointer active:scale-95 ${
                      isListening 
                        ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Send Button (Always prominent and perfectly accessible) */}
                  <button
                    id="btn-chat-send-message"
                    type="submit"
                    disabled={(!inputText.trim() && !selectedFile) || isSessionClosed || isTyping}
                    className="w-11 h-10 rounded-xl bg-[#FF5B00] hover:bg-[#E05000] disabled:opacity-40 text-white transition-all font-bold shrink-0 flex items-center justify-center shadow-lg shadow-[#FF5B00]/25 cursor-pointer active:scale-95"
                    title={translate("Envoyer le message", "Send message")}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        )}

      {/* ======================================================== */}
      {/* 4. PREVIEW MODAL FOR ATTACHED IMAGES                     */}
      {/* ======================================================== */}
      {previewImageModal && (
        <div 
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageModal} 
              alt="Preview" 
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
