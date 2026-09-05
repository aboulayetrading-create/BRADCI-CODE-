import React from 'react';

// Crisp SVG Vector Drawings for KYC Exemplary Demonstrations
// Styled like professional banking, fintech & courier apps (Yango, Uber, Wave, Revolut)

export const CNIVectorDrawing: React.FC<{ className?: string; isGood?: boolean }> = ({ 
  className = "w-full h-40",
  isGood = true 
}) => {
  return (
    <svg 
      viewBox="0 0 320 200" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cniBg" x1="0" y1="0" x2="320" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="20" y1="20" x2="300" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="goldSeal" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Background container */}
      <rect width="320" height="200" rx="16" fill="#0B111E" />

      {/* Main Card Body */}
      <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.4))">
        <rect x="25" y="24" width="270" height="152" rx="10" fill="url(#cardGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
      </g>

      {/* Header Band (Republic of Côte d'Ivoire colors accent) */}
      <path d="M26 34C26 28.5 30.5 24 36 24H284C289.5 24 294 28.5 294 34V46H26V34Z" fill="#0284C7" fillOpacity="0.15" />
      <rect x="26" y="44" width="90" height="2.5" fill="#F97316" />
      <rect x="116" y="44" width="90" height="2.5" fill="#FFFFFF" />
      <rect x="206" y="44" width="88" height="2.5" fill="#16A34A" />

      {/* Micro header text lines */}
      <text x="36" y="38" fill="#1E293B" fontSize="7.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
        RÉPUBLIQUE DE CÔTE D'IVOIRE
      </text>
      <text x="212" y="37" fill="#64748B" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
        CARTE NATIONALE
      </text>

      {/* Biometric Photo Frame on Left */}
      <rect x="36" y="56" width="60" height="74" rx="6" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
      {/* Silhouette Head & Shoulders */}
      <circle cx="66" cy="84" r="14" fill="#94A3B8" />
      <path d="M46 124C46 107 55 103 66 103C77 103 86 107 86 124H46Z" fill="#94A3B8" />
      {/* Photo Verified Tick */}
      <circle cx="86" cy="66" r="6" fill="#10B981" />
      <path d="M83 66L85 68L89 64" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Gold Smart Chip */}
      <rect x="106" y="58" width="28" height="22" rx="3" fill="url(#goldSeal)" stroke="#B45309" strokeWidth="0.8" />
      <path d="M106 69H134M120 58V80M113 58V80M127 58V80" stroke="#B45309" strokeWidth="0.6" opacity="0.6" />

      {/* Hologram / Coat of arms */}
      <circle cx="266" cy="68" r="12" fill="#0284C7" fillOpacity="0.15" stroke="#0284C7" strokeWidth="0.8" strokeDasharray="2 1" />
      <text x="266" y="71" fill="#0284C7" fontSize="8" fontWeight="bold" textAnchor="middle">CI</text>

      {/* Personal Info Lines (Crisp vector bars representing text) */}
      <rect x="106" y="88" width="60" height="4" rx="2" fill="#0F172A" />
      <rect x="106" y="96" width="110" height="3" rx="1.5" fill="#64748B" />
      <rect x="106" y="103" width="90" height="3" rx="1.5" fill="#64748B" />
      <rect x="106" y="110" width="75" height="3" rx="1.5" fill="#64748B" />
      <rect x="106" y="119" width="140" height="5" rx="2" fill="#0369A1" />

      {/* Machine Readable Zone (MRZ Lines at Bottom) */}
      <rect x="36" y="138" width="248" height="26" rx="4" fill="#0F172A" fillOpacity="0.08" />
      <text x="42" y="149" fill="#334155" fontSize="6.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1.2">
        I&lt;CIV0039281748&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </text>
      <text x="42" y="159" fill="#334155" fontSize="6.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1.2">
        9204128M2912315CIV&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;6
      </text>

      {/* 4 Professional Viewfinder Alignment Brackets */}
      {isGood ? (
        <g stroke="#10B981" strokeWidth="3" strokeLinecap="round">
          {/* Top Left */}
          <path d="M16 36V18H34" />
          {/* Top Right */}
          <path d="M304 36V18H286" />
          {/* Bottom Left */}
          <path d="M16 164V182H34" />
          {/* Bottom Right */}
          <path d="M304 164V182H286" />

          {/* Success Label Pill */}
          <rect x="88" y="6" width="144" height="18" rx="9" fill="#10B981" />
          <text x="160" y="18" fill="#022C22" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
            ✓ 4 COINS NETS &amp; SANS REFLETS
          </text>
        </g>
      ) : (
        <g stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
          {/* Defect Indicators */}
          <path d="M16 36V18H34" stroke="#EF4444" strokeDasharray="3 3" />
          <path d="M304 36V18H286" stroke="#EF4444" strokeDasharray="3 3" />
          <rect x="90" y="6" width="140" height="18" rx="9" fill="#EF4444" />
          <text x="160" y="18" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle">
            ✗ MAUVAIS CADRAGE (COUPÉ)
          </text>
        </g>
      )}
    </svg>
  );
};

export const SelfieVectorDrawing: React.FC<{ className?: string; isGood?: boolean }> = ({ 
  className = "w-full h-40",
  isGood = true 
}) => {
  return (
    <svg 
      viewBox="0 0 320 200" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background container */}
      <rect width="320" height="200" rx="16" fill="#0B111E" />

      {/* Soft studio lighting rays from top corners */}
      <circle cx="160" cy="95" r="85" fill="#10B981" fillOpacity="0.04" />

      {/* Human Silhouette Head, Neck & Shoulders */}
      <path 
        d="M100 190C100 160 120 148 140 144V132C130 128 124 116 124 102C124 82 140 66 160 66C180 66 196 82 196 102C196 116 190 128 180 132V144C200 148 220 160 220 190H100Z" 
        fill="#1E293B" 
        stroke="#475569" 
        strokeWidth="1.5"
      />

      {/* Face features outline */}
      {/* Eyes alignment level */}
      <line x1="145" y1="98" x2="155" y2="98" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="165" y1="98" x2="175" y2="98" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      {/* Nose */}
      <path d="M160 102V108H163" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
      {/* Neutral calm smile */}
      <path d="M152 116C156 119 164 119 168 116" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />

      {/* Biometric Oval Head Target Framing (Green Guide) */}
      <ellipse 
        cx="160" 
        cy="104" 
        rx="52" 
        ry="68" 
        stroke="#10B981" 
        strokeWidth="2" 
        strokeDasharray="6 4"
      />

      {/* Crosshair axes */}
      <line x1="160" y1="28" x2="160" y2="40" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <line x1="160" y1="170" x2="160" y2="182" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <line x1="94" y1="104" x2="106" y2="104" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <line x1="214" y1="104" x2="226" y2="104" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

      {/* Top Banner Tag */}
      <rect x="75" y="8" width="170" height="18" rx="9" fill="#10B981" />
      <text x="160" y="20" fill="#022C22" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
        ✓ VISAGE CENTRÉ DANS L'OVALE
      </text>

      {/* Pro compliance badges */}
      <g transform="translate(18, 54)">
        <rect width="66" height="22" rx="6" fill="#1E293B" stroke="#334155" />
        <text x="33" y="14" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
          ☀️ Bien éclairé
        </text>
      </g>
      <g transform="translate(236, 54)">
        <rect width="66" height="22" rx="6" fill="#1E293B" stroke="#334155" />
        <text x="33" y="14" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
          🕶️ Sans lunettes
        </text>
      </g>
      <g transform="translate(236, 84)">
        <rect width="66" height="22" rx="6" fill="#1E293B" stroke="#334155" />
        <text x="33" y="14" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
          🧢 Sans casquette
        </text>
      </g>
    </svg>
  );
};

export const SelfieWithCardVectorDrawing: React.FC<{ className?: string; isGood?: boolean }> = ({ 
  className = "w-full h-40",
  isGood = true 
}) => {
  return (
    <svg 
      viewBox="0 0 320 200" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background container */}
      <rect width="320" height="200" rx="16" fill="#0B111E" />

      {/* Person Silhouette (Left side) */}
      <path 
        d="M60 190C60 162 76 150 95 146V136C87 132 82 122 82 108C82 90 95 76 112 76C129 76 142 90 142 108C142 122 137 132 129 136V146C140 148 152 156 160 170" 
        fill="#1E293B" 
        stroke="#475569" 
        strokeWidth="1.5"
      />
      {/* Face guide target */}
      <circle cx="112" cy="108" r="28" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="106" cy="105" r="2" fill="#94A3B8" />
      <circle cx="118" cy="105" r="2" fill="#94A3B8" />
      <path d="M109 116C111 118 114 118 116 116" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />

      {/* Hand holding ID Card on the Right (at chest / chin level) */}
      {/* Arm outline */}
      <path d="M150 190L190 140" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      
      {/* ID Card held firmly from the bottom corner without obstructing text */}
      <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.5))">
        <rect x="175" y="70" width="115" height="74" rx="6" fill="#F8FAFC" stroke="#10B981" strokeWidth="2" />
        
        {/* Card Header Strip */}
        <path d="M176 75C176 72 178 71 181 71H284C287 71 289 72 289 75V80H176V75Z" fill="#0284C7" />
        {/* Mini photo on card */}
        <rect x="182" y="86" width="26" height="34" rx="3" fill="#334155" />
        <circle cx="195" cy="98" r="6" fill="#94A3B8" />
        <path d="M187 116C187 109 191 107 195 107C199 107 203 109 203 116H187Z" fill="#94A3B8" />

        {/* Text lines */}
        <rect x="214" y="88" width="30" height="3" rx="1.5" fill="#0F172A" />
        <rect x="214" y="95" width="60" height="2.5" rx="1" fill="#64748B" />
        <rect x="214" y="101" width="50" height="2.5" rx="1" fill="#64748B" />
        <rect x="214" y="107" width="45" height="2.5" rx="1" fill="#64748B" />

        {/* Chip */}
        <rect x="214" y="114" width="14" height="10" rx="1.5" fill="#F59E0B" />

        {/* Card OK Badge */}
        <circle cx="282" cy="78" r="5" fill="#10B981" />
        <path d="M280 78L281.5 79.5L284 76.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Fingers holding the edge safely */}
      <rect x="210" y="140" width="14" height="18" rx="4" fill="#475569" transform="rotate(-15 210 140)" />
      <rect x="222" y="141" width="14" height="18" rx="4" fill="#475569" transform="rotate(-15 222 141)" />

      {/* Top Banner */}
      <rect x="55" y="8" width="210" height="18" rx="9" fill="#10B981" />
      <text x="160" y="20" fill="#022C22" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
        ✓ VISAGE + PIÈCE TENUE AU MENTON
      </text>

      {/* Indicator Pills */}
      <rect x="18" y="166" width="120" height="20" rx="6" fill="#1E293B" stroke="#10B981" strokeWidth="0.8" />
      <text x="78" y="179" fill="#34D399" fontSize="7.5" fontWeight="bold" textAnchor="middle">
        ✓ Visage 100% visible
      </text>

      <rect x="180" y="166" width="122" height="20" rx="6" fill="#1E293B" stroke="#10B981" strokeWidth="0.8" />
      <text x="241" y="179" fill="#34D399" fontSize="7.5" fontWeight="bold" textAnchor="middle">
        ✓ Texte carte non masqué
      </text>
    </svg>
  );
};

export const DriverLicenseVectorDrawing: React.FC<{ className?: string; isGood?: boolean }> = ({ 
  className = "w-full h-40",
  isGood = true 
}) => {
  return (
    <svg 
      viewBox="0 0 320 200" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="200" rx="16" fill="#0B111E" />

      {/* Driver License Card Body (Pink / Beige tone typical of West African Permis) */}
      <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.4))">
        <rect x="25" y="24" width="270" height="152" rx="10" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
      </g>

      {/* Header Flag / Header bar */}
      <path d="M26 34C26 28.5 30.5 24 36 24H284C289.5 24 294 28.5 294 34V44H26V34Z" fill="#DC2626" fillOpacity="0.12" />
      <text x="36" y="36" fill="#991B1B" fontSize="8" fontWeight="900" fontFamily="sans-serif">
        RÉPUBLIQUE DE CÔTE D'IVOIRE
      </text>
      <text x="210" y="36" fill="#DC2626" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
        PERMIS DE CONDUIRE
      </text>

      {/* Photo frame */}
      <rect x="36" y="52" width="56" height="70" rx="5" fill="#1E293B" />
      <circle cx="64" cy="78" r="13" fill="#94A3B8" />
      <path d="M46 116C46 100 55 96 64 96C73 96 82 100 82 116H46Z" fill="#94A3B8" />

      {/* Stamp / Logo */}
      <circle cx="114" cy="64" r="10" fill="#F87171" fillOpacity="0.2" stroke="#DC2626" strokeWidth="0.8" />
      <text x="114" y="67" fill="#DC2626" fontSize="7" fontWeight="bold" textAnchor="middle">CI</text>

      {/* License details */}
      <rect x="132" y="56" width="90" height="4" rx="2" fill="#1E293B" />
      <rect x="132" y="64" width="70" height="3" rx="1.5" fill="#64748B" />
      <rect x="132" y="71" width="100" height="3" rx="1.5" fill="#64748B" />
      
      {/* Category Stamps Grid (A Moto, B Auto, C Cargo) */}
      <g transform="translate(102, 84)">
        {/* Cat A */}
        <rect x="0" y="0" width="46" height="24" rx="4" fill="#DC2626" fillOpacity="0.1" stroke="#DC2626" strokeWidth="1" />
        <text x="12" y="16" fill="#991B1B" fontSize="11" fontWeight="900">A</text>
        <text x="26" y="15" fill="#475569" fontSize="8">🏍️ Moto</text>
        
        {/* Cat B */}
        <rect x="52" y="0" width="48" height="24" rx="4" fill="#0284C7" fillOpacity="0.1" stroke="#0284C7" strokeWidth="1" />
        <text x="64" y="16" fill="#0369A1" fontSize="11" fontWeight="900">B</text>
        <text x="78" y="15" fill="#475569" fontSize="8">🚗 Auto</text>

        {/* Cat C */}
        <rect x="106" y="0" width="50" height="24" rx="4" fill="#16A34A" fillOpacity="0.1" stroke="#16A34A" strokeWidth="1" />
        <text x="118" y="16" fill="#15803D" fontSize="11" fontWeight="900">C</text>
        <text x="132" y="15" fill="#475569" fontSize="8">🚚 Cargo</text>
      </g>

      {/* Signature & Validity line */}
      <rect x="36" y="132" width="100" height="18" rx="3" fill="#FFFFFF" stroke="#CBD5E1" />
      <text x="44" y="144" fill="#64748B" fontSize="6.5" fontFamily="monospace">Signature Titulaire</text>
      <path d="M46 146C60 142 80 148 95 143C110 138 120 145 125 144" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />

      {/* Expiry Date */}
      <rect x="150" y="132" width="132" height="18" rx="3" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="1" />
      <text x="160" y="144" fill="#047857" fontSize="7.5" fontWeight="bold">
        VALIDITÉ : EN COURS (OK ✓)
      </text>

      {/* 4 Green Corner Marks */}
      <g stroke="#10B981" strokeWidth="3" strokeLinecap="round">
        <path d="M16 36V18H34" />
        <path d="M304 36V18H286" />
        <path d="M16 164V182H34" />
        <path d="M304 164V182H286" />
      </g>

      {/* Top Banner */}
      <rect x="70" y="6" width="180" height="18" rx="9" fill="#10B981" />
      <text x="160" y="18" fill="#022C22" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
        ✓ PERMIS RECTO + CATÉGORIE NETTE
      </text>
    </svg>
  );
};

export const VehicleRegVectorDrawing: React.FC<{ 
  className?: string;
  vehicleType?: 'moto' | 'voiture' | 'cargo' | string;
  isGood?: boolean;
}> = ({ 
  className = "w-full h-40",
  vehicleType = 'moto',
  isGood = true
}) => {
  return (
    <svg 
      viewBox="0 0 320 200" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="200" rx="16" fill="#0B111E" />

      {/* Certificate Sheet (Carte Grise CI) */}
      <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.4))">
        <rect x="25" y="24" width="270" height="152" rx="10" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5" />
      </g>

      {/* Header band */}
      <rect x="26" y="25" width="268" height="22" rx="8" fill="#16A34A" fillOpacity="0.15" />
      <text x="36" y="39" fill="#15803D" fontSize="8" fontWeight="900">
        CERTIFICAT D'IMMATRICULATION (CARTE GRISE)
      </text>
      <text x="246" y="39" fill="#166534" fontSize="7" fontWeight="bold">
        STANDARD CI
      </text>

      {/* License Plate Simulation */}
      <rect x="36" y="56" width="130" height="34" rx="6" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />
      {/* Flag */}
      <rect x="42" y="62" width="12" height="22" rx="2" fill="#F97316" />
      <rect x="46" y="62" width="4" height="22" fill="#FFFFFF" />
      <rect x="50" y="62" width="4" height="22" fill="#16A34A" />
      <text x="44" y="80" fill="#FFFFFF" fontSize="5" fontWeight="bold">CI</text>

      {/* Plate text */}
      <text x="64" y="78" fill="#FBBF24" fontSize="12" fontWeight="900" fontFamily="monospace" letterSpacing="1.5">
        4523 JJ 01
      </text>

      {/* Vehicle Silhouette & Model Stamp on the right */}
      <rect x="178" y="56" width="104" height="88" rx="8" fill="#FFFFFF" stroke="#DCFCE7" strokeWidth="1.5" />
      
      {/* Icon and model depending on vehicleType */}
      {vehicleType === 'voiture' || vehicleType === 'car' ? (
        <g transform="translate(200, 68)">
          <path d="M6 24L12 12H38L44 24H50V34H46V36H38V34H12V36H4V34H0V24H6Z" fill="#1E293B" />
          <circle cx="12" cy="34" r="5" fill="#64748B" stroke="#0F172A" strokeWidth="2" />
          <circle cx="38" cy="34" r="5" fill="#64748B" stroke="#0F172A" strokeWidth="2" />
          <text x="25" y="54" fill="#0F172A" fontSize="8" fontWeight="bold" textAnchor="middle">Toyota / Suzuki</text>
          <text x="25" y="63" fill="#16A34A" fontSize="7" fontWeight="bold" textAnchor="middle">Service Conforme</text>
        </g>
      ) : vehicleType === 'cargo' ? (
        <g transform="translate(195, 68)">
          <rect x="0" y="8" width="40" height="24" rx="2" fill="#1E293B" />
          <path d="M40 18H52L58 24V32H40V18Z" fill="#334155" />
          <circle cx="12" cy="34" r="5" fill="#64748B" />
          <circle cx="48" cy="34" r="5" fill="#64748B" />
          <text x="30" y="54" fill="#0F172A" fontSize="8" fontWeight="bold" textAnchor="middle">Fourgonnette / Pick-up</text>
          <text x="30" y="63" fill="#16A34A" fontSize="7" fontWeight="bold" textAnchor="middle">Flotte Fret</text>
        </g>
      ) : (
        <g transform="translate(200, 68)">
          {/* Moto silhouette */}
          <circle cx="10" cy="30" r="8" stroke="#1E293B" strokeWidth="2.5" />
          <circle cx="42" cy="30" r="8" stroke="#1E293B" strokeWidth="2.5" />
          <path d="M10 30L22 18L32 18L42 30M22 18L26 30M26 12L22 18" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          <text x="26" y="54" fill="#0F172A" fontSize="8" fontWeight="bold" textAnchor="middle">Yamaha / Bajaj / TVS</text>
          <text x="26" y="63" fill="#16A34A" fontSize="7" fontWeight="bold" textAnchor="middle">Livraison Express</text>
        </g>
      )}

      {/* Info specs lines on left */}
      <rect x="36" y="100" width="80" height="3" rx="1.5" fill="#64748B" />
      <rect x="36" y="108" width="110" height="3" rx="1.5" fill="#64748B" />
      <rect x="36" y="116" width="95" height="3" rx="1.5" fill="#64748B" />
      <rect x="36" y="126" width="130" height="18" rx="4" fill="#16A34A" fillOpacity="0.1" stroke="#16A34A" strokeWidth="1" />
      <text x="44" y="138" fill="#15803D" fontSize="7.5" fontWeight="bold">
        CHÂSSIS &amp; MATRICULE VÉRIFIÉS ✓
      </text>

      {/* 4 Corner brackets */}
      <g stroke="#10B981" strokeWidth="3" strokeLinecap="round">
        <path d="M16 36V18H34" />
        <path d="M304 36V18H286" />
        <path d="M16 164V182H34" />
        <path d="M304 164V182H286" />
      </g>

      {/* Top Banner */}
      <rect x="65" y="6" width="190" height="18" rx="9" fill="#10B981" />
      <text x="160" y="18" fill="#022C22" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
        ✓ CARTE GRISE &amp; PLAQUE LISIBLES
      </text>
    </svg>
  );
};

// Generate clean Data URI SVG strings for direct usage as image source (replaces Unsplash links)
export const KYC_DRAWING_DATA_URIS = {
  cni: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="250" rx="16" fill="#0F172A"/>
      <rect x="30" y="30" width="340" height="190" rx="12" fill="#F8FAFC" stroke="#94A3B8" stroke-width="2"/>
      <rect x="32" y="32" width="336" height="28" rx="10" fill="#0284C7" fill-opacity="0.15"/>
      <rect x="32" y="58" width="112" height="3" fill="#F97316"/>
      <rect x="144" y="58" width="112" height="3" fill="#FFFFFF"/>
      <rect x="256" y="58" width="112" height="3" fill="#16A34A"/>
      <text x="46" y="50" fill="#0F172A" font-size="10" font-weight="900" font-family="sans-serif">RÉPUBLIQUE DE CÔTE D'IVOIRE - CNI</text>
      <rect x="46" y="74" width="76" height="92" rx="8" fill="#334155"/>
      <circle cx="84" cy="108" r="18" fill="#94A3B8"/>
      <path d="M58 156C58 136 70 130 84 130C98 130 110 136 110 156H58Z" fill="#94A3B8"/>
      <rect x="136" y="78" width="34" height="26" rx="4" fill="#F59E0B"/>
      <circle cx="330" cy="90" r="15" fill="#0284C7" fill-opacity="0.2" stroke="#0284C7"/>
      <text x="330" y="94" fill="#0284C7" font-size="9" font-weight="bold" text-anchor="middle">CI</text>
      <rect x="136" y="112" width="80" height="6" rx="3" fill="#0F172A"/>
      <rect x="136" y="124" width="140" height="5" rx="2.5" fill="#64748B"/>
      <rect x="136" y="133" width="110" height="5" rx="2.5" fill="#64748B"/>
      <rect x="136" y="145" width="170" height="7" rx="3" fill="#0284C7"/>
      <rect x="46" y="174" width="308" height="34" rx="6" fill="#0F172A" fill-opacity="0.08"/>
      <text x="56" y="188" fill="#334155" font-size="8" font-family="monospace" font-weight="bold">I&lt;CIV0039281748&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <text x="56" y="200" fill="#334155" font-size="8" font-family="monospace" font-weight="bold">9204128M2912315CIV&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;6</text>
      <g stroke="#10B981" stroke-width="4" stroke-linecap="round">
        <path d="M20 44V20H44M380 44V20H356M20 206V230H44M380 206V230H356"/>
      </g>
      <rect x="110" y="6" width="180" height="22" rx="11" fill="#10B981"/>
      <text x="200" y="21" fill="#022C22" font-size="10" font-weight="900" text-anchor="middle">EXEMPLE CONFORME ✓</text>
    </svg>
  `)}`,

  selfie: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="250" rx="16" fill="#0F172A"/>
      <circle cx="200" cy="120" r="100" fill="#10B981" fill-opacity="0.05"/>
      <path d="M125 240C125 200 150 184 175 180V166C162 160 154 146 154 128C154 102 174 82 200 82C226 82 246 102 246 128C246 146 238 160 225 166V180C250 184 275 200 275 240H125Z" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <ellipse cx="200" cy="130" rx="64" ry="84" stroke="#10B981" stroke-width="2.5" stroke-dasharray="8 5"/>
      <line x1="200" y1="36" x2="200" y2="52" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="200" y1="208" x2="200" y2="224" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="124" y1="130" x2="140" y2="130" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="260" y1="130" x2="276" y2="130" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="188" cy="122" r="3" fill="#94A3B8"/>
      <circle cx="212" cy="122" r="3" fill="#94A3B8"/>
      <path d="M192 144C196 148 204 148 208 144" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="110" y="6" width="180" height="22" rx="11" fill="#10B981"/>
      <text x="200" y="21" fill="#022C22" font-size="10" font-weight="900" text-anchor="middle">SELFIE CONFORME ✓</text>
    </svg>
  `)}`,

  driverLicenseSelfie: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="250" rx="16" fill="#0F172A"/>
      <path d="M70 240C70 206 90 190 114 186V172C104 168 98 155 98 138C98 116 114 98 135 98C156 98 172 116 172 138C172 155 166 168 156 172V186C170 188 185 198 195 215" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <circle cx="135" cy="138" r="34" stroke="#10B981" stroke-width="2" stroke-dasharray="5 4"/>
      <rect x="215" y="90" width="145" height="92" rx="8" fill="#F8FAFC" stroke="#10B981" stroke-width="2.5"/>
      <rect x="217" y="92" width="141" height="16" rx="6" fill="#0284C7"/>
      <rect x="224" y="116" width="34" height="42" rx="4" fill="#334155"/>
      <circle cx="241" cy="132" r="8" fill="#94A3B8"/>
      <rect x="264" y="118" width="40" height="4" rx="2" fill="#0F172A"/>
      <rect x="264" y="126" width="75" height="3" rx="1.5" fill="#64748B"/>
      <rect x="264" y="133" width="60" height="3" rx="1.5" fill="#64748B"/>
      <rect x="264" y="142" width="18" height="12" rx="2" fill="#F59E0B"/>
      <rect x="100" y="6" width="200" height="22" rx="11" fill="#10B981"/>
      <text x="200" y="21" fill="#022C22" font-size="10" font-weight="900" text-anchor="middle">SELFIE + DOCUMENT TENU ✓</text>
    </svg>
  `)}`,
  selfieWithId: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="250" rx="16" fill="#0F172A"/>
      <path d="M70 240C70 206 90 190 114 186V172C104 168 98 155 98 138C98 116 114 98 135 98C156 98 172 116 172 138C172 155 166 168 156 172V186C170 188 185 198 195 215" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <circle cx="135" cy="138" r="34" stroke="#10B981" stroke-width="2" stroke-dasharray="5 4"/>
      <rect x="215" y="90" width="145" height="92" rx="8" fill="#F8FAFC" stroke="#10B981" stroke-width="2.5"/>
      <rect x="217" y="92" width="141" height="16" rx="6" fill="#0284C7"/>
      <rect x="224" y="116" width="34" height="42" rx="4" fill="#334155"/>
      <circle cx="241" cy="132" r="8" fill="#94A3B8"/>
      <rect x="264" y="118" width="40" height="4" rx="2" fill="#0F172A"/>
      <rect x="264" y="126" width="75" height="3" rx="1.5" fill="#64748B"/>
      <rect x="264" y="133" width="60" height="3" rx="1.5" fill="#64748B"/>
      <rect x="264" y="142" width="18" height="12" rx="2" fill="#F59E0B"/>
      <rect x="100" y="6" width="200" height="22" rx="11" fill="#10B981"/>
      <text x="200" y="21" fill="#022C22" font-size="10" font-weight="900" text-anchor="middle">SELFIE + DOCUMENT TENU ✓</text>
    </svg>
  `)}`,

  driverLicense: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="250" rx="16" fill="#0F172A"/>
      <rect x="30" y="30" width="340" height="190" rx="12" fill="#FEF2F2" stroke="#F87171" stroke-width="2"/>
      <rect x="32" y="32" width="336" height="26" rx="10" fill="#DC2626" fill-opacity="0.15"/>
      <text x="46" y="50" fill="#991B1B" font-size="10" font-weight="900" font-family="sans-serif">PERMIS DE CONDUIRE CI - LIVREURS</text>
      <rect x="46" y="68" width="70" height="88" rx="6" fill="#1E293B"/>
      <circle cx="81" cy="100" r="16" fill="#94A3B8"/>
      <path d="M58 144C58 126 68 120 81 120C94 120 104 126 104 144H58Z" fill="#94A3B8"/>
      <g transform="translate(130, 72)">
        <rect x="0" y="0" width="58" height="30" rx="5" fill="#DC2626" fill-opacity="0.1" stroke="#DC2626" stroke-width="1.2"/>
        <text x="14" y="20" fill="#991B1B" font-size="13" font-weight="900">A</text>
        <text x="32" y="19" fill="#334155" font-size="9">Moto</text>
        <rect x="66" y="0" width="60" height="30" rx="5" fill="#0284C7" fill-opacity="0.1" stroke="#0284C7" stroke-width="1.2"/>
        <text x="78" y="20" fill="#0369A1" font-size="13" font-weight="900">B</text>
        <text x="96" y="19" fill="#334155" font-size="9">Auto</text>
        <rect x="134" y="0" width="64" height="30" rx="5" fill="#16A34A" fill-opacity="0.1" stroke="#16A34A" stroke-width="1.2"/>
        <text x="146" y="20" fill="#15803D" font-size="13" font-weight="900">C</text>
        <text x="166" y="19" fill="#334155" font-size="9">Cargo</text>
      </g>
      <rect x="130" y="116" width="180" height="6" rx="3" fill="#64748B"/>
      <rect x="130" y="128" width="140" height="5" rx="2.5" fill="#64748B"/>
      <rect x="46" y="168" width="140" height="24" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="56" y="184" fill="#64748B" font-size="8" font-family="monospace">Signature OK</text>
      <rect x="200" y="168" width="154" height="24" rx="4" fill="#10B981" fill-opacity="0.15" stroke="#10B981"/>
      <text x="212" y="184" fill="#047857" font-size="9" font-weight="bold">VALIDITÉ EN COURS ✓</text>
      <g stroke="#10B981" stroke-width="4" stroke-linecap="round">
        <path d="M20 44V20H44M380 44V20H356M20 206V230H44M380 206V230H356"/>
      </g>
      <rect x="100" y="6" width="200" height="22" rx="11" fill="#10B981"/>
      <text x="200" y="21" fill="#022C22" font-size="10" font-weight="900" text-anchor="middle">PERMIS CONFORME ✓</text>
    </svg>
  `)}`,

  vehicleReg: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="250" rx="16" fill="#0F172A"/>
      <rect x="30" y="30" width="340" height="190" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="2"/>
      <rect x="32" y="32" width="336" height="26" rx="10" fill="#16A34A" fill-opacity="0.15"/>
      <text x="46" y="50" fill="#15803D" font-size="10" font-weight="900" font-family="sans-serif">CARTE GRISE ET ENGIN - FLOTTES LIVRAISON</text>
      <rect x="46" y="70" width="160" height="42" rx="8" fill="#0F172A" stroke="#F59E0B" stroke-width="2"/>
      <rect x="54" y="78" width="16" height="26" rx="3" fill="#F97316"/>
      <rect x="60" y="78" width="4" height="26" fill="#FFFFFF"/>
      <rect x="64" y="78" width="4" height="26" fill="#16A34A"/>
      <text x="82" y="98" fill="#FBBF24" font-size="15" font-weight="900" font-family="monospace" letter-spacing="2">4523 JJ 01</text>
      <rect x="222" y="70" width="132" height="106" rx="8" fill="#FFFFFF" stroke="#DCFCE7" stroke-width="2"/>
      <circle cx="250" cy="115" r="10" stroke="#1E293B" stroke-width="3"/>
      <circle cx="295" cy="115" r="10" stroke="#1E293B" stroke-width="3"/>
      <path d="M250 115L265 98L278 98L295 115M265 98L270 115" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
      <text x="288" y="148" fill="#0F172A" font-size="9" font-weight="bold" text-anchor="middle">Yamaha Crypton 110</text>
      <text x="288" y="160" fill="#16A34A" font-size="8" font-weight="bold" text-anchor="middle">Véhicule Validé</text>
      <rect x="46" y="124" width="140" height="5" rx="2.5" fill="#64748B"/>
      <rect x="46" y="134" width="110" height="5" rx="2.5" fill="#64748B"/>
      <rect x="46" y="148" width="160" height="24" rx="5" fill="#16A34A" fill-opacity="0.15" stroke="#16A34A"/>
      <text x="56" y="164" fill="#15803D" font-size="9" font-weight="bold">CHÂSSIS CONFORME (CI) ✓</text>
      <g stroke="#10B981" stroke-width="4" stroke-linecap="round">
        <path d="M20 44V20H44M380 44V20H356M20 206V230H44M380 206V230H356"/>
      </g>
      <rect x="100" y="6" width="200" height="22" rx="11" fill="#10B981"/>
      <text x="200" y="21" fill="#022C22" font-size="10" font-weight="900" text-anchor="middle">CARTE GRISE CONFORME ✓</text>
    </svg>
  `)}`
};
