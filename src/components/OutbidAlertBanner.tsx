import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ArrowUpRight, X, BellRing, Sparkles, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OutbidAlertBanner: React.FC = () => {
  const { 
    activeOutbidAlert, 
    dismissOutbidAlert, 
    products, 
    setProductDetailModal, 
    placeBid,
    translate 
  } = useApp();

  if (!activeOutbidAlert) return null;

  const prod = products.find(p => p.id === activeOutbidAlert.productId);
  const nextIncrement = 5000;
  const counterBidAmount = activeOutbidAlert.newAmount + nextIncrement;

  const handleTakeBackLead = () => {
    if (prod) {
      setProductDetailModal(prod);
      placeBid(activeOutbidAlert.productId, counterBidAmount);
      dismissOutbidAlert();
    }
  };

  const handleOpenProduct = () => {
    if (prod) {
      setProductDetailModal(prod);
      dismissOutbidAlert();
    }
  };

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Alerte de surenchère en direct"
        id="outbid-instant-alert-banner"
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="fixed top-2 sm:top-4 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-50 pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#0B101D]/95 border-2 border-red-500/70 shadow-2xl shadow-red-500/30 backdrop-blur-xl p-3 sm:p-4 text-white">
          {/* Subtle animated red ambient glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            {/* Left alert icon badge */}
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5 animate-pulse">
              <BellRing className="w-5 h-5 text-red-400" />
            </div>

            {/* Middle body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                  <Flame className="w-3 h-3 animate-bounce" />
                  <span>{translate("Surenchère En Direct", "Live Outbid Alert")}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeOutbidAlert.timestamp}
                </span>
              </div>

              {/* Exact user requirement statement: "Un utilisateur a surenchéri à 6 000 000 FCFA. Reprenez la main !" */}
              <p className="text-xs sm:text-sm text-slate-100 font-medium leading-snug">
                Un utilisateur a surenchéri à{' '}
                <strong className="text-amber-300 font-mono-num font-black text-sm sm:text-base">
                  {activeOutbidAlert.newAmount.toLocaleString('fr-FR')} FCFA
                </strong>
                {prod ? ` sur "${prod.title}"` : ''}.{' '}
                <span className="text-red-300 font-bold">Reprenez la main !</span>
              </p>

              {/* Interactive Quick Action Buttons */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <button
                  id="btn-outbid-take-lead"
                  type="button"
                  onClick={handleTakeBackLead}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-red-500/20 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {translate(
                      `⚡ Reprendre la main (+${nextIncrement.toLocaleString('fr-FR')} F)`,
                      `⚡ Take back lead (+${nextIncrement.toLocaleString('fr-FR')} F)`
                    )}
                  </span>
                </button>

                <button
                  id="btn-outbid-view-product"
                  type="button"
                  onClick={handleOpenProduct}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{translate("Voir l'enchère", "View Auction")}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              id="btn-close-outbid-banner"
              type="button"
              onClick={dismissOutbidAlert}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title={translate("Fermer l'alerte", "Dismiss alert")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
