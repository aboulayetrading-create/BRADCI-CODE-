import React from 'react';
import { BRADCI_OFFICIAL_LOGO_DATA_URI } from '../utils/logoAssetData';

export interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  variant?: 'full' | 'horizontal' | 'icon' | 'badge';
  showSubtitle?: boolean;
  subtitleText?: string;
  showIcon?: boolean;
  onClick?: () => void;
  id?: string;
}

/**
 * Pure Vector SVG Emblem of BRAD'CI
 * Reproduces exactly:
 * - 4 Horizontal Speed Lines on the left (Orange #f97316 and Electric Sky Blue #38bdf8)
 * - Royal Blue Security Shield with 3D faceted gradient & glowing cyan border
 * - Delivery Truck with White Cargo Box & Dynamic Orange Cabin (#f97316)
 * - Royal Blue Padlock on Cargo Box
 * - Emerald Green (#10b981) Verified Checkmark Badge
 * - 100% autonomous vector SVG, 0 external image dependencies
 */
export const LogoIcon: React.FC<{ 
  className?: string; 
  size?: number | string;
  id?: string;
  preferImage?: boolean;
}> = ({ 
  className = "w-10 h-10", 
  size,
  id,
  preferImage = false
}) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  // Unique SVG filter & gradient IDs to avoid any DOM collision
  const uid = React.useId().replace(/:/g, '_');
  const shieldGradLeft = `shield_grad_left_${uid}`;
  const shieldGradRight = `shield_grad_right_${uid}`;
  const shieldStrokeGrad = `shield_stroke_grad_${uid}`;
  const orangeSpeedGrad = `orange_speed_grad_${uid}`;
  const blueSpeedGrad = `blue_speed_grad_${uid}`;
  const dropShadow = `shield_glow_${uid}`;
  const badgeGlow = `badge_glow_${uid}`;

  if (preferImage && !imgFailed) {
    return (
      <img 
        id={id}
        src={BRADCI_OFFICIAL_LOGO_DATA_URI || "/logo.png?v=14"} 
        alt="BRAD'CI Logo" 
        className={`select-none shrink-0 object-contain rounded-xl ${className}`}
        style={size ? { width: size, height: size } : undefined}
        onError={(e) => { 
          const target = e.currentTarget as HTMLImageElement;
          const currentSrc = target.getAttribute('src');
          if (currentSrc !== BRADCI_OFFICIAL_LOGO_DATA_URI) {
            target.src = BRADCI_OFFICIAL_LOGO_DATA_URI;
          } else {
            setImgFailed(true);
          }
        }} 
      />
    );
  }

  return (
    <svg 
      id={id}
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      aria-label="BRAD'CI Shield Emblem"
      role="img"
    >
      <defs>
        {/* Shield Facet Gradients */}
        <linearGradient id={shieldGradLeft} x1="62" y1="24" x2="110" y2="168" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        <linearGradient id={shieldGradRight} x1="110" y1="24" x2="158" y2="168" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="50%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Shield Outer Border Neon Gradient */}
        <linearGradient id={shieldStrokeGrad} x1="62" y1="24" x2="158" y2="168" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="40%" stopColor="#38BDF8" />
          <stop offset="80%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Speed Lines Gradients */}
        <linearGradient id={orangeSpeedGrad} x1="10" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#F97316" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>

        <linearGradient id={blueSpeedGrad} x1="10" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Soft Shield Glow Filter */}
        <filter id={dropShadow} x="0" y="0" width="220" height="220" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1D4ED8" floodOpacity="0.45" />
        </filter>

        {/* Green Badge Glow */}
        <filter id={badgeGlow} x="120" y="45" width="45" height="45" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10B981" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* ================= 1. SPEED LINES (LEFT OF SHIELD) ================= */}
      {/* Line 1: Orange Top */}
      <rect x="22" y="66" width="38" height="6.5" rx="3.25" fill={orangeSpeedGrad ? `url(#${orangeSpeedGrad})` : "#F97316"} />
      
      {/* Line 2: Orange Mid */}
      <rect x="36" y="81" width="26" height="6.5" rx="3.25" fill="#F97316" />
      
      {/* Line 3: Electric Sky Blue */}
      <rect x="26" y="96" width="36" height="6.5" rx="3.25" fill={blueSpeedGrad ? `url(#${blueSpeedGrad})` : "#38BDF8"} />
      
      {/* Line 4: Deep Sky Blue Bottom */}
      <rect x="42" y="111" width="22" height="6.5" rx="3.25" fill="#0284C7" />

      {/* ================= 2. THE BLUE SECURITY SHIELD ================= */}
      <g filter={`url(#${dropShadow})`}>
        {/* Left Facet of Shield */}
        <path 
          d="M106 20 L58 39 V98 C58 135 86 160 106 172 V20 Z" 
          fill={`url(#${shieldGradLeft})`}
        />
        
        {/* Right Facet of Shield (Darker for 3D bevel look) */}
        <path 
          d="M106 20 L154 39 V98 C154 135 126 160 106 172 V20 Z" 
          fill={`url(#${shieldGradRight})`}
        />

        {/* Shield Outer Glowing Neon Stroke */}
        <path 
          d="M106 20 L154 39 V98 C154 135 126 160 106 172 C86 160 58 135 58 98 V39 L106 20 Z" 
          stroke={`url(#${shieldStrokeGrad})`}
          strokeWidth="3.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />

        {/* Subtle Inner Accent Highlight */}
        <path 
          d="M106 26 L148 42.5 V96 C148 128 123 151 106 162" 
          stroke="#93C5FD" 
          strokeWidth="1.2" 
          strokeOpacity="0.4"
          fill="none"
        />
      </g>

      {/* ================= 3. THE DELIVERY TRUCK ================= */}
      <g id="delivery-truck">
        {/* White Cargo Box (Remorque blanche) */}
        <rect 
          x="75" 
          y="60" 
          width="44" 
          height="39" 
          rx="6" 
          fill="#FFFFFF" 
        />

        {/* Royal Blue Padlock on Cargo Box */}
        <g id="cargo-padlock">
          {/* Padlock Shackle */}
          <path 
            d="M93 72 V66.5 C93 63.8 95.2 61.5 98 61.5 C100.8 61.5 103 63.8 103 66.5 V72" 
            stroke="#1D4ED8" 
            strokeWidth="3" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Padlock Body */}
          <rect 
            x="90" 
            y="72" 
            width="16" 
            height="13" 
            rx="3" 
            fill="#1D4ED8" 
          />
          {/* Keyhole / Lock Core */}
          <circle cx="98" cy="77" r="1.6" fill="#FFFFFF" />
          <path d="M98 78 V81" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Orange Cabin (#F97316) */}
        <path 
          d="M119 72 H134 L146 86 V99 H119 V72 Z" 
          fill="#F97316" 
        />
        {/* Slanted Dark Windshield Glass */}
        <path 
          d="M122 75 H132 L140 86 H122 V75 Z" 
          fill="#06102E" 
        />

        {/* Truck Wheels */}
        {/* Rear Wheel */}
        <g id="rear-wheel">
          <circle cx="89" cy="99" r="8.5" fill="#06102E" stroke="#FFFFFF" strokeWidth="2.2" />
          <circle cx="89" cy="99" r="3.6" fill="#FFFFFF" />
          <circle cx="89" cy="99" r="1.8" fill="#06102E" />
        </g>

        {/* Front Wheel */}
        <g id="front-wheel">
          <circle cx="132" cy="99" r="8.5" fill="#06102E" stroke="#FFFFFF" strokeWidth="2.2" />
          <circle cx="132" cy="99" r="3.6" fill="#FFFFFF" />
          <circle cx="132" cy="99" r="1.8" fill="#06102E" />
        </g>

        {/* ================= 4. GREEN VERIFIED CHECKMARK BADGE ================= */}
        <g id="verified-badge" filter={`url(#${badgeGlow})`}>
          <circle cx="139" cy="65" r="9.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.6" />
          {/* Thick White Checkmark */}
          <path 
            d="M134.8 65 L137.8 68 L143.5 61.8" 
            stroke="#FFFFFF" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
          />
        </g>
      </g>
    </svg>
  );
};

/**
 * Responsive BRAD'CI Logo Component
 * Available in 3 variants:
 * - 'horizontal': Perfect for Navbar/Header, compact screens & badges.
 * - 'full': Stacked card format with Emblem, high-impact BRAD'CI lettering and full subtitle tagline.
 * - 'icon': Emblem only (Shield + Speed lines + Truck + Padlock + Green badge).
 */
export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  showIcon = true,
  subtitleText = "ENCHÈRES • PAIEMENT SÉQUESTRÉ • LIVRAISON GPS",
  onClick,
  id = "bradci-logo"
}) => {
  // Sizing definitions for icon and text
  const sizeMap = {
    xs: {
      icon: 'w-6 h-6',
      title: 'text-sm font-black',
      subtitle: 'text-[6px] tracking-wider'
    },
    sm: {
      icon: 'w-8 h-8',
      title: 'text-base sm:text-lg font-black',
      subtitle: 'text-[7px] tracking-[0.12em]'
    },
    md: {
      icon: 'w-9 h-9 sm:w-10 sm:h-10',
      title: 'text-lg sm:text-xl font-black',
      subtitle: 'text-[7.5px] sm:text-[8px] tracking-[0.14em]'
    },
    lg: {
      icon: 'w-12 h-12 sm:w-14 sm:h-14',
      title: 'text-xl sm:text-2xl md:text-3xl font-black',
      subtitle: 'text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.16em]'
    },
    xl: {
      icon: 'w-16 h-16 sm:w-20 sm:h-20',
      title: 'text-2xl sm:text-3xl md:text-4xl font-black',
      subtitle: 'text-[9px] sm:text-[11px] md:text-[12px] tracking-[0.18em]'
    },
    '2xl': {
      icon: 'w-24 h-24 sm:w-32 sm:h-32',
      title: 'text-3xl sm:text-5xl md:text-6xl font-black',
      subtitle: 'text-[11px] sm:text-[13px] md:text-[15px] tracking-[0.2em]'
    }
  };

  const selectedSize = typeof size === 'string' ? sizeMap[size] : sizeMap.md;

  // VARIANT 1: ICON ONLY
  if (variant === 'icon') {
    return (
      <div 
        id={id}
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
      >
        <LogoIcon className={selectedSize.icon} />
      </div>
    );
  }

  // VARIANT 2: FULL VERTICAL EMBLEM + TYPOGRAPHY (Identical to uploaded image)
  if (variant === 'full') {
    return (
      <div 
        id={id}
        onClick={onClick}
        className={`flex flex-col items-center justify-center text-center p-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {/* Emblem with subtle hover/breath effect */}
        {showIcon && (
          <div className="relative mb-2 transition-transform duration-300 hover:scale-105">
            <LogoIcon className={selectedSize.icon} />
          </div>
        )}

        {/* Main "BRAD'CI" Typography */}
        <div className={`flex items-baseline justify-center font-display ${selectedSize.title} tracking-tight leading-none text-white drop-shadow-md`}>
          <span className="text-white font-black tracking-normal">BRAD</span>
          <span className="text-[#F97316] font-black mx-0.5">'</span>
          <span className="text-[#38BDF8] font-black bg-gradient-to-b from-[#38BDF8] to-[#2563EB] bg-clip-text text-transparent">
            CI
          </span>
        </div>

        {/* Subtitle / Tagline */}
        {showSubtitle && (
          <p className={`mt-1.5 uppercase font-bold text-slate-300 ${selectedSize.subtitle} leading-tight drop-shadow-sm`}>
            {subtitleText}
          </p>
        )}
      </div>
    );
  }

  // VARIANT 3: HORIZONTAL (Standard for Header / Navbar & compact bars)
  return (
    <div 
      id={id}
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Shield Emblem */}
      {showIcon && (
        <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
          <LogoIcon className={selectedSize.icon} />
        </div>
      )}

      {/* Text block */}
      <div className="flex flex-col justify-center min-w-0">
        <div className={`flex items-baseline font-display ${selectedSize.title} tracking-tight leading-none text-white drop-shadow-sm`}>
          <span className="text-white font-black">BRAD</span>
          <span className="text-[#F97316] font-black mx-0.5">'</span>
          <span className="text-[#38BDF8] font-black bg-gradient-to-b from-[#38BDF8] to-[#2563EB] bg-clip-text text-transparent">
            CI
          </span>
        </div>

        {showSubtitle && (
          <p className={`hidden lg:block mt-0.5 uppercase font-extrabold text-slate-300 ${selectedSize.subtitle} opacity-90 whitespace-nowrap leading-none`}>
            {subtitleText}
          </p>
        )}
      </div>
    </div>
  );
};

// Backwards compatibility aliases
export const BradCiLogoIcon = LogoIcon;
export const BradCiLogo = Logo;

/**
 * Image officielle locale BRAD'CI pour le packaging autonome APK Android
 */
export const BradCiLogoImg: React.FC<{ className?: string; alt?: string; onClick?: () => void }> = ({
  className = "w-10 h-10 object-contain rounded-xl",
  alt = "BRAD'CI Logo",
  onClick
}) => (
  <img 
    src={BRADCI_OFFICIAL_LOGO_DATA_URI || "/logo.png?v=14"} 
    alt={alt} 
    className={className} 
    onClick={onClick}
    onError={(e) => { 
      const target = e.currentTarget as HTMLImageElement;
      if (target.getAttribute('src') !== BRADCI_OFFICIAL_LOGO_DATA_URI) {
        target.src = BRADCI_OFFICIAL_LOGO_DATA_URI;
      }
    }} 
  />
);

export default Logo;
