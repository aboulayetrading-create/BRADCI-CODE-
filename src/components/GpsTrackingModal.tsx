import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  MapPin, 
  Bike, 
  Car,
  Truck,
  Phone, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  Package, 
  MessageCircle, 
  AlertTriangle, 
  RotateCcw, 
  Radio, 
  Eye, 
  Headphones, 
  Users, 
  Timer, 
  AlertOctagon, 
  CreditCard, 
  Zap,
  FileText,
  Mic
} from 'lucide-react';
import { GoogleMapsEmbed } from './GoogleMapsEmbed';
import { DeliveryChatModal } from './DeliveryChatModal';
import { DeliveryJob, PaymentMethod } from '../types';

export const GpsTrackingModal: React.FC = () => {
  const { 
    gpsTrackingJob, 
    setGpsTrackingJob, 
    currentUser, 
    buyerCancelAndReturnPackage, 
    buyerConfirmDeliveryOTP,
    sellerConfirmReturnReceived,
    driverConfirmPickup,
    driverDeclareArrival,
    driverConfirmDeliveryOTP,
    buyerInitiatePayOnDelivery,
    openOfficialReceipt,
    freightJobs,
    addToast
  } = useApp();

  const [courierProgress, setCourierProgress] = useState(25);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [driverEnteredOtp, setDriverEnteredOtp] = useState('');
  
  // Payment on Delivery operator selection
  const [selectedOperator, setSelectedOperator] = useState<PaymentMethod>('Wave');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Radar & Search state for 'available' jobs
  const [activeConsultingDriversCount] = useState(3);
  const [simulatedSearchSeconds, setSimulatedSearchSeconds] = useState(6);
  
  // Packaging Timer Simulation (10 min allowance)
  const [packagingElapsedSeconds] = useState(180);

  // Transit delay calculation
  const [transitElapsedMinutes] = useState(12);

  // Synchronize live job from freightJobs state
  const job: DeliveryJob | undefined = freightJobs.find(j => j.id === gpsTrackingJob?.id) || gpsTrackingJob || undefined;

  useEffect(() => {
    if (!job) return;
    
    // Auto-advance courier progress if in transit
    if (job.status === 'in_transit' || job.orderStatus === 'IN_TRANSIT') {
      const interval = setInterval(() => {
        setCourierProgress(prev => (prev >= 95 ? 95 : prev + 1.5));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [job]);

  // Simulation of available job driver acceptance
  useEffect(() => {
    if (!job || job.status !== 'available') return;

    setSimulatedSearchSeconds(6);

    const interval = setInterval(() => {
      setSimulatedSearchSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeout = setTimeout(() => {
      if (gpsTrackingJob && gpsTrackingJob.status === 'available') {
        const updated: DeliveryJob = {
          ...gpsTrackingJob,
          status: 'accepted',
          assignedDriverId: 'driver-bakary',
          assignedDriverName: 'Bakary Traoré',
          assignedDriverPhone: '+225 01 44 77 89 22',
          assignedDriverVehicle: 'moto',
          assignedDriverVehiclePlate: '4523 JJ 01',
          assignedDriverVehicleColor: 'Noir & Rouge',
          assignedDriverVehicleModel: 'Yamaha Crypton 110',
          sellerPackagingTimerStartedAt: new Date().toISOString()
        };
        setGpsTrackingJob(updated);
        addToast(
          '🛵 Livreur Assigné en Direct !',
          'Bakary Traoré (Moto • Matricule: 4523 JJ 01) a accepté votre course.',
          'success'
        );
      }
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [job?.id, job?.status]);

  if (!job) return null;

  const isSeller = currentUser?.id === job.sellerName || (currentUser?.name && job.sellerName.includes(currentUser.name));
  const isBuyer = currentUser?.name === job.buyerName || (!isSeller && currentUser?.role === 'client');
  const isDriver = currentUser?.role === 'driver' || currentUser?.id === job.assignedDriverId;

  // Status checks
  const isAvailable = job.status === 'available';
  const isAccepted = job.status === 'accepted';
  const isInTransit = job.status === 'in_transit' || job.orderStatus === 'IN_TRANSIT';
  const isArrived = job.status === 'arrived' || job.orderStatus === 'ARRIVED' || job.orderStatus === 'PAYMENT_PENDING' || job.orderStatus === 'PAID';
  const isPaymentPending = job.orderStatus === 'PAYMENT_PENDING';
  const isPaid = job.orderStatus === 'PAID' || job.paymentStatus === 'PAID';
  const isReturning = job.status === 'returning';
  const isReturned = job.status === 'returned';
  const isDelivered = job.status === 'delivered' || job.orderStatus === 'COMPLETED';
  const isPickedUp = isInTransit || isArrived || isDelivered || isReturning || isReturned;

  // Pricing & Split calculation
  const productPrice = Number(job.itemValue) || 0;
  const deliveryFee = Number(job.deliveryFee) || 0;
  const platformFee = 500;
  const totalBuyerAmount = productPrice + deliveryFee + platformFee;

  // Seller Packaging Penalty Logic (10 min free, 100 F/min beyond)
  const packagingMinutes = Math.floor(packagingElapsedSeconds / 60);
  const sellerPenaltyMinutes = Math.max(0, packagingMinutes - 10);
  const sellerPenaltyFCFA = sellerPenaltyMinutes * 100;

  // Driver Transit Delay Penalty Logic (ETA + 20 min tolerance)
  const estimatedEta = job.etaMinutes || 18;
  const driverDelayMinutes = Math.max(0, transitElapsedMinutes - (estimatedEta + 20));
  const driverPenaltyFCFA = driverDelayMinutes * 100;

  const handleOpenCustomerService = () => {
    window.dispatchEvent(new CustomEvent('bradci_open_support', { detail: { tab: 'human' } }));
  };

  const handleBuyerCancel = (e: React.FormEvent) => {
    e.preventDefault();
    const res = buyerCancelAndReturnPackage(job.id, cancelReason || 'Colis non-conforme aux photos/spécifications');
    if (res.success) {
      setCancelModalOpen(false);
    }
  };

  const handleSellerConfirmReturn = () => {
    sellerConfirmReturnReceived(job.id);
  };

  const handleDriverConfirmPickupDirect = () => {
    const code = pickupCodeInput.trim() || job.pickupCode;
    driverConfirmPickup(job.id, code);
  };

  const handleDriverDeclareArrivalDirect = () => {
    driverDeclareArrival(job.id);
  };

  const handleInitiatePayment = async () => {
    setIsProcessingPayment(true);
    await buyerInitiatePayOnDelivery(job.id, selectedOperator);
    setIsProcessingPayment(false);
  };

  const handleDriverSubmitOtp = () => {
    if (!driverEnteredOtp) {
      addToast('Code Secret Manquant', 'Veuillez saisir le code secret à 4 chiffres fourni par l\'acheteur.', 'warning');
      return;
    }
    const ok = driverConfirmDeliveryOTP(job.id, driverEnteredOtp);
    if (ok) {
      setDriverEnteredOtp('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="gps-tracking-card" 
        className="w-full max-w-3xl bg-[#0B1021] border border-[#222D4A] rounded-3xl p-4 sm:p-7 shadow-2xl relative my-auto max-h-[94vh] overflow-y-auto text-white"
      >
        {/* Top Control Bar with Close & Customer Service Buttons */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#222D4A]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCustomerService}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E53E5]/15 hover:bg-[#1E53E5]/25 border border-[#1E53E5]/40 text-[#467BFF] font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Assistance Client 24/7</span>
            </button>
            <span className="hidden sm:inline-block text-[11px] text-slate-400">
              Paiement Direct à la Livraison (Pay on Delivery Sécurisé)
            </span>
          </div>

          <button
            onClick={() => setGpsTrackingJob(null)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-[#151C33] border border-[#222D4A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RADAR SEARCH MODE IF JOB IS STILL AVAILABLE */}
        {isAvailable ? (
          <div className="py-6 px-4 text-center space-y-5">
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/30 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <Radio className="w-10 h-10 animate-spin" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>RADAR GPS EN DIRECT • COMMUNE DE {job.pickupCommune.toUpperCase()}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                Recherche du Livreur le Plus Proche...
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                La commande a été transmise aux coursiers certifiés géolocalisés à proximité de <strong>{job.pickupCommune}</strong> ({job.pickupAddress}).
              </p>
            </div>

            {/* Consulting Drivers Live Badge */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
                  <Eye className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <p className="text-xs font-black text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Livreurs géolocalisés à proximité</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Secteur {job.pickupCommune} • En attente d'acceptation immédiate
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Attribution</span>
                <span className="text-sm font-mono-num font-black text-amber-400">
                  ~ {simulatedSearchSeconds}s
                </span>
              </div>
            </div>

            {/* Live Drivers in Area list with Photo and Distance Km only */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center relative group hover:border-emerald-500/50 transition-all">
                <div className="relative mb-2">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" 
                    alt="Livreur" 
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                </div>
                <p className="font-bold text-xs text-white">Bakary T.</p>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black font-mono">
                  📍 0.8 km
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center relative group hover:border-emerald-500/50 transition-all">
                <div className="relative mb-2">
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" 
                    alt="Livreur" 
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/60 shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                </div>
                <p className="font-bold text-xs text-white">Koffi J.</p>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black font-mono">
                  📍 1.4 km
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center relative group hover:border-emerald-500/50 transition-all">
                <div className="relative mb-2">
                  <img 
                    src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80" 
                    alt="Livreur" 
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/60 shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                </div>
                <p className="font-bold text-xs text-white">Moussa D.</p>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black font-mono">
                  📍 2.1 km
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header with Title & Route */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isDelivered 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isPaid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isArrived
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                      : isReturning 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : isInTransit 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isDelivered
                      ? '✓ Commande Clôturée (Code Secret Confirmé)'
                      : isPaid
                      ? '✅ Paiement Mobile Confirmé • Code Débloqué'
                      : isArrived
                      ? '📍 Livreur Arrivé sur Place • Paiement Débloqué'
                      : isReturning
                      ? '↩ Trajet Retour Vendeur'
                      : isInTransit
                      ? '🛵 En Route (Suivi GPS Actif)'
                      : '📦 Enlèvement en cours'}
                  </span>
                  <span className="text-xs text-slate-400">Mission #{job.id.slice(-6)}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-1 flex items-center gap-2">
                  <span>{job.productTitle}</span>
                </h2>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Prix & Frais</span>
                <span className="text-base font-extrabold text-amber-400 font-mono-num">
                  {totalBuyerAmount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* 5-Step Order Status Timeline */}
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                {/* 1. PENDING */}
                <div className={`p-2 rounded-xl border ${isPickedUp || isAccepted ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <p className="font-bold text-[11px]">1. PENDING</p>
                  <p className="text-[9px] text-slate-400">Commande créée</p>
                </div>
                {/* 2. IN_TRANSIT */}
                <div className={`p-2 rounded-xl border ${isInTransit || isArrived || isDelivered ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <p className="font-bold text-[11px]">2. IN_TRANSIT</p>
                  <p className="text-[9px] text-slate-400">Livreur en route</p>
                </div>
                {/* 3. ARRIVED */}
                <div className={`p-2 rounded-xl border ${isArrived || isDelivered ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <p className="font-bold text-[11px]">3. ARRIVED</p>
                  <p className="text-[9px] text-slate-400">GPS sur place</p>
                </div>
                {/* 4. PAID */}
                <div className={`p-2 rounded-xl border ${isPaid || isDelivered ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <p className="font-bold text-[11px]">4. PAID</p>
                  <p className="text-[9px] text-slate-400">Paiement direct</p>
                </div>
                {/* 5. COMPLETED */}
                <div className={`p-2 rounded-xl border ${isDelivered ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-black' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <p className="font-bold text-[11px]">5. COMPLETED</p>
                  <p className="text-[9px] text-slate-400">Code Secret validé</p>
                </div>
              </div>
            </div>

            {/* Google Maps & GPS View */}
            <div className="mb-4">
              <GoogleMapsEmbed
                pickupCommune={job.pickupCommune}
                dropoffCommune={job.dropoffCommune}
                vehicleType={job.requiredVehicle || 'moto'}
                isReturning={isReturning}
                courierName={job.assignedDriverName || 'Bakary Traoré'}
                courierPhone={job.assignedDriverPhone || '+225 01 44 77 89 22'}
                currentProgress={courierProgress}
                onProgressChange={(newProg) => setCourierProgress(newProg)}
              />
            </div>

            {/* Courier Info Card */}
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                    job.requiredVehicle === 'voiture' || job.requiredVehicle === 'car'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : job.requiredVehicle === 'cargo'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {job.requiredVehicle === 'voiture' || job.requiredVehicle === 'car' ? (
                      <Car className="w-5 h-5 animate-pulse" />
                    ) : job.requiredVehicle === 'cargo' ? (
                      <Truck className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Bike className="w-5 h-5 animate-bounce" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">
                      {job.assignedDriverName || 'Bakary Traoré'} 
                      <span className="ml-2 text-xs text-slate-400 font-normal">
                        ({job.requiredVehicle === 'voiture' || job.requiredVehicle === 'car' ? 'Voiture' : job.requiredVehicle === 'cargo' ? 'Camionnette' : 'Moto'})
                      </span>
                    </p>
                    <p className="text-xs text-emerald-400 font-medium">Livreur Certifié Brad'CI • Paiement Direct à la Livraison</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{job.assignedDriverPhone || '+225 01 44 77 89 22'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChatModalOpen(true)}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow cursor-pointer flex items-center gap-1"
                    title="Messagerie & Notes Vocales directes avec le coursier"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="text-[10px] font-black hidden sm:inline">Note Vocale</span>
                  </button>
                  <a
                    href={`tel:${job.assignedDriverPhone || '+2250144778922'}`}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow cursor-pointer"
                    title="Appeler le coursier"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/2250144778922`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors shadow cursor-pointer"
                    title="WhatsApp direct"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Plaque :</span>
                  <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase text-xs">
                    {job.assignedDriverVehiclePlate || '4523 JJ 01'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Couleur :</span>
                  <span className="text-white font-bold">{job.assignedDriverVehicleColor || 'Noir & Rouge'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Engin :</span>
                  <span className="text-emerald-400 font-medium">{job.assignedDriverVehicleModel || 'Yamaha Crypton 110'}</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* EXCLUSIVE BUYER ACTIONS & PAY ON DELIVERY INTERFACE                        */}
            {/* ========================================================================= */}
            {isBuyer && (
              <div className="space-y-4 mb-4">
                {/* 1. If Driver ARRIVED and Payment not yet done -> Show "Payer et Valider" */}
                {isArrived && !isPaid && !isDelivered && (
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/50 shadow-xl space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                          <Zap className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-white">Le Livreur est à votre porte !</h3>
                          <p className="text-xs text-slate-300">Inspectez votre colis, puis initiez le paiement direct sécurisé.</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/30">
                        Étape 4 / 5
                      </span>
                    </div>

                    {/* Operator Selection */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-2">
                        Choisissez votre moyen de paiement Mobile Money :
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2">
                        {[
                          { id: 'Wave', name: 'Wave (0%)', badge: 'Recommandé', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
                          { id: 'Orange Money', name: 'Orange Money', badge: 'Instantané', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
                          { id: 'MTN MoMo', name: 'MTN MoMo', badge: 'Instantané', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
                          { id: 'Moov Money', name: 'Moov Money', badge: 'Instantané', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
                          { id: 'Carte Visa', name: 'Carte Visa', badge: 'Sécurisé', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
                        ].map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => setSelectedOperator(op.id as PaymentMethod)}
                            className={`p-2.5 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              selectedOperator === op.id
                                ? `bg-[#1E53E5]/20 border-[#1E53E5] ring-2 ring-[#FF5B00] text-white shadow-lg`
                                : 'bg-[#151C33] border-[#222D4A] text-slate-400 hover:text-white hover:border-slate-600'
                            }`}
                          >
                            <CreditCard className={`w-4 h-4 ${selectedOperator === op.id ? 'text-[#FF5B00]' : 'text-slate-400'}`} />
                            <span className="truncate text-[11px]">{op.name}</span>
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-normal">{op.badge}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown & Split distribution details */}
                    <div className="p-3.5 rounded-2xl bg-[#0B1021] border border-[#222D4A] text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-300">
                        <span>Prix de l'article :</span>
                        <span className="font-mono font-bold text-white">{productPrice.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Frais de transport livreur :</span>
                        <span className="font-mono font-bold text-white">{deliveryFee.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Frais techniques de plateforme :</span>
                        <span className="font-mono font-bold text-white">{platformFee.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="pt-2 border-t border-[#222D4A] flex justify-between items-center text-sm font-black">
                        <span className="text-[#FF5B00]">Total à Payer à la Livraison :</span>
                        <span className="font-mono text-[#FF5B00] text-base font-black">{totalBuyerAmount.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    </div>

                    {/* Pay Button - Official Vibrant Orange (#FF5B00) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleInitiatePayment}
                        disabled={isProcessingPayment || isPaymentPending}
                        className="flex-1 py-4 px-4 rounded-2xl bg-[#FF5B00] hover:bg-[#E05000] active:scale-98 text-white font-black text-sm sm:text-base shadow-xl shadow-[#FF5B00]/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isProcessingPayment || isPaymentPending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Paiement en cours ({selectedOperator})...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 text-yellow-300" />
                            <span>PAYER ET VALIDER LA LIVRAISON ({totalBuyerAmount.toLocaleString('fr-FR')} F via {selectedOperator})</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setCancelModalOpen(true)}
                        className="px-4 py-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. If PAID -> Show dynamic delivery OTP code in HUGE GREEN (#00C853) with Royal Blue Shield badge (#1E53E5) */}
                {isPaid && !isDelivered && (
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-[#151C33] via-[#0B1021] to-[#0B1021] border-2 border-[#00C853] shadow-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Royal Blue Shield Badge (#1E53E5) */}
                        <div className="w-8 h-8 rounded-xl bg-[#1E53E5] flex items-center justify-center shadow-md">
                          <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-black text-sm uppercase tracking-wide text-[#00C853] block">
                            Paiement Direct Validé (PAID)
                          </span>
                          <span className="text-[10px] text-slate-400">Règlement Marchand Sécurisé & Confirmé</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/40 font-mono text-xs font-black">
                        PAIEMENT VALIDÉ
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Votre transfert de <strong>{totalBuyerAmount.toLocaleString('fr-FR')} FCFA</strong> a été sécurisé. <strong>Communiquez ce Code Secret de Remise au livreur</strong> après réception de votre article :
                    </p>

                    {/* Big Secret Code Display in #00C853 with Blue Shield Branding */}
                    <div className="py-5 px-4 bg-[#0B1021] rounded-2xl border border-[#00C853]/50 text-center space-y-2 shadow-inner">
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#1E53E5] font-black uppercase tracking-wider">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Code Secret de Remise du Colis</span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-black font-mono-num tracking-[0.35em] text-[#00C853] drop-shadow-md">
                        {job.deliveryOtpCode || '8814'}
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Ne transmettez ce code au livreur qu'une fois le colis physiquement contrôlé.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. If COMPLETED -> Order Finished */}
                {isDelivered && (
                  <div className="p-4 rounded-2xl bg-[#00C853]/15 border border-[#00C853]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#00C853] font-black">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Commande Clôturée avec Succès • Colis Réceptionné</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => openOfficialReceipt(job, 'buyer')}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#1E53E5] hover:bg-[#1E53E5]/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Reçu Acheteur Officiel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* DRIVER DIRECT WORKFLOW CONTROLS (IF LOGGED IN AS DRIVER)                  */}
            {/* ========================================================================= */}
            {(isDriver || currentUser?.role === 'driver') && !isDelivered && !isReturned && (
              <div className="mt-4 p-4 rounded-3xl bg-[#151C33] border border-[#222D4A] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1E53E5] flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-[#FF5B00]" />
                    <span>Espace d'Action du Livreur</span>
                  </span>
                  <span className="text-[10px] bg-[#1E53E5]/20 text-blue-300 border border-[#1E53E5]/40 px-2 py-0.5 rounded-full font-bold">
                    Statut : {job.orderStatus || job.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Step A: Pickup */}
                  {isAccepted && (
                    <button
                      onClick={handleDriverConfirmPickupDirect}
                      className="w-full py-3 px-4 rounded-xl bg-[#1E53E5] hover:bg-[#1644C4] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1E53E5]/30 transition-all cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Colis Vérifié & Enlevé - Démarrer le Trajet GPS</span>
                    </button>
                  )}

                  {/* Step B: Declare Arrival */}
                  {isInTransit && (
                    <button
                      onClick={handleDriverDeclareArrivalDirect}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#FF5B00] hover:bg-[#E05000] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#FF5B00]/30 transition-all cursor-pointer animate-bounce-short"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Signaler mon Arrivée sur Place (GPS)</span>
                    </button>
                  )}

                  {/* Step C: Awaiting Buyer Payment */}
                  {isArrived && !isPaid && (
                    <div className="p-3 bg-[#0B1021] rounded-xl border border-[#222D4A] text-xs text-center space-y-1">
                      <p className="font-bold text-[#FF5B00]">⏳ En attente du paiement direct de l'acheteur...</p>
                      <p className="text-[11px] text-slate-400">
                        L'acheteur valide le montant ({totalBuyerAmount.toLocaleString('fr-FR')} FCFA) depuis son application. Dès confirmation du règlement, il vous communiquera son Code Secret de Remise.
                      </p>
                    </div>
                  )}

                  {/* Step D: Secret Code Confirmation once Buyer has PAID with Mobile Touch Keypad */}
                  {isPaid && !isDelivered && (
                    <div className="p-4 bg-[#0B1021] rounded-2xl border border-[#00C853]/50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#00C853] flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Paiement Acheteur Validé !</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Saisissez le Code Secret remis par l'acheteur</span>
                      </div>

                      {/* Display Digits */}
                      <div className="flex justify-center gap-2 my-2">
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black font-mono-num transition-all ${
                              driverEnteredOtp[idx]
                                ? 'border-[#00C853] bg-[#00C853]/15 text-white'
                                : 'border-[#222D4A] bg-[#151C33] text-slate-500'
                            }`}
                          >
                            {driverEnteredOtp[idx] || '•'}
                          </div>
                        ))}
                      </div>

                      {/* Mobile Ergonomic Touch Keypad (0-9) */}
                      <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                          <button
                            key={digit}
                            type="button"
                            onClick={() => {
                              if (driverEnteredOtp.length < 4) {
                                setDriverEnteredOtp((prev) => prev + digit);
                              }
                            }}
                            className="py-2.5 rounded-xl bg-[#151C33] hover:bg-[#1C2644] active:bg-[#1E53E5] text-white font-bold text-lg border border-[#222D4A] cursor-pointer transition-colors"
                          >
                            {digit}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setDriverEnteredOtp('')}
                          className="py-2.5 rounded-xl bg-[#151C33] text-red-400 font-bold text-xs border border-[#222D4A] cursor-pointer"
                        >
                          Effacer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (driverEnteredOtp.length < 4) {
                              setDriverEnteredOtp((prev) => prev + '0');
                            }
                          }}
                          className="py-2.5 rounded-xl bg-[#151C33] hover:bg-[#1C2644] text-white font-bold text-lg border border-[#222D4A] cursor-pointer"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => setDriverEnteredOtp((prev) => prev.slice(0, -1))}
                          className="py-2.5 rounded-xl bg-[#151C33] text-amber-400 font-bold text-xs border border-[#222D4A] cursor-pointer"
                        >
                          ⌫
                        </button>
                      </div>

                      {/* Submit Action */}
                      <button
                        onClick={handleDriverSubmitOtp}
                        disabled={driverEnteredOtp.length !== 4}
                        className="w-full py-3.5 bg-[#00C853] hover:bg-[#00B048] disabled:opacity-40 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-[#00C853]/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-950" />
                        <span>Valider le Code Secret & Encaisser {job.deliveryFee.toLocaleString('fr-FR')} FCFA</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SELLER VIEW FOR PICKUP CODE */}
            {isSeller && isAccepted && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 to-transparent border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                    Code d'Enlèvement Boutique (À donner au livreur) :
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Donnez ce code au livreur lors de la prise en charge après vérification du colis.
                  </p>
                </div>
                <div className="text-2xl font-black font-mono-num tracking-[0.25em] text-white bg-slate-950 px-4 py-2 rounded-xl border border-blue-500/40">
                  {job.pickupCode || '4291'}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer info: Direct Pay on Delivery Guarantee */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Paiement Direct à la Livraison BRAD'CI : Remise en main propre sécurisée par Code Secret.</span>
          </div>

          <button
            onClick={handleOpenCustomerService}
            className="text-[11px] text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
          >
            Assistance Litiges 24/7
          </button>
        </div>
      </div>

      {/* Buyer Cancel / Return Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#0C121E] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Refuser le Colis & Enclencher le Retour</h3>
                <p className="text-xs text-slate-400">Le colis ne correspond pas à l'annonce</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <p className="text-[11px] text-slate-400">
                En refusant le colis, aucun montant ne sera prélevé pour l'article. Le livreur retournera immédiatement la marchandise au vendeur ({job.sellerName}).
              </p>
            </div>

            <form onSubmit={handleBuyerCancel} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Motif du refus / non-conformité :
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Article non conforme à la description, état cosmétique différent, panne constatée lors du test..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-bold rounded-xl border border-slate-800 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Confirmer le Refus & Déclencher le Retour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Messagerie Sécurisée & Notes Vocales Livreur-Client */}
      {job && chatModalOpen && (
        <DeliveryChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          jobId={job.id}
          partnerName={job.assignedDriverName || "Coursier Brad'CI"}
          partnerPhone={job.assignedDriverPhone || "+225 01 44 77 89 22"}
          partnerRole="driver"
          vehicleInfo={job.assignedDriverVehicle || job.requiredVehicle ? `Véhicule: ${(job.assignedDriverVehicle || job.requiredVehicle).toUpperCase()}` : undefined}
        />
      )}
    </div>
  );
};
