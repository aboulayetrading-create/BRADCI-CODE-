import React from 'react';
import { PermissionsGuard as PermissionsGuardTS } from './PermissionsGuard.tsx';
import { BRADCI_OFFICIAL_LOGO_DATA_URI } from '../utils/logoAssetData';

/**
 * Logo local autonome pour affichage hors-ligne Android APK
 */
export const BradCiLogoImage = ({ className = "object-contain", alt = "BRAD'CI", style }) => (
  <img 
    src={BRADCI_OFFICIAL_LOGO_DATA_URI || "/icon.png"} 
    alt={alt} 
    style={style || { width: '80px', height: '80px', borderRadius: '16px' }}
    className={className}
    onError={(e) => { 
      if (e.target.src !== BRADCI_OFFICIAL_LOGO_DATA_URI && BRADCI_OFFICIAL_LOGO_DATA_URI) {
        e.target.src = BRADCI_OFFICIAL_LOGO_DATA_URI;
      } else {
        e.target.src = '/icon.png';
      }
    }} 
  />
);

export const PermissionsGuard = PermissionsGuardTS;
export default PermissionsGuard;
