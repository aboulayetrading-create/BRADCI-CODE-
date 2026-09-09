import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import L from 'leaflet';
import { DeliveryJob, VehicleType } from '../types';
import { ALL_COMMUNES } from '../data/communes';
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
  // Expandable alternative routes picker (docked inside bottom sheet and floating on map)
  const [showRoutesPicker, setShowRoutesPicker] = useState(false);
  // Dedicated modal for clear, high-contrast Google Maps roadbook & deep linking
  const [showGmapsModal, setShowGmapsModal] = useState(false);

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

  // Generate curved realistic waypoints along Abidjan's road grid
  const generateRoutePoints = (
    start: { lat: number; lng: number },
    target: { lat: number; lng: number },
    variant: 'fastest' | 'shortest' | 'eco_bypassing'
  ): [number, number][] => {
    const steps = 28;
    const points: [number, number][] = [];
    const dLat = target.lat - start.lat;
    const dLng = target.lng - start.lng;
    const pLat = -dLng;
    const pLng = dLat;
    const curvature = variant === 'fastest' ? 0.22 : variant === 'eco_bypassing' ? -0.26 : 0.06;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const arc = Math.sin(t * Math.PI) * curvature;
      const microBend = Math.sin(t * Math.PI * 3) * 0.03 * curvature;
      const lat = start.lat + dLat * t + pLat * (arc + microBend);
      const lng = start.lng + dLng * t + pLng * (arc + microBend);
      points.push([lat, lng]);
    }
    return points;
  };

  // Live courier progression along route (Uber / Yango Pro live vehicle movement)
  const [simProgress, setSimProgress] = useState(0.12);
  const [isLiveMotionActive, setIsLiveMotionActive] = useState(true);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  // Active polyline waypoints
  const activeWaypoints = useMemo(() => {
    return generateRoutePoints(startCoords, targetCoords, selectedRouteId);
  }, [startCoords, targetCoords, selectedRouteId]);

  // Current interpolated courier coordinates and heading angle (bearing)
  const currentPositionData = useMemo(() => {
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
  }, [activeWaypoints, simProgress, startCoords]);

  // Speed override state for live testing and manual speed adjustments
  const [isSpeedOverridden, setIsSpeedOverridden] = useState<boolean>(false);
  const lastOverspeedAlertTimeRef = useRef<number>(0);
  const wasOverspeedRef = useRef<boolean>(false);
  const [overspeedAlertActive, setOverspeedAlertActive] = useState<boolean>(false);
  const [overspeedWarningCount, setOverspeedWarningCount] = useState<number>(0);

  // Dynamic remaining ETA & Distance
  const dynamicEtaMin = useMemo(() => {
    const remainingFraction = Math.max(0.04, 1 - simProgress);
    return Math.max(1, Math.round(activeRouteOption.totalDurationMin * remainingFraction));
  }, [simProgress, activeRouteOption.totalDurationMin]);

  const dynamicDistanceKm = useMemo(() => {
    const remainingFraction = Math.max(0.04, 1 - simProgress);
    return (activeRouteOption.totalDistanceKm * remainingFraction).toFixed(1);
  }, [simProgress, activeRouteOption.totalDistanceKm]);

  // Current active maneuver step along the selected Abidjan route option
  const currentStepIndex = useMemo(() => {
    const stepsCount = activeRouteOption.steps.length;
    if (stepsCount <= 1) return 0;
    const rawIdx = Math.floor(simProgress * stepsCount);
    return Math.min(stepsCount - 1, Math.max(0, rawIdx));
  }, [simProgress, activeRouteOption.steps.length]);

  // Next Maneuver Step
  const nextStep: RouteStep = activeRouteOption.steps[currentStepIndex] || activeRouteOption.steps[0] || {
    id: 'step-0',
    instruction: isEn ? `Join the main road towards ${targetCommuneName}.` : `Rejoignez l'artère principale vers ${targetCommuneName}.`,
    distanceText: '200 m',
    distanceMeters: 200,
    durationText: '1 min',
    icon: 'straight',
    streetName: `Avenue vers ${targetCommuneName}`,
    speedLimitKmh: 50,
    roadType: 'avenue'
  };

  // Vitesse maximale autorisée pour la voie actuelle (détectée sur l'artère ou étape)
  const currentRoadSpeedLimit = useMemo(() => {
    return nextStep.speedLimitKmh || getSpeedLimitForRoad(nextStep.streetName, 50);
  }, [nextStep]);

  // Excès de vitesse détecté
  const isOverspeed = speedKmh > currentRoadSpeedLimit;
  const overspeedDelta = Math.max(0, speedKmh - currentRoadSpeedLimit);

  // Live driver motion timer (animates courier smoothly along Abidjan streets)
  useEffect(() => {
    if (!isLiveMotionActive) return;
    const timer = setInterval(() => {
      setSimProgress(prev => {
        const next = prev + 0.009;
        if (next >= 0.98) {
          return 0.05; // Loop back for continuous navigation
        }
        return next;
      });

      // Fluctuation naturelle de vitesse si non forcée par l'utilisateur
      if (!isSpeedOverridden) {
        setSpeedKmh(prev => {
          const delta = Math.floor(Math.random() * 5) - 2;
          const target = Math.max(25, currentRoadSpeedLimit - 4);
          return Math.max(20, Math.min(currentRoadSpeedLimit + 3, (prev || target) + delta));
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLiveMotionActive, isSpeedOverridden, currentRoadSpeedLimit]);

  // Dynamic distance countdown to next maneuver
  const dynamicDistanceToNextTurn = useMemo(() => {
    const cycle = (simProgress * 8) % 1;
    const meters = Math.max(30, Math.round((1 - cycle) * 420));
    return `Dans ${meters} m`;
  }, [simProgress]);

  // =========================================================================
  // FONCTIONNALITÉ SÉCURITÉ ROUTIÈRE : ALERTE VOCALE FORCÉE SI EXCÈS DE VITESSE
  // RÈGLE : Se déclenche impérativement MÊME SI LE LIVREUR COUPE LE GUIDAGE VOCAL
  // =========================================================================
  useEffect(() => {
    if (isOverspeed) {
      setOverspeedAlertActive(true);
      const now = Date.now();
      // Fréquence d'alerte vocale : espacée de 7.5 secondes pour éviter le télescopage audio
      if (now - lastOverspeedAlertTimeRef.current > 7500) {
        lastOverspeedAlertTimeRef.current = now;
        wasOverspeedRef.current = true;
        setOverspeedWarningCount(c => c + 1);

        // Appel de la méthode d'alerte vocale d'urgence (BYPASSE isVoiceMuted !)
        announceOverspeedAlert(
          speedKmh,
          currentRoadSpeedLimit,
          nextStep.streetName,
          isEn ? 'en' : 'fr'
        );

        addToast(
          isEn ? "⚠️ Speed Limit Alert!" : "⚠️ Alerte Excès de Vitesse !",
          isEn
            ? `Speed: ${speedKmh} km/h (Limit: ${currentRoadSpeedLimit} km/h). Audible alert active even when muted.`
            : `Vitesse : ${speedKmh} km/h (Limite : ${currentRoadSpeedLimit} km/h). Alerte sonore & vocale forcée pour votre sécurité.`,
          "error"
        );
      }
    } else {
      if (wasOverspeedRef.current) {
        wasOverspeedRef.current = false;
        setOverspeedAlertActive(false);
      }
    }
  }, [speedKmh, currentRoadSpeedLimit, isOverspeed, nextStep.streetName, isEn]);

  // Action rapide : Simuler un excès de vitesse pour tester immédiatement l'alerte sonore et vocale
  const handleTriggerOverspeedTest = () => {
    setIsSpeedOverridden(true);
    const testOverspeed = currentRoadSpeedLimit + 22; // ex: 72 km/h sur voie 50, ou 102 sur voie 80
    setSpeedKmh(testOverspeed);
    lastOverspeedAlertTimeRef.current = Date.now();

    // Déclencher vocalement immédiatement
    announceOverspeedAlert(
      testOverspeed,
      currentRoadSpeedLimit,
      nextStep.streetName,
      isEn ? 'en' : 'fr'
    );

    addToast(
      isEn ? "Overspeed Voice Alert Tested" : "Test Alerte Vocale Vitesse Déclenché",
      isEn
        ? `Speed set to ${testOverspeed} km/h (Limit ${currentRoadSpeedLimit} km/h). Voice alert sounds even if guidance is muted!`
        : `Vitesse fixée à ${testOverspeed} km/h (Limite ${currentRoadSpeedLimit} km/h). L'alerte vocale sonne même si le guidage vocal est coupé !`,
      "warning"
    );
  };

  // Action rapide : Ralentir à la vitesse autorisée
  const handleSlowDownToLegalSpeed = () => {
    setIsSpeedOverridden(true);
    const safeSpeed = Math.max(20, currentRoadSpeedLimit - 8);
    setSpeedKmh(safeSpeed);
    setOverspeedAlertActive(false);
    addToast(
      isEn ? "Speed Regulated" : "Vitesse Régulée",
      isEn
        ? `Slowed down to ${safeSpeed} km/h (within ${currentRoadSpeedLimit} km/h limit).`
        : `Ralentissement à ${safeSpeed} km/h (vitesse sous la limite de ${currentRoadSpeedLimit} km/h).`,
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
        maxNativeZoom: mapEngineMode === 'dark' ? 16 : 19
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      const routeGroup = L.layerGroup().addTo(map);
      routeGroupRef.current = routeGroup;

      // Handle user manual pan/drag to decouple follow mode gracefully
      map.on('dragstart', () => {
        setIsFollowMode(false);
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
      maxNativeZoom: mapEngineMode === 'dark' ? 16 : 19
    }).addTo(map);
    tileLayerRef.current = newTile;
  }, [mapEngineMode]);

  // Redraw Route and Target Marker whenever route, coordinates, or leg changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeGroupRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    // 1. Calculate realistic waypoint curves
    const midLat = (startCoords.lat + targetCoords.lat) / 2;
    const midLng = (startCoords.lng + targetCoords.lng) / 2;

    const offsetFastest = 0.012;
    const offsetEco = -0.015;

    const waypointsFastest: [number, number][] = [
      [startCoords.lat, startCoords.lng],
      [midLat + offsetFastest, midLng - offsetFastest],
      [targetCoords.lat, targetCoords.lng]
    ];

    const waypointsShortest: [number, number][] = [
      [startCoords.lat, startCoords.lng],
      [midLat, midLng],
      [targetCoords.lat, targetCoords.lng]
    ];

    const waypointsEco: [number, number][] = [
      [startCoords.lat, startCoords.lng],
      [midLat + offsetEco, midLng + offsetEco],
      [targetCoords.lat, targetCoords.lng]
    ];

    // Alternative inactive routes (dashed subtle lines)
    if (selectedRouteId !== 'fastest') {
      const line1 = L.polyline(waypointsFastest, {
        color: '#64748B',
        weight: 3.5,
        opacity: 0.6,
        dashArray: '6, 6'
      });
      line1.on('click', () => handleSelectRouteOption('fastest'));
      routeGroup.addLayer(line1);
    }

    if (selectedRouteId !== 'shortest') {
      const line2 = L.polyline(waypointsShortest, {
        color: '#64748B',
        weight: 3.5,
        opacity: 0.6,
        dashArray: '6, 6'
      });
      line2.on('click', () => handleSelectRouteOption('shortest'));
      routeGroup.addLayer(line2);
    }

    if (selectedRouteId !== 'eco_bypassing') {
      const line3 = L.polyline(waypointsEco, {
        color: '#64748B',
        weight: 3.5,
        opacity: 0.6,
        dashArray: '6, 6'
      });
      line3.on('click', () => handleSelectRouteOption('eco_bypassing'));
      routeGroup.addLayer(line3);
    }

    // Active Chosen Route (Thick glowing colored line)
    const activeRouteLinePoints = selectedRouteId === 'fastest'
      ? waypointsFastest
      : selectedRouteId === 'shortest'
      ? waypointsShortest
      : waypointsEco;

    const activeLine = L.polyline(activeRouteLinePoints, {
      color: isViewingPickup ? '#F59E0B' : '#10B981',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });
    routeGroup.addLayer(activeLine);

    // Dynamic dash overlay for direction flow
    const activeDashes = L.polyline(activeRouteLinePoints, {
      color: '#FFFFFF',
      weight: 2,
      opacity: 0.85,
      dashArray: '4, 12'
    });
    routeGroup.addLayer(activeDashes);

    // 2. Driver Live Marker (Moving Vehicle Navigation Puck - Uber / Yango Pro Style)
    const driverIconHtml = `
      <div class="relative flex items-center justify-center cursor-pointer pointer-events-auto">
        <!-- Pulsing radar wave -->
        <div class="absolute -inset-3.5 rounded-full ${isViewingPickup ? 'bg-amber-400/30' : 'bg-emerald-400/30'} animate-ping"></div>
        
        <!-- Rotating Navigation Puck with Direction Arrow -->
        <div class="driver-heading-puck w-11 h-11 rounded-full flex items-center justify-center shadow-2xl border-2 border-white transition-transform duration-300 ease-out ${
          isViewingPickup ? 'bg-amber-500 text-slate-950 shadow-amber-500/60' : 'bg-emerald-500 text-slate-950 shadow-emerald-500/60'
        }" style="transform: rotate(${currentPositionData.bearing}deg);">
          <svg class="w-6 h-6 fill-current drop-shadow" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
        </div>

        <!-- Real-time Speed & Driver Pill with Road Speed Limit -->
        <div class="driver-speed-badge absolute -bottom-5 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black shadow-xl tracking-wider flex items-center gap-1 transition-all ${
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
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      }),
      zIndexOffset: 1000
    });
    driverMarkerRef.current = driverMarker;
    routeGroup.addLayer(driverMarker);

    // 3. Target Marker (Seller or Buyer)
    const targetIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="p-2 rounded-2xl flex items-center gap-1.5 shadow-2xl border-2 text-slate-950 font-black ${
          isViewingPickup ? 'bg-amber-500 border-amber-300 shadow-amber-500/50' : 'bg-emerald-500 border-emerald-300 shadow-emerald-500/50'
        }">
          <span class="text-sm">${isViewingPickup ? '📦' : '🏁'}</span>
          <div class="text-left leading-none pr-1">
            <span class="text-[8px] uppercase tracking-wider block opacity-90">
              ${isViewingPickup ? (isEn ? 'Pickup' : 'Point Retrait') : (isEn ? 'Delivery' : 'Livraison')}
            </span>
            <span class="text-[11px] whitespace-nowrap">
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
        iconSize: [110, 40],
        iconAnchor: [55, 20]
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
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      } catch {
        // Fallback
      }
    }

  }, [startCoords, targetCoords, selectedRouteId, activeLeg, isViewingPickup, targetCommuneName, isEn]);

  // Dedicated smooth update for driver marker position & camera tracking (Uber / Yango Pro)
  useEffect(() => {
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([currentPositionData.lat, currentPositionData.lng]);
      const el = driverMarkerRef.current.getElement();
      if (el) {
        const puck = el.querySelector('.driver-heading-puck') as HTMLElement;
        if (puck) {
          puck.style.transform = `rotate(${currentPositionData.bearing}deg)`;
        }
        const speedVal = el.querySelector('.driver-speed-val') as HTMLElement;
        if (speedVal) {
          speedVal.textContent = `${speedKmh} KM/H`;
        }
        const badge = el.querySelector('.driver-speed-badge') as HTMLElement;
        if (badge) {
          if (speedKmh > currentRoadSpeedLimit) {
            badge.className = 'driver-speed-badge absolute -bottom-5 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black shadow-xl tracking-wider flex items-center gap-1 transition-all bg-red-600 text-white border border-red-300 ring-2 ring-red-500/80 animate-bounce';
          } else {
            badge.className = 'driver-speed-badge absolute -bottom-5 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black shadow-xl tracking-wider flex items-center gap-1 transition-all bg-[#0B111E]/95 text-white border border-slate-700';
          }
        }
      }
    }

    // Auto-follow camera if enabled
    if (isFollowMode && mapInstanceRef.current && isLiveMotionActive) {
      mapInstanceRef.current.panTo([currentPositionData.lat, currentPositionData.lng], {
        animate: true,
        duration: 0.9
      });
    }
  }, [currentPositionData, speedKmh, currentRoadSpeedLimit, isFollowMode, isLiveMotionActive]);

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

  // Recenter GPS
  const handleRecenter = () => {
    setIsFollowMode(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentPositionData.lat, currentPositionData.lng], 15, {
        duration: 0.8
      });
      playGpsChime();
      addToast(
        isEn ? "GPS Follow Active" : "Suivi GPS Yango Actif",
        `${targetCommuneName} • ${speedKmh} km/h`,
        "info"
      );
    }
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
      className="relative w-full h-[88vh] sm:h-[92vh] min-h-[640px] rounded-3xl overflow-hidden bg-[#040814] border border-slate-800 shadow-2xl flex flex-col justify-between select-none"
    >
      {/* ========================================================================= */}
      {/* 1. MOTEUR CARTOGRAPHIQUE GPS VTC PRO (LEAFLET RÉEL SANS FILIGRANE)        */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#040814]">
        {/* Moteur Cartographique Interactif Réel (Leaflet Streets, Satellite ou Dark) */}
        <div 
          ref={mapContainerRef}
          id="leaflet-mission-map-canvas"
          className="w-full h-full absolute inset-0 bg-[#040814]"
        />

        {/* Floating Alternative Routes & GPS Picker Panel */}
        {showRoutesPicker && (
          <div className="absolute top-20 left-3 sm:left-4 right-16 sm:right-20 z-30 p-3 sm:p-4 rounded-3xl bg-[#0B111E]/95 backdrop-blur-md border border-slate-700 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <Route className="w-4 h-4 text-sky-400" />
                <span>{isEn ? 'Course Route Options & GPS' : 'Options de Course & GPS'}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowRoutesPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Alternative Routes */}
            <div className="grid grid-cols-3 gap-1.5">
              {routesBundle.options.map((opt) => {
                const isSelected = selectedRouteId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectRouteOption(opt.id)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg' 
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {opt.id === 'fastest' ? (isEn ? 'Fastest' : 'Voie Rapide') : opt.id === 'shortest' ? (isEn ? 'Direct' : 'Axe Direct') : (isEn ? 'Bypass' : 'Contourne')}
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="font-mono font-bold text-white text-xs mt-0.5">
                      {opt.totalDurationMin} min • {opt.totalDistanceKm} km
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Direct Google Maps GPS Action in Route Options */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <a
                id="driver-btn-routes-picker-google-maps"
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenNativeGoogleMaps}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
              >
                <Compass className="w-4 h-4 text-white" />
                <span>{isEn ? 'Launch Google Maps GPS' : 'Lancer Google Maps GPS'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setShowRoutesPicker(false);
                  setShowGmapsModal(true);
                }}
                className="py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{isEn ? 'Roadbook' : 'Feuille'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Controls on Map */}
        <div className="absolute top-20 right-3 sm:right-4 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* Toggle Map Mode (Streets, Satellite, Dark) */}
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
            className="p-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title={isEn ? "Cycle Map Mode (Streets, Satellite, Dark)" : "Changer le style de carte (Rues, Satellite, Nuit)"}
          >
            <Layers className="w-4 h-4 text-sky-400" />
          </button>

          {/* Recenter GPS */}
          <button
            id="driver-btn-recenter-gps"
            type="button"
            onClick={handleRecenter}
            className="p-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title={isEn ? "Recenter GPS" : "Recentrer le GPS"}
          >
            <Locate className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Launch Native Google Maps App */}
          <a
            id="driver-btn-launch-google-maps"
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenNativeGoogleMaps}
            className="p-2.5 rounded-2xl bg-slate-900/95 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 text-white shadow-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer group"
            title={isEn ? "Launch Google Maps Turn-by-Turn GPS" : "Lancer Google Maps GPS Pro (Virage par virage)"}
          >
            <Compass className="w-4 h-4 text-amber-400 group-hover:text-white" />
          </a>

          {/* Launch Waze */}
          <a
            id="driver-btn-launch-waze"
            href={wazeDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenWaze}
            className="p-2.5 rounded-2xl bg-slate-900/95 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-400 text-white shadow-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer group"
            title="Waze GPS"
          >
            <Navigation className="w-4 h-4 text-cyan-400 group-hover:text-white" />
          </a>

          {/* Toggle Route Options */}
          <button
            id="driver-btn-toggle-routes"
            type="button"
            onClick={() => setShowRoutesPicker(prev => !prev)}
            className={`p-2.5 rounded-2xl border text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
              showRoutesPicker ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-sky-500/40' : 'bg-slate-900/95 hover:bg-slate-800 border-slate-700 text-sky-400'
            }`}
            title={isEn ? "Course Route Options & Google Maps GPS" : "Options de Course & GPS Google Maps"}
          >
            <Route className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Speedometer, Speed Limit Road Sign & Acoustic Radar Safety Widget */}
        <div 
          id="driver-speedometer-floating-card"
          className="absolute bottom-4 left-3 z-20 pointer-events-auto flex flex-col gap-1.5"
        >
          {/* Main Telemetry & Speed Card */}
          <div className={`p-2 sm:p-2.5 rounded-2xl backdrop-blur-md border shadow-2xl transition-all duration-300 flex items-center gap-2.5 ${
            isOverspeed 
              ? 'bg-red-950/95 border-red-500 shadow-red-600/50 ring-2 ring-red-500 animate-pulse text-white' 
              : 'bg-[#0B111E]/95 border-slate-800 text-white'
          }`}>
            {/* Panneau Routier Officiel de Vitesse Maximale Autorisée (Disque Blanc à Bordure Rouge) */}
            <div 
              className={`w-11 h-11 rounded-full bg-white border-[3.5px] border-red-600 flex flex-col items-center justify-center shadow-lg shrink-0 ${
                isOverspeed ? 'ring-2 ring-red-400 animate-bounce' : ''
              }`}
              title={`Vitesse autorisée sur cet axe : ${currentRoadSpeedLimit} km/h`}
            >
              <span className="text-slate-950 font-black text-sm sm:text-base tracking-tighter leading-none">{currentRoadSpeedLimit}</span>
              <span className="text-[7px] font-black text-slate-600 uppercase leading-none">km/h</span>
            </div>

            {/* Vitesse Actuelle du Livreur */}
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-mono font-black tracking-tight leading-none">
                  {speedKmh}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400">KM/H</span>
              </div>

              {/* État de conformité de vitesse */}
              <div className="flex items-center gap-1 mt-0.5">
                {isOverspeed ? (
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-wider flex items-center gap-0.5">
                    <AlertOctagon className="w-3 h-3 text-red-400 shrink-0" />
                    <span>+{overspeedDelta} EXCÈS</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>CONFORME</span>
                  </span>
                )}
              </div>
            </div>

            {/* Boutons d'ajustement rapide de vitesse (+/-) */}
            <div className="flex flex-col gap-1 shrink-0 pl-1 border-l border-slate-700/60">
              <button
                type="button"
                onClick={() => handleAdjustSpeed(5)}
                className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-black cursor-pointer active:scale-95"
                title="Accélérer +5 km/h"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSpeed(-5)}
                className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-black cursor-pointer active:scale-95"
                title="Ralentir -5 km/h"
              >
                -
              </button>
            </div>
          </div>

          {/* Barre de Déclenchement / Test de l'Alerte Vocale Forcée */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              id="driver-btn-test-overspeed-alarm"
              onClick={handleTriggerOverspeedTest}
              className="px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-md shadow-md cursor-pointer transition-all active:scale-95"
              title="Tester l'alerte vocale en simulant un excès de vitesse (bypasse le mode silencieux)"
            >
              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Tester Alerte (Forcée)</span>
            </button>

            {isOverspeed && (
              <button
                type="button"
                onClick={handleSlowDownToLegalSpeed}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md cursor-pointer transition-all active:scale-95"
                title="Revenir sous la vitesse autorisée"
              >
                Ralentir
              </button>
            )}
          </div>
        </div>

        {/* Re-center / Resume Follow Button (like Uber / Yango Pro when user pans map) */}
        {!isFollowMode && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
            <button
              id="driver-btn-resume-follow"
              type="button"
              onClick={handleRecenter}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-full shadow-2xl flex items-center gap-2 border-2 border-white transition-transform active:scale-95 cursor-pointer shadow-emerald-500/40"
            >
              <Locate className="w-4 h-4 animate-spin text-slate-950" style={{ animationDuration: '4s' }} />
              <span>{isEn ? 'Recenter & Follow Courier' : 'Recentrer & Suivre le livreur'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP FLOATING HUD : VTC YANGO / UBER PRO GUIDANCE                       */}
      {/* ========================================================================= */}
      <div className="relative z-20 m-2 sm:m-3 space-y-1.5 pointer-events-auto">
        <div 
          id="driver-vtc-top-guidance-bar"
          className="p-2 sm:p-2.5 rounded-2xl bg-[#0B111E]/95 backdrop-blur-md border border-slate-800/90 shadow-2xl flex items-center justify-between gap-2"
        >
          {/* Turn Maneuver & Direction */}
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
              isViewingPickup ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
            }`}>
              <CornerUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
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
                  <span>{isViewingPickup ? '📦 1. Retrait' : '🏁 2. Livraison'}</span>
                  <span className="text-slate-400 font-normal">({targetCommuneName})</span>
                </button>
              </div>

              <p className="text-xs font-extrabold text-white truncate mt-0.5">
                {nextStep.instruction}
              </p>
            </div>
          </div>

          {/* Quick HUD Action Tools */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Live Movement Simulation Toggle (Play / Pause with live blinking dot) */}
            <button
              id="driver-btn-toggle-motion"
              type="button"
              onClick={() => {
                setIsLiveMotionActive(prev => !prev);
                addToast(
                  !isLiveMotionActive 
                    ? (isEn ? "Live Motion Resumed" : "Simulation Course Active")
                    : (isEn ? "Motion Paused" : "Course en Pause"),
                  !isLiveMotionActive
                    ? (isEn ? "Courier moving on map." : "Le livreur se déplace en direct sur la carte.")
                    : (isEn ? "Courier stopped." : "Mouvement du coursier suspendu."),
                  "info"
                );
              }}
              className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all cursor-pointer shadow-md ${
                isLiveMotionActive
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isLiveMotionActive ? "Mettre en pause le déplacement" : "Activer le déplacement en direct"}
            >
              {isLiveMotionActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Pause className="w-3.5 h-3.5" />
                </>
              ) : (
                <Play className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Recenter GPS */}
            <button
              id="driver-btn-recenter-top"
              type="button"
              onClick={handleRecenter}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 transition-all cursor-pointer"
              title={isEn ? "Center map on courier" : "Centrer la carte sur le coursier"}
            >
              <Locate className="w-3.5 h-3.5" />
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

            {/* Repeat Voice */}
            <button
              id="driver-btn-repeat-voice"
              type="button"
              onClick={handleRepeatVoice}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 transition-all cursor-pointer"
              title={isEn ? "Repeat voice instruction" : "Répéter la voix"}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Speaking HUD Wave */}
        {isVoiceSpeaking && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 backdrop-blur-md shadow-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-bold truncate text-[11px]">
                {currentSpokenText || nextStep.instruction}
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold bg-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-200 shrink-0">
              VOIX OFF
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ALERTE EXCÈS DE VITESSE SÉCURITÉ (FORCÉE MÊME SI GUIDAGE COUPÉ)          */}
        {/* ========================================================================= */}
        {isOverspeed && (
          <div 
            id="driver-overspeed-alarm-banner"
            className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-2xl border-2 border-red-300 ring-4 ring-red-500/50 flex items-center justify-between gap-2.5 animate-pulse"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Panneau Routier Officiel de Vitesse Maximale Autorisée */}
              <div className="w-10 h-10 rounded-full bg-white border-[3.5px] border-red-600 flex items-center justify-center shadow-lg shrink-0">
                <span className="text-slate-950 font-black text-sm tracking-tighter leading-none">{currentRoadSpeedLimit}</span>
              </div>

              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-300 animate-bounce" />
                    <span>ALERTE SÉCURITÉ VITESSE</span>
                  </span>
                  <span className="text-[10px] text-white/90 font-medium">
                    (Signal vocal & alarme forcés même si silencieux)
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">
                  Vitesse excessive : {speedKmh} km/h • Limite {currentRoadSpeedLimit} km/h • Ralentissez !
                </p>
              </div>
            </div>

            {/* Quick Slowdown Button */}
            <button
              type="button"
              onClick={handleSlowDownToLegalSpeed}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-red-700 font-black text-xs rounded-xl shadow-lg shrink-0 active:scale-95 transition-all cursor-pointer"
            >
              Ralentir
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. FICHE DE COURSE BASSE VTC PRO (BOTTOM SHEET YANGO / UBER STYLE)        */}
      {/* ========================================================================= */}
      <div 
        id="driver-vtc-bottom-sheet"
        className="relative z-20 m-2 sm:m-3 p-3 rounded-3xl bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 shadow-2xl space-y-2 transition-all duration-300"
      >
        {/* COMPACT TOP SUMMARY ROW */}
        <div className="flex items-center justify-between gap-2">
          {/* Target and Corridor */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                {isViewingPickup ? (isEn ? 'Pickup' : 'Retrait') : (isEn ? 'Delivery' : 'Livraison')}
              </span>
              <span className="text-xs font-black text-white truncate">
                {targetContactName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {targetAddressText}
            </p>
          </div>

          {/* Dynamic ETA, Distance & Fee */}
          <div className="text-right shrink-0 flex items-center gap-2">
            <div>
              <div className="flex items-center justify-end gap-1 font-mono">
                <span className="text-xs sm:text-sm font-black text-emerald-400">
                  {dynamicEtaMin} min
                </span>
                <span className="text-[10px] text-slate-400">
                  ({dynamicDistanceKm} km)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                +{job.deliveryFee.toLocaleString('fr-FR')} F
              </span>
            </div>

            {/* Toggle Full Details Drawer Button */}
            <button
              type="button"
              id="driver-btn-toggle-drawer"
              onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
              className={`p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isBottomSheetExpanded
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-sky-400'
              }`}
              title={isBottomSheetExpanded ? "Replier la fiche" : "Déplier tous les détails"}
            >
              {isBottomSheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* EXPANDABLE SECTION (When user taps "Détails" or chevron) */}
        {isBottomSheetExpanded && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5 animate-in fade-in duration-200">
            {/* Mission Category & Corridor */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400">{courseTypeBadge}</span>
              <span className="font-mono text-slate-300">{job.pickupCommune} ➔ {job.dropoffCommune}</span>
            </div>

            {/* 3 Alternative Route Choices */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <Route className="w-3.5 h-3.5 text-sky-400" />
                  {isEn ? 'Alternative Routes:' : 'Itinéraires alternatifs :'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowRoadbook(!showRoadbook)}
                  className="text-sky-400 hover:text-sky-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{showRoadbook ? (isEn ? 'Hide Roadbook' : 'Masquer Roadbook') : (isEn ? 'View Roadbook' : 'Voir Roadbook')}</span>
                  {showRoadbook ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {routesBundle.options.map((opt) => {
                  const isSelected = selectedRouteId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectRouteOption(opt.id)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg' 
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {opt.id === 'fastest' ? (isEn ? 'Fastest' : 'Voie Rapide') : opt.id === 'shortest' ? (isEn ? 'Direct' : 'Axe Direct') : (isEn ? 'Bypass' : 'Contourne')}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="font-mono font-bold text-white text-xs mt-0.5">
                        {opt.totalDurationMin} min • {opt.totalDistanceKm} km
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Roadbook steps avec limitations de vitesse */}
              {showRoadbook && (
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 pt-1">
                  {activeRouteOption.steps.map((step, idx) => {
                    const stepLimit = step.speedLimitKmh || getSpeedLimitForRoad(step.streetName, 50);
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div 
                        key={step.id} 
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 transition-all ${
                          isCurrent 
                            ? 'bg-sky-950/70 border-sky-500/50 ring-1 ring-sky-500/40' 
                            : 'bg-slate-950 border-slate-800/80'
                        }`}
                      >
                        <span className="text-slate-400 font-mono text-[9px] shrink-0">{idx + 1}.</span>
                        <span className={`truncate flex-1 ${isCurrent ? 'text-sky-200 font-bold' : 'text-white'}`}>
                          {step.instruction}
                        </span>
                        {/* Badge de vitesse limite de l'artère */}
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
              )}
            </div>

            {/* GPS Google Maps & Navigation Externe Pro (Course Options) */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 text-blue-400 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>{isEn ? 'Google Maps GPS Navigation' : 'GPS Google Maps & Navigation Pro'}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">{originCommuneName} ➔ {targetCommuneName}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">{dynamicEtaMin} min • {dynamicDistanceKm} km</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  id="driver-btn-bottomsheet-gmaps"
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenNativeGoogleMaps}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Open Google Maps' : 'Lancer Google Maps'}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                </a>

                <button
                  type="button"
                  id="driver-btn-bottomsheet-roadbook"
                  onClick={() => setShowGmapsModal(true)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-center"
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'View Roadbook' : 'Feuille de Route'}</span>
                </button>
              </div>
            </div>

            {/* Buyer Absent 20-min countdown timer */}
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEn ? 'Buyer Absent Timer:' : 'Minuteur Client Absent (20 min) :'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-400">
                  {formatTimerMinutesSeconds(absentTimerSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAbsentTimerRunning(!isAbsentTimerRunning)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                    isAbsentTimerRunning
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isAbsentTimerRunning ? (isEn ? 'Pause' : 'Pause') : (isEn ? 'Start' : 'Démarrer')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRIMARY ACTION BUTTON + DIRECT CONTACT TOOLS */}
        <div className="flex items-center gap-2 pt-0.5">
          {/* Main Action Button (BRAD'CI Signature Orange #F97316) */}
          {isActualPickupPhase ? (
            <button
              id="driver-btn-arrived-pickup"
              onClick={() => setShowPickupModal(true)}
              className="flex-1 py-2.5 px-3.5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#F97316]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <MapPin className="w-4 h-4 text-white shrink-0" />
              <span>{isEn ? 'Arrived at Pickup (Seller Code)' : 'Arrivé au Retrait (Code Vendeur)'}</span>
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
              className="flex-1 py-2.5 px-3.5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#F97316]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <MapPin className="w-4 h-4 text-white shrink-0" />
              <span>{isEn ? 'I have arrived at buyer location' : 'Je suis arrivé chez le client'}</span>
            </button>
          ) : (
            <button
              id="driver-btn-validate-otp"
              onClick={() => setShowDeliveryModal(true)}
              className="flex-1 py-2.5 px-3.5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#F97316]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span>{isEn ? 'Validate OTP & Complete Delivery' : 'Valider OTP & Clôturer'}</span>
            </button>
          )}

          {/* Quick Voice Note & Chat */}
          <button
            id="driver-btn-chat-client"
            type="button"
            onClick={() => setShowChatModal(true)}
            className="w-10 h-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            title={isEn ? `Send message to ${targetContactName}` : `Envoyer une Note Vocale ou un message à ${targetContactName}`}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Quick Direct Call */}
          <a
            id="driver-btn-call-client"
            href={`tel:${targetContactPhone}`}
            className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            title={isEn ? `Call ${targetContactName}` : `Appeler ${targetContactName} (${targetContactPhone})`}
          >
            <Phone className="w-4 h-4 fill-current" />
          </a>
        </div>
      </div>

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
