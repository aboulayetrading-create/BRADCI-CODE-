import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Volume2, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  MapPin, 
  Globe, 
  Download, 
  UserCheck, 
  PhoneCall, 
  PhoneIncoming, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Smartphone,
  Eye,
  X
} from 'lucide-react';
import { 
  assistantArchive, 
  AssistantConversationArchive, 
  AssistantCallArchive 
} from '../utils/assistantRecordingArchive';
import { useApp } from '../context/AppContext';

export const AdminCallChatArchiveView: React.FC = () => {
  const { translate, adminImpersonateUser } = useApp();
  const [conversations, setConversations] = useState<AssistantConversationArchive[]>(() => assistantArchive.getConversations());
  const [calls, setCalls] = useState<AssistantCallArchive[]>(() => assistantArchive.getCalls());
  
  const [activeSubtab, setActiveSubtab] = useState<'all' | 'calls' | 'conversations'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<AssistantConversationArchive | null>(null);
  const [selectedCall, setSelectedCall] = useState<AssistantCallArchive | null>(null);

  // Audio player simulation state
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [audioVolume, setAudioVolume] = useState<number>(85);

  // Listen to automatic updates from assistantArchive
  useEffect(() => {
    const handleUpdate = () => {
      setConversations(assistantArchive.getConversations());
      setCalls(assistantArchive.getCalls());
    };

    window.addEventListener('bradci_assistant_conv_updated', handleUpdate);
    window.addEventListener('bradci_assistant_call_updated', handleUpdate);
    return () => {
      window.removeEventListener('bradci_assistant_conv_updated', handleUpdate);
      window.removeEventListener('bradci_assistant_call_updated', handleUpdate);
    };
  }, []);

  // Simulate audio playback progress
  useEffect(() => {
    let timer: any;
    if (playingCallId) {
      timer = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            setPlayingCallId(null);
            return 0;
          }
          return prev + 2.5;
        });
      }, 1000);
    } else {
      setPlaybackProgress(0);
    }
    return () => clearInterval(timer);
  }, [playingCallId]);

  const handleTogglePlayCall = (callId: string) => {
    if (playingCallId === callId) {
      setPlayingCallId(null);
    } else {
      setPlayingCallId(callId);
      setPlaybackProgress(0);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      conv.userName.toLowerCase().includes(q) ||
      conv.userPhone.toLowerCase().includes(q) ||
      conv.userEmail?.toLowerCase().includes(q) ||
      conv.advisorName.toLowerCase().includes(q) ||
      conv.ipAddress.includes(q) ||
      conv.commune.toLowerCase().includes(q)
    );
  });

  // Filter calls
  const filteredCalls = calls.filter(call => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      call.userName.toLowerCase().includes(q) ||
      call.userPhone.toLowerCase().includes(q) ||
      call.userEmail?.toLowerCase().includes(q) ||
      call.advisorName.toLowerCase().includes(q) ||
      call.subject.toLowerCase().includes(q) ||
      call.ipAddress.includes(q) ||
      call.commune.toLowerCase().includes(q)
    );
  });

  const totalInteractionsCount = conversations.length + calls.length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>CONFIDENTIEL • STRICTEMENT RÉSERVÉ À L'ADMINISTRATION</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Archivage Automatique Actif (24/7)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
              <PhoneCall className="w-6 h-6 text-amber-400" />
              <span>{translate("Enregistrements Conversations & Appels Support", "Conversations & Calls Recording Archive")}</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Toutes les interactions passées avec l'assistante IA et les conseillers sont automatiquement enregistrées et horodatées. Chaque archive conserve l'adresse IP certifiée, la date, l'heure exacte, l'opérateur réseau (Orange/MTN/Moov), la géolocalisation et la transcription intégrale.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl text-center">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Appels Enregistrés</span>
              <strong className="text-xl font-mono text-amber-400">{calls.length}</strong>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl text-center">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Chats Archivés</span>
              <strong className="text-xl font-mono text-cyan-400">{conversations.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0C121E] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={translate("Recherche rapide par nom, tél, IP, commune...", "Quick search by name, phone, IP, commune...")}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubtab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubtab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Tous ({totalInteractionsCount})
          </button>
          <button
            onClick={() => setActiveSubtab('calls')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeSubtab === 'calls'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Appels Téléphoniques ({calls.length})</span>
          </button>
          <button
            onClick={() => setActiveSubtab('conversations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeSubtab === 'conversations'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Conversations Chat ({conversations.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CALLS LIST */}
      {(activeSubtab === 'all' || activeSubtab === 'calls') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>Enregistrements d'Appels Vocaux Automatiques ({filteredCalls.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Lecteur audio & métadonnées IP</span>
          </div>

          {filteredCalls.length === 0 ? (
            <div className="p-8 text-center bg-[#0C121E] border border-slate-800 rounded-2xl text-slate-400 text-sm">
              Aucun appel ne correspond à votre recherche.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredCalls.map(call => {
                const isPlaying = playingCallId === call.id;
                return (
                  <div 
                    key={call.id}
                    className="bg-[#0C121E] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{call.userName}</span>
                            <span className="text-xs font-mono text-amber-400 font-bold">{call.userPhone}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold uppercase">
                              {call.userRole}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                              Enregistré
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Conseillère : <strong className="text-slate-200">{call.advisorName}</strong></span>
                            <span>•</span>
                            <span>Sujet : <em className="text-slate-300 font-medium">"{call.subject}"</em></span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <div className="text-right text-xs">
                          <div className="flex items-center gap-1 text-slate-300 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{call.date} à {call.time}</span>
                          </div>
                          <span className="text-[11px] text-amber-400 font-semibold">Durée : {call.durationFormatted}</span>
                        </div>

                        <button
                          onClick={() => handleTogglePlayCall(call.id)}
                          className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                            isPlaying
                              ? 'bg-amber-500 text-slate-950 shadow-lg'
                              : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                          }`}
                          title="Écouter l'enregistrement"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          <span>{isPlaying ? 'Pause' : 'Écouter'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedCall(call)}
                          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-cyan-400" />
                          <span>Dossier & IP</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Player Waveform when active */}
                    {isPlaying && (
                      <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span className="flex items-center gap-2 text-amber-400 font-bold">
                            <Volume2 className="w-4 h-4 animate-pulse" />
                            <span>Lecture de la bande audio en cours...</span>
                          </span>
                          <span className="font-mono text-slate-400">
                            {Math.round((playbackProgress / 100) * call.durationSeconds)}s / {call.durationSeconds}s
                          </span>
                        </div>
                        {/* Audio equalizer bars */}
                        <div className="flex items-center gap-1 h-6">
                          {[40, 75, 90, 50, 80, 100, 60, 45, 95, 70, 85, 40, 90, 65, 30, 80, 95, 60, 45, 85, 100, 75, 55, 90, 45, 70].map((h, i) => (
                            <div 
                              key={i} 
                              className="flex-1 bg-amber-400/80 rounded-full transition-all duration-300 animate-pulse"
                              style={{ 
                                height: `${Math.max(15, (h * (playbackProgress % 30 + 10)) / 40)}%`,
                                opacity: i / 26 <= playbackProgress / 100 ? 1 : 0.3
                              }} 
                            />
                          ))}
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full transition-all duration-300"
                            style={{ width: `${playbackProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Metadata Pills */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        <span>IP : {call.ipAddress}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        <span>{call.isp} ({call.networkType})</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{call.commune}, Abidjan</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 ml-auto">
                        <FileText className="w-3 h-3" />
                        <span>{call.transcript.length} répliques transcrites</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CHAT CONVERSATIONS LIST */}
      {(activeSubtab === 'all' || activeSubtab === 'conversations') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Historique Intégral des Conversations Écrites ({filteredConversations.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Archivage automatique horodaté</span>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center bg-[#0C121E] border border-slate-800 rounded-2xl text-slate-400 text-sm">
              Aucune conversation ne correspond à votre recherche.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredConversations.map(conv => {
                const lastMsg = conv.messages[conv.messages.length - 1];
                return (
                  <div 
                    key={conv.id}
                    className="bg-[#0C121E] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{conv.userName}</span>
                            <span className="text-xs font-mono text-cyan-400 font-bold">{conv.userPhone}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold uppercase">
                              {conv.userRole}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {conv.messagesCount} messages échangés
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            <span className="text-slate-300 font-semibold">Dernier échange : </span>
                            <span className="italic">"{lastMsg ? lastMsg.text : 'Discussion initialisée'}"</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <div className="text-right text-xs">
                          <div className="flex items-center gap-1 text-slate-300 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{conv.date}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{conv.time}</span>
                        </div>

                        <button
                          onClick={() => setSelectedConversation(conv)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-cyan-400" />
                          <span>Lire la discussion</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        <span>IP : {conv.ipAddress}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{conv.commune}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        <span>{conv.deviceFingerprint}</span>
                      </span>
                      {conv.detectedIssues && conv.detectedIssues.length > 0 && (
                        <span className="flex items-center gap-1 text-amber-400 font-bold ml-auto">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Motif détecté : {conv.detectedIssues.join(', ')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CALL DETAIL MODAL */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C121E] border border-amber-500/30 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Dossier d'Enregistrement Appel #{selectedCall.id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Client : <strong className="text-white">{selectedCall.userName}</strong> ({selectedCall.userPhone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Technical Inspection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                  <span className="text-xs text-slate-400 block mb-1">Horodatage Exact</span>
                  <strong className="text-white font-mono text-xs">{selectedCall.date} à {selectedCall.time}</strong>
                  <span className="text-[11px] text-amber-400 block mt-1 font-bold">Durée : {selectedCall.durationFormatted}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                  <span className="text-xs text-slate-400 block mb-1">Traçabilité Réseau IP</span>
                  <strong className="text-cyan-400 font-mono text-xs block">{selectedCall.ipAddress}</strong>
                  <span className="text-[11px] text-slate-300 block mt-1">{selectedCall.isp} • {selectedCall.networkType}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                  <span className="text-xs text-slate-400 block mb-1">Géolocalisation Antivol</span>
                  <strong className="text-white text-xs block">{selectedCall.commune}, Abidjan</strong>
                  <span className="text-[11px] text-emerald-400 font-mono block mt-1">
                    Lat {selectedCall.gpsCoordinates.lat}, Lng {selectedCall.gpsCoordinates.lng}
                  </span>
                </div>
              </div>

              {/* Call Transcript */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Transcription Intégrale de la Conversation Audio</span>
                </h4>

                <div className="space-y-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-h-72 overflow-y-auto">
                  {selectedCall.transcript.map((replica, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl text-xs space-y-1 ${
                        replica.speaker === 'client'
                          ? 'bg-amber-500/10 border border-amber-500/20 ml-4'
                          : 'bg-slate-900 border border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className={replica.speaker === 'client' ? 'text-amber-300' : 'text-cyan-300'}>
                          {replica.speakerName} ({replica.speaker === 'client' ? 'Client' : 'Conseillère'})
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">{replica.timestamp}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{replica.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <button
                onClick={() => {
                  adminImpersonateUser(selectedCall.userId);
                  setSelectedCall(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
              >
                <span>🔑 Accès Direct au Compte de {selectedCall.userName}</span>
              </button>
              <button
                onClick={() => setSelectedCall(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONVERSATION DETAIL MODAL */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C121E] border border-cyan-500/30 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Archive Discussion #{selectedConversation.id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Utilisateur : <strong className="text-white">{selectedConversation.userName}</strong> ({selectedConversation.userPhone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Technical IP Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                  <span className="text-xs text-slate-400 block mb-1">Horodatage Session</span>
                  <strong className="text-white font-mono text-xs">{selectedConversation.date} à {selectedConversation.time}</strong>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                  <span className="text-xs text-slate-400 block mb-1">Adresse IP Détectée</span>
                  <strong className="text-cyan-400 font-mono text-xs block">{selectedConversation.ipAddress}</strong>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                  <span className="text-xs text-slate-400 block mb-1">Terminal & Commune</span>
                  <strong className="text-white text-xs block">{selectedConversation.commune}</strong>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{selectedConversation.deviceFingerprint}</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Fil de Discussion Complet</span>
                </h4>

                <div className="space-y-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-h-72 overflow-y-auto">
                  {selectedConversation.messages.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl text-xs space-y-1 ${
                        msg.sender === 'user'
                          ? 'bg-amber-500/10 border border-amber-500/20 ml-6'
                          : 'bg-slate-900 border border-slate-800 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className={msg.sender === 'user' ? 'text-amber-300' : 'text-cyan-300'}>
                          {msg.sender === 'user' ? selectedConversation.userName : selectedConversation.advisorName}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{msg.text}</p>
                      {msg.attachmentName && (
                        <div className="text-[10px] text-amber-300 font-mono pt-1">
                          📎 Pièce jointe archivée : {msg.attachmentName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <button
                onClick={() => {
                  adminImpersonateUser(selectedConversation.userId);
                  setSelectedConversation(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
              >
                <span>🔑 Accès Direct au Compte de {selectedConversation.userName}</span>
              </button>
              <button
                onClick={() => setSelectedConversation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
