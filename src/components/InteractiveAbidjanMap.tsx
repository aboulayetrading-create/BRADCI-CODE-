import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { ALL_COMMUNES, ZoneCommune } from '../data/communes';
import { voiceNavigator } from '../utils/voiceNavigator';
import { Product } from '../types';

interface InteractiveAbidjanMapProps {
  onSelectProduct?: (prod: Product) => void;
  onClose?: () => void;
}

export const InteractiveAbidjanMap: React.FC<InteractiveAbidjanMapProps> = ({
  onSelectProduct,
  onClose
}) => {
  const { products, setProductDetailModal, userLocation, setUserManualLocation } = useApp();
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>('cocody');
  const [mapType, setMapType] = useState<'radar' | 'google' | 'yango'>('radar');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'all' | 'auction' | 'shop'>('all');

  const selectedCommune = ALL_COMMUNES.find(c => c.id === selectedCommuneId) || ALL_COMMUNES[0];

  // Products in selected commune
  const communeProducts = products.filter(p => 
    p.status === 'active' && 
    (p.commune.toLowerCase().includes(selectedCommune.name.toLowerCase()) || 
     selectedCommune.name.toLowerCase().includes(p.commune.toLowerCase()))
  );

  const filteredProducts = communeProducts.filter(p => {
    if (filterType === 'auction') return p.listingType === 'auction' || (!p.listingType && !p.shopId);
    if (filterType === 'shop') return p.listingType === 'shop' || !!p.shopId;
    return true;
  });

  const handleCommuneClick = (commune: ZoneCommune) => {
    setSelectedCommuneId(commune.id);
    const count = products.filter(p => p.commune.toLowerCase().includes(commune.name.toLowerCase())).length;
    
    if (isVoiceActive) {
      voiceNavigator.speak(
        `Commune de ${commune.name}. ${count} article${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}. ${commune.description}.`
      );
    }
  };

  const handleProductClick = (prod: Product) => {
    if (onSelectProduct) {
      onSelectProduct(prod);
    } else {
      setProductDetailModal(prod);
    }
  };

  // Google Maps & Yango Maps Iframe center
  const gmapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(selectedCommune.name + ', Abidjan, Côte d\'Ivoire')}&t=m&z=14&ie=UTF8&iwloc=&output=embed`;
  const yangoUrl = `https://yandex.com/map-widget/v1/?ll=${selectedCommune.coords.lng}%2C${selectedCommune.coords.lat}&z=14`;
  const gmapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCommune.name + ', Abidjan')}`;
  const yangoExternalUrl = `https://maps.yandex.com/?ll=${selectedCommune.coords.lng}%2C${selectedCommune.coords.lat}&z=14`;

  return (
    <div id="interactive-abidjan-map-container" className="rounded-3xl bg-[#080C14] border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Controls Header */}
      <div className="p-4 bg-[#0B111E] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Compass className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white font-display">
                Carte Interactive Grand Abidjan & Villes Balnéaires
              </h3>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                17 Zones Couvertes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Explorez les enchères, boutiques et coursiers géolocalisés en direct
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMapType('radar')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                mapType === 'radar' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📡 Radar</span>
            </button>
            <button
              onClick={() => setMapType('google')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                mapType === 'google' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🗺️ Google Maps</span>
            </button>
            <button
              onClick={() => setMapType('yango')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                mapType === 'yango' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🚕 Yango Maps</span>
            </button>
          </div>

          {/* Voice Toggle */}
          <button
            onClick={() => {
              const next = !isVoiceActive;
              setIsVoiceActive(next);
              voiceNavigator.setMuted(!next);
              if (next) voiceNavigator.speak("Guidage vocal de la carte activé");
            }}
            className={`p-2 rounded-xl border transition-all ${
              isVoiceActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Guidage vocal de la carte"
          >
            {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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

      {/* Main Grid: Map on Left, Commune Info & Products on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        {/* Left Column: Interactive Map View */}
        <div className="lg:col-span-8 bg-[#040711] relative border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden flex flex-col">
          {mapType === 'google' ? (
            <div className="w-full h-80 lg:h-full min-h-[380px] relative">
              <iframe
                title="Google Maps Commune View"
                src={gmapsUrl}
                className="w-full h-full border-0 filter contrast-105"
                loading="lazy"
                allowFullScreen
              />
              <div className="absolute bottom-3 left-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs text-white">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Zone Google Maps : <strong>{selectedCommune.name}</strong></span>
              </div>
              <a
                href={gmapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 bg-blue-600/90 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-lg backdrop-blur-sm hover:bg-blue-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir Google Maps</span>
              </a>
            </div>
          ) : mapType === 'yango' ? (
            <div className="w-full h-80 lg:h-full min-h-[380px] relative">
              <iframe
                title="Yango Maps Commune View"
                src={yangoUrl}
                className="w-full h-full border-0 filter contrast-105"
                loading="lazy"
                allowFullScreen
              />
              <div className="absolute bottom-3 left-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs text-white">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span>Zone Yango Maps : <strong>{selectedCommune.name}</strong></span>
              </div>
              <a
                href={yangoExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 bg-red-600/90 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-lg backdrop-blur-sm hover:bg-red-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir Yango App</span>
              </a>
            </div>
          ) : (
            <div className="w-full h-80 lg:h-full min-h-[380px] relative flex items-center justify-center fintech-grid">
              {/* Grand Abidjan Vector SVG Map with Clickable Hotspots */}
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 700 380">
                {/* Lagoon shape */}
                <path
                  d="M 0 200 Q 200 160, 360 210 T 700 190 L 700 280 Q 500 310, 240 270 T 0 260 Z"
                  fill="#0D2235"
                  stroke="#0284C7"
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
                <text x="310" y="240" fill="#0284C7" fontSize="12" fontWeight="bold" opacity="0.6">
                  Lagune Ébrié
                </text>

                {/* Major bridges */}
                <line x1="310" y1="160" x2="360" y2="260" stroke="#38BDF8" strokeWidth="4" strokeDasharray="3 2" />
                <line x1="230" y1="170" x2="240" y2="260" stroke="#94A3B8" strokeWidth="4" />
                <line x1="180" y1="175" x2="190" y2="260" stroke="#94A3B8" strokeWidth="4" />

                {/* Interactive Communes Pins */}
                {ALL_COMMUNES.slice(0, 15).map((commune, index) => {
                  // Coordinate layout mapping
                  const xPositions: Record<string, number> = {
                    cocody: 340,
                    plateau: 240,
                    marcory: 370,
                    treichville: 235,
                    koumassi: 480,
                    'port-bouet': 520,
                    yopougon: 120,
                    adjame: 230,
                    abobo: 250,
                    attecoube: 170,
                    bingerville: 580,
                    songon: 40,
                    anyama: 260,
                    'grand-bassam': 630,
                    assinie: 660,
                    dabou: 20
                  };

                  const yPositions: Record<string, number> = {
                    cocody: 110,
                    plateau: 155,
                    marcory: 270,
                    treichville: 265,
                    koumassi: 280,
                    'port-bouet': 320,
                    yopougon: 140,
                    adjame: 115,
                    abobo: 50,
                    attecoube: 135,
                    bingerville: 120,
                    songon: 170,
                    anyama: 25,
                    'grand-bassam': 330,
                    assinie: 345,
                    dabou: 190
                  };

                  const cx = xPositions[commune.id] || (100 + (index * 35) % 500);
                  const cy = yPositions[commune.id] || (80 + (index * 25) % 250);
                  const isSelected = selectedCommuneId === commune.id;
                  const count = products.filter(p => p.commune.toLowerCase().includes(commune.name.toLowerCase())).length;

                  return (
                    <g 
                      key={commune.id} 
                      onClick={() => handleCommuneClick(commune)}
                      className="cursor-pointer group"
                    >
                      {isSelected && (
                        <circle cx={cx} cy={cy} r="24" fill="rgba(245, 158, 11, 0.25)" className="animate-ping" />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? "14" : "10"}
                        fill={isSelected ? '#F59E0B' : count > 0 ? '#10B981' : '#334155'}
                        stroke="#FFFFFF"
                        strokeWidth={isSelected ? "2.5" : "1.5"}
                        className="transition-all group-hover:scale-125"
                      />
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fill="#0B111E"
                        fontSize={isSelected ? "9" : "8"}
                        fontWeight="900"
                      >
                        {count > 0 ? count : '•'}
                      </text>
                      <text
                        x={cx}
                        y={cy - 16}
                        textAnchor="middle"
                        fill={isSelected ? '#FDE68A' : '#E2E8F0'}
                        fontSize="10"
                        fontWeight={isSelected ? "bold" : "normal"}
                        className="pointer-events-none drop-shadow-md"
                      >
                        {commune.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Bottom Commune Bar for Quick Click */}
              <div className="absolute bottom-3 inset-x-3 bg-[#0B111E]/95 backdrop-blur-md border border-slate-800 p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-xl">
                {ALL_COMMUNES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleCommuneClick(c)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                      selectedCommuneId === c.id
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Commune Insights & Live Products */}
        <div className="lg:col-span-4 p-4 bg-[#090E1A] flex flex-col justify-between overflow-y-auto max-h-[500px]">
          <div>
            {/* Commune Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <h4 className="text-base font-extrabold text-white font-display">
                    {selectedCommune.name}
                  </h4>
                </div>
                <button
                  onClick={() => handleCommuneClick(selectedCommune)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
                  title="Écouter la présentation vocale"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {selectedCommune.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tarif Course Moto</span>
                  <span className="font-mono-num font-extrabold text-emerald-400">
                    {selectedCommune.baseDeliveryFeeMoto.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Disponibilité GPS</span>
                  <span className="font-bold text-blue-400">100% Couvert</span>
                </div>
              </div>

              {/* Set as User Location */}
              <button
                onClick={() => setUserManualLocation(selectedCommune.name)}
                className="w-full mt-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Définir comme ma position d'achat</span>
              </button>
            </div>

            {/* Products Filter Tabs */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">
                Articles en vente ({filteredProducts.length})
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded font-bold ${filterType === 'all' ? 'bg-white text-slate-950' : 'text-slate-400'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterType('auction')}
                  className={`px-2 py-0.5 rounded font-bold ${filterType === 'auction' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Enchères
                </button>
                <button
                  onClick={() => setFilterType('shop')}
                  className={`px-2 py-0.5 rounded font-bold ${filterType === 'shop' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Boutiques
                </button>
              </div>
            </div>

            {/* Products List in this Commune */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
                  Aucun article actif dans cette commune pour le moment.
                </div>
              ) : (
                filteredProducts.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleProductClick(prod)}
                    className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between gap-2.5 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={prod.imageUrl}
                        alt={prod.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{prod.title}</p>
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
