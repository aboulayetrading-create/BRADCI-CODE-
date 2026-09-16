import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bike, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  ShieldCheck, 
  RotateCcw, 
  X, 
  ChevronRight,
  Clock,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react';
import { DeliveryJob } from '../types';

export const LiveDeliveryStatusBar: React.FC = () => {
  const { 
    currentUser, 
    freightJobs, 
    setGpsTrackingJob, 
    driverDeclareArrival, 
    driverSetInspectionVerdict,
    buyerCancelAndReturnPackage,
    setActiveTab,
    setNotificationsModalOpen
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [returnReason, setReturnReason] = useState('Produit non conforme à la description');
  const [showBuyerReturnModal, setShowBuyerReturnModal] = useState(false);

  if (!currentUser) return null;

  // Find the most relevant active job for current user
  let activeJob: DeliveryJob | undefined;

  if (currentUser.role === 'driver') {
    activeJob = freightJobs.find(
      j => (j.assignedDriverId === currentUser.id || j.assignedDriverName === currentUser.name) &&
           ['accepted', 'picked_up', 'in_transit', 'arrived', 'returning'].includes(j.status)
    );
  } else if (currentUser.role === 'client') {
    // Check if buyer
    activeJob = freightJobs.find(
      j => j.buyerName.toLowerCase() === currentUser.name.toLowerCase() &&
           ['picked_up', 'in_transit', 'arrived', 'returning'].includes(j.status)
    );

    // If no buyer job, check if seller has active dispatched job
    if (!activeJob) {
      activeJob = freightJobs.find(
        j => (j.sellerName.toLowerCase().includes(currentUser.name.toLowerCase()) || currentUser.shop?.name === j.sellerName) &&
             ['accepted', 'picked_up', 'in_transit', 'arrived', 'returning'].includes(j.status)
      );
    }
  }

  if (!activeJob) return null;

  const isDriver = currentUser.role === 'driver' || activeJob.assignedDriverId === currentUser.id;
  const isBuyer = currentUser.name.toLowerCase() === activeJob.buyerName.toLowerCase();
  const isSeller = !isDriver && !isBuyer;

  if (collapsed) {
    return (
      <aside aria-label="Course en direct" className="fixed top-16 right-4 z-40 animate-in slide-in-from-right-2">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/95 border border-emerald-500/50 shadow-xl shadow-emerald-950/40 text-emerald-400 text-xs font-bold backdrop-blur-md hover:scale-105 transition-all"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <Bike className="w-4 h-4 text-emerald-400" />
          <span>Course en direct : {activeJob.dropoffCommune}</span>
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Bandeau de course en direct" className="w-full mb-4 animate-in fade-in slide-in-from-top-3">
      <div className="rounded-2xl bg-gradient-to-r from-[#0C1524] via-[#0E1B2E] to-[#0A1220] border-2 border-emerald-500/40 shadow-2xl p-3.5 sm:p-4 text-slate-100 relative overflow-hidden backdrop-blur-xl">
        
        {/* Subtle background pulse */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Bike className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-emerald-400 flex items-center gap-1.5">
              <span>Course Fret en Direct</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-[200px]">
              {activeJob.productTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setGpsTrackingJob(activeJob!)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1 transition-all"
            >
              <Navigation className="w-3 h-3" />
              <span>Ouvrir GPS</span>
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="text-slate-400 hover:text-white text-xs p-1"
              title="Réduire le bandeau"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Left: Info details */}
          <div className="space-y-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white font-bold text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{activeJob.pickupCommune} → {activeJob.dropoffCommune}</span>
              </span>

              {/* Status Badge */}
              {activeJob.status === 'in_transit' && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>En déplacement (ETA: ~{activeJob.etaMinutes || 12} min)</span>
                </span>
              )}

              {activeJob.status === 'arrived' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black flex items-center gap-1 animate-pulse">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Livreur Arrivé sur Place</span>
                </span>
              )}

              {activeJob.status === 'returning' && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  <span>Colis en Retour vers Boutique</span>
                </span>
              )}
            </div>

            <p className="text-slate-400 text-xs">
              {isDriver && (
                <span>Destinataire : <strong>{activeJob.buyerName}</strong> ({activeJob.dropoffAddress}) • Rémunération : <strong className="text-emerald-400 font-mono-num">{activeJob.deliveryFee.toLocaleString('fr-FR')} FCFA</strong></span>
              )}
              {isBuyer && (
                <span>Livreur assigné : <strong>{activeJob.assignedDriverName || 'Bakary Traoré'}</strong> • Téléphone : <strong className="text-amber-400 font-mono">{activeJob.assignedDriverPhone || '+225 01 44 77 89 22'}</strong></span>
              )}
              {isSeller && (
                <span>Livraison chez <strong>{activeJob.buyerName}</strong> par le coursier <strong>{activeJob.assignedDriverName || 'Bakary Traoré'}</strong>. Séquestre sécurisé.</span>
              )}
            </p>
          </div>

          {/* Right: Dynamic Role Action Controls */}
          <div className="w-full md:w-auto shrink-0 flex flex-wrap items-center gap-2">
            
            {/* 1. DRIVER ACTIONS */}
            {isDriver && (
              <>
                {activeJob.status === 'in_transit' && (
                  <button
                    onClick={() => driverDeclareArrival(activeJob!.id)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                  >
                    <MapPin className="w-4 h-4 text-slate-950" />
                    <span>📍 Je suis arrivé chez le client</span>
                  </button>
                )}

                {activeJob.status === 'arrived' && (
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold sm:hidden">Constat Physique Colis :</span>
                    
                    <button
                      onClick={() => driverSetInspectionVerdict(activeJob!.id, 'client_confirmed_good')}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        activeJob.inspectionStatus === 'client_confirmed_good'
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                          : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Client confirme : Colis Bon / Conforme</span>
                    </button>

                    <button
                      onClick={() => driverSetInspectionVerdict(activeJob!.id, 'client_confirmed_bad')}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        activeJob.inspectionStatus === 'client_confirmed_bad'
                          ? 'bg-red-600 text-white ring-2 ring-red-400'
                          : 'bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>Client constate : Non-Conforme / Mauvais</span>
                    </button>
                  </div>
                )}

                <a
                  href={`tel:${activeJob.buyerPhone}`}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Appeler Client</span>
                </a>
              </>
            )}

            {/* 2. BUYER ACTIONS */}
            {isBuyer && (
              <>
                {/* When driver is still moving */}
                {activeJob.status === 'in_transit' && (
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Vérification & Validation bloquées jusqu'à l'arrivée du livreur</span>
                    </div>
                  </div>
                )}

                {/* When driver is arrived on site */}
                {activeJob.status === 'arrived' && (
                  <div className="flex flex-wrap items-center gap-2">
                    {activeJob.inspectionStatus === 'client_confirmed_good' ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-emerald-300 font-bold">
                          Code Secret à donner au livreur : <strong className="font-mono-num text-sm text-white bg-slate-950 px-2 py-0.5 rounded ml-1 border border-emerald-500/30">{activeJob.deliveryOtpCode}</strong>
                        </span>
                      </div>
                    ) : activeJob.inspectionStatus === 'client_confirmed_bad' ? (
                      <button
                        onClick={() => setShowBuyerReturnModal(true)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg flex items-center gap-1.5 animate-pulse"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Confirmer le Refus & Déclencher le Retour Sécurisé</span>
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>Livreur sur place : Vérifiez le colis ensemble face-à-face</span>
                      </div>
                    )}
                  </div>
                )}

                {activeJob.status === 'returning' && (
                  <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retour en cours • Code Secret de Retour : <strong className="font-mono text-white bg-slate-950 px-1.5 py-0.5 rounded">{activeJob.returnOtpCode || '4921'}</strong></span>
                  </div>
                )}
              </>
            )}

            {/* 3. SELLER VIEW */}
            {isSeller && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  Fonds de vente protégés sous séquestre
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buyer Quick Cancellation Dialog */}
      {showBuyerReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0C121E] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-500 dark:text-red-400 flex items-center justify-center border border-red-500/30">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Refuser & Retourner le Colis</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Garantie Conformité Brad'CI</p>
                </div>
              </div>
              <button
                onClick={() => setShowBuyerReturnModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg bg-slate-100 dark:bg-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-red-600 dark:text-red-400">Modalités de Remboursement & Frais :</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>La valeur de l'article ({activeJob.itemValue?.toLocaleString('fr-FR') || '0'} FCFA) est immédiatement recréditée sur votre solde disponible Wave.</li>
                <li>Les frais de livraison ({activeJob.deliveryFee.toLocaleString('fr-FR')} FCFA) restent acquis au livreur pour son déplacement.</li>
                <li>Un Code Secret de Retour sera généré pour le livreur.</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Motif de non-conformité :</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Produit non conforme à la description de l'annonce">Produit non conforme à la description</option>
                <option value="Article défectueux ou endommagé">Article défectueux ou endommagé</option>
                <option value="Modèle, taille ou couleur erronée">Modèle, taille ou couleur erronée</option>
                <option value="Article non authentique suspecté">Article non authentique suspecté</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBuyerReturnModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-800"
              >
                Conserver le Colis
              </button>
              <button
                onClick={() => {
                  buyerCancelAndReturnPackage(activeJob!.id, returnReason);
                  setShowBuyerReturnModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg"
              >
                Valider le Refus & Retour
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
