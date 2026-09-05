import React, { useState, useEffect } from 'react';
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
  Camera,
  Timer,
  Zap
} from 'lucide-react';
import { DeliveryJob, VehicleType, PaymentMethod } from '../types';
import { COMMUNE_NAMES_ABIDJAN, COMMUNE_NAMES_ENVIRONS, getCommuneBadgeInfo } from '../data/communes';
import { GoogleMapsEmbed } from './GoogleMapsEmbed';
import { KYCGateBanner } from './KYCGateBanner';
import { DriverActiveMissionCockpit } from './DriverActiveMissionCockpit';

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
    driverStartAbsentTimer,
    driverCancelDueToAbsentBuyer,
    requestUserWithdrawal,
    setPricingModalOpen,
    setTargetPlanForPricing,
    setGpsTrackingJob,
    setActiveTab,
    triggerOrderDispatchToDriver,
    setKycModalOpen,
    setProfileAvatarModalOpen,
    activeDriverTab,
    setActiveDriverTab,
    assignTestJobToDriver,
    openOfficialReceipt,
    setFreightJobs
  } = useApp();

  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('Tous');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('Toutes');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [returnOtpInput, setReturnOtpInput] = useState('');
  const [absentTimerSeconds, setAbsentTimerSeconds] = useState<number>(20 * 60); // 20 minutes countdown (1200 seconds)
  const [isAbsentTimerRunning, setIsAbsentTimerRunning] = useState<boolean>(false);

  // Active timer effect for absent buyer countdown (20 minutes)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAbsentTimerRunning && absentTimerSeconds > 0) {
      interval = setInterval(() => {
        setAbsentTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAbsentTimerRunning, absentTimerSeconds]);

  const formatTimerMinutesSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Driver Withdrawal state
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>('Wave');
  const [withdrawPhone, setWithdrawPhone] = useState(currentUser?.phone || '+225 07 00 00 00 00');

  useEffect(() => {
    const handleDriverTab = (e: any) => {
      if (e.detail) {
        setActiveDriverTab(e.detail);
      }
    };
    window.addEventListener('bradci_driver_tab', handleDriverTab);
    return () => window.removeEventListener('bradci_driver_tab', handleDriverTab);
  }, []);

  // All available driver accounts in system
  const availableDriverAccounts = users.filter(u => u.role === 'driver');

  if (!currentUser || currentUser.role !== 'driver') {
    return (
      <div id="driver-access-restricted" className="p-8 max-w-lg mx-auto text-center bg-slate-900/60 rounded-3xl border border-red-500/30">
        <Lock className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Accès Restreint Livreur (RBAC)</h3>
        <p className="text-xs text-slate-300 mt-2">
          Cet espace et la bourse de fret sont strictement réservés aux livreurs agréés BRAD'CI.
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

  const myActiveJob = freightJobs.find(
    j => (j.assignedDriverId === currentUser.id || j.assignedDriverName === currentUser.name) &&
         j.status !== 'delivered' &&
         j.status !== 'cancelled'
  );
  const myCompletedJobs = freightJobs.filter(
    j => (j.assignedDriverId === currentUser.id || j.assignedDriverName === currentUser.name) &&
         j.status === 'delivered'
  );

  const simulateCompletedJobForDriver = () => {
    const testCompletedJob: DeliveryJob = {
      id: 'job-completed-' + Date.now(),
      productId: 'prod-completed-' + Date.now(),
      productTitle: 'Sneakers Nike Air Jordan 4 "Retro White Cement"',
      productImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80',
      sellerName: 'Boutique SneakerHub Abidjan',
      sellerPhone: '+225 07 48 92 11 34',
      pickupCommune: 'Cocody',
      pickupAddress: 'Deux-Plateaux Vallons, Rue des Jardins',
      pickupCoords: { lat: 5.3620, lng: -3.9910 },
      buyerName: 'David Kouamé',
      buyerPhone: '+225 05 99 88 77 66',
      dropoffCommune: 'Marcory',
      dropoffAddress: 'Zone 4, Boulevard de Marseille',
      dropoffCoords: { lat: 5.2954, lng: -3.9847 },
      requiredVehicle: 'moto',
      deliveryFee: 3500,
      itemValue: 120000,
      status: 'delivered',
      assignedDriverId: currentUser.id,
      assignedDriverName: currentUser.name,
      assignedDriverPhone: currentUser.phone,
      pickupCode: '4491',
      deliveryOtpCode: '8814',
      distanceKm: 7.4,
      etaMinutes: 12
    };
    setFreightJobs(prev => [testCompletedJob, ...prev]);
  };

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
      case 'voiture':
      case 'car':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'cargo':
        return <Truck className="w-4 h-4 text-purple-400" />;
      default:
        return <Bike className="w-4 h-4 text-emerald-400" />;
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

      {/* 1. Header Profile, Live Status & Account Switcher (Yango Pro Style) */}
      <div id="driver-executive-hub" className="p-5 sm:p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Driver identity */}
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setProfileAvatarModalOpen(true)}
              className="relative group cursor-pointer shrink-0"
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

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white font-display">{currentUser.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Agréé BRAD'CI</span>
                </span>
                <span className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-slate-700 font-mono-num">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{currentUser.rating || 4.9}</span>
                  <span className="text-slate-400 text-[10px]">({currentUser.reviewCount || 34})</span>
                </span>
              </div>

              {/* Dynamic Vehicle Plate & Color Badge */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-900 border border-amber-500/40 text-[11px] font-bold text-amber-300 shadow-sm">
                  <Bike className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400 font-normal">Matricule :</span>
                  <span className="font-mono text-white uppercase">{currentUser.kycVehiclePlate || currentUser.vehicleDetails?.plate || '4523 JJ 01'}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-300 shadow-sm">
                  <span className="text-slate-400">Véhicule :</span>
                  <span className="text-white font-medium">{currentUser.kycVehicleModel || currentUser.vehicleDetails?.model || 'Yamaha Crypton 110'}</span>
                </span>

                <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentUser.gpsLocation?.commune || 'Abidjan'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Master Yango Pro Availability Toggle & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            {/* Master Availability Toggle Button */}
            <button
              id="driver-master-status-toggle"
              onClick={toggleDriverAvailability}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2.5 transition-all shadow-md ${
                isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50 shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-slate-950 animate-pulse' : 'bg-red-500'}`} />
              <span>{isOnline ? '🟢 EN SERVICE (DISPONIBLE)' : '🔴 EN PAUSE (HORS LIGNE)'}</span>
            </button>

            {/* Support Dispatch 24/7 */}
            <button
              onClick={() => setActiveTab('support_chat')}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Assistance Support Livreur 24/7"
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Assistance 24/7</span>
            </button>

            {/* Quick Vehicle & KYC */}
            <button
              onClick={() => setActiveDriverTab('profile')}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Voir Dossier Véhicule & Statut KYC"
            >
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Véhicule & KYC</span>
            </button>
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

      {/* 2. 4 Clean High-Impact KPI Cards (Executive Professional Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Portefeuille Livreur & Retrait Immédiat */}
        <div 
          onClick={() => setActiveDriverTab('history')}
          className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-300 transition-colors">Portefeuille Wave / MoMo</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-white font-mono-num">
              {currentUser.walletBalance.toLocaleString('fr-FR')} <span className="text-sm font-bold text-emerald-400">FCFA</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Virement instantané direct (0% frais)</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <button
              id="driver-quick-view-gains-btn"
              onClick={() => setActiveDriverTab('history')}
              className="py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Voir Gains</span>
            </button>
            <button
              id="driver-quick-withdraw-btn"
              onClick={() => {
                setWithdrawAmount(currentUser.walletBalance.toString());
                setWithdrawalModalOpen(true);
              }}
              className="py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Retirer</span>
            </button>
          </div>
        </div>

        {/* Card 2: Bourse aux Courses Disponibles */}
        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bourse aux Courses</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-white font-mono-num">
              {availableJobs.length} <span className="text-sm font-bold text-blue-400">courses</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Disponibles immédiatement à Abidjan</p>
          </div>

          <button
            id="driver-quick-browse-orders-btn"
            onClick={() => setActiveDriverTab('available_orders')}
            className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Consulter la Bourse</span>
          </button>
        </div>

        {/* Card 3: Mission Active GPS */}
        <div 
          onClick={() => setActiveDriverTab('active_mission')}
          className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-300 transition-colors">Mission GPS en Direct</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Navigation className="w-4 h-4" />
            </div>
          </div>

          <div>
            {myActiveJob ? (
              <>
                <div className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>En cours d'acheminement</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                  {myActiveJob.pickupCommune} ➔ {myActiveJob.dropoffCommune} (+{myActiveJob.deliveryFee.toLocaleString('fr-FR')} F)
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Prêt pour attribution</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Radar d'attribution direct actif</p>
              </>
            )}
          </div>

          <button
            id="driver-quick-mission-btn"
            onClick={(e) => {
              e.stopPropagation();
              setActiveDriverTab('active_mission');
            }}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
              myActiveJob 
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{myActiveJob ? 'Ouvrir Mission en cours (GPS)' : 'Cockpit Mission en cours'}</span>
          </button>
        </div>

        {/* Card 4: Performances & Note Chauffeur */}
        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Performances & Statut</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-white flex items-baseline gap-2">
              <span>{currentUser.rating || 4.9}</span>
              <span className="text-xs font-bold text-amber-400">★ ★ ★ ★ ★</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Aujourd'hui : 12 500 F (+3 courses)</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ✓ 98% Taux de complétion
            </span>
            <span className="text-[10px] text-slate-400 font-mono-num">{myCompletedJobs.length} livraisons</span>
          </div>
        </div>
      </div>

      {/* 3. Driver Navigation Tabs (Clean Yango Pro Segmented Bar) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          id="driver-tab-available-orders"
          onClick={() => setActiveDriverTab('available_orders')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeDriverTab === 'available_orders'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Bourse aux Courses</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-num ${
            activeDriverTab === 'available_orders' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-emerald-400'
          }`}>
            {availableJobs.length}
          </span>
        </button>

        <button
          id="driver-tab-active-mission"
          onClick={() => setActiveDriverTab('active_mission')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeDriverTab === 'active_mission'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4 text-blue-400" />
          <span>Mission en cours</span>
          {myActiveJob && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] animate-pulse">
              LIVE
            </span>
          )}
        </button>

        <button
          id="driver-tab-history"
          onClick={() => setActiveDriverTab('history')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeDriverTab === 'history'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gain</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-num ${
            activeDriverTab === 'history' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-amber-400'
          }`}>
            {myCompletedJobs.length}
          </span>
        </button>

        <button
          id="driver-tab-profile"
          onClick={() => setActiveDriverTab('profile')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeDriverTab === 'profile'
              ? 'bg-slate-800 text-white border border-slate-700 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Véhicule & Documents</span>
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
                    {v === 'Tous' ? 'Tous' : (v === 'moto' ? '🏍️ Moto' : v === 'voiture' ? '🚗 Voiture' : '🚚 Cargo')}
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

      {/* 6.5 TAB CONTENT: Active GPS Mission Cockpit */}
      {activeDriverTab === 'active_mission' && (
        <DriverActiveMissionCockpit
          job={myActiveJob}
          onBrowseOrders={() => setActiveDriverTab('available_orders')}
        />
      )}

      {/* 7. TAB CONTENT: History of Completed Deliveries (Gains) */}
      {activeDriverTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Gains Executive Summary Header */}
          <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Receipt className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-base">Historique des Gains & Reçus Officiels</h4>
              </div>
              <p className="text-xs text-slate-400">
                Toutes les rémunérations de courses sont créditées à 100% sur votre solde Wave / Mobile Money sans frais.
              </p>
            </div>

            <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Encaissé</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono-num">
                  {myCompletedJobs.reduce((acc, j) => acc + j.deliveryFee, 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <button
                id="driver-history-withdraw-btn"
                onClick={() => {
                  setWithdrawAmount(currentUser.walletBalance.toString());
                  setWithdrawalModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Demander un Retrait</span>
              </button>
            </div>
          </div>

          {myCompletedJobs.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Receipt className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h5 className="text-sm font-bold text-white">Aucune course clôturée pour le moment</h5>
                <p className="text-xs text-slate-400">
                  Vos gains de livraison apparaîtront ici immédiatement après chaque validation du code OTP client.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  id="driver-simulate-completed-job-btn"
                  onClick={simulateCompletedJobForDriver}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Simuler un gain de course (+3 500 FCFA)</span>
                </button>
                <button
                  id="driver-history-browse-orders-btn"
                  onClick={() => setActiveDriverTab('available_orders')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Prendre une course sur la bourse</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myCompletedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0C121E] border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    {job.productImage ? (
                      <img
                        src={job.productImage}
                        alt={job.productTitle}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-sm text-white">{job.productTitle}</h5>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-300">{job.pickupCommune}</span>
                        <span>➔</span>
                        <span className="font-semibold text-emerald-300">{job.dropoffCommune}</span>
                        <span>•</span>
                        <span>{job.distanceKm || 7.5} km</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                    <div className="text-right">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30 block mb-0.5">
                        Virement Reçu
                      </span>
                      <span className="font-mono-num font-black text-sm text-emerald-400">
                        + {job.deliveryFee.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    <button
                      id={`btn-receipt-${job.id}`}
                      onClick={() => openOfficialReceipt(job.id)}
                      className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Consulter le reçu officiel certifié cryptographiquement"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Voir Reçu</span>
                    </button>
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
                  <span>Vérifié & Agrée BRAD'CI</span>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  currentUser.kycVehicleType === 'voiture' || currentUser.kycVehicleType === 'car'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : currentUser.kycVehicleType === 'cargo'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {currentUser.kycVehicleType === 'voiture' || currentUser.kycVehicleType === 'car' ? (
                    <Car className="w-5 h-5" />
                  ) : currentUser.kycVehicleType === 'cargo' ? (
                    <Truck className="w-5 h-5" />
                  ) : (
                    <Bike className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Véhicule & Matériel Déclaré</h4>
                  <p className="text-xs text-slate-400">Engin enregistré et contrôlé pour livraisons sécurisées</p>
                </div>
              </div>

              <button
                onClick={() => setKycModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors"
              >
                Modifier
              </button>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Matricule / Plaque :</span>
                <span className="text-amber-300 font-mono font-bold uppercase text-sm bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  {currentUser.kycVehiclePlate || currentUser.vehicleDetails?.plate || '4523 JJ 01'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Couleur de l'engin :</span>
                <span className="text-white font-bold">
                  {currentUser.kycVehicleColor || currentUser.vehicleDetails?.color || 'Noir & Rouge'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Modèle du Véhicule :</span>
                <span className="text-emerald-400 font-bold capitalize">
                  {currentUser.kycVehicleModel || currentUser.vehicleDetails?.model || 'Yamaha Crypton 110'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Type de Véhicule :</span>
                <span className="text-white font-medium capitalize">
                  {currentUser.kycVehicleType || currentUser.vehicleDetails?.type || 'Moto Express'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Note Globale Clients :</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{currentUser.rating || 4.9} / 5.0 ({currentUser.reviewCount || 34} avis vérifiés)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
