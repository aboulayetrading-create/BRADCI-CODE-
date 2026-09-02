import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles,
  Lock
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

export const KYCGateBanner: React.FC = () => {
  const { 
    currentUser, 
    setKycModalOpen
  } = useApp();

  if (!currentUser || currentUser.role === 'admin' || currentUser.kycStatus === 'verified') {
    return null;
  }

  const isPending = currentUser.kycStatus === 'pending';
  const isRejected = currentUser.kycStatus === 'rejected';
  const isUnverified = currentUser.kycStatus === 'unverified' || !currentUser.kycStatus;

  return (
    <aside 
      id="kyc-gate-banner"
      aria-label="Statut de vérification KYC"
      className={`w-full py-2.5 px-3 sm:px-6 border-b transition-all ${
        isPending 
          ? 'bg-amber-950/70 border-amber-500/40 text-amber-200' 
          : isRejected 
          ? 'bg-red-950/80 border-red-500/50 text-red-200' 
          : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-center sm:text-left">
          {isPending ? (
            <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          ) : isRejected ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
          )}

          <div>
            <span className="font-extrabold mr-1">
              {isPending 
                ? '🔒 Compte en attente de vérification KYC par l\'administration (Délai d\'attente max : 24h).' 
                : isRejected 
                ? '❌ Dossier KYC Rejeté par la Sécurité.' 
                : '🛡️ Vérification d\'Identité KYC Requise :'}
            </span>
            <span className="opacity-90 hidden md:inline">
              {isPending 
                ? 'Les fonctionnalités complètes seront actives dès validation de vos pièces.' 
                : isRejected 
                ? 'Veuillez soumettre à nouveau vos pièces d\'identité conformes.' 
                : 'Obligatoire pour enchérir, vendre et effectuer des livraisons en toute sécurité.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="kyc-banner-btn-submit"
            onClick={() => setKycModalOpen(true)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all ${
              isPending 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' 
                : isRejected 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20' 
                : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            <span>{isPending ? 'Voir mon Dossier' : 'Soumettre mes Pièces'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
