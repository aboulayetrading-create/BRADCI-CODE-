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

export type NotificationPermissionState = NotificationPermission | 'unsupported';

/**
 * Hook personnalisé pour surveiller et gérer l'autorisation des notifications
 * Compatible Android Chrome, PWA, Safari iOS et applications hybrides (Capacitor/Cordova)
 */
export function useNotificationManager() {
  const { addToast, translate, pushBrowserNotification } = useApp();
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
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

  // Déclencher la demande d'autorisation
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const token = await registerPushToken();
        setIsBannerDismissed(true);
        sessionStorage.removeItem('bradci_notif_banner_dismissed');
        
        addToast(
          translate("Notifications Activées !", "Notifications Enabled!"),
          translate("Vous recevrez désormais les alertes d'enchères et le suivi des livreurs.", "You will now receive auction outbid alerts and courier tracking."),
          'success'
        );

        // Envoyer une notification d'accueil
        try {
          await pushBrowserNotification(
            "BRAD'CI : Notifications Activées ⚡",
            "Parfait ! Vous serez alerté en temps réel dès qu'un utilisateur surenchérit ou qu'un livreur arrive."
          );
        } catch {
          // Fallback silencieux
        }
        return true;
      } else if (result === 'denied') {
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
    if (typeof window !== 'undefined' && 'Notification' in window) {
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
  }, [registerPushToken, addToast, translate]);

  // Vérification automatique au chargement
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    const currentPerm = Notification.permission;
    setPermission(currentPerm);

    // 1. Si la permission est 'default', solliciter l'autorisation au premier chargement
    if (currentPerm === 'default') {
      // Petite temporisation pour que l'interface et le DOM soient prêts
      const timer = setTimeout(() => {
        requestPermission().catch(() => {});
      }, 1200);
      return () => clearTimeout(timer);
    } 
    // 2. Si déjà accordée, s'assurer que le token push est synchronisé
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
    permission,
    isDenied,
    isDefault,
    requestPermission,
    refreshPermissionState,
    isBannerDismissed,
    dismissBanner,
    showHelpModal,
    setShowHelpModal
  } = useNotificationManager();

  // Ne rien afficher si autorisé ou si l'utilisateur a masqué la bannière pendant sa session
  const shouldShowBanner = isDenied && !isBannerDismissed;

  return (
    <>
      {/* 1. Bannière d'alerte amicale et discrète en haut de l'écran */}
      {shouldShowBanner && (
        <aside 
          aria-label="Alerte autorisation notifications"
          id="banner-notification-blocked" 
          className="w-full bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-amber-950/90 border-b border-amber-500/40 text-amber-100 shadow-lg px-3 py-2 sm:px-4 sm:py-2.5 transition-all animate-fadeIn relative z-40"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                <BellOff className="w-4 h-4 animate-pulse" />
              </div>
              <div className="leading-snug">
                <span className="font-bold text-amber-300">Notifications désactivées sur votre appareil : </span>
                <span className="text-slate-200">
                  Activez les notifications dans les paramètres de votre téléphone pour recevoir les alertes d'enchères et le suivi des livreurs.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                id="btn-how-to-enable-notifications"
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Comment activer ?</span>
              </button>

              <button
                id="btn-refresh-permission"
                type="button"
                onClick={refreshPermissionState}
                title="Vérifier si vous avez activé les notifications"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                id="btn-dismiss-notification-banner"
                type="button"
                onClick={dismissBanner}
                aria-label="Fermer la bannière temporairement"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Cas où la permission est toujours en 'default' (par exemple sur mobile après un premier échec silencieux) */}
      {isDefault && (
        <div className="w-full bg-slate-900/90 border-b border-blue-500/30 text-slate-200 px-3 py-1.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
              <span>Recevez les alertes en direct pour vos enchères et livraisons.</span>
            </div>
            <button
              id="btn-prompt-notification-default"
              type="button"
              onClick={() => requestPermission()}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shrink-0 transition-transform active:scale-95 cursor-pointer"
            >
              Activer les alertes
            </button>
          </div>
        </div>
      )}

      {/* 3. Modale Explicative "Comment Activer les Notifications sur Android & Mobile" */}
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
                  <span>Option B : Paramètres Android du téléphone</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 pl-7 list-disc">
                  <li>Ouvrez l'application <strong>Paramètres</strong> de votre smartphone.</li>
                  <li>Allez dans <strong>Applications</strong> &gt; sélectionnez <strong>Chrome</strong> (ou l'application <strong>BRAD'CI</strong>).</li>
                  <li>Appuyez sur <strong>Notifications</strong> et activez l'interrupteur <strong>« Autoriser les notifications »</strong>.</li>
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
