import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Mic, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  Sparkles,
  Settings,
  RefreshCw,
  Info,
  Smartphone,
  ExternalLink,
  Apple,
  Radio
} from 'lucide-react';
import { 
  requestUniversalNotificationPermission, 
  sendUniversalPush,
  isPlatformIOS,
  isPlatformAndroid,
  isRunningInIframe
} from '../utils/universalNotifications';
import { voiceNavigator } from '../utils/voiceNavigator';
import { BradCiLogoIcon } from './BradCiLogo';

export type PermissionState = 'pending' | 'checking' | 'granted' | 'denied';

interface PermissionsGuardProps {
  children: React.ReactNode;
}

export const PermissionsGuard: React.FC<PermissionsGuardProps> = ({ children }) => {
  // 1. Vérification de l'accès déjà enregistré dans localStorage
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return (
          localStorage.getItem('bradci_permissions_accepted') === 'true' ||
          localStorage.getItem('bradci_permissions_ok') === 'true'
        );
      } catch (_) {
        return false;
      }
    }
    return false;
  });

  // États individuels en direct des 4 autorisations système
  const [statusNotifications, setStatusNotifications] = useState<PermissionState>('pending');
  const [statusLocation, setStatusLocation] = useState<PermissionState>('pending');
  const [statusMicrophone, setStatusMicrophone] = useState<PermissionState>('pending');
  const [statusCamera, setStatusCamera] = useState<PermissionState>('pending');

  // Détection de la plateforme d'exécution
  const [isIframe, setIsIframe] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);

  // État global du processus
  const [isAutoChecking, setIsAutoChecking] = useState<boolean>(true);
  const [currentCheckingStep, setCurrentCheckingStep] = useState<string>('Initialisation du système BRAD\'CI...');
  const [showSettingsHelp, setShowSettingsHelp] = useState<boolean>(false);
  const [helpPlatformTab, setHelpPlatformTab] = useState<'android' | 'ios'>('android');
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);

  const autoRunInitiatedRef = useRef<boolean>(false);

  useEffect(() => {
    setIsIframe(isRunningInIframe());
    setIsIOS(isPlatformIOS());
    setIsAndroid(isPlatformAndroid());
    if (isPlatformIOS()) {
      setHelpPlatformTab('ios');
    }
  }, []);

  // Déblocage et enregistrement dans localStorage
  const unlockAndLaunchApp = () => {
    try {
      localStorage.setItem('bradci_permissions_accepted', 'true');
      localStorage.setItem('bradci_permissions_ok', 'true');
      voiceNavigator.unlockAudio();
    } catch (_) {}
    setIsUnlocked(true);
  };

  // Demande individuelle de notification (déclenchée par clic direct utilisateur, indispensable sur iPhone iOS & Android)
  const handleRequestNotificationsDirect = async () => {
    setStatusNotifications('checking');
    try {
      const res = await requestUniversalNotificationPermission();
      if (res.granted) {
        setStatusNotifications('granted');
        setTestNotificationSent(true);
        // Déclencher une notification de confirmation en direct
        sendUniversalPush(
          "BRAD'CI : Notifications Activées ⚡",
          "Accès aux alertes de courses, séquestre et arrivées livreurs validé !"
        ).catch(() => {});
      } else {
        setStatusNotifications(res.permissionState === 'denied' ? 'denied' : 'pending');
      }
    } catch (e) {
      console.warn('[PermissionsGuard] Erreur demande directe notification:', e);
      setStatusNotifications('granted'); // Fallback gracieux
    }
  };

  // Séquence d'exécution automatique au chargement
  const runAutoPermissionSequence = async () => {
    setIsAutoChecking(true);

    let notifResult: PermissionState = 'denied';
    let gpsResult: PermissionState = 'denied';
    let micResult: PermissionState = 'denied';
    let camResult: PermissionState = 'denied';

    // -------------------------------------------------------------
    // ÉTAPE a) Notifications Push (Android APK, iPhone iOS, PWA & Web)
    // -------------------------------------------------------------
    setCurrentCheckingStep('Activation des Notifications Push...');
    setStatusNotifications('checking');
    try {
      const notifResponse = await requestUniversalNotificationPermission();
      notifResult = notifResponse.granted ? 'granted' : (notifResponse.permissionState === 'denied' ? 'denied' : 'pending');
    } catch (err) {
      console.warn('[PermissionsGuard] Notification permission error:', err);
      notifResult = 'granted';
    }
    setStatusNotifications(notifResult);

    await new Promise(r => setTimeout(r, 250));

    // -------------------------------------------------------------
    // ÉTAPE b) Géolocalisation GPS Haute Précision
    // -------------------------------------------------------------
    setCurrentCheckingStep('Connexion au GPS Haute Précision...');
    setStatusLocation('checking');
    try {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        gpsResult = await new Promise<PermissionState>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve('granted'),
            (err) => {
              console.warn('[PermissionsGuard] Geolocation error:', err);
              resolve('denied');
            },
            { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
          );
        });
      } else {
        gpsResult = 'granted';
      }
    } catch (err) {
      console.warn('[PermissionsGuard] Geolocation exception:', err);
      gpsResult = 'denied';
    }
    setStatusLocation(gpsResult);

    await new Promise(r => setTimeout(r, 250));

    // -------------------------------------------------------------
    // ÉTAPE c) Microphone / Voix Off
    // -------------------------------------------------------------
    setCurrentCheckingStep('Calibration de la Voix Off & Micro...');
    setStatusMicrophone('checking');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach(track => track.stop());
        micResult = 'granted';
      } else {
        micResult = 'granted';
      }
    } catch (err) {
      console.warn('[PermissionsGuard] Microphone error:', err);
      micResult = 'denied';
    }
    setStatusMicrophone(micResult);

    await new Promise(r => setTimeout(r, 250));

    // -------------------------------------------------------------
    // ÉTAPE d) Appareil Photo / Caméra
    // -------------------------------------------------------------
    setCurrentCheckingStep('Initialisation Caméra & Scanner QR...');
    setStatusCamera('checking');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStream.getTracks().forEach(track => track.stop());
        camResult = 'granted';
      } else {
        camResult = 'granted';
      }
    } catch (err) {
      console.warn('[PermissionsGuard] Camera error:', err);
      camResult = 'denied';
    }
    setStatusCamera(camResult);

    setIsAutoChecking(false);

    // DÉBLOCAGE FLUIDE : si notifications et GPS sont accordés
    if ((notifResult === 'granted' || isRunningInIframe()) && gpsResult === 'granted') {
      setCurrentCheckingStep('✓ Configuration terminée avec succès !');
      setTimeout(() => {
        unlockAndLaunchApp();
      }, 550);
    } else {
      setCurrentCheckingStep('Vérification terminée. Action requise ci-dessous :');
    }
  };

  // Déclenchement automatique au montage
  useEffect(() => {
    if (isUnlocked) return;

    if (!autoRunInitiatedRef.current) {
      autoRunInitiatedRef.current = true;
      runAutoPermissionSequence();
    }
  }, [isUnlocked]);

  // Si l'accès est déjà débloqué, afficher directement l'application
  if (isUnlocked) {
    return <>{children}</>;
  }

  const grantedCount = [
    statusLocation === 'granted',
    statusNotifications === 'granted',
    statusMicrophone === 'granted',
    statusCamera === 'granted'
  ].filter(Boolean).length;

  const hasAnyDenied = 
    statusLocation === 'denied' || 
    statusNotifications === 'denied' || 
    statusMicrophone === 'denied' || 
    statusCamera === 'denied';

  return (
    <div 
      id="bradci-permissions-guard-screen"
      className="fixed inset-0 z-[999999] min-h-screen w-full bg-[#06102e] text-white flex flex-col justify-between overflow-y-auto antialiased selection:bg-[#f97316]/30"
    >
      {/* Halos lumineux d'ambiance design */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        
        {/* ========================================================================= */}
        {/* EN-TÊTE OFFICIEL BRAD'CI                                                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative group mb-3">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#f97316] to-blue-600 rounded-3xl blur-md opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#09153a] border-2 border-white/20 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
              <img 
                src="./icon.png" 
                alt="BRAD'CI Logo" 
                className="w-full h-full object-contain filter drop-shadow-md rounded-xl"
                onError={(e) => { 
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.getAttribute('src') !== 'icon.png') {
                    target.src = 'icon.png';
                  } else {
                    target.style.display = 'none';
                    const fb = document.getElementById('bradci-logo-vector-fallback');
                    if (fb) fb.style.display = 'block';
                  }
                }} 
              />
              <div id="bradci-logo-vector-fallback" style={{ display: 'none' }} className="w-full h-full flex items-center justify-center">
                <BradCiLogoIcon className="w-full h-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-2xl sm:text-3xl font-black tracking-wider text-white font-['Syne',sans-serif]">
              BRAD'<span className="text-[#f97316]">CI</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-black uppercase tracking-wider text-amber-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
            <span>Accès Requis : Android APK • iPhone iOS • Web</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Configuration de vos accès sécurisés BRAD'CI
          </h1>
          <p className="mt-1.5 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {currentCheckingStep}
          </p>

          {/* Statut en temps réel */}
          <div className="mt-3 flex items-center gap-2 bg-[#09153a]/90 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-inner">
            {isAutoChecking ? (
              <Loader2 className="w-4 h-4 text-[#f97316] animate-spin shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-slate-300">Synchronisation :</span>
            <span className="text-emerald-400 font-mono font-black">{grantedCount}/4 autorisations</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BANDEAU INFORMATIF IFRAME APERÇU VS PLEIN ÉCRAN                         */}
        {/* ========================================================================= */}
        {isIframe && (
          <div className="mb-4 p-3 rounded-xl bg-blue-950/70 border border-blue-500/30 text-xs text-slate-200">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-blue-300">Aperçu en conteneur (Iframe) :</span>{' '}
                Le navigateur filtre le pop-up système sur les notifications dans une iframe. Pour déclencher les alertes natives Android / iPhone sans restriction :
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] shadow-sm cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Ouvrir en plein écran (Nouvel onglet)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestNotificationsDirect}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-black text-[11px] shadow-sm cursor-pointer"
                  >
                    <Bell className="w-3 h-3" />
                    <span>Activer les notifications push</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LES 4 AUTORISATIONS AVEC ACTION DIRECTE                                   */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          
          {/* 1. 🔔 Notifications Push Universelles (Android APK & iPhone) */}
          <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
            statusNotifications === 'granted' 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : statusNotifications === 'checking'
              ? 'bg-blue-600/15 border-blue-500/50'
              : statusNotifications === 'denied'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-[#09153a]/80 border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  statusNotifications === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : statusNotifications === 'checking'
                    ? 'bg-blue-500/20 text-blue-400'
                    : statusNotifications === 'denied'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-black text-white">Notifications Push</h2>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                      Android APK • iPhone iOS
                    </span>
                    {statusNotifications === 'granted' && (
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                    Alertes sonores de nouvelles courses, arrivées livreurs et validation séquestre.
                  </p>

                  {/* Bouton de déclenchement manuel rapide pour iOS / Android */}
                  {statusNotifications !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestNotificationsDirect}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-black text-xs shadow transition-transform active:scale-95 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Activer les Notifications Push</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {statusNotifications === 'granted' ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : statusNotifications === 'checking' ? (
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : statusNotifications === 'denied' ? (
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center" title="Bloqué">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">En attente</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. 📍 Localisation GPS Haute Précision */}
          <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
            statusLocation === 'granted' 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : statusLocation === 'checking'
              ? 'bg-blue-600/15 border-blue-500/50'
              : statusLocation === 'denied'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-[#09153a]/80 border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  statusLocation === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : statusLocation === 'checking'
                    ? 'bg-blue-500/20 text-blue-400'
                    : statusLocation === 'denied'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white">Localisation GPS Haute Précision</h2>
                    {statusLocation === 'granted' && (
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Connecté
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                    Calcul d'itinéraire en temps réel et attribution prioritaire des courses.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {statusLocation === 'granted' ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : statusLocation === 'checking' ? (
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : statusLocation === 'denied' ? (
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center" title="Refusé">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">En attente</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. 🎙️ Microphone & Guidage Voix Off */}
          <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
            statusMicrophone === 'granted' 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : statusMicrophone === 'checking'
              ? 'bg-blue-600/15 border-blue-500/50'
              : statusMicrophone === 'denied'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-[#09153a]/80 border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  statusMicrophone === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : statusMicrophone === 'checking'
                    ? 'bg-amber-500/20 text-amber-400'
                    : statusMicrophone === 'denied'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <Mic className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white">Microphone & Guidage Voix Off</h2>
                    {statusMicrophone === 'granted' && (
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Connecté
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                    Guidage vocal mains libres et reconnaissance des commandes à moto.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {statusMicrophone === 'granted' ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : statusMicrophone === 'checking' ? (
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : statusMicrophone === 'denied' ? (
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center" title="Refusé">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">En attente</span>
                )}
              </div>
            </div>
          </div>

          {/* 4. 📷 Appareil Photo & Scanner QR */}
          <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
            statusCamera === 'granted' 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : statusCamera === 'checking'
              ? 'bg-blue-600/15 border-blue-500/50'
              : statusCamera === 'denied'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-[#09153a]/80 border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  statusCamera === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : statusCamera === 'checking'
                    ? 'bg-purple-500/20 text-purple-400'
                    : statusCamera === 'denied'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white">Appareil Photo & Scanner QR</h2>
                    {statusCamera === 'granted' && (
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Connecté
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                    Scan des bordereaux et capture de photos justificatives de livraison.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {statusCamera === 'granted' ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : statusCamera === 'checking' ? (
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : statusCamera === 'denied' ? (
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center" title="Refusé">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">En attente</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* PANNEAU GUIDE : DÉBLOQUER DANS ANDROID OU IPHONE                          */}
        {/* ========================================================================= */}
        {showSettingsHelp && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300">Guide de déblocage des accès</span>
              </div>
              
              {/* Onglets Android vs iPhone */}
              <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHelpPlatformTab('android')}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                    helpPlatformTab === 'android' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Android APK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHelpPlatformTab('ios')}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                    helpPlatformTab === 'ios' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  <Apple className="w-3 h-3" />
                  <span>iPhone iOS</span>
                </button>
              </div>
            </div>

            {helpPlatformTab === 'android' ? (
              <div className="space-y-1.5 text-[11px] text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Ouvrez les <strong>Paramètres</strong> de votre téléphone Android.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Allez dans <strong>Applications</strong> &gt; Recherchez <strong>BRAD'CI</strong> (ou Chrome).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Appuyez sur <strong>Autorisations</strong> &gt; Activez Notifications, Localisation, Micro et Appareil Photo.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-[11px] text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Sur Safari iPhone, appuyez sur le bouton <strong>Partager</strong> (carré avec flèche vers le haut).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Sélectionnez <strong>Sur l'écran d'accueil</strong> pour installer l'application BRAD'CI PWA.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Ouvrez l'icône BRAD'CI sur votre écran et acceptez les notifications instantanées.</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* BARRE D'ACTIONS INFERIEURE                                                */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-lg mx-auto p-4 sm:p-5 pb-7 bg-[#06102e]/95 backdrop-blur-md border-t border-white/10 space-y-2.5">
        
        <div className="space-y-2">
          {/* Bouton principal de lancement */}
          <button
            id="btn-auto-launch-continue"
            type="button"
            onClick={() => unlockAndLaunchApp()}
            className="w-full py-4 px-6 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-2xl shadow-[#f97316]/40 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {isAutoChecking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Configuration en cours...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Lancer l'application BRAD'CI</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => runAutoPermissionSequence()}
              disabled={isAutoChecking}
              className="py-2.5 px-3 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoChecking ? 'animate-spin' : ''}`} />
              <span>Relancer la détection</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsHelp(prev => !prev)}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Aide Android / iPhone</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400">
          Système sécurisé BRAD'CI • Compatible Android APK, iPhone iOS et PWA Abidjan.
        </p>
      </div>
    </div>
  );
};

export default PermissionsGuard;
