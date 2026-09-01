import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  MapPin, 
  ExternalLink, 
  Compass, 
  Layers, 
  Bike, 
  Car, 
  Truck, 
  Clock, 
  ArrowRight, 
  ArrowUpRight, 
  ArrowUpLeft, 
  ArrowUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Radio
} from 'lucide-react';
import { ALL_COMMUNES, ZoneCommune } from '../data/communes';
import { generateAbidjanRoute, RouteStep, RoutePlan, voiceNavigator } from '../utils/voiceNavigator';

interface GoogleMapsEmbedProps {
  pickupCommune: string;
  dropoffCommune: string;
  vehicleType?: 'moto' | 'cargo';
  isReturning?: boolean;
  courierName?: string;
  courierPhone?: string;
  currentProgress?: number; // 0 to 100
  onProgressChange?: (newProgress: number) => void;
  className?: string;
}

export const GoogleMapsEmbed: React.FC<GoogleMapsEmbedProps> = ({
  pickupCommune,
  dropoffCommune,
  vehicleType = 'moto',
  isReturning = false,
  courierName = 'Kouamé Jean-Eudes',
  courierPhone = '+225 07 48 19 20 33',
  currentProgress = 50,
  onProgressChange,
  className = ''
}) => {
  const [mapMode, setMapMode] = useState<'google_interactive' | 'yango_interactive' | 'telemetry_radar' | 'satellite'>('google_interactive');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [autoPlayVoice, setAutoPlayVoice] = useState<boolean>(true);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [routePlan, setRoutePlan] = useState<RoutePlan>(() => 
    generateAbidjanRoute(pickupCommune, dropoffCommune, isReturning)
  );
  const [isNavigating, setIsNavigating] = useState<boolean>(true);
  const [localProgress, setLocalProgress] = useState<number>(currentProgress);
  const [speedKmh, setSpeedKmh] = useState<number>(38);

  const prevStepRef = useRef<number>(-1);

  // Re-generate route when communes change
  useEffect(() => {
    const plan = generateAbidjanRoute(pickupCommune, dropoffCommune, isReturning);
    setRoutePlan(plan);
  }, [pickupCommune, dropoffCommune, isReturning]);

  // Sync external progress
  useEffect(() => {
    setLocalProgress(currentProgress);
  }, [currentProgress]);

  // Map progress to steps
  useEffect(() => {
    if (!routePlan.steps.length) return;
    const stepCount = routePlan.steps.length;
    const rawIndex = Math.floor((localProgress / 100) * stepCount);
    const safeIndex = Math.min(stepCount - 1, Math.max(0, rawIndex));
    setCurrentStepIndex(safeIndex);

    // Speak when step changes
    if (autoPlayVoice && isVoiceEnabled && safeIndex !== prevStepRef.current) {
      prevStepRef.current = safeIndex;
      const step = routePlan.steps[safeIndex];
      if (step) {
        voiceNavigator.speak(step.instruction);
      }
    }
  }, [localProgress, routePlan, autoPlayVoice, isVoiceEnabled]);

  // Handle Voice Mute Toggle
  const toggleVoiceMute = () => {
    const nextState = !isVoiceEnabled;
    setIsVoiceEnabled(nextState);
    voiceNavigator.setMuted(!nextState);
    if (nextState) {
      voiceNavigator.testVoice();
    }
  };

  // Manual Speak current step
  const handleSpeakCurrentStep = () => {
    const step = routePlan.steps[currentStepIndex];
    if (step) {
      voiceNavigator.speak(step.instruction);
    }
  };

  // Find commune coordinates
  const originZone = ALL_COMMUNES.find(c => c.name.toLowerCase().includes(pickupCommune.toLowerCase())) || ALL_COMMUNES[0];
  const destZone = ALL_COMMUNES.find(c => c.name.toLowerCase().includes(dropoffCommune.toLowerCase())) || ALL_COMMUNES[2];

  // Calculate remaining distance and ETA
  const remainingFraction = Math.max(0, 1 - (localProgress / 100));
  const remainingDistKm = (routePlan.totalDistanceKm * remainingFraction).toFixed(1);
  const remainingMin = Math.max(1, Math.ceil(routePlan.totalDurationMin * remainingFraction));

  // Current active step
  const activeStep = routePlan.steps[currentStepIndex] || routePlan.steps[0];

  const getStepIcon = (iconType: RouteStep['icon']) => {
    switch (iconType) {
      case 'turn-right':
        return <ArrowUpRight className="w-5 h-5 text-amber-400" />;
      case 'turn-left':
        return <ArrowUpLeft className="w-5 h-5 text-amber-400" />;
      case 'bridge':
        return <Layers className="w-5 h-5 text-blue-400" />;
      case 'destination':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'u-turn':
        return <RotateCcw className="w-5 h-5 text-red-400" />;
      default:
        return <ArrowUp className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getVehicleBadgeIcon = () => {
    switch (vehicleType) {
      case 'cargo':
        return <Truck className="w-4 h-4 text-purple-400" />;
      default:
        return <Bike className="w-4 h-4 text-emerald-400" />;
    }
  };

  // Google Maps Embed Query URL
  const gmapsOrigin = encodeURIComponent(`${pickupCommune}, Abidjan, Côte d'Ivoire`);
  const gmapsDest = encodeURIComponent(`${dropoffCommune}, Abidjan, Côte d'Ivoire`);
  const gmapsEmbedUrl = `https://maps.google.com/maps?q=${gmapsOrigin}+to+${gmapsDest}&t=${mapMode === 'satellite' ? 'k' : 'm'}&z=13&ie=UTF8&iwloc=&output=embed`;
  
  // Yango / Yandex Maps URL
  const yangoOrigin = encodeURIComponent(`${pickupCommune}, Abidjan`);
  const yangoDest = encodeURIComponent(`${dropoffCommune}, Abidjan`);
  const yangoEmbedUrl = `https://yandex.com/map-widget/v1/?rtext=${originZone.coords.lat},${originZone.coords.lng}~${destZone.coords.lat},${destZone.coords.lng}&rtt=auto&z=13`;
  const yangoAppUrl = `https://maps.yandex.com/?rtext=${originZone.coords.lat},${originZone.coords.lng}~${destZone.coords.lat},${destZone.coords.lng}&rtt=auto`;
  const yangoDeepLink = `yango://route?start-lat=${originZone.coords.lat}&start-lon=${originZone.coords.lng}&end-lat=${destZone.coords.lat}&end-lon=${destZone.coords.lng}`;

  return (
    <div id="google-maps-navigation-cockpit" className={`rounded-3xl bg-[#070B14] border border-slate-800 overflow-hidden shadow-2xl ${className}`}>
      {/* 1. Cockpit Header Bar */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-[#0A101D] to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white font-display">
                GPS & Navigation Vocale Itinéraire
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono-num font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                <Radio className="w-2.5 h-2.5 animate-ping text-emerald-400" />
                <span>LIVE 4G</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Grand Abidjan • {routePlan.originCommune} → {routePlan.destinationCommune}
            </p>
          </div>
        </div>

        {/* Action Controls: Map Mode + Voice Toggle + Google Maps / Yango Maps App Links */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Map Layer Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMapMode('google_interactive')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                mapMode === 'google_interactive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🗺️ Google Maps</span>
            </button>
            <button
              onClick={() => setMapMode('yango_interactive')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                mapMode === 'yango_interactive'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🚕 Yango Maps</span>
            </button>
            <button
              onClick={() => setMapMode('telemetry_radar')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                mapMode === 'telemetry_radar'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📡 Radar GPS</span>
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all hidden md:flex items-center gap-1 ${
                mapMode === 'satellite'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛰️ Satellite</span>
            </button>
          </div>

          {/* Voice Mute / Unmute Button */}
          <button
            onClick={toggleVoiceMute}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
              isVoiceEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isVoiceEnabled ? 'Voix GPS activée (cliquer pour couper)' : 'Voix GPS muette (cliquer pour activer)'}
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] font-bold hidden md:inline">
              {isVoiceEnabled ? 'Voix On' : 'Muet'}
            </span>
          </button>

          {/* External Google Maps Button */}
          <a
            href={routePlan.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Ouvrir l'itinéraire dans Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Maps</span>
          </a>

          {/* External Yango Maps Button */}
          <a
            href={yangoAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Ouvrir la course dans Yango Maps / Yango App"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yango Maps</span>
          </a>
        </div>
      </div>

      {/* 2. Turn-by-Turn Dynamic Voice Guidance Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#0E1F38] to-[#0F172A] p-4 border-b border-slate-800/90">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              {getStepIcon(activeStep.icon)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-num font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {activeStep.distanceText}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {activeStep.streetName}
                </span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-white mt-1 leading-snug">
                {activeStep.instruction}
              </p>
              {activeStep.warning && (
                <p className="text-[11px] text-amber-300 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{activeStep.warning}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Vocal Replay & Step Selector */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={handleSpeakCurrentStep}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Répéter la voix</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono-num">
              Étape {currentStepIndex + 1} / {routePlan.steps.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Map Canvas Area */}
      <div className="relative w-full h-80 sm:h-96 bg-[#040812] overflow-hidden">
        {mapMode === 'google_interactive' || mapMode === 'satellite' ? (
          /* Google Maps Interactive IFrame */
          <div className="w-full h-full relative">
            <iframe
              title="Google Maps Route Navigation"
              src={gmapsEmbedUrl}
              className="w-full h-full border-0 filter contrast-110"
              loading="lazy"
              allowFullScreen
            />
            {/* Live Telemetry Overlay Pill */}
            <div className="absolute top-3 left-3 bg-[#0B111E]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Bike className="w-4 h-4 animate-bounce" />
                <span>Google Maps • {courierName}</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <span className="font-mono-num text-amber-400 font-black">
                {speedKmh} km/h
              </span>
            </div>
          </div>
        ) : mapMode === 'yango_interactive' ? (
          /* Yango Maps Interactive IFrame */
          <div className="w-full h-full relative">
            <iframe
              title="Yango Maps Route Navigation"
              src={yangoEmbedUrl}
              className="w-full h-full border-0 filter contrast-105"
              loading="lazy"
              allowFullScreen
            />
            {/* Live Telemetry Overlay Pill for Yango */}
            <div className="absolute top-3 left-3 bg-[#0B111E]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <Bike className="w-4 h-4 animate-bounce" />
                <span>Yango Maps • {courierName}</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <span className="font-mono-num text-amber-400 font-black">
                {speedKmh} km/h
              </span>
            </div>
            {/* Yango Direct App Trigger */}
            <div className="absolute bottom-3 right-3 bg-red-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
              <span>🚕 Mode Navigation Yango Actif</span>
            </div>
          </div>
        ) : (
          /* High-Precision Grand Abidjan Vector Radar Map */
          <div className="w-full h-full relative flex items-center justify-center fintech-grid">
            {/* SVG Interactive Grand Abidjan Topology */}
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 600 320">
              {/* Lagoon Ébrié Water Body with glowing reflections */}
              <path
                d="M 0 170 Q 150 130, 300 170 T 600 160 L 600 240 Q 400 270, 200 230 T 0 220 Z"
                fill="#0D2235"
                stroke="#0284C7"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />
              <text x="250" y="200" fill="#0284C7" fontSize="11" fontWeight="bold" opacity="0.6">
                Lagune Ébrié
              </text>

              {/* Major Highway Artery & Iconic Bridges */}
              {/* Pont Henri Konan Bédié (HKB) */}
              <line x1="260" y1="120" x2="310" y2="220" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
              <line x1="260" y1="120" x2="310" y2="220" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />
              <text x="285" y="170" fill="#94A3B8" fontSize="8" fontWeight="bold" transform="rotate(63 285 170)">
                Pont HKB
              </text>

              {/* Pont De Gaulle & Pont Houphouët-Boigny */}
              <line x1="180" y1="130" x2="190" y2="220" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
              <line x1="140" y1="135" x2="150" y2="220" stroke="#334155" strokeWidth="7" strokeLinecap="round" />

              {/* Road Corridors */}
              <path
                d="M 80 60 Q 200 80, 260 120 T 380 260"
                fill="none"
                stroke="#1E293B"
                strokeWidth="10"
                strokeLinecap="round"
              />
              
              {/* Active Route Trajectory Polyline */}
              <path
                d="M 80 60 Q 200 80, 260 120 T 380 260"
                fill="none"
                stroke={isReturning ? '#EF4444' : '#F59E0B'}
                strokeWidth="4"
                strokeDasharray="8 6"
                className="animate-pulse"
              />

              {/* Communes Landmarks Labels */}
              <g className="text-slate-400 font-bold" fontSize="10">
                {/* Cocody */}
                <circle cx="80" cy="60" r="5" fill="#3B82F6" />
                <text x="92" y="64" fill="#60A5FA" fontWeight="bold">Cocody (Angré / Riviera)</text>

                {/* Plateau */}
                <circle cx="190" cy="115" r="5" fill="#94A3B8" />
                <text x="198" y="118" fill="#E2E8F0" fontWeight="bold">Le Plateau</text>

                {/* Yopougon */}
                <circle cx="50" cy="140" r="4" fill="#94A3B8" />
                <text x="15" y="145" fill="#94A3B8">Yopougon</text>

                {/* Marcory */}
                <circle cx="310" cy="230" r="5" fill="#10B981" />
                <text x="322" y="234" fill="#34D399" fontWeight="bold">Marcory (Zone 4)</text>

                {/* Koumassi / Port-Bouët */}
                <circle cx="440" cy="270" r="4" fill="#94A3B8" />
                <text x="450" y="275" fill="#94A3B8">Koumassi / Port-Bouët</text>
              </g>

              {/* Animated Courier Position on Route */}
              {(() => {
                // Approximate coordinate interpolation along route (M 80 60 -> 260 120 -> 380 260)
                const frac = localProgress / 100;
                let curX = 80 + frac * (380 - 80);
                let curY = 60 + frac * (260 - 60);

                return (
                  <g transform={`translate(${curX}, ${curY})`}>
                    {/* Pulsing Radar Ring */}
                    <circle cx="0" cy="0" r="22" fill={isReturning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.25)'} className="animate-ping" />
                    <circle cx="0" cy="0" r="14" fill={isReturning ? '#EF4444' : '#10B981'} stroke="#FFFFFF" strokeWidth="2.5" />
                    <text x="0" y="3" textAnchor="middle" fill="#05101A" fontSize="9" fontWeight="900">
                      🛵
                    </text>
                  </g>
                );
              })()}
            </svg>

            {/* In-Map Top-Right Telemetry Card */}
            <div className="absolute top-3 right-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 text-right">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Vitesse Réelle</span>
                <span className="text-base font-mono-num font-black text-amber-400">
                  {speedKmh} km/h
                </span>
              </div>
              <div className="border-t border-slate-800/80 pt-1.5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Distance Restante</span>
                <span className="text-sm font-mono-num font-black text-white">
                  {remainingDistKm} km ({remainingMin} min)
                </span>
              </div>
            </div>

            {/* In-Map Bottom-Left Origin & Destination Badges */}
            <div className="absolute bottom-3 left-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                  A
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Départ</span>
                  <span className="font-bold text-white text-xs">{routePlan.originCommune}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  B
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Arrivée</span>
                  <span className="font-bold text-white text-xs">{routePlan.destinationCommune}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Interactive Route Steps List with Spoken Audio Previews */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Feuille de Route Détaillée (Itinéraire Guidé)</span>
          </span>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                const nextProg = Math.max(5, localProgress - 15);
                setLocalProgress(nextProg);
                if (onProgressChange) onProgressChange(nextProg);
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-[11px]"
            >
              ← Étape Préc.
            </button>
            <button
              onClick={() => {
                const nextProg = Math.min(95, localProgress + 15);
                setLocalProgress(nextProg);
                if (onProgressChange) onProgressChange(nextProg);
              }}
              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
            >
              Étape Suiv. →
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {routePlan.steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isPassed = idx < currentStepIndex;

            return (
              <div
                key={step.id}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  const stepProg = Math.round((idx / (routePlan.steps.length - 1)) * 100);
                  setLocalProgress(stepProg);
                  if (onProgressChange) onProgressChange(stepProg);
                  voiceNavigator.speak(step.instruction);
                }}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-md'
                    : isPassed
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : getStepIcon(step.icon)}
                  </div>
                  <div>
                    <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-amber-300' : 'text-slate-200'}`}>
                      {step.instruction}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {step.streetName} • {step.distanceText}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    voiceNavigator.speak(step.instruction);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 shrink-0 transition-colors"
                  title="Écouter cette instruction"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
