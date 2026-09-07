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
  Radio,
  Sun,
  Moon
} from 'lucide-react';
import { ALL_COMMUNES, ZoneCommune } from '../data/communes';
import { generateAbidjanRoute, RouteStep, RoutePlan, voiceNavigator } from '../utils/voiceNavigator';

interface GoogleMapsEmbedProps {
  pickupCommune: string;
  dropoffCommune: string;
  vehicleType?: 'moto' | 'voiture' | 'car' | 'cargo';
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
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'satellite'>('roadmap');
  const [navTheme, setNavTheme] = useState<'night' | 'day'>('night'); // Default to high-contrast night navigation
  // Voice off by default: let official Google Maps handle voice navigation
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState<boolean>(false);
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
      voiceNavigator.announceVoiceActivated();
    }
  };

  // Manual Speak current step
  const handleSpeakCurrentStep = () => {
    const step = routePlan.steps[currentStepIndex];
    if (step) {
      voiceNavigator.speak(step.instruction);
    }
  };

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

  // Google Maps Embed Query URL
  const gmapsOrigin = encodeURIComponent(`${pickupCommune}, Abidjan, Côte d'Ivoire`);
  const gmapsDest = encodeURIComponent(`${dropoffCommune}, Abidjan, Côte d'Ivoire`);
  const gmapsEmbedUrl = `https://maps.google.com/maps?q=${gmapsOrigin}+to+${gmapsDest}&t=${mapLayer === 'satellite' ? 'k' : 'm'}&z=13&ie=UTF8&iwloc=&output=embed`;

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
                Google Maps Navigation Grand Abidjan
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono-num font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                <Radio className="w-2.5 h-2.5 animate-ping text-emerald-400" />
                <span>GPS LIVE</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {routePlan.originCommune} → {routePlan.destinationCommune} ({routePlan.totalDistanceKm} km)
            </p>
          </div>
        </div>

        {/* Action Controls: Layer Switcher + Theme Switcher + Voice */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Layer Switcher: Native Google Maps Plan vs Satellite */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMapLayer('roadmap')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                mapLayer === 'roadmap'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🗺️ Plan</span>
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                mapLayer === 'satellite'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛰️ Satellite</span>
            </button>
          </div>

          {/* Day / Night Driver Theme Toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setNavTheme('night')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                navTheme === 'night'
                  ? 'bg-slate-800 text-amber-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Nuit (Lisibilité et contraste sombre)"
            >
              <Moon className="w-3 h-3" />
              <span className="hidden sm:inline">Nuit</span>
            </button>
            <button
              onClick={() => setNavTheme('day')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                navTheme === 'day'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Jour (Plein soleil)"
            >
              <Sun className="w-3 h-3" />
              <span className="hidden sm:inline">Jour</span>
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
        </div>
      </div>

      {/* Official Google Maps Voice Guidance Direct Banner */}
      <div className="bg-blue-950/40 border-b border-blue-500/30 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-2">
              <span>Guidage Vocal Officiel Google Maps</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-semibold">
                Voix GPS Native
              </span>
            </p>
            <p className="text-[11px] text-slate-300">
              Navigation vocale étape par étape assurée directement par Google Maps avec alertes de trafic en direct à Abidjan.
            </p>
          </div>
        </div>
        <a
          href={routePlan.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 shrink-0 transition-all cursor-pointer hover:scale-105"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Lancer la Voix Off Google Maps</span>
        </a>
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

      {/* 3. Main Map Canvas Area: 85%-90% Screen Height, Google Widgets Cropped */}
      <div className="relative w-full h-[75vh] sm:h-[85vh] min-h-[520px] bg-[#040812] overflow-hidden">
        <div className="w-full h-full relative overflow-hidden">
          {/* Iframe cropped to eliminate Google Maps white headers and copyright bars */}
          <iframe
            title="Google Maps Route Navigation"
            src={gmapsEmbedUrl}
            className={`absolute -top-16 sm:-top-20 -bottom-12 -left-1 -right-1 w-[calc(100%+8px)] h-[calc(100%+120px)] border-0 ${navTheme === 'night' ? 'brightness-90 contrast-125' : ''}`}
            loading="lazy"
            allowFullScreen
          />

          {/* Live Telemetry Overlay Pill in Top Left (Dynamic Vehicle Icon) */}
          <div className="absolute top-3 left-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs z-10">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              {vehicleType === 'voiture' || vehicleType === 'car' ? (
                <Car className="w-4 h-4 animate-pulse text-amber-400" />
              ) : vehicleType === 'cargo' ? (
                <Truck className="w-4 h-4 animate-pulse text-purple-400" />
              ) : (
                <Bike className="w-4 h-4 animate-bounce text-emerald-400" />
              )}
              <span>
                {vehicleType === 'voiture' || vehicleType === 'car' ? 'Voiture' : vehicleType === 'cargo' ? 'Camionnette' : 'Moto'} • {courierName}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <span className="font-mono-num text-amber-400 font-black">
              {speedKmh} km/h
            </span>
          </div>

          {/* In-Map Top-Right Telemetry Card */}
          <div className="absolute top-3 right-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-2xl flex flex-col gap-1 text-right z-10">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Distance Restante</span>
            <span className="text-sm font-mono-num font-black text-emerald-400">
              {remainingDistKm} km ({remainingMin} min)
            </span>
          </div>

          {/* In-Map Bottom-Left Origin & Destination Badges */}
          <div className="absolute bottom-3 left-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs z-10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                A
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Départ</span>
                <span className="font-bold text-white text-xs">{routePlan.originCommune}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                B
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Arrivée</span>
                <span className="font-bold text-white text-xs">{routePlan.destinationCommune}</span>
              </div>
            </div>
          </div>

          {/* Floating Recenter GPS Button in Bottom Right */}
          <div className="absolute bottom-3 right-3 z-20">
            <button
              onClick={() => {
                if (isVoiceEnabled) {
                  voiceNavigator.speak(`Recentrage GPS sur l'itinéraire de ${routePlan.originCommune} vers ${routePlan.destinationCommune}.`);
                }
              }}
              className="w-12 h-12 rounded-full bg-[#1A2524] hover:bg-[#253634] text-white border-2 border-slate-700/80 shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer group"
              title="Recentrer le GPS"
            >
              <Navigation className="w-5 h-5 text-white transition-transform group-hover:rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
