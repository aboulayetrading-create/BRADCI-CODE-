import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = Info;
          let borderCol = 'border-blue-500/30 bg-slate-900/95 text-blue-400';
          
          if (toast.type === 'success') {
            Icon = CheckCircle2;
            borderCol = 'border-emerald-500/40 bg-[#0B1416]/95 text-emerald-400';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            borderCol = 'border-red-500/40 bg-[#160B0E]/95 text-red-400';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            borderCol = 'border-amber-500/40 bg-[#181108]/95 text-amber-400';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${borderCol}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 pr-2">
                <h4 className="font-bold text-sm text-slate-100">{toast.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.desc}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
