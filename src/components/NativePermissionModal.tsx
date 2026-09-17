import React from 'react';
import { 
  MapPin, 
  Camera, 
  ShieldCheck, 
  Lock, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Navigation,
  Mic,
  Bell
} from 'lucide-react';
import { nativeBridge } from '../utils/nativeBridge';
import { useApp } from '../context/AppContext';
import { requestUniversalNotificationPermission } from '../utils/universalNotifications';

export interface PermissionPromptConfig {
  type: 'geolocation' | 'camera' | 'photos' | 'microphone' | 'notifications';
  title: string;
  description: string;
  reason: string;
  actionText: string;
  onGranted: () => void;
  onCancel?: () => void;
}

interface NativePermissionModalProps {
  isOpen?: boolean;
  config?: PermissionPromptConfig | null;
  onClose?: () => void;
}

export const NativePermissionModal: React.FC<NativePermissionModalProps> = ({
  isOpen: propsIsOpen,
  config: propsConfig,
  onClose: propsOnClose
}) => {
  const { addToast, translate, nativePermissionPrompt } = useApp();
  const [isRequesting, setIsRequesting] = React.useState(false);

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : nativePermissionPrompt?.isOpen;
  const config = propsConfig !== undefined ? propsConfig : nativePermissionPrompt?.config;
  const onClose = propsOnClose || nativePermissionPrompt?.closePrompt || (() => {});

  if (!isOpen || !config) return null;

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      if (config.type === 'geolocation') {
        const granted = await nativeBridge.requestLocationPermission();
        if (granted) {
          addToast(
            translate('Autorisation GPS Accordée', 'GPS Permission Granted'),
            translate('Détection précise de votre position à Abidjan activée.', 'Accurate Abidjan location tracking active.'),
            'success'
          );
        }
        config.onGranted();
        onClose();
      } else if (config.type === 'camera' || config.type === 'photos') {
        const granted = await nativeBridge.requestCameraPermission();
        if (granted) {
          addToast(
            translate('Autorisation Caméra Accordée', 'Camera Permission Granted'),
            translate('L’accès à l’appareil photo est déverrouillé.', 'Camera hardware access unlocked.'),
            'success'
          );
        }
        config.onGranted();
        onClose();
      } else if (config.type === 'microphone') {
        const granted = await nativeBridge.requestMicrophonePermission();
        if (granted) {
          addToast(
            translate('Autorisation Microphone Accordée', 'Microphone Permission Granted'),
            translate('Enregistrement vocal et assistance déverrouillés.', 'Voice recording and assistant unlocked.'),
            'success'
          );
        }
        config.onGranted();
        onClose();
      } else if (config.type === 'notifications') {
        const res = await requestUniversalNotificationPermission();
        if (res.granted || res.permissionState === 'granted') {
          addToast(
            translate('Notifications Activées', 'Notifications Enabled'),
            translate('Vous recevrez les alertes de courses et d\'enchères.', 'You will receive courier and auction alerts.'),
            'success'
          );
        }
        config.onGranted();
        onClose();
      }
    } catch (e) {
      console.warn('[NativePermissionModal] error:', e);
      config.onGranted();
      onClose();
    } finally {
      setIsRequesting(false);
    }
  };

  const isGeo = config.type === 'geolocation';
  const isMic = config.type === 'microphone';
  const isNotif = config.type === 'notifications';
  const isNative = nativeBridge.isNative();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white space-y-4">
        {/* Close Button */}
        <button
          onClick={() => {
            if (config.onCancel) config.onCancel();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isNative ? 'Android Natif' : 'Sécurité Brad\'CI'}</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Permission Requise</span>
          </div>
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5 pt-1">
          <div className={`p-3 rounded-2xl ${
            isGeo 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : isMic 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : isNotif
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {isGeo ? (
              <Navigation className="w-6 h-6 animate-pulse" />
            ) : isMic ? (
              <Mic className="w-6 h-6" />
            ) : isNotif ? (
              <Bell className="w-6 h-6" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-display">
              {config.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        {/* Reason Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{config.reason}</span>
          </div>
          <div className="flex items-start gap-2 text-slate-400 text-[11px]">
            <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>
              {isNative
                ? "Une boîte de dialogue Android s'affichera pour valider l'accès de l'application."
                : "Autorisez l'accès dans votre navigateur pour profiter pleinement des fonctionnalités."}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleRequest}
            disabled={isRequesting}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isGeo
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/40'
                : isMic
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/40'
                : isNotif
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-900/40'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-900/40'
            }`}
          >
            {isRequesting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isGeo ? (
              <MapPin className="w-4 h-4" />
            ) : isMic ? (
              <Mic className="w-4 h-4" />
            ) : isNotif ? (
              <Bell className="w-4 h-4" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <span>{config.actionText}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (config.onCancel) config.onCancel();
              onClose();
            }}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors"
          >
            {translate('Ignorer', 'Skip')}
          </button>
        </div>
      </div>
    </div>
  );
};
