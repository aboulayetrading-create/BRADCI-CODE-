import React from 'react';

/**
 * Composant Header BRAD'CI avec affichage du logo local autonome
 * Optimisé pour le packaging APK Android hors-ligne
 */
export const Header = ({ 
  title = "BRAD'CI", 
  subtitle = "Enchères Express & Déstockage", 
  className = "",
  onLogoClick 
}) => {
  return (
    <header className={`flex items-center justify-between p-3 select-none ${className}`}>
      <div 
        onClick={onLogoClick} 
        className={`flex items-center gap-2.5 ${onLogoClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      >
        <img 
          src="/logo.png" 
          alt="BRAD'CI Logo" 
          className="w-10 h-10 object-contain rounded-xl shadow-md"
          onError={(e) => { 
            const target = e.currentTarget;
            if (target.getAttribute('src') === '/logo.png') {
              target.src = '/icon.png';
            } else {
              target.src = './icon.png';
            }
          }} 
        />
        <div className="flex flex-col justify-center">
          <span className="text-white font-black text-xl tracking-tight leading-none font-['Syne',sans-serif]">
            BRAD'<span className="text-[#F97316]">CI</span>
          </span>
          {subtitle && (
            <span className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
