import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  MapPin, 
  ShieldAlert, 
  PhoneCall, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Ban, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Smartphone, 
  Laptop, 
  Wifi, 
  AlertTriangle, 
  Crown, 
  UserCheck, 
  Eye, 
  X,
  Phone,
  Radio,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auditLogger } from '../utils/activityAuditLogger';
import { UserActivityLog, VipCallRequest, BannedIPRecord, ActivityActionType } from '../types/audit';

export const AdminActivityAuditView: React.FC = () => {
  const { translate, language } = useApp();

  // Data states
  const [logs, setLogs] = useState<UserActivityLog[]>(() => auditLogger.getLogs());
  const [vipCalls, setVipCalls] = useState<VipCallRequest[]>(() => auditLogger.getVipCalls());
  const [bannedIPs, setBannedIPs] = useState<BannedIPRecord[]>(() => auditLogger.getBannedIPs());

  // Navigation & Sub-views
  const [subTab, setSubTab] = useState<'all_logs' | 'vip_calls' | 'ip_security' | 'geo_radar'>('all_logs');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [communeFilter, setCommuneFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected IP Inspection Modal
  const [inspectedIP, setInspectedIP] = useState<string | null>(null);

  // Manual Ban Modal
  const [manualBanIP, setManualBanIP] = useState('');
  const [manualBanReason, setManualBanReason] = useState('');
  const [showManualBanModal, setShowManualBanModal] = useState(false);

  // Active Admin Phone Call Stopwatch state
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callStopwatchSeconds, setCallStopwatchSeconds] = useState(0);
  const [adminCallNotes, setAdminCallNotes] = useState('');

  // Reload data
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLogs(auditLogger.getLogs());
      setVipCalls(auditLogger.getVipCalls());
      setBannedIPs(auditLogger.getBannedIPs());
      setIsRefreshing(false);
    }, 400);
  };

  // Stopwatch effect for ongoing VIP phone call
  useEffect(() => {
    if (!activeCallId) return;
    const timer = setInterval(() => {
      setCallStopwatchSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCallId]);

  // Sync real-time VIP call requests dispatched from user chat
  useEffect(() => {
    const handleNewVipCall = () => {
      setVipCalls(auditLogger.getVipCalls());
      setLogs(auditLogger.getLogs());
    };
    window.addEventListener('bradci_new_vip_call', handleNewVipCall);
    return () => window.removeEventListener('bradci_new_vip_call', handleNewVipCall);
  }, []);

  // Actions
  const handleBanIP = (ip: string, reason: string, commune?: string) => {
    if (!ip) return;
    auditLogger.banIP(ip, reason || 'Activité suspecte détectée par l\'administrateur', 'Direction Sécurité', commune);
    setBannedIPs(auditLogger.getBannedIPs());
    setLogs(auditLogger.getLogs());
  };

  const handleUnbanIP = (ip: string) => {
    auditLogger.unbanIP(ip);
    setBannedIPs(auditLogger.getBannedIPs());
    setLogs(auditLogger.getLogs());
  };

  const handleStartVipCall = (call: VipCallRequest) => {
    setActiveCallId(call.id);
    setCallStopwatchSeconds(0);
    setAdminCallNotes(call.adminNotes || '');
    auditLogger.updateVipCallStatus(call.id, 'in_progress', 'Direction Sécurité Admin');
    setVipCalls(auditLogger.getVipCalls());
  };

  const handleFinishVipCall = (callId: string) => {
    auditLogger.updateVipCallStatus(callId, 'completed', 'Direction Sécurité Admin', adminCallNotes);
    setActiveCallId(null);
    setVipCalls(auditLogger.getVipCalls());
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      exportDate: new Date().toISOString(),
      platform: "BRAD'CI Côte d'Ivoire",
      totalLogs: logs.length,
      logs,
      vipCallRequests: vipCalls,
      bannedIPs
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bradci_activity_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "ID,Timestamp,Utilisateur,Email,Telephone,Role,Pass_Abonne,IP,Commune,Operateur_FAI,Appareil,Action,Description,Severite\n";
    const rows = logs.map(l => {
      return `"${l.id}","${l.timestamp}","${l.userName}","${l.userEmail}","${l.userPhone || ''}","${l.userRole}","${l.isPassAbonne ? l.passTier : 'non'}","${l.ip}","${l.commune}","${l.isp}","${l.device}","${l.actionType}","${(l.description || '').replace(/"/g, '""')}","${l.severity}"`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bradci_audit_ip_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filter logs
  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.ip.includes(searchQuery) ||
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.userPhone && l.userPhone.includes(searchQuery)) ||
      l.commune.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.isp.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || l.actionType === actionFilter;
    const matchesCommune = communeFilter === 'all' || l.commune.toLowerCase() === communeFilter.toLowerCase();
    const matchesSeverity = severityFilter === 'all' || l.severity === severityFilter;

    return matchesSearch && matchesAction && matchesCommune && matchesSeverity;
  });

  // Filter VIP calls
  const pendingVipCalls = vipCalls.filter(c => c.status === 'pending' || c.status === 'in_progress');

  // Inspected IP logs
  const inspectedLogs = inspectedIP ? logs.filter(l => l.ip === inspectedIP) : [];
  const isInspectedBanned = inspectedIP ? bannedIPs.some(b => b.ip === inspectedIP) : false;

  return (
    <div id="admin-activity-ip-audit-view" className="space-y-6">
      
      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">
              {translate("Requêtes & Activités IP", "Total IP Logs")}
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {logs.length}
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{translate("Surveillance continue 24/7", "Continuous 24/7 audit")}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">
              {translate("Demandes d'Assistance Dédiée", "Dedicated Priority Support")}
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {pendingVipCalls.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {translate("Réservé Pass Abonnés", "Subscribers only")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">
              {translate("IPs Suspectes / Bannies", "Banned & Flagged IPs")}
            </span>
            <div className="text-2xl font-black text-red-400 font-mono mt-1">
              {bannedIPs.length}
            </div>
            <span className="text-[10px] text-red-400/80 mt-1 block">
              {translate("Pare-feu BRAD'CI actif", "Firewall active")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
            <Ban className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">
              {translate("Communes d'Abidjan", "Abidjan Communes")}
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              10
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {translate("Orange, MTN, Moov Africa", "Orange, MTN, Moov")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Globe className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 2. SUB-TABS & GLOBAL EXPORT CONTROLS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0C121E] p-2.5 rounded-2xl border border-slate-800">
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            id="subtab-all-logs"
            onClick={() => setSubTab('all_logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              subTab === 'all_logs' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{translate("Journal des Activités & IP", "Activity & IP Log")}</span>
            <span className="text-[10px] bg-slate-950/40 px-1.5 py-0.2 rounded font-mono">
              {logs.length}
            </span>
          </button>

          <button
            id="subtab-vip-calls"
            onClick={() => setSubTab('vip_calls')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              subTab === 'vip_calls' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{translate("Assistance Prioritaire Dédiée", "Dedicated Priority Support")}</span>
            {pendingVipCalls.length > 0 && (
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                {pendingVipCalls.length}
              </span>
            )}
          </button>

          <button
            id="subtab-ip-security"
            onClick={() => setSubTab('ip_security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              subTab === 'ip_security' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{translate("IPs Bannies & Sécurité", "Banned IPs & Safety")}</span>
            <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-mono">
              {bannedIPs.length}
            </span>
          </button>

          <button
            id="subtab-geo-radar"
            onClick={() => setSubTab('geo_radar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              subTab === 'geo_radar' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{translate("Radar Cartographique Abidjan", "Abidjan Geo Radar")}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            id="btn-refresh-audit-logs"
            onClick={handleRefresh}
            title="Actualiser en direct"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            id="btn-export-audit-json"
            onClick={handleExportJSON}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>

          <button
            id="btn-export-audit-csv"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>

      </div>

      {/* 3. VIEW 1: FULL ACTIVITY & IP LOGS TABLE */}
      {subTab === 'all_logs' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0C121E] p-4 rounded-3xl border border-slate-800">
            
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-audit-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translate("Rechercher IP, nom, commune...", "Search IP, name, commune...")}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Action Type Filter */}
            <div>
              <select
                id="filter-action-type"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">{translate("Toutes les actions", "All Actions")}</option>
                <option value="login">{translate("Connexion / Login", "Login")}</option>
                <option value="register">{translate("Inscription", "Registration")}</option>
                <option value="bid">{translate("Enchères & Offres", "Bidding")}</option>
                <option value="order">{translate("Commandes", "Orders")}</option>
                <option value="pod_payment">{translate("Paiements POD", "POD Payments")}</option>
                <option value="vip_call_request">{translate("Assistance Prioritaire", "Priority Support Request")}</option>
                <option value="kyc_submit">{translate("Dossiers KYC", "KYC Submissions")}</option>
                <option value="security_alert">{translate("Alertes de Sécurité", "Security Alerts")}</option>
              </select>
            </div>

            {/* Commune Filter */}
            <div>
              <select
                id="filter-commune-select"
                value={communeFilter}
                onChange={(e) => setCommuneFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">{translate("Toutes les communes d'Abidjan", "All Communes")}</option>
                <option value="Cocody">Cocody</option>
                <option value="Plateau">Plateau</option>
                <option value="Marcory">Marcory</option>
                <option value="Yopougon">Yopougon</option>
                <option value="Treichville">Treichville</option>
                <option value="Koumassi">Koumassi</option>
                <option value="Port-Bouët">Port-Bouët</option>
                <option value="Abobo">Abobo</option>
                <option value="Bingerville">Bingerville</option>
                <option value="Adjamé">Adjamé</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <select
                id="filter-severity-select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">{translate("Tous les niveaux de sécurité", "All Severities")}</option>
                <option value="normal">{translate("Normal (Activité standard)", "Normal")}</option>
                <option value="warning">{translate("Avertissement", "Warning")}</option>
                <option value="critical">{translate("Critique / Suspect", "Critical / Alert")}</option>
              </select>
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-[#0C121E] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] font-bold">
                    <th className="p-3.5">{translate("Horodatage", "Timestamp")}</th>
                    <th className="p-3.5">{translate("Utilisateur & Pass", "User & Pass")}</th>
                    <th className="p-3.5">{translate("Adresse IP & FAI", "IP & ISP")}</th>
                    <th className="p-3.5">{translate("Localisation / Commune", "Location / Commune")}</th>
                    <th className="p-3.5">{translate("Terminal / Réseau", "Device & Network")}</th>
                    <th className="p-3.5">{translate("Action Réalisée", "Action Executed")}</th>
                    <th className="p-3.5 text-right">{translate("Contrôles", "Controls")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        {translate("Aucun journal d'activité ne correspond à ces critères.", "No activity logs match these filters.")}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isBanned = bannedIPs.some(b => b.ip === log.ip);

                      return (
                        <tr 
                          key={log.id} 
                          className={`hover:bg-slate-900/50 transition-colors ${
                            log.severity === 'critical' ? 'bg-red-950/20' : ''
                          }`}
                        >
                          {/* Time */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono text-white block">
                              {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </span>
                          </td>

                          {/* User & Pass */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-bold text-white block">
                                  {log.userName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {log.userEmail}
                                </span>
                              </div>
                              {log.isPassAbonne && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5" />
                                  <span>{log.passTier}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* IP & Carrier */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30 text-[11px]">
                                {log.ip}
                              </span>
                              {isBanned && (
                                <span className="text-[9px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded">
                                  BAN
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {log.isp}
                            </span>
                          </td>

                          {/* Geolocation */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1 font-medium text-white">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{log.commune}, {log.city}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              🇨🇮 {log.coords.lat.toFixed(4)}, {log.coords.lng.toFixed(4)}
                            </span>
                          </td>

                          {/* Device & Network */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1 text-slate-300 text-[11px]">
                              {log.device.includes('Mobile') ? <Smartphone className="w-3 h-3 text-slate-400" /> : <Laptop className="w-3 h-3 text-slate-400" />}
                              <span>{log.device}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                              <Wifi className="w-2.5 h-2.5" />
                              <span>{log.networkType}</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="p-3.5">
                            <span className={`inline-block font-bold text-[11px] mb-0.5 ${
                              log.severity === 'critical' ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {log.actionTitle}
                            </span>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {log.description}
                            </p>
                          </td>

                          {/* Controls */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setInspectedIP(log.ip)}
                                title="Inspecter cette IP"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {isBanned ? (
                                <button
                                  onClick={() => handleUnbanIP(log.ip)}
                                  className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/30"
                                >
                                  {translate("Débannir", "Unban")}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBanIP(log.ip, `Bannissement depuis l'activité ${log.id}`, log.commune)}
                                  className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                                  title="Bloquer / Bannir cette IP"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW 2: VIP PHONE CALL REQUESTS (85 MINUTES - SUBSCRIBERS) */}
      {subTab === 'vip_calls' && (
        <div className="space-y-4">
          
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-white">
                  {translate("Console d'Assistance Prioritaire Dédiée", "Dedicated Priority Support Console")}
                </h3>
                <p className="text-xs text-slate-400">
                  {translate("Accompagnement continu exclusif réservé aux titulaires de Pass Vendeur et Livreur VIP.", "Continuous assistance strictly reserved for subscriber pass holders.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                id="btn-admin-establish-live-call"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('bradci_start_voice_call'));
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                title={translate("Lancer l'appel vocal direct en ligne réservé aux abonnés", "Launch live in-app voice call reserved for subscribers")}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{translate("Appel Vocal Direct Abonnés", "Live Subscriber Call")}</span>
              </button>

              <span className="text-xs bg-amber-500 text-slate-950 px-2.5 py-1 rounded-xl font-black shrink-0">
                {vipCalls.length} {translate("Demandes", "Requests")}
              </span>
            </div>
          </div>

          {/* Active Call Stopwatch HUD */}
          {activeCallId && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
                    {translate("Session d'Assistance Prioritaire en Cours", "Active Priority Support Session")}
                  </span>
                  <p className="text-sm font-bold text-white">
                    Ticket #{activeCallId}
                  </p>
                </div>
              </div>

              {/* Stopwatch */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">{translate("Temps écoulé :", "Time elapsed:")}</span>
                  <span className="text-2xl font-black font-mono text-amber-400">
                    {Math.floor(callStopwatchSeconds / 60)}:{String(callStopwatchSeconds % 60).padStart(2, '0')}
                  </span>
                </div>

                <button
                  onClick={() => handleFinishVipCall(activeCallId)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg"
                >
                  {translate("Terminer & Clôturer la Session", "Finish & Close Session")}
                </button>
              </div>
            </div>
          )}

          {/* Grid of VIP Call Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vipCalls.map((call) => {
              const isActive = activeCallId === call.id;

              return (
                <div 
                  key={call.id} 
                  className={`p-5 rounded-3xl bg-[#0C121E] border transition-all ${
                    isActive 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl' 
                      : call.status === 'pending'
                        ? 'border-amber-500/40 shadow-lg'
                        : 'border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-amber-400">
                        {call.id}
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        Pass {call.passTier}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      call.status === 'pending'
                        ? 'bg-amber-500 text-slate-950'
                        : call.status === 'in_progress'
                          ? 'bg-emerald-500 text-slate-950 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                    }`}>
                      {call.status === 'pending' ? 'EN ATTENTE' : call.status === 'in_progress' ? 'EN COURS' : 'CLÔTURÉ'}
                    </span>
                  </div>

                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{translate("Abonné :", "Subscriber:")}</span>
                      <strong className="text-white">{call.userName}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">{translate("Numéro à appeler :", "Phone:")}</span>
                      <a href={`tel:${call.userPhone}`} className="text-emerald-400 font-mono font-black hover:underline">
                        {call.userPhone}
                      </a>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">{translate("Créneau souhaité :", "Preferred slot:")}</span>
                      <span className="text-amber-300 font-medium">{call.preferredSlot}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">{translate("Priorité :", "Priority:")}</span>
                      <span className="text-emerald-400 font-mono font-bold">Haute / Pass</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl mt-2 text-slate-300 text-[11px]">
                      <strong className="text-amber-400 block mb-0.5">{call.subject}</strong>
                      {call.notes && <p className="text-slate-400 italic">"{call.notes}"</p>}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      IP: {call.ip} ({call.commune})
                    </span>

                    <div className="flex items-center gap-2">
                      {call.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              handleStartVipCall(call);
                              window.dispatchEvent(new CustomEvent('bradci_trigger_incoming_call', {
                                detail: {
                                  callId: call.id,
                                  clientName: call.userName,
                                  clientPhone: call.userPhone,
                                  subject: call.subject
                                }
                              }));
                            }}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1 shadow-md transition-transform active:scale-95"
                            title={translate("Lancer l'appel automatique vers le client", "Launch automatic callback to client")}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>{translate("Appel Vocal Direct", "Live Voice Call")}</span>
                          </button>

                          <button
                            onClick={() => {
                              handleStartVipCall(call);
                              window.dispatchEvent(new CustomEvent('bradci_trigger_incoming_call', {
                                detail: {
                                  callId: call.id,
                                  clientName: call.userName,
                                  clientPhone: call.userPhone,
                                  subject: call.subject
                                }
                              }));
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{translate("Prendre en Charge", "Handle Request")}</span>
                          </button>
                        </div>
                      )}

                      {call.status === 'in_progress' && (
                        <button
                          onClick={() => handleFinishVipCall(call.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                        >
                          {translate("Clôturer", "Close")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 5. VIEW 3: BANNED IPS & FIREWALL */}
      {subTab === 'ip_security' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-500/30 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="text-sm font-black text-white">
                  {translate("Liste Noire & Pare-feu BRAD'CI", "BRAD'CI Firewall & Blacklist")}
                </h3>
                <p className="text-xs text-slate-400">
                  {translate("Les adresses IP bannies sont instantanément révoquées de toutes les transactions et enchères.", "Banned IPs are immediately blocked from all bids and transactions.")}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowManualBanModal(true)}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{translate("Bannir une IP manuellement", "Ban IP manually")}</span>
            </button>
          </div>

          <div className="bg-[#0C121E] border border-slate-800 rounded-3xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] font-bold">
                  <th className="p-3.5">{translate("Adresse IP", "IP Address")}</th>
                  <th className="p-3.5">{translate("Date de bannissement", "Ban Date")}</th>
                  <th className="p-3.5">{translate("Motif de révocation", "Revocation Reason")}</th>
                  <th className="p-3.5">{translate("Banni par", "Banned By")}</th>
                  <th className="p-3.5 text-right">{translate("Action", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bannedIPs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      {translate("Aucune adresse IP n'est actuellement en liste noire.", "No IP addresses are currently blacklisted.")}
                    </td>
                  </tr>
                ) : (
                  bannedIPs.map((ban) => (
                    <tr key={ban.ip} className="hover:bg-slate-900/50">
                      <td className="p-3.5 font-mono font-bold text-red-400">
                        {ban.ip}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {new Date(ban.bannedAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {ban.reason}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {ban.bannedBy}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleUnbanIP(ban.ip)}
                          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 transition-colors"
                        >
                          {translate("Lever le ban", "Lift Ban")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 6. VIEW 4: ABIDJAN GEO RADAR */}
      {subTab === 'geo_radar' && (
        <div className="space-y-4">
          
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-white">
                  {translate("Radar Cartographique des Connexions Abidjan", "Abidjan Connection Geo Radar")}
                </h3>
                <p className="text-xs text-slate-400">
                  {translate("Répartition géographique en direct des accès et des opérateurs télécoms (Orange CI, MTN, Moov Africa).", "Live geographic distribution across telecom carriers.")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Cocody', lat: 5.3599, lng: -3.9870, isp: 'Orange CI', share: '38%', activeCount: 42 },
              { name: 'Plateau', lat: 5.3261, lng: -4.0197, isp: 'MTN CI', share: '24%', activeCount: 29 },
              { name: 'Marcory', lat: 5.3045, lng: -3.9825, isp: 'Orange CI', share: '18%', activeCount: 19 },
              { name: 'Yopougon', lat: 5.3411, lng: -4.0833, isp: 'Moov Africa', share: '12%', activeCount: 15 },
              { name: 'Koumassi', lat: 5.3011, lng: -3.9482, isp: 'MTN CI', share: '8%', activeCount: 9 },
              { name: 'Treichville', lat: 5.3089, lng: -4.0089, isp: 'Orange CI', share: '6%', activeCount: 7 }
            ].map((commune) => (
              <div key={commune.name} className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-white text-sm">{commune.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    {commune.activeCount} accès
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Opérateur prédominant :</span>
                    <strong className="text-white">{commune.isp}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Part du trafic :</span>
                    <strong className="text-emerald-400">{commune.share}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordonnées GPS :</span>
                    <span className="font-mono text-[10px] text-slate-500">{commune.lat}, {commune.lng}</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: commune.share }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 7. INSPECT IP MODAL */}
      {inspectedIP && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0C121E] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white font-mono">
                  {translate("Inspection Approfondie IP : ", "Deep IP Inspection: ")}{inspectedIP}
                </h3>
              </div>
              <button
                onClick={() => setInspectedIP(null)}
                className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 flex justify-between">
                <span className="text-slate-400">Statut Réseau :</span>
                {isInspectedBanned ? (
                  <span className="text-red-400 font-bold">⛔ BANNI / BLOQUÉ</span>
                ) : (
                  <span className="text-emerald-400 font-bold">✓ AUTORISÉ</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900 flex justify-between">
                <span className="text-slate-400">Total Activités Enregistrées :</span>
                <strong className="text-white font-mono">{inspectedLogs.length} requêtes</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2">Historique récent de cette IP :</h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {inspectedLogs.map(l => (
                  <div key={l.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-0.5">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{l.userName} ({l.commune})</span>
                      <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-white font-medium">{l.actionTitle}</p>
                    <p className="text-[11px] text-slate-400">{l.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              {isInspectedBanned ? (
                <button
                  onClick={() => {
                    handleUnbanIP(inspectedIP);
                    setInspectedIP(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  {translate("Lever le Bannissement", "Lift Ban")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleBanIP(inspectedIP, "Banni depuis la modal d'inspection");
                    setInspectedIP(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                >
                  {translate("Bannir cette IP Immédiatement", "Ban This IP Now")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. MANUAL BAN MODAL */}
      {showManualBanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0C121E] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-400" />
                <span>{translate("Bannir une Adresse IP", "Ban an IP Address")}</span>
              </h3>
              <button
                onClick={() => setShowManualBanModal(false)}
                className="p-1 rounded-xl hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  {translate("Adresse IP publique (ex: 41.202.144.78) :", "Public IP Address:")}
                </label>
                <input
                  type="text"
                  value={manualBanIP}
                  onChange={(e) => setManualBanIP(e.target.value)}
                  placeholder="ex: 41.202.144.78"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  {translate("Motif du bannissement :", "Reason for Ban:")}
                </label>
                <input
                  type="text"
                  value={manualBanReason}
                  onChange={(e) => setManualBanReason(e.target.value)}
                  placeholder="ex: Tentative d'attaque force brute ou arnaque"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowManualBanModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                {translate("Annuler", "Cancel")}
              </button>
              <button
                onClick={() => {
                  if (manualBanIP) {
                    handleBanIP(manualBanIP, manualBanReason);
                    setShowManualBanModal(false);
                    setManualBanIP('');
                    setManualBanReason('');
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black"
              >
                {translate("Confirmer le Bannissement", "Confirm Ban")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
