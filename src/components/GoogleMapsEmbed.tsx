import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  Volume2, 
  VolumeX, 
  MapPin, 
  ExternalLink, 
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
  Moon, 
  RotateCcw, 
  Plus, 
  Minus, 
  AlertTriangle,
  Check
} from 'lucide-react';
import { ALL_COMMUNES } from '../data/communes';
import { 
  generateAbidjanRoute, 
  RouteStep, 
  RoutePlan, 
  voiceNavigator, 
  playOverspeedAlarm,
  announceOverspeedAlert, 
  playGpsChime, 
  getSpeedLimitForRoad 
} from '../utils/voiceNavigator';
import { speakInstruction } from '../utils/audioServices';
import { useApp } from '../context/AppContext';

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
  courierName = 'Bakary Traoré',
  courierPhone = '+225 01 44 77 89 22',
  currentProgress = 50,
  onProgressChange,
  className = ''
}) => {
  const { language, addToast } = useApp();
  const isEn = language === 'en';
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'satellite'>('roadmap');
  const [navTheme, setNavTheme] = useState<'night' | 'day'>('night');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [routePlan, setRoutePlan] = useState<RoutePlan>(() => 
    generateAbidjanRoute(pickupCommune, dropoffCommune, isReturning, language)
  );
  const [localProgress, setLocalProgress] = useState<number>(currentProgress);
  const [speedKmh, setSpeedKmh] = useState<number>(38);
  const [showSpeedControls, setShowSpeedControls] = useState<boolean>(false);

  const prevStepRef = useRef<number>(-1);
  const overspeedIntervalRef = useRef<any>(null);
  const lastOverspeedAlertTimeRef = useRef<number>(0);
  const wasOverspeedRef = useRef<boolean>(false);

  // Re-generate route when communes or language change
  useEffect(() => {
    const plan = generateAbidjanRoute(pickupCommune, dropoffCommune, isReturning, language);
    setRoutePlan(plan);
  }, [pickupCommune, dropoffCommune, isReturning, language]);

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
    if (safeIndex !== prevStepRef.current) {
      prevStepRef.current = safeIndex;
      const step = routePlan.steps[safeIndex];
      if (step && isVoiceEnabled) {
        speakInstruction(step.instruction, language);
      }
    }
  }, [localProgress, routePlan, isVoiceEnabled, language]);

  // Active step & speed limit calculation
  const activeStep = routePlan.steps[currentStepIndex] || routePlan.steps[0];
  const currentSpeedLimit = activeStep?.speedLimitKmh || getSpeedLimitForRoad(activeStep?.streetName || '', 50);
  const isOverspeed = speedKmh > currentSpeedLimit;
  const overspeedDelta = Math.max(0, speedKmh - currentSpeedLimit);

  // =========================================================================
  // ALARME DE SURVITESSE : DÉCLENCHEMENT SONORE & VOCAL DÈS DÉPASSEMENT LIMITE
  // =========================================================================
  useEffect(() => {
    if (isOverspeed) {
      const triggerAlarmSound = () => {
        // Faire retentir l'alarme sonore de radar aigu
        playOverspeedAlarm();
        // Annonce vocale de sécurité forçant l'alerte
        announceOverspeedAlert(speedKmh, currentSpeedLimit, activeStep?.streetName || '', language);
      };

      if (!wasOverspeedRef.current) {
        wasOverspeedRef.current = true;
        lastOverspeedAlertTimeRef.current = Date.now();
        triggerAlarmSound();

        addToast(
          isEn ? "🚨 Speed Limit Exceeded!" : "🚨 Vitesse Maximale Dépassée !",
          isEn 
            ? `Speed: ${speedKmh} km/h (Limit: ${currentSpeedLimit} km/h). Alarm is ringing!`
            : `Vitesse : ${speedKmh} km/h (Limite : ${currentSpeedLimit} km/h). L'alarme de sécurité sonne ! Ralentissez.`,
          "error"
        );
      }

      // Répéter l'alarme sonore tant que la vitesse dépasse le nombre maximum autorisé (toutes les 4 secondes)
      if (overspeedIntervalRef.current) clearInterval(overspeedIntervalRef.current);
      overspeedIntervalRef.current = setInterval(() => {
        triggerAlarmSound();
      }, 4000);

    } else {
      // Retour sous la vitesse autorisée : couper l'alarme immédiatement
      if (overspeedIntervalRef.current) {
        clearInterval(overspeedIntervalRef.current);
        overspeedIntervalRef.current = null;
      }
      if (wasOverspeedRef.current) {
        wasOverspeedRef.current = false;
        playGpsChime();
        addToast(
          isEn ? "✅ Speed Compliant" : "✅ Vitesse Régulée Conforme",
          isEn ? `Within the ${currentSpeedLimit} km/h limit. Alarm stopped.` : `Sous la limite de ${currentSpeedLimit} km/h. L'alarme s'est arrêtée.`,
          "success"
        );
      }
    }

    return () => {
      if (overspeedIntervalRef.current) {
        clearInterval(overspeedIntervalRef.current);
      }
    };
  }, [speedKmh, currentSpeedLimit, isOverspeed, activeStep, language, isEn, addToast]);

  const handleAdjustSpeed = (delta: number) => {
    setSpeedKmh(prev => Math.max(15, Math.min(130, prev + delta)));
  };

  const handleTestOverspeed = () => {
    const forcedSpeed = currentSpeedLimit + 20;
    setSpeedKmh(forcedSpeed);
  };

  const handleSlowDownToLegalSpeed = () => {
    setSpeedKmh(Math.max(20, currentSpeedLimit - 5));
  };

  const toggleVoiceMute = () => {
    const nextState = !isVoiceEnabled;
    setIsVoiceEnabled(nextState);
    voiceNavigator.setMuted(!nextState);
    if (nextState) {
      const step = routePlan.steps[currentStepIndex];
      const intro = step 
        ? (isEn ? `Voice guidance on. ${step.instruction}` : `Guidage vocal activé. ${step.instruction}`)
        : (isEn ? "Voice guidance on." : "Guidage vocal activé.");
      speakInstruction(intro, language);
    }
  };

  // Remaining ETA and distance
  const remainingFraction = Math.max(0, 1 - (localProgress / 100));
  const remainingDistKm = (routePlan.totalDistanceKm * remainingFraction).toFixed(1);
  const remainingMin = Math.max(1, Math.ceil(routePlan.totalDurationMin * remainingFraction));

  const getStepIcon = (iconType: RouteStep['icon']) => {
    switch (iconType) {
      case 'turn-right':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'turn-left':
        return <ArrowUpLeft className="w-4 h-4 text-amber-400" />;
      case 'destination':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'u-turn':
        return <RotateCcw className="w-4 h-4 text-red-400" />;
      default:
        return <ArrowUp className="w-4 h-4 text-emerald-400" />;
    }
  };

  const gmapsOrigin = encodeURIComponent(`${pickupCommune}, Abidjan, Côte d'Ivoire`);
  const gmapsDest = encodeURIComponent(`${dropoffCommune}, Abidjan, Côte d'Ivoire`);
  const gmapsEmbedUrl = `https://maps.google.com/maps?q=${gmapsOrigin}+to+${gmapsDest}&t=${mapLayer === 'satellite' ? 'k' : 'm'}&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div 
      id="uber-pro-tracking-container"
      className={`relative w-full h-[540px] sm:h-[620px] rounded-3xl overflow-hidden bg-[#040814] border border-slate-800 shadow-2xl select-none ${className}`}
    >
      {/* ========================================================================= */}
      {/* 1. CARTE GPS VISIBLE À 100% SANS BOURRAGE (YANGO / UBER STYLE)             */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#040814]">
        <iframe
          title="Live GPS Tracking Route"
          src={gmapsEmbedUrl}
          className={`absolute -top-16 sm:-top-20 -bottom-14 -left-2 -right-2 w-[calc(100%+16px)] h-[calc(100%+130px)] border-0 ${
            navTheme === 'night' ? 'brightness-90 contrast-125' : ''
          }`}
          loading="lazy"
          allowFullScreen
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. HUD FLOTTANT HAUT : MANŒUVRE + INDICATEUR DE VITESSE ULTRA-COMPACT      */}
      {/* ========================================================================= */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-14 sm:right-16 z-20 pointer-events-auto">
        <div className={`p-2 sm:p-2.5 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center justify-between gap-2.5 transition-all ${
          isOverspeed 
            ? 'bg-red-950/95 border-red-500 ring-2 ring-red-500/50 shadow-red-500/40 animate-pulse' 
            : 'bg-[#0B111E]/90 border-slate-800 text-white'
        }`}>
          {/* Manœuvre en cours */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow">
              {getStepIcon(activeStep.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
                  {activeStep.distanceText}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold truncate">
                  {activeStep.streetName}
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate leading-tight mt-0.5">
                {activeStep.instruction}
              </p>
            </div>
          </div>

          {/* Speedometer & Speed Limit Sign Pill */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-700/60">
            {/* Panneau rond blanc officiel de vitesse */}
            <div 
              className="w-7 h-7 rounded-full bg-white border-2 border-red-600 flex items-center justify-center shadow shrink-0"
              title={`Vitesse maximale autorisée : ${currentSpeedLimit} km/h. L'alarme sonne si dépassée.`}
            >
              <span className="text-slate-950 font-black text-[10px] leading-none">{currentSpeedLimit}</span>
            </div>

            {/* Vitesse actuelle */}
            <div className="leading-tight text-right">
              <div className="flex items-baseline gap-0.5">
                <span className={`text-sm sm:text-base font-mono font-black ${isOverspeed ? 'text-red-300' : 'text-amber-400'}`}>
                  {speedKmh}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">km/h</span>
              </div>
              {isOverspeed ? (
                <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter block animate-bounce">
                  🚨 ALARME SONNE (+{overspeedDelta})
                </span>
              ) : (
                <span className="text-[8px] font-bold text-emerald-400 uppercase block">
                  MAX {currentSpeedLimit}
                </span>
              )}
            </div>

            {/* If overspeed: instant "Ralentir" button; otherwise micro controls */}
            {isOverspeed ? (
              <button
                type="button"
                onClick={handleSlowDownToLegalSpeed}
                className="py-1 px-2 rounded-xl bg-white hover:bg-slate-100 text-red-700 font-black text-[10px] shadow active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                title="Ralentir pour couper l'alarme"
              >
                <Check className="w-3 h-3" />
                <span>Ralentir</span>
              </button>
            ) : (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleAdjustSpeed(-5)}
                  className="w-5 h-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-[10px] flex items-center justify-center cursor-pointer border border-slate-800"
                  title="Diminuer vitesse (-5 km/h)"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustSpeed(5)}
                  className="w-5 h-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-[10px] flex items-center justify-center cursor-pointer border border-slate-800"
                  title="Augmenter vitesse (+5 km/h) - Dépasse la limite pour faire sonner l'alarme"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={handleTestOverspeed}
                  className="px-1.5 py-0.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white font-black text-[8px] border border-red-800/60 cursor-pointer"
                  title="Tester l'alarme sonore de vitesse excessive"
                >
                  Test Alarme
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DOCK LATÉRAL DROIT : OPTIONS EN TOUT PETIT & ULTRA PROFESSIONNEL        */}
      {/* ========================================================================= */}
      <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
        {/* Layer Toggle: Plan / Satellite */}
        <button
          type="button"
          onClick={() => setMapLayer(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
          className="w-8 h-8 rounded-xl bg-[#0B111E]/90 hover:bg-slate-800 border border-slate-700/80 text-sky-400 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer backdrop-blur-md"
          title={mapLayer === 'roadmap' ? "Activer Satellite" : "Activer Plan Standard"}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* Night / Day Mode */}
        <button
          type="button"
          onClick={() => setNavTheme(prev => prev === 'night' ? 'day' : 'night')}
          className="w-8 h-8 rounded-xl bg-[#0B111E]/90 hover:bg-slate-800 border border-slate-700/80 text-amber-400 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer backdrop-blur-md"
          title={navTheme === 'night' ? "Mode Jour" : "Mode Nuit"}
        >
          {navTheme === 'night' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        {/* Voice Toggle */}
        <button
          type="button"
          onClick={toggleVoiceMute}
          className={`w-8 h-8 rounded-xl border shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer backdrop-blur-md ${
            isVoiceEnabled
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-[#0B111E]/90 border-slate-700/80 text-slate-400 hover:text-white'
          }`}
          title={isVoiceEnabled ? "Couper la voix GPS" : "Activer la voix GPS"}
        >
          {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* External Google Maps launch */}
        <a
          href={routePlan.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl bg-[#0B111E]/90 hover:bg-blue-600/30 border border-slate-700/80 text-blue-400 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer backdrop-blur-md"
          title="Ouvrir dans Google Maps"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* ========================================================================= */}
      {/* 4. BARRE INFÉRIEURE FLOTTANTE : SUIVI DE COURSE & CONTACT LIVREUR           */}
      {/* ========================================================================= */}
      <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 z-20 pointer-events-auto">
        <div className="bg-[#0B111E]/95 backdrop-blur-md rounded-2xl border border-slate-800 p-2.5 sm:p-3 shadow-2xl flex items-center justify-between gap-3">
          {/* Véhicule & Nom Livreur */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              vehicleType === 'voiture' || vehicleType === 'car'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : vehicleType === 'cargo'
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {vehicleType === 'voiture' || vehicleType === 'car' ? (
                <Car className="w-4 h-4" />
              ) : vehicleType === 'cargo' ? (
                <Truck className="w-4 h-4" />
              ) : (
                <Bike className="w-4 h-4 animate-bounce" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white truncate">{courierName}</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.2 rounded">
                  GPS LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {pickupCommune} → <strong className="text-slate-200">{dropoffCommune}</strong>
              </p>
            </div>
          </div>

          {/* ETA & Distance restante */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 block">
                {remainingMin} min
              </span>
              <span className="text-[10px] font-mono text-slate-400 block">
                {remainingDistKm} km restant
              </span>
            </div>

            {/* Quick Call Button */}
            {courierPhone && (
              <a
                href={`tel:${courierPhone}`}
                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow active:scale-95"
                title={`Appeler ${courierName}`}
              >
                <Clock className="w-3.5 h-3.5 hidden" />
                <span className="text-xs font-bold font-mono">📞</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
