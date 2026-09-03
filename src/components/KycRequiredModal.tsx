import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Sparkles, 
  ShoppingBag, 
  Tag, 
  Gavel, 
  FileText, 
  ExternalLink 
} from 'lucide-react';

export const KycRequiredModal: React.FC = () => {
  const {
    currentUser,
    kycRequiredModalOpen,
    setKycRequiredModalOpen,
    kycRestrictionAction,
    setKycModalOpen,
    setActiveTab,
    adminInstantApproveMyKYC,
    translate,
    addToast
  } = useApp();

  if (!kycRequiredModalOpen) {
    return null;
  }

  const isPending = currentUser?.kycStatus === 'pending';
  const isVerified = currentUser?.kycStatus === 'verified' || currentUser?.role === 'admin';

  // If already verified, do not show
  if (isVerified) {
    return null;
  }

  const getActionLabel = () => {
    switch (kycRestrictionAction) {
      case 'sell':
        return {
          badge: translate("Mise en vente d'article", "Publishing / Selling"),
          icon: <Tag className="w-3.5 h-3.5 text-amber-400" />,
          title: translate("Vérification requise pour vendre", "Verification required to sell"),
          description: translate(
            "La vente sur BRAD'CI nécessite une identité certifiée pour garantir des articles conformes et protéger la communauté des acheteurs.",
            "Selling on BRAD'CI requires a certified identity to guarantee authentic items and protect the buyer community."
          )
        };
      case 'bid':
        return {
          badge: translate("Participation aux Enchères", "Auction Bidding"),
          icon: <Gavel className="w-3.5 h-3.5 text-amber-400" />,
          title: translate("Vérification requise pour enchérir", "Verification required to bid"),
          description: translate(
            "Toute offre déposée engage la responsabilité de l'enchérisseur. La certification KYC garantit l'authenticité des participants.",
            "Every placed bid is legally binding. KYC certification ensures all participants are authentic verified individuals."
          )
        };
      case 'buy':
      default:
        return {
          badge: translate("Finalisation de commande / Achat", "Order Finalization / Purchase"),
          icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />,
          title: translate("Vérification requise pour acheter", "Verification required to purchase"),
          description: translate(
            "Pour sécuriser la livraison, la collecte et le paiement séquestre ou direct, la vérification d'identité est indispensable.",
            "To secure delivery, pickup, and escrow or direct payments, identity verification is strictly required."
          )
        };
    }
  };

  const actionInfo = getActionLabel();

  const handleRedirectToKyc = () => {
    setKycRequiredModalOpen(false);
    // Redirect user to the profile KYC verification page & launch the KYC submission modal
    setActiveTab('dashboard_client');
    setTimeout(() => {
      setKycModalOpen(true);
    }, 200);
  };

  const handleViewProfile = () => {
    setKycRequiredModalOpen(false);
    setActiveTab('dashboard_client');
  };

  const handleQuickDemoVerify = () => {
    adminInstantApproveMyKYC();
    setKycRequiredModalOpen(false);
    addToast(
      translate("Identité Validée (Mode Démo)", "Identity Verified (Demo Mode)"),
      translate("Votre profil est désormais certifié KYC. Vous pouvez acheter et vendre librement !", "Your profile is now KYC certified. You can freely buy and sell!"),
      'success'
    );
  };

  return (
    <div 
      id="kyc-required-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setKycRequiredModalOpen(false)}
    >
      <div 
        id="kyc-required-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0C121E] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative text-slate-100 space-y-5 overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0 shadow-lg shadow-amber-500/10">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white font-display">
                  {translate("Vérification d'Identité Requise", "Identity Verification Required")}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300">
                  {actionInfo.icon}
                  <span>{actionInfo.badge}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {translate("Protocole de confiance & sécurité des transactions BRAD'CI", "BRAD'CI trust & transaction security protocol")}
              </p>
            </div>
          </div>

          <button
            id="btn-close-kyc-required-modal"
            type="button"
            onClick={() => setKycRequiredModalOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
            title={translate("Fermer", "Close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Message Block (verbatim from prompt requirement) */}
        <div 
          id="kyc-required-notice-box"
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-amber-950/20 border border-amber-500/30 text-amber-100 space-y-2 shadow-inner"
        >
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-amber-100">
              « Pour sécuriser vos transactions, la validation de votre identité (KYC) est requise pour acheter ou vendre sur BRAD'CI. Si votre dossier est déjà envoyé, il est actuellement en cours de vérification. »
            </p>
          </div>
          <p className="text-[11px] text-slate-300 pl-7 leading-normal">
            {actionInfo.description}
          </p>
        </div>

        {/* State-Specific Status Block */}
        {isPending ? (
          <div 
            id="kyc-pending-status-panel"
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                {translate("Statut de votre dossier :", "Dossier review status:")}
              </span>
              {/* Discreet badge as required by prompt */}
              <span 
                id="badge-kyc-under-review"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{translate("KYC en cours de vérification", "KYC under verification")}</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {translate(
                "Vos documents officiels (Pièce d'identité et Selfie biométrique) ont bien été réceptionnés par notre équipe de sécurité. L'analyse est actuellement en cours (délai moyen de traitement : 15 à 30 minutes).",
                "Your official documents (ID and biometric selfie) were successfully received. Verification is currently in progress (average review time: 15-30 minutes)."
              )}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{translate("Vous serez notifié dès que votre compte sera certifié.", "You will be notified as soon as your account is approved.")}</span>
            </div>
          </div>
        ) : (
          <div 
            id="kyc-unverified-status-panel"
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                {translate("Statut de votre dossier :", "Dossier status:")}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                {translate("Pièces non soumises", "Documents not submitted")}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {translate(
                "Vous n'avez pas encore soumis vos pièces d'identité. La procédure est 100% en ligne, instantanée et ne prend que 2 minutes : photo recto de votre CNI ou Passeport + selfie en direct.",
                "You have not submitted your identification documents yet. The process is 100% digital, fast, and takes less than 2 minutes: front photo of your ID or Passport + live selfie."
              )}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {isPending ? (
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                id="btn-kyc-check-profile"
                type="button"
                onClick={handleViewProfile}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{translate("Consulter mon Profil & Dossier", "View Profile & Dossier")}</span>
              </button>

              <button
                id="btn-kyc-continue-browsing"
                type="button"
                onClick={() => setKycRequiredModalOpen(false)}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{translate("Continuer à Explorer le Catalogue", "Keep Exploring Catalog")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                id="btn-kyc-verify-now"
                type="button"
                onClick={handleRedirectToKyc}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>{translate("Vérifier mon Identité (KYC)", "Verify My Identity (KYC)")}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                id="btn-kyc-browse-catalog"
                type="button"
                onClick={() => setKycRequiredModalOpen(false)}
                className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs border border-slate-800 transition-all text-center cursor-pointer"
              >
                {translate("Explorer le Catalogue", "Explore Catalog")}
              </button>
            </div>
          )}

          {/* Quick Demo Instant Approval Button for Testing */}
          <div className="pt-2 flex items-center justify-center">
            <button
              id="btn-kyc-instant-demo-approve"
              type="button"
              onClick={handleQuickDemoVerify}
              className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1 underline underline-offset-2"
              title="Permet de certifier immédiatement le profil pour tester les flux d'achat et de vente"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{translate("⚡ Valider instantanément mon KYC (Mode Démo / Test)", "⚡ Instant Approve KYC (Demo / Testing)")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
