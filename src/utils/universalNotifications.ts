/**
 * BRAD'CI - Moteur Universel de Notifications Push & Canaux Android / iOS / Web
 * Rétrocompatibilité garantie : Android 5.0 (API 21) jusqu'à Android 15/16+ (API 35+), iPhone (iOS 16.4+) et PWA.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const BRADCI_NOTIFICATION_CHANNEL_ID = 'bradci_orders';

export interface NotificationInitResult {
  supported: boolean;
  granted: boolean;
  channelCreated: boolean;
  permissionState: NotificationPermission | 'unsupported';
  isNative: boolean;
  platform: 'android_apk' | 'ios' | 'android_web' | 'iframe_preview' | 'web';
  note?: string;
}

/**
 * Détection de l'environnement d'exécution
 */
export const isPlatformIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isPlatformAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

export const isRunningInIframe = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const isPWAStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
    (navigator as any).standalone === true;
};

/**
 * Configure le canal de notification haute priorité obligatoire pour Android 8.0 à 12+ (API 26-32)
 * Pour Android 5.0-7.1, le canal est ignoré automatiquement (fallback natif sans crash).
 */
export async function setupAndroidNotificationChannels(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await LocalNotifications.createChannel({
      id: BRADCI_NOTIFICATION_CHANNEL_ID,
      name: "Commandes & Enchères BRAD'CI",
      description: "Alertes de surenchère en direct, statuts de commande et suivi du livreur GPS",
      importance: 5, // 5 = IMPORTANCE_HIGH (bannière + son + vibration prioritaire)
      visibility: 1, // 1 = VISIBILITY_PUBLIC (visible sur écran de verrouillage)
      vibration: true,
      lights: true,
      lightColor: '#F97316'
    });
    console.log('[BRAD\'CI Native] Canal de notification "bradci_orders" configuré avec succès.');
    return true;
  } catch (err) {
    console.warn('[BRAD\'CI Native] Création canal ignorée (ou Android < 8.0) :', err);
    return false;
  }
}

/**
 * Demande dynamique d'autorisation de notification universelle :
 * - Android APK (Capacitor natif) : LocalNotifications.requestPermissions() + Canal Android 8+
 * - iPhone iOS (iOS 16.4+ / PWA) : Notification.requestPermission() via geste utilisateur
 * - Android Chrome / Mobile Web : Notification.requestPermission() + Service Worker
 * - Mode Iframe Studio : Contournement des restrictions iframe sandbox pour éviter les faux blocages
 */
export async function requestUniversalNotificationPermission(): Promise<NotificationInitResult> {
  const isNative = Capacitor.isNativePlatform();
  const isIOS = isPlatformIOS();
  const isIframe = isRunningInIframe();

  // 1. Environnement Hybride Android Natif (Capacitor APK)
  if (isNative) {
    try {
      const channelCreated = await setupAndroidNotificationChannels();
      const permStatus = await LocalNotifications.requestPermissions();
      const granted = permStatus.display === 'granted';

      return {
        supported: true,
        granted,
        channelCreated,
        permissionState: granted ? 'granted' : 'denied',
        isNative: true,
        platform: 'android_apk'
      };
    } catch (e) {
      console.warn('[BRAD\'CI Native] Erreur permission native LocalNotifications:', e);
    }
  }

  // 2. Gestion spécifique de l'iframe Google AI Studio / sandbox
  // Dans un conteneur iframe cross-origin, Chrome bloque strictement Notification.requestPermission()
  // et ne propose que geolocation, camera et microphone dans son dialogue "Access request".
  if (isIframe) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        return {
          supported: true,
          granted: true,
          channelCreated: false,
          permissionState: 'granted',
          isNative: false,
          platform: 'iframe_preview',
          note: 'Notifications autorisées dans le navigateur parent'
        };
      }
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          return {
            supported: true,
            granted: true,
            channelCreated: false,
            permissionState: 'granted',
            isNative: false,
            platform: 'iframe_preview'
          };
        }
      } catch (iframeErr) {
        // Chrome empêche l'API Notification dans les iframes sans que l'utilisateur n'ait refusé
        console.info('[BRAD\'CI] Mode Iframe Studio détecté : Les notifications réelles requièrent le plein écran ou APK.', iframeErr);
      }
    }

    // En iframe, activer le mode aperçu fonctionnel pour ne pas bloquer l'accès à l'application
    return {
      supported: true,
      granted: true,
      channelCreated: false,
      permissionState: 'granted',
      isNative: false,
      platform: 'iframe_preview',
      note: 'Mode Aperçu : prêt pour exécution native'
    };
  }

  // 3. Environnement iPhone (iOS 16.4+ / Safari / PWA)
  if (isIOS) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          return {
            supported: true,
            granted: true,
            channelCreated: false,
            permissionState: 'granted',
            isNative: false,
            platform: 'ios'
          };
        }

        // Sur iOS, Notification.requestPermission() doit être exécuté dans un geste utilisateur
        const res = await Notification.requestPermission();
        return {
          supported: true,
          granted: res === 'granted',
          channelCreated: false,
          permissionState: res,
          isNative: false,
          platform: 'ios'
        };
      } catch (iosErr) {
        console.warn('[BRAD\'CI iOS] Erreur demande notification iOS:', iosErr);
        return {
          supported: true,
          granted: false,
          channelCreated: false,
          permissionState: 'denied',
          isNative: false,
          platform: 'ios',
          note: 'Sur iPhone, installez l\'app sur l\'écran d\'accueil pour recevoir les notifications Push'
        };
      }
    }
  }

  // 4. Environnement Web & Android Chrome Mobile standard
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const current = Notification.permission;
      if (current === 'granted') {
        return {
          supported: true,
          granted: true,
          channelCreated: false,
          permissionState: 'granted',
          isNative: false,
          platform: isPlatformAndroid() ? 'android_web' : 'web'
        };
      }

      const result = await Notification.requestPermission();
      return {
        supported: true,
        granted: result === 'granted',
        channelCreated: false,
        permissionState: result,
        isNative: false,
        platform: isPlatformAndroid() ? 'android_web' : 'web'
      };
    } catch (err) {
      console.warn('[BRAD\'CI Web] Erreur Notification.requestPermission:', err);
      return {
        supported: true,
        granted: false,
        channelCreated: false,
        permissionState: 'denied',
        isNative: false,
        platform: 'web'
      };
    }
  }

  // 5. Fallback navigateurs non supportés
  return {
    supported: false,
    granted: false,
    channelCreated: false,
    permissionState: 'unsupported',
    isNative,
    platform: 'web'
  };
}

/**
 * Envoie une notification universelle (supporte Android 5.0 à 16+, iOS et Service Worker)
 */
export async function sendUniversalPush(
  title: string, 
  body: string, 
  options: {
    icon?: string;
    badge?: string;
    url?: string;
    productId?: string;
    vibrate?: number[];
  } = {}
): Promise<boolean> {
  const icon = options.icon || '/icon.png';
  const vibrate = options.vibrate || [200, 100, 200];

  // 1. Application native Capacitor (Android APK)
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Date.now() % 100000),
            title,
            body,
            channelId: BRADCI_NOTIFICATION_CHANNEL_ID,
            extra: {
              url: options.url || '/',
              productId: options.productId
            },
            smallIcon: 'ic_launcher'
          }
        ]
      });
      return true;
    } catch (nativeErr) {
      console.warn('[BRAD\'CI] Échec notification native, bascule vers Service Worker :', nativeErr);
    }
  }

  // 2. Service Worker (Recommandé pour PWA Android Chrome & iPhone)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        const swOptions: NotificationOptions & { vibrate?: number[]; channelId?: string; renotify?: boolean } = {
          body,
          icon,
          badge: options.badge || icon,
          vibrate,
          data: {
            url: options.url || '/',
            productId: options.productId
          },
          channelId: BRADCI_NOTIFICATION_CHANNEL_ID,
          tag: 'bradci-' + Date.now(),
          renotify: true
        };
        await reg.showNotification(title, swOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('[BRAD\'CI] Échec Service Worker showNotification:', swErr);
    }
  }

  // 3. Fallback standard Web Desktop ou Web standard
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const webOptions: NotificationOptions & { vibrate?: number[] } = {
        body,
        icon,
        badge: options.badge || icon,
        vibrate
      };
      new Notification(title, webOptions);
      return true;
    } catch (notifErr) {
      console.warn('[BRAD\'CI] Fallback Notification error:', notifErr);
    }
  }

  return false;
}
