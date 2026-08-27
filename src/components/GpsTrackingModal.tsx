import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  MapPin, 
  Bike, 
  Phone, 
  ShieldCheck, 
  Clock, 
  Navigation, 
  KeyRound, 
  CheckCircle2, 
  Package, 
  MessageCircle, 
  AlertTriangle, 
  RotateCcw, 
  Truck, 
  ArrowRight, 
  Info, 
  DollarSign,
  Volume2,
  Radio,
  Eye,
  Headphones,
  Users,
  Timer,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { GoogleMapsEmbed } from './GoogleMapsEmbed';
import { DeliveryJob } from '../types';

export const GpsTrackingModal: React.FC = () => {
  const { 
    gpsTrackingJob, 
    setGpsTrackingJob, 
    currentUser, 
    buyerCancelAndReturnPackage, 
    buyerConfirmDeliveryOTP,
    sellerConfirmReturnReceived,
    driverConfirmReturnOTP,
    driverConfirmPickup,
    driverDeclareArrival,
    freightJobs,
    addToast
  } = useApp();

  const [courierProgress, setCourierProgress] = useState(25); // % along the route
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  
  // Radar & Search state for 'available' jobs
  const [activeConsultingDriversCount, setActiveConsultingDriversCount] = useState(3);
  const [simulatedSearchSeconds, setSimulatedSearchSeconds] = useState(6);
  
  // Packaging Timer Simulation (10 min allowance)
  const [packagingElapsedSeconds, setPackagingElapsedSeconds] = useState(180); // 3 mins into packaging

  // Transit delay calculation
  const [transitElapsedMinutes, setTransitElapsedMinutes] = useState(12);

  // Synchronize live job from freightJobs state
  const job: DeliveryJob | undefined = freightJobs.find(j => j.id === gpsTrackingJob?.id) || gpsTrackingJob || undefined;

  useEffect(() => {
    if (!job) return;
    
    // Auto-advance courier progress if in transit
    if (job.status === 'in_transit') {
      const interval = setInterval(() => {
        setCourierProgress(prev => (prev >= 95 ? 95 : prev + 1.5));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [job]);

  // Simulation of available job driver acceptance
  useEffect(() => {
    if (!job || job.status !== 'available') return;

    const timer = setInterval(() => {
      setSimulatedSearchSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-assign first driver
          if (gpsTrackingJob) {
            const updated: DeliveryJob = {
              ...gpsTrackingJob,
              status: 'accepted',
              assignedDriverId: 'driver-bakary',
              assignedDriverName: 'Bakary Traoré',
              assignedDriverPhone: '+225 01 44 77 89 22',
              assignedDriverVehicle: 'moto',
              sellerPackagingTimerStartedAt: new Date().toISOString()
            };
            setGpsTrackingJob(updated);
            addToast(
              '🛵 Livreur Assigné en Direct !',
              'Bakary Traoré (Moto) a accepté votre course et se dirige vers le point de retrait.',
              'success'
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [job, gpsTrackingJob]);

  if (!job) return null;

  const isSeller = currentUser?.id === job.sellerName || (currentUser?.name && job.sellerName.includes(currentUser.name));
  const isBuyer = currentUser?.name === job.buyerName || (!isSeller && currentUser?.role === 'client');
  const isDriver = currentUser?.role === 'driver' || currentUser?.id === job.assignedDriverId;

  // Status checks
  const isAvailable = job.status === 'available';
  const isAccepted = job.status === 'accepted';
  const isInTransit = job.status === 'in_transit';
  const isArrived = job.status === 'arrived';
  const isReturning = job.status === 'returning';
  const isReturned = job.status === 'returned';
  const isDelivered = job.status === 'delivered';
  const isPickedUp = isInTransit || isArrived || isDelivered || isReturning || isReturned;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="gps-tracking-card" 
        className="w-full max-w-3xl bg-[#0B111E] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl relative my-auto max-h-[94vh] overflow-y-auto text-white"
      >
        {/* Top Control Bar with Close & Customer Service Buttons */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCustomerService}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Assistance Client 24/7</span>
            </button>
            <span className="hidden sm:inline-block text-[11px] text-slate-400">
              Résolution instantanée d'incidents
            </span>
          </div>

          <button
            onClick={() => setGpsTrackingJob(null)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
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
                    <span>{activeConsultingDriversCount} Livreurs Consultent l'Offre en ce moment</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Secteur {job.pickupCommune} • Frais de course : <strong className="text-emerald-400 font-mono">{job.deliveryFee.toLocaleString('fr-FR')} FCFA</strong>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Attribution auto</span>
                <span className="text-sm font-mono-num font-black text-amber-400">
                  ~ {simulatedSearchSeconds}s
                </span>
              </div>
            </div>

            {/* Live Drivers in Area list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto text-left">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">Bakary T.</p>
                  <p className="text-[10px] text-slate-400">Moto • 850m</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">Moussa S.</p>
                  <p className="text-[10px] text-slate-400">Moto • 1.2 km</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">Kouassi A.</p>
                  <p className="text-[10px] text-slate-400">Moto • 1.8 km</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE / IN PROGRESS JOB DISPLAY */
          <>
            {/* Header Title with Role context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  <Navigation className="w-3.5 h-3.5 animate-pulse" />
                  <span>
                    {isReturning 
                      ? '🔄 Trajet Retour vers Vendeur (Colis Non-Conforme)' 
                      : isReturned 
                      ? '✅ Colis Restitué au Vendeur' 
                      : isAccepted 
                      ? '🛵 Livreur en Route vers la Boutique'
                      : isInTransit 
                      ? '📍 Colis en Acheminement vers Destinataire'
                      : isArrived 
                      ? '🚪 Livreur Arrivé à Destination'
                      : 'Suivi Télémétrie GPS en Direct'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                  {job.productTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Course assignée • De <strong>{job.pickupCommune}</strong> ({job.pickupAddress}) vers <strong>{job.dropoffCommune}</strong>
                </p>
              </div>

              <div className="sm:text-right bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  {isReturning ? 'Retour estimé :' : isReturned ? 'Statut course :' : 'Arrivée estimée (ETA) :'}
                </span>
                <span className="text-xl font-mono-num font-black text-amber-400 flex items-center sm:justify-end gap-1 mt-0.5">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>
                    {isReturned 
                      ? 'Restitué' 
                      : isReturning 
                      ? `${Math.max(4, (job.etaMinutes || 12))} min` 
                      : isDelivered 
                      ? 'Livré' 
                      : isArrived 
                      ? 'Sur place'
                      : `${Math.max(3, (job.etaMinutes || 15) - Math.floor(courierProgress / 10))} min`}
                  </span>
                </span>
              </div>
            </div>

            {/* MANDATORY CONTRADICTORY INSPECTION & PACKAGING PROTOCOL BANNER */}
            <div className="mb-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white text-xs">
                    Protocole de Sécurité & Emballage Contradictoire Brad'CI :
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <strong>1. Vendeur :</strong> Vous devez impérativement <strong>déballer l'article et montrer le produit réel</strong> au livreur pour vérification de conformité visuelle avec l'annonce.<br />
                    <strong>2. Livreur :</strong> Contrôlez que le produit correspond fidèlement à la photo avant d'assister à l'emballage sécurisé.<br />
                    <strong>3. Vendeur :</strong> Remballez soigneusement le colis devant le coursier puis communiquez-lui votre code d'enlèvement.
                  </p>
                </div>
              </div>
            </div>

            {/* PENALTY WARNING & COUNTER BANNER (100 FCFA / min) */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Seller Packaging Delay Tracker */}
              <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                sellerPenaltyFCFA > 0 
                  ? 'bg-red-500/15 border-red-500/40 text-red-200' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}>
                <Timer className={`w-4 h-4 shrink-0 mt-0.5 ${sellerPenaltyFCFA > 0 ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">Délai Emballage Vendeur</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 font-bold">
                      {packagingMinutes} min écoulées
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    10 min gratuites autorisées. Au-delà (11e min+), <strong>100 FCFA / min</strong> de pénalité sont déduits du paiement vendeur au profit de Brad'CI.
                  </p>
                  {sellerPenaltyFCFA > 0 && (
                    <p className="text-[11px] font-black text-red-400 font-mono mt-1">
                      ⚠️ Pénalité appliquée : -{sellerPenaltyFCFA.toLocaleString('fr-FR')} FCFA ({sellerPenaltyMinutes} min de retard)
                    </p>
                  )}
                </div>
              </div>

              {/* Driver Transit & Non-Cancellation Lock */}
              <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                driverPenaltyFCFA > 0 
                  ? 'bg-red-500/15 border-red-500/40 text-red-200' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}>
                <AlertOctagon className={`w-4 h-4 shrink-0 mt-0.5 ${driverPenaltyFCFA > 0 ? 'text-red-400 animate-spin' : 'text-emerald-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">Règle Course Livreur</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-emerald-400 font-bold">
                      Course Verrouillée
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    <strong>Interdiction d'annuler</strong> une course acceptée. Retard &gt; 20 min au-delà de l'ETA GPS = <strong>100 FCFA / min</strong> facturés au livreur.
                  </p>
                  {driverPenaltyFCFA > 0 && (
                    <p className="text-[11px] font-black text-red-400 font-mono mt-1">
                      ⚠️ Pénalité retard coursier : -{driverPenaltyFCFA.toLocaleString('fr-FR')} FCFA
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Escrow Banner */}
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 font-medium">
                    {isSeller 
                      ? 'Solde Séquestre Vendeur Bloqué :' 
                      : isBuyer 
                      ? 'Montant Séquestre Acheteur Envoyé :' 
                      : 'Valeur Article sous Séquestre :'}
                  </span>
                  <p className="text-sm font-extrabold text-amber-400 font-mono-num">
                    {Number(job.itemValue || 185000).toLocaleString('fr-FR')} FCFA + {job.deliveryFee.toLocaleString('fr-FR')} F livraison
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 sm:text-right">
                {isReturning ? (
                  <span className="text-amber-400 font-bold">
                    ⚠️ Colis refusé • Frais livreur ({job.deliveryFee.toLocaleString('fr-FR')} F) versés • Remboursement acheteur validé
                  </span>
                ) : isReturned ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ Marchandise réintégrée chez le vendeur • Course clôturée
                  </span>
                ) : isDelivered ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ Fonds transférés sur le solde de retrait du vendeur
                  </span>
                ) : (
                  <span>
                    🛡️ Séquestre sécurisé. Validation définitive par code OTP acheteur après inspection.
                  </span>
                )}
              </div>
            </div>

            {/* 3-Step Timeline Progression Banner */}
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Step 1 */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isAccepted
                    ? 'bg-blue-500/15 border-blue-400 text-blue-300'
                    : isPickedUp
                    ? 'bg-slate-900 border-slate-800 text-slate-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isPickedUp ? 'bg-emerald-500 text-slate-950' : 'bg-blue-500 text-white'
                  }`}>
                    {isPickedUp ? '✓' : '1'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">1. Enlèvement boutique</p>
                    <p className="text-[10px] text-slate-400 truncate">{job.pickupCommune}</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isReturning || isReturned
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : isInTransit
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : isDelivered || isArrived
                    ? 'bg-slate-900 border-slate-800 text-slate-400'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isDelivered || isReturned ? 'bg-emerald-500 text-slate-950' : isReturning ? 'bg-amber-500 text-slate-950' : isInTransit ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isDelivered || isReturned ? '✓' : isReturning ? '↩' : '2'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {isReturning ? '2. Refus & Trajet Retour' : '2. Colis en transit GPS'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {isReturning ? 'Vers vendeur' : 'Vers destinataire'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isReturned || isDelivered || isArrived
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isDelivered || isReturned ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isDelivered || isReturned ? '✓' : '3'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {isReturning ? '3. Restitution Vendeur' : isReturned ? '3. Colis Restitué' : '3. Remise Conforme OTP'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {isReturning ? job.pickupCommune : job.dropoffCommune}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Google Maps & Interactive GPS Telemetry Navigation with Voice Guidance */}
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

            {/* Courier Info + Persona Code Cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Driver Card with Contacts */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{job.assignedDriverName || 'Bakary Traoré'}</p>
                    <p className="text-xs text-emerald-400 font-medium">Livreur Certifié Brad'CI</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{job.assignedDriverPhone || '+225 01 44 77 89 22'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${job.assignedDriverPhone || '+2250144778922'}`}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow"
                    title="Appeler le coursier"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/2250144778922`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors shadow"
                    title="WhatsApp direct"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Persona Specific Code Card */}
              {isReturning ? (
                /* Return In Progress Card */
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Code OTP Retour Généré :</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      Retour Vendeur
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-2xl font-black font-mono-num tracking-[0.25em] text-white bg-slate-950 px-3 py-1 rounded-xl border border-amber-500/40">
                      {job.returnOtpCode || '9012'}
                    </span>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Certifie le refus et la restitution du colis au vendeur.
                    </p>
                  </div>
                </div>
              ) : isSeller ? (
                /* Vendeur: Code d'Enlèvement */
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/15 to-transparent border border-blue-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Code d'Enlèvement Vendeur :</span>
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                      À donner au livreur
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-2xl font-black font-mono-num tracking-[0.25em] text-white bg-slate-950 px-3 py-1 rounded-xl border border-blue-500/40">
                      {job.pickupCode || '4291'}
                    </span>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Donnez ce code au livreur après déballage, vérification et emballage pour valider la prise en charge.
                    </p>
                  </div>
                </div>
              ) : (
                /* Acheteur: Code Secret OTP */
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-transparent border border-amber-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Votre Code Secret OTP :</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      À donner à la remise
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-2xl font-black font-mono-num tracking-[0.25em] text-white bg-slate-950 px-3 py-1 rounded-xl border border-amber-500/40">
                      {job.deliveryOtpCode || '8814'}
                    </span>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Ne donnez ce code qu'<strong>après déballage et inspection physique</strong> de l'article !
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* DRIVER DIRECT WORKFLOW CONTROLS (IF LOGGED IN AS DRIVER OR SIMULATED) */}
            {(isDriver || currentUser?.role === 'driver') && !isDelivered && !isReturned && (
              <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                    <Bike className="w-4 h-4" />
                    <span>Commandes d'Action du Livreur</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Statut actuel : {job.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Step A: Pickup & En Route button */}
                  {isAccepted && (
                    <button
                      onClick={handleDriverConfirmPickupDirect}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Colis Vérifié & Emballé - Démarrer Course</span>
                    </button>
                  )}

                  {/* Step B: Declare Arrival button */}
                  {isInTransit && (
                    <button
                      onClick={handleDriverDeclareArrivalDirect}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Je suis Arrivé chez le Destinataire</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Controls for Buyer or Seller */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              {isBuyer && !isDelivered && !isReturning && !isReturned && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-xs">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Contrôle Qualité Réception Colis</span>
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Le livreur est arrivé ? Inspectez le colis avant toute validation.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Refuser / Annuler (Non-conforme)</span>
                    </button>

                    <button
                      onClick={() => buyerConfirmDeliveryOTP(job.id, job.deliveryOtpCode)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider Réception Conforme</span>
                    </button>
                  </div>
                </div>
              )}

              {isSeller && isReturning && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div>
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>Colis en Retour chez vous ({job.pickupCommune})</span>
                    </p>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      L'acheteur a refusé le colis pour non-conformité. Le livreur vous restitue la marchandise.
                    </p>
                  </div>

                  <button
                    onClick={handleSellerConfirmReturn}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmer Réception du Colis Restitué</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Security & Escrow Guarantee Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Séquestre BRAD'CI Actif : Fonds garantis sous séquestre Wave / MoMo jusqu'à validation.</span>
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
              <div className="flex justify-between">
                <span>Remboursement Produit :</span>
                <span className="font-bold text-emerald-400 font-mono">
                  + {Number(job.itemValue).toLocaleString('fr-FR')} FCFA (sur votre solde)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frais de déplacement Livreur :</span>
                <span className="font-bold text-amber-400 font-mono">
                  - {job.deliveryFee.toLocaleString('fr-FR')} FCFA (versés au coursier)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                Le livreur retournera immédiatement l'article au vendeur ({job.sellerName}). Un <strong>code OTP Retour</strong> sera généré.
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
    </div>
  );
};
