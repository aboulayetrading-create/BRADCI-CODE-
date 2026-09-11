import React, { useEffect } from 'react';
import { voiceNavigator } from '../utils/voiceNavigator';

export type PermissionState = 'pending' | 'checking' | 'granted' | 'denied';

interface PermissionsGuardProps {
  children: React.ReactNode;
}

/**
 * PermissionsGuard - Non-bloquant
 * Permet l'accès immédiat et direct à l'application BRAD'CI sans écran de blocage.
 */
export const PermissionsGuard: React.FC<PermissionsGuardProps> = ({ children }) => {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('bradci_permissions_accepted', 'true');
        localStorage.setItem('bradci_permissions_ok', 'true');
      }
      voiceNavigator.unlockAudio();
    } catch (_) {}
  }, []);

  return <>{children}</>;
};

export default PermissionsGuard;
