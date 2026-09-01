import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bug, 
  ChevronUp, 
  ChevronDown, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  UserCheck, 
  Key, 
  Globe, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Terminal, 
  X,
  Server,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { UserRole } from '../types';

interface ApiLogItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  durationMs: number;
  timestamp: string;
  payloadSummary?: string;
}

interface CapturedErrorItem {
  id: string;
  message: string;
  source?: string;
  timestamp: string;
  stack?: string;
}

export const DemoDebugPanel: React.FC = () => {
  const { 
    currentUser, 
    isAdminAuthenticated, 
    language, 
    setLanguage, 
    theme, 
    effectiveTheme,
    adminInstantApproveMyKYC,
    loginWithRole,
    addToast,
    users
  } = useApp();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'auth' | 'api' | 'errors' | 'actions'>('auth');
  const [capturedErrors, setCapturedErrors] = useState<CapturedErrorItem[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLogItem[]>([
    {
      id: 'api-1',
      method: 'GET',
      endpoint: '/api/v1/auth/session',
      status: 200,
      durationMs: 42,
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
      payloadSummary: 'Session validée (User ID OK)'
    },
    {
      id: 'api-2',
      method: 'GET',
      endpoint: '/api/v1/kyc/status',
      status: currentUser?.kycStatus === 'verified' ? 200 : 200,
      durationMs: 38,
      timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
      payloadSummary: `KYC: ${currentUser?.kycStatus || 'none'}`
    },
    {
      id: 'api-3',
      method: 'GET',
      endpoint: '/api/v1/escrow/records',
      status: 200,
      durationMs: 65,
      timestamp: new Date().toLocaleTimeString(),
      payloadSummary: 'Séquestre multi-opérateurs synchronisé'
    }
  ]);
  const [triggerCrash, setTriggerCrash] = useState<boolean>(false);

  // Catch custom dispatched errors or runtime errors
  useEffect(() => {
    const handleRuntimeError = (e: any) => {
      const err = e.detail;
      if (err) {
        setCapturedErrors(prev => [
          {
            id: 'err-' + Date.now(),
            message: err.message || 'Runtime exception caught',
            source: 'Component ErrorBoundary',
            timestamp: new Date().toLocaleTimeString(),
            stack: err.stack
          },
          ...prev.slice(0, 19)
        ]);
      }
    };

    window.addEventListener('bradci:runtime_error', handleRuntimeError);
    return () => window.removeEventListener('bradci:runtime_error', handleRuntimeError);
  }, []);

  if (triggerCrash) {
    throw new Error("Test délibéré du système Anti-Écran Blanc (ErrorBoundary BRAD'CI). Le composant a été sécurisé avec succès !");
  }

  // Simulated Token string
  const simulatedToken = currentUser 
    ? `bradci_jwt_${currentUser.id.replace('user-', '')}_${currentUser.role}_exp2026` 
    : 'anonymous_guest_token_unauthenticated';

  const handleSimulateApiCall = (status: 200 | 400 | 404 | 500) => {
    const newLog: ApiLogItem = {
      id: 'api-' + Date.now(),
      method: 'POST',
      endpoint: status === 200 ? '/api/v1/sync/feed' : status === 400 ? '/api/v1/kyc/verify-facial' : status === 404 ? '/api/v1/escrow/order/not-found' : '/api/v1/vps/payment-gateway',
      status,
      durationMs: Math.floor(Math.random() * 120) + 25,
      timestamp: new Date().toLocaleTimeString(),
      payloadSummary: status === 200 ? 'Succès (Payload 200 OK)' : status === 400 ? 'Erreur 400 (Bad Request / Paramètre manquant)' : status === 404 ? 'Erreur 404 (Ressource introuvable)' : 'Erreur 500 (VPS Timeout / Circuit Breaker activé avec Fallback Mock Data)'
    };

    setApiLogs(prev => [newLog, ...prev.slice(0, 14)]);
    addToast(
      `Appel API simulé (${status})`,
      newLog.payloadSummary || '',
      status === 200 ? 'success' : status === 400 ? 'warning' : 'error'
    );
  };

  return (
    <aside 
      id="bradci-demo-debug-panel" 
      aria-label="Panneau de Débogage Démo"
      className="fixed bottom-20 right-4 z-40 font-sans select-none"
    >
      {/* Floating Collapsed Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-900 border border-amber-500/50 shadow-2xl text-slate-200 text-xs font-bold transition-all hover:scale-105 hover:border-amber-400 backdrop-blur-md cursor-pointer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Terminal className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="font-mono text-[11px] text-amber-300 font-extrabold">DEBUG MODE</span>
          {capturedErrors.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
              {capturedErrors.length}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {/* Expanded Floating Modal / Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] max-h-[85vh] bg-[#0A0F1D]/95 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>BRAD'CI Debug Inspector</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
                    v2.4 Live
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  Session & Network Diagnostic Engine
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1 text-[11px] font-bold">
            {[
              { id: 'auth', label: 'Auth & KYC', icon: UserCheck },
              { id: 'api', label: `API Logs (${apiLogs.length})`, icon: Server },
              { id: 'errors', label: `Erreurs (${capturedErrors.length})`, icon: Bug },
              { id: 'actions', label: 'Actions Démo', icon: Zap }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all ${
                    isActive 
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-3.5 overflow-y-auto max-h-[50vh] space-y-3 text-xs">
            {/* 1. AUTH & KYC TAB */}
            {activeTab === 'auth' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Utilisateur Actif :</span>
                    <span className="font-bold text-white font-mono">
                      {currentUser ? currentUser.name : 'Visiteur Non Connecté'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Rôle & Compte :</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold uppercase text-[10px]">
                      {currentUser?.role || 'Guest'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Statut KYC :</span>
                    <span className={`px-2 py-0.5 rounded-full border font-bold text-[10px] ${
                      currentUser?.kycStatus === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : currentUser?.kycStatus === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}>
                      {currentUser?.kycStatus === 'verified' ? '✓ Vérifié' : currentUser?.kycStatus === 'pending' ? '⏳ En Attente' : '✕ Non Vérifié'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Langue & Thème :</span>
                    <span className="font-mono text-slate-300">
                      {language.toUpperCase()} • {effectiveTheme}
                    </span>
                  </div>
                </div>

                {/* Simulated Token inspection */}
                <div className="p-2.5 rounded-2xl bg-black/70 border border-slate-800 text-[10px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Key className="w-3 h-3" />
                      <span>User Bearer Token :</span>
                    </span>
                    <span className="text-[9px] text-emerald-400">HS256 Active</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900/90 text-slate-300 break-all select-all border border-slate-800">
                    {simulatedToken}
                  </div>
                </div>

                {/* Quick KYC Bypass/Approve buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Bypass & Test KYC Rapide :
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        adminInstantApproveMyKYC();
                        addToast("KYC Approuvé Instantanément", "Votre profil a été certifié pour les tests.", "success");
                      }}
                      className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Valider KYC (1-Clic)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetRole: UserRole = currentUser?.role === 'driver' ? 'client' : 'driver';
                        loginWithRole(targetRole);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Changer Rôle Démo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. API MONITOR TAB */}
            {activeTab === 'api' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Simuler Réponse API Backend :</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSimulateApiCall(200)}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold font-mono"
                    >
                      200
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateApiCall(400)}
                      className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold font-mono"
                    >
                      400
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateApiCall(404)}
                      className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-[10px] font-bold font-mono"
                    >
                      404
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateApiCall(500)}
                      className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-[10px] font-bold font-mono"
                    >
                      500
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-[10px]">
                  {apiLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                            log.method === 'GET' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {log.method}
                          </span>
                          <span className="text-slate-200 font-bold">{log.endpoint}</span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          log.status === 200 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : log.status === 400 || log.status === 404
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status} ({log.durationMs}ms)
                        </span>
                      </div>
                      {log.payloadSummary && (
                        <p className="text-[9px] text-slate-400 truncate">
                          {log.payloadSummary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. CAPTURED ERRORS TAB */}
            {activeTab === 'errors' && (
              <div className="space-y-3">
                {capturedErrors.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-1.5">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                    <h5 className="font-bold text-white text-xs">Aucune anomalie détectée</h5>
                    <p className="text-[10px] text-slate-400">
                      Toutes les exceptions d'exécution sont interceptées par le système d'Error Boundary.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {capturedErrors.map((err) => (
                      <div key={err.id} className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 text-[10px] space-y-1 font-mono">
                        <div className="flex items-center justify-between text-red-300 font-bold">
                          <span>{err.source}</span>
                          <span className="text-[9px] text-slate-400">{err.timestamp}</span>
                        </div>
                        <p className="text-red-200">{err.message}</p>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCapturedErrors([])}
                      className="w-full py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800"
                    >
                      Effacer l'historique des erreurs
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. ACTIONS DÉMO & CRASH TEST TAB */}
            {activeTab === 'actions' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                  <p className="font-bold">🧪 Tests de Résilience & Anti-Écran Blanc :</p>
                  <p className="text-[10px] text-slate-300">
                    Ces boutons permettent de vérifier que l'application ne freeze jamais et affiche instantanément la Recovery UI.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setTriggerCrash(true)}
                    className="w-full p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Simuler Exception React (Tester Error Boundary)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      addToast("Cache Réinitialisé", "Toutes les clés locales ont été remises à zéro.", "info");
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Purger Cache Local & Recharger</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center flex items-center justify-between px-4 font-mono">
            <span>BRAD'CI Safe Shield</span>
            <span className="text-emerald-400 font-bold">● ONLINE 100%</span>
          </div>
        </div>
      )}
    </aside>
  );
};
