import { useState, useEffect, useCallback } from 'react';
import { 
  requestUniversalNotificationPermission, 
  setupAndroidNotificationChannels 
} from '../utils/universalNotifications';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

/**
 * Hook personnalisé useNotificationPermission()
 * Demande et gère l'autorisation des notifications Push dès l'ouverture de l'application BRAD'CI.
 * Rétrocompatible : Android 5.0 à Android 15/16+ et navigateurs Web/PWA.
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Déclencheur manuel ou automatique pour solliciter la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await requestUniversalNotificationPermission();
      setPermission(res.permissionState);
      return res.granted;
    } catch (e) {
      console.warn('[useNotificationPermission] Erreur lors de la demande :', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Déclenchement automatique dès l'ouverture de l'application
  useEffect(() => {
    // 1. Initialiser les canaux de notifications Android 8.0+
    setupAndroidNotificationChannels().catch((err) => {
      console.warn('[useNotificationPermission] Initialisation canal Android :', err);
    });

    // 2. Si les notifications sont supportées et pas encore accordées ou refusées (état 'default')
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const current = Notification.permission;
      setPermission(current);

      if (current === 'default') {
        // Déclencher la demande d'autorisation Push dès l'ouverture après un léger délai fluide
        const timer = setTimeout(() => {
          requestPermission();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [requestPermission]);

  return {
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    isLoading,
    requestPermission
  };
}

export default useNotificationPermission;
