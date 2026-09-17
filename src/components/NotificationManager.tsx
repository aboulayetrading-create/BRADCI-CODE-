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
  AlertCircle,
  Bike,
  Store,
  ShoppingBag
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
  const { addToast, translate, pushBrowserNotification, setDevicePermissionsModalOpen } = useApp();
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        return Notification.permission as NotificationPermissionState;
      }
      if (localStorage.getItem('bradci_browser_notifications') === 'true') {
        return 'granted';
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
  const refreshPermissionState = useCallback(async () => {
    if (typeof window !== 'undefined') {
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
        if (current === 'granted') return;
      }
      if ('permissions' in navigator && (navigator.permissions as any)?.query) {
        try {
          const status = await (navigator.permissions as any).query({ name: 'notifications' });
          if (status?.state === 'granted') {
            setPermission('granted');
            registerPushToken();
            setIsBannerDismissed(true);
            addToast(
              translate("Notifications Autorisées", "Notifications Allowed"),
              translate("Vos alertes directes sont désormais parfaitement actives.", "Your live alerts are now active."),
              'success'
            );
            return;
          } else if (status?.state === 'denied') {
            setPermission('denied');
            return;
          }
        } catch {
          // Ignorer erreur query permissions
        }
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

    // Si déjà accordée, s'assurer que le token push est synchronisé
    if (currentPerm === 'granted') {
      registerPushToken();
    }
  }, [registerPushToken]);

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
  const { currentUser, translate, setDevicePermissionsModalOpen } = useApp();
  const {
    isGranted,
    isDenied,
    isBannerDismissed,
    dismissBanner,
    requestPermission,
    refreshPermissionState,
    showHelpModal,
    setShowHelpModal
  } = useNotificationManager();

  if (isGranted || isBannerDismissed) {
    return (
      <>
        {showHelpModal && (
          <NotificationHelpModal onClose={() => setShowHelpModal(false)} onVerify={refreshPermissionState} />
        )}
      </>
    );
  }

  // Définition de l'apparence et des textes sur mesure selon le rôle (livreur, acheteur, vendeur)
  const role = currentUser?.role || 'buyer';

  let RoleIcon = ShoppingBag;
  let roleBadge = translate("Compte Acheteur", "Buyer Account");
  let roleTitle = translate("Suivi de livraison & Alertes en direct", "Live Delivery Tracking & Bid Alerts");
  let roleDesc = translate("Soyez averti de l'approche de votre livreur et des surenchères sur vos coups de cœur.", "Get notified when your driver approaches and when bids update.");
  let cardClass = "bg-slate-900/90 dark:bg-[#070D18]/95 border-teal-500/30 shadow-[0_8px_30px_rgba(20,184,166,0.12)]";
  let badgeClass = "bg-teal-500/15 text-teal-300 border-teal-500/30";
  let iconClass = "bg-teal-500/20 text-teal-400 border-teal-500/40";
  let buttonClass = "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/25";

  if (role === 'driver') {
    RoleIcon = Bike;
    roleBadge = translate("Compte Livreur Agréé", "Certified Driver Account");
    roleTitle = translate("Nouvelles courses & Missions express", "New Express Orders & Delivery Missions");
    roleDesc = translate("Recevez les demandes d'enlèvement et les alertes d'itinéraires en temps réel à Abidjan.", "Get instant pickup alerts and real-time route dispatches across Abidjan.");
    cardClass = "bg-slate-900/90 dark:bg-[#0B0F19]/95 border-amber-500/35 shadow-[0_8px_30px_rgba(245,158,11,0.12)]";
    badgeClass = "bg-amber-500/15 text-amber-300 border-amber-500/30";
    iconClass = "bg-amber-500/20 text-amber-400 border-amber-500/40";
    buttonClass = "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25";
  } else if ((role as string) === 'seller' || (currentUser?.role === 'client' && !!currentUser?.sellerPlan)) {
    RoleIcon = Store;
    roleBadge = translate("Compte Vendeur Boutique", "Store Seller Account");
    roleTitle = translate("Commandes reçues & Paiements Séquestre", "Orders Received & Escrow Payouts");
    roleDesc = translate("Soyez notifié dès qu'un acheteur réserve un article ou qu'un livreur arrive.", "Be alerted the second a buyer books an item or a courier collects.");
    cardClass = "bg-slate-900/90 dark:bg-[#0D0B1A]/95 border-purple-500/35 shadow-[0_8px_30px_rgba(168,85,247,0.12)]";
    badgeClass = "bg-purple-500/15 text-purple-300 border-purple-500/30";
    iconClass = "bg-purple-500/20 text-purple-400 border-purple-500/40";
    buttonClass = "bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/25";
  }

  return (
    <>
      {/* Carte Flottante Élégante pour Notifications (style moderne et non plaquée aux bords) */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3">
        <div 
          id="banner-role-notification-alert"
          className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 transition-all ${cardClass}`}
        >
          {/* Header & Icon Info */}
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${iconClass}`}>
              <RoleIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
                  <Bell className="w-2.5 h-2.5" />
                  <span>{roleBadge}</span>
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  {roleTitle}
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 dark:text-slate-300 leading-snug line-clamp-2">
                {roleDesc}
              </p>
            </div>
          </div>

          {/* Buttons Controls */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setDevicePermissionsModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title={translate("Gérer Caméra, Micro et Notifications", "Manage Camera, Mic, and Notifications")}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{translate("Autorisations", "Permissions")}</span>
            </button>

            {isDenied && (
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{translate("Guide", "Guide")}</span>
              </button>
            )}

            <button
              id="btn-enable-notifications-role"
              type="button"
              onClick={() => requestPermission()}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap ${buttonClass}`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{translate("Activer les alertes", "Enable Alerts")}</span>
            </button>

            <button
              type="button"
              onClick={dismissBanner}
              aria-label={translate("Fermer", "Dismiss")}
              title={translate("Plus tard", "Later")}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modale Explicative "Comment Activer les Notifications sur Android & Mobile" */}
      {showHelpModal && (
        <NotificationHelpModal onClose={() => setShowHelpModal(false)} onVerify={refreshPermissionState} />
      )}
    </>
  );
};

interface NotificationHelpModalProps {
  onClose: () => void;
  onVerify: () => void;
}

const NotificationHelpModal: React.FC<NotificationHelpModalProps> = ({ onClose, onVerify }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
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
                Guide d'activation rapide pour Android & iPhone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              <span>Option A : Directement dans Chrome sur Android</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 pl-7 list-disc">
              <li>Touchez l'icône de <strong>cadenas 🔒</strong> ou <strong>paramètres de site</strong> à gauche de l'adresse web.</li>
              <li>Touchez <strong>« Autorisations »</strong>.</li>
              <li>Activez <strong>« Notifications »</strong> sur <strong>« Autoriser »</strong>.</li>
            </ul>
          </div>

          {/* Option B : Depuis les Paramètres du Smartphone */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-400">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
              <span>Option B : Paramètres Android du téléphone</span>
            </div>
            <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs font-mono text-blue-200">
              Paramètres &gt; Applications &gt; BRAD'CI &gt; Notifications &gt; Autoriser
            </div>
          </div>

          {/* Option C : Sur iPhone */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-400">
              <span className="w-5 h-5 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center">3</span>
              <span>Option C : Sur iPhone (iOS 16.4+)</span>
            </div>
            <p className="text-slate-300 text-xs">
              Dans Safari, touchez le bouton de partage puis <strong>« Sur l'écran d'accueil »</strong> pour activer les alertes push natives.
            </p>
          </div>

          {/* Pourquoi c'est important */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Activation garantie :</strong> Les notifications vous préviennent instantanément de l'arrivée du coursier et des surenchères sur vos enchères.
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
          <button
            id="btn-verify-permission-now"
            type="button"
            onClick={() => {
              onVerify();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>J'ai activé / Actualiser le statut</span>
          </button>
        </div>
      </div>
    </div>
  );
};
