import React from 'react';
import { PermissionsGuard as PermissionsGuardTS } from './PermissionsGuard.tsx';

/**
 * Logo local autonome pour affichage hors-ligne Android APK
 */
export const BradCiLogoImage = ({ className = "object-contain", alt = "BRAD'CI", style }) => (
  <img 
    src="./icon.png" 
    alt={alt} 
    style={style || { width: '80px', height: '80px', borderRadius: '16px' }}
    className={className}
    onError={(e) => { e.target.src = 'icon.png'; }} 
  />
);

export const PermissionsGuard = PermissionsGuardTS;
export default PermissionsGuard;
