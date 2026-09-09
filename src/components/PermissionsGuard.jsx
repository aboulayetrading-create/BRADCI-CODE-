import React from 'react';
import { PermissionsGuard as PermissionsGuardTS } from './PermissionsGuard.tsx';

/**
 * Logo local autonome pour affichage hors-ligne Android APK
 */
export const BradCiLogoImage = ({ className = "w-full h-full object-contain", alt = "BRAD'CI Logo" }) => (
  <img 
    src="./icon.png" 
    alt={alt} 
    className={className}
    onError={(e) => { e.target.src = 'icon.png'; }} 
  />
);

export const PermissionsGuard = PermissionsGuardTS;
export default PermissionsGuard;
