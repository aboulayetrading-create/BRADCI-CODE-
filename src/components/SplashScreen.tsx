import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { ShieldCheck, Truck, ArrowRight, X } from 'lucide-react';

interface SplashScreenProps {
  onDismiss?: () => void;
  autoHideDuration?: number; // ms, e.g. 1500
  forceOpen?: boolean;
}

/**
 * Autonomous Native-like Mobile Android & Web Splash Screen
 * Features the official BRAD'CI Shield, Delivery Truck & Escrow Tagline
 * Built with pure React & SVG, zero external assets required.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onDismiss,
  autoHideDuration = 1800,
  forceOpen = false
}) => {
  const [visible, setVisible] = useState(() => {
    if (forceOpen) return true;
    // Show on first visit in the current session
    const hasSeenSplash = sessionStorage.getItem('bradci_splash_seen');
    return !hasSeenSplash;
  });

  const [fadeState, setFadeState] = useState<'entering' | 'visible' | 'exiting'>('entering');

  useEffect(() => {
    if (!visible) return;

    // Transition to visible
    const enterTimer = setTimeout(() => {
      setFadeState('visible');
    }, 50);

    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, autoHideDuration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [visible, autoHideDuration]);

  const handleDismiss = () => {
    setFadeState('exiting');
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('bradci_splash_seen', 'true');
      if (onDismiss) onDismiss();
    }, 350);
  };

  if (!visible) return null;

  return (
    <div 
      id="bradci-splash-screen"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#06102E] via-[#08153D] to-[#0A194F] text-white select-none cursor-pointer transition-opacity duration-300 ${
        fadeState === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] bg-[#1D4ED8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#F97316]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar / Status */}
      <div className="w-full max-w-sm flex items-center justify-between pt-3 relative z-10">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>APP OFFICIELLE v2.5</span>
        </span>

        <button 
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-900/60 border border-slate-700/60 transition-colors"
          title="Fermer le Splash"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Logo Showcase (Image reproduction) */}
      <div className="my-auto flex flex-col items-center justify-center relative z-10 scale-100 sm:scale-110">
        {/* Full Official Autonomous SVG Logo */}
        <Logo 
          variant="full" 
          size="2xl" 
          showSubtitle={true}
          subtitleText="ENCHÈRES • PAIEMENT SÉQUESTRÉ • LIVRAISON GPS"
          className="drop-shadow-2xl"
        />

        {/* Dynamic Security & Logistics Highlights */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-xs sm:max-w-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-semibold shadow">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Séquestre 100% Garanti</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-semibold shadow">
            <Truck className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Remise en Main Propre</span>
          </div>
        </div>
      </div>

      {/* Footer Tap-to-Continue indication */}
      <div className="w-full max-w-xs text-center space-y-2 pb-4 relative z-10">
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#F97316] to-transparent mx-auto rounded-full animate-pulse" />
        <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
          <span>Touchez pour entrer</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
