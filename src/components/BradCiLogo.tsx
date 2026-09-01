import React from 'react';

interface BradCiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BradCiLogoIcon: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size = 48 
}) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
    >
      {/* Orange motion / speed lines on the left */}
      <rect x="2" y="38" width="12" height="3.5" rx="1.75" fill="#FF5B00" />
      <rect x="0" y="47" width="16" height="3.5" rx="1.75" fill="#FF5B00" />
      <rect x="3" y="56" width="10" height="3.5" rx="1.75" fill="#FF5B00" />

      {/* Royal Blue Shield (#1E53E5) */}
      <path 
        d="M56 8C74 13 88 18 88 18V50C88 68.5 73.5 83.5 56 92C38.5 83.5 24 68.5 24 50V18C24 18 38 13 56 8Z" 
        fill="#1E53E5" 
        stroke="#467BFF" 
        strokeWidth="3.5" 
        strokeLinejoin="round"
      />

      {/* Inner shield shading */}
      <path 
        d="M56 12C71.5 16.5 84 21 84 21V50C84 66 71 79.5 56 87.5V12Z" 
        fill="#1644C4" 
        opacity="0.6"
      />

      {/* Delivery Truck Body */}
      {/* White Cargo Box */}
      <rect x="31" y="33" width="31" height="25" rx="3.5" fill="#ffffff" />

      {/* Blue Padlock on Cargo Box */}
      <path 
        d="M44 42.5V40C44 38.3431 45.3431 37 47 37C48.6569 37 50 38.3431 50 40V42.5" 
        stroke="#1E53E5" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
      />
      <rect x="42.5" y="42.5" width="9" height="7.5" rx="1.5" fill="#1E53E5" />
      <circle cx="47" cy="45.5" r="1" fill="#ffffff" />
      <path d="M47 46.5V48.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

      {/* Orange Truck Cabin (#FF5B00) */}
      <path 
        d="M62 42H70.5L75 48.5V58H62V42Z" 
        fill="#FF5B00" 
      />

      {/* Truck Windshield / Window */}
      <path 
        d="M64 44H69.5L72.8 49H64V44Z" 
        fill="#0B1021" 
      />

      {/* Green Verified Badge (#00C853) */}
      <circle cx="72" cy="37" r="5.5" fill="#00C853" />
      <path 
        d="M69.8 37L71.3 38.5L74.5 35.3" 
        stroke="#ffffff" 
        strokeWidth="1.4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Wheels */}
      {/* Front Wheel */}
      <circle cx="69" cy="58" r="5" fill="#0B1021" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="69" cy="58" r="2" fill="#e2e8f0" />

      {/* Rear Wheel */}
      <circle cx="39" cy="58" r="5" fill="#0B1021" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="39" cy="58" r="2" fill="#e2e8f0" />
    </svg>
  );
};

export const BradCiLogo: React.FC<BradCiLogoProps> = ({ 
  className = "", 
  size = 'md',
  showSubtitle = true 
}) => {
  const iconSizes = {
    sm: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7',
    md: 'w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8',
    lg: 'w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10'
  };

  const textSizes = {
    sm: 'text-xs sm:text-sm md:text-base',
    md: 'text-sm xs:text-base sm:text-lg md:text-xl',
    lg: 'text-base sm:text-lg md:text-xl lg:text-2xl'
  };

  const subTextSizes = {
    sm: 'text-[5.5px] sm:text-[6.5px] md:text-[7.5px]',
    md: 'text-[6px] sm:text-[7px] md:text-[8px]',
    lg: 'text-[7px] sm:text-[8px] md:text-[9px]'
  };

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      {/* Brand Icon (Shield + Delivery Truck + Lock + Verified Badge) */}
      <div className="shrink-0 transition-transform group-hover:scale-105">
        <BradCiLogoIcon className={iconSizes[size]} />
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col min-w-0 justify-center">
        <div className={`font-display ${textSizes[size]} font-black tracking-tight flex items-baseline leading-none select-none drop-shadow-sm`}>
          <span className="text-white">BRAD</span>
          <span className="text-[#FF5B00] font-black">'</span>
          <span className="text-[#1E53E5] font-black ml-0.5">CI</span>
        </div>
        
        {showSubtitle && (
          <p className={`hidden xl:block ${subTextSizes[size]} text-slate-300 font-bold uppercase tracking-[0.12em] mt-0.5 whitespace-nowrap leading-none opacity-90`}>
            ENCHÈRES • PAIEMENT À LA LIVRAISON • LIVRAISON GPS
          </p>
        )}
      </div>
    </div>
  );
};
