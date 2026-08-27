import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bike, 
  Car, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Crown, 
  Clock, 
  DollarSign, 
  KeyRound, 
  Lock, 
  Navigation, 
  ArrowRight, 
  ShieldCheck,
  Phone,
  Compass,
  Power,
  Search,
  Package,
  Layers,
  Star,
  Users,
  Activity,
  ArrowUpRight,
  Receipt,
  FileCheck,
  CreditCard,
  RotateCcw,
  Headphones,
  Camera
} from 'lucide-react';
import { DeliveryJob, VehicleType, PaymentMethod } from '../types';
import { COMMUNE_NAMES_ABIDJAN, COMMUNE_NAMES_ENVIRONS, getCommuneBadgeInfo } from '../data/communes';
import { GoogleMapsEmbed } from './GoogleMapsEmbed';
import { KYCGateBanner } from './KYCGateBanner';

export const DriverDashboard: React.FC = () => {
  const { 
    currentUser, 
    users,
    freightJobs, 
    canDriverTakeDeliveries,
    toggleDriverAvailability,
    switchDriverAccount,
    driverAcceptJob,
    driverConfirmPickup,
    driverDeclareArrival,
    driverSetInspectionVerdict,
    driverConfirmDeliveryOTP,
    driverConfirmReturnOTP,
    requestUserWithdrawal,
    setPricingModalOpen,
    setTargetPlanForPricing,
    setGpsTrackingJob,
    setActiveTab,
    triggerOrderDispatchToDriver,
    setKycModalOpen,
    setProfileAvatarModalOpen
  } = useApp();

  const [activeDriverTab, setActiveDriverTab] = useState<'available_orders' | 'active_mission' | 'history' | 'profile'>('available_orders');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('Tous');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('Toutes');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [returnOtpInput, setReturnOtpInput] = useState('');

  // Driver Withdrawal state
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>('Wave');
  const [withdrawPhone, setWithdrawPhone] = useState(currentUser?.phone || '+225 07 00 00 00 00');

  // All available driver accounts in system
  const availableDriverAccounts = users.filter(u => u.role === 'driver');

  if (!currentUser || currentUser.role !== 'driver') {
    return (
      <div id="driver-access-restricted" className="p-8 max-w-lg mx-auto text-center bg-slate-900/60 rounded-3xl border border-red-500/30">
        <Lock className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Accès Restreint Livreur (RBAC)</h3>
        <p className="text-xs text-slate-300 mt-2">
          Cet espace et la bourse de fret sont strictement réservés aux livreurs agréés Brad'CI.
        </p>
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-3">Sélectionnez un compte livreur disponible pour accéder :</p>
          <div className="flex flex-col gap-2">
            {availableDriverAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => switchDriverAccount(acc.id)}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/40 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <span className="text-xs font-bold text-white block">{acc.name}</span>
                    <span className="text-[10px] text-slate-400">{acc.driverPlan === 'vip_pass' ? 'Pass VIP Illimité' : 'Essai 5 Courses'}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">Activer →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const check = canDriverTakeDeliveries(currentUser);
  const remainingTrial = currentUser.trialDeliveriesRemaining ?? 0;
  const isTrial = currentUser.driverPlan === 'trial';
  const isOnline = currentUser.driverAvailability !== 'offline';

  const myActiveJob = freightJobs.find(j => j.assignedDriverId === currentUser.id && j.status !== 'delivered' && j.status !== 'cancelled');
  const myCompletedJobs = freightJobs.filter(j => j.assignedDriverId === currentUser.id && j.status === 'delivered');

  const availableJobs = freightJobs.filter(j => {
    const matchesStatus = j.status === 'available';
    const matchesVehicle = selectedVehicleFilter === 'Tous' || j.requiredVehicle === selectedVehicleFilter;
    const matchesZone = selectedZoneFilter === 'Toutes' || 
      j.pickupCommune.toLowerCase().includes(selectedZoneFilter.toLowerCase()) || 
      j.dropoffCommune.toLowerCase().includes(selectedZoneFilter.toLowerCase());
    const matchesSearch = orderSearchQuery === '' ||
      j.productTitle.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      j.pickupCommune.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      j.dropoffCommune.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      j.id.toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesStatus && matchesVehicle && matchesZone && matchesSearch;
  });

  const getVehicleIcon = (v: VehicleType) => {
    switch (v) {
      case 'cargo': return <Truck className="w-4 h-4 text-purple-400" />;
      case 'voiture': return <Car className="w-4 h-4 text-blue-400" />;
      default: return <Bike className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handlePickup = (jobId: string) => {
    driverConfirmPickup(jobId, pickupCodeInput);
    setPickupCodeInput('');
  };

  const handleDeliveryOTP = (jobId: string) => {
    driverConfirmDeliveryOTP(jobId, deliveryOtpInput);
    setDeliveryOtpInput('');
  };

  return (
    <div id="driver-dashboard-root" className="space-y-6 pb-12">
      {/* KYC Gate Banner (Strict Driver Verification) */}
      <KYCGateBanner />

      {/* 1. Header Profile, Live Status & Account Switcher */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Driver identity */}
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setProfileAvatarModalOpen(true)}
              className="relative group cursor-pointer"
              title="Cliquez pour changer / importer votre photo de profil"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg group-hover:opacity-85 transition-opacity"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setProfileAvatarModalOpen(true); }}
                className="absolute -bottom-1 -right-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-1.5 rounded-full shadow-lg border border-slate-900 transition-all hover:scale-110"
                title="Changer / Importer ma photo de profil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-white font-display">{currentUser.name}</h2>
                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                  !isTrial
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {!isTrial ? 'PASS VIP ACTIF (6 000 F)' : 'PÉRIODE D\'ESSAI'}
                </span>
                <span className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-700 font-mono-num">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{currentUser.rating || 4.9}</span>
                  <span className="text-slate-400 text-[10px]">({currentUser.reviewCount || 34})</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentUser.phone} • {currentUser.gpsLocation?.commune || 'Abidjan'} • {currentUser.kycStatus === 'verified' ? '✓ Livreur Certifié KYC' : '⚠️ KYC en cours'}
              </p>
              <button
                type="button"
                onClick={() => setProfileAvatarModalOpen(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 mt-1 transition-colors"
              >
                <Camera className="w-3 h-3" />
                <span>Modifier ma photo de profil (Caméra / Galerie)</span>
              </button>
            </div>
          </div>

          {/* Availability Toggle & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {/* Customer Support for Courier */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('bradci_open_support', { detail: { tab: 'human' } }))}
              className="px-3.5 py-2 rounded-2xl font-bold text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              title="Contacter le service client Brad'CI en direct"
            >
              <Headphones className="w-4 h-4" />
              <span>Assistance Brad'CI 24/7</span>
            </button>

            {/* Simulate Incoming 30s Dispatch Offer */}
            {isOnline && (
              <button
                id="btn-simulate-dispatch-order"
                onClick={() => {
                  const jobToOffer = freightJobs.find(j => j.status === 'available') || freightJobs[0];
                  if (jobToOffer) {
                    triggerOrderDispatchToDriver(jobToOffer);
                  }
                }}
                className="px-3.5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-md"
                title="Déclencher la fenêtre d'affectation avec alerte sonore et compte à rebours de 30s"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Simuler Course Entrante (30s)</span>
              </button>
            )}

            {/* Availability status toggle button */}
            <button
              id="driver-toggle-availability-btn"
              onClick={toggleDriverAvailability}
              className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-md ${
                isOnline 
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Power className={`w-4 h-4 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{isOnline ? '🟢 En Service (Disponible)' : '🔴 En Pause (Indisponible)'}</span>
            </button>

            {/* Trial / VIP quota status */}
            <div className={`p-2.5 px-3.5 rounded-2xl border flex items-center gap-2.5 ${
              isTrial && remainingTrial <= 0
                ? 'bg-red-500/15 border-red-500 text-red-200'
                : isTrial
                ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                : 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
            }`}>
              <div>
                <span className="text-[9px] uppercase font-extrabold block text-slate-400">
                  {isTrial ? 'Courses restantes :' : 'Abonnement :'}
                </span>
                <span className="text-sm font-black font-mono-num">
                  {isTrial ? `${remainingTrial} / 5 offertes` : 'Illimité (Pass VIP)'}
                </span>
              </div>
              {isTrial && (
                <button
                  id="driver-header-upgrade-btn"
                  onClick={() => {
                    setTargetPlanForPricing('vip_pass');
                    setPricingModalOpen(true);
                  }}
                  className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-xl font-bold transition-all shadow shrink-0"
                >
                  Pass 6 000 F
                </button>
              )}
            </div>

            {/* Wallet Balance Widget with Retrait Button */}
            <div className="p-2.5 px-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Portefeuille Wave :</span>
                <span className="text-sm font-black text-emerald-400 font-mono-num">
                  {currentUser.walletBalance.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              {currentUser.walletBalance > 0 && (
                <button
                  id="driver-withdraw-btn"
                  onClick={() => {
                    setWithdrawAmount(currentUser.walletBalance.toString());
                    setWithdrawalModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl shadow transition-all flex items-center gap-1 shrink-0"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Retirer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Driver Withdrawal Modal */}
        {withdrawalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Retrait des Gains Livreur</h3>
                    <p className="text-xs text-slate-400">Solde disponible : <strong className="text-emerald-400 font-mono">{currentUser.walletBalance.toLocaleString('fr-FR')} FCFA</strong></p>
                  </div>
                </div>
                <button
                  onClick={() => setWithdrawalModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const num = Number(withdrawAmount);
                  const res = requestUserWithdrawal(num, withdrawMethod, withdrawPhone);
                  if (res.success) {
                    setWithdrawalModalOpen(false);
                  }
                }}
                className="space-y-4 pt-1"
              >
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Moyen de Réception :</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Wave', 'Orange Money', 'MTN MoMo'] as PaymentMethod[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setWithdrawMethod(m)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                          withdrawMethod === m
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {withdrawMethod === 'Wave' ? '✓ Virement Wave direct instantané (0% frais)' : 'Frais de transaction réseau : 1%'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Montant du Virement (FCFA) :</label>
                  <input
                    type="number"
                    min={1000}
                    max={currentUser.walletBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Numéro Mobile Money du Livreur :</label>
                  <input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder="+225 07 XX XX XX XX"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Montant demandé :</span>
                    <span className="font-mono text-white">{Number(withdrawAmount || 0).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net crédité sur votre compte :</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {(Number(withdrawAmount || 0) - (withdrawMethod === 'Wave' ? 0 : Math.round(Number(withdrawAmount || 0) * 0.01))).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawalModalOpen(false)}
                    className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-bold rounded-xl border border-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all"
                  >
                    Valider le Retrait Livreur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Available Accounts Quick Switcher */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Comptes Livreurs Disponibles sur la plateforme :</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {availableDriverAccounts.map((driverAcc) => {
              const isSelected = driverAcc.id === currentUser.id;
              return (
                <button
                  key={driverAcc.id}
                  id={`switch-driver-account-${driverAcc.id}`}
                  onClick={() => switchDriverAccount(driverAcc.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-2 transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img src={driverAcc.avatar} alt={driverAcc.name} className="w-4 h-4 rounded-full object-cover" />
                  <span>{driverAcc.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({driverAcc.driverPlan === 'vip_pass' ? 'VIP' : `${driverAcc.trialDeliveriesRemaining || 0}/5`})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Financial Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Gains Aujourd'hui :</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white font-mono-num">12 500 F</span>
            <span className="text-xs text-emerald-400 font-bold">+ 3 courses</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Gains Hier :</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-200 font-mono-num">18 000 F</span>
            <span className="text-xs text-slate-400 font-bold">5 courses</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Revenus 30 Jours :</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono-num">285 000 F</span>
            <span className="text-xs text-amber-400/80 font-bold">64 courses</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Colis Disponibles :</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono-num">{availableJobs.length}</span>
            <span className="text-xs text-emerald-400/80 font-bold">À pourvoir</span>
          </div>
        </div>
      </div>

      {/* 3. Lock Banner if Trial is 0 and no VIP pass */}
      {isTrial && remainingTrial <= 0 && (
        <div id="driver-locked-trial-banner" className="p-6 rounded-3xl bg-red-500/15 border border-red-500/50 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Bourse de Fret Verrouillée (0 / 5 Courses)</h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
            Vos 5 courses d'essai offertes ont été effectuées. Pour continuer à recevoir des courses et débloquer les virements instantanés Wave, activez votre <strong>Pass Livreur VIP (6 000 FCFA / mois)</strong>.
          </p>
          <button
            id="driver-activate-vip-btn"
            onClick={() => {
              setTargetPlanForPricing('vip_pass');
              setPricingModalOpen(true);
            }}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all"
          >
            Activer le Pass Livreur (6 000 FCFA / mois)
          </button>
        </div>
      )}

      {/* 4. Active Job in Progress (GPS Navigation & 2-Step Codes) */}
      {myActiveJob && (
        <div id="driver-active-mission-card" className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-2 border-emerald-500/50 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <Navigation className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-lg font-extrabold text-white font-display">Mission GPS en Cours</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-500/30">
                    {myActiveJob.status === 'accepted' ? 'Étape 1 : Enlèvement Vendeur (Point A)' : 'Étape 2 : Livraison Acheteur (Point B)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Colis / Commande : <strong className="text-white">{myActiveJob.productTitle}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono-num font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow">
                Rémunération : + {myActiveJob.deliveryFee.toLocaleString('fr-FR')} FCFA
              </span>
              <button
                id="driver-satellite-view-btn"
                onClick={() => setGpsTrackingJob(myActiveJob)}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-xl border border-blue-500/30 flex items-center gap-1.5 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Vue Satellite GPS</span>
              </button>
            </div>
          </div>

          {/* Real-time Google Maps & Turn-by-Turn Voice Navigation Cockpit */}
          <div className="mb-4">
            <GoogleMapsEmbed
              pickupCommune={myActiveJob.pickupCommune}
              dropoffCommune={myActiveJob.dropoffCommune}
              vehicleType={myActiveJob.requiredVehicle || 'moto'}
              isReturning={myActiveJob.status === 'returning'}
              courierName={currentUser.name}
              courierPhone={currentUser.phone || '+225 07 00 00 00 00'}
              currentProgress={myActiveJob.status === 'in_transit' ? 60 : myActiveJob.status === 'arrived' ? 95 : 20}
            />
          </div>

          {/* Interactive Trajectory Route (Point A -> Point B) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Route Timeline */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs">
                      A
                    </div>
                    <div className="w-0.5 h-12 bg-slate-700 my-1 border-dashed" />
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                      B
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 text-xs">
                    {/* Point A : Seller Pickup */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-400 uppercase text-[10px] tracking-wider">
                          Point A : Enlèvement (Vendeur)
                        </span>
                        <a
                          href={`tel:${myActiveJob.sellerPhone || '+2250748921134'}`}
                          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Appeler Vendeur ({myActiveJob.sellerName})</span>
                        </a>
                      </div>
                      <p className="font-extrabold text-sm text-white mt-0.5">
                        {myActiveJob.pickupCommune}
                      </p>
                      <p className="text-slate-400">{myActiveJob.pickupAddress}</p>
                    </div>

                    {/* Point B : Buyer Dropoff */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">
                          Point B : Destination (Acheteur)
                        </span>
                        <a
                          href={`tel:${myActiveJob.buyerPhone || '+2250766112233'}`}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Appeler Acheteur ({myActiveJob.buyerName})</span>
                        </a>
                      </div>
                      <p className="font-extrabold text-sm text-white mt-0.5">
                        {myActiveJob.dropoffCommune}
                      </p>
                      <p className="text-slate-400">{myActiveJob.dropoffAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Distance & GPS Launch button */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Distance estimée</span>
                      <strong className="text-white font-mono-num">{myActiveJob.distanceKm || 7.8} km</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Temps de trajet</span>
                      <strong className="text-amber-400 font-mono-num">~{myActiveJob.etaMinutes || 20} min</strong>
                    </div>
                  </div>

                  <button
                    id="driver-launch-gps-nav-btn"
                    type="button"
                    onClick={() => {
                      const cockpit = document.getElementById('google-maps-navigation-cockpit');
                      if (cockpit) {
                        cockpit.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigation GPS Intégrée (Google / Yango Maps In-App)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Inputs Box */}
            <div className="p-5 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
              {myActiveJob.status === 'accepted' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <KeyRound className="w-4 h-4" />
                    <span>Étape 1 : Code Enlèvement</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Demandez au vendeur son <strong>code à 4 chiffres</strong> lors de la remise du colis à {myActiveJob.pickupCommune} :
                  </p>
                  <div className="space-y-2">
                    <input
                      id="driver-pickup-code-input"
                      type="text"
                      maxLength={4}
                      value={pickupCodeInput}
                      onChange={(e) => setPickupCodeInput(e.target.value)}
                      placeholder="Code vendeur (ex: 4 chiffres)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-base font-mono-num font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      id="driver-validate-pickup-btn"
                      onClick={() => handlePickup(myActiveJob.id)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all"
                    >
                      Valider Enlèvement & Démarrer Trajet
                    </button>
                  </div>
                </div>
              )}

              {myActiveJob.status === 'in_transit' && (
                <div className="space-y-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <MapPin className="w-4 h-4" />
                    <span>Étape 2 : Trajet en cours vers l'Acheteur</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Vous êtes en route vers <strong>{myActiveJob.dropoffCommune} ({myActiveJob.dropoffAddress})</strong>. À votre arrivée sur les lieux, signalez votre présence pour débloquer la vérification contradictoire :
                  </p>
                  <button
                    id="driver-declare-arrival-btn"
                    onClick={() => driverDeclareArrival(myActiveJob.id)}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <MapPin className="w-4 h-4 text-slate-950" />
                    <span>📍 JE SUIS ARRIVÉ SUR PLACE CHEZ LE CLIENT</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Le client recevra une notification instantanée pour venir vérifier le colis avec vous.
                  </p>
                </div>
              )}

              {myActiveJob.status === 'arrived' && (
                <div className="space-y-4 p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Étape 3 : Contrôle Physique & Verdict Client</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      Sur place
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Présentez l'article à <strong>{myActiveJob.buyerName}</strong>. Après vérification de l'état du produit, sélectionnez le résultat du constat :
                  </p>

                  {/* Two mandatory Driver Verdict Options requested by user */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      id="driver-verdict-good-btn"
                      onClick={() => driverSetInspectionVerdict(myActiveJob.id, 'client_confirmed_good')}
                      className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                        myActiveJob.inspectionStatus === 'client_confirmed_good'
                          ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${myActiveJob.inspectionStatus === 'client_confirmed_good' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="font-bold text-xs text-emerald-400">1. Produit Confirmé Bon / Conforme</div>
                        <div className="text-[11px] text-slate-400">Le client accepte le produit et va vous communiquer son Code OTP Secret.</div>
                      </div>
                    </button>

                    <button
                      id="driver-verdict-bad-btn"
                      onClick={() => driverSetInspectionVerdict(myActiveJob.id, 'client_confirmed_bad')}
                      className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                        myActiveJob.inspectionStatus === 'client_confirmed_bad'
                          ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-red-500/40'
                      }`}
                    >
                      <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${myActiveJob.inspectionStatus === 'client_confirmed_bad' ? 'text-red-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="font-bold text-xs text-red-400">2. Produit Mauvais / Non Conforme</div>
                        <div className="text-[11px] text-slate-400">Le client refuse l'article. Le bouton retour s'active sur son application.</div>
                      </div>
                    </button>
                  </div>

                  {/* If Good: OTP entry */}
                  {myActiveJob.inspectionStatus === 'client_confirmed_good' && (
                    <div className="pt-2 border-t border-slate-800 space-y-2 animate-in fade-in">
                      <label className="text-xs font-bold text-white block">
                        Entrez le Code OTP à 4 chiffres fourni par l'acheteur :
                      </label>
                      <input
                        id="driver-delivery-otp-input"
                        type="text"
                        maxLength={4}
                        value={deliveryOtpInput}
                        onChange={(e) => setDeliveryOtpInput(e.target.value)}
                        placeholder="Code OTP (4 chiffres)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono-num font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 tracking-widest"
                      />
                      <button
                        id="driver-validate-otp-btn"
                        onClick={() => handleDeliveryOTP(myActiveJob.id)}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider la Livraison & Encaisser {myActiveJob.deliveryFee.toLocaleString('fr-FR')} FCFA</span>
                      </button>
                    </div>
                  )}

                  {/* If Bad: Warning message */}
                  {myActiveJob.inspectionStatus === 'client_confirmed_bad' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-slate-300 space-y-1">
                      <p className="font-bold text-red-400">Colis refusé pour non-conformité :</p>
                      <p className="text-[11px] text-slate-400">L'acheteur doit cliquer sur "Confirmer le Refus" dans son interface pour vous délivrer le <strong>Code OTP Retour</strong>. Vos frais de course ({myActiveJob.deliveryFee.toLocaleString('fr-FR')} FCFA) vous sont intégralement payés.</p>
                    </div>
                  )}
                </div>
              )}

              {myActiveJob.status === 'returning' && (
                <div className="space-y-3 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                    <RotateCcw className="w-4 h-4" />
                    <span>Étape 2 (Retour) : Prise en charge du Colis Refusé</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    L'acheteur a refusé le colis (non-conforme). Vos <strong>frais de course ({myActiveJob.deliveryFee.toLocaleString('fr-FR')} FCFA)</strong> sont garantis. Entrez le <strong>Code OTP Retour</strong> transmis par l'acheteur pour valider la prise en charge :
                  </p>
                  <div className="space-y-2">
                    <input
                      id="driver-return-otp-input"
                      type="text"
                      maxLength={4}
                      value={returnOtpInput}
                      onChange={(e) => setReturnOtpInput(e.target.value)}
                      placeholder="Code OTP Retour Acheteur (4 chiffres)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono-num font-bold text-red-400 focus:outline-none focus:border-red-500 tracking-widest"
                    />
                    <button
                      id="driver-validate-return-otp-btn"
                      onClick={() => {
                        const ok = driverConfirmReturnOTP(myActiveJob.id, returnOtpInput);
                        if (ok) setReturnOtpInput('');
                      }}
                      className="w-full py-3 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Valider OTP & Démarrer Retour vers Vendeur</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    <p className="font-bold text-white">Adresse de restitution boutique :</p>
                    <p className="text-slate-400">{myActiveJob.sellerName} • {myActiveJob.pickupCommune} ({myActiveJob.pickupAddress})</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Driver Dashboard Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          id="driver-tab-available-orders"
          onClick={() => setActiveDriverTab('available_orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeDriverTab === 'available_orders'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Commandes Disponibles</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono-num ${
            activeDriverTab === 'available_orders' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-emerald-400'
          }`}>
            {availableJobs.length}
          </span>
        </button>

        {myActiveJob && (
          <button
            id="driver-tab-active-mission"
            onClick={() => setActiveDriverTab('active_mission')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeDriverTab === 'active_mission'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Mission en Cours</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        )}

        <button
          id="driver-tab-history"
          onClick={() => setActiveDriverTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeDriverTab === 'history'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Historique Livraisons</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono-num ${
            activeDriverTab === 'history' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-amber-400'
          }`}>
            {myCompletedJobs.length}
          </span>
        </button>

        <button
          id="driver-tab-profile"
          onClick={() => setActiveDriverTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeDriverTab === 'profile'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Mon Véhicule & Statut KYC</span>
        </button>
      </div>

      {/* 6. TAB CONTENT: Available Orders / Bourse de Fret */}
      {activeDriverTab === 'available_orders' && (
        <div className="space-y-4">
          {/* Filters Bar: Search, Zone & Vehicle */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="driver-orders-search-input"
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Rechercher par article, référence, commune..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Zone & Vehicle Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Zone Filter */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <select
                  id="driver-zone-filter-select"
                  value={selectedZoneFilter}
                  onChange={(e) => setSelectedZoneFilter(e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-xs font-medium cursor-pointer"
                >
                  <option value="Toutes" className="bg-slate-900 text-white font-bold">Toutes les Zones</option>
                  <optgroup label="Grand Abidjan (13 Communes)" className="bg-slate-950 text-amber-400 font-bold">
                    {COMMUNE_NAMES_ABIDJAN.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-white font-normal">{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Villes Environs / Littoral" className="bg-slate-950 text-cyan-400 font-bold">
                    {COMMUNE_NAMES_ENVIRONS.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-cyan-200 font-normal">🌴 {c}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Vehicle filters */}
              <div className="flex gap-1">
                {['Tous', 'moto', 'voiture', 'cargo'].map((v) => (
                  <button
                    key={v}
                    id={`driver-vehicle-filter-${v}`}
                    onClick={() => setSelectedVehicleFilter(v)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      selectedVehicleFilter === v
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {v === 'Tous' ? 'Tous' : v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List of Available Orders */}
          {availableJobs.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <Bike className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-white font-bold text-sm">Aucune commande disponible</h4>
              <p className="text-xs text-slate-400 mt-1">
                Aucun colis ne correspond à vos filtres ({selectedZoneFilter} • {selectedVehicleFilter}) pour le moment.
              </p>
              <button
                onClick={() => { setSelectedZoneFilter('Toutes'); setSelectedVehicleFilter('Tous'); setOrderSearchQuery(''); }}
                className="mt-3 text-xs text-emerald-400 hover:underline font-bold"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableJobs.map((job) => {
                const pickupBadge = getCommuneBadgeInfo(job.pickupCommune);
                const dropoffBadge = getCommuneBadgeInfo(job.dropoffCommune);

                return (
                  <div
                    key={job.id}
                    id={`available-order-card-${job.id}`}
                    className="p-5 rounded-2xl bg-[#0C121E] border border-slate-800 hover:border-emerald-500/40 space-y-4 shadow-lg flex flex-col justify-between transition-all group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                            {getVehicleIcon(job.requiredVehicle)}
                            <span className="capitalize">{job.requiredVehicle}</span>
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            #{job.id.replace('job-', 'CMD-')}
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-emerald-400 font-mono-num">
                          + {job.deliveryFee.toLocaleString('fr-FR')} F
                        </span>
                      </div>

                      {/* Product details */}
                      <div className="flex items-center gap-3 mt-2">
                        <img 
                          src={job.productImage} 
                          alt={job.productTitle}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 bg-slate-900 shrink-0" 
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                            {job.productTitle}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-mono-num">
                            Valeur garantie : {job.itemValue.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      </div>

                      {/* Trajectory */}
                      <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                            A
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white text-xs">{job.pickupCommune}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border ${pickupBadge.badgeClass}`}>
                                {pickupBadge.label.split(' ')[0]}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block">{job.pickupAddress}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                            B
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white text-xs">{job.dropoffCommune}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border ${dropoffBadge.badgeClass}`}>
                                {dropoffBadge.label.split(' ')[0]}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block">{job.dropoffAddress}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Distance : <strong className="text-slate-200">{job.distanceKm || 8} km</strong></span>
                          <span>Durée : <strong className="text-amber-400">~{job.etaMinutes || 20} min</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      id={`accept-order-btn-${job.id}`}
                      onClick={() => driverAcceptJob(job.id)}
                      disabled={(isTrial && remainingTrial <= 0) || !isOnline}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                    >
                      <Bike className="w-4 h-4" />
                      <span>
                        {!isOnline 
                          ? 'Passez en service pour accepter' 
                          : `Prendre en charge (+ ${job.deliveryFee.toLocaleString('fr-FR')} F)`
                        }
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. TAB CONTENT: History of Completed Deliveries */}
      {activeDriverTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Historique des Commandes Livrées & Reçus Wave</h4>
              <p className="text-xs text-slate-400">Tous les virements ont été versés instantanément après validation OTP.</p>
            </div>
            <span className="text-sm font-extrabold text-emerald-400 font-mono-num">
              Total : {myCompletedJobs.reduce((acc, j) => acc + j.deliveryFee, 0).toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {myCompletedJobs.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Aucune livraison clôturée pour ce compte pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCompletedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-white">{job.productTitle}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Trajet : {job.pickupCommune} ➔ {job.dropoffCommune} ({job.distanceKm || 7.5} km)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-1 rounded-lg border border-emerald-500/30">
                      Virement Wave Reçu
                    </span>
                    <span className="font-mono-num font-black text-sm text-emerald-400">
                      + {job.deliveryFee.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB CONTENT: Profile, Vehicle & KYC Status */}
      {activeDriverTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity & KYC Verification */}
          <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Vérification d'Identité & Permis (KYC)</h4>
                <p className="text-xs text-slate-400">Certifié conforme par la direction de sécurité</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Statut KYC :</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Vérifié & Agrée Brad'CI</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Numéro CNI / Passeport :</span>
                <span className="text-white font-mono font-bold">{currentUser.kycDocumentNumber || 'CI0084729188'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Téléphone Mobile Wave :</span>
                <span className="text-white font-mono font-bold">{currentUser.phone}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Zone de rattachement GPS :</span>
                <span className="text-white font-bold">{currentUser.gpsLocation?.commune || 'Adjamé / Plateau'}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Véhicule & Matériel Déclaré</h4>
                <p className="text-xs text-slate-400">Engin inspecté pour transport sécurisé de colis</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Type de Véhicule Principal :</span>
                <span className="text-emerald-400 font-bold capitalize">Moto Express (Yamaha XTZ 125)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Immatriculation / Plaque :</span>
                <span className="text-white font-mono font-bold">CI-4920-AB01</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Équipement de Sécurité :</span>
                <span className="text-white font-medium">Top-Case Verrouillé + Casque Homologué</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Note Globale Clients :</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>4.9 / 5.0 (34 avis vérifiés)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
