import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Gavel, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  Crown, 
  ArrowRight,
  RotateCcw,
  UserX,
  Volume2
} from 'lucide-react';

export const FiveBiddersModal: React.FC = () => {
  const { 
    fiveBiddersModalProduct, 
    setFiveBiddersModalProduct, 
    sellerSelectBidder, 
    sellerCancelAuction,
    currentUser,
    translate,
    voiceEnabled,
    language
  } = useApp();

  const [selectedBidderId, setSelectedBidderId] = useState<string>('');

  if (!fiveBiddersModalProduct) return null;

  const prod = fiveBiddersModalProduct;
  const declinedIds = prod.declinedBidderIds || [];
  
  // Sort by amount descending
  const bids = [...prod.bids].sort((a, b) => b.amount - a.amount);
  
  // Eligible bidders are those who have not declined
  const eligibleBids = bids.filter(b => !declinedIds.includes(b.bidderId));
  const highestEligibleBid = eligibleBids[0] || bids[0];

  const currentSelection = selectedBidderId 
    ? bids.find(b => b.bidderId === selectedBidderId && !declinedIds.includes(b.bidderId)) || highestEligibleBid 
    : highestEligibleBid;

  const commission = currentSelection ? currentSelection.amount * prod.commissionRate : 0;
  const sellerNet = currentSelection ? currentSelection.amount - commission : 0;

  const handleValidate = () => {
    if (!currentSelection) return;
    sellerSelectBidder(prod.id, currentSelection.bidderId);
  };

  const handleCancel = () => {
    sellerCancelAuction(prod.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="five-bidders-arbitration-card" 
        className="w-full max-w-2xl bg-[#0C121E] border border-amber-500/30 rounded-3xl p-4 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Close Button */}
        <button
          onClick={() => setFiveBiddersModalProduct(null)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30 mb-2">
            <Gavel className="w-4 h-4" />
            <span>{translate("Règle Métier des 5 Offres Déclenchée", "5-Bid Rule Triggered")}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            {translate("Arbitrage & Choix de l'Acheteur", "Arbitration & Buyer Selection")}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            {translate(
              `Votre article "${prod.title}" a cumulé 5 offres. Choisissez à qui vous souhaitez vendre parmi les enchérisseurs disponibles.`,
              `Your item "${prod.title}" reached 5 offers. Choose whom you want to award the sale to among available bidders.`
            )}
          </p>
          {declinedIds.length > 0 && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-xl text-xs text-red-300">
              <UserX className="w-4 h-4 text-red-400" />
              <span>
                {translate(
                  `${declinedIds.length} acheteur(s) s'est désisté. Choisissez parmi les ${eligibleBids.length} restants.`,
                  `${declinedIds.length} buyer(s) declined. Choose among the remaining ${eligibleBids.length}.`
                )}
              </span>
            </div>
          )}
        </div>

        {/* List of 5 Bidders */}
        <div className="space-y-2.5 mb-6">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {translate("Sélectionnez l'offre à attribuer :", "Select the offer to award:")}
          </label>
          {bids.slice(0, 5).map((bid, index) => {
            const hasDeclined = declinedIds.includes(bid.bidderId);
            const isSelected = !hasDeclined && ((selectedBidderId === bid.bidderId) || (!selectedBidderId && bid.bidderId === highestEligibleBid?.bidderId));

            return (
              <div
                key={bid.id}
                onClick={() => {
                  if (!hasDeclined) setSelectedBidderId(bid.bidderId);
                }}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  hasDeclined 
                    ? 'bg-slate-950/60 border-red-900/30 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/30 cursor-pointer'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    hasDeclined ? 'bg-red-950 text-red-400' : index === 0 ? 'bg-amber-500 text-slate-950 font-mono-num' : 'bg-slate-800 text-slate-300'
                  }`}>
                    #{index + 1}
                  </div>
                  <img 
                    src={bid.bidderAvatar} 
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-slate-700" 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${hasDeclined ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {bid.bidderName}
                      </span>
                      {index === 0 && !hasDeclined && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                          {translate("OFFRE MAX", "TOP BID")}
                        </span>
                      )}
                      {hasDeclined && (
                        <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-1.5 py-0.5 rounded">
                          {translate("DÉSISTÉ", "DECLINED")}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{bid.timestamp} • {bid.bidderCommune || 'Abidjan'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-base font-extrabold font-mono-num ${hasDeclined ? 'text-slate-500 line-through' : 'text-amber-400'}`}>
                    {bid.amount.toLocaleString('fr-FR')} F
                  </span>
                  <span className="text-xs text-slate-400 block font-mono">CFA</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial calculation breakdown based on plan commission */}
        {currentSelection && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              {translate("Détail Financier Paiement Direct à la Livraison :", "Direct Pay on Delivery Financial Breakdown:")}
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{translate("Prix de vente adjugé :", "Winning Bid Price:")}</span>
                <span className="font-mono-num text-white font-semibold">
                  {currentSelection.amount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>
                  {translate("Commission Brad'CI", "Brad'CI Fee")} ({(prod.commissionRate * 100).toFixed(1)}% - Plan {prod.sellerPlan?.toUpperCase()}) :
                </span>
                <span className="font-mono-num text-red-400">
                  - {commission.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                <span className="text-emerald-400">{translate("Montant Net Vendeur :", "Seller Net Payout:")}</span>
                <span className="font-mono-num text-emerald-400 text-base">
                  {sellerNet.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>{translate("Annuler la Vente Sans Frais", "Cancel Auction Without Fees")}</span>
          </button>

          <button
            id="btn-confirm-winner-choice"
            type="button"
            onClick={handleValidate}
            disabled={!currentSelection}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{translate("Attribuer & Lancer la Livraison", "Award & Launch Delivery")}</span>
          </button>
        </div>

        <div className="mt-4 text-center text-slate-500 text-[11px] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{translate("L'acheteur paiera directement à la livraison via API (Wave/MoMo/Carte).", "The buyer will pay directly on delivery via API (Wave/MoMo/Card).")}</span>
        </div>
      </div>
    </div>
  );
};
