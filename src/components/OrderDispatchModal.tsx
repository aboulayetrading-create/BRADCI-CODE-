import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bike, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  X, 
  Volume2, 
  AlertTriangle, 
  Navigation, 
  DollarSign, 
  ShieldCheck,
  Phone
} from 'lucide-react';
import { playOrderAlertSound, playSuccessChime } from '../utils/voiceNavigator';

export const OrderDispatchModal: React.FC = () => {
  const { 
    pendingOrderOffer, 
    orderOfferCountdown, 
    driverAcceptIncomingOffer, 
    driverDeclineIncomingOffer,
    currentUser,
    language
  } = useApp();

  if (!pendingOrderOffer || !currentUser || currentUser.role !== 'driver') {
    return null;
  }

  const job = pendingOrderOffer;
  const progressPercent = Math.max(0, Math.min(100, (orderOfferCountdown / 30) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div 
        id="order-dispatch-modal"
        className="w-full max-w-lg bg-[#0A0F1D] border-2 border-amber-500 rounded-3xl p-5 sm:p-7 shadow-2xl relative shadow-amber-500/20 animate-in zoom-in-95 duration-200"
      >
        {/* Animated Pulsing Ring Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              NOUVELLE COURSE DISPONIBLE !
            </span>
          </div>

          <button
            onClick={driverDeclineIncomingOffer}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 30-Second Countdown Dial */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl font-mono-num shadow-lg shadow-amber-500/30">
              {orderOfferCountdown}s
            </div>
            <div>
              <p className="text-xs font-bold text-white">Temps restant pour accepter :</p>
              <p className="text-[11px] text-amber-300">
                Course attribuée en priorité selon votre proximité GPS
              </p>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-400 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 mb-5">
          {/* Article Info */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <img 
              src={job.productImage} 
              alt={job.productTitle} 
              className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Colis #{job.id.substring(0, 8)}
              </span>
              <h4 className="text-sm font-bold text-white truncate mt-1">
                {job.productTitle}
              </h4>
              <p className="text-[11px] text-slate-400">
                Valeur déclarée : {job.itemValue.toLocaleString()} FCFA (Séquestre vérifié)
              </p>
            </div>
          </div>

          {/* Trajectory Route */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                A
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Récupération (Vendeur) :
                </span>
                <span className="font-bold text-white text-xs">
                  {job.pickupCommune} - {job.pickupAddress}
                </span>
                <p className="text-[10px] text-slate-400">Contact : {job.sellerName}</p>
              </div>
            </div>

            <div className="w-0.5 h-3 bg-slate-700 ml-3" />

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                B
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Livraison (Acheteur) :
                </span>
                <span className="font-bold text-white text-xs">
                  {job.dropoffCommune} - {job.dropoffAddress}
                </span>
                <p className="text-[10px] text-slate-400">Client : {job.buyerName}</p>
              </div>
            </div>
          </div>

          {/* Delivery Remuneration */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Gain Net Livreur :</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono-num">
                  +{job.deliveryFee.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Véhicule Requis</span>
              <span className="text-xs font-bold text-white uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                🛵 {job.requiredVehicle}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-decline-dispatch"
            type="button"
            onClick={driverDeclineIncomingOffer}
            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4 text-red-400" />
            <span>Refuser ({orderOfferCountdown}s)</span>
          </button>

          <button
            id="btn-accept-dispatch"
            type="button"
            onClick={driverAcceptIncomingOffer}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 animate-pulse"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accepter la Course</span>
          </button>
        </div>
      </div>
    </div>
  );
};
