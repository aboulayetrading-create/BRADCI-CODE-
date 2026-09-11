import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bike, 
  Car, 
  Truck, 
  MapPin, 
  Radio, 
  Power, 
  Layers, 
  Locate, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Navigation,
  Sparkles,
  Package,
  X,
  ChevronRight,
  Filter
} from 'lucide-react';
import L from 'leaflet';
import { ALL_COMMUNES } from '../data/communes';
import { VehicleType } from '../types';
import { playGpsChime } from '../utils/audioServices';

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
  heading: number;
}

interface RadarJobPoint {
  id: string;
  title: string;
  pickupCommune: string;
  dropoffCommune: string;
  fee: number;
  distanceKm: number;
  lat: number;
  lng: number;
  type: 'urgent' | 'b2b' | 'standard';
}

export const DriverRadarView: React.FC = () => {
  const { 
    currentUser, 
    toggleDriverAvailability,
    userLocation,
    language,
    translate,
    addToast,
    freightJobs
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

  // Map state
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);

  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite'>('dark');
  const [radarRadiusKm, setRadarRadiusKm] = useState<number>(5);
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'moto' | 'voiture' | 'cargo'>('all');
  const [selectedCourier, setSelectedCourier] = useState<SimulatedCourier | null>(null);
  const [selectedJob, setSelectedJob] = useState<RadarJobPoint | null>(null);

  // Simulated active online couriers across Grand Abidjan
  const initialCouriers: SimulatedCourier[] = useMemo(() => [
    {
      id: 'drv-01',
      name: 'Kouassi Roland',
      vehicle: 'moto',
      plate: '4589 JJ 01',
      commune: 'Cocody',
      lat: 5.354,
      lng: -3.988,
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
      lng: -4.019,
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
      lat: 5.342,
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
      lat: 5.358,
      lng: -4.028,
      isAvailable: true,
      rating: 4.9,
      heading: 60
    }
  ], []);

  const [simulatedCouriers, setSimulatedCouriers] = useState<SimulatedCourier[]>(initialCouriers);

  // Live courier movement around Abidjan (Yango / Uber radar style)
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedCouriers(prev => prev.map(c => {
        const rad = (c.heading * Math.PI) / 180;
        const speed = 0.0003 + Math.random() * 0.0003;
        let newLat = c.lat + Math.cos(rad) * speed;
        let newLng = c.lng + Math.sin(rad) * speed;
        let newHeading = c.heading + (Math.random() * 20 - 10);

        if (newLat < 5.26 || newLat > 5.44 || newLng < -4.12 || newLng > -3.92) {
          newHeading = (newHeading + 180) % 360;
        }

        return {
          ...c,
          lat: newLat,
          lng: newLng,
          heading: Math.round((newHeading + 360) % 360)
        };
      }));
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Radar delivery jobs
  const radarJobs: RadarJobPoint[] = useMemo(() => [
    {
      id: 'job-r1',
      title: 'iPhone 15 Pro Max sous scellé',
      pickupCommune: 'Cocody Angré',
      dropoffCommune: 'Marcory Zone 4',
      fee: 3500,
      distanceKm: 8.2,
      lat: 5.372,
      lng: -3.992,
      type: 'urgent'
    },
    {
      id: 'job-r2',
      title: 'Carton Vêtements Mode Wax',
      pickupCommune: 'Le Plateau',
      dropoffCommune: 'Yopougon Siporex',
      fee: 4000,
      distanceKm: 9.8,
      lat: 5.325,
      lng: -4.022,
      type: 'standard'
    },
    {
      id: 'job-r3',
      title: 'Lot 10 Sacs Riz & Huile B2B',
      pickupCommune: 'Treichville Port',
      dropoffCommune: 'Koumassi Remblais',
      fee: 6500,
      distanceKm: 6.4,
      lat: 5.308,
      lng: -4.008,
      type: 'b2b'
    }
  ], []);

  // Helper tile URLs - 100% clean, NO watermarks (replaces cartocdn api watermark)
  const getTileUrl = (style: 'dark' | 'streets' | 'satellite') => {
    switch (style) {
      case 'streets':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
      default:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [driverCoords.lat, driverCoords.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
        maxZoom: 19,
        maxNativeZoom: mapStyle === 'dark' ? 16 : 19,
        attribution: ''
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersLayerRef.current = null;
        circleLayerRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on Style Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newLayer = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 19,
      maxNativeZoom: mapStyle === 'dark' ? 16 : 19,
      attribution: ''
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Update Markers & Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Radar Scanning Circle
    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
      circleLayerRef.current = null;
    }

    if (isOnline) {
      const circle = L.circle([driverCoords.lat, driverCoords.lng], {
        radius: radarRadiusKm * 1000,
        color: '#10B981',
        weight: 1.5,
        fillColor: '#10B981',
        fillOpacity: 0.08,
        dashArray: '4, 4'
      }).addTo(map);
      circleLayerRef.current = circle;
    }

    // 2. Driver Marker (You)
    const driverIconHtml = `
      <div class="relative flex items-center justify-center">
        ${isOnline ? '<div class="absolute -inset-3 rounded-full bg-emerald-400/25 animate-ping"></div>' : ''}
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all ${
          isOnline ? 'bg-emerald-500 text-slate-950 border-white ring-4 ring-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-600'
        }">
          <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div class="absolute -bottom-5 whitespace-nowrap bg-slate-950/90 text-white border border-slate-700 px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg">
          ${language === 'en' ? 'YOU' : 'VOUS'} • ${driverCommune}
        </div>
      </div>
    `;

    const driverMarker = L.marker([driverCoords.lat, driverCoords.lng], {
      icon: L.divIcon({
        className: 'driver-live-marker',
        html: driverIconHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      })
    });

    driverMarker.on('click', () => {
      addToast(
        language === 'en' ? "Your GPS Location" : "Votre Position GPS",
        `${driverCommune} (${driverCoords.lat.toFixed(4)}, ${driverCoords.lng.toFixed(4)})`,
        "info"
      );
    });

    markersGroup.addLayer(driverMarker);

    // 3. Online Couriers Markers
    const filteredCouriers = simulatedCouriers.filter(c => {
      if (vehicleFilter === 'all') return true;
      return c.vehicle === vehicleFilter;
    });

    filteredCouriers.forEach(c => {
      const courierIconHtml = `
        <div class="relative cursor-pointer hover:scale-110 transition-transform">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg border text-white ${
            c.vehicle === 'cargo' 
              ? 'bg-purple-600 border-purple-400' 
              : c.vehicle === 'voiture' 
              ? 'bg-amber-600 border-amber-400' 
              : 'bg-sky-600 border-sky-400'
          }">
            <span class="text-xs font-black">${c.vehicle === 'cargo' ? '🚛' : c.vehicle === 'voiture' ? '🚗' : '🛵'}</span>
          </div>
          <div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950"></div>
        </div>
      `;

      const courierMarker = L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: 'courier-radar-marker',
          html: courierIconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      });

      courierMarker.on('click', () => {
        setSelectedJob(null);
        setSelectedCourier(c);
      });

      markersGroup.addLayer(courierMarker);
    });

    // 4. Delivery Opportunities Markers
    radarJobs.forEach(j => {
      const jobIconHtml = `
        <div class="relative cursor-pointer hover:scale-110 transition-transform">
          <div class="px-2 py-1 rounded-xl flex items-center gap-1 shadow-2xl border ${
            j.type === 'urgent'
              ? 'bg-red-500 text-white border-red-300 ring-2 ring-red-400/40 animate-pulse'
              : j.type === 'b2b'
              ? 'bg-purple-600 text-white border-purple-300'
              : 'bg-emerald-500 text-slate-950 border-emerald-300'
          }">
            <span class="text-[10px] font-black leading-none">+${j.fee.toLocaleString('fr-FR')} F</span>
          </div>
        </div>
      `;

      const jobMarker = L.marker([j.lat, j.lng], {
        icon: L.divIcon({
          className: 'job-radar-marker',
          html: jobIconHtml,
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        })
      });

      jobMarker.on('click', () => {
        setSelectedCourier(null);
        setSelectedJob(j);
      });

      markersGroup.addLayer(jobMarker);
    });

  }, [driverCoords, isOnline, radarRadiusKm, vehicleFilter, simulatedCouriers, radarJobs, language, driverCommune]);

  // Recenter Map
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([driverCoords.lat, driverCoords.lng], 14, {
        duration: 1.2
      });
      playGpsChime();
      addToast(
        language === 'en' ? "Radar Recentered" : "Radar Recentré",
        `${driverCommune} • GPS 100% Fixé`,
        "info"
      );
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div id="driver-radar-view" className="relative w-full h-[calc(100vh-130px)] min-h-[580px] rounded-3xl overflow-hidden bg-[#040814] border border-slate-800 shadow-2xl flex flex-col justify-between select-none">
      {/* Real Interactive Leaflet Map Container */}
      <div 
        ref={mapContainerRef} 
        id="leaflet-radar-map-canvas"
        className="absolute inset-0 w-full h-full z-0 bg-[#040814]"
      />

      {/* Rotating Radar Sweep Overlay */}
      {isOnline && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex items-center justify-center">
          <div 
            className="w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] rounded-full opacity-40 mix-blend-screen"
            style={{
              background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.45) 0deg, rgba(16, 185, 129, 0.06) 50deg, transparent 80deg, transparent 360deg)',
              animation: 'spin 4s linear infinite'
            }}
          />
        </div>
      )}

      {/* TOP HUD : Live Status & Fast Map Controls */}
      <div className="relative z-20 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Left: Driver GPS Commune Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#06102E]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700 shadow-2xl">
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="leading-tight">
            <span className="text-xs font-black text-white block">{driverCommune}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {driverCoords.lat.toFixed(3)}, {driverCoords.lng.toFixed(3)}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/30">
            {language === 'en' ? 'LIVE GPS' : 'GPS RÉEL'}
          </span>
        </div>

        {/* Right: Online Couriers Count + Map Style Toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="bg-[#06102E]/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-2 text-xs text-slate-300 font-bold">
            <Radio className={`w-4 h-4 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{simulatedCouriers.length + (isOnline ? 1 : 0)} {language === 'en' ? 'active couriers' : 'livreurs en ligne'}</span>
          </div>

          <button
            id="btn-radar-style-toggle"
            type="button"
            onClick={() => {
              const styles: ('dark' | 'streets' | 'satellite')[] = ['dark', 'streets', 'satellite'];
              const nextIndex = (styles.indexOf(mapStyle) + 1) % styles.length;
              setMapStyle(styles[nextIndex]);
              addToast(
                language === 'en' ? "Map Style" : "Style de Carte",
                styles[nextIndex] === 'satellite' ? "Vue Satellite HD" : styles[nextIndex] === 'streets' ? "Plan des Rues" : "Radar Nocturne VTC",
                "info"
              );
            }}
            className="p-2.5 rounded-2xl bg-[#06102E]/90 backdrop-blur-md border border-slate-700 text-sky-400 hover:text-white shadow-xl transition-all cursor-pointer active:scale-95"
            title={language === 'en' ? "Toggle Map Style (Night / Streets / Satellite)" : "Changer le style de carte (Nuit / Rues / Satellite)"}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Right Map Buttons (Zoom & Recenter) */}
      <div className="absolute right-3 sm:right-4 top-24 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          id="btn-radar-recenter"
          type="button"
          onClick={handleRecenter}
          className="p-2.5 rounded-2xl bg-[#06102E]/95 hover:bg-slate-800 border border-slate-700 text-emerald-400 shadow-xl transition-all cursor-pointer active:scale-90"
          title={language === 'en' ? "Recenter to my location" : "Recentrer sur ma position"}
        >
          <Locate className="w-4 h-4" />
        </button>

        <button
          id="btn-radar-zoom-in"
          type="button"
          onClick={handleZoomIn}
          className="p-2.5 rounded-2xl bg-[#06102E]/95 hover:bg-slate-800 border border-slate-700 text-white shadow-xl transition-all cursor-pointer active:scale-90"
          title="Zoom +"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          id="btn-radar-zoom-out"
          type="button"
          onClick={handleZoomOut}
          className="p-2.5 rounded-2xl bg-[#06102E]/95 hover:bg-slate-800 border border-slate-700 text-white shadow-xl transition-all cursor-pointer active:scale-90"
          title="Zoom -"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* BOTTOM SHEET / HUD CONTROLS */}
      <div className="relative z-20 m-2.5 sm:m-3.5 space-y-2.5">
        {/* Detail Popup Card for Selected Courier */}
        {selectedCourier && (
          <div className="p-3.5 rounded-2xl bg-[#080E1A]/95 backdrop-blur-md border border-sky-500/40 shadow-2xl animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg border border-sky-500/30">
                  {selectedCourier.vehicle === 'cargo' ? '🚛' : selectedCourier.vehicle === 'voiture' ? '🚗' : '🛵'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{selectedCourier.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {selectedCourier.plate} • {selectedCourier.commune} • ⭐ {selectedCourier.rating}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourier(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Detail Popup Card for Selected Delivery Opportunity */}
        {selectedJob && (
          <div className="p-3.5 rounded-2xl bg-[#080E1A]/95 backdrop-blur-md border border-emerald-500/40 shadow-2xl animate-in slide-in-from-bottom-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedJob.type === 'urgent' ? '🔥 URGENT' : selectedJob.type === 'b2b' ? '🏢 B2B' : '📦 COLIS'}
                </span>
                <span className="text-xs font-extrabold text-white truncate">{selectedJob.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-300">
                {selectedJob.pickupCommune} ➔ {selectedJob.dropoffCommune} ({selectedJob.distanceKm} km)
              </span>
              <span className="font-mono font-black text-emerald-400">
                +{selectedJob.fee.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        )}

        {/* Master Bottom Control Bar */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-[#06102E]/95 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Online/Offline Status Switch */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <button
              id="btn-radar-toggle-availability"
              type="button"
              onClick={() => {
                toggleDriverAvailability();
                playGpsChime();
              }}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isOnline ? (language === 'en' ? 'ONLINE (SCANNING)' : 'EN LIGNE (RADAR ACTIF)') : (language === 'en' ? 'OFFLINE' : 'HORS LIGNE')}</span>
            </button>

            {/* Radar Radius Range Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
              {[3, 5, 10].map(radius => (
                <button
                  key={radius}
                  type="button"
                  onClick={() => {
                    setRadarRadiusKm(radius);
                    addToast(
                      language === 'en' ? `Radar Range: ${radius} km` : `Portée Radar : ${radius} km`,
                      language === 'en' ? `Scanning radius adjusted to ${radius} km.` : `Rayon de détection ajusté à ${radius} km.`,
                      "info"
                    );
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    radarRadiusKm === radius
                      ? 'bg-emerald-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto justify-start sm:justify-end">
            {[
              { id: 'all', label: language === 'en' ? 'All' : 'Tous', icon: Filter },
              { id: 'moto', label: 'Motos', icon: Bike },
              { id: 'voiture', label: 'Autos', icon: Car },
              { id: 'cargo', label: 'Cargo', icon: Truck }
            ].map(f => {
              const Icon = f.icon;
              const isSelected = vehicleFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setVehicleFilter(f.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
