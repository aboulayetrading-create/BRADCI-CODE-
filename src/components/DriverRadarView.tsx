import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bike, 
  Car, 
  Truck, 
  MapPin, 
  Navigation, 
  Radio, 
  Power, 
  Layers, 
  Locate, 
  Plus, 
  Minus,
  Sparkles,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { ALL_COMMUNES } from '../data/communes';
import { VehicleType } from '../types';

interface SimulatedCourier {
  id: string;
  name: string;
  vehicle: VehicleType;
  plate: string;
  commune: string;
  lat: number;
  lng: number;
  isAvailable: boolean;
  rating: number;
  heading: number; // in degrees
}

export const DriverRadarView: React.FC = () => {
  const { 
    currentUser, 
    toggleDriverAvailability,
    userLocation
  } = useApp();

  const isOnline = currentUser?.driverAvailability !== 'offline';
  const driverCommune = currentUser?.gpsLocation?.commune || userLocation?.commune || 'Cocody';

  // Driver GPS coordinates
  const driverCoords = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    const communeObj = ALL_COMMUNES.find(c => c.name.toLowerCase() === driverCommune.toLowerCase());
    return communeObj ? { lat: communeObj.coords.lat, lng: communeObj.coords.lng } : { lat: 5.3599, lng: -4.0082 };
  }, [userLocation, driverCommune]);

  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapStyle, setMapStyle] = useState<'night' | 'satellite'>('night');
  const [selectedCourier, setSelectedCourier] = useState<SimulatedCourier | null>(null);

  // Simulated active online couriers across Abidjan zones
  const simulatedCouriers: SimulatedCourier[] = useMemo(() => [
    {
      id: 'drv-01',
      name: 'Kouassi Roland',
      vehicle: 'moto',
      plate: '4589 JJ 01',
      commune: 'Cocody',
      lat: 5.352,
      lng: -3.998,
      isAvailable: true,
      rating: 4.9,
      heading: 45
    },
    {
      id: 'drv-02',
      name: 'Traoré Bakary',
      vehicle: 'moto',
      plate: '1120 KL 01',
      commune: 'Plateau',
      lat: 5.328,
      lng: -4.020,
      isAvailable: true,
      rating: 4.8,
      heading: 120
    },
    {
      id: 'drv-03',
      name: 'Yao Firmin',
      vehicle: 'voiture',
      plate: '8834 GH 01',
      commune: 'Marcory',
      lat: 5.305,
      lng: -3.985,
      isAvailable: true,
      rating: 5.0,
      heading: 270
    },
    {
      id: 'drv-04',
      name: 'Koné Ibrahim',
      vehicle: 'moto',
      plate: '3341 MM 01',
      commune: 'Yopougon',
      lat: 5.340,
      lng: -4.075,
      isAvailable: true,
      rating: 4.7,
      heading: 90
    },
    {
      id: 'drv-05',
      name: 'Soro Alassane',
      vehicle: 'cargo',
      plate: '7612 AB 01',
      commune: 'Treichville',
      lat: 5.312,
      lng: -4.010,
      isAvailable: true,
      rating: 4.9,
      heading: 180
    },
    {
      id: 'drv-06',
      name: 'Diallo Mamadou',
      vehicle: 'moto',
      plate: '9021 WX 01',
      commune: 'Koumassi',
      lat: 5.295,
      lng: -3.960,
      isAvailable: true,
      rating: 4.8,
      heading: 315
    },
    {
      id: 'drv-07',
      name: 'Bamba Souleymane',
      vehicle: 'moto',
      plate: '5562 TZ 01',
      commune: 'Adjamé',
      lat: 5.355,
      lng: -4.030,
      isAvailable: true,
      rating: 4.9,
      heading: 60
    }
  ], []);

  // Map coordinates projection to percentage
  const latMin = 5.25;
  const latMax = 5.43;
  const lngMin = -4.12;
  const lngMax = -3.88;

  const projectToMapCoords = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = ((latMax - lat) / (latMax - latMin)) * 100;
    return {
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(6, Math.min(94, y))
    };
  };

  const driverPos = projectToMapCoords(driverCoords.lat, driverCoords.lng);

  const getVehicleIcon = (v: VehicleType | string, sizeClass = 'w-3.5 h-3.5') => {
    switch (v) {
      case 'voiture':
      case 'car':
        return <Car className={sizeClass} />;
      case 'cargo':
        return <Truck className={sizeClass} />;
      default:
        return <Bike className={sizeClass} />;
    }
  };

  return (
    <div id="driver-radar-view" className="relative w-full h-[calc(100vh-140px)] min-h-[580px] rounded-3xl overflow-hidden bg-[#06102E] border border-slate-800 shadow-2xl flex flex-col justify-between select-none">
      {/* Top Map HUD: Current Position Pill & Style Switcher */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Driver GPS Location & Accuracy Badge */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#06102E]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black text-white">{driverCommune}</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({driverCoords.lat.toFixed(4)}, {driverCoords.lng.toFixed(4)})</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
            GPS Fixé
          </span>
        </div>

        {/* Right: Active Radar Counter & Map Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#06102E]/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/80 shadow-xl flex items-center gap-2 text-xs text-slate-300 font-bold">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{simulatedCouriers.length + (isOnline ? 1 : 0)} livreurs en ligne</span>
          </div>

          <button
            onClick={() => setMapStyle(prev => prev === 'night' ? 'satellite' : 'night')}
            className="p-2.5 rounded-2xl bg-[#06102E]/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-white shadow-xl transition-all"
            title="Changer le style de carte"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Fullscreen Interactive Radar Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Map Background Canvas */}
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{
            transform: `scale(${mapZoom})`,
            transformOrigin: `${driverPos.x}% ${driverPos.y}%`
          }}
        >
          {/* Base SVG Map Grid of Abidjan */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {/* Ébrié Lagoon Gradient */}
              <linearGradient id="lagoonWater" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B1A3D" />
                <stop offset="100%" stopColor="#061226" />
              </linearGradient>

              {/* Radar Glow Radial Gradient centered on driver */}
              <radialGradient id="radarGlow" cx={`${driverPos.x}%`} cy={`${driverPos.y}%`} r="35%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Dark Map Base Texture */}
            <rect width="100" height="100" fill={mapStyle === 'night' ? '#04091A' : '#07152A'} />

            {/* Road Grid Lines (Boulevards & Expressways of Abidjan) */}
            <g stroke="#1E293B" strokeWidth="0.35" strokeDasharray="1,1" opacity="0.6">
              <line x1="0" y1="20" x2="100" y2="20" />
              <line x1="0" y1="40" x2="100" y2="40" />
              <line x1="0" y1="60" x2="100" y2="60" />
              <line x1="0" y1="80" x2="100" y2="80" />
              <line x1="20" y1="0" x2="20" y2="100" />
              <line x1="40" y1="0" x2="40" y2="100" />
              <line x1="60" y1="0" x2="60" y2="100" />
              <line x1="80" y1="0" x2="80" y2="100" />
            </g>

            {/* Stylized Ébrié Lagoon Waterbody */}
            <path
              d="M 5,68 Q 20,60 38,62 Q 55,64 68,58 Q 82,52 96,65 L 96,82 Q 75,76 52,78 Q 28,80 5,82 Z"
              fill="url(#lagoonWater)"
              stroke="#1D3557"
              strokeWidth="0.5"
            />
            <path
              d="M 28,62 Q 40,55 58,56 Q 72,58 85,50 L 88,58 Q 65,65 42,66 Z"
              fill="url(#lagoonWater)"
              stroke="#1D3557"
              strokeWidth="0.4"
            />

            {/* Major Bridges of Abidjan (H.K.B, De Gaulle, Houphouët-Boigny, 5e Pont Cocody) */}
            {/* 5e Pont Alassane Ouattara (Cocody <-> Plateau) */}
            <line x1="48" y1="48" x2="53" y2="45" stroke="#F97316" strokeWidth="0.8" strokeLinecap="round" opacity="0.9" />
            {/* Pont H.K.B (Riviera <-> Marcory) */}
            <line x1="64" y1="52" x2="66" y2="64" stroke="#38BDF8" strokeWidth="0.7" strokeLinecap="round" />
            {/* Pont Général de Gaulle (Plateau <-> Treichville) */}
            <line x1="46" y1="58" x2="48" y2="66" stroke="#38BDF8" strokeWidth="0.7" strokeLinecap="round" />

            {/* Major Arteries (Autoroute du Nord, Bd Latrille, VGE) */}
            <path d="M 10,25 Q 35,32 50,44 Q 65,58 75,85" fill="none" stroke="#334155" strokeWidth="0.9" opacity="0.8" />
            <path d="M 45,15 L 50,45 L 48,70 L 52,95" fill="none" stroke="#334155" strokeWidth="0.8" opacity="0.8" />
            <path d="M 52,65 Q 68,72 88,80" fill="none" stroke="#334155" strokeWidth="0.8" opacity="0.8" />

            {/* Radar Circular Scanning Rings centered on current driver */}
            <circle cx={`${driverPos.x}%`} cy={`${driverPos.y}%`} r="8" fill="none" stroke="#10B981" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.8" />
            <circle cx={`${driverPos.x}%`} cy={`${driverPos.y}%`} r="16" fill="none" stroke="#10B981" strokeWidth="0.3" strokeDasharray="2,2" opacity="0.6" />
            <circle cx={`${driverPos.x}%`} cy={`${driverPos.y}%`} r="26" fill="none" stroke="#10B981" strokeWidth="0.25" strokeDasharray="2,2" opacity="0.4" />
            <circle cx={`${driverPos.x}%`} cy={`${driverPos.y}%`} r="38" fill="none" stroke="#10B981" strokeWidth="0.2" opacity="0.2" />

            {/* Radar Ambient Radial Glow */}
            <circle cx={`${driverPos.x}%`} cy={`${driverPos.y}%`} r="35" fill="url(#radarGlow)" />
          </svg>

          {/* Active Radar Sweep Beam Animation */}
          {isOnline && (
            <div 
              className="absolute pointer-events-none rounded-full"
              style={{
                left: `${driverPos.x}%`,
                top: `${driverPos.y}%`,
                width: '420px',
                height: '420px',
                transform: 'translate(-50%, -50%)',
                background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.35) 0deg, rgba(16, 185, 129, 0.08) 60deg, transparent 90deg, transparent 360deg)',
                animation: 'spin 4s linear infinite'
              }}
            />
          )}

          {/* Major Commune Labels on Map */}
          {ALL_COMMUNES.slice(0, 10).map((commune) => {
            const pos = projectToMapCoords(commune.coords.lat, commune.coords.lng);
            return (
              <div
                key={commune.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600/50 mx-auto mb-0.5" />
                <span className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest px-1 py-0.2 rounded bg-slate-950/40 backdrop-blur-[1px]">
                  {commune.name}
                </span>
              </div>
            );
          })}

          {/* Other Online Couriers Pins */}
          {simulatedCouriers.map((courier) => {
            const pos = projectToMapCoords(courier.lat, courier.lng);
            return (
              <div
                key={courier.id}
                onClick={() => setSelectedCourier(courier)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10 transition-transform hover:scale-125"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="relative">
                  {/* Courier vehicle marker badge */}
                  <div className="w-8 h-8 rounded-full bg-slate-900/90 border border-slate-600 text-slate-200 flex items-center justify-center shadow-lg group-hover:border-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {getVehicleIcon(courier.vehicle)}
                  </div>
                  {/* Small online green dot */}
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
                </div>

                {/* Name tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none whitespace-nowrap bg-slate-950/95 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-white shadow-2xl z-30">
                  <span className="font-bold text-emerald-400">{courier.name}</span>
                  <span className="text-slate-400 block text-[9px]">{courier.commune} • {courier.plate}</span>
                </div>
              </div>
            );
          })}

          {/* Current Driver's GPS Position Marker */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%` }}
          >
            {/* Multiple pulsing animated rings */}
            <div className={`absolute -inset-4 rounded-full ${isOnline ? 'bg-emerald-500/25 animate-ping' : 'bg-red-500/20'}`} />
            <div className={`absolute -inset-8 rounded-full ${isOnline ? 'bg-emerald-500/15 animate-pulse' : 'bg-transparent'}`} />

            {/* Main Driver Pin */}
            <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all ${
              isOnline
                ? 'bg-emerald-500 text-slate-950 border-white shadow-emerald-500/50 scale-105'
                : 'bg-red-950/90 text-red-300 border-red-500/60'
            }`}>
              <Navigation className="w-5 h-5 fill-current transform rotate-45 stroke-[2.5]" />
              
              {/* Star rating micro-badge */}
              <div className="absolute -bottom-1 -right-1 bg-slate-950 text-amber-400 text-[8px] font-mono-num font-black px-1 rounded-full border border-amber-500/40">
                ★ 4.9
              </div>
            </div>

            {/* Driver Identity Label */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap bg-slate-950/90 backdrop-blur-md border border-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xl">
              <span className="text-emerald-400">VOUS</span> ({driverCommune})
            </div>
          </div>
        </div>

        {/* Selected Courier Detail Popover */}
        {selectedCourier && (
          <div className="absolute top-16 left-4 z-30 w-72 bg-[#0C121E]/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-3.5 shadow-2xl animate-in fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                  {getVehicleIcon(selectedCourier.vehicle, 'w-4 h-4')}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">{selectedCourier.name}</h4>
                  <span className="text-[10px] text-slate-400">{selectedCourier.commune} • {selectedCourier.plate}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCourier(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Statut : <strong className="text-emerald-400 font-bold">En ligne</strong></span>
              <span className="text-amber-400 font-mono font-bold">★ {selectedCourier.rating} / 5.0</span>
            </div>
          </div>
        )}

        {/* Floating Map Zoom & Recenter Controls */}
        <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-2">
          <button
            onClick={() => setMapZoom(prev => Math.min(2.2, prev + 0.3))}
            className="w-10 h-10 rounded-2xl bg-[#06102E]/90 backdrop-blur-md border border-slate-700/80 text-white flex items-center justify-center shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
            title="Zoomer"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMapZoom(prev => Math.max(0.8, prev - 0.3))}
            className="w-10 h-10 rounded-2xl bg-[#06102E]/90 backdrop-blur-md border border-slate-700/80 text-white flex items-center justify-center shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
            title="Dézoomer"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMapZoom(1)}
            className="w-10 h-10 rounded-2xl bg-[#06102E]/90 backdrop-blur-md border border-slate-700/80 text-emerald-400 flex items-center justify-center shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
            title="Recentrer sur ma position"
          >
            <Locate className="w-5 h-5" />
          </button>
        </div>

        {/* Central Master Status Toggle Button (Prominent Bottom Center) */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center justify-center px-4 pointer-events-none">
          <button
            id="driver-radar-central-status-toggle"
            onClick={toggleDriverAvailability}
            className={`pointer-events-auto px-6 sm:px-8 py-3.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-3 transition-all shadow-2xl active:scale-95 cursor-pointer border ${
              isOnline
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 ring-4 ring-emerald-500/30 shadow-emerald-500/40'
                : 'bg-slate-900/95 hover:bg-slate-800 text-slate-300 border-red-500/50 ring-4 ring-red-500/20 shadow-black/80'
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-slate-950 animate-pulse' : 'bg-red-500'}`} />
            <Power className={`w-4 h-4 ${isOnline ? 'text-slate-950' : 'text-red-400'}`} />
            <span className="tracking-wide">
              {isOnline ? '🟢 EN SERVICE (RADAR EN LIGNE)' : '🔴 HORS LIGNE (PASSER EN SERVICE)'}
            </span>
          </button>
          <p className="text-[10px] text-slate-400/90 font-medium mt-2 bg-[#06102E]/80 backdrop-blur-sm px-3 py-0.5 rounded-full border border-slate-800 pointer-events-auto">
            {isOnline 
              ? '✓ Votre position est diffusée sur le réseau d\'attribution prioritaire' 
              : 'Cliquez pour activer votre géolocalisation et recevoir les courses'}
          </p>
        </div>
      </div>
    </div>
  );
};
