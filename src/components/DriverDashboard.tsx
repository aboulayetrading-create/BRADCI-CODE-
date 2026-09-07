import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Navigation, 
  Package, 
  TrendingUp, 
  Receipt, 
  Settings, 
  Power,
  ShieldCheck,
  Bike,
  Car,
  Truck
} from 'lucide-react';
import { DriverTab } from '../types';
import { DriverRadarView } from './DriverRadarView';
import { DriverSmartOrdersView } from './DriverSmartOrdersView';
import { DriverEarningsView } from './DriverEarningsView';
import { DriverHistoryView } from './DriverHistoryView';
import { DriverSettingsView } from './DriverSettingsView';

export const DriverDashboard: React.FC = () => {
  const { 
    currentUser, 
    freightJobs, 
    activeDriverTab, 
    setActiveDriverTab,
    toggleDriverAvailability 
  } = useApp();

  // Listen to global custom events (e.g. from MobileBottomNav or quick actions)
  useEffect(() => {
    const handleDriverTab = (e: any) => {
      if (e.detail) {
        const tab = e.detail as DriverTab;
        setActiveDriverTab(tab);
      }
    };
    window.addEventListener('bradci_driver_tab', handleDriverTab);
    return () => window.removeEventListener('bradci_driver_tab', handleDriverTab);
  }, [setActiveDriverTab]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Chargement de l'espace livreur...
      </div>
    );
  }

  const isOnline = currentUser.driverAvailability !== 'offline';
  const myActiveJob = freightJobs.find(j => (j.assignedDriverId === currentUser.id || j.driverId === currentUser.id) && ['assigned', 'accepted', 'picked_up', 'in_transit', 'arrived'].includes(j.status));
  const availableOrdersCount = freightJobs.filter(j => j.status === 'available' || j.status === 'pending_driver').length;
  const completedJobsCount = freightJobs.filter(j => (j.assignedDriverId === currentUser.id || j.driverId === currentUser.id) && ['delivered', 'returned'].includes(j.status)).length;

  const vehicleType = currentUser.kycVehicleType || currentUser.vehicleDetails?.type || 'moto';
  const VehicleIcon = vehicleType === 'car' ? Car : vehicleType === 'cargo' ? Truck : Bike;

  return (
    <div id="driver-workspace-container" className="space-y-4 max-w-7xl mx-auto pb-24 sm:pb-8">
      {/* 1. Header Bar: Driver ID, Vehicle Info, Online Status Toggle & Navigation */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Driver identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img 
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                alt={currentUser.name} 
                className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0C121E] ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">{currentUser.name}</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Vérifié</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-slate-300">ID: {currentUser.driverMatricule || 'CI-BRAD-094'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <VehicleIcon className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>{currentUser.vehicleDetails?.model || currentUser.kycVehicleModel || 'Yamaha Crux 110'}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                    {currentUser.vehicleDetails?.plate || '4589 JJ 01'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Online / Offline Toggle */}
          <div className="flex items-center gap-2">
            <button
              id="driver-header-toggle-status"
              onClick={toggleDriverAvailability}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isOnline ? 'EN SERVICE (EN LIGNE)' : 'HORS LIGNE (EN PAUSE)'}</span>
            </button>
          </div>
        </div>

        {/* 2. Five Main Driver Workspace Tabs */}
        <div 
          id="driver-dashboard-nav-bar"
          aria-label="Navigation Espace Livreur"
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800/80"
        >
          {/* Tab 1: Radar */}
          <button
            id="driver-tab-radar"
            onClick={() => setActiveDriverTab('radar')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDriverTab === 'radar' || activeDriverTab === 'radar_map'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>Radar</span>
          </button>

          {/* Tab 2: Courses */}
          <button
            id="driver-tab-orders"
            onClick={() => setActiveDriverTab('orders')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDriverTab === 'orders' || activeDriverTab === 'available_orders' || activeDriverTab === 'active_mission'
                ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/20 font-black'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4 text-[#F97316]" />
            <span>Courses</span>
            {myActiveJob ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] animate-pulse">
                EN MISSION
              </span>
            ) : availableOrdersCount > 0 ? (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-num font-black ${
                activeDriverTab === 'orders' || activeDriverTab === 'available_orders' ? 'bg-slate-950/30 text-white' : 'bg-slate-800 text-[#F97316]'
              }`}>
                {availableOrdersCount}
              </span>
            ) : null}
          </button>

          {/* Tab 3: Revenus */}
          <button
            id="driver-tab-earnings"
            onClick={() => setActiveDriverTab('earnings')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDriverTab === 'earnings'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Revenus</span>
          </button>

          {/* Tab 4: Historique */}
          <button
            id="driver-tab-history"
            onClick={() => setActiveDriverTab('history')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDriverTab === 'history'
                ? 'bg-slate-800 text-white border border-slate-700 font-black shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4 text-slate-300" />
            <span>Historique</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-num bg-slate-800 text-emerald-400 border border-slate-700">
              {completedJobsCount}
            </span>
          </button>

          {/* Tab 5: Paramètres */}
          <button
            id="driver-tab-settings"
            onClick={() => setActiveDriverTab('settings')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDriverTab === 'settings' || activeDriverTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span>Paramètres</span>
          </button>
        </div>
      </div>

      {/* 3. Five Distinct Driver Workspace Tab Views */}
      <div className="w-full">
        {/* 1. ONGLET RADAR: Carte plein écran & statut uniquement, aucun élément parasite */}
        {(activeDriverTab === 'radar' || activeDriverTab === 'radar_map') && (
          <DriverRadarView />
        )}

        {/* 2. ONGLET COURSES: Attribution intelligente par proximité GPS, cascade 30s & chaînage */}
        {(activeDriverTab === 'orders' || activeDriverTab === 'available_orders' || activeDriverTab === 'active_mission') && (
          <DriverSmartOrdersView onSwitchToRadar={() => setActiveDriverTab('radar')} />
        )}

        {/* 3. ONGLET REVENUS: Tableau de bord financier (Heure/Jour/Semaine/Année) + Retrait Wave/MoMo */}
        {activeDriverTab === 'earnings' && (
          <DriverEarningsView />
        )}

        {/* 4. ONGLET HISTORIQUE: Livraisons clôturées, paiements débloqués & bordereaux électroniques */}
        {activeDriverTab === 'history' && (
          <DriverHistoryView />
        )}

        {/* 5. NOUVEL ONGLET PARAMÈTRES: KYC, Thème sombre/clair, Langue, Voix Off / Alertes sonores */}
        {(activeDriverTab === 'settings' || activeDriverTab === 'profile') && (
          <DriverSettingsView />
        )}
      </div>
    </div>
  );
};
