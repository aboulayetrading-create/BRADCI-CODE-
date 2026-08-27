import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  CheckCircle2, 
  Sparkles, 
  X,
  Crosshair,
  Building2,
  Lock
} from 'lucide-react';
import { ALL_COMMUNES } from '../data/communes';

export const GpsModal: React.FC = () => {
  const { 
    gpsModalOpen, 
    setGpsModalOpen, 
    userLocation, 
    gpsPermissionStatus, 
    requestGpsPermission, 
    setUserManualLocation 
  } = useApp();

  const [loadingGps, setLoadingGps] = useState(false);
  const [selectedCommune, setSelectedCommune] = useState<string>(userLocation?.commune || 'Cocody');

  if (!gpsModalOpen) return null;

  const handleRequestNativeGPS = async () => {
    setLoadingGps(true);
    try {
      await requestGpsPermission(true);
    } finally {
      setLoadingGps(false);
    }
  };

  const handleManualCommuneSelect = (communeName: string) => {
    setSelectedCommune(communeName);
    setUserManualLocation(communeName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="gps-activation-modal"
        className="w-full max-w-xl bg-[#0B111E] border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto text-white"
      >
        {/* Close Button (if user has already a location set) */}
        {userLocation && (
          <button
            onClick={() => setGpsModalOpen(false)}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Security / Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sécurité & Proximité Brad'CI</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/30">
            <Lock className="w-3 h-3" />
            <span>Obligatoire</span>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-white font-display mb-2">
          Activer la Géolocalisation GPS
        </h2>
        
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Pour garantir la sécurité des transactions sous séquestre, le calcul précis des frais de livraison et la mise en relation avec les livreurs les plus proches, l'accès à votre position géographique est obligatoire.
        </p>

        {/* Current status banner */}
        <div className={`p-4 rounded-2xl border mb-6 flex items-start gap-3.5 ${
          gpsPermissionStatus === 'granted' && userLocation
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : gpsPermissionStatus === 'denied'
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          {gpsPermissionStatus === 'granted' && userLocation ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : gpsPermissionStatus === 'denied' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Crosshair className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              {gpsPermissionStatus === 'granted' && userLocation
                ? `GPS Actif : ${userLocation.commune}`
                : gpsPermissionStatus === 'denied'
                ? 'Signal GPS navigateur refusé ou simulé'
                : 'En attente d\'activation GPS'}
            </p>
            {userLocation && (
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Lat: {userLocation.lat.toFixed(4)} | Lng: {userLocation.lng.toFixed(4)} ({userLocation.commune})
              </p>
            )}
          </div>
        </div>

        {/* Primary Action: Browser GPS */}
        <button
          id="btn-enable-browser-gps"
          onClick={handleRequestNativeGPS}
          disabled={loadingGps}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 mb-4"
        >
          {loadingGps ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          <span>Autoriser ma Position GPS Automatique</span>
        </button>

        {/* Or pick commune in Grand Abidjan */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-3 bg-[#0B111E] text-xs uppercase font-bold text-slate-500 tracking-wider">
            Ou sélectionnez votre commune à Abidjan
          </span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Commune de résidence / Enlèvement :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {ALL_COMMUNES.map((commune) => {
              const isSelected = selectedCommune.toLowerCase() === commune.name.toLowerCase();
              return (
                <button
                  key={commune.id}
                  onClick={() => handleManualCommuneSelect(commune.name)}
                  className={`p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="truncate">{commune.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Grand Abidjan & Villes Balnéaires</span>
          </div>
          <button
            onClick={() => setGpsModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Valider et Continuer
          </button>
        </div>
      </div>
    </div>
  );
};
