import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  MessageSquare, 
  Phone,
  HelpCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  UserCheck,
  Headphones,
  ExternalLink,
  Lock,
  ArrowRight,
  RefreshCw,
  Clock,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryBradCiKnowledge, AIKnowledgeResponse } from '../utils/aiKnowledgeEngine';
import { voiceNavigator, playSuccessChime } from '../utils/voiceNavigator';

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
  const [activeTab, setActiveTab] = useState<'ai' | 'human'>('ai');
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoVoice, setAutoVoice] = useState<boolean>(() => {
    return localStorage.getItem('bradci_auto_voice') === 'true';
  });

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Human agent request form
  const [callbackPhone, setCallbackPhone] = useState(currentUser?.phone || '');
  const [callbackName, setCallbackName] = useState(currentUser?.name || '');
  const [callbackSent, setCallbackSent] = useState(false);
  const [isAgentConnecting, setIsAgentConnecting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: language === 'en'
        ? "👋 **Hello! I am your BRAD'CI AI Assistant.**\n\nI am available 24/7 with voice explanations to answer all your questions about the site:\n• **Registration & Login**: Account steps, email OTP, and KYC identity verification.\n• **Orders & 5-Bid Auctions**: How bidding works and the seller arbitration rule.\n• **Direct Pay on Delivery (POD)**: API payment upon arrival and OTP validation.\n• **Courier Freight & GPS**: Real-time tracking via Google Maps & Yango Maps.\n• **Plans & Pricing**: Standard Pass (5,000 F), Pro Pass (10,000 F), Courier Pass (6,000 F).\n\n💡 *Note: Internal administration and owner-restricted data remain strictly private and confidential.*"
        : "👋 **Bonjour ! Je suis votre Assistant IA BRAD'CI.**\n\nJe suis à votre service 24h/24 avec explication vocale pour répondre à toutes vos questions sur le fonctionnement du site :\n• **Inscription & Connexion** : Étapes, validation par OTP email et certification KYC.\n• **Commandes & Règle des 5 Offres** : Fonctionnement des enchères express et arbitrage vendeur.\n• **Paiement Direct à la Livraison (POD)** : Règlement par API à l'arrivée du coursier et code OTP.\n• **Livraisons & Cartes GPS** : Suivi des coursiers via Google Maps et Yango Maps.\n• **Abonnements & Tarifs** : Pass Vendeur (5 000 F / 10 000 F), Pass Livreur (6 000 F).\n\n💡 *Note : Les accès d'administration interne et données réservées au propriétaire restent strictement confidentiels.*",
      timestamp: language === 'en' ? 'Now' : 'Maintenant',
      category: 'general',
      suggestedAction: {
        labelFr: "Parler à un Agent Humain",
        labelEn: "Speak with Human Agent",
        actionType: "connect_agent"
      }
    }
  ]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Global listener to open support modal from anywhere in the app
  useEffect(() => {
    const handleOpenSupport = (e: any) => {
      setIsOpen(true);
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('bradci_open_support', handleOpenSupport);
    return () => window.removeEventListener('bradci_open_support', handleOpenSupport);
  }, []);

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
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch {
        setSpeechSupported(false);
      }
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      voiceNavigator.stop();
    };
  }, [language]);

  // Clean Markdown & Emojis for natural voice reading
  const cleanTextForSpeech = (raw: string): string => {
    return raw
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/•/g, ' ')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Play voice for a specific text
  const handleSpeakText = (messageId: string, text: string) => {
    if (speakingMessageId === messageId && isSpeaking) {
      voiceNavigator.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    voiceNavigator.stop();
    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    const speechText = cleanTextForSpeech(text);
    voiceNavigator.speak(speechText, language, () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    });
  };

  const toggleAutoVoice = () => {
    const nextState = !autoVoice;
    setAutoVoice(nextState);
    localStorage.setItem('bradci_auto_voice', nextState.toString());
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        voiceNavigator.stop();
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        recognitionRef.current.lang = language === 'en' ? 'en-US' : 'fr-FR';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

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

    // Query Knowledge Engine with strict security filter
    setTimeout(() => {
      const response = queryBradCiKnowledge(query, language);
      const botMsgId = `b-${Date.now()}`;
      
      const botReply: Message = {
        id: botMsgId,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
        category: response.category,
        suggestedAction: response.suggestedAction
      };

      setMessages(prev => [...prev, botReply]);

      // Auto-Voice readout if enabled
      if (autoVoice) {
        setTimeout(() => {
          handleSpeakText(botMsgId, response.text);
        }, 150);
      }
    }, 350);
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
        setActiveTab('human');
        break;
      case 'filter_auctions':
        // Close modal and focus on listings
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Handle direct human agent connection simulation
  const handleConnectHumanAgent = () => {
    setIsAgentConnecting(true);
    setTimeout(() => {
      setIsAgentConnecting(false);
      playSuccessChime();
      const isEn = language === 'en';
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        agentName: 'Aminata Diallo (Support BRAD\'CI Abidjan)',
        text: isEn
          ? "Hello! I am Aminata from BRAD'CI Customer Relations at Plateau, Abidjan. I am taking over this conversation. How can I assist you with your orders, seller account, or deliveries today?"
          : "Bonjour ! Je suis Aminata du Service Relations Client BRAD'CI au Plateau, Abidjan. Je prends le relais sur votre dossier. Comment puis-je vous assister concernant vos achats, votre boutique ou vos livraisons ?",
        timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMsg]);
      setActiveTab('ai');
      if (autoVoice) {
        handleSpeakText(agentMsg.id, agentMsg.text);
      }
    }, 1200);
  };

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackPhone) return;
    setCallbackSent(true);
    playSuccessChime();
  };

  return (
    <div className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-2xl shadow-amber-500/30 flex items-center gap-2 font-bold text-xs transition-transform hover:scale-105"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-slate-950 shrink-0" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <span className="hidden sm:inline font-display">
            {translate("Assistance IA & Support Vocal", "AI Assistant & Voice Support")}
          </span>
        </button>
      )}

      {/* Main Support Window */}
      {isOpen && (
        <div className="w-[calc(100vw-24px)] sm:w-[420px] max-h-[85vh] sm:h-[580px] bg-slate-950 border-2 border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-white font-display">
                    {translate("Assistant BRAD'CI & Vocal", "BRAD'CI AI & Voice Assistant")}
                  </h4>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                    24/7
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400 font-medium">{translate("En direct d'Abidjan", "Live from Abidjan")}</span>
                  <span>•</span>
                  <span>{translate("Séquestre Wave 100%", "100% Wave Escrow")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice auto-play toggle */}
              <button
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

          {/* Mode Switcher Tabs: AI Assistant vs Human Agent */}
          <div className="flex bg-slate-900 border-b border-slate-800 p-1">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{translate("Assistant IA & Vocal", "AI & Voice Assistant")}</span>
            </button>
            <button
              onClick={() => setActiveTab('human')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'human'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{translate("Agent Humain en Direct", "Live Human Agent")}</span>
            </button>
          </div>

          {/* TAB 1: AI ASSISTANT & VOCAL CHAT */}
          {activeTab === 'ai' && (
            <>
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950">
                {messages.map((m) => {
                  const isBot = m.sender === 'bot';
                  const isAgent = m.sender === 'agent';
                  const isCurrentSpeaking = speakingMessageId === m.id && isSpeaking;
                  const isSecurityBlocked = m.category === 'security_blocked';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender label */}
                      <div className="flex items-center gap-1 mb-1 px-1 text-[10px]">
                        {isBot && (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            <span>BRAD'CI IA</span>
                          </span>
                        )}
                        {isAgent && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            <span>{m.agentName || 'Agent Support'}</span>
                          </span>
                        )}
                        {m.sender === 'user' && (
                          <span className="text-slate-400 font-medium">
                            {currentUser?.name || translate("Vous", "You")}
                          </span>
                        )}
                        <span className="text-slate-500">• {m.timestamp}</span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-line relative ${
                          m.sender === 'user'
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-lg'
                            : isSecurityBlocked
                            ? 'bg-red-950/40 border border-red-500/50 text-red-100 rounded-tl-none'
                            : isAgent
                            ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-100 rounded-tl-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                        }`}
                      >
                        <p>{m.text}</p>

                        {/* Speech synthesis controller on bot/agent message */}
                        {(isBot || isAgent) && (
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
                                  <span>{translate("Arrêter la voix", "Stop Voice")}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>{translate("Écouter la réponse vocale", "Listen to Explanation")}</span>
                                </>
                              )}
                            </button>

                            {isCurrentSpeaking && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-400">
                                <span className="w-1 h-3 bg-amber-400 rounded animate-bounce" />
                                <span className="w-1 h-4 bg-amber-400 rounded animate-bounce [animation-delay:0.1s]" />
                                <span className="w-1 h-2 bg-amber-400 rounded animate-bounce [animation-delay:0.2s]" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Suggested action button if present */}
                        {m.suggestedAction && (
                          <div className="mt-2.5">
                            <button
                              onClick={() => handleExecuteAction(m.suggestedAction?.actionType)}
                              className="w-full py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <span>
                                {language === 'en' 
                                  ? m.suggestedAction.labelEn 
                                  : m.suggestedAction.labelFr}
                              </span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions pills */}
              <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
                <button
                  onClick={() => setInputText(language === 'en' ? 'How do I register on BRAD\'CI?' : 'Comment s\'inscrire sur BRAD\'CI ?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
                >
                  📝 {translate("Inscription & KYC", "Registration & KYC")}
                </button>
                <button
                  onClick={() => setInputText(language === 'en' ? 'How does the 5-bid arbitration rule work?' : 'Comment fonctionne la règle des 5 offres ?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
                >
                  ⚖️ {translate("Règle 5 Offres", "5-Bid Rule")}
                </button>
                <button
                  onClick={() => setInputText(language === 'en' ? 'How does Wave Escrow & OTP security work?' : 'Comment fonctionne le séquestre Wave et l\'OTP ?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
                >
                  🛡️ {translate("Séquestre Wave & OTP", "Wave Escrow & OTP")}
                </button>
                <button
                  onClick={() => setInputText(language === 'en' ? 'What are the Seller Pass prices?' : 'Quels sont les tarifs des Pass Vendeur ?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
                >
                  💎 {translate("Pass & Tarifs", "Passes & Pricing")}
                </button>
              </div>

              {/* Input Form with Voice Dictation */}
              <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                {/* Voice input button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleToggleListening}
                    className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                      isListening
                        ? 'bg-red-500 text-white border-red-400 animate-pulse ring-2 ring-red-400/50'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title={isListening ? translate("Arrêter l'écoute", "Stop Listening") : translate("Parler au micro", "Speak to Microphone")}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isListening
                        ? translate("En écoute... Parlez maintenant", "Listening... Speak now")
                        : translate("Posez votre question sur Brad'CI...", "Ask any question about BRAD'CI...")
                    }
                    className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      isListening 
                        ? 'border-red-500 ring-1 ring-red-500/40 bg-red-950/20' 
                        : 'border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {isListening && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 transition-colors shrink-0 font-bold shadow-md shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* TAB 2: LIVE HUMAN AGENT ESCALATION */}
          {activeTab === 'human' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950">
              <div className="text-center pb-2 border-b border-slate-800">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 mb-2">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>{translate("Support Client Dédié Côte d'Ivoire", "Dedicated Ivory Coast Customer Support")}</span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  {translate("Besoin d'un Conseiller en Direct ?", "Need to Speak with a Live Agent?")}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {translate(
                    "Nos agents basés à Abidjan (Plateau / Cocody) sont connectés pour vous assister immédiatement.",
                    "Our support advisors based in Abidjan (Plateau / Cocody) are online to assist you right now."
                  )}
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400 absolute top-0 left-0 animate-ping" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{translate("3 Agents Disponibles Immédiatement", "3 Live Agents Available")}</p>
                    <p className="text-[10px] text-slate-400">{translate("Temps d'attente moyen : < 1 minute", "Average wait time: < 1 min")}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  {translate("Abidjan GMT", "Abidjan GMT")}
                </span>
              </div>

              {/* Option 1: Live Chat Transfer */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">{translate("1. Chat Direct dans l'Application", "1. In-App Live Chat Transfer")}</h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  {translate(
                    "Basculez cette conversation immédiatement vers notre conseiller de garde.",
                    "Switch this chat directly to our duty customer advisor."
                  )}
                </p>
                <button
                  onClick={handleConnectHumanAgent}
                  disabled={isAgentConnecting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  {isAgentConnecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{translate("Connexion à l'agent en cours...", "Connecting to agent...")}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>{translate("Prendre la main avec un conseiller", "Connect to Human Agent Now")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: WhatsApp Hotline */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">{translate("2. WhatsApp Support Officiel", "2. Official WhatsApp Support")}</h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  {translate(
                    "Échangez instantanément sur WhatsApp avec notre équipe support Côte d'Ivoire.",
                    "Chat instantly on WhatsApp with our Ivory Coast support team."
                  )}
                </p>
                <a
                  href={`https://wa.me/2250700000000?text=${encodeURIComponent(
                    language === 'en'
                      ? "Hello BRAD'CI Support, I need assistance regarding my marketplace account."
                      : "Bonjour l'équipe support BRAD'CI, j'aimerais avoir de l'aide concernant mon compte."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{translate("Ouvrir WhatsApp (+225 07 00 00 00 00)", "Open WhatsApp (+225 07 00 00 00 00)")}</span>
                </a>
              </div>

              {/* Option 3: Free Callback Request */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-white">{translate("3. Demande de Rappel Gratuit Express", "3. Free Express Callback Request")}</h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  {translate(
                    "Indiquez votre numéro pour être rappelé gratuitement en moins de 5 minutes.",
                    "Leave your phone number to receive a free call within 5 minutes."
                  )}
                </p>

                {callbackSent ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      {translate(
                        "Demande enregistrée ! Notre conseiller vous appelle d'ici 3 minutes.",
                        "Request saved! Our advisor will call you within 3 minutes."
                      )}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleRequestCallback} className="space-y-2">
                    <input
                      type="tel"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{translate("Demander à Être Rappelé Gratuitement", "Request Free Callback")}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Security note */}
              <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{translate("Assistance certifiée BRAD'CI Côte d'Ivoire. Zéro frais caché.", "Certified BRAD'CI Ivory Coast support. No hidden fees.")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
