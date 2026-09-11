import React, { useState, useEffect, useRef } from 'react';
import { 
  User,
  X, 
  Send, 
  ShieldCheck, 
  Phone,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  UserCheck,
  Lock,
  ArrowRight,
  Clock,
  CheckCircle2,
  PhoneCall,
  Crown,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryBradCiKnowledge, AIKnowledgeResponse } from '../utils/aiKnowledgeEngine';
import { voiceNavigator, playSuccessChime, playGpsChime } from '../utils/voiceNavigator';
import { auditLogger } from '../utils/activityAuditLogger';
import { VipCallRequest } from '../types/audit';

interface Message {
  id: string;
  sender: 'bot' | 'user' | 'agent';
  text: string;
  timestamp: string;
  category?: AIKnowledgeResponse['category'];
  suggestedAction?: AIKnowledgeResponse['suggestedAction'];
  agentName?: string;
}

export const AIChatSupport: React.FC = () => {
  const { 
    setPricingModalOpen, 
    setAuthModalOpen, 
    setKycModalOpen, 
    language, 
    translate,
    currentUser
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'vip_call'>('chat');
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [autoVoice, setAutoVoice] = useState<boolean>(() => {
    return localStorage.getItem('bradci_auto_voice') === 'true';
  });

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);

  // VIP 85-Minute Phone Call Form state
  const isSubscriber = Boolean(
    currentUser && (
      currentUser.sellerPlan === 'standard' || 
      currentUser.sellerPlan === 'pro' || 
      currentUser.driverPlan === 'vip_pass' || 
      currentUser.isVIP
    )
  );

  const [callPhone, setCallPhone] = useState(currentUser?.phone || '');
  const [callName, setCallName] = useState(currentUser?.name || '');
  const [callSlot, setCallSlot] = useState('Immédiat (Priorité Pass - Moins de 15 min)');
  const [callSubject, setCallSubject] = useState('Assistance Vente & Arbitrage 5 Offres');
  const [callNotes, setCallNotes] = useState('');
  const [submittedVipCall, setSubmittedVipCall] = useState<VipCallRequest | null>(null);
  const [countdownMinutes, setCountdownMinutes] = useState(85);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      agentName: 'Fatou - Conseillère BRAD\'CI Support',
      text: language === 'en'
        ? "Bonjour & welcome to BRAD'CI! I am Fatou, your dedicated customer care advisor in Abidjan (Plateau).\n\nI am at your full service to guide you through any aspect of our platform:\n• **Registration & Security**: 6-digit email security code and KYC identity certification.\n• **5-Bid Live Auctions**: Bidding rules, increments, and seller choice upon 5 offers.\n• **Direct Pay on Delivery (POD)**: Payment via Mobile Money (Wave, Orange, MTN, Moov) and 4-digit secret delivery code.\n• **Express Freight & GPS**: Courier tracking in real time on Google Maps.\n• **Pass & VIP Subscriptions**: Dedicated seller boutique, unlimited listings, and dedicated VIP 85-minute call requests."
        : "Bonjour et bienvenue sur BRAD'CI ! Je suis Fatou, votre conseillère dédiée du service client à Abidjan (Plateau).\n\nJe suis à votre entière disposition pour vous accompagner dans toutes vos démarches :\n• **Inscription & Sécurité** : Validation par Code de Sécurité email et certification d'identité KYC.\n• **Enchères & Règle des 5 Offres** : Arbitrage du vendeur dès 5 offres concurrentes.\n• **Paiement à la Livraison (POD)** : Règlement Mobile Money (Wave, Orange, MTN, Moov) et Code Secret de Remise à 4 chiffres.\n• **Courses Express & Fret Colis** : Suivi cartographique des coursiers en temps réel sur Google Maps.\n• **Pass Abonnés & Tarifs** : Boutiques Pro, visibilité prioritaire et demandes d'appel téléphonique dédiées de 85 minutes.",
      timestamp: language === 'en' ? 'Now' : 'Maintenant',
      category: 'general',
      suggestedAction: {
        labelFr: "Demande d'Appel (Pass Abonnés)",
        labelEn: "VIP Call Request (Subscribers)",
        actionType: "connect_agent"
      }
    }
  ]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab, isThinking]);

  // Global listener to open support modal from anywhere in the app
  useEffect(() => {
    const handleOpenSupport = (e: any) => {
      setIsOpen(true);
      if (e.detail?.tab === 'vip_call' || e.detail?.tab === 'human') {
        setActiveTab('vip_call');
      } else {
        setActiveTab('chat');
      }
    };

    const handleOpenSupportMic = async () => {
      setIsOpen(true);
      setActiveTab('chat');
      setTimeout(() => {
        handleToggleListening();
      }, 250);
    };

    window.addEventListener('bradci_open_support', handleOpenSupport);
    window.addEventListener('bradci_open_support_mic', handleOpenSupportMic);
    return () => {
      window.removeEventListener('bradci_open_support', handleOpenSupport);
      window.removeEventListener('bradci_open_support_mic', handleOpenSupportMic);
    };
  }, []);

  // Timer countdown for active VIP call request
  useEffect(() => {
    if (!submittedVipCall) return;

    const interval = setInterval(() => {
      setCountdownSeconds(prevSec => {
        if (prevSec > 0) return prevSec - 1;
        setCountdownMinutes(prevMin => (prevMin > 0 ? prevMin - 1 : 0));
        return 59;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submittedVipCall]);

  // Setup Web Speech Recognition
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
      } catch {
        // speech unsupported
      }
    }
  }, [language]);

  const toggleAutoVoice = () => {
    const next = !autoVoice;
    setAutoVoice(next);
    localStorage.setItem('bradci_auto_voice', String(next));
    if (!next) {
      voiceNavigator.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const handleSpeakText = (messageId: string, text: string) => {
    if (isSpeaking && speakingMessageId === messageId) {
      voiceNavigator.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    const cleanText = text
      .replace(/[*_~`#>]/g, '')
      .replace(/•/g, ', ')
      .replace(/\n\s*\n/g, '. ')
      .trim();

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    voiceNavigator.speak(cleanText, language === 'en' ? 'en' : 'fr', () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    });
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

      playGpsChime();
      recognitionRef.current.lang = language === 'en' ? 'en-US' : 'fr-FR';
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const isEn = language === 'en';
    const query = inputText.trim();
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    let finalReplyText = '';
    let category: AIKnowledgeResponse['category'] = 'general';
    let suggestedAction: AIKnowledgeResponse['suggestedAction'] | undefined = undefined;

    try {
      // 1. First attempt: Full-Stack Gemini Assistant endpoint
      const res = await fetch('/api/chat/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          history: messages.slice(-4)
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          finalReplyText = data.reply;
          category = data.source === 'security_filter' ? 'security_blocked' : 'general';
        }
      }
    } catch {
      // Fallback
    }

    // 2. If Gemini API endpoint is empty or offline, seamlessly use our comprehensive local Knowledge Engine
    if (!finalReplyText) {
      const localResponse = queryBradCiKnowledge(query, language);
      finalReplyText = localResponse.text;
      category = localResponse.category;
      suggestedAction = localResponse.suggestedAction;
    }

    setIsThinking(false);

    const botMsgId = `b-${Date.now()}`;
    const botReply: Message = {
      id: botMsgId,
      sender: 'bot',
      agentName: 'Fatou - Conseillère BRAD\'CI Support',
      text: finalReplyText,
      timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
      category,
      suggestedAction
    };

    setMessages(prev => [...prev, botReply]);

    // Auto-Voice readout if enabled
    if (autoVoice) {
      setTimeout(() => {
        handleSpeakText(botMsgId, finalReplyText);
      }, 150);
    }
  };

  // Action dispatcher
  const handleExecuteAction = (actionType?: string) => {
    if (!actionType) return;
    switch (actionType) {
      case 'open_auth':
        setAuthModalOpen(true);
        break;
      case 'open_pricing':
        setPricingModalOpen(true);
        break;
      case 'open_kyc':
        setKycModalOpen(true);
        break;
      case 'connect_agent':
        setActiveTab('vip_call');
        break;
      case 'filter_auctions':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleVipCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callPhone.trim()) return;

    const passTier = currentUser?.sellerPlan === 'pro' 
      ? 'pro' 
      : currentUser?.driverPlan === 'vip_pass' 
        ? 'vip_pass' 
        : 'standard';

    const req = auditLogger.createVipCallRequest({
      userId: currentUser?.id || `usr-${Date.now()}`,
      userName: callName || currentUser?.name || 'Abonné BRAD\'CI',
      userPhone: callPhone,
      userEmail: currentUser?.email || 'abonne@bradci.com',
      passTier,
      subject: callSubject,
      preferredSlot: callSlot,
      notes: callNotes,
      commune: currentUser?.city || 'Plateau'
    });

    setSubmittedVipCall(req);
    setCountdownMinutes(85);
    setCountdownSeconds(0);
    playSuccessChime();
  };

  return (
    <div id="bradci-customer-support-hud" className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          id="btn-open-support-chat"
          onClick={() => setIsOpen(true)}
          className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-2xl shadow-amber-500/30 flex items-center gap-2.5 font-bold text-xs transition-transform hover:scale-105"
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-slate-900 border border-amber-400 flex items-center justify-center text-amber-400 font-black text-[11px]">
              F
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block font-display text-xs leading-tight font-black">
              {translate("Fatou • Support BRAD'CI", "Fatou • BRAD'CI Support")}
            </span>
            <span className="text-[10px] text-slate-950/80 font-medium block">
              {translate("En Ligne • Voix & Conseils", "Online • Voice & Help")}
            </span>
          </div>
        </button>
      )}

      {/* Main Support Window */}
      {isOpen && (
        <div id="modal-support-window" className="w-[calc(100vw-24px)] sm:w-[420px] max-h-[88vh] sm:h-[610px] bg-slate-950 border-2 border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          
          {/* Header with Human Advisor Persona */}
          <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center border border-amber-300 shadow-md">
                  <User className="w-5 h-5 text-slate-950" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-white font-display">
                    Fatou
                  </h4>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                    {translate("Conseillère BRAD'CI", "BRAD'CI Advisor")}
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {translate("En Ligne", "Online")}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>{translate("Service Client Plateau Abidjan", "Abidjan Plateau Customer Care")}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">{translate("Garantie Sécurisée", "Verified Escrow")}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice auto-play toggle */}
              <button
                id="btn-toggle-auto-voice"
                onClick={toggleAutoVoice}
                title={autoVoice ? translate("Désactiver la voix auto", "Disable auto-speech") : translate("Activer la voix auto", "Enable auto-speech")}
                className={`p-1.5 rounded-xl border transition-all ${
                  autoVoice 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {autoVoice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                id="btn-close-support-modal"
                onClick={() => {
                  voiceNavigator.stop();
                  setIsSpeaking(false);
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-900 border-b border-slate-800 p-1">
            <button
              id="tab-advisor-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{translate("Conseillère En Ligne", "Online Advisor")}</span>
            </button>
            
            <button
              id="tab-vip-call-request"
              onClick={() => setActiveTab('vip_call')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
                activeTab === 'vip_call'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{translate("Demande d'Appel (85 min)", "VIP Call Request (85 min)")}</span>
              <span className="text-[8px] uppercase tracking-wider bg-slate-900/60 text-emerald-300 px-1.5 py-0.2 rounded font-black border border-emerald-400/40">
                Pass
              </span>
            </button>
          </div>

          {/* TAB 1: ADVISOR CHAT & VOICE ASSISTANCE */}
          {activeTab === 'chat' && (
            <>
              {/* Messages Area */}
              <div id="chat-messages-container" className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950">
                {messages.map((m) => {
                  const isBot = m.sender === 'bot';
                  const isCurrentSpeaking = speakingMessageId === m.id && isSpeaking;
                  const isSecurityBlocked = m.category === 'security_blocked';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender header */}
                      <div className="flex items-center gap-1 mb-1 px-1 text-[10px]">
                        {isBot && (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                            <span>Fatou (Support BRAD'CI)</span>
                          </span>
                        )}
                        {m.sender === 'user' && (
                          <span className="text-slate-400 font-medium">
                            {currentUser?.name || translate("Vous", "You")}
                          </span>
                        )}
                        <span className="text-slate-500">• {m.timestamp}</span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-line relative ${
                          m.sender === 'user'
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-lg'
                            : isSecurityBlocked
                            ? 'bg-red-950/40 border border-red-500/50 text-red-100 rounded-tl-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                        }`}
                      >
                        <p>{m.text}</p>

                        {/* Speech synthesis controller on advisor message */}
                        {isBot && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                            <button
                              onClick={() => handleSpeakText(m.id, m.text)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                                isCurrentSpeaking
                                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                              }`}
                            >
                              {isCurrentSpeaking ? (
                                <>
                                  <VolumeX className="w-3 h-3" />
                                  <span>{translate("Arrêter la lecture", "Stop reading")}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>{translate("Écouter la voix de Fatou", "Listen to Fatou's voice")}</span>
                                </>
                              )}
                            </button>

                            {/* Suggested Quick Action button if relevant */}
                            {m.suggestedAction && (
                              <button
                                onClick={() => handleExecuteAction(m.suggestedAction?.actionType)}
                                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 font-bold text-[10px] flex items-center gap-1 transition-colors border border-amber-500/30"
                              >
                                <span>
                                  {language === 'en' 
                                    ? m.suggestedAction.labelEn 
                                    : m.suggestedAction.labelFr}
                                </span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Thinking / Typing indicator */}
                {isThinking && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 w-fit">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>{translate("Fatou prépare votre réponse...", "Fatou is preparing your answer...")}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Pills */}
              <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                <button
                  onClick={() => setInputText(language === 'en' ? 'How does Pay on Delivery and the secret code work?' : 'Comment marche le paiement à la livraison et le code secret ?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
                >
                  🛡️ {translate("Code Secret & POD", "Secret Code & POD")}
                </button>
                <button
                  onClick={() => setInputText(language === 'en' ? 'Explain the 5-bid seller arbitration rule.' : 'Explique-moi la règle des 5 offres et choix du vendeur.')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
                >
                  ⚖️ {translate("Règle des 5 Offres", "5-Bid Rule")}
                </button>
                <button
                  onClick={() => setInputText(language === 'en' ? 'Who can request the 85-minute phone call?' : 'Qui a droit à la demande d\'appel de 85 minutes ?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
                >
                  📞 {translate("Appel 85 min", "85 min Call")}
                </button>
                <button
                  onClick={() => setInputText(language === 'en' ? 'What are the Seller and Courier Pass rates?' : 'Quels sont les tarifs des Pass Vendeur et Livreur ?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
                >
                  💎 {translate("Pass Abonnements", "Pass Pricing")}
                </button>
              </div>

              {/* Input Form with Voice Dictation */}
              <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                {/* Voice input button */}
                <button
                  type="button"
                  id="btn-voice-microphone"
                  onClick={handleToggleListening}
                  className={`p-2.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white border-red-400 animate-pulse ring-2 ring-red-400/50 shadow-lg shadow-red-500/30'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 hover:text-white'
                  }`}
                  title={isListening ? translate("Arrêter l'écoute", "Stop Listening") : translate("Parler au micro", "Speak to Microphone")}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <div className="relative flex-1">
                  <input
                    id="input-support-chat-text"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isListening
                        ? translate("En écoute... Parlez maintenant", "Listening... Speak now")
                        : translate("Posez votre question à Fatou...", "Ask Fatou any question...")
                    }
                    className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      isListening 
                        ? 'border-red-500 ring-1 ring-red-500/40 bg-red-950/20' 
                        : 'border-slate-700 focus:border-amber-500'
                    }`}
                  />
                </div>

                <button
                  id="btn-submit-support-message"
                  type="submit"
                  disabled={!inputText.trim() || isThinking}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 transition-colors shrink-0 font-bold shadow-md shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* TAB 2: VIP PHONE CALL REQUEST (85 MINUTES - STRICTLY SUBSCRIBERS) */}
          {activeTab === 'vip_call' && (
            <div id="tab-content-vip-call" className="flex-1 p-5 overflow-y-auto bg-slate-950 space-y-4">
              
              {/* CASE 1: USER DOES NOT HAVE A SUBSCRIBER PASS */}
              {!isSubscriber && (
                <div id="vip-call-locked-card" className="p-5 text-center space-y-4 bg-slate-900/60 border border-amber-500/30 rounded-3xl">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 shadow-lg shadow-amber-500/10">
                    <PhoneCall className="w-7 h-7" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black">
                    <Lock className="w-3 h-3" />
                    <span>{translate("Privilège Réservé aux Pass Abonnés", "Reserved Exclusively for Pass Subscribers")}</span>
                  </div>

                  <h3 className="text-base font-black text-white font-display">
                    {translate("Demande d'Appel Dédié (Session 85 Minutes)", "Dedicated Call Request (85-Minute Session)")}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    {translate(
                      "La ligne directe et la réservation d'un appel téléphonique personnalisé (jusqu'à 85 minutes d'assistance vocale continue avec un conseiller senior BRAD'CI) sont strictement réservées aux membres titulaires d'un Pass Abonné.",
                      "Direct line and personal phone call reservation (up to 85 minutes of continuous voice support with a senior BRAD'CI advisor) is strictly reserved for active Pass subscribers."
                    )}
                  </p>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-300">
                    <div className="font-bold text-amber-400 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      <span>{translate("Formules débloquant l'appel de 85 min :", "Passes unlocking 85-min call:")}</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-300">
                      <li>• <strong className="text-white">Pass Vendeur Standard</strong> (5 000 FCFA/mois) : 15 articles + boutique dédiée</li>
                      <li>• <strong className="text-white">Pass Vendeur Pro Illimité</strong> (10 000 FCFA/mois) : Ventes illimitées & priorité absolue</li>
                      <li>• <strong className="text-white">Pass Livreur VIP</strong> (6 000 FCFA/mois) : 0% commission courses & fret</li>
                    </ul>
                  </div>

                  <button
                    id="btn-unlock-pass-pricing"
                    onClick={() => {
                      setIsOpen(false);
                      setPricingModalOpen(true);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Crown className="w-4 h-4" />
                    <span>{translate("Découvrir & Activer un Pass Abonné", "Discover & Activate a Pass")}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="text-xs text-slate-400 hover:text-white underline underline-offset-4 block mx-auto pt-1"
                  >
                    {translate("Continuer l'assistance écrite gratuite avec Fatou", "Continue free chat with Fatou")}
                  </button>
                </div>
              )}

              {/* CASE 2: USER IS SUBSCRIBER - SHOW VIP PHONE CALL BOOKING FORM */}
              {isSubscriber && !submittedVipCall && (
                <div id="vip-call-unlocked-form" className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-white">
                          {translate("Privilège Pass Abonné Actif", "Active Pass Privilege")}
                        </p>
                        <p className="text-[10px] text-emerald-300">
                          {translate("Ligne directe & session de 85 minutes allouée", "Direct line & 85-minute session granted")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                      VIP
                    </span>
                  </div>

                  <form onSubmit={handleVipCallSubmit} className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        {translate("Nom complet de l'Abonné :", "Subscriber Full Name:")}
                      </label>
                      <input
                        type="text"
                        value={callName}
                        onChange={(e) => setCallName(e.target.value)}
                        placeholder="Ex: Kouamé Jean"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        {translate("Numéro de téléphone pour le rappel (+225) :", "Phone number for callback (+225):")}
                      </label>
                      <input
                        type="tel"
                        value={callPhone}
                        onChange={(e) => setCallPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        {translate("Créneau souhaité pour l'appel (85 min) :", "Preferred slot for call (85 min):")}
                      </label>
                      <select
                        value={callSlot}
                        onChange={(e) => setCallSlot(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Immédiat (Priorité Pass - Moins de 15 min)">
                          {translate("Immédiat (Priorité Pass - Moins de 15 min)", "Immediate (Pass Priority - Under 15 min)")}
                        </option>
                        <option value="Dans la matinée (09h00 - 12h00)">
                          {translate("Dans la matinée (09h00 - 12h00)", "In the morning (09:00 - 12:00)")}
                        </option>
                        <option value="Cet après-midi (14h00 - 18h00)">
                          {translate("Cet après-midi (14h00 - 18h00)", "This afternoon (14:00 - 18:00)")}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        {translate("Objet / Motif de l'accompagnement :", "Consultation Subject / Reason:")}
                      </label>
                      <select
                        value={callSubject}
                        onChange={(e) => setCallSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Assistance Vente & Arbitrage 5 Offres">
                          {translate("Assistance Vente & Arbitrage 5 Offres", "Sales & 5-Bid Arbitration Guidance")}
                        </option>
                        <option value="Déblocage Portefeuille & Retrait Mobile Money">
                          {translate("Déblocage Portefeuille & Retrait Mobile Money", "Wallet Payout & Mobile Money Transfer")}
                        </option>
                        <option value="Litige Commande & Constat Colis">
                          {translate("Litige Commande & Constat Colis", "Order Dispute & Parcel Inspection")}
                        </option>
                        <option value="Paramétrage Boutique & Courses Express">
                          {translate("Paramétrage Boutique & Courses Express", "Store Setup & Express Courier Freight")}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        {translate("Précisions complémentaires (facultatif) :", "Additional Notes (optional):")}
                      </label>
                      <textarea
                        rows={2}
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Précisez votre demande ou vos références de commande..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        {translate(
                          "Durée maximale allouée : 85 minutes d'entretien téléphonique continu avec un conseiller senior.",
                          "Allocated maximum duration: 85 continuous minutes with a senior advisor."
                        )}
                      </span>
                    </div>

                    <button
                      id="btn-submit-vip-call-form"
                      type="submit"
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{translate("Valider ma Demande de Rappel (85 min)", "Confirm Callback Request (85 min)")}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* CASE 3: VIP CALL ALREADY SUBMITTED - SHOW CONFIRMATION & LIVE COUNTDOWN */}
              {isSubscriber && submittedVipCall && (
                <div id="vip-call-confirmed-card" className="p-5 bg-slate-900/80 border border-emerald-500/40 rounded-3xl space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Ticket {submittedVipCall.id}
                    </span>
                    <h3 className="text-base font-black text-white font-display mt-1.5">
                      {translate("Demande d'Appel 85 min Enregistrée !", "85-min Call Request Confirmed!")}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {translate("Notre conseiller senior vous contactera sur votre numéro :", "Our senior advisor will call you at:")}
                    </p>
                    <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                      {submittedVipCall.userPhone}
                    </p>
                  </div>

                  {/* 85-minute countdown window */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      {translate("Fenêtre d'Assistance Téléphonique Dédiée", "Dedicated Telephone Window")}
                    </span>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {String(countdownMinutes).padStart(2, '0')}:{String(countdownSeconds).padStart(2, '0')} min
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {translate("Créneau : ", "Slot: ")}{submittedVipCall.preferredSlot}
                    </span>
                  </div>

                  <div className="text-left text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300">
                    <p><strong className="text-white">{translate("Motif : ", "Reason: ")}</strong>{submittedVipCall.subject}</p>
                    <p><strong className="text-white">{translate("Statut : ", "Status: ")}</strong>
                      <span className="text-amber-400 font-bold"> {translate("Prioritaire en cours de prise en charge", "Priority in progress")}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setSubmittedVipCall(null)}
                    className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
                  >
                    {translate("Soumettre une nouvelle demande", "Submit another request")}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
