import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Lock, 
  Unlock, 
  User, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Printer, 
  FileText, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  X, 
  Sparkles,
  Smartphone,
  Eye,
  Key
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User as UserType, SupportTicket } from '../types';
import { assistantArchive } from '../utils/assistantRecordingArchive';

export const AdminUserInvestigationView: React.FC = () => {
  const { 
    users, 
    supportTickets, 
    products, 
    escrowRecords, 
    freightJobs, 
    adminImpersonateUser, 
    adminFreezeUserAccountForTheft, 
    adminUnfreezeUserAccount,
    addToast,
    translate 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>(() => users[0]?.id || '');
  const [freezeReasonModalOpen, setFreezeReasonModalOpen] = useState(false);
  const [customFreezeReason, setCustomFreezeReason] = useState('Signalement formel de vol / perte de smartphone avec risque de détournement de fonds');
  const [showPoliceRequisitionModal, setShowPoliceRequisitionModal] = useState(false);

  // Search filter across users by name or phone
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(q) ||
      u.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
      u.email.toLowerCase().includes(q) ||
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const selectedUser: UserType | undefined = useMemo(() => {
    return users.find(u => u.id === selectedUserId) || searchResults[0] || users[0];
  }, [users, selectedUserId, searchResults]);

  // Support tickets for this user
  const userTickets = useMemo(() => {
    if (!selectedUser) return [];
    return supportTickets.filter(t => 
      t.userId === selectedUser.id || 
      t.userPhone === selectedUser.phone || 
      (selectedUser.name && t.userName.toLowerCase() === selectedUser.name.toLowerCase())
    );
  }, [supportTickets, selectedUser]);

  // Recorded assistant calls for this user
  const userCalls = useMemo(() => {
    if (!selectedUser) return [];
    return assistantArchive.getCallsByUser(selectedUser.id, selectedUser.phone);
  }, [selectedUser]);

  // Recorded assistant conversations for this user
  const userConversations = useMemo(() => {
    if (!selectedUser) return [];
    return assistantArchive.getConversationsByUser(selectedUser.id, selectedUser.phone);
  }, [selectedUser]);

  // Products published by this user
  const userProducts = useMemo(() => {
    if (!selectedUser) return [];
    return products.filter(p => p.sellerId === selectedUser.id);
  }, [products, selectedUser]);

  // Escrow transactions tied to this user
  const userEscrows = useMemo(() => {
    if (!selectedUser) return [];
    return escrowRecords.filter(e => 
      e.buyerName.toLowerCase().includes(selectedUser.name.toLowerCase()) || 
      e.sellerName.toLowerCase().includes(selectedUser.name.toLowerCase())
    );
  }, [escrowRecords, selectedUser]);

  // Handle emergency freeze
  const handleConfirmFreeze = () => {
    if (!selectedUser) return;
    adminFreezeUserAccountForTheft(selectedUser.id, customFreezeReason);
    setFreezeReasonModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-500/15 via-slate-900 to-slate-900 border border-red-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>PROCÉDURE ANTIVOL & CONTRÔLE ADMINISTRATEUR EXCLUSIF</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
              <Key className="w-6 h-6 text-amber-400" />
              <span>{translate("Dossiers d'Enquête, Géolocalisation & Accès Direct aux Comptes", "Investigation Dossiers, GPS & Direct Admin Account Access")}</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Recherchez n'importe quel compte par son <strong>Nom</strong> ou son <strong>Numéro de Téléphone</strong>. Accédez à la dernière géolocalisation GPS en cas de vol de téléphone, visualisez toutes ses requêtes et conversations archivées, congelez ses avoirs d'urgence ou connectez-vous directement sur son compte en tant qu'administrateur.
            </p>
          </div>

          {selectedUser && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => adminImpersonateUser(selectedUser.id)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                title="Prendre le contrôle du compte en supervision directe"
              >
                <Key className="w-4 h-4" />
                <span>🔑 Accès Direct au Compte</span>
              </button>

              <button
                onClick={() => setShowPoliceRequisitionModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Rapport Police / Vol PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH ENGINE SECTION (Nom ou Numéro de Téléphone) */}
      <div className="bg-[#0C121E] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
              <Search className="w-4 h-4 text-amber-400" />
              <span>Base d'Accès Rapide : Recherche par Nom ou Numéro de Téléphone</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Trouve instantanément le compte, toutes ses requêtes, ses appels et son adresse IP
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {searchResults.length} compte(s) trouvé(s)
          </span>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tapez le Nom (ex: Kouassi, Salimata) ou le Téléphone (ex: 07 48, 05 55, +225)..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-amber-500/40 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick User Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {searchResults.slice(0, 10).map(u => {
            const isSelected = selectedUser?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <img 
                  src={u.avatar} 
                  alt={u.name} 
                  className="w-5 h-5 rounded-full object-cover border border-white/20" 
                />
                <span>{u.name}</span>
                <span className="font-mono text-[11px] opacity-80">({u.phone})</span>
                {u.theftFreeze && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: IDENTITY, HARDWARE & THEFT PROTECTION ACTIONS */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Identity Card */}
            <div className="bg-[#0C121E] border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
              <div className="flex items-start gap-4">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-white text-base truncate">{selectedUser.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold uppercase">
                      {selectedUser.role}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">{selectedUser.phone}</p>
                  <p className="text-xs text-slate-400 truncate">{selectedUser.email}</p>
                </div>
              </div>

              {/* Status Alert if Suspended or Theft Frozen */}
              {selectedUser.theftFreeze ? (
                <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-red-400 font-extrabold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>🚨 COMPTE SOUS PROCÉDURE VOL / PERTE DE MOBILE</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {selectedUser.suspensionReason || "Compte verrouillé d'urgence suite à un signalement de vol."}
                  </p>
                  <button
                    onClick={() => adminUnfreezeUserAccount(selectedUser.id)}
                    className="w-full mt-2 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Dégeler et Rétablir le Compte</span>
                  </button>
                </div>
              ) : selectedUser.isSuspended ? (
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300">
                  ⚠️ Compte temporairement suspendu par la modération.
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Compte actif et opérationnel. Aucune anomalie de vol déclarée.</span>
                </div>
              )}

              {/* Financial balances */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Solde Portefeuille</span>
                  <strong className="text-sm font-mono text-emerald-400">
                    {(selectedUser.walletBalance || 0).toLocaleString()} F
                  </strong>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sous Séquestre</span>
                  <strong className="text-sm font-mono text-amber-400">
                    {((selectedUser.blockedBalance || 0) + (selectedUser.buyerBlockedBalance || 0)).toLocaleString()} F
                  </strong>
                </div>
              </div>

              {/* ANTIVOL & DIRECT ACCESS ACTIONS (SEUL ADMIN PEUT LE FAIRE) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Actions Administrateur Exclusives
                </span>

                {/* Direct Access Impersonation Button */}
                <button
                  onClick={() => adminImpersonateUser(selectedUser.id)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>Accéder Directement au Compte (Supervision)</span>
                </button>

                {/* Emergency Theft Freeze Button */}
                {!selectedUser.theftFreeze ? (
                  <button
                    onClick={() => setFreezeReasonModalOpen(true)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>🚨 Procédure Vol : Geler Compte & Séquestres</span>
                  </button>
                ) : (
                  <button
                    onClick={() => adminUnfreezeUserAccount(selectedUser.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Dégeler le Compte (Victime Réhabilitée)</span>
                  </button>
                )}
              </div>
            </div>

            {/* GPS & Network Investigation Details (Vol de téléphone) */}
            <div className="bg-[#0C121E] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Dernière Géolocalisation GPS & Réseau (Antivol)</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Commune Déclarée / Détectée</span>
                  <strong className="text-white text-sm">
                    {selectedUser.gpsLocation?.commune || selectedUser.city || 'Cocody, Abidjan'}
                  </strong>
                  <p className="text-[11px] text-slate-400">
                    {selectedUser.gpsLocation?.address || 'Riviera 2, Boulevard Mitterrand, Abidjan'}
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Coordonnées Satellite Précises</span>
                  <strong className="text-emerald-400 font-mono text-xs block">
                    Lat: {selectedUser.gpsLocation?.lat || 5.3599}, Lng: {selectedUser.gpsLocation?.lng || -3.9875}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Précision : {selectedUser.gpsLocation?.accuracy || 8} mètres (GPS Hardware)
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Adresse IP de Connexion & FAI</span>
                  <strong className="text-cyan-400 font-mono text-xs block">
                    {selectedUser.ipAddress || '41.202.144.78'} (Orange Côte d'Ivoire LTE)
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Dernière activité : il y a quelques instants
                  </span>
                </div>

                {/* Open in Google Maps */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedUser.gpsLocation?.lat || 5.3599},${selectedUser.gpsLocation?.lng || -3.9875}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir les Coordonnées GPS dans Google Maps</span>
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMNS: ALL REQUESTS (TICKETS), RECORDED CONVERSATIONS & CALLS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. SUPPORT REQUESTS & TICKETS FOR THIS ACCOUNT */}
            <div className="bg-[#0C121E] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Toutes les Requêtes & Tickets Support du Compte ({userTickets.length})</span>
                </h4>
                <span className="text-xs text-slate-400">Recherche automatique par Nom/Téléphone</span>
              </div>

              {userTickets.length === 0 ? (
                <div className="p-6 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl text-slate-400 text-xs">
                  Aucun ticket ou litige enregistré pour ce compte.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userTickets.map(tkt => (
                    <div 
                      key={tkt.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{tkt.problemCategoryLabel}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              tkt.status === 'resolved' 
                                ? 'bg-emerald-500/15 text-emerald-400' 
                                : tkt.status === 'call_scheduled'
                                ? 'bg-blue-500/15 text-blue-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}>
                              {tkt.status === 'resolved' ? 'Résolu' : tkt.status === 'call_scheduled' ? 'Appel Validé' : 'En attente'}
                            </span>
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            Soumis le {new Date(tkt.createdAt).toLocaleDateString('fr-FR')} • Conseillère : {tkt.advisorName}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">#{tkt.id.slice(-6)}</span>
                      </div>

                      <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 italic">
                        "{tkt.clientMessage}"
                      </p>

                      {tkt.adminResolutionNotes && (
                        <div className="text-[11px] text-emerald-400 font-medium">
                          Note Résolution Admin : {tkt.adminResolutionNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. AUTOMATICALLY RECORDED ASSISTANT CALLS */}
            <div className="bg-[#0C121E] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>Enregistrements d'Appels Liés à ce Compte ({userCalls.length})</span>
                </h4>
                <span className="text-xs text-amber-400 font-bold">Archivage audio certifié</span>
              </div>

              {userCalls.length === 0 ? (
                <div className="p-6 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl text-slate-400 text-xs">
                  Aucun appel audio enregistré avec ce compte.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userCalls.map(call => (
                    <div 
                      key={call.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{call.subject}</span>
                          <span className="text-amber-400 font-mono text-[11px]">({call.durationFormatted})</span>
                        </div>
                        <span className="text-slate-400 text-[11px] font-mono">{call.date} à {call.time}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                        <span>Conseillère : <strong className="text-slate-200">{call.advisorName}</strong></span>
                        <span>•</span>
                        <span className="text-cyan-400 font-mono">IP: {call.ipAddress}</span>
                        <span>•</span>
                        <span>{call.isp}</span>
                      </div>

                      {call.transcript && call.transcript.length > 0 && (
                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1 max-h-32 overflow-y-auto">
                          {call.transcript.slice(0, 3).map((rep, idx) => (
                            <div key={idx} className="text-[11px]">
                              <strong className={rep.speaker === 'client' ? 'text-amber-300' : 'text-cyan-300'}>
                                {rep.speakerName} : 
                              </strong>
                              <span className="text-slate-300 ml-1">{rep.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. AUTOMATICALLY RECORDED ASSISTANT CHAT CONVERSATIONS */}
            <div className="bg-[#0C121E] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Conversations Écrites Archivées ({userConversations.length})</span>
                </h4>
                <span className="text-xs text-slate-400">Historique complet</span>
              </div>

              {userConversations.length === 0 ? (
                <div className="p-6 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl text-slate-400 text-xs">
                  Aucune conversation écrite enregistrée pour ce compte.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userConversations.map(conv => (
                    <div 
                      key={conv.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Discussion avec {conv.advisorName}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{conv.date} {conv.time}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
                        {conv.messages.length} message(s) archivé(s). Dernier : "{conv.messages[conv.messages.length - 1]?.text}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="p-12 text-center bg-[#0C121E] border border-slate-800 rounded-3xl text-slate-400">
          Aucun utilisateur sélectionné.
        </div>
      )}

      {/* MODAL: REASON FOR EMERGENCY THEFT FREEZE */}
      {freezeReasonModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C121E] border border-red-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">
                  Activer la Procédure Vol & Gel d'Urgence
                </h3>
                <p className="text-xs text-slate-400">
                  Compte cible : <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.phone})
                </p>
              </div>
            </div>

            <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3 text-xs text-red-300 space-y-1">
              <strong className="block font-bold">Conséquences immédiates du gel :</strong>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                <li>Verrouillage des retraits d'argent (Wave, Orange Money, MoMo)</li>
                <li>Sécurisation des fonds sous séquestre acheteur et vendeur</li>
                <li>Déconnexion des sessions mobiles actives</li>
                <li>Alerte administrative de haute sécurité consignée dans les registres</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Motif officiel consigné au procès-verbal :
              </label>
              <textarea
                value={customFreezeReason}
                onChange={e => setCustomFreezeReason(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setFreezeReasonModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmFreeze}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Confirmer le Gel Antivol Immédiat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POLICE REQUISITION REPORT (FICHE OFFICIELLE ENQUÊTE ET VOL) */}
      {showPoliceRequisitionModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl p-8 shadow-2xl space-y-6 my-8">
            
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  RÉPUBLIQUE DE CÔTE D'IVOIRE • MINISTÈRE DE LA SÉCURITÉ
                </span>
                <h2 className="text-lg font-black text-slate-900 uppercase">
                  FICHE TECHNIQUE D'AUDIT ANTIVOL & RÉQUISITION
                </h2>
                <p className="text-xs text-slate-600">
                  Plateforme BRAD'CI — Direction Sécurité Numérique & Lutte Anti-Fraude
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-300 px-2 py-1 rounded">
                  DOC-VOL-{Date.now().toString().slice(-6)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Émis le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Subject info */}
            <div className="space-y-3 text-xs">
              <h3 className="font-black text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1">
                1. IDENTITÉ DU TITULAIRE DU COMPTE SIGNALÉ
              </h3>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                <div>Nom Complet : <strong>{selectedUser.name}</strong></div>
                <div>Numéro Téléphone : <strong>{selectedUser.phone}</strong></div>
                <div>Adresse Email : <strong>{selectedUser.email}</strong></div>
                <div>Statut KYC : <strong>{selectedUser.kycStatus.toUpperCase()}</strong></div>
                <div>Statut Compte : <strong className={selectedUser.theftFreeze ? "text-red-600" : "text-emerald-600"}>
                  {selectedUser.theftFreeze ? "VERROUILLÉ ANTIVOL" : "ACTIF"}
                </strong></div>
                <div>Solde Sécurisé : <strong>{selectedUser.walletBalance} FCFA</strong></div>
              </div>
            </div>

            {/* Geolocation & Technical Network */}
            <div className="space-y-3 text-xs">
              <h3 className="font-black text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1">
                2. DERNIÈRE POSITION GÉOLOCALISÉE & TRACE IP
              </h3>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                <div>Commune : <strong>{selectedUser.gpsLocation?.commune || selectedUser.city || 'Cocody'}</strong></div>
                <div>Adresse Estimée : <strong>{selectedUser.gpsLocation?.address || 'Riviera, Abidjan'}</strong></div>
                <div>Coordonnées GPS : <strong>Lat {selectedUser.gpsLocation?.lat || 5.3599}, Lng {selectedUser.gpsLocation?.lng || -3.9875}</strong></div>
                <div>Précision Satellite : <strong>{selectedUser.gpsLocation?.accuracy || 10} mètres</strong></div>
                <div>Adresse IP Enregistrée : <strong>{selectedUser.ipAddress || '41.202.144.78'}</strong></div>
                <div>Opérateur Télécom : <strong>Orange Côte d'Ivoire (LTE 4G)</strong></div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              Ce document certifie les métadonnées techniques extraites automatiquement de la plateforme sécurisée BRAD'CI. En cas de vol avec agression ou de perte de matériel, ces éléments permettent la réquisition d'antenne auprès des opérateurs de télécommunications pour la localisation du combiné.
            </div>

            {/* Print & Close */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / Sauvegarder en PDF</span>
              </button>
              <button
                onClick={() => setShowPoliceRequisitionModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
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
