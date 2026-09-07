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
  Compass,
  CornerUpRight
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
        className="relative w-full h-[85vh] sm:h-[88vh] min-h-[580px] rounded-3xl overflow-hidden bg-[#070E1A] border border-slate-800 shadow-2xl flex flex-col justify-between select-none animate-in fade-in zoom-in-95 duration-200"
      >
        {/* ========================================================================= */}
        {/* 1. CARTE GOOGLE MAPS PLEIN ÉCRAN (85%-90% DE L'ÉCRAN - WIDGETS CROPPÉS)    */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950">
          {/* Iframe cropped to eliminate Google Maps white headers and copyright bars */}
          <iframe
            id="gmaps-incoming-course-iframe"
            title="Google Maps Course Proposée"
            src={gmapsEmbedUrl}
            className="absolute -top-16 sm:-top-20 -bottom-14 -left-2 -right-2 w-[calc(100%+16px)] h-[calc(100%+120px)] border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>

        {/* ========================================================================= */}
        {/* 2. BANDEAU DE GUIDAGE HAUT (TOP NAVIGATION BAR - COMPACT VTC)             */}
        {/* ========================================================================= */}
        <div className="relative z-10 p-2.5 sm:p-3.5 pointer-events-none">
          <div className="pointer-events-auto max-w-2xl mx-auto bg-[#0B111E]/95 backdrop-blur-md rounded-2xl border border-slate-800/90 p-3 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Direction Indicator Icon */}
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
                <CornerUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>

              {/* Next Turn & Destination Headline */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-num font-black text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                    Dans 250 m
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-white truncate">
                    DESTINATION : {currentOfferedJob.dropoffCommune.toUpperCase()}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  Approche : <strong className="text-white">{(currentOfferedJob as any).pickupDistKm || 1.8} km</strong> • {currentOfferedJob.dropoffAddress || currentOfferedJob.dropoffCommune}
                </p>
              </div>
            </div>

            {/* Countdown 30s & Gain Net */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <span className="text-[9px] text-emerald-400 uppercase font-extrabold block">Gain Net</span>
                <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono-num">
                  +{currentOfferedJob.deliveryFee.toLocaleString('fr-FR')} <span className="text-[9px] font-sans">F</span>
                </span>
              </div>

              {/* 30s Circular Countdown Timer */}
              <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
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
                <span className={`absolute text-[11px] font-black font-mono-num ${offerCountdown <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {offerCountdown}s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map is 100% visible and un-obstructed in the center */}
        <div className="flex-1" />

        {/* ========================================================================= */}
        {/* 3. BOTTOM FLOATING ACTION SHEET (BOUTONS D'ACTION VTC COMPACTS)           */}
        {/* ========================================================================= */}
        <div className="relative z-10 p-2.5 sm:p-3.5 pointer-events-none">
          <div className="pointer-events-auto max-w-2xl mx-auto bg-[#0B111E]/95 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-3.5 shadow-2xl space-y-2.5">
            {/* Delivery Details Line */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={currentOfferedJob.productImage}
                  alt={currentOfferedJob.productTitle}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-900 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate">
                    {currentOfferedJob.productTitle}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    De <strong className="text-slate-200">{currentOfferedJob.pickupCommune}</strong> à <strong className="text-emerald-400">{currentOfferedJob.dropoffCommune}</strong> ({currentOfferedJob.distanceKm || 7.5} km)
                  </p>
                </div>
              </div>

              {/* External Google Maps launch button */}
              <a
                href={externalGmapsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 flex items-center justify-center shrink-0 shadow transition-all cursor-pointer"
                title="Ouvrir dans Google Maps externe"
              >
                <Navigation className="w-4 h-4" />
              </a>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-12 gap-2 pt-0.5">
              <button
                id={`btn-decline-cascading-${currentOfferedJob.id}`}
                onClick={() => handleDeclineOrTimeout(currentOfferedJob.id, 'declined')}
                className="col-span-4 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Refuser</span>
              </button>

              <button
                id={`btn-accept-cascading-${currentOfferedJob.id}`}
                onClick={() => handleAcceptJob(currentOfferedJob.id)}
                className="col-span-8 py-3 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#F97316]/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bike className="w-4 h-4 stroke-[2.5]" />
                <span>ACCEPTER LA COURSE (+{currentOfferedJob.deliveryFee.toLocaleString('fr-FR')} F)</span>
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

        {/* Dispatch Action buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Button to receive incoming freight job in real-time */}
          <button
            id="driver-receive-incoming-course-btn"
            onClick={() => {
              setDeclinedJobIds([]);
              const targetJob = freightJobs.find(j => j.status === 'available') || freightJobs[0];
              if (targetJob) {
                setCurrentOfferedJob(targetJob);
                setOfferCountdown(30);
                playDriverNewOrderRingtone();
                addToast("Course Disponible !", `Course vers ${targetJob.dropoffCommune} prête à être acceptée.`, "info");
              }
            }}
            className="px-5 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-[#F97316]/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4" />
            <span>Recevoir une Course Immédiate</span>
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
