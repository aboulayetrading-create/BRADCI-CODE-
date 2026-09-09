import React from 'react';
import { Logo, LogoIcon, LogoProps, BradCiLogoImg } from './Logo';

export { Logo, LogoIcon, BradCiLogoImg };
export type { LogoProps };

export interface BradCiLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'horizontal' | 'icon' | 'badge';
  showSubtitle?: boolean;
  subtitleText?: string;
  onClick?: () => void;
  id?: string;
}

export const BradCiLogoIcon = LogoIcon;

export const BradCiLogo: React.FC<BradCiLogoProps> = (props) => {
  return <Logo {...props} />;
};

export default BradCiLogo;
