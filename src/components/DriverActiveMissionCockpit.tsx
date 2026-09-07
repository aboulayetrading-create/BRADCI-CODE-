import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Navigation, 
  MapPin, 
  Compass, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Timer, 
  Clock, 
  RotateCcw, 
  ShieldCheck, 
  Package, 
  Bike,
  Car,
  Truck,
  Volume2,
  VolumeX,
  X,
  CornerUpRight,
  Radio
} from 'lucide-react';
import { DeliveryJob, VehicleType } from '../types';
import { ALL_COMMUNES } from '../data/communes';
import { voiceNavigator } from '../utils/voiceNavigator';

interface DriverActiveMissionCockpitProps {
  job?: DeliveryJob;
  onBrowseOrders: () => void;
}

export const DriverActiveMissionCockpit: React.FC<DriverActiveMissionCockpitProps> = ({ 
  job,
  onBrowseOrders 
}) => {
  const {
    currentUser,
    driverConfirmPickup,
    driverDeclareArrival,
    driverSetInspectionVerdict,
    driverConfirmDeliveryOTP,
    driverStartAbsentTimer,
    driverCancelDueToAbsentBuyer,
    addToast
  } = useApp();

  // Voice navigation toggle
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => {
    return localStorage.getItem('bradci_driver_voice_muted') === 'true';
  });

  // Modal sheets for actions without leaving the map
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');

  // 20-min countdown timer for absent buyer
  const [absentTimerSeconds, setAbsentTimerSeconds] = useState(1200);
  const [isAbsentTimerRunning, setIsAbsentTimerRunning] = useState(false);

  // Map projection coordinates for Grand Abidjan
  const latMin = 5.24;
  const latMax = 5.44;
  const lngMin = -4.14;
  const lngMax = -3.86;

  const projectToMap = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = ((latMax - lat) / (latMax - latMin)) * 100;
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(12, Math.min(88, y))
    };
  };

  // Timer interval
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

  // Toggle voice and announce current navigation prompt
  const handleToggleVoice = () => {
    const nextMuted = !isVoiceMuted;
    setIsVoiceMuted(nextMuted);
    localStorage.setItem('bradci_driver_voice_muted', String(nextMuted));
    if (!nextMuted && job) {
      const targetCommune = job.status === 'accepted' ? job.pickupCommune : job.dropoffCommune;
      const instruction = job.status === 'accepted'
        ? `Guidage GPS actif. Dans 200 mètres, prenez la sortie vers le point de retrait à ${targetCommune}.`
        : `Guidage GPS actif. Dans 200 mètres, prenez la sortie vers le client à ${targetCommune}.`;
      voiceNavigator.speak(instruction);
      addToast("Guidage vocal activé", "Les instructions de navigation seront annoncées à haute voix.", "info");
    } else {
      addToast("Guidage vocal coupé", "Mode silencieux actif.", "info");
    }
  };

  // Speak current instruction
  const handleRepeatVoice = () => {
    if (!job) return;
    const targetCommune = job.status === 'accepted' ? job.pickupCommune : job.dropoffCommune;
    const instruction = job.status === 'accepted'
      ? `Dans 200 mètres, prenez la sortie vers le point de retrait à ${targetCommune}.`
      : `Dans 200 mètres, prenez la sortie vers ${targetCommune}.`;
    voiceNavigator.speak(instruction);
  };

  // Open external Google Maps App with route
  const handleOpenExternalGoogleMaps = () => {
    if (!job) return;
    const isPickupPhase = job.status === 'accepted';
    const origin = encodeURIComponent(isPickupPhase ? (currentUser?.gpsLocation?.commune || 'Abidjan') : job.pickupCommune);
    const dest = encodeURIComponent(isPickupPhase ? `${job.pickupAddress}, ${job.pickupCommune}, Abidjan` : `${job.dropoffAddress}, ${job.dropoffCommune}, Abidjan`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  // Validate pickup code
  const handleValidatePickup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!job) return;
    if (!pickupCodeInput || pickupCodeInput.trim().length < 4) {
      addToast("Code requis", "Veuillez saisir le code vendeur à 4 chiffres.", "error");
      return;
    }
    driverConfirmPickup(job.id, pickupCodeInput.trim());
    setPickupCodeInput('');
    setShowPickupModal(false);
    addToast("Colis récupéré !", "Trajet vers le client acheteur activé.", "success");
    if (!isVoiceMuted) {
      voiceNavigator.speak(`Colis récupéré avec succès. Démarrage de l'itinéraire vers l'acheteur à ${job.dropoffCommune}.`);
    }
  };

  // Validate delivery OTP
  const handleValidateDeliveryOTP = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!job) return;
    if (!deliveryOtpInput || deliveryOtpInput.trim().length < 4) {
      addToast("Code OTP requis", "Veuillez entrer le code secret acheteur (4 chiffres).", "error");
      return;
    }
    driverConfirmDeliveryOTP(job.id, deliveryOtpInput.trim());
    setDeliveryOtpInput('');
    setShowDeliveryModal(false);
    addToast("Livraison validée !", "Paiement débloqué instantanément sur votre solde.", "success");
    if (!isVoiceMuted) {
      voiceNavigator.speak("Course terminée avec succès ! Vos gains sont immédiatement disponibles sur votre solde.");
    }
  };

  // If no active job: display sleek standby view
  if (!job) {
    return (
      <div id="driver-radar-standby" className="p-8 sm:p-12 rounded-3xl bg-[#06102E] border border-slate-800 text-center space-y-6 shadow-2xl">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner z-10">
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider border border-emerald-500/30 inline-block">
            ● GPS & Radar d'Attribution En Direct
          </span>
          <h3 className="text-xl font-black text-white">Aucune course active en cours</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Votre géolocalisation GPS est synchronisée. Vous êtes positionné à{' '}
            <strong className="text-emerald-300">{currentUser?.gpsLocation?.commune || 'Abidjan'}</strong> et recevrez les propositions de courses prioritaires en temps réel.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            id="driver-standby-browse-orders-btn"
            onClick={onBrowseOrders}
            className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Consulter les Courses Disponibles</span>
          </button>
        </div>
      </div>
    );
  }

  // Current phase: Phase 1 (Pickup) or Phase 2 (Delivery)
  const isPickupPhase = job.status === 'accepted';
  const isArrivedPhase = job.status === 'arrived';
  
  // Destination and Client Info
  const targetCommune = isPickupPhase ? job.pickupCommune : job.dropoffCommune;
  const targetAddress = isPickupPhase ? job.pickupAddress : job.dropoffAddress;
  const targetClientName = isPickupPhase ? (job.sellerName || 'Vendeur') : (job.buyerName || 'Client');
  const targetClientPhone = isPickupPhase ? (job.sellerPhone || '+2250700000000') : (job.buyerPhone || '+2250700000000');

  // Compute GPS coordinates for Map
  const originCommuneObj = ALL_COMMUNES.find(c => c.name.toLowerCase() === (isPickupPhase ? 'plateau' : job.pickupCommune.toLowerCase())) || ALL_COMMUNES[0];
  const targetCommuneObj = ALL_COMMUNES.find(c => c.name.toLowerCase() === targetCommune.toLowerCase()) || ALL_COMMUNES[1];

  // Coordinates
  const courierCoords = {
    lat: isPickupPhase ? 5.328 : (originCommuneObj.coords.lat + (targetCommuneObj.coords.lat - originCommuneObj.coords.lat) * 0.45),
    lng: isPickupPhase ? -4.020 : (originCommuneObj.coords.lng + (targetCommuneObj.coords.lng - originCommuneObj.coords.lng) * 0.45)
  };

  const courierPos = projectToMap(courierCoords.lat, courierCoords.lng);
  const targetPos = projectToMap(targetCommuneObj.coords.lat, targetCommuneObj.coords.lng);

  // Remaining Distance & Time for the VTC Floating Bubble
  const remainingDistKm = isArrivedPhase ? 0.1 : (job.distanceKm ? Number((job.distanceKm * (isPickupPhase ? 0.4 : 0.6)).toFixed(1)) : 3.0);
  const remainingTimeMin = isArrivedPhase ? 1 : Math.max(2, Math.round(remainingDistKm * 2.1));

  // Trajectory control points for smooth SVG bezier curve
  const midX = (courierPos.x + targetPos.x) / 2 + (targetPos.y > courierPos.y ? -6 : 6);
  const midY = (courierPos.y + targetPos.y) / 2 + (targetPos.x > courierPos.x ? 5 : -5);
  const trajectoryPathD = `M ${courierPos.x},${courierPos.y} Q ${midX},${midY} ${targetPos.x},${targetPos.y}`;

  // Vehicle Icon
  const vehicleType = currentUser?.kycVehicleType || currentUser?.vehicleDetails?.type || 'moto';
  const VehicleIcon = vehicleType === 'car' ? Car : vehicleType === 'cargo' ? Truck : Bike;

  return (
    <div 
      id="driver-vtc-gps-screen"
      className="relative w-full h-[85vh] sm:h-[90vh] min-h-[580px] rounded-3xl overflow-hidden bg-[#060D19] border border-slate-800 shadow-2xl flex flex-col justify-between select-none"
    >
      {/* ========================================================================= */}
      {/* 1. CARTE GOOGLE MAPS PLEIN ÉCRAN (85%-90% DU COCKPIT VTC - CROPPÉE)        */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950">
        {/* Iframe cropped to eliminate Google Maps white headers and copyright bars */}
        <iframe
          id="gmaps-active-mission-iframe"
          title="Google Maps Navigation Active"
          src={`https://maps.google.com/maps?q=${encodeURIComponent((isPickupPhase ? (currentUser?.gpsLocation?.commune || 'Cocody') : job.pickupCommune) + ', Abidjan')}+to+${encodeURIComponent(targetAddress + ', ' + targetCommune + ', Abidjan')}&t=m&z=13&ie=UTF8&iwloc=&output=embed`}
          className="absolute -top-16 sm:-top-20 -bottom-14 -left-2 -right-2 w-[calc(100%+16px)] h-[calc(100%+120px)] border-0"
          loading="lazy"
          allowFullScreen
        />

        {/* Recenter GPS & Voice guidance button */}
        <div className="absolute bottom-28 right-4 z-20">
          <button
            onClick={handleRepeatVoice}
            className="w-12 h-12 rounded-full bg-[#0B111E]/95 hover:bg-slate-800 text-white border border-slate-700 shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer group"
            title="Recentrer le GPS et écouter l'instruction"
          >
            <Navigation className="w-5 h-5 text-sky-400 group-hover:rotate-45 transition-transform" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BANDEAU DE GUIDAGE HAUT (TOP NAVIGATION BAR - COMPACT VTC)             */}
      {/* ========================================================================= */}
      <div 
        id="driver-vtc-top-guidance-bar"
        className="relative z-20 m-2.5 sm:m-3.5 p-3 sm:p-3.5 rounded-2xl bg-[#0B111E]/95 backdrop-blur-md border border-slate-800/90 shadow-2xl flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Large Direction Indicator Icon */}
          <div className="w-11 h-11 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
            <CornerUpRight className="w-6 h-6 stroke-[2.5]" />
          </div>

          {/* Next Instruction Readable in 1 Second */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-num font-black text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                Dans 200 m
              </span>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                {isPickupPhase ? `Vers point de retrait • ${targetCommune}` : `DESTINATION : ${targetCommune.toUpperCase()}`}
              </h2>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {targetAddress} ({targetCommune})
            </p>
          </div>
        </div>

        {/* Small Discreet Voice Guidance Toggle Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleToggleVoice}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isVoiceMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-sky-500/20 border-sky-500/40 text-sky-400 hover:bg-sky-500/30 shadow-md'
            }`}
            title={isVoiceMuted ? "Activer le guidage vocal" : "Désactiver le guidage vocal"}
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FICHE DE COURSE BASSE FLOTTANTE (BOTTOM SHEET VTC)                     */}
      {/* ========================================================================= */}
      <div 
        id="driver-vtc-bottom-sheet"
        className="relative z-20 m-3 sm:m-4 p-4 rounded-3xl bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 shadow-2xl space-y-3.5"
      >
        {/* Step Badge & Destination Summary */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              isPickupPhase 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isPickupPhase ? 'Ramassage Colis' : 'Livraison Client'}
            </span>
            <span className="text-xs font-bold text-white">
              {job.pickupCommune} ➔ {job.dropoffCommune}
            </span>
          </div>

          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
            +{job.deliveryFee.toLocaleString('fr-FR')} F
          </span>
        </div>

        {/* Client / Recipient Contact info */}
        <div className="flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <span className="text-[11px] text-slate-400 block font-medium">
              {isPickupPhase ? 'Vendeur (Expéditeur) :' : 'Destinataire (Acheteur) :'}
            </span>
            <p className="font-extrabold text-white truncate text-sm">
              {targetClientName}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {targetAddress}
            </p>
          </div>
        </div>

        {/* Primary Action Button (BRAD'CI Orange #f97316) + 2 Circular Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          {/* Main Action Button */}
          {isPickupPhase ? (
            <button
              id="driver-btn-arrived-pickup"
              onClick={() => setShowPickupModal(true)}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#F97316]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <MapPin className="w-4 h-4 text-white shrink-0" />
              <span>Arrivé au point de retrait</span>
            </button>
          ) : job.status === 'in_transit' ? (
            <button
              id="driver-btn-arrived-dropoff"
              onClick={() => {
                driverDeclareArrival(job.id);
                addToast("Arrivée signalée", "L'acheteur a été notifié de votre présence.", "info");
              }}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#F97316]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <MapPin className="w-4 h-4 text-white shrink-0" />
              <span>Je suis arrivé chez le client</span>
            </button>
          ) : (
            <button
              id="driver-btn-validate-otp"
              onClick={() => setShowDeliveryModal(true)}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#F97316]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span>Valider OTP Livraison</span>
            </button>
          )}

          {/* Circular Button 1: Call Client */}
          <a
            id="driver-btn-call-client"
            href={`tel:${targetClientPhone}`}
            className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            title={`Appeler ${targetClientName} (${targetClientPhone})`}
          >
            <Phone className="w-5 h-5 fill-current" />
          </a>

          {/* Circular Button 2: Open in External Google Maps */}
          <button
            id="driver-btn-external-maps"
            onClick={handleOpenExternalGoogleMaps}
            className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            title="Ouvrir dans l'application Google Maps externe"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1 : CODE ENLÈVEMENT VENDEUR (RAMASSAGE COLIS)                       */}
      {/* ========================================================================= */}
      {showPickupModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>Code Enlèvement Vendeur</span>
              </div>
              <button 
                onClick={() => setShowPickupModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Demandez au vendeur (<strong>{job.sellerName}</strong>) son <strong>code à 4 chiffres</strong> pour confirmer la remise du colis :
            </p>

            <form onSubmit={handleValidatePickup} className="space-y-4">
              <input
                id="driver-modal-pickup-code"
                type="text"
                maxLength={4}
                value={pickupCodeInput}
                onChange={(e) => setPickupCodeInput(e.target.value)}
                placeholder="0000"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 text-center text-2xl font-mono-num font-bold text-white tracking-widest focus:outline-none focus:border-amber-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPickupModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-900 text-slate-400 font-bold text-xs cursor-pointer hover:bg-slate-800"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Confirmer & Démarrer Trajet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2 : CONTRÔLE PHYSIQUE & OTP LIVRAISON FINALE                        */}
      {/* ========================================================================= */}
      {showDeliveryModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90%] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Vérification & OTP Livraison</span>
              </div>
              <button 
                onClick={() => setShowDeliveryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verdict options */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">1. Constat physique avec l'acheteur :</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => driverSetInspectionVerdict(job.id, 'client_confirmed_good')}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    job.inspectionStatus === 'client_confirmed_good'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Conforme</span>
                </button>

                <button
                  type="button"
                  onClick={() => driverSetInspectionVerdict(job.id, 'client_confirmed_bad')}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    job.inspectionStatus === 'client_confirmed_bad'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Refus / Non Conforme</span>
                </button>
              </div>
            </div>

            {/* Secret Code Input */}
            <form onSubmit={handleValidateDeliveryOTP} className="space-y-3 pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-300 font-bold block">
                Code Secret à 4 chiffres (fourni par {job.buyerName}) :
              </label>
              <input
                id="driver-modal-delivery-otp"
                type="text"
                maxLength={4}
                value={deliveryOtpInput}
                onChange={(e) => setDeliveryOtpInput(e.target.value)}
                placeholder="0000"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 text-center text-2xl font-mono-num font-bold text-emerald-400 tracking-widest focus:outline-none focus:border-emerald-500"
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-900 text-slate-400 font-bold text-xs cursor-pointer hover:bg-slate-800"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Valider & Débloquer Fonds
                </button>
              </div>
            </form>

            {/* Absent Buyer 20-min alternative */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>Client injoignable sur place ?</span>
                  <Timer className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Lancez le chrono officiel de 20 minutes. Si le délai expire sans réponse : annulation autorisée avec bonus de 15%.
                </p>

                {!isAbsentTimerRunning && absentTimerSeconds === 1200 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAbsentTimerRunning(true);
                      driverStartAbsentTimer(job.id);
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl cursor-pointer"
                  >
                    Démarrer Chrono 20 min
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-xs font-bold text-amber-400">
                      <span>Temps d'attente restant :</span>
                      <span>{formatTimerMinutesSeconds(absentTimerSeconds)}</span>
                    </div>

                    {absentTimerSeconds === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          driverCancelDueToAbsentBuyer(job.id);
                          setIsAbsentTimerRunning(false);
                          setShowDeliveryModal(false);
                        }}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                      >
                        Annuler (Client Absent) & Encaisser Bonus 15%
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
