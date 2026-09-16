import React, { useEffect, useState, useCallback } from 'react';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Smartphone, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  RefreshCw, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  requestUniversalNotificationPermission, 
  setupAndroidNotificationChannels,
  isRunningInIframe,
  isPlatformIOS,
  isPlatformAndroid,
  sendUniversalPush,
  sendTestNotification
} from '../utils/universalNotifications';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

/**
 * Hook personnalisé pour surveiller et gérer l'autorisation des notifications
 * Compatible Android Chrome, PWA, Safari iOS et applications hybrides (Capacitor/Cordova)
 */
export function useNotificationManager() {
  const { addToast, translate, pushBrowserNotification } = useApp();
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('bradci_browser_notifications') === 'true') {
        return 'granted';
      }
      if ('Notification' in window) {
        return Notification.permission;
      }
    }
    return 'default';
  });
  
  const [pushToken, setPushToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bradci_push_token');
    }
    return null;
  });

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const dismissedAt = sessionStorage.getItem('bradci_notif_banner_dismissed');
      return dismissedAt === 'true';
    }
    return false;
  });

  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Enregistrement sécurisé du token push
  const registerPushToken = useCallback(async () => {
    try {
      let token = localStorage.getItem('bradci_push_token');
      if (!token) {
        token = 'bradci_android_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('bradci_push_token', token);
      }
      localStorage.setItem('bradci_push_registered', 'true');
      localStorage.setItem('bradci_browser_notifications', 'true');
      setPushToken(token);

      // Si le Service Worker est actif, souscrire si possible
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && 'pushManager' in reg) {
            console.log("Service Worker prêt pour les notifications push BRAD'CI.");
          }
        } catch (swErr) {
          console.warn('SW push registration fallback:', swErr);
        }
      }
      return token;
    } catch (e) {
      console.warn('Erreur enregistrement push token:', e);
      return null;
    }
  }, []);

  // Déclencher la demande d'autorisation universelle (Android 13+, Android 8-12, Android 5-7 & Web)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await requestUniversalNotificationPermission();
      setPermission(result.permissionState as NotificationPermissionState);

      if (result.granted) {
        const token = await registerPushToken();
        setIsBannerDismissed(true);
        sessionStorage.removeItem('bradci_notif_banner_dismissed');
        
        addToast(
          translate("Notifications Activées !", "Notifications Enabled!"),
          translate("Vous recevrez désormais les alertes d'enchères et le suivi des livreurs.", "You will now receive auction outbid alerts and courier tracking."),
          'success'
        );

        // Envoyer une notification d'accueil visible et sonore
        try {
          await sendTestNotification(
            "BRAD'CI : Notifications Activées ⚡",
            "Parfait ! Vous recevrez désormais les alertes d'enchères et le suivi des livreurs."
          );
        } catch {
          // Fallback silencieux
        }
        return true;
      } else if (result.permissionState === 'denied') {
        setIsBannerDismissed(false);
        sessionStorage.removeItem('bradci_notif_banner_dismissed');
        return false;
      }
      return false;
    } catch (err) {
      console.error('Erreur requestPermission:', err);
      return false;
    }
  }, [addToast, translate, pushBrowserNotification, registerPushToken]);

  // Actualiser l'état de la permission (notamment quand l'utilisateur revient des paramètres Android)
  const refreshPermissionState = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('bradci_browser_notifications') === 'true') {
        setPermission('granted');
        return;
      }
      if ('Notification' in window) {
        const current = Notification.permission;
        setPermission(prev => {
          if (prev !== current) {
            if (current === 'granted') {
              registerPushToken();
              setIsBannerDismissed(true);
              addToast(
                translate("Notifications Réactivées", "Notifications Reactivated"),
                translate("Merci ! Vos alertes d'enchères sont désormais actives.", "Thank you! Your auction alerts are now active."),
                'success'
              );
            }
            return current;
          }
          return prev;
        });
      }
    }
  }, [registerPushToken, addToast, translate]);

  // Vérification et initialisation automatique au chargement (Android 13+, Android 8-12, Android 5-7 & Web)
  useEffect(() => {
    // 1. Configuration des canaux Android 8.0+ (API 26-32)
    setupAndroidNotificationChannels().catch(e => {
      console.warn('Canal Android notification init fallback:', e);
    });

    if (typeof window === 'undefined' || !('Notification' in window)) {
      if (typeof window !== 'undefined' && localStorage.getItem('bradci_browser_notifications') === 'true') {
        setPermission('granted');
        registerPushToken();
      } else {
        setPermission('default');
      }
      return;
    }

    const currentPerm = Notification.permission;
    setPermission(currentPerm);

    // 2. Si la permission est 'default', solliciter l'autorisation dynamique au premier chargement (Android 13+ / API 33+)
    if (currentPerm === 'default') {
      const timer = setTimeout(() => {
        requestPermission().catch(() => {});
      }, 1200);
      return () => clearTimeout(timer);
    } 
    // 3. Si déjà accordée, s'assurer que le token push est synchronisé
    else if (currentPerm === 'granted') {
      registerPushToken();
    }
  }, [requestPermission, registerPushToken]);

  // Réécouter quand l'utilisateur revient sur l'application après avoir modifié les paramètres de son téléphone
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      refreshPermissionState();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [refreshPermissionState]);

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    sessionStorage.setItem('bradci_notif_banner_dismissed', 'true');
  };

  return {
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    pushToken,
    requestPermission,
    refreshPermissionState,
    isBannerDismissed,
    dismissBanner,
    showHelpModal,
    setShowHelpModal
  };
}

/**
 * Composant Global : Bannière discrète d'alerte sur Android/Web + Modale explicative pas-à-pas
 */
export const NotificationManager: React.FC = () => {
  const {
    isGranted,
    isBannerDismissed,
    requestPermission,
    refreshPermissionState,
    showHelpModal,
    setShowHelpModal
  } = useNotificationManager();

  return (
    <>
      {/* Bannière d'alerte notifications en direct format officiel BRAD'CI */}
      {!isGranted && !isBannerDismissed && (
        <div className="bg-blue-50/80 dark:bg-[#0B1736] border-b border-blue-200 dark:border-[#1E3E85] px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 min-w-0">
            <Bell className="w-4 h-4 text-[#1E53E5] shrink-0" />
            <span className="leading-tight text-slate-800 dark:text-slate-200 text-xs truncate sm:whitespace-normal font-semibold">
              Recevez les alertes en direct pour vos enchères et livraisons.
            </span>
          </div>
          <button
            type="button"
            onClick={() => requestPermission()}
            className="px-3 py-1.5 bg-[#1E53E5] hover:bg-[#1844C4] active:scale-95 text-white font-bold rounded-lg text-xs shrink-0 transition-all shadow-md shadow-blue-500/25 cursor-pointer whitespace-nowrap"
          >
            Activer les alertes
          </button>
        </div>
      )}

      {/* Modale Explicative "Comment Activer les Notifications sur Android & Mobile" (ouverte uniquement sur demande explicite) */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div 
            id="modal-how-to-enable-notifications" 
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 relative space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    Comment débloquer les notifications ?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Guide rapide pour Android (Chrome, Samsung Internet, APK)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Étapes détaillées */}
            <div className="space-y-3 text-xs sm:text-sm">
              {/* Option A : Depuis le navigateur Chrome sur Android */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                  <span>Option A : Directement dans Chrome sur votre téléphone</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 pl-7 list-disc">
                  <li>Touchez l'icône de <strong>cadenas 🔒</strong> ou <strong>réglages</strong> à gauche de l'adresse web <em>(ou les 3 points verticaux ⋮ en haut à droite)</em>.</li>
                  <li>Touchez <strong>« Autorisations »</strong> ou <strong>« Paramètres du site »</strong>.</li>
                  <li>Touchez <strong>« Notifications »</strong> et choisissez <strong>« Autoriser »</strong>.</li>
                </ul>
              </div>

              {/* Option B : Depuis les Paramètres de votre Smartphone Android */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-400">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                  <span>Option B : Paramètres Android du téléphone (APK)</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs font-mono text-blue-200">
                  Paramètres &gt; Applications &gt; BRAD'CI &gt; Notifications
                </div>
                <ul className="space-y-1.5 text-slate-300 pl-7 list-disc">
                  <li>Ouvrez l'application <strong>Paramètres</strong> de votre smartphone.</li>
                  <li>Allez dans <strong>Applications</strong> &gt; sélectionnez <strong>BRAD'CI</strong> (ou <strong>Chrome</strong> si vous utilisez le navigateur).</li>
                  <li>Appuyez sur <strong>Notifications</strong> et activez l'interrupteur <strong>« Autoriser les notifications »</strong>.</li>
                </ul>
              </div>

              {/* Option C : Sur iPhone (iOS 16.4+ / Safari PWA) */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center">3</span>
                  <span>Option C : Sur iPhone (iOS 16.4+)</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 pl-7 list-disc">
                  <li>Sur Safari, appuyez sur le bouton <strong>Partager</strong> (icône avec flèche vers le haut).</li>
                  <li>Choisissez <strong>« Sur l'écran d'accueil »</strong> pour installer BRAD'CI en tant qu'application native.</li>
                  <li>Lancez l'application depuis votre écran d'accueil et acceptez l'invitation de notifications.</li>
                </ul>
              </div>

              {/* Pourquoi c'est important */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Pourquoi activer ?</strong> Vous serez immédiatement averti(e) quand quelqu'un surenchérit sur vos lots à la dernière minute, et vous suivrez l'arrivée exacte de votre coursier sur la carte GPS.
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <button
                id="btn-verify-permission-now"
                type="button"
                onClick={() => {
                  refreshPermissionState();
                  setShowHelpModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>J'ai activé / Vérifier maintenant</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
