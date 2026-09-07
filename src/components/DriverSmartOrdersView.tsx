import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bike, 
  Car, 
  Truck, 
  MapPin, 
  Navigation, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  RotateCcw, 
  Radio, 
  Zap, 
  Power,
  Phone,
  Flame,
  TrendingUp,
  Compass
} from 'lucide-react';
import { DeliveryJob, VehicleType } from '../types';
import { calculateCommuneDistanceKm, getCommuneBadgeInfo } from '../data/communes';
import { playDriverNewOrderRingtone } from '../utils/voiceNavigator';
import { DriverActiveMissionCockpit } from './DriverActiveMissionCockpit';

interface DriverSmartOrdersViewProps {
  onSwitchToRadar?: () => void;
}

export const DriverSmartOrdersView: React.FC<DriverSmartOrdersViewProps> = ({
  onSwitchToRadar
}) => {
  const { 
    currentUser, 
    freightJobs, 
    driverAcceptJob, 
    toggleDriverAvailability,
    userLocation,
    addToast
  } = useApp();

  const isOnline = currentUser?.driverAvailability !== 'offline';
  const driverCommune = currentUser?.gpsLocation?.commune || userLocation?.commune || 'Cocody';

  // Check if driver currently has an active job
  const myActiveJob = useMemo(() => {
    return freightJobs.find(
      j => (j.assignedDriverId === currentUser?.id || j.assignedDriverName === currentUser?.name) &&
           j.status !== 'delivered' &&
           j.status !== 'cancelled'
    );
  }, [freightJobs, currentUser]);

  // Track refused job IDs during this session to simulate cascade to next courier
  const [declinedJobIds, setDeclinedJobIds] = useState<string[]>([]);
  
  // Cascade search radius: 25km covers Grand Abidjan
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(25.0);
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'satellite'>('roadmap');

  // 30-second offer countdown
  const [offerCountdown, setOfferCountdown] = useState<number>(30);
  const [currentOfferedJob, setCurrentOfferedJob] = useState<DeliveryJob | null>(null);

  // Smart chaining banner state (after job completion)
  const [chainingNotification, setChainingNotification] = useState<{
    previousDropoff: string;
    suggestedJob: DeliveryJob | null;
  } | null>(null);

  // Sound alert trigger ref
  const lastAnnouncedJobIdRef = useRef<string | null>(null);

  // Calculate distances for all available jobs
  const candidateJobs = useMemo(() => {
    return freightJobs
      .filter(j => (j.status === 'available' || j.status === 'pending_driver') && !declinedJobIds.includes(j.id))
      .map(job => {
        const pickupDistKm = calculateCommuneDistanceKm(driverCommune, job.pickupCommune);
        const approachTimeMin = Math.max(2, Math.round(pickupDistKm * 2.2));
        return {
          ...job,
          pickupDistKm,
          approachTimeMin
        };
      })
      .sort((a, b) => a.pickupDistKm - b.pickupDistKm);
  }, [freightJobs, declinedJobIds, driverCommune]);

  // Determine closest job within current search radius, fallback to first candidate
  const closestJob = useMemo(() => {
    if (candidateJobs.length === 0) return null;
    const inRadius = candidateJobs.find(j => j.pickupDistKm <= searchRadiusKm);
    return inRadius || candidateJobs[0];
  }, [candidateJobs, searchRadiusKm]);

  // When a new closest job is matched, start the 30-second offer timer
  useEffect(() => {
    if (!isOnline || myActiveJob) {
      setCurrentOfferedJob(null);
      return;
    }

    if (closestJob && closestJob.id !== currentOfferedJob?.id) {
      setCurrentOfferedJob(closestJob);
      setOfferCountdown(30);

      // Play alert ringtone
      if (lastAnnouncedJobIdRef.current !== closestJob.id) {
        lastAnnouncedJobIdRef.current = closestJob.id;
        playDriverNewOrderRingtone();
      }
    } else if (!closestJob) {
      setCurrentOfferedJob(null);
    }
  }, [closestJob, isOnline, myActiveJob, currentOfferedJob]);

  // 30-second countdown interval
  useEffect(() => {
    if (!currentOfferedJob) return;

    const timer = setInterval(() => {
      setOfferCountdown(prev => {
        if (prev <= 1) {
          // Timeout expired: cascade to 2nd closest courier!
          handleDeclineOrTimeout(currentOfferedJob.id, 'timeout');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentOfferedJob]);

  // Handle refusal or 30-second timeout
  const handleDeclineOrTimeout = (jobId: string, reason: 'declined' | 'timeout') => {
    setDeclinedJobIds(prev => [...prev, jobId]);
    setCurrentOfferedJob(null);

    if (reason === 'timeout') {
      addToast(
        "Délai de 30s écoulé",
        "La course a été automatiquement transmise au 2ème livreur le plus proche.",
        "info"
      );
    } else {
      addToast(
        "Course refusée",
        "Transmission immédiate au confrère le plus proche dans la zone.",
        "info"
      );
    }

    // If no more candidates in current radius, expand search radius
    const remainingInRadius = candidateJobs.filter(j => j.id !== jobId && j.pickupDistKm <= searchRadiusKm);
    if (remainingInRadius.length === 0) {
      setSearchRadiusKm(prev => {
        if (prev < 10) return 10.0;
        if (prev < 20) return 20.0;
        return 20.0;
      });
    }
  };

  // Handle acceptance
  const handleAcceptJob = (jobId: string) => {
    driverAcceptJob(jobId);
    setCurrentOfferedJob(null);
    addToast(
      "Course attribuée avec succès !",
      "Votre itinéraire GPS et les détails de retrait sont activés.",
      "success"
    );
  };

  // Helper for vehicle icon
  const getVehicleIcon = (v: VehicleType | string) => {
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

  // 1. If courier is Offline, prompt to go Online
  if (!isOnline) {
    return (
      <div id="driver-orders-offline-state" className="max-w-xl mx-auto py-12 px-6 text-center space-y-5 bg-[#06102E] border border-slate-800 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
          <Power className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white font-display">Vous êtes actuellement Hors Ligne</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Pour recevoir les propositions de courses en cascade attribuées au livreur le plus proche, passez en service.
          </p>
        </div>

        <button
          onClick={toggleDriverAvailability}
          className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
        >
          <Power className="w-5 h-5 stroke-[2.5]" />
          <span>PASSER EN SERVICE (ACTIVER LE RADAR)</span>
        </button>
      </div>
    );
  }

  // 2. If Courier has an Active Mission in progress, show VTC cockpit directly without distraction
  if (myActiveJob) {
    return (
      <div id="driver-active-mission-wrapper" className="w-full">
        <DriverActiveMissionCockpit
          job={myActiveJob}
          onBrowseOrders={() => {}}
        />
      </div>
    );
  }

  // 3. If a closest mission is offered exclusively to this driver (Cascading dispatch with 30s timer)
  if (currentOfferedJob) {
    const pickupBadge = getCommuneBadgeInfo(currentOfferedJob.pickupCommune);
    const dropoffBadge = getCommuneBadgeInfo(currentOfferedJob.dropoffCommune);
    const progressPercent = (offerCountdown / 30) * 100;

    const originQuery = encodeURIComponent(`${currentOfferedJob.pickupAddress || currentOfferedJob.pickupCommune}, ${currentOfferedJob.pickupCommune}, Abidjan, Côte d'Ivoire`);
    const destQuery = encodeURIComponent(`${currentOfferedJob.dropoffAddress || currentOfferedJob.dropoffCommune}, ${currentOfferedJob.dropoffCommune}, Abidjan, Côte d'Ivoire`);
    const gmapsEmbedUrl = `https://maps.google.com/maps?q=${originQuery}+to+${destQuery}&t=${mapLayer === 'satellite' ? 'k' : 'm'}&z=12&ie=UTF8&iwloc=&output=embed`;
    const externalGmapsAppUrl = `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destQuery}&travelmode=driving`;

    return (
      <div 
        id="driver-cascading-offer-card" 
        className="relative w-full h-[85vh] min-h-[600px] max-h-[880px] rounded-3xl overflow-hidden bg-[#070E1A] border border-slate-800 shadow-2xl flex flex-col justify-between select-none animate-in fade-in zoom-in-95 duration-200"
      >
        {/* ========================================================================= */}
        {/* CARTE GOOGLE MAPS PLEIN ÉCRAN (RENDU 85% DU COCKPIT)                     */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950">
          <iframe
            id="gmaps-incoming-course-iframe"
            title="Google Maps Course Proposée"
            src={gmapsEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>

        {/* ========================================================================= */}
        {/* 1. TOP FLOATING HUD : COMPTEUR 30S & ATTRIBUTION PRIORITAIRE               */}
        {/* ========================================================================= */}
        <div className="relative z-10 p-3 sm:p-4 pointer-events-none">
          <div className="pointer-events-auto max-w-2xl mx-auto bg-[#0A1324]/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Circular 30s Countdown Clock */}
              <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={offerCountdown <= 10 ? 'text-red-500' : 'text-[#F97316]'}
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className={`absolute text-xs font-black font-mono-num ${offerCountdown <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {offerCountdown}s
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-[#F97316]/20 text-[#F97316] text-[10px] font-black uppercase tracking-wider border border-[#F97316]/40 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Attribution Prioritaire</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">
                    ● Vous êtes le livreur le plus proche
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                  Approche : <strong className="text-white">{(currentOfferedJob as any).pickupDistKm || 1.8} km</strong> (~{(currentOfferedJob as any).approachTimeMin || 4} min)
                </p>
              </div>
            </div>

            {/* Payout & Layer Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <span className="text-[9px] text-emerald-400 uppercase font-extrabold block">Gain Net</span>
                <span className="text-sm sm:text-base font-black text-emerald-400 font-mono-num">
                  +{currentOfferedJob.deliveryFee.toLocaleString('fr-FR')} <span className="text-[10px] font-sans">F</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMapLayer(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Changer de vue cartographique"
              >
                <Compass className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="hidden sm:inline">{mapLayer === 'roadmap' ? 'Satellite' : 'Plan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BANDEAU DE DESTINATION FLOTTANT SUR LA CARTE (HAUTE LISIBILITÉ)         */}
        {/* ========================================================================= */}
        <div className="relative z-10 px-3 sm:px-4 pointer-events-none my-auto">
          <div className="pointer-events-auto max-w-lg mx-auto bg-[#070E1A]/95 backdrop-blur-md rounded-2xl border-2 border-[#F97316] p-4 shadow-2xl space-y-2.5">
            {/* DESTINATION HIGHLIGHT */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-500 border border-red-500/40 flex items-center justify-center shrink-0 shadow-lg mt-0.5">
                <MapPin className="w-5 h-5 fill-red-500/30 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                    Point de Livraison (Acheteur)
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${dropoffBadge.badgeClass}`}>
                    {currentOfferedJob.dropoffCommune}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                  DESTINATION : {currentOfferedJob.dropoffCommune.toUpperCase()}
                </h4>
                <p className="text-xs font-semibold text-slate-300 mt-0.5 line-clamp-1">
                  {currentOfferedJob.dropoffAddress}
                </p>
              </div>
            </div>

            {/* Trajectory Divider */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-[11px] text-slate-400 truncate">
                  Départ : <strong className="text-slate-200">{currentOfferedJob.pickupCommune}</strong> ({currentOfferedJob.pickupAddress})
                </span>
              </div>
              <div className="shrink-0 flex items-center gap-1 font-mono font-bold text-amber-300 text-xs">
                <Navigation className="w-3.5 h-3.5 text-[#F97316]" />
                <span>{currentOfferedJob.distanceKm || 7.5} km • ~{currentOfferedJob.etaMinutes || 20} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM FLOATING ACTION SHEET (BOUTONS D'ACTION VTC)                     */}
        {/* ========================================================================= */}
        <div className="relative z-10 p-3 sm:p-4 pointer-events-none">
          <div className="pointer-events-auto max-w-2xl mx-auto bg-[#0A1324]/95 backdrop-blur-md rounded-2xl border border-slate-700/90 p-3.5 sm:p-4 shadow-2xl space-y-3">
            {/* Product summary snippet */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentOfferedJob.productImage}
                  alt={currentOfferedJob.productTitle}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-900 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Colis à livrer
                  </span>
                  <h5 className="text-xs sm:text-sm font-black text-white truncate">
                    {currentOfferedJob.productTitle}
                  </h5>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Valeur : <strong className="text-slate-200">{currentOfferedJob.itemValue.toLocaleString('fr-FR')} FCFA</strong>
                  </span>
                </div>
              </div>

              {/* Open in External Google Maps app button */}
              <a
                href={externalGmapsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0"
                title="Ouvrir dans Google Maps externe"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Google Maps App</span>
              </a>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
              <button
                id={`btn-decline-cascading-${currentOfferedJob.id}`}
                onClick={() => handleDeclineOrTimeout(currentOfferedJob.id, 'declined')}
                className="sm:col-span-4 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Refuser (Passer)</span>
              </button>

              <button
                id={`btn-accept-cascading-${currentOfferedJob.id}`}
                onClick={() => handleAcceptJob(currentOfferedJob.id)}
                className="sm:col-span-8 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#FB923C] hover:to-[#F97316] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#F97316]/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bike className="w-5 h-5 stroke-[2.5]" />
                <span>ACCEPTER LA COURSE (+{currentOfferedJob.deliveryFee.toLocaleString('fr-FR')} FCFA)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Standby Radar Scanning State (No immediate offer, waiting for closest order)
  return (
    <div id="driver-smart-orders-standby" className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Smart Standby Radar Display */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[#06102E] border border-slate-800 text-center shadow-2xl relative overflow-hidden space-y-6">
        {/* Animated Concentric Radar Pulse */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-4 rounded-full border border-emerald-500/30 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-[#F97316]/40" />
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Système d'Attribution en Veille Active</span>
          </div>

          <h3 className="text-xl font-black text-white font-display">
            En attente de la prochaine vente à proximité
          </h3>

          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Dès qu'une enchère ou un achat est validé à <strong className="text-white">{driverCommune}</strong>, la course vous sera proposée en priorité avec un affichage Google Maps en direct (délai d'acceptation 30s).
          </p>
        </div>

        {/* Telemetry Status Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Votre Secteur GPS</span>
            <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{driverCommune}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Rayon Actuel</span>
            <span className="text-xs font-mono font-bold text-amber-300 mt-0.5 block">
              {searchRadiusKm} km
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Rang d'Attribution</span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
              Rang #1 (Prioritaire)
            </span>
          </div>
        </div>

        {/* Action / Simulation buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Button to simulate receiving a course immediately */}
          <button
            id="driver-simulate-incoming-course-btn"
            onClick={() => {
              setDeclinedJobIds([]);
              const targetJob = freightJobs.find(j => j.status === 'available') || freightJobs[0];
              if (targetJob) {
                setCurrentOfferedJob(targetJob);
                setOfferCountdown(30);
                playDriverNewOrderRingtone();
                addToast("Nouvelle Course !", `Course vers ${targetJob.dropoffCommune} attribuée.`, "info");
              }
            }}
            className="px-5 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-[#F97316]/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4" />
            <span>Simuler la Réception d'une Course</span>
          </button>

          {declinedJobIds.length > 0 && (
            <button
              onClick={() => {
                setDeclinedJobIds([]);
                setSearchRadiusKm(25.0);
                addToast("Réinitialisation", "Toutes les courses sont à nouveau éligibles.", "info");
              }}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les refus ({declinedJobIds.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
