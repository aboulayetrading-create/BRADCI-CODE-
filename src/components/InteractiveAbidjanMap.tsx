import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  Navigation, 
  Volume2, 
  VolumeX, 
  Search, 
  Gavel, 
  Store, 
  Bike, 
  Compass, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  X, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radio,
  Locate,
  Car,
  Truck,
  Package,
  Boxes,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';
import { ALL_COMMUNES, ZoneCommune } from '../data/communes';
import { voiceNavigator } from '../utils/voiceNavigator';
import { Product, GPSLocation, VehicleType } from '../types';
import { nativeBridge } from '../utils/nativeBridge';

interface InteractiveAbidjanMapProps {
  onSelectProduct?: (prod: Product) => void;
  onClose?: () => void;
  className?: string;
}

// Abidjan Default Geographic Center
const ABIDJAN_CENTER: google.maps.LatLngLiteral = { 
  lat: 5.3599517, 
  lng: -4.0082563 
};

// High-Contrast Dark Navigation Map Styles (inspired by inDrive / Google Maps Night Navigation in Abidjan)
const NIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#162322" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#162322" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c5dad5" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f1fbf8" }, { weight: 2 }]
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#253b37" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a2c29" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#d19f39" }] // Warm expressways matching screenshot
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#8a661f" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#213632" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#175d7a" }] // Lagoon blue matching screenshot
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5bb2d6" }]
  }
];

// Map Controller for smooth pan/zoom
const MapController: React.FC<{
  targetCenter: google.maps.LatLngLiteral | null;
  targetZoom?: number;
}> = React.memo(({ targetCenter, targetZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCenter) return;
    map.panTo(targetCenter);
    if (targetZoom) {
      map.setZoom(targetZoom);
    }
  }, [map, targetCenter, targetZoom]);

  return null;
});
MapController.displayName = 'MapController';

// 1. Memoized Product Marker Component
interface ProductMarkerProps {
  product: Product;
  onClick: (prod: Product, marker: google.maps.marker.AdvancedMarkerElement | null) => void;
  isSelected: boolean;
}

const ProductMarker: React.FC<ProductMarkerProps> = React.memo(({ product, onClick, isSelected }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  // Determine coords from product pickup or commune fallback
  const coords: google.maps.LatLngLiteral = useMemo(() => {
    if (product.pickupCoords && product.pickupCoords.lat && product.pickupCoords.lng) {
      return product.pickupCoords;
    }
    const zone = ALL_COMMUNES.find(c => 
      c.name.toLowerCase().includes(product.commune.toLowerCase()) ||
      product.commune.toLowerCase().includes(c.name.toLowerCase())
    ) || ALL_COMMUNES[0];
    
    // Add micro-offset to prevent overlapping markers in same commune
    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latOffset = ((seed % 10) - 5) * 0.0025;
    const lngOffset = (((seed >> 2) % 10) - 5) * 0.0025;

    return {
      lat: zone.coords.lat + latOffset,
      lng: zone.coords.lng + lngOffset
    };
  }, [product]);

  const isB2B = product.isB2BLot || product.category === 'Déstockage B2B';
  const isShop = product.listingType === 'shop' || !!product.shopId;

  const handleClick = useCallback(() => {
    onClick(product, marker);
  }, [product, marker, onClick]);

  return (
    <AdvancedMarker
      ref={markerRef}
      position={coords}
      onClick={handleClick}
      title={product.title}
      zIndex={isSelected ? 100 : isB2B ? 50 : 20}
    >
      <div 
        className={`group relative flex items-center cursor-pointer transition-all duration-300 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110'
        }`}
      >
        {isB2B ? (
          /* B2B Liquidation Lot Pin */
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-slate-950 font-black text-[11px] shadow-xl border-2 border-white shadow-amber-500/30">
            <Boxes className="w-3.5 h-3.5 text-slate-950" />
            <span className="font-mono-num whitespace-nowrap">
              {product.b2bTotalUnitsCount ? `${product.b2bTotalUnitsCount} pcs` : 'LOT B2B'}
            </span>
            <span className="bg-slate-950 text-amber-300 text-[9px] px-1 rounded font-bold ml-0.5">
              {product.b2bSaleKind === 'liquidation' ? 'LIQUIDATION' : 'DÉSTOCKAGE'}
            </span>
          </div>
        ) : isShop ? (
          /* Official Store Pin */
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[11px] shadow-lg border-2 border-white shadow-emerald-600/30">
            <Store className="w-3.5 h-3.5 text-emerald-200" />
            <span className="font-mono-num whitespace-nowrap">
              {product.currentPrice.toLocaleString('fr-FR')} F
            </span>
          </div>
        ) : (
          /* Express Auction Pin */
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-600 text-white font-bold text-[11px] shadow-lg border-2 border-white shadow-blue-600/30">
            <Gavel className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-mono-num whitespace-nowrap">
              {product.currentPrice.toLocaleString('fr-FR')} F
            </span>
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
});
ProductMarker.displayName = 'ProductMarker';

// 2. Memoized Live Driver / Courier GPS Marker (Dynamic vehicle: Moto / Voiture / Cargo like Yango)
interface DriverMarkerProps {
  position: google.maps.LatLngLiteral;
  courierName: string;
  vehicleType: VehicleType;
  speedKmh: number;
}

const DriverMarker: React.FC<DriverMarkerProps> = React.memo(({
  position,
  courierName,
  vehicleType,
  speedKmh
}) => {
  const isCar = vehicleType === 'voiture' || vehicleType === 'car';
  const isCargo = vehicleType === 'cargo';

  return (
    <AdvancedMarker
      position={position}
      zIndex={80}
      title={`Livreur en direct (${isCar ? 'Voiture' : isCargo ? 'Camionnette' : 'Moto'}) : ${courierName}`}
    >
      <div className="relative flex flex-col items-center select-none cursor-pointer">
        {/* Pulsing GPS Radar Ring */}
        <span className={`absolute -top-1 w-10 h-10 rounded-full animate-ping ${
          isCar ? 'bg-amber-500/30' : isCargo ? 'bg-purple-500/30' : 'bg-emerald-500/30'
        }`} />
        
        <div className={`relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#090F1C] border-2 font-black text-[11px] shadow-2xl ${
          isCar 
            ? 'border-amber-400 text-amber-300' 
            : isCargo 
            ? 'border-purple-400 text-purple-300' 
            : 'border-emerald-400 text-emerald-300'
        }`}>
          {isCar ? (
            <Car className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : isCargo ? (
            <Truck className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <Bike className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          )}
          <span className="whitespace-nowrap">{courierName.split(' ')[0]}</span>
          <span className={`text-[9px] px-1 rounded font-mono-num ${
            isCar ? 'bg-amber-500/20 text-amber-300' : isCargo ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
          }`}>
            {speedKmh} km/h
          </span>
        </div>
      </div>
    </AdvancedMarker>
  );
});
DriverMarker.displayName = 'DriverMarker';

// 3. Memoized High-Contrast Client Pickup Pin (Exact Style from inDrive / Google Maps Screenshot)
interface ClientPickupMarkerProps {
  position: google.maps.LatLngLiteral;
  label: string;
}

const ClientPickupMarker: React.FC<ClientPickupMarkerProps> = React.memo(({ position, label }) => {
  return (
    <AdvancedMarker
      position={position}
      zIndex={95}
      title={`Point de Récupération / Client : ${label}`}
    >
      <div className="relative flex flex-col items-center select-none cursor-pointer group">
        {/* White Rounded Badge with Downward Pointer Notch */}
        <div className="relative z-10 w-11 h-11 rounded-2xl bg-white border-2 border-slate-900 shadow-2xl flex items-center justify-center text-slate-950 transition-transform group-hover:scale-110">
          <svg className="w-6 h-6 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
            {/* Person waving / customer hailing icon */}
            <circle cx="12" cy="4" r="2.5" />
            <path d="M10 9c-1.1 0-2 .9-2 2v4a1 1 0 0 0 2 0v-3h1v8a1 1 0 0 0 2 0v-5h1v5a1 1 0 0 0 2 0v-8c0-1.1-.9-2-2-2h-2z" />
            <path d="M15.5 5.5a1 1 0 0 1 1.2-.8l2.5 1a1 1 0 1 1-.8 1.8l-1.9-.8v2a1 1 0 0 1-2 0v-3.5a1 1 0 0 1 1-.5z" />
          </svg>
        </div>
        {/* Downward notch pin */}
        <div className="w-1 h-3 bg-slate-900 -mt-0.5" />
        <div className="w-2 h-2 rounded-full bg-slate-900 -mt-1 shadow" />
        <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#0B111E]/95 border border-slate-700 text-white text-[10px] font-extrabold whitespace-nowrap shadow-xl">
          {label}
        </span>
      </div>
    </AdvancedMarker>
  );
});
ClientPickupMarker.displayName = 'ClientPickupMarker';

// 4. Memoized Commune Centroid Marker
interface CommuneMarkerProps {
  commune: ZoneCommune;
  itemCount: number;
  isSelected: boolean;
  onSelect: (commune: ZoneCommune) => void;
}

const CommuneMarker: React.FC<CommuneMarkerProps> = React.memo(({
  commune,
  itemCount,
  isSelected,
  onSelect
}) => {
  const handleClick = useCallback(() => {
    onSelect(commune);
  }, [commune, onSelect]);

  return (
    <AdvancedMarker
      position={commune.coords}
      onClick={handleClick}
      title={`Commune de ${commune.name} (${itemCount} articles)`}
      zIndex={isSelected ? 60 : 10}
    >
      <div 
        className={`group flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
          isSelected 
            ? 'bg-amber-500 border-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-110' 
            : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-slate-400 font-bold hover:scale-105'
        }`}
      >
        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
        <span className="text-xs whitespace-nowrap">{commune.name}</span>
        {itemCount > 0 && (
          <span 
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-num font-black ${
              isSelected ? 'bg-slate-950 text-amber-300' : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {itemCount}
          </span>
        )}
      </div>
    </AdvancedMarker>
  );
});
CommuneMarker.displayName = 'CommuneMarker';

// Main Export Component
export const InteractiveAbidjanMap: React.FC<InteractiveAbidjanMapProps> = ({
  onSelectProduct,
  onClose,
  className = ''
}) => {
  const { products, setProductDetailModal, userLocation, setUserManualLocation } = useApp();

  // State Management
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>('cocody');
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'satellite'>('roadmap');
  const [navTheme, setNavTheme] = useState<'night' | 'day'>('night'); // Default to high-contrast night navigation
  const [filterType, setFilterType] = useState<'all' | 'auction' | 'shop' | 'b2b'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [userLiveCoords, setUserLiveCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  // Active InfoWindow State
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [infoWindowAnchor, setInfoWindowAnchor] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Target Center for smooth panning
  const [mapTargetCenter, setMapTargetCenter] = useState<google.maps.LatLngLiteral>(ABIDJAN_CENTER);
  const [mapTargetZoom, setMapTargetZoom] = useState<number>(12);

  // Live Driver Simulation position & vehicle (moving along expressway)
  const [simulatedDriverVehicle, setSimulatedDriverVehicle] = useState<VehicleType>('moto');
  const [simulatedDriverPosition, setSimulatedDriverPosition] = useState<google.maps.LatLngLiteral>({
    lat: 5.3450,
    lng: -4.0120
  });

  // Selected Commune
  const selectedCommune = useMemo(() => {
    return ALL_COMMUNES.find(c => c.id === selectedCommuneId) || ALL_COMMUNES[0];
  }, [selectedCommuneId]);

  // Driver Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedDriverPosition(prev => {
        const deltaLat = (Math.random() - 0.5) * 0.0008;
        const deltaLng = (Math.random() - 0.5) * 0.0008;
        return {
          lat: prev.lat + deltaLat,
          lng: prev.lng + deltaLng
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Filtered Products Memoization
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.status !== 'active') return false;

      // Filter by type
      if (filterType === 'auction' && (p.listingType === 'shop' || p.isB2BLot)) return false;
      if (filterType === 'shop' && (p.listingType !== 'shop' || p.isB2BLot)) return false;
      if (filterType === 'b2b' && !p.isB2BLot && p.category !== 'Déstockage B2B') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCommune = p.commune.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        if (!matchTitle && !matchCommune && !matchCategory) return false;
      }

      return true;
    });
  }, [products, filterType, searchQuery]);

  // Products in Selected Commune
  const communeProducts = useMemo(() => {
    return filteredProducts.filter(p => 
      p.commune.toLowerCase().includes(selectedCommune.name.toLowerCase()) || 
      selectedCommune.name.toLowerCase().includes(p.commune.toLowerCase())
    );
  }, [filteredProducts, selectedCommune]);

  // Handle Commune Selection
  const handleCommuneSelect = useCallback((commune: ZoneCommune) => {
    setSelectedCommuneId(commune.id);
    setMapTargetCenter(commune.coords);
    setMapTargetZoom(14);
    setActiveProduct(null);
    setInfoWindowAnchor(null);

    const count = products.filter(p => 
      p.status === 'active' &&
      (p.commune.toLowerCase().includes(commune.name.toLowerCase()) ||
       commune.name.toLowerCase().includes(p.commune.toLowerCase()))
    ).length;

    if (isVoiceActive) {
      voiceNavigator.speak(
        `Commune de ${commune.name}. ${count} article${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}. Tarif coursier : ${commune.baseDeliveryFeeMoto.toLocaleString('fr-FR')} FCFA.`
      );
    }
  }, [products, isVoiceActive]);

  // Recenter Map on Driver or User Position (Floating Button from screenshot)
  const handleRecenterToLivePosition = useCallback(() => {
    if (userLiveCoords) {
      setMapTargetCenter(userLiveCoords);
      setMapTargetZoom(15);
      if (isVoiceActive) voiceNavigator.speak("Recentrage sur votre position GPS");
    } else {
      setMapTargetCenter(simulatedDriverPosition);
      setMapTargetZoom(15);
      if (isVoiceActive) voiceNavigator.speak("Recentrage sur le coursier en transit");
    }
  }, [userLiveCoords, simulatedDriverPosition, isVoiceActive]);

  // Handle Native Capacitor / Browser Geolocation
  const handleLocateUser = useCallback(async () => {
    setIsLocatingUser(true);
    setGeolocationError(null);

    try {
      const pos = await nativeBridge.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 });
      setIsLocatingUser(false);
      const coords: google.maps.LatLngLiteral = {
        lat: pos.latitude,
        lng: pos.longitude
      };
      setUserLiveCoords(coords);
      setMapTargetCenter(coords);
      setMapTargetZoom(15);

      // Find closest commune
      const closest = ALL_COMMUNES.reduce((prev, curr) => {
        const prevDist = Math.hypot(prev.coords.lat - coords.lat, prev.coords.lng - coords.lng);
        const currDist = Math.hypot(curr.coords.lat - coords.lat, curr.coords.lng - coords.lng);
        return currDist < prevDist ? curr : prev;
      }, ALL_COMMUNES[0]);

      setSelectedCommuneId(closest.id);
      setUserManualLocation(closest.name);

      if (isVoiceActive) {
        voiceNavigator.speak(`Position GPS détectée à ${closest.name}.`);
      }
    } catch (error: any) {
      setIsLocatingUser(false);
      console.warn("Capacitor Geolocation error:", error?.message);
      setGeolocationError("GPS indisponible. Centrage sur la commune choisie.");
      setMapTargetCenter(selectedCommune.coords);
      setMapTargetZoom(14);
    }
  }, [selectedCommune, isVoiceActive, setUserManualLocation]);

  // Handle Product Marker Click
  const handleMarkerProductClick = useCallback((prod: Product, marker: google.maps.marker.AdvancedMarkerElement | null) => {
    setActiveProduct(prod);
    setInfoWindowAnchor(marker);
    if (prod.pickupCoords) {
      setMapTargetCenter(prod.pickupCoords);
    }
  }, []);

  // Handle Product Card Open
  const handleOpenProductDetail = useCallback((prod: Product) => {
    if (onSelectProduct) {
      onSelectProduct(prod);
    } else {
      setProductDetailModal(prod);
    }
  }, [onSelectProduct, setProductDetailModal]);

  // Google Maps API Key & Map ID
  const googleMapsApiKey = ((import.meta as unknown as { env?: { VITE_GOOGLE_MAPS_API_KEY?: string } }).env?.VITE_GOOGLE_MAPS_API_KEY) || '';
  const googleMapsMapId = ((import.meta as unknown as { env?: { VITE_GOOGLE_MAPS_MAP_ID?: string } }).env?.VITE_GOOGLE_MAPS_MAP_ID) || 'DEMO_MAP_ID';
  const [mapSdkFailed, setMapSdkFailed] = useState<boolean>(!googleMapsApiKey);

  return (
    <div 
      id="interactive-abidjan-map-container" 
      className={`rounded-3xl bg-[#080C14] border border-slate-800 overflow-hidden shadow-2xl flex flex-col ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="p-4 bg-gradient-to-r from-[#0B111E] via-[#0D1527] to-[#0B111E] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Navigation className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white font-display">
                Google Maps Navigation Grand Abidjan
              </h3>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-ping text-emerald-400" />
                <span>GPS EN DIRECT</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Guidage livreur jour & nuit • Enchères, boutiques & retraits
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Voice + Geolocation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Selector: Native Google Maps Roadmap vs Satellite */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMapLayer('roadmap')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                mapLayer === 'roadmap' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🗺️ Plan</span>
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                mapLayer === 'satellite' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛰️ Satellite</span>
            </button>
          </div>

          {/* Vehicle Type Switcher (Yango style: Moto vs Voiture vs Cargo) */}
          {filterType !== 'auction' && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSimulatedDriverVehicle('moto')}
                className={`px-2 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                  simulatedDriverVehicle === 'moto' 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Livreur à Moto (Rapide / Colis légers)"
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Moto</span>
              </button>
              <button
                onClick={() => setSimulatedDriverVehicle('voiture')}
                className={`px-2 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                  simulatedDriverVehicle === 'voiture' || simulatedDriverVehicle === 'car'
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Livreur en Voiture (Colis sécurisés / Express)"
              >
                <Car className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voiture</span>
              </button>
              <button
                onClick={() => setSimulatedDriverVehicle('cargo')}
                className={`px-2 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                  simulatedDriverVehicle === 'cargo'
                    ? 'bg-purple-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Livreur Cargo (Gros volumes / B2B)"
              >
                <Truck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cargo</span>
              </button>
            </div>
          )}

          {/* Day / Night Theme Switcher for Delivery Couriers */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setNavTheme('night')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                navTheme === 'night' ? 'bg-slate-800 text-amber-300 shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Nuit (Contraste élevé pour conduite nocturne)"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuit</span>
            </button>
            <button
              onClick={() => setNavTheme('day')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                navTheme === 'day' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Jour (Lisibilité plein soleil)"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Jour</span>
            </button>
          </div>

          {/* Native Geolocation Button */}
          <button
            onClick={handleLocateUser}
            disabled={isLocatingUser}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
              userLiveCoords 
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-md shadow-blue-500/20' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Me géolocaliser avec le GPS"
          >
            <Locate className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin text-amber-400' : 'text-blue-400'}`} />
            <span className="hidden sm:inline">
              {isLocatingUser ? 'Localisation...' : userLiveCoords ? 'GPS Actif' : 'GPS'}
            </span>
          </button>

          {/* Voice Guidance Toggle */}
          <button
            onClick={() => {
              const next = !isVoiceActive;
              setIsVoiceActive(next);
              voiceNavigator.setMuted(!next);
              if (next) voiceNavigator.speak("Guidage vocal activé");
            }}
            className={`p-2 rounded-xl border transition-all ${
              isVoiceActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={isVoiceActive ? "Couper la voix" : "Activer la voix"}
          >
            {isVoiceActive ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Geolocation Feedback Banner */}
      {geolocationError && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{geolocationError}</span>
          </div>
          <button 
            onClick={() => setGeolocationError(null)}
            className="text-[11px] font-bold underline hover:text-white"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left / Center: Interactive Google Maps Canvas */}
        <div className="lg:col-span-8 bg-[#040711] relative border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden flex flex-col min-h-[420px]">
          <div className="w-full h-full relative min-h-[420px]">
            {(!googleMapsApiKey || mapSdkFailed) ? (
              /* Google Maps Embed Mode (Zero-config high reliability) */
              <div className="w-full h-full relative min-h-[420px]">
                <iframe
                  title="Google Maps Abidjan"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedCommune.name + ', Abidjan, Côte d\'Ivoire')}&t=${mapLayer === 'satellite' ? 'k' : 'm'}&z=13&ie=UTF8&iwloc=&output=embed`}
                  className={`w-full h-full border-0 min-h-[420px] ${navTheme === 'night' ? 'brightness-90 contrast-125' : ''}`}
                  loading="lazy"
                  allowFullScreen
                />
                {/* Floating live GPS telemetry overlay (Hidden when in auction filter mode) */}
                {filterType !== 'auction' && (
                  <div className="absolute top-3 left-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold">
                      {simulatedDriverVehicle === 'voiture' || simulatedDriverVehicle === 'car' ? (
                        <>
                          <Car className="w-4 h-4 animate-pulse text-amber-400" />
                          <span className="text-amber-400">Bakary T. (Voiture)</span>
                        </>
                      ) : simulatedDriverVehicle === 'cargo' ? (
                        <>
                          <Truck className="w-4 h-4 animate-pulse text-purple-400" />
                          <span className="text-purple-400">Bakary T. (Cargo)</span>
                        </>
                      ) : (
                        <>
                          <Bike className="w-4 h-4 animate-bounce text-emerald-400" />
                          <span className="text-emerald-400">Bakary T. (Moto)</span>
                        </>
                      )}
                    </div>
                    <div className="w-px h-4 bg-slate-800" />
                    <span className="font-mono-num text-amber-400 font-black">
                      42 km/h
                    </span>
                    <div className="w-px h-4 bg-slate-800" />
                    <span className="text-[11px] text-slate-300 font-bold">
                      📍 {selectedCommune.name}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <APIProvider 
                apiKey={googleMapsApiKey}
                onError={() => setMapSdkFailed(true)}
              >
                <Map
                  id="bradci_abidjan_map"
                  mapId={googleMapsMapId}
                  defaultCenter={ABIDJAN_CENTER}
                  defaultZoom={12}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  mapTypeId={mapLayer === 'satellite' ? 'hybrid' : 'roadmap'}
                  styles={navTheme === 'night' && mapLayer === 'roadmap' ? NIGHT_MAP_STYLES : []}
                  className="w-full h-full min-h-[420px]"
                >
                  {/* Pan & Zoom controller */}
                  <MapController targetCenter={mapTargetCenter} targetZoom={mapTargetZoom} />

                  {/* 1. All Commune Centroid Markers */}
                  {ALL_COMMUNES.map(c => {
                    const count = filteredProducts.filter(p => 
                      p.commune.toLowerCase().includes(c.name.toLowerCase()) || 
                      c.name.toLowerCase().includes(p.commune.toLowerCase())
                    ).length;

                    return (
                      <CommuneMarker
                        key={c.id}
                        commune={c}
                        itemCount={count}
                        isSelected={selectedCommuneId === c.id}
                        onSelect={handleCommuneSelect}
                      />
                    );
                  })}

                  {/* 2. All Filtered Products & B2B Lots Markers */}
                  {filteredProducts.map(prod => (
                    <ProductMarker
                      key={prod.id}
                      product={prod}
                      isSelected={activeProduct?.id === prod.id}
                      onClick={handleMarkerProductClick}
                    />
                  ))}

                  {/* 3. Live Driver / Courier GPS Marker (Hidden in auction option) */}
                  {filterType !== 'auction' && (
                    <DriverMarker
                      position={simulatedDriverPosition}
                      courierName="Bakary Traoré"
                      vehicleType={simulatedDriverVehicle}
                      speedKmh={42}
                    />
                  )}

                  {/* 4. Client Pickup Marker with inDrive style */}
                  <ClientPickupMarker
                    position={userLiveCoords || selectedCommune.coords}
                    label={userLiveCoords ? "Votre Position Client" : `Point Retrait : ${selectedCommune.name}`}
                  />

                  {/* 5. Interactive InfoWindow on Marker Click */}
                  {activeProduct && (
                    <InfoWindow
                      anchor={infoWindowAnchor}
                      position={activeProduct.pickupCoords || selectedCommune.coords}
                      onCloseClick={() => {
                        setActiveProduct(null);
                        setInfoWindowAnchor(null);
                      }}
                      maxWidth={280}
                      className="text-slate-950 font-sans"
                    >
                      <div className="p-1 space-y-2">
                        <div className="relative rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={activeProduct.imageUrl || activeProduct.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}
                            alt={activeProduct.title}
                            className="w-full h-24 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {activeProduct.isB2BLot && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                              {activeProduct.b2bSaleKind === 'liquidation' ? 'LIQUIDATION' : 'DÉSTOCKAGE B2B'}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-1">
                            {activeProduct.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            📍 {activeProduct.commune} • {activeProduct.category}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-emerald-700">
                              {activeProduct.currentPrice.toLocaleString('fr-FR')} FCFA
                            </span>
                            {activeProduct.bids?.length > 0 && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                {activeProduct.bids.length} offre(s)
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenProductDetail(activeProduct)}
                          className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow transition-colors"
                        >
                          <span>Voir les Détails & Offre</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            )}

            {/* Floating Recenter GPS Button (Exact replica from inDrive / Google Maps screenshot) */}
            <div className="absolute bottom-16 right-4 z-20">
              <button
                onClick={handleRecenterToLivePosition}
                className="w-12 h-12 rounded-full bg-[#1A2524] hover:bg-[#253634] text-white border-2 border-slate-700/80 shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer group"
                title="Recentrer sur la position en direct"
              >
                <Navigation className="w-5 h-5 text-white transition-transform group-hover:rotate-45" />
              </button>
            </div>

            {/* Official Google Branding Watermark in Bottom Left */}
            <div className="absolute bottom-16 left-4 z-20 pointer-events-none select-none">
              <div className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white/90 text-[11px] font-bold tracking-wider">
                Google
              </div>
            </div>

            {/* Bottom Quick Commune Strip */}
            <div className="absolute bottom-3 inset-x-3 z-10 bg-[#0B111E]/90 backdrop-blur-md border border-slate-800 p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-2xl">
              {ALL_COMMUNES.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleCommuneSelect(c)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                    selectedCommuneId === c.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Commune Data & Active Products Feed */}
        <div className="lg:col-span-4 p-4 bg-[#090E1A] flex flex-col justify-between overflow-y-auto max-h-[560px]">
          <div className="space-y-3.5">
            {/* 1. Commune Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-base font-extrabold text-white font-display">
                      {selectedCommune.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {selectedCommune.group}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCommuneSelect(selectedCommune)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
                  title="Écouter la présentation vocale"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {selectedCommune.description}
              </p>

              {/* Delivery Stats & GPS Status */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Fret Moto Garanti</span>
                  <span className="font-mono-num font-extrabold text-emerald-400">
                    {selectedCommune.baseDeliveryFeeMoto.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Couverture Google Maps</span>
                  <span className="font-bold text-blue-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    100% Actif
                  </span>
                </div>
              </div>

              {/* Set as User Location Button */}
              <button
                onClick={() => {
                  setUserManualLocation(selectedCommune.name);
                  if (isVoiceActive) {
                    voiceNavigator.speak(`Position fixée sur ${selectedCommune.name}.`);
                  }
                }}
                className="w-full mt-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Définir comme ma commune de livraison</span>
              </button>
            </div>

            {/* 2. Filter Pills for Products */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300">
                Articles ({communeProducts.length})
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    filterType === 'all' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterType('auction')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    filterType === 'auction' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Enchères
                </button>
                <button
                  onClick={() => setFilterType('shop')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    filterType === 'shop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Boutiques
                </button>
                <button
                  onClick={() => setFilterType('b2b')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    filterType === 'b2b' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lots B2B
                </button>
              </div>
            </div>

            {/* Search Input in Map */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrer dans la commune..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 3. Products List in this Commune */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {communeProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
                  Aucun article actif dans {selectedCommune.name} pour ce filtre.
                </div>
              ) : (
                communeProducts.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleOpenProductDetail(prod)}
                    className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between gap-2.5 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={prod.imageUrl || prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}
                        alt={prod.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{prod.title}</p>
                          {prod.isB2BLot && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-black shrink-0 border border-amber-500/30">
                              B2B
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-amber-400 font-mono-num font-bold">
                          {prod.currentPrice.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
