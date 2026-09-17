import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Bike, 
  Store, 
  ShoppingBag, 
  ShieldCheck,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, translate } = useApp();

  return (
    <div 
      id="bradci-toast-container"
      className="fixed top-3 sm:top-5 left-0 right-0 z-[999999] pointer-events-none flex flex-col items-center gap-2 px-3 sm:px-4"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          let Icon = Info;
          let glowBorder = 'border-sky-500/30 shadow-sky-500/10';
          let iconBg = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
          let progressBg = 'bg-sky-400';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            glowBorder = 'border-emerald-500/35 shadow-emerald-500/15';
            iconBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
            progressBg = 'bg-emerald-400';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            glowBorder = 'border-rose-500/35 shadow-rose-500/15';
            iconBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
            progressBg = 'bg-rose-400';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            glowBorder = 'border-amber-500/35 shadow-amber-500/15';
            iconBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
            progressBg = 'bg-amber-400';
          }

          // Role Badge configuration
          let RoleIcon: React.ElementType | null = null;
          let roleLabel = '';
          let roleBadgeClass = '';

          if (toast.role === 'driver') {
            RoleIcon = Bike;
            roleLabel = translate('Livreur', 'Driver');
            roleBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/35';
          } else if (toast.role === 'seller') {
            RoleIcon = Store;
            roleLabel = translate('Vendeur', 'Seller');
            roleBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/35';
          } else if (toast.role === 'buyer') {
            RoleIcon = ShoppingBag;
            roleLabel = translate('Acheteur', 'Buyer');
            roleBadgeClass = 'bg-teal-500/20 text-teal-300 border-teal-500/35';
          } else if (toast.role === 'admin') {
            RoleIcon = ShieldCheck;
            roleLabel = 'Brad\'CI';
            roleBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/35';
          }

          const durationSec = ((toast.duration || 3200) / 1000);

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.94, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.5, bottom: 0.1 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -15 || info.velocity.y < -200) {
                  removeToast(toast.id);
                }
              }}
              className={`pointer-events-auto relative overflow-hidden w-full max-w-[94%] sm:max-w-md rounded-2xl border backdrop-blur-2xl bg-slate-950/95 dark:bg-[#070D18]/98 shadow-[0_12px_36px_rgba(0,0,0,0.55)] p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group touch-pan-y ${glowBorder}`}
              onClick={() => removeToast(toast.id)}
              role="alert"
            >
              {/* Type / Status Icon Badge */}
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${iconBg}`}>
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              {/* Text & Meta Information */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Role Chip */}
                  {roleLabel && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${roleBadgeClass}`}>
                      {RoleIcon && <RoleIcon className="w-2.5 h-2.5" />}
                      <span>{roleLabel}</span>
                    </span>
                  )}
                  <h4 className="font-extrabold text-xs sm:text-[13px] text-white tracking-tight truncate">
                    {toast.title}
                  </h4>
                </div>
                {toast.desc && (
                  <p className="text-[11px] sm:text-xs text-slate-300/90 truncate leading-snug mt-0.5">
                    {toast.desc}
                  </p>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title={translate("Fermer", "Close")}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Smooth Progress Shrink Line */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: durationSec, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-[2px] ${progressBg} opacity-60`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
