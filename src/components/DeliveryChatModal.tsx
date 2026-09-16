import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Phone, 
  MessageSquare, 
  Radio, 
  Volume2, 
  CheckCheck, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { startRecording, stopRecording, cancelRecording } from '../utils/audioServices';
import { useApp } from '../context/AppContext';

export interface DeliveryChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderRole: 'driver' | 'buyer' | 'seller';
  text?: string;
  audioBlobUrl?: string;
  audioDuration?: number; // secondes
  timestamp: string;
}

interface DeliveryChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  partnerName: string;
  partnerPhone: string;
  partnerRole: 'driver' | 'buyer' | 'seller';
  vehicleInfo?: string;
}

export const DeliveryChatModal: React.FC<DeliveryChatModalProps> = ({
  isOpen,
  onClose,
  jobId,
  partnerName,
  partnerPhone,
  partnerRole,
  vehicleInfo
}) => {
  const { currentUser, addToast } = useApp();

  const [messages, setMessages] = useState<DeliveryChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(`bradci_chat_${jobId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg-init-1',
        jobId,
        senderId: 'system',
        senderName: "BRAD'CI Relais",
        senderRole: 'driver',
        text: "Canal direct sécurisé ouvert. Vous pouvez échanger par message texte ou note vocale.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const recordingIntervalRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Sauvegarde locale de la conversation
  useEffect(() => {
    try {
      localStorage.setItem(`bradci_chat_${jobId}`, JSON.stringify(messages));
    } catch {
      // ignore
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, jobId]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const currentRole: 'driver' | 'buyer' | 'seller' = 
    currentUser?.role === 'driver' ? 'driver' : 'buyer';
  const myName = currentUser?.name || (currentRole === 'driver' ? 'Livreur' : 'Client');

  // Démarrer l'enregistrement de la note vocale
  const handleStartRecord = async () => {
    try {
      const res = await startRecording();
      setIsRecording(true);
      setRecordDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);

      if (res?.isFallback) {
        addToast(
          "Mode démo vocale", 
          "Microphone physique non accessible dans ce conteneur. Enregistrement vocal de démonstration actif.", 
          "info"
        );
      }
    } catch (err: any) {
      console.warn("Information démarrage enregistrement vocal:", err?.message || err);
      addToast(
        "Microphone restreint", 
        "Veuillez autoriser l'accès au microphone ou ouvrir en plein écran pour envoyer une note vocale.", 
        "warning"
      );
    }
  };

  // Arrêter et envoyer la note vocale
  const handleStopAndSendRecord = async () => {
    if (!isRecording) return;
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      const duration = recordDuration;
      const audioBlob = await stopRecording();
      setIsRecording(false);
      setRecordDuration(0);

      if (duration < 1 && audioBlob.size < 44) {
        addToast("Note vocale trop courte", "Maintenez le micro au moins 1 seconde pour enregistrer.", "info");
        return;
      }

      const audioBlobUrl = URL.createObjectURL(audioBlob);

      const newVoiceMsg: DeliveryChatMessage = {
        id: `voice-${Date.now()}`,
        jobId,
        senderId: currentUser?.id || 'me',
        senderName: myName,
        senderRole: currentRole,
        audioBlobUrl,
        audioDuration: Math.max(1, duration),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, newVoiceMsg]);
      addToast("Note vocale transmise", `Durée: ${Math.max(1, duration)} sec.`, "success");
    } catch (err: any) {
      console.warn("Information arrêt enregistrement vocal:", err?.message || err);
      setIsRecording(false);
      setRecordDuration(0);
      addToast("Erreur enregistrement", "Impossible de sauvegarder la note vocale.", "error");
    }
  };

  // Annuler l'enregistrement
  const handleCancelRecord = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    cancelRecording();
    setIsRecording(false);
    setRecordDuration(0);
    addToast("Note vocale annulée", "L'enregistrement a été supprimé.", "info");
  };

  // Envoyer un message texte
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: DeliveryChatMessage = {
      id: `msg-${Date.now()}`,
      jobId,
      senderId: currentUser?.id || 'me',
      senderName: myName,
      senderRole: currentRole,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  // Lecture / Pause d'une note vocale
  const togglePlayAudio = (msgId: string, url?: string) => {
    if (!url) return;

    const currentAudio = audioRefs.current[msgId];
    if (activeAudioId === msgId) {
      if (currentAudio) {
        currentAudio.pause();
        setActiveAudioId(null);
      }
    } else {
      // Pause all other audios
      Object.keys(audioRefs.current).forEach((k) => {
        audioRefs.current[k]?.pause();
      });

      if (!currentAudio) {
        const audio = new Audio(url);
        audio.onended = () => setActiveAudioId(null);
        audioRefs.current[msgId] = audio;
        audio.play().catch((e) => console.warn('Erreur lecture audio:', e));
        setActiveAudioId(msgId);
      } else {
        currentAudio.currentTime = 0;
        currentAudio.play().catch((e) => console.warn('Erreur lecture audio:', e));
        setActiveAudioId(msgId);
      }
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0C121E] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[680px]">
        
        {/* Header */}
        <div className="p-4 bg-slate-100 dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
              {partnerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{partnerName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                  {partnerRole === 'driver' ? 'Livreur' : 'Client'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {vehicleInfo ? `${vehicleInfo} • ` : ''}{partnerPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`tel:${partnerPhone}`}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow"
              title={`Appeler ${partnerName}`}
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-[#080E1A]">
          {messages.map((m) => {
            const isMe = m.senderId === (currentUser?.id || 'me') || m.senderRole === currentRole;
            const isAudio = !!m.audioBlobUrl;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mb-1 px-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{isMe ? 'Moi' : m.senderName}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Message Texte */}
                  {m.text && <p className="text-xs leading-relaxed break-words">{m.text}</p>}

                  {/* Note Vocale */}
                  {isAudio && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePlayAudio(m.id, m.audioBlobUrl)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow ${
                            isMe
                              ? 'bg-white text-slate-950 hover:bg-slate-100'
                              : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          }`}
                        >
                          {activeAudioId === m.id ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-[120px]">
                          {/* Visual Waveform bars */}
                          <div className="flex items-center gap-0.5 h-6">
                            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 85, 30, 75, 95, 60, 40].map((h, idx) => (
                              <span
                                key={idx}
                                style={{ height: `${activeAudioId === m.id ? (h % 20) + 12 : (h % 15) + 6}px` }}
                                className={`w-1 rounded-full transition-all duration-200 ${
                                  isMe ? 'bg-white/80' : 'bg-amber-400'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[10px] opacity-80 mt-0.5">
                            <span>Note vocale</span>
                            <span>{m.audioDuration ? `${m.audioDuration}s` : 'Audio'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar or Active Recording Bar */}
        <div className="p-3 bg-slate-100 dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800 shrink-0">
          {isRecording ? (
            /* Bar d'enregistrement vocal en cours */
            <div className="flex items-center justify-between gap-3 p-2 bg-red-950/40 border border-red-500/50 rounded-2xl animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-red-300">
                  Enregistrement en direct : {formatTimer(recordDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelRecord}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Annuler</span>
                </button>

                <button
                  type="button"
                  onClick={handleStopAndSendRecord}
                  className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer la note</span>
                </button>
              </div>
            </div>
          ) : (
            /* Barre de saisie standard texte + micro */
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <button
                id="btn-chat-voice-note"
                type="button"
                onClick={handleStartRecord}
                className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer shrink-0 flex items-center gap-1.5"
                title="Enregistrer une Note Vocale (MediaRecorder)"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-bold">Note Vocale</span>
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrivez un message ou envoyez une note vocale..."
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-amber-500 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-40 text-white font-bold transition-colors shrink-0 shadow-md cursor-pointer"
                title="Envoyer le message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
