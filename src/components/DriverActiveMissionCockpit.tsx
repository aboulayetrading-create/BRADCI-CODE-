import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Radio, 
  Mic, 
  MessageSquare, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  Route, 
  Zap, 
  ArrowRight, 
  Locate, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Sliders, 
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Gauge,
  AlertOctagon,
  ShieldAlert,
  GitFork,
  ChevronRight,
  Settings
} from 'lucide-react';
import L from 'leaflet';
import { DeliveryJob, VehicleType } from '../types';
import { ALL_COMMUNES } from '../data/communes';
import { 
  fetchRealOsmRoute, 
  buildAbidjanCorridorRoute, 
  CalculatedRoadRoute,
  getDistanceToRoute,
  splitRouteAtProgress,
  recalculateRouteFromCurrentPosition,
  getHaversineDistanceMeters
} from '../utils/abidjanRoutingService';
import { 
  generateAbidjanAlternativeRoutes, 
  RoutePlanOption, 
  RouteStep,
  playGpsChime,
  playOverspeedAlarm,
  announceOverspeedAlert,
  getSpeedLimitForRoad,
  voiceNavigator
} from '../utils/voiceNavigator';
import { speakInstruction } from '../utils/audioServices';
import { DeliveryChatModal } from './DeliveryChatModal';

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
    language,
    translate,
    addToast
  } = useApp();

  const isEn = language === 'en';

  // Current real phase of the mission
  const isActualPickupPhase = job ? job.status === 'accepted' : true;

  // Active leg viewed on GPS: 'pickup' (vers vendeur) or 'dropoff' (vers acheteur)
  const [activeLeg, setActiveLeg] = useState<'pickup' | 'dropoff'>(
    isActualPickupPhase ? 'pickup' : 'dropoff'
  );

  // Sync activeLeg whenever job status updates
  useEffect(() => {
    if (job) {
      if (job.status === 'accepted') {
        setActiveLeg('pickup');
      } else {
        setActiveLeg('dropoff');
      }
    }
  }, [job?.status]);

  // VTC Alternative Itinerary selection ('fastest', 'shortest', 'eco_bypassing')
  const [selectedRouteId, setSelectedRouteId] = useState<'fastest' | 'shortest' | 'eco_bypassing'>('fastest');

  // Map view mode: 'streets' | 'satellite' | 'dark'
  const [mapEngineMode, setMapEngineMode] = useState<'streets' | 'satellite' | 'dark'>('streets');

  // Minimise HUD toggle to solve "regard impossible de lire"
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);

  // Voice navigation toggle & speech status
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => {
    return localStorage.getItem('bradci_driver_voice_muted') === 'true';
  });
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [currentSpokenText, setCurrentSpokenText] = useState('');

  // Expandable turn-by-turn roadbook sheet
  const [showRoadbook, setShowRoadbook] = useState(false);
  // Dedicated modal for clear, high-contrast Google Maps roadbook & deep linking
  const [showGmapsModal, setShowGmapsModal] = useState(false);

  // Tab state in bottom sheet to guarantee all options are 100% visible and accessible
  const [bottomTab, setBottomTab] = useState<'mission' | 'options'>('mission');
  // Dedicated side drawer modal for ultra-clean 100% map view
  const [showOptionsDrawer, setShowOptionsDrawer] = useState<boolean>(false);

  // Live speed simulation & dynamic signal
  const [speedKmh, setSpeedKmh] = useState(38);

  // Modals
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');

  // 20-min absent buyer countdown
  const [absentTimerSeconds, setAbsentTimerSeconds] = useState(1200);
  const [isAbsentTimerRunning, setIsAbsentTimerRunning] = useState(false);

  // Real-time geolocation watcher
  const [driverGeoCoords, setDriverGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const hasFittedBoundsRef = useRef<string>('');

  // Dedicated dynamic polyline refs for Uber / Waze live route rendering
  const traveledPolylineRef = useRef<L.Polyline | null>(null);
  const remainingCasingRef = useRef<L.Polyline | null>(null);
  const remainingLineRef = useRef<L.Polyline | null>(null);
  const remainingDashesRef = useRef<L.Polyline | null>(null);
  const targetZoneCircleRef = useRef<L.Circle | null>(null);

  // Auto-follow mode for camera tracking (Uber / Yango Pro style)
  const [isFollowMode, setIsFollowMode] = useState<boolean>(true);

  // Watch real GPS position when in browser
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverGeoCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          if (pos.coords.speed !== null && pos.coords.speed > 0) {
            setSpeedKmh(Math.round(pos.coords.speed * 3.6));
          }
        },
        (err) => {
          console.warn("[GPS VTC] Geolocation watch error:", err.message);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Listen to Voix Off speaking events to show real-time animated wave HUD
  useEffect(() => {
    const handleVoiceSpeakingEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string; isSpeaking: boolean }>;
      if (customEvent.detail) {
        setIsVoiceSpeaking(Boolean(customEvent.detail.isSpeaking));
        if (customEvent.detail.text) {
          setCurrentSpokenText(customEvent.detail.text);
        }
      }
    };

    window.addEventListener('bradci-voice-speaking', handleVoiceSpeakingEvent);
    return () => window.removeEventListener('bradci-voice-speaking', handleVoiceSpeakingEvent);
  }, []);

  // Absent timer effect
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

  // Determine Origin and Destination based on currently selected leg (Pickup vs Dropoff)
  const isViewingPickup = activeLeg === 'pickup';
  const driverCommune = currentUser?.gpsLocation?.commune || 'Cocody';

  // Active Target Information
  const originCommuneName = isViewingPickup ? driverCommune : (job?.pickupCommune || 'Cocody');
  const targetCommuneName = isViewingPickup ? (job?.pickupCommune || 'Le Plateau') : (job?.dropoffCommune || 'Marcory');
  const targetAddressText = isViewingPickup ? (job?.pickupAddress || (isEn ? 'Seller Pickup Address' : 'Point de retrait vendeur')) : (job?.dropoffAddress || (isEn ? 'Buyer Delivery Address' : 'Adresse client'));
  const targetContactName = isViewingPickup ? (job?.sellerName || (isEn ? 'Seller' : 'Vendeur (Expéditeur)')) : (job?.buyerName || (isEn ? 'Buyer' : 'Client (Destinataire)'));
  const targetContactPhone = isViewingPickup ? (job?.sellerPhone || '+225 07 00 00 00 00') : (job?.buyerPhone || '+225 07 00 00 00 00');

  // Generate 3 realistic VTC alternative routes for this leg
  const routesBundle = useMemo(() => {
    return generateAbidjanAlternativeRoutes(
      originCommuneName,
      targetCommuneName,
      activeLeg,
      targetAddressText,
      targetContactName,
      targetContactPhone,
      language
    );
  }, [originCommuneName, targetCommuneName, activeLeg, targetAddressText, targetContactName, targetContactPhone, language]);

  // Currently selected route option
  const activeRouteOption: RoutePlanOption = useMemo(() => {
    return routesBundle.options.find(opt => opt.id === selectedRouteId) || routesBundle.options[0];
  }, [routesBundle, selectedRouteId]);

  // Commune Objects for Geographic Pinning
  const originCommuneObj = useMemo(() => {
    return ALL_COMMUNES.find(c => c.name.toLowerCase() === originCommuneName.toLowerCase()) || ALL_COMMUNES[0];
  }, [originCommuneName]);

  const targetCommuneObj = useMemo(() => {
    return ALL_COMMUNES.find(c => c.name.toLowerCase() === targetCommuneName.toLowerCase()) || ALL_COMMUNES[1];
  }, [targetCommuneName]);

  const startCoords = useMemo(() => {
    return {
      lat: driverGeoCoords?.lat || originCommuneObj.coords.lat,
      lng: driverGeoCoords?.lng || originCommuneObj.coords.lng
    };
  }, [driverGeoCoords, originCommuneObj]);

  const targetCoords = useMemo(() => {
    return {
      lat: targetCommuneObj.coords.lat,
      lng: targetCommuneObj.coords.lng
    };
  }, [targetCommuneObj]);

  // Navigation Camera & Follow Mode ('heading-up' = 3D follow, 'north-up' = 2D follow, 'overview' = full route)
  const [navOrientation, setNavOrientation] = useState<'heading-up' | 'north-up' | 'overview'>('heading-up');
  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(17);

  // Continuous heading angle tracker (prevents visual 360° flip when crossing 0°/360°)
  const continuousHeadingRef = useRef<number>(45);
  const [displayHeading, setDisplayHeading] = useState<number>(45);

  // Auto-recenter countdown state (facilitates hands-free driver experience if user pans map)
  const [recenterCountdown, setRecenterCountdown] = useState<number | null>(null);
  const autoRecenterIntervalRef = useRef<any>(null);
  const triggerAutoRecenterTimerRef = useRef<() => void>(() => {});

  // Dynamic Rerouting & Deviation State
  const [isRerouting, setIsRerouting] = useState<boolean>(false);
  const [rerouteCount, setRerouteCount] = useState<number>(0);
  const [rerouteNotice, setRerouteNotice] = useState<string | null>(null);
  const lastRerouteTimeRef = useRef<number>(0);
  const isReroutingRef = useRef<boolean>(false);
  const [simulatedDeviation, setSimulatedDeviation] = useState<{ lat: number; lng: number } | null>(null);

  // Real Road Routing state (OSRM API + Abidjan Bridge Corridors)
  const [activeRoadRoute, setActiveRoadRoute] = useState<CalculatedRoadRoute>(() =>
    buildAbidjanCorridorRoute(startCoords, targetCoords, selectedRouteId)
  );
  const [altRoadRoutes, setAltRoadRoutes] = useState<{
    fastest?: CalculatedRoadRoute;
    shortest?: CalculatedRoadRoute;
    eco_bypassing?: CalculatedRoadRoute;
  }>({});
  const [isRouteCalculating, setIsRouteCalculating] = useState(false);

  // Fetch real OSM / Abidjan corridor routes whenever start, target, or leg changes
  useEffect(() => {
    let isCancelled = false;
    setIsRouteCalculating(true);

    // Initial instant fallback so UI is immediately loaded with realistic road points
    const instantRoute = buildAbidjanCorridorRoute(startCoords, targetCoords, selectedRouteId);
    setActiveRoadRoute(instantRoute);

    // Fetch real road geometries asynchronously
    Promise.all([
      fetchRealOsmRoute(startCoords, targetCoords, 'fastest'),
      fetchRealOsmRoute(startCoords, targetCoords, 'shortest'),
      fetchRealOsmRoute(startCoords, targetCoords, 'eco_bypassing')
    ]).then(([fastestRoute, shortestRoute, ecoRoute]) => {
      if (isCancelled) return;
      setAltRoadRoutes({
        fastest: fastestRoute,
        shortest: shortestRoute,
        eco_bypassing: ecoRoute
      });
      const chosen = selectedRouteId === 'fastest' ? fastestRoute : selectedRouteId === 'shortest' ? shortestRoute : ecoRoute;
      setActiveRoadRoute(chosen);
      setIsRouteCalculating(false);
    }).catch(() => {
      if (!isCancelled) setIsRouteCalculating(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [startCoords.lat, startCoords.lng, targetCoords.lat, targetCoords.lng, selectedRouteId, activeLeg]);

  // Live courier progression along route (Uber / Yango Pro live vehicle movement)
  const [simProgress, setSimProgress] = useState(0.12);
  const [isLiveMotionActive, setIsLiveMotionActive] = useState(true);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  // Active polyline waypoints along actual roads and bridges
  const activeWaypoints = useMemo(() => {
    if (activeRoadRoute.coordinates && activeRoadRoute.coordinates.length > 2) {
      return activeRoadRoute.coordinates;
    }
    return buildAbidjanCorridorRoute(startCoords, targetCoords, selectedRouteId).coordinates;
  }, [activeRoadRoute, startCoords, targetCoords, selectedRouteId]);

  // Combined driving steps: prefer real road steps from OSRM / Abidjan corridor
  const drivingSteps: RouteStep[] = useMemo(() => {
    if (activeRoadRoute.steps && activeRoadRoute.steps.length > 0) {
      return activeRoadRoute.steps.map(s => ({
        id: s.id,
        instruction: s.instruction,
        distanceText: s.distanceText,
        distanceMeters: s.distanceMeters,
        durationText: s.durationText,
        icon: s.icon,
        streetName: s.streetName,
        speedLimitKmh: s.speedLimitKmh,
        roadType: (s.streetName.toLowerCase().includes('pont') ? 'bridge' : 'avenue') as any
      }));
    }
    return activeRouteOption.steps;
  }, [activeRoadRoute.steps, activeRouteOption.steps]);

  // Current active maneuver step along the road
  const currentStepIndex = useMemo(() => {
    const stepsCount = drivingSteps.length;
    if (stepsCount <= 1) return 0;
    const rawIdx = Math.floor(simProgress * stepsCount);
    return Math.min(stepsCount - 1, Math.max(0, rawIdx));
  }, [simProgress, drivingSteps.length]);

  // Next Maneuver Step
  const nextStep: RouteStep = drivingSteps[currentStepIndex] || drivingSteps[0] || {
    id: 'step-0',
    instruction: isEn ? `Follow main road towards ${targetCommuneName}.` : `Suivez l'artère principale vers ${targetCommuneName}.`,
    distanceText: '250 m',
    distanceMeters: 250,
    durationText: '1 min',
    icon: 'straight',
    streetName: `Avenue vers ${targetCommuneName}`,
    speedLimitKmh: 50,
    roadType: 'avenue'
  };

  // Current interpolated courier coordinates and heading angle (bearing)
  const currentPositionData = useMemo(() => {
    if (simulatedDeviation) {
      return {
        lat: simulatedDeviation.lat,
        lng: simulatedDeviation.lng,
        bearing: 90
      };
    }
    if (activeWaypoints.length < 2) {
      return { lat: startCoords.lat, lng: startCoords.lng, bearing: 45 };
    }
    const p = Math.max(0, Math.min(1, simProgress));
    const totalSegments = activeWaypoints.length - 1;
    const indexFloat = p * totalSegments;
    const index = Math.floor(indexFloat);
    const remainder = indexFloat - index;

    const ptA = activeWaypoints[Math.min(index, totalSegments)];
    const ptB = activeWaypoints[Math.min(index + 1, totalSegments)];

    const lat = ptA[0] + (ptB[0] - ptA[0]) * remainder;
    const lng = ptA[1] + (ptB[1] - ptA[1]) * remainder;

    const dY = Math.sin((ptB[1] - ptA[1]) * Math.PI / 180) * Math.cos(ptB[0] * Math.PI / 180);
    const dX = Math.cos(ptA[0] * Math.PI / 180) * Math.sin(ptB[0] * Math.PI / 180) -
               Math.sin(ptA[0] * Math.PI / 180) * Math.cos(ptB[0] * Math.PI / 180) * Math.cos((ptB[1] - ptA[1]) * Math.PI / 180);
    const bearing = Math.round(((Math.atan2(dY, dX) * 180 / Math.PI) + 360) % 360);

    return { lat, lng, bearing };
  }, [activeWaypoints, simProgress, startCoords, simulatedDeviation]);

  // Synchronisation continue du cap de la carte (chemin angulaire le plus court, sans saut 360°)
  useEffect(() => {
    const targetAngle = currentPositionData.bearing;
    const currentAngle = continuousHeadingRef.current;
    const diff = ((targetAngle - (currentAngle % 360) + 540) % 360) - 180;
    const nextAngle = currentAngle + diff;
    continuousHeadingRef.current = nextAngle;
    setDisplayHeading(nextAngle);
  }, [currentPositionData.bearing]);

  // Recalcul d'itinéraire en direct (si le chauffeur change de voie, rate une sortie ou demande le recalcul)
  const handleTriggerReroute = useCallback(async (customOrigin?: { lat: number; lng: number }, reason?: string) => {
    const now = Date.now();
    // Délai de garde anti-rebond (5 secondes)
    if (isReroutingRef.current || (now - lastRerouteTimeRef.current < 5000)) {
      return;
    }

    isReroutingRef.current = true;
    setIsRerouting(true);
    lastRerouteTimeRef.current = now;

    const fromPos = customOrigin || { lat: currentPositionData.lat, lng: currentPositionData.lng };
    const notice = reason || (isEn ? "Route recalculation in progress..." : "Recalcul de l'itinéraire en cours...");
    setRerouteNotice(notice);

    // Carillon GPS & Guidage Vocal
    playGpsChime();
    speakInstruction(
      isEn ? "Recalculating route, searching for fastest road..." : "Recalcul de l'itinéraire en cours...",
      language
    );

    addToast(
      isEn ? "Rerouting Active" : "Recalcul d'Itinéraire",
      isEn ? "Finding optimal path to destination..." : "Recherche de la meilleure voie vers votre destination...",
      "info"
    );

    try {
      const freshRoute = await recalculateRouteFromCurrentPosition(fromPos, targetCoords, selectedRouteId);
      if (freshRoute && freshRoute.coordinates && freshRoute.coordinates.length > 2) {
        setActiveRoadRoute(freshRoute);
        setSimProgress(0.01);
        setSimulatedDeviation(null);
        setRerouteCount(prev => prev + 1);

        const newFirstStep = freshRoute.steps[0]?.streetName || targetCommuneName;
        setTimeout(() => {
          speakInstruction(
            isEn 
              ? `New route calculated towards ${targetCommuneName}. Continue on ${newFirstStep}.`
              : `Nouvel itinéraire calculé vers ${targetCommuneName}. Continuez sur ${newFirstStep}.`,
            language
          );
        }, 1100);

        addToast(
          isEn ? "Route Recalculated" : "Itinéraire Recalculé",
          isEn ? `Traveled path updated to ${targetCommuneName}` : `Tracé actualisé vers ${targetCommuneName}`,
          "success"
        );
      }
    } catch (err) {
      console.warn("[BRAD'CI Router] Erreur lors du recalcul dynamique:", err);
    } finally {
      setTimeout(() => {
        setIsRerouting(false);
        isReroutingRef.current = false;
        setRerouteNotice(null);
      }, 1400);
    }
  }, [currentPositionData.lat, currentPositionData.lng, targetCoords, selectedRouteId, targetCommuneName, isEn, language, addToast]);

  // Action rapide : Simuler un écart ou changement de route pour tester le recalcul automatique
  const handleSimulateDeviation = useCallback(() => {
    // Écart de 90 mètres vers une artère adjacente
    const detourPoint = {
      lat: currentPositionData.lat + (Math.random() > 0.5 ? 0.0009 : -0.0009),
      lng: currentPositionData.lng + (Math.random() > 0.5 ? 0.0009 : -0.0009)
    };
    setSimulatedDeviation(detourPoint);
    addToast(
      isEn ? "Off-Route Detected" : "Changement de Route Détecté",
      isEn ? "Vehicle changed direction. Auto-recalculating route..." : "Véhicule engagé sur une autre voie. Recalcul automatique en cours...",
      "warning"
    );
    handleTriggerReroute(detourPoint, isEn ? "Off-route detected" : "Écart de route détecté");
  }, [currentPositionData, isEn, addToast, handleTriggerReroute]);

  // Détection automatique continue d'écart de trajectoire (> 55 mètres)
  useEffect(() => {
    if (isReroutingRef.current || !activeWaypoints || activeWaypoints.length < 2) return;
    const distToRoad = getDistanceToRoute(currentPositionData, activeWaypoints);
    if (distToRoad > 55) {
      handleTriggerReroute(currentPositionData, isEn ? `Off-route (${Math.round(distToRoad)}m)` : `Écart de route (${Math.round(distToRoad)}m)`);
    }
  }, [currentPositionData, activeWaypoints, isEn, handleTriggerReroute]);

  // Speed override state for live testing and manual speed adjustments
  const [isSpeedOverridden, setIsSpeedOverridden] = useState<boolean>(false);
  const lastOverspeedAlertTimeRef = useRef<number>(0);
  const wasOverspeedRef = useRef<boolean>(false);
  const [overspeedAlertActive, setOverspeedAlertActive] = useState<boolean>(false);
  const [overspeedWarningCount, setOverspeedWarningCount] = useState<number>(0);

  // Dynamic remaining ETA & Distance
  const dynamicEtaMin = useMemo(() => {
    const remainingFraction = Math.max(0.04, 1 - simProgress);
    const totalMin = activeRoadRoute.totalDurationMin || activeRouteOption.totalDurationMin;
    return Math.max(1, Math.round(totalMin * remainingFraction));
  }, [simProgress, activeRoadRoute.totalDurationMin, activeRouteOption.totalDurationMin]);

  const dynamicDistanceKm = useMemo(() => {
    const remainingFraction = Math.max(0.04, 1 - simProgress);
    const totalKm = activeRoadRoute.totalDistanceKm || activeRouteOption.totalDistanceKm;
    return (totalKm * remainingFraction).toFixed(1);
  }, [simProgress, activeRoadRoute.totalDistanceKm, activeRouteOption.totalDistanceKm]);

  // Vitesse maximale autorisée pour la voie actuelle
  const currentRoadSpeedLimit = useMemo(() => {
    return nextStep.speedLimitKmh || getSpeedLimitForRoad(nextStep.streetName, 50);
  }, [nextStep]);

  // Excès de vitesse détecté
  const isOverspeed = speedKmh > currentRoadSpeedLimit;
  const overspeedDelta = Math.max(0, speedKmh - currentRoadSpeedLimit);

  // Live driver motion timer (animates courier smoothly along Abidjan streets with high fps)
  useEffect(() => {
    if (!isLiveMotionActive) return;
    // 120ms tick for fluid continuous road gliding
    const timer = setInterval(() => {
      setSimProgress(prev => {
        const next = prev + 0.00085;
        if (next >= 0.985) {
          return 0.05; // Loop back for continuous navigation
        }
        return next;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [isLiveMotionActive]);

  // Periodic natural road speed fluctuations
  useEffect(() => {
    if (!isLiveMotionActive || isSpeedOverridden) return;
    const speedTimer = setInterval(() => {
      setSpeedKmh(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const target = Math.max(25, currentRoadSpeedLimit - 3);
        return Math.max(20, Math.min(currentRoadSpeedLimit + 3, (prev || target) + delta));
      });
    }, 2500);

    return () => clearInterval(speedTimer);
  }, [isLiveMotionActive, isSpeedOverridden, currentRoadSpeedLimit]);

  // Dynamic meters & distance countdown to next maneuver
  const dynamicMetersToNextTurn = useMemo(() => {
    const stepsCount = drivingSteps.length;
    if (stepsCount <= 1) return 150;
    const stepProgress = (simProgress * stepsCount) % 1;
    const currentStepMeters = nextStep.distanceMeters || 350;
    return Math.max(20, Math.round((1 - stepProgress) * currentStepMeters));
  }, [simProgress, drivingSteps.length, nextStep.distanceMeters]);

  const dynamicDistanceToNextTurn = useMemo(() => {
    if (dynamicMetersToNextTurn >= 1000) {
      return `Dans ${(dynamicMetersToNextTurn / 1000).toFixed(1)} km`;
    }
    return `Dans ${dynamicMetersToNextTurn} m`;
  }, [dynamicMetersToNextTurn]);

  // =========================================================================
  // GUIDAGE VOCAL AUTOMATIQUE VIRAGE PAR VIRAGE (STYLE WAZE / GOOGLE MAPS)
  // =========================================================================
  const lastAnnouncedStepIdRef = useRef<string>('');
  const lastAnnouncedThresholdRef = useRef<number>(-1);

  // Annonce automatique lors du franchissement des étapes et à l'approche des intersections
  useEffect(() => {
    if (isVoiceMuted || !isLiveMotionActive) return;

    const stepId = nextStep.id || `step-${currentStepIndex}`;
    const distMeters = dynamicMetersToNextTurn;

    // 1. Détection de nouvelle étape / nouveau virage
    if (lastAnnouncedStepIdRef.current !== stepId) {
      lastAnnouncedStepIdRef.current = stepId;
      lastAnnouncedThresholdRef.current = -1;
      playGpsChime();
      speakInstruction(
        isEn
          ? nextStep.instruction
          : nextStep.instruction,
        language
      );
      return;
    }

    // 2. Annonce anticipée à 250 mètres
    if (distMeters <= 250 && distMeters > 70 && lastAnnouncedThresholdRef.current !== 250) {
      lastAnnouncedThresholdRef.current = 250;
      playGpsChime();
      speakInstruction(
        isEn
          ? `In 250 meters, ${nextStep.instruction}`
          : `Dans 250 mètres, ${nextStep.instruction}`,
        language
      );
    } 
    // 3. Annonce imminente à 50 mètres
    else if (distMeters <= 50 && distMeters > 15 && lastAnnouncedThresholdRef.current !== 50) {
      lastAnnouncedThresholdRef.current = 50;
      playGpsChime();
      speakInstruction(
        isEn
          ? `Now, ${nextStep.instruction}`
          : `Maintenant, ${nextStep.instruction}`,
        language
      );
    }
  }, [nextStep, currentStepIndex, dynamicMetersToNextTurn, isVoiceMuted, isLiveMotionActive, isEn, language]);

  // =========================================================================
  // FONCTIONNALITÉ SÉCURITÉ ROUTIÈRE : ALERTE VOCALE ET SONORE SI EXCÈS DE VITESSE
  // RÈGLE : L'alarme retentit IMMÉDIATEMENT dès que le conducteur dépasse la vitesse maximale autorisée !
  // Bypasse isVoiceMuted pour garantir la sécurité du livreur
  // =========================================================================
  useEffect(() => {
    if (isOverspeed) {
      setOverspeedAlertActive(true);
      const now = Date.now();

      // DÉCLENCHEMENT IMMÉDIAT : Le véhicule vient tout juste de dépasser la vitesse maximale autorisée !
      if (!wasOverspeedRef.current) {
        wasOverspeedRef.current = true;
        lastOverspeedAlertTimeRef.current = now;
        setOverspeedWarningCount(c => c + 1);

        // Déclencher instantanément l'alarme sonore de radar + l'annonce vocale de sécurité
        announceOverspeedAlert(
          speedKmh,
          currentRoadSpeedLimit,
          nextStep.streetName,
          isEn ? 'en' : 'fr'
        );

        addToast(
          isEn ? "🚨 Speed Limit Exceeded!" : "🚨 Vitesse Maximale Dépassée !",
          isEn
            ? `Speed: ${speedKmh} km/h (Max: ${currentRoadSpeedLimit} km/h). Audible alarm is ringing!`
            : `Vitesse : ${speedKmh} km/h (Limite Max : ${currentRoadSpeedLimit} km/h). L'alarme de sécurité sonne ! Ralentissez.`,
          "error"
        );
      } else {
        // L'excès de vitesse se prolonge : répéter l'alarme sonore & vocale toutes les 6 secondes
        if (now - lastOverspeedAlertTimeRef.current > 6000) {
          lastOverspeedAlertTimeRef.current = now;
          setOverspeedWarningCount(c => c + 1);

          announceOverspeedAlert(
            speedKmh,
            currentRoadSpeedLimit,
            nextStep.streetName,
            isEn ? 'en' : 'fr'
          );
        }
      }
    } else {
      // Retour sous la limitation légale : couper l'alarme
      if (wasOverspeedRef.current) {
        wasOverspeedRef.current = false;
        setOverspeedAlertActive(false);
        // Bip de confirmation de retour à la vitesse légale
        playGpsChime();
        addToast(
          isEn ? "✅ Speed Compliant" : "✅ Vitesse Régulée Conforme",
          isEn
            ? `Back within the ${currentRoadSpeedLimit} km/h limit. Alarm stopped.`
            : `Vitesse revenue sous la limite autorisée (${currentRoadSpeedLimit} km/h). L'alarme s'est arrêtée.`,
          "success"
        );
      }
    }
  }, [speedKmh, currentRoadSpeedLimit, isOverspeed, nextStep.streetName, isEn]);

  // Action rapide : Simuler un excès de vitesse pour tester immédiatement l'alarme sonore et vocale
  const handleTriggerOverspeedTest = () => {
    setIsSpeedOverridden(true);
    const testOverspeed = currentRoadSpeedLimit + 22; // ex: 72 km/h sur voie 50, ou 102 sur voie 80
    setSpeedKmh(testOverspeed);
    wasOverspeedRef.current = true;
    lastOverspeedAlertTimeRef.current = Date.now();
    setOverspeedAlertActive(true);

    // Déclencher vocalement et soniquement immédiatement
    announceOverspeedAlert(
      testOverspeed,
      currentRoadSpeedLimit,
      nextStep.streetName,
      isEn ? 'en' : 'fr'
    );

    addToast(
      isEn ? "🚨 Overspeed Alarm Tested" : "🚨 Test Alarme de Vitesse Déclenché",
      isEn
        ? `Speed set to ${testOverspeed} km/h (Limit: ${currentRoadSpeedLimit} km/h). Alarm is ringing!`
        : `Vitesse fixée à ${testOverspeed} km/h (Limite : ${currentRoadSpeedLimit} km/h). L'alarme sonne !`,
      "error"
    );
  };

  // Action rapide : Ralentir à la vitesse autorisée et couper l'alarme
  const handleSlowDownToLegalSpeed = () => {
    setIsSpeedOverridden(true);
    const safeSpeed = Math.max(20, currentRoadSpeedLimit - 8);
    setSpeedKmh(safeSpeed);
    wasOverspeedRef.current = false;
    setOverspeedAlertActive(false);
    playGpsChime();
    addToast(
      isEn ? "Speed Regulated" : "Vitesse Régulée",
      isEn
        ? `Slowed down to ${safeSpeed} km/h (within ${currentRoadSpeedLimit} km/h limit).`
        : `Ralentissement à ${safeSpeed} km/h (vitesse sous la limite de ${currentRoadSpeedLimit} km/h). Alarme coupée.`,
      "success"
    );
  };

  // Action rapide : Ajuster vitesse (+/-)
  const handleAdjustSpeed = (delta: number) => {
    setIsSpeedOverridden(true);
    setSpeedKmh(prev => Math.max(10, Math.min(130, prev + delta)));
  };

  // Helper tile URL - 100% clean, NO watermarks (replaces cartocdn api watermark)
  const getTileUrl = (engine: 'streets' | 'satellite' | 'dark') => {
    switch (engine) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
      default:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    }
  };

  // Recentrage direct dans la direction de conduite du livreur
  const handleRecenter = useCallback(() => {
    setIsFollowMode(true);
    setNavOrientation('heading-up');
    setRecenterCountdown(null);
    if (autoRecenterIntervalRef.current) {
      clearInterval(autoRecenterIntervalRef.current);
      autoRecenterIntervalRef.current = null;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentPositionData.lat, currentPositionData.lng], 17, {
        animate: true
      });
      playGpsChime();
      addToast(
        isEn ? "Recentered in Driver Direction" : "Recentré dans la Direction du Livreur",
        `${targetCommuneName} • Vue Tête Haute 3D orientée dans votre axe • Cap ${currentPositionData.bearing}°`,
        "success"
      );
    }
  }, [currentPositionData, isEn, targetCommuneName, addToast]);

  // Déclencheur du compte à rebours de recentrage automatique (4 secondes d'inactivité)
  const triggerAutoRecenter = useCallback(() => {
    if (autoRecenterIntervalRef.current) {
      clearInterval(autoRecenterIntervalRef.current);
    }
    let remaining = 4;
    setRecenterCountdown(remaining);
    autoRecenterIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(autoRecenterIntervalRef.current);
        autoRecenterIntervalRef.current = null;
        setRecenterCountdown(null);
        handleRecenter();
      } else {
        setRecenterCountdown(remaining);
      }
    }, 1000);
  }, [handleRecenter]);

  useEffect(() => {
    triggerAutoRecenterTimerRef.current = triggerAutoRecenter;
  }, [triggerAutoRecenter]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(startCoords.lat + targetCoords.lat) / 2, (startCoords.lng + targetCoords.lng) / 2],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      const tileLayer = L.tileLayer(getTileUrl(mapEngineMode), {
        maxZoom: 19,
        maxNativeZoom: mapEngineMode === 'dark' ? 16 : 19,
        attribution: ''
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      const routeGroup = L.layerGroup().addTo(map);
      routeGroupRef.current = routeGroup;

      // Découplage doux si manipulation manuelle + déclenchement auto-recentrage mains-libres
      map.on('dragstart', () => {
        setIsFollowMode(false);
        if (triggerAutoRecenterTimerRef.current) {
          triggerAutoRecenterTimerRef.current();
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        routeGroupRef.current = null;
        driverMarkerRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on Mode Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newTile = L.tileLayer(getTileUrl(mapEngineMode), {
      maxZoom: 19,
      maxNativeZoom: mapEngineMode === 'dark' ? 16 : 19,
      attribution: ''
    }).addTo(map);
    tileLayerRef.current = newTile;
  }, [mapEngineMode]);

  // Redraw Route and Target Marker whenever route, coordinates, or leg changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeGroupRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    // 1. Draw Inactive Alternative Routes (subtle dashed lines)
    if (selectedRouteId !== 'fastest' && altRoadRoutes.fastest?.coordinates) {
      const line1 = L.polyline(altRoadRoutes.fastest.coordinates, {
        color: '#64748B',
        weight: 3.5,
        opacity: 0.6,
        dashArray: '6, 6'
      });
      line1.on('click', () => handleSelectRouteOption('fastest'));
      routeGroup.addLayer(line1);
    }

    if (selectedRouteId !== 'shortest' && altRoadRoutes.shortest?.coordinates) {
      const line2 = L.polyline(altRoadRoutes.shortest.coordinates, {
        color: '#64748B',
        weight: 3.5,
        opacity: 0.6,
        dashArray: '6, 6'
      });
      line2.on('click', () => handleSelectRouteOption('shortest'));
      routeGroup.addLayer(line2);
    }

    if (selectedRouteId !== 'eco_bypassing' && altRoadRoutes.eco_bypassing?.coordinates) {
      const line3 = L.polyline(altRoadRoutes.eco_bypassing.coordinates, {
        color: '#64748B',
        weight: 3.5,
        opacity: 0.6,
        dashArray: '6, 6'
      });
      line3.on('click', () => handleSelectRouteOption('eco_bypassing'));
      routeGroup.addLayer(line3);
    }

    // Active Route: Split into Traveled vs Remaining (Uber / Waze Pro HD Style)
    const { traveled, remaining } = splitRouteAtProgress(activeWaypoints, simProgress);

    // Traveled portion (subtle slate grey)
    const traveledLine = L.polyline(traveled, {
      color: '#475569',
      weight: 5,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    });
    traveledPolylineRef.current = traveledLine;
    routeGroup.addLayer(traveledLine);

    // Remaining portion - Outer dark shadow casing (13px for maximum contrast against all backgrounds)
    const remainingCasing = L.polyline(remaining, {
      color: '#020617',
      weight: 13,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });
    remainingCasingRef.current = remainingCasing;
    routeGroup.addLayer(remainingCasing);

    // Remaining portion - Main vibrant fluorescent route line (8px ultra-visible)
    const remainingLine = L.polyline(remaining, {
      color: isViewingPickup ? '#FF9100' : '#00E676',
      weight: 8,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round'
    });
    remainingLineRef.current = remainingLine;
    routeGroup.addLayer(remainingLine);

    // Dynamic directional chevrons/dashes along remaining route to indicate forward flow
    const remainingDashes = L.polyline(remaining, {
      color: '#FFFFFF',
      weight: 2.5,
      opacity: 0.9,
      dashArray: '8, 20'
    });
    remainingDashesRef.current = remainingDashes;
    routeGroup.addLayer(remainingDashes);

    // Target Destination Arrival Zone Circle (60m perimeter)
    const targetZoneCircle = L.circle([targetCoords.lat, targetCoords.lng], {
      radius: 65,
      color: isViewingPickup ? '#FF9100' : '#00E676',
      fillColor: isViewingPickup ? '#FF9100' : '#00E676',
      fillOpacity: 0.16,
      weight: 2,
      dashArray: '4, 6'
    });
    targetZoneCircleRef.current = targetZoneCircle;
    routeGroup.addLayer(targetZoneCircle);

    // 2. Driver Live Marker: 3D Vehicle with Forward Headlight Cone Beam (Uber / Yango Pro)
    const driverIconHtml = `
      <div class="relative flex items-center justify-center cursor-pointer pointer-events-auto" style="width: 80px; height: 80px;">
        <!-- Forward Headlight Cone Beam projected onto the road -->
        <div class="driver-headlight-cone absolute pointer-events-none transition-transform duration-200 ease-out" 
             style="transform: rotate(${currentPositionData.bearing}deg); width: 84px; height: 110px; bottom: 50%; left: calc(50% - 42px); transform-origin: bottom center;">
          <div style="width: 100%; height: 100%; background: linear-gradient(to top, rgba(254, 240, 138, 0.6) 0%, rgba(254, 240, 138, 0.22) 50%, transparent 100%); clip-path: polygon(25% 100%, 75% 100%, 100% 0%, 0% 0%); filter: blur(1.5px);"></div>
        </div>

        <!-- Pulsing radar wave -->
        <div class="absolute inset-3 rounded-full ${isViewingPickup ? 'bg-amber-400/30' : 'bg-emerald-400/30'} animate-ping pointer-events-none"></div>
        
        <!-- Vehicle 3D Body (Top-down aerodynamic car) -->
        <div class="driver-heading-puck relative w-8 h-14 rounded-lg flex flex-col items-center justify-between py-1 transition-transform duration-200 ease-out shadow-[0_12px_20px_rgba(0,0,0,0.65)] border-2 border-white ${
          isViewingPickup ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600' : 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600'
        }" style="transform: rotate(${currentPositionData.bearing}deg);">
          <!-- Front LED Headlights -->
          <div class="w-full flex justify-between px-1">
            <span class="w-1.5 h-1 bg-yellow-200 rounded-full shadow-[0_0_8px_#fef08a]"></span>
            <span class="w-1.5 h-1 bg-yellow-200 rounded-full shadow-[0_0_8px_#fef08a]"></span>
          </div>
          
          <!-- Windshield & Roof -->
          <div class="w-5 h-2.5 bg-slate-950/90 rounded-sm border border-slate-700"></div>
          <div class="w-4 h-3 bg-white/25 rounded-xs flex items-center justify-center text-[7px] font-black text-white">BRAD</div>
          <div class="w-5 h-2 bg-slate-950/90 rounded-sm border border-slate-700"></div>

          <!-- Rear Tail Lights -->
          <div class="w-full flex justify-between px-1">
            <span class="w-1.5 h-1 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444]"></span>
            <span class="w-1.5 h-1 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444]"></span>
          </div>
        </div>

        <!-- Real-time Speed & Driver Pill with Road Speed Limit -->
        <div class="driver-speed-badge absolute -bottom-5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9px] font-black shadow-2xl tracking-wider flex items-center gap-1.5 transition-all z-20 ${
          isOverspeed ? 'bg-red-600 text-white border border-red-300 ring-2 ring-red-500/80 animate-bounce' : 'bg-[#0B111E]/95 text-white border border-slate-700'
        }">
          <span class="w-1.5 h-1.5 rounded-full ${isOverspeed ? 'bg-white animate-ping' : (isViewingPickup ? 'bg-amber-400' : 'bg-emerald-400')}"></span>
          <span class="driver-speed-val">${speedKmh} KM/H</span>
          <span class="text-[8px] opacity-75">/ ${currentRoadSpeedLimit}</span>
        </div>
      </div>
    `;

    const driverMarker = L.marker([currentPositionData.lat, currentPositionData.lng], {
      icon: L.divIcon({
        className: 'driver-live-marker',
        html: driverIconHtml,
        iconSize: [80, 80],
        iconAnchor: [40, 40]
      }),
      zIndexOffset: 1000
    });
    driverMarkerRef.current = driverMarker;
    routeGroup.addLayer(driverMarker);

    // 3. Target Destination Marker (3D Pin with Checkered Finish / Box Icon)
    const targetIconHtml = `
      <div class="relative flex items-center justify-center animate-pulse">
        <div class="p-2 rounded-2xl flex items-center gap-2 shadow-[0_10px_25px_rgba(0,0,0,0.5)] border-2 text-slate-950 font-black ${
          isViewingPickup ? 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-200' : 'bg-gradient-to-r from-emerald-400 to-emerald-500 border-emerald-200'
        }">
          <span class="text-base">${isViewingPickup ? '📦' : '🏁'}</span>
          <div class="text-left leading-tight pr-1">
            <span class="text-[8px] uppercase tracking-wider block font-bold opacity-85">
              ${isViewingPickup ? (isEn ? 'Pickup Point' : 'Point Retrait') : (isEn ? 'Final Destination' : 'Destination Finale')}
            </span>
            <span class="text-[12px] whitespace-nowrap font-black">
              ${targetCommuneName}
            </span>
          </div>
        </div>
      </div>
    `;

    const targetMarker = L.marker([targetCoords.lat, targetCoords.lng], {
      icon: L.divIcon({
        className: 'target-dest-marker',
        html: targetIconHtml,
        iconSize: [120, 44],
        iconAnchor: [60, 22]
      })
    });
    routeGroup.addLayer(targetMarker);

    // Fit bounds smoothly on route switch
    const boundsKey = `${startCoords.lat}-${startCoords.lng}-${targetCoords.lat}-${targetCoords.lng}-${selectedRouteId}`;
    if (hasFittedBoundsRef.current !== boundsKey) {
      hasFittedBoundsRef.current = boundsKey;
      try {
        const bounds = L.latLngBounds([
          [startCoords.lat, startCoords.lng],
          [targetCoords.lat, targetCoords.lng]
        ]);
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
      } catch {
        // Fallback
      }
    }

  }, [startCoords, targetCoords, selectedRouteId, activeLeg, isViewingPickup, targetCommuneName, isEn]);

  // Dedicated smooth update for driver marker position, dynamic remaining polyline & predictive camera tracking
  useEffect(() => {
    // 1. Update dynamic polylines (traveled vs remaining)
    if (activeWaypoints.length > 2) {
      const { traveled, remaining } = splitRouteAtProgress(activeWaypoints, simProgress);
      if (traveledPolylineRef.current) traveledPolylineRef.current.setLatLngs(traveled);
      if (remainingCasingRef.current) remainingCasingRef.current.setLatLngs(remaining);
      if (remainingLineRef.current) remainingLineRef.current.setLatLngs(remaining);
      if (remainingDashesRef.current) remainingDashesRef.current.setLatLngs(remaining);
    }

    // 2. Update Driver Vehicle Marker (position, bearing & headlight beam)
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([currentPositionData.lat, currentPositionData.lng]);
      const el = driverMarkerRef.current.getElement();
      if (el) {
        const puck = el.querySelector('.driver-heading-puck') as HTMLElement;
        if (puck) {
          puck.style.transform = `rotate(${currentPositionData.bearing}deg)`;
        }
        const headlight = el.querySelector('.driver-headlight-cone') as HTMLElement;
        if (headlight) {
          headlight.style.transform = `rotate(${currentPositionData.bearing}deg)`;
        }
        const speedVal = el.querySelector('.driver-speed-val') as HTMLElement;
        if (speedVal) {
          speedVal.textContent = `${speedKmh} KM/H`;
        }
        const badge = el.querySelector('.driver-speed-badge') as HTMLElement;
        if (badge) {
          if (speedKmh > currentRoadSpeedLimit) {
            badge.className = 'driver-speed-badge absolute -bottom-5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9px] font-black shadow-2xl tracking-wider flex items-center gap-1.5 transition-all bg-red-600 text-white border border-red-300 ring-2 ring-red-500/80 animate-bounce z-20';
          } else {
            badge.className = 'driver-speed-badge absolute -bottom-5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9px] font-black shadow-2xl tracking-wider flex items-center gap-1.5 transition-all bg-[#0B111E]/95 text-white border border-slate-700 z-20';
          }
        }
      }
    }

    // 3. Auto-Follow Camera: Centrage direct et continu sur le livreur dans sa direction
    if (isFollowMode && mapInstanceRef.current && isLiveMotionActive) {
      // Centrage direct et immédiat sur la coordonnée réelle du livreur
      // Le livreur reste scotché au centre de pivotement de l'écran, et la carte tourne sous lui
      mapInstanceRef.current.setView([currentPositionData.lat, currentPositionData.lng], currentZoomLevel, {
        animate: false
      });
    }
  }, [currentPositionData, speedKmh, currentRoadSpeedLimit, isFollowMode, isLiveMotionActive, simProgress, activeWaypoints, currentZoomLevel]);

  // Handle Route Option Switch
  const handleSelectRouteOption = (optionId: 'fastest' | 'shortest' | 'eco_bypassing') => {
    setSelectedRouteId(optionId);
    const chosen = routesBundle.options.find(o => o.id === optionId);
    if (chosen) {
      addToast(chosen.name, `${chosen.totalDurationMin} min • ${chosen.totalDistanceKm} km`, "info");
      if (!isVoiceMuted) {
        speakInstruction(
          isEn 
            ? `${chosen.name} selected. Estimated duration: ${chosen.totalDurationMin} minutes.`
            : `${chosen.name} activé. Durée estimée : ${chosen.totalDurationMin} minutes.`,
          language
        );
      } else {
        playGpsChime();
      }
    }
  };

  // Toggle Voice Guidance
  const handleToggleVoice = () => {
    const nextMuted = !isVoiceMuted;
    setIsVoiceMuted(nextMuted);
    localStorage.setItem('bradci_driver_voice_muted', String(nextMuted));
    if (!nextMuted) {
      playGpsChime();
      speakInstruction(
        isEn
          ? `BRAD'CI Voice Guidance enabled. ${nextStep.instruction}`
          : `Guidage Voix Off BRAD'CI activé. ${nextStep.instruction}`,
        language
      );
      addToast(
        isEn ? "Voice Guidance enabled" : "Guidage Voix Off activé",
        isEn ? "Turn-by-turn spoken instructions are active." : "Les instructions seront annoncées à haute voix.",
        "success"
      );
    } else {
      addToast(
        isEn ? "Voice Muted" : "Voix Off coupée",
        isEn ? "Silent navigation active." : "Mode silencieux actif.",
        "info"
      );
    }
  };

  // Repeat current maneuver aloud
  const handleRepeatVoice = () => {
    playGpsChime();
    speakInstruction(nextStep.instruction, language);
    addToast(isEn ? "Instruction Repeated" : "Répétition", nextStep.instruction, "info");
  };

  // Direct robust URLs for Google Maps & Waze Turn-by-Turn Navigation
  const googleMapsDirectionsUrl = useMemo(() => {
    const originQuery = encodeURIComponent(`${originCommuneName}, Abidjan, Côte d'Ivoire`);
    const destQuery = encodeURIComponent(`${targetAddressText}, ${targetCommuneName}, Abidjan, Côte d'Ivoire`);
    return `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destQuery}&travelmode=driving`;
  }, [originCommuneName, targetAddressText, targetCommuneName]);

  const wazeDirectionsUrl = useMemo(() => {
    const destQuery = encodeURIComponent(`${targetAddressText}, ${targetCommuneName}, Abidjan`);
    return `https://waze.com/ul?q=${destQuery}&navigate=yes`;
  }, [targetAddressText, targetCommuneName]);

  // Deep Link Launch: Native Google Maps Turn-by-Turn Navigation
  const handleOpenNativeGoogleMaps = () => {
    if (!job) return;
    try {
      const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
      if (isAndroid) {
        const destString = encodeURIComponent(`${targetAddressText}, ${targetCommuneName}, Abidjan, Côte d'Ivoire`);
        window.location.href = `google.navigation:q=${destString}&mode=d`;
        setTimeout(() => {
          window.open(googleMapsDirectionsUrl, '_blank');
        }, 500);
      } else {
        window.open(googleMapsDirectionsUrl, '_blank');
      }
    } catch (_) {
      window.open(googleMapsDirectionsUrl, '_blank');
    }
  };

  // Deep Link Launch: Waze
  const handleOpenWaze = () => {
    try {
      window.open(wazeDirectionsUrl, '_blank');
    } catch (_) {}
  };

  // Validate pickup code (Remise vendeur)
  const handleValidatePickup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!job) return;
    if (!pickupCodeInput || pickupCodeInput.trim().length < 4) {
      addToast(
        isEn ? "Seller code required" : "Code vendeur requis",
        isEn ? "Please enter the 4-digit code provided by the seller." : "Veuillez saisir le code à 4 chiffres fourni par le vendeur.",
        "error"
      );
      return;
    }
    driverConfirmPickup(job.id, pickupCodeInput.trim());
    setPickupCodeInput('');
    setShowPickupModal(false);
    setActiveLeg('dropoff'); // Switch to delivery leg immediately!
    addToast(
      isEn ? "Parcel collected!" : "Colis récupéré !",
      isEn ? "Route to buyer activated." : "L'itinéraire vers le client acheteur est activé.",
      "success"
    );
    speakInstruction(
      isEn
        ? `Parcel successfully collected. Starting route to buyer in ${job.dropoffCommune}.`
        : `Colis récupéré avec succès. Démarrage de l'itinéraire de livraison vers le client à ${job.dropoffCommune}.`,
      language
    );
  };

  // Validate delivery OTP (Remise client)
  const handleValidateDeliveryOTP = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!job) return;
    if (!deliveryOtpInput || deliveryOtpInput.trim().length < 4) {
      addToast(
        isEn ? "OTP code required" : "Code OTP requis",
        isEn ? "Please enter the 4-digit secret buyer code." : "Veuillez saisir le code secret acheteur (4 chiffres).",
        "error"
      );
      return;
    }
    driverConfirmDeliveryOTP(job.id, deliveryOtpInput.trim());
    setDeliveryOtpInput('');
    setShowDeliveryModal(false);
    addToast(
      isEn ? "Delivery validated!" : "Course validée !",
      isEn ? "Payment instantly credited to your wallet balance." : "Paiement débloqué instantanément sur votre solde.",
      "success"
    );
    speakInstruction(
      isEn
        ? "Congratulations! Delivery completed successfully. Your earnings are unlocked immediately."
        : "Félicitations ! Course livrée avec succès. Vos gains sont débloqués immédiatement.",
      language
    );
  };

  // Manual Zoom In (+)
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
      const z = mapInstanceRef.current.getZoom() + 1;
      setCurrentZoomLevel(z);
      playGpsChime();
    }
  };

  // Manual Zoom Out (-)
  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
      const z = mapInstanceRef.current.getZoom() - 1;
      setCurrentZoomLevel(z);
      playGpsChime();
    }
  };

  // Set Navigation Orientation Mode ('heading-up' | 'north-up' | 'overview')
  const handleSetNavOrientation = (mode: 'heading-up' | 'north-up' | 'overview') => {
    setNavOrientation(mode);
    playGpsChime();
    if (mode === 'heading-up') {
      setIsFollowMode(true);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([currentPositionData.lat, currentPositionData.lng], 17, { duration: 0.7 });
      }
      addToast(
        isEn ? "3D Heading-Up Navigation" : "Navigation 3D Tête Haute",
        isEn ? "Map rotates with vehicle heading in driving direction" : "La carte s'oriente dans le sens de marche avec vue perspective",
        "info"
      );
    } else if (mode === 'north-up') {
      setIsFollowMode(true);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([currentPositionData.lat, currentPositionData.lng], 16, { duration: 0.7 });
      }
      addToast(
        isEn ? "2D North-Up Mode" : "Mode 2D Nord en Haut",
        isEn ? "Map locked to North with vehicle follow" : "Carte orientée vers le Nord avec suivi du véhicule",
        "info"
      );
    } else {
      setIsFollowMode(false);
      if (mapInstanceRef.current && activeWaypoints.length > 0) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(activeWaypoints), { padding: [50, 50] });
      }
      addToast(
        isEn ? "Full Route Overview" : "Vue Globale de l'Itinéraire",
        isEn ? "Viewing entire course geometry" : "Affichage du tracé complet avec tous les ponts et boulevards",
        "info"
      );
    }
  };

  // Cycle orientation (tapping compass)
  const handleCycleOrientation = () => {
    if (navOrientation === 'heading-up') {
      handleSetNavOrientation('north-up');
    } else if (navOrientation === 'north-up') {
      handleSetNavOrientation('overview');
    } else {
      handleSetNavOrientation('heading-up');
    }
  };

  // Test voice guidance aloud
  const handleTestVoice = () => {
    playGpsChime();
    const testPhrase = isEn
      ? `BRAD'CI Voice Guidance active. In 250 meters, turn right on Boulevard towards ${targetCommuneName}.`
      : `Guidage vocal BRAD'CI opérationnel. Dans 250 mètres, tournez à droite sur le boulevard vers ${targetCommuneName}.`;
    speakInstruction(testPhrase, language);
    addToast(
      isEn ? "Testing Voice GPS" : "Test Guidage Vocal GPS",
      testPhrase,
      "success"
    );
  };

  // Delivery Category badge text
  const courseTypeBadge = useMemo(() => {
    if (!job) return 'Course BRAD\'CI';
    if (job.requiredVehicle === 'cargo') return isEn ? 'Freight & Heavy Truck' : 'Transport Fret & Camion';
    const titleLower = (job.productTitle || '').toLowerCase();
    if (titleLower.includes('express') || titleLower.includes('coursier')) {
      return isEn ? 'Express Courier Run' : 'Course Express Coursier';
    }
    if (titleLower.includes('lot') || titleLower.includes('b2b') || titleLower.includes('déstockage')) {
      return isEn ? 'B2B Liquidation Freight' : 'Fret Déstockage B2B';
    }
    return isEn ? 'Auction Parcel Delivery' : 'Livraison Colis Enchères';
  }, [job, isEn]);

  // If no job is active, show the clean radar standby screen
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
            ● {isEn ? 'Live GPS Dispatch Radar' : "GPS & Radar d'Attribution En Direct"}
          </span>
          <h3 className="text-xl font-black text-white">
            {isEn ? 'No active mission currently' : 'Aucune course active en cours'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isEn 
              ? `Your GPS is synchronized. You are located in ${currentUser?.gpsLocation?.commune || 'Abidjan'} and will receive priority alerts for nearby orders.`
              : `Votre géolocalisation GPS est synchronisée. Vous êtes positionné à ${currentUser?.gpsLocation?.commune || 'Abidjan'} et recevrez les alertes prioritaires des commandes environnantes.`
            }
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            id="driver-standby-browse-orders-btn"
            onClick={onBrowseOrders}
            className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>{isEn ? 'Browse Available Orders' : 'Consulter les Courses Disponibles'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="driver-vtc-gps-screen"
      className="relative w-full h-[calc(100dvh-175px)] sm:h-[86vh] min-h-[500px] max-h-[860px] rounded-3xl overflow-hidden bg-[#040814] border border-slate-800 shadow-2xl flex flex-col justify-between select-none"
    >
      {/* ========================================================================= */}
      {/* 1. MOTEUR CARTOGRAPHIQUE GPS VTC PRO (LEAFLET RÉEL SANS FILIGRANE)        */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#040814]">
        {/* Moteur Cartographique Interactif Réel (Leaflet avec rotation 3D tête-haute ou 2D) */}
        <div 
          style={{
            width: navOrientation === 'heading-up' ? '160%' : '100%',
            height: navOrientation === 'heading-up' ? '160%' : '100%',
            left: navOrientation === 'heading-up' ? '-30%' : '0',
            top: navOrientation === 'heading-up' ? '-30%' : '0',
            transform: navOrientation === 'heading-up' 
              ? `perspective(1000px) rotateX(24deg) rotate(${-displayHeading}deg)` 
              : 'none',
            transformOrigin: '50% 50%',
            transition: 'transform 0.25s linear'
          }}
          className="absolute inset-0 bg-[#040814]"
        >
          <div 
            ref={mapContainerRef}
            id="leaflet-mission-map-canvas"
            className="w-full h-full bg-[#040814]"
          />
        </div>

        {/* Floating Controls on Map: Side Dock (Ultra Compact, Pro VTC on the side) */}
        <div className="absolute top-20 right-2 sm:right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
          {/* 1. Interactive Compass / 3D Navigation FAB */}
          <button
            id="driver-btn-compass-cycle"
            type="button"
            onClick={handleCycleOrientation}
            className={`w-9 h-9 rounded-2xl border shadow-xl flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer backdrop-blur-md ${
              navOrientation === 'heading-up'
                ? 'bg-emerald-950/90 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-400'
                : navOrientation === 'north-up'
                ? 'bg-sky-950/90 border-sky-500 ring-2 ring-sky-500/40 text-sky-400'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}
            title="Changer orientation (3D Tête Haute / 2D Nord / Vue Globale)"
          >
            <div 
              className="w-4 h-4 flex items-center justify-center transition-transform duration-300"
              style={{
                transform: navOrientation === 'heading-up' 
                  ? `rotate(${-currentPositionData.bearing}deg)` 
                  : 'rotate(0deg)'
              }}
            >
              <Navigation className="w-3.5 h-3.5 fill-current text-red-500" />
            </div>
            <span className="text-[7px] font-black uppercase tracking-tighter">
              {navOrientation === 'heading-up' ? '3D' : navOrientation === 'north-up' ? 'NORD' : 'VUE'}
            </span>
          </button>

          {/* 2. BOUTON OPTIONS SUR LE CÔTÉ (TOUT PETIT & ULTRA PROFESSIONNEL) */}
          <button
            id="driver-btn-side-options"
            type="button"
            onClick={() => setShowOptionsDrawer(true)}
            className="px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 border border-sky-400 text-white shadow-xl shadow-sky-500/30 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            title="Toutes les options : Google Maps, Waze, 3 Itinéraires, Roadbook, Minuteur"
          >
            <Sliders className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-black uppercase tracking-wider">Options</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </button>

          {/* 3. Recenter GPS FAB (appears / pulses when driver panned away) */}
          {!isFollowMode && (
            <button
              id="driver-btn-recenter-gps"
              type="button"
              onClick={handleRecenter}
              className="w-9 h-9 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer ring-2 ring-white animate-bounce"
              title="Recentrer sur le livreur"
            >
              <Locate className="w-4 h-4 text-slate-950" />
            </button>
          )}

          {/* 4. Map Style Toggle (Streets, Satellite, Dark) */}
          <button
            id="driver-btn-map-mode-toggle"
            type="button"
            onClick={() => {
              const modes: ('streets' | 'satellite' | 'dark')[] = ['streets', 'satellite', 'dark'];
              const next = modes[(modes.indexOf(mapEngineMode) + 1) % modes.length];
              setMapEngineMode(next);
              addToast(
                isEn ? "Map Style" : "Style de Carte",
                next === 'satellite' ? (isEn ? "HD Satellite View" : "Vue Satellite HD") : next === 'dark' ? (isEn ? "VTC Night Radar" : "Radar Nocturne VTC") : (isEn ? "Abidjan Street Map" : "Plan des Rues d'Abidjan"),
                "info"
              );
            }}
            className="w-8 h-8 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-sky-400 shadow-lg flex items-center justify-center transition-transform active:scale-95 cursor-pointer backdrop-blur-md"
            title={isEn ? "Map Style" : "Style de Carte"}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* 5. Zoom (+ / -) */}
          <div className="flex flex-col rounded-xl bg-slate-900/85 border border-slate-700 overflow-hidden shadow-lg backdrop-blur-md">
            <button
              id="driver-btn-zoom-in"
              type="button"
              onClick={handleZoomIn}
              className="w-7 h-7 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer border-b border-slate-800 active:bg-slate-700"
              title={isEn ? "Zoom in" : "Zoom avant"}
            >
              +
            </button>
            <button
              id="driver-btn-zoom-out"
              type="button"
              onClick={handleZoomOut}
              className="w-7 h-7 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer active:bg-slate-700"
              title={isEn ? "Zoom out" : "Zoom arrière"}
            >
              −
            </button>
          </div>
        </div>

        {/* Sleek Floating Speedometer Pill at bottom-left */}
        <div 
          id="driver-speedometer-floating-pill"
          className="absolute bottom-20 left-2.5 sm:left-4 z-20 pointer-events-auto"
        >
          <div className={`p-1.5 sm:p-2 px-2.5 sm:px-3 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center gap-2.5 transition-all ${
            isOverspeed 
              ? 'bg-red-950/95 border-red-500 text-white ring-4 ring-red-500/40 shadow-red-500/30 animate-pulse' 
              : 'bg-[#0B111E]/95 border-slate-700/80 text-white shadow-xl'
          }`}>
            {/* Speed limit sign (Panneau rond blanc officiel à bordure rouge) */}
            <div 
              className="w-8 h-8 rounded-full bg-white border-[3px] border-red-600 flex items-center justify-center shrink-0 shadow-md ring-1 ring-black/20"
              title={`Limitation Maximale Autorisée : ${currentRoadSpeedLimit} km/h (l'alarme sonne au-delà)`}
            >
              <span className="text-slate-950 font-black text-xs leading-none">{currentRoadSpeedLimit}</span>
            </div>

            {/* Current speed reading */}
            <div className="leading-tight">
              <div className="flex items-baseline gap-0.5">
                <span className={`text-base sm:text-lg font-mono font-black ${isOverspeed ? 'text-red-300' : 'text-white'}`}>
                  {speedKmh}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">km/h</span>
              </div>
              <div className="text-[8px] font-black uppercase tracking-wider">
                {isOverspeed ? (
                  <span className="text-red-400 font-bold flex items-center gap-0.5 animate-bounce">
                    🚨 ALARME SONNE (+{overspeedDelta})
                  </span>
                ) : (
                  <span className="text-emerald-400">
                    Max: {currentRoadSpeedLimit} km/h
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: If overspeed, direct Slow Down button; otherwise speed adjustment & test */}
            {isOverspeed ? (
              <button
                id="driver-btn-slow-down-pill"
                type="button"
                onClick={handleSlowDownToLegalSpeed}
                className="py-1 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-red-700 font-black text-[10px] shadow-lg active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                title="Ralentir sous la vitesse maximale pour couper l'alarme"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ralentir</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 pl-1.5 border-l border-slate-700/60 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAdjustSpeed(-5)}
                  className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 border border-slate-800"
                  title="Réduire la vitesse (-5 km/h)"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustSpeed(5)}
                  className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 border border-slate-800"
                  title="Accélérer (+5 km/h) - Dépasse la vitesse maximale pour faire retentir l'alarme"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleTriggerOverspeedTest}
                  className="px-2 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white font-black text-[9px] flex items-center gap-1 cursor-pointer active:scale-95 border border-red-800/60"
                  title="Tester le dépassement de la vitesse maximale pour faire retentir l'alarme sonore & vocale"
                >
                  <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
                  <span className="hidden sm:inline">Test Alarme</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP FLOATING HUD : VTC ULTRA-COMPACT PRO GUIDANCE (1 SINGLE ROW)       */}
      {/* ========================================================================= */}
      <div className="relative z-20 m-2 sm:m-3 pointer-events-auto">
        <div 
          id="driver-vtc-top-guidance-bar"
          className={`p-2 sm:p-2.5 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center justify-between gap-2 transition-all ${
            isOverspeed 
              ? 'bg-red-950/95 border-red-500 ring-2 ring-red-500/40' 
              : 'bg-[#0B111E]/95 border-slate-800/90'
          }`}
        >
          {/* Turn Maneuver & Next Direction */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
              isViewingPickup ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
            }`}>
              <CornerUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded border ${
                  isViewingPickup 
                    ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' 
                    : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                }`}>
                  {dynamicDistanceToNextTurn}
                </span>

                {/* Quick 1-Tap Leg Switcher Pill */}
                <button
                  type="button"
                  onClick={() => setActiveLeg(activeLeg === 'pickup' ? 'dropoff' : 'pickup')}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 transition-all cursor-pointer ${
                    isViewingPickup
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                  title={isEn ? "Switch leg: Pickup vs Delivery" : "Basculer : Ramassage vs Livraison"}
                >
                  <span>{isViewingPickup ? '📦 Retrait' : '🏁 Livraison'}</span>
                  <span className="text-slate-400 font-normal">({targetCommuneName})</span>
                </button>
              </div>

              {/* Instruction line */}
              <p className="text-xs sm:text-sm font-black text-white leading-tight truncate mt-0.5">
                {isOverspeed ? (
                  <span className="text-red-300 font-black animate-pulse flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
                    <span>🚨 ALARME VITESSE : {speedKmh} km/h (Limite max {currentRoadSpeedLimit} km/h) — L'alarme sonne !</span>
                  </span>
                ) : (
                  nextStep.instruction
                )}
              </p>
            </div>
          </div>

          {/* Quick HUD Action Tools (Ultra Compact) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* If overspeed, small slow down button */}
            {isOverspeed && (
              <button
                type="button"
                onClick={handleSlowDownToLegalSpeed}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-red-700 font-black text-[11px] rounded-xl shadow-lg cursor-pointer active:scale-95 animate-bounce flex items-center gap-1"
                title="Couper l'alarme et ralentir sous la limite"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ralentir</span>
              </button>
            )}

            {/* Quick Recalculate Button */}
            <button
              id="driver-btn-quick-reroute"
              type="button"
              onClick={() => handleTriggerReroute(undefined, isEn ? "Manual recalculation" : "Recalcul manuel")}
              className={`p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-md ${
                isRerouting 
                  ? 'bg-amber-500 border-amber-400 text-slate-950 ring-2 ring-amber-400/50' 
                  : 'bg-slate-900 border-slate-700 text-amber-400 hover:text-amber-300'
              }`}
              title={isEn ? "Recalculate route if path changed" : "Recalculer l'itinéraire si changement de route"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRerouting ? 'animate-spin' : ''}`} />
            </button>

            {/* Live Movement Simulation Toggle */}
            <button
              id="driver-btn-toggle-motion"
              type="button"
              onClick={() => {
                setIsLiveMotionActive(prev => !prev);
              }}
              className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all cursor-pointer shadow-md ${
                isLiveMotionActive
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isLiveMotionActive ? "Mettre en pause le déplacement" : "Activer le déplacement en direct"}
            >
              {isLiveMotionActive ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Voice Mute / Unmute */}
            <button
              id="driver-btn-toggle-voice"
              type="button"
              onClick={handleToggleVoice}
              className={`p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isVoiceMuted
                  ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
              title={isVoiceMuted ? "Activer la voix" : "Couper la voix"}
            >
              {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Thin Dynamic Recalculation Alert Line */}
        {isRerouting && (
          <div className="w-full h-1 bg-amber-500 rounded-full animate-pulse mt-1" />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING COMPACT ACTION BAR (UBER / YANGO PRO STYLE - 100% MAP VISIBLE) */}
      {/* ========================================================================= */}
      <div 
        id="driver-vtc-floating-bottom-bar"
        className="relative z-30 m-2 sm:m-3 p-2 sm:p-2.5 rounded-2xl bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 shadow-2xl flex items-center justify-between gap-2 pointer-events-auto"
      >
        {/* Left: ETA, Distance & Contact Name */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-xs sm:text-sm font-black text-emerald-400">
              {dynamicEtaMin} min
            </span>
            <span className="text-[10px] text-slate-400">
              ({dynamicDistanceKm} km)
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 ml-1">
              +{job.deliveryFee.toLocaleString('fr-FR')} F
            </span>
          </div>
          <p className="text-[11px] text-slate-300 truncate font-semibold">
            {targetContactName} • <span className="text-slate-400 font-normal">{targetAddressText}</span>
          </p>
        </div>

        {/* Right: Primary Action Button + Call + Voice Note + Options Modal */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Main Action Button (BRAD'CI Signature Orange #F97316) */}
          {isActualPickupPhase ? (
            <button
              id="driver-btn-arrived-pickup"
              onClick={() => setShowPickupModal(true)}
              className="py-2.5 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs shadow-lg shadow-[#F97316]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{isEn ? 'Arrived at Pickup' : 'Arrivé au Retrait'}</span>
            </button>
          ) : job.status === 'in_transit' ? (
            <button
              id="driver-btn-arrived-dropoff"
              onClick={() => {
                driverDeclareArrival(job.id);
                addToast(
                  isEn ? "Arrival Notified" : "Arrivée notifiée",
                  isEn ? "Buyer has been notified of your presence." : "L'acheteur a été notifié de votre présence.",
                  "info"
                );
                speakInstruction(
                  isEn ? "You signaled your arrival to the buyer." : "Vous avez signalé votre arrivée chez le client acheteur.",
                  language
                );
              }}
              className="py-2.5 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs shadow-lg shadow-[#F97316]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{isEn ? 'I have arrived' : 'Je suis arrivé'}</span>
            </button>
          ) : (
            <button
              id="driver-btn-validate-otp"
              onClick={() => setShowDeliveryModal(true)}
              className="py-2.5 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs shadow-lg shadow-[#F97316]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{isEn ? 'Validate OTP' : 'Valider OTP'}</span>
            </button>
          )}

          {/* Quick Voice Note / Chat */}
          <button
            id="driver-btn-chat-client"
            type="button"
            onClick={() => setShowChatModal(true)}
            className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
            title={isEn ? `Send voice note to ${targetContactName}` : `Note Vocale / Chat avec ${targetContactName}`}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Quick Direct Call */}
          <a
            id="driver-btn-call-client"
            href={`tel:${targetContactPhone}`}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
            title={isEn ? `Call ${targetContactName}` : `Appeler ${targetContactName}`}
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
          </a>

          {/* Open Options Drawer Modal Button */}
          <button
            id="driver-btn-open-options-bar"
            type="button"
            onClick={() => setShowOptionsDrawer(true)}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
            title="Ouvrir toutes les options (Google Maps, 3 itinéraires, roadbook, minuteur)"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DRAWER MODAL DE TOUTES LES OPTIONS (S'OUVRE EN PLEIN ÉCRAN / SLIDE-UP) */}
      {/* ========================================================================= */}
      {showOptionsDrawer && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 flex items-end sm:items-center justify-center animate-in fade-in">
          <div className="w-full max-w-xl bg-[#0B111E] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 max-h-[88vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {isEn ? 'Trip & Navigation Options' : 'Options & Itinéraires de la Course'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {job.pickupCommune} ➔ {job.dropoffCommune} ({dynamicEtaMin} min • {dynamicDistanceKm} km)
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowOptionsDrawer(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
                title="Fermer et revenir à la carte"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* OPTION 1: 3 ITINÉRAIRES ALTERNATIFS */}
            <div className="p-3 rounded-2xl bg-[#070D18] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Route className="w-3.5 h-3.5 text-sky-400" />
                  <span>1. Sélectionner un itinéraire (3 disponibles)</span>
                </span>
                <span className="text-[10px] text-slate-400">{job.pickupCommune} ➔ {job.dropoffCommune}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {routesBundle.options.map((opt) => {
                  const isSelected = selectedRouteId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectRouteOption(opt.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg' 
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {opt.id === 'fastest' ? (isEn ? 'Fastest' : 'Voie Rapide') : opt.id === 'shortest' ? (isEn ? 'Direct' : 'Axe Direct') : (isEn ? 'Bypass' : 'Contourne')}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="font-mono font-black text-white text-xs mt-1">
                        {opt.totalDurationMin} min
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {opt.totalDistanceKm} km
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OPTION 2: GPS EXTERNE DIRECT (GOOGLE MAPS & WAZE) */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 text-blue-400 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">
                      2. Navigation GPS Externe en 1-Clic
                    </h4>
                    <p className="text-[10px] text-slate-400">Guidage vocal virage par virage</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">{dynamicEtaMin} min • {dynamicDistanceKm} km</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  id="driver-btn-drawer-gmaps"
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenNativeGoogleMaps}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer"
                >
                  <Compass className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>Lancer Google Maps</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                </a>

                <a
                  id="driver-btn-drawer-waze"
                  href={wazeDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenWaze}
                  className="py-2.5 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer"
                >
                  <Navigation className="w-4 h-4 shrink-0 text-cyan-200" />
                  <span>Lancer Waze</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                </a>
              </div>
            </div>

            {/* OPTION 3: FEUILLE DE ROUTE DÉTAILLÉE (ROADBOOK ÉTAPES) */}
            <div className="p-3 rounded-2xl bg-[#070D18] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Feuille de Route ({activeRouteOption.steps.length} étapes)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowGmapsModal(true)}
                  className="text-[10px] font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Agrandir plein écran
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 pt-1">
                {activeRouteOption.steps.map((step, idx) => {
                  const stepLimit = step.speedLimitKmh || getSpeedLimitForRoad(step.streetName, 50);
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div 
                      key={step.id} 
                      className={`p-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 transition-all ${
                        isCurrent 
                          ? 'bg-sky-950/70 border-sky-500/50 ring-1 ring-sky-500/40' 
                          : 'bg-slate-950 border-slate-800/80'
                      }`}
                    >
                      <span className="text-slate-400 font-mono text-[10px] shrink-0 font-bold">{idx + 1}.</span>
                      <span className={`truncate flex-1 ${isCurrent ? 'text-sky-200 font-bold' : 'text-white'}`}>
                        {step.instruction}
                      </span>
                      <div 
                        className="w-5 h-5 rounded-full bg-white border border-red-600 flex items-center justify-center shrink-0 shadow-sm"
                        title={`Limitation de vitesse : ${stepLimit} km/h`}
                      >
                        <span className="text-slate-950 font-black text-[8px] leading-none">{stepLimit}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[9px] shrink-0">{step.distanceText}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OPTION 4: MINUTEUR CLIENT ABSENT 20 MINUTES */}
            <div className="p-3 rounded-2xl bg-[#070D18] border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-white text-[11px]">4. Minuteur Client Absent (20 min)</div>
                  <div className="text-[10px] text-slate-400">Compte à rebours de sécurité livraison</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-amber-400">
                  {formatTimerMinutesSeconds(absentTimerSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAbsentTimerRunning(!isAbsentTimerRunning)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer border transition-all ${
                    isAbsentTimerRunning
                      ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                      : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
                  }`}
                >
                  {isAbsentTimerRunning ? 'Pause' : 'Démarrer'}
                </button>
              </div>
            </div>

            {/* OPTION 5: OUTILS ROUTE, RECALCUL ET TESTS DU CHAUFFEUR */}
            <div className="p-3 rounded-2xl bg-[#070D18] border border-slate-800 space-y-2">
              <span className="font-black text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span>5. Actions et Diagnostics de Route</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerReroute(undefined, "Recalcul manuel")}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRerouting ? 'animate-spin' : ''}`} />
                  <span>Recalculer Route</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateDeviation}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Simuler Déviation</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerOverspeedTest}
                  className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Déclencher le dépassement de la vitesse maximale pour tester la sonnerie d'alarme"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Faire Sonner l'Alarme</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Tester Voix GPS</span>
                </button>
              </div>
            </div>

            {/* Back to Fullscreen Map button */}
            <button
              type="button"
              onClick={() => setShowOptionsDrawer(false)}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>{isEn ? 'Return to 100% Fullscreen Map' : '⬅ Revenir à la Carte Plein Écran (100% Visible)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1 : CODE ENLÈVEMENT VENDEUR (RAMASSAGE DU COLIS)                    */}
      {/* ========================================================================= */}
      {showPickupModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>{isEn ? 'Seller Pickup Code' : 'Code Enlèvement Vendeur'}</span>
              </div>
              <button 
                onClick={() => setShowPickupModal(false)}
                className="p-1 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">
                {isEn ? 'Handover Inspection & Pickup' : 'Contrôle & Réception du Colis'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEn 
                  ? `Ask the seller (${targetContactName}) for the 4-digit pickup code to confirm custody.`
                  : `Demandez au vendeur (${targetContactName}) le code secret à 4 chiffres pour valider la prise en charge.`
                }
              </p>
            </div>

            <form onSubmit={handleValidatePickup} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block text-center">
                  {isEn ? 'Seller 4-digit Code' : 'Code Vendeur (4 chiffres)'}
                </label>
                <input
                  id="driver-input-pickup-code"
                  type="text"
                  maxLength={4}
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center text-3xl font-mono tracking-widest font-black py-3 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                id="driver-btn-submit-pickup"
                type="submit"
                className="w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isEn ? 'Confirm Pickup & Start Delivery' : 'Valider la prise en charge'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2 : VALIDATION OTP ACHETEUR (CLÔTURE COURSE & PAIEMENT)             */}
      {/* ========================================================================= */}
      {showDeliveryModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>{isEn ? 'Buyer OTP Code' : 'Code OTP Acheteur'}</span>
              </div>
              <button 
                onClick={() => setShowDeliveryModal(false)}
                className="p-1 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">
                {isEn ? 'Final Handover & Payment Unlock' : 'Remise Conforme & Déblocage des Gains'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEn 
                  ? `Once the buyer has checked the parcel, request their 4-digit secret OTP.`
                  : `Après déballage contradictoire par l'acheteur, demandez-lui son code OTP secret à 4 chiffres.`
                }
              </p>
            </div>

            <form onSubmit={handleValidateDeliveryOTP} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block text-center">
                  {isEn ? 'Buyer Secret OTP' : 'Code Secret OTP Acheteur (4 chiffres)'}
                </label>
                <input
                  id="driver-input-delivery-otp"
                  type="text"
                  maxLength={4}
                  value={deliveryOtpInput}
                  onChange={(e) => setDeliveryOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center text-3xl font-mono tracking-widest font-black py-3 rounded-2xl bg-slate-900 border-2 border-slate-700 text-emerald-400 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <button
                id="driver-btn-submit-delivery-otp"
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isEn ? 'Validate OTP & Complete Mission' : 'Valider la course & Débloquer paiement'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3 : CHAT & VOCAL AVEC LE CLIENT / VENDEUR                           */}
      {/* ========================================================================= */}
      {showChatModal && (
        <DeliveryChatModal
          isOpen={showChatModal}
          jobId={job.id}
          partnerName={targetContactName}
          partnerPhone={targetContactPhone}
          partnerRole={isViewingPickup ? 'seller' : 'buyer'}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4 : NAVIGATION GPS GOOGLE MAPS & FEUILLE DE ROUTE LISIBLE          */}
      {/* ========================================================================= */}
      {showGmapsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0B111E] border border-blue-500/40 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>{isEn ? 'Google Maps GPS Navigation' : 'Navigation GPS Google Maps'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      {dynamicEtaMin} min
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isEn ? 'Turn-by-turn route • Clean high-contrast view' : 'Itinéraire virage par virage • Vue claire haute lisibilité'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGmapsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Origin & Destination */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-bold text-slate-400">{isEn ? 'Departure:' : 'Départ :'}</span>
                <span className="text-white font-medium truncate">{originCommuneName}, Abidjan</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="font-bold text-slate-400">{isEn ? 'Destination:' : 'Arrivée :'}</span>
                <span className="text-white font-medium truncate">{targetAddressText}, {targetCommuneName}</span>
              </div>
            </div>

            {/* Step by step Turn Directions (Ultra readable, large text) */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                {isEn ? 'Turn-by-Turn Maneuvers' : 'Manœuvres virage par virage'}
              </div>
              {activeRouteOption.steps.map((step, idx) => (
                <div 
                  key={step.id} 
                  className={`p-3 rounded-2xl border flex items-start gap-3 transition-all ${
                    idx === 0 
                      ? 'bg-blue-950/40 border-blue-500/50 text-white shadow-lg' 
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-black ${
                    idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-snug">{step.instruction}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                      <span className="text-emerald-400 font-bold">{step.distanceText}</span>
                      <span>•</span>
                      <span>{step.durationText}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenNativeGoogleMaps}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-98 text-center cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>{isEn ? 'Launch Turn-by-Turn GPS in Google Maps App' : 'Lancer le GPS Virage par Virage dans Google Maps'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={wazeDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenWaze}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isEn ? 'Open Waze' : 'Ouvrir Waze GPS'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    playGpsChime();
                    speakInstruction(nextStep.instruction, language);
                    addToast(isEn ? "Vocal Navigation" : "Guidage Vocal", nextStep.instruction, "info");
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isEn ? 'Announce Maneuver' : 'Écouter la manœuvre'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
