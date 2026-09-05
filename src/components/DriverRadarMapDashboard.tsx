import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bike, 
  Car, 
  Truck, 
  MapPin, 
  Navigation, 
  Radio, 
  Zap, 
  Power, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Star, 
  Package, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  Locate, 
  Compass,
  Sparkles,
  TrendingUp,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { DeliveryJob, VehicleType } from '../types';
import { ALL_COMMUNES, calculateCommuneDistanceKm, getCommuneBadgeInfo } from '../data/communes';
import { playDriverNewOrderRingtone } from '../utils/voiceNavigator';

interface DriverRadarMapDashboardProps {
  onSelectJob?: (job: DeliveryJob) => void;
  onNavigateToTab?: (tab: 'available_orders' | 'active_mission' | 'earnings' | 'history') => void;
}

export const DriverRadarMapDashboard: React.FC<DriverRadarMapDashboardProps> = ({
  onSelectJob,
  onNavigateToTab
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
  const driverVehicle = currentUser?.kycVehicleType || currentUser?.vehicleDetails?.type || 'moto';

  // Driver GPS coordinates
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number }>(() => {
    if (userLocation?.lat && userLocation?.lng) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    const communeObj = ALL_COMMUNES.find(c => c.name.toLowerCase() === driverCommune.toLowerCase());
    return communeObj ? { lat: communeObj.coords.lat, lng: communeObj.coords.lng } : { lat: 5.3599, lng: -4.0082 };
  });

  const [mapStyle, setMapStyle] = useState<'night' | 'satellite' | 'standard'>('night');
  const [radarRadiusKm, setRadarRadiusKm] = useState<number>(5.0);
  const [selectedJob, setSelectedJob] = useState<DeliveryJob | null>(null);
  const [isSimulatingGpsPulse, setIsSimulatingGpsPulse] = useState(true);

  // Completed jobs to compute daily metrics
  const myCompletedJobs = useMemo(() => {
    return freightJobs.filter(
      j => (j.assignedDriverId === currentUser?.id || j.assignedDriverName === currentUser?.name || currentUser?.role === 'driver') &&
           j.status === 'delivered'
    );
  }, [freightJobs, currentUser]);

  const dailyEarnings = useMemo(() => {
    // Sum of deliveries completed today
    return myCompletedJobs.reduce((sum, j) => sum + (j.deliveryFee || 0), 0);
  }, [myCompletedJobs]);

  const activeMission = useMemo(() => {
    return freightJobs.find(
      j => (j.assignedDriverId === currentUser?.id || j.assignedDriverName === currentUser?.name) &&
           j.status !== 'delivered' &&
           j.status !== 'cancelled'
    );
  }, [freightJobs, currentUser]);

  // Available jobs with proximity
  const enrichedAvailableJobs = useMemo(() => {
    return freightJobs
      .filter(j => j.status === 'available')
      .map(job => {
        const pickupDistKm = calculateCommuneDistanceKm(driverCommune, job.pickupCommune);
        const approachTimeMin = Math.max(2, Math.round(pickupDistKm * 2.2));
        const isNearby = pickupDistKm <= radarRadiusKm;
        return {
          ...job,
          pickupDistKm,
          approachTimeMin,
          isNearby
        };
      })
      .sort((a, b) => a.pickupDistKm - b.pickupDistKm);
  }, [freightJobs, driverCommune, radarRadiusKm]);

  // Nearby jobs within radar range
  const radarJobs = enrichedAvailableJobs.filter(j => j.isNearby);

  const handleAcceptJob = (jobId: string) => {
    if (!isOnline) {
      addToast("Passez en service", "Activez le mode 'En Service' pour accepter cette course.", "warning");
      return;
    }
    driverAcceptJob(jobId);
    setSelectedJob(null);
    if (onNavigateToTab) {
      onNavigateToTab('active_mission');
    }
  };

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

  // Map coordinates conversion to canvas percentage for SVG rendering
  // Abidjan approximate bounds: Lat 5.25 to 5.42, Lng -4.12 to -3.88
  const latMin = 5.25;
  const latMax = 5.43;
  const lngMin = -4.12;
  const lngMax = -3.88;

  const projectToMapCoords = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = ((latMax - lat) / (latMax - latMin)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    };
  };

  const driverPos = projectToMapCoords(driverCoords.lat, driverCoords.lng);

  return (
    <div id="driver-radar-cockpit-dashboard" className="space-y-4 animate-in fade-in duration-200">
      {/* 1. HUD Telemetry Bar (Professional Driver Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Earnings today */}
        <div className="p-3.5 rounded-2xl bg-[#0C121E] border border-slate-800 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Gains du Jour</span>
            <span className="text-base sm:text-lg font-black text-white font-mono-num truncate block">
              {dailyEarnings.toLocaleString('fr-FR')} <span className="text-xs text-emerald-400">FCFA</span>
            </span>
          </div>
        </div>

        {/* Deliveries Count */}
        <div className="p-3.5 rounded-2xl bg-[#0C121E] border border-slate-800 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Courses Clôturées</span>
            <span className="text-base sm:text-lg font-black text-white font-mono-num">
              {myCompletedJobs.length} <span className="text-xs text-blue-300 font-sans">courses</span>
            </span>
          </div>
        </div>

        {/* Driver Rating */}
        <div className="p-3.5 rounded-2xl bg-[#0C121E] border border-slate-800 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Note Chauffeur</span>
            <span className="text-base sm:text-lg font-black text-white font-mono-num flex items-center gap-1">
              <span>{currentUser?.rating || 4.9}</span>
              <span className="text-xs text-amber-400">/ 5.0</span>
            </span>
          </div>
        </div>

        {/* Radar Nearby Requests */}
        <div className="p-3.5 rounded-2xl bg-[#0C121E] border border-slate-800 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Dans votre Rayon</span>
            <span className="text-base sm:text-lg font-black text-white font-mono-num">
              {radarJobs.length} <span className="text-xs text-purple-300 font-sans">offres</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Active Mission Quick Alert Pill if mission ongoing */}
      {activeMission && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-emerald-950/80 border border-blue-500/40 shadow-xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/40 flex items-center justify-center animate-pulse">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Mission en cours : {activeMission.productTitle}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">LIVE GPS</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeMission.pickupCommune} ➔ {activeMission.dropoffCommune} • Gain : + {activeMission.deliveryFee.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab?.('active_mission')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ouvrir Cockpit Course</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Main Live GPS Radar Cockpit Map */}
      <div 
        id="driver-map-radar-container"
        className="relative rounded-3xl bg-[#090D16] border border-slate-800 shadow-2xl overflow-hidden min-h-[460px] sm:min-h-[520px] flex flex-col justify-between"
      >
        {/* Top Cockpit Overlay Controls */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
          {/* Driver Position & Availability Status */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={toggleDriverAvailability}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl border transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-slate-950 animate-pulse' : 'bg-red-500'}`} />
              <span>{isOnline ? '🟢 EN SERVICE' : '🔴 EN PAUSE'}</span>
            </button>

            {/* Current base commune */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 shadow-lg backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zone : <strong className="text-white">{driverCommune}</strong></span>
            </div>
          </div>

          {/* Map Controls: Radius & Layer */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Radius Switcher */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg text-[11px] backdrop-blur-md">
              {[3, 5, 10].map(r => (
                <button
                  key={r}
                  onClick={() => setRadarRadiusKm(r)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    radarRadiusKm === r
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>

            {/* Style Switcher */}
            <button
              onClick={() => setMapStyle(prev => prev === 'night' ? 'satellite' : prev === 'satellite' ? 'standard' : 'night')}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white transition-colors shadow-lg backdrop-blur-md"
              title="Changer le style de carte"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Map Canvas / Vector Grid with Abidjan Geo Features */}
        <div className="relative w-full h-[460px] sm:h-[520px] bg-[#070B14] overflow-hidden select-none">
          {/* Stylized Vector Background of Abidjan Lagoon & Communes */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Grid pattern */}
              <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="0.8" />
              </pattern>
              {/* Radar pulse gradient */}
              <radialGradient id="radarSweepGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#10B981" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#radar-grid)" />

            {/* Lagoon Ébrié Waterway Simulation */}
            <path
              d="M 5 62 Q 25 58, 42 66 T 70 60 T 95 65 L 95 76 Q 72 72, 45 78 T 5 74 Z"
              fill={mapStyle === 'satellite' ? '#081d2a' : '#0c1a29'}
              opacity="0.85"
            />
            <path
              d="M 28 40 Q 38 48, 48 45 T 62 52 L 58 57 Q 45 50, 32 52 T 26 44 Z"
              fill={mapStyle === 'satellite' ? '#081d2a' : '#0c1a29'}
              opacity="0.85"
            />

            {/* Major Arteries (Autoroute du Nord, Bd VGE, Y4) */}
            <line x1="15" y1="20" x2="48" y2="48" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="3 3" />
            <line x1="48" y1="48" x2="52" y2="85" stroke="#1e293b" strokeWidth="2.5" />
            <line x1="48" y1="48" x2="85" y2="40" stroke="#1e293b" strokeWidth="2.5" />
            <line x1="20" y1="52" x2="48" y2="48" stroke="#1e293b" strokeWidth="2" />

            {/* Radar Radius Circle around Driver */}
            {isOnline && (
              <circle
                cx={`${driverPos.x}%`}
                cy={`${driverPos.y}%`}
                r={`${radarRadiusKm * 4.5}%`}
                fill="url(#radarSweepGradient)"
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Abidjan Communes Landmarks */}
          {ALL_COMMUNES.map(c => {
            const pos = projectToMapCoords(c.coords.lat, c.coords.lng);
            return (
              <div
                key={c.id}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 hover:opacity-100 transition-opacity"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mx-auto" />
                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap block mt-0.5 tracking-tight">
                  {c.name}
                </span>
              </div>
            );
          })}

          {/* Available Delivery Jobs Plotted on Map */}
          {enrichedAvailableJobs.map(job => {
            const pickupCommuneObj = ALL_COMMUNES.find(c => c.name.toLowerCase() === job.pickupCommune.toLowerCase()) || ALL_COMMUNES[0];
            const dropoffCommuneObj = ALL_COMMUNES.find(c => c.name.toLowerCase() === job.dropoffCommune.toLowerCase()) || ALL_COMMUNES[1];
            
            const pickupPos = projectToMapCoords(job.pickupCoords?.lat || pickupCommuneObj.coords.lat, job.pickupCoords?.lng || pickupCommuneObj.coords.lng);
            const isSelected = selectedJob?.id === job.id;

            return (
              <div
                key={job.id}
                style={{ left: `${pickupPos.x}%`, top: `${pickupPos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-15 cursor-pointer group"
                onClick={() => setSelectedJob(job)}
              >
                {/* Ping wave if inside radar */}
                {job.isNearby && (
                  <span className="absolute -inset-2 rounded-full bg-emerald-400/20 animate-ping pointer-events-none" />
                )}

                <div className={`p-1.5 rounded-xl flex items-center gap-1.5 shadow-xl transition-all transform hover:scale-110 ${
                  isSelected 
                    ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/40 scale-110 font-black' 
                    : job.isNearby
                    ? 'bg-emerald-500 text-slate-950 font-extrabold border border-emerald-300'
                    : 'bg-slate-900 border border-slate-700 text-white hover:border-emerald-500'
                }`}>
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-mono-num font-extrabold">
                    +{job.deliveryFee.toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>
            );
          })}

          {/* Live Driver Marker (Central Pulse & Vehicle Icon) */}
          <div
            style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-25 pointer-events-none"
          >
            {/* Multi-ring radar pulse */}
            {isOnline && (
              <>
                <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
              </>
            )}

            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all ${
              isOnline
                ? 'bg-emerald-500 text-slate-950 border-white shadow-emerald-500/50 scale-105'
                : 'bg-slate-800 text-slate-400 border-slate-600'
            }`}>
              {driverVehicle === 'voiture' || driverVehicle === 'car' ? (
                <Car className="w-5 h-5" />
              ) : driverVehicle === 'cargo' ? (
                <Truck className="w-5 h-5" />
              ) : (
                <Bike className="w-5 h-5" />
              )}
            </div>

            {/* Label below driver */}
            <div className="mt-1 -translate-x-1/2 left-1/2 relative bg-slate-950/90 px-2 py-0.5 rounded-md border border-emerald-500/50 shadow-md text-center">
              <span className="text-[9px] font-black text-emerald-400 block uppercase tracking-wider">
                {isOnline ? 'VOUS • EN SERVICE' : 'VOUS • EN PAUSE'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Drawer / Selected Job Overlay or Proximity Carousel */}
        <div className="relative z-25 p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md space-y-3">
          {selectedJob ? (
            /* Detailed Card for Selected Job */
            <div className="p-4 rounded-2xl bg-[#0C121E] border border-amber-500/40 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedJob.productImage}
                    alt={selectedJob.productTitle}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold uppercase">
                        {selectedJob.requiredVehicle}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">
                        ~{(selectedJob as any).approachTimeMin || 4} min d'approche ({(selectedJob as any).pickupDistKm || 2.5} km)
                      </span>
                    </div>
                    <h5 className="font-bold text-sm text-white line-clamp-1 mt-0.5">{selectedJob.productTitle}</h5>
                    <p className="text-xs text-slate-400">
                      {selectedJob.pickupCommune} ➔ {selectedJob.dropoffCommune}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base sm:text-lg font-black text-emerald-400 font-mono-num block">
                    + {selectedJob.deliveryFee.toLocaleString('fr-FR')} FCFA
                  </span>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-slate-400 hover:text-white text-xs p-1"
                  >
                    Fermer ✕
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleAcceptJob(selectedJob.id)}
                  disabled={!isOnline}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isOnline ? 'Prendre la course immédiatement' : 'Passez en service pour accepter'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Quick Nearby Orders Strip */
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Offres de courses proches (&lt; {radarRadiusKm} km) : <strong>{radarJobs.length}</strong></span>
                </span>
                <button
                  onClick={() => onNavigateToTab?.('available_orders')}
                  className="text-emerald-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  <span>Voir toute la bourse</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {radarJobs.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  <span>Aucune course immédiate dans un rayon de {radarRadiusKm} km. Élargissez le rayon ou consultez la bourse aux courses.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-1">
                  {radarJobs.slice(0, 4).map(job => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="p-2.5 rounded-xl bg-[#0C121E] border border-slate-800 hover:border-emerald-500/50 shadow-md min-w-[240px] shrink-0 cursor-pointer transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{job.productTitle}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {job.pickupCommune} ➔ {job.dropoffCommune}
                        </p>
                        <span className="text-[9px] font-mono text-amber-300">~{job.approachTimeMin} min approche</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-400 font-mono-num block">
                          +{job.deliveryFee.toLocaleString('fr-FR')} F
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">Sélectionner</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
