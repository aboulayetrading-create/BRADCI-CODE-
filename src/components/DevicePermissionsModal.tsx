import React, { useState, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Mic, 
  Bell, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { nativeBridge } from '../utils/nativeBridge';
import { requestUniversalNotificationPermission, isRunningInIframe } from '../utils/universalNotifications';

interface DevicePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdated?: () => void;
}

export type PermissionStatusType = 'granted' | 'denied' | 'prompt' | 'unsupported';

export const DevicePermissionsModal: React.FC<DevicePermissionsModalProps> = ({
  isOpen,
  onClose,
  onPermissionsUpdated
}) => {
  const { addToast, translate } = useApp();

  const [cameraStatus, setCameraStatus] = useState<PermissionStatusType>('prompt');
  const [micStatus, setMicStatus] = useState<PermissionStatusType>('prompt');
  const [notifStatus, setNotifStatus] = useState<PermissionStatusType>('prompt');
  const [geoStatus, setGeoStatus] = useState<PermissionStatusType>('prompt');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [inIframe, setInIframe] = useState<boolean>(false);

  // Check real statuses
  const checkAllStatuses = useCallback(async () => {
    setInIframe(isRunningInIframe());

    // 1. Notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifStatus(Notification.permission as PermissionStatusType);
    } else {
      setNotifStatus('unsupported');
    }

    // 2. Geolocation
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        const geoQuery = await (navigator.permissions as any).query({ name: 'geolocation' });
        setGeoStatus(geoQuery.state);
      }
    } catch (_) {
      setGeoStatus('prompt');
    }

    // 3. Camera
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        const camQuery = await (navigator.permissions as any).query({ name: 'camera' });
        setCameraStatus(camQuery.state);
      }
    } catch (_) {
      setCameraStatus('prompt');
    }

    // 4. Microphone
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        const micQuery = await (navigator.permissions as any).query({ name: 'microphone' });
        setMicStatus(micQuery.state);
      }
    } catch (_) {
      setMicStatus('prompt');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkAllStatuses();
    }
  }, [isOpen, checkAllStatuses]);

  // Re-check on window focus (e.g. user comes back from Android app settings)
  useEffect(() => {
    const handleFocus = () => {
      if (isOpen) checkAllStatuses();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isOpen, checkAllStatuses]);

  // Request Camera
  const handleRequestCamera = async () => {
    setIsProcessing(true);
    try {
      const ok = await nativeBridge.requestCameraPermission();
      if (ok) {
        setCameraStatus('granted');
        addToast(translate("Appareil Photo Activé", "Camera Enabled"), translate("Vous pouvez désormais prendre vos articles en photo.", "You can now photograph your items."), "success");
      } else {
        await checkAllStatuses();
      }
    } catch (e) {
      console.warn("Camera request error:", e);
    } finally {
      setIsProcessing(false);
      onPermissionsUpdated?.();
    }
  };

  // Request Microphone
  const handleRequestMic = async () => {
    setIsProcessing(true);
    try {
      const ok = await nativeBridge.requestMicrophonePermission();
      if (ok) {
        setMicStatus('granted');
        addToast(translate("Microphone Activé", "Microphone Enabled"), translate("Vous pouvez envoyer des notes vocales aux livreurs et au support.", "You can send voice notes to couriers and support."), "success");
      } else {
        await checkAllStatuses();
      }
    } catch (e) {
      console.warn("Microphone request error:", e);
    } finally {
      setIsProcessing(false);
      onPermissionsUpdated?.();
    }
  };

  // Request Notifications
  const handleRequestNotif = async () => {
    setIsProcessing(true);
    try {
      const res = await requestUniversalNotificationPermission();
      setNotifStatus(res.permissionState as PermissionStatusType);
      if (res.granted) {
        addToast(translate("Notifications Activées", "Notifications Enabled"), translate("Vous recevrez les alertes d'enchères et livraisons.", "You will receive auction and delivery alerts."), "success");
      }
    } catch (e) {
      console.warn("Notification request error:", e);
    } finally {
      setIsProcessing(false);
      onPermissionsUpdated?.();
    }
  };

  // One-click All Permissions Trigger
  const handleAuthorizeAll = async () => {
    setIsProcessing(true);
    try {
      // 1. Camera & Microphone in single native browser dialog
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach(t => t.stop());
          setCameraStatus('granted');
          setMicStatus('granted');
        } catch (_) {
          // If combined fails, try individually
          try {
            const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
            vStream.getTracks().forEach(t => t.stop());
            setCameraStatus('granted');
          } catch (_) {}
          try {
            const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            aStream.getTracks().forEach(t => t.stop());
            setMicStatus('granted');
          } catch (_) {}
        }
      }

      // 2. Notifications
      try {
        const notifRes = await requestUniversalNotificationPermission();
        setNotifStatus(notifRes.permissionState as PermissionStatusType);
      } catch (_) {}

      // 3. Geolocation
      try {
        await nativeBridge.requestLocationPermission();
        setGeoStatus('granted');
      } catch (_) {}

      addToast(
        translate("Autorisations Mises à Jour", "Permissions Updated"),
        translate("Vos accès caméra, micro et notifications ont été synchronisés.", "Camera, mic, and notifications have been synced."),
        "success"
      );
    } catch (e) {
      console.warn("Authorize all error:", e);
    } finally {
      await checkAllStatuses();
      setIsProcessing(false);
      onPermissionsUpdated?.();
    }
  };

  if (!isOpen) return null;

  const allGranted = cameraStatus === 'granted' && micStatus === 'granted' && (notifStatus === 'granted' || inIframe);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {translate("Centre d'Autorisations BRAD'CI", "BRAD'CI Permissions Center")}
              </h3>
              <p className="text-xs text-slate-400">
                {translate("Gérez vos accès Caméra, Micro et Notifications", "Manage Camera, Microphone, and Notification access")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {inIframe && (
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                {translate(
                  "Note Aperçu : Pour tester le comportement 100% natif Android ou recevoir des Push réels hors-application, installez l'APK ou ouvrez en nouvel onglet.",
                  "Preview Note: For 100% native Android push notifications and hardware access, open in new tab or install APK."
                )}
              </span>
            </div>
          )}

          {/* 1. Caméra */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                cameraStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">
                    {translate("Appareil Photo", "Camera")}
                  </h4>
                  {cameraStatus === 'granted' && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                      ✓ {translate("Actif", "Active")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {translate("Photos d'articles, logo et bannière boutique", "Product photos, shop logo, and banner")}
                </p>
              </div>
            </div>
            {cameraStatus === 'granted' ? (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Autorisé</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestCamera}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                {translate("Autoriser", "Allow")}
              </button>
            )}
          </div>

          {/* 2. Microphone */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                micStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">
                    {translate("Microphone", "Microphone")}
                  </h4>
                  {micStatus === 'granted' && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                      ✓ {translate("Actif", "Active")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {translate("Notes vocales avec livreurs et support IA", "Voice notes with couriers and AI support")}
                </p>
              </div>
            </div>
            {micStatus === 'granted' ? (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Autorisé</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestMic}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                {translate("Autoriser", "Allow")}
              </button>
            )}
          </div>

          {/* 3. Notifications */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notifStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">
                    {translate("Notifications Alertes", "Alert Notifications")}
                  </h4>
                  {notifStatus === 'granted' && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                      ✓ {translate("Actif", "Active")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {translate("Enchères dépassées, courses et livreur GPS", "Outbid alerts, dispatches, and GPS tracking")}
                </p>
              </div>
            </div>
            {notifStatus === 'granted' ? (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Autorisé</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotif}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                {translate("Autoriser", "Allow")}
              </button>
            )}
          </div>

          {/* Instructions if user manually authorized on Android */}
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">
                {translate("Vous avez déjà autorisé dans les réglages Android ?", "Already authorized in Android settings?")}
              </span>
              <button
                type="button"
                onClick={checkAllStatuses}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{translate("Rafraîchir", "Refresh")}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {translate(
                "Dès que vous activez Caméra, Micro et Notifications dans Paramètres > Applications > BRAD'CI (ou Chrome), cliquez sur Rafraîchir pour valider immédiatement.",
                "Once you enable Camera, Micro, and Notifications in Android Settings > Apps > BRAD'CI (or Chrome), tap Refresh to instantly validate."
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={checkAllStatuses}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{translate("Vérifier les autorisations", "Check Permissions")}</span>
          </button>

          {!allGranted ? (
            <button
              type="button"
              onClick={handleAuthorizeAll}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{translate("Tout Autoriser en 1 Clic", "Allow All in 1 Click")}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{translate("Tout est Actif • Continuer", "All Active • Continue")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
