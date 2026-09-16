import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Store, 
  Gavel, 
  PhoneOff, 
  Clock, 
  CheckCircle2, 
  Scale, 
  FileText,
  AlertOctagon
} from 'lucide-react';
import { BRAD_CI_TERMS } from '../utils/fraudFilter';

export const TermsAndConditionsModal: React.FC = () => {
  const { 
    termsModalOpen, 
    setTermsModalOpen, 
    acceptTermsAndConditions, 
    currentUser,
    translate 
  } = useApp();

  if (!termsModalOpen) return null;

  const handleAccept = () => {
    acceptTermsAndConditions();
    setTermsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="terms-conditions-modal" 
        className="w-full max-w-3xl bg-white dark:bg-[#0C121E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-200"
      >
        {/* Close Button */}
        <button
          onClick={() => setTermsModalOpen(false)}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/20 mb-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{translate("Cadre Légal & Réglementaire", "Legal & Regulatory Framework")}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display">
              {translate("Conditions Générales d'Utilisation & Charte Anti-Fraude BRAD'CI", "Terms of Service & Anti-Fraud Charter BRAD'CI")}
            </h2>
          </div>
        </div>

        {/* Key Rules Highlight Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 shrink-0">
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 text-xs">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-1">
              <PhoneOff className="w-4 h-4 shrink-0" />
              <span>{translate("Zéro Contact Direct Public", "Zero Public Direct Contact")}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              {translate("Numéros et WhatsApp interdits sur les annonces. 3 avertissements = Suspension définitive du compte.", "Phone numbers & WhatsApp forbidden on listings. 3 strikes = permanent suspension.")}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{translate("Séquestre Wave/MoMo", "Wave/MoMo Escrow")}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              {translate("Fonds 100% sécurisés. Déblocage uniquement après validation par Code Secret en main propre lors de la livraison.", "Funds 100% protected. Released only after physical secret code delivery validation.")}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 text-xs">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-1">
              <Store className="w-4 h-4 shrink-0" />
              <span>{translate("Stock & Délais Rétractation", "Stock & Auto-Purge")}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              {translate("Stock obligatoire pour boutiques. Masqué à 0 stock et auto-suppression après 14 jours si non réapprovisionné.", "Stock required for shops. Hidden at 0 stock and deleted after 14 days without restock.")}
            </p>
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 leading-relaxed font-sans select-text">
          {BRAD_CI_TERMS.rules.map((rule, idx) => (
            <section key={rule.id} className={`space-y-1.5 ${idx > 0 ? 'pt-3 border-t border-slate-200 dark:border-slate-800/60' : ''}`}>
              <h3 className="font-bold text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1.5">
                {idx === 0 ? <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> :
                 idx === 1 ? <PhoneOff className="w-4 h-4 text-rose-500 dark:text-rose-400" /> :
                 idx === 2 ? <AlertOctagon className="w-4 h-4 text-amber-500 dark:text-amber-400" /> :
                 idx === 3 ? <Store className="w-4 h-4 text-blue-500 dark:text-blue-400" /> :
                 <Clock className="w-4 h-4 text-purple-500 dark:text-purple-400" />}
                <span>{rule.title}</span>
              </h3>
              <p>{rule.desc}</p>
            </section>
          ))}
        </div>

        {/* Action Footer */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            {currentUser?.termsAccepted ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{translate("CGU & Charte acceptées pour ce compte", "Terms accepted for this account")}</span>
              </span>
            ) : (
              <span>{translate("En acceptant, vous vous engagez à respecter le séquestre sécurisé.", "By accepting, you commit to respecting the secure escrow policy.")}</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setTermsModalOpen(false)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {translate("Fermer", "Close")}
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{translate("J'Accepte la Charte & les CGU", "I Accept the Charter & Terms")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
