import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Gavel, 
  PlusCircle, 
  User, 
  Bike, 
  ShieldCheck, 
  Navigation, 
  Sparkles,
  Bell,
  ShoppingCart,
  Package,
  Receipt,
  Power,
  FileCheck,
  TrendingUp,
  Settings,
  Radio
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    setAuthModalOpen, 
    setPricingModalOpen, 
    setNewProductModalOpen,
    setGpsModalOpen,
    userLocation,
    unreadNotificationsCount,
    setNotificationsModalOpen,
    cart,
    setCartModalOpen,
    checkKycVerifiedOrPrompt,
    translate,
    toggleDriverAvailability,
    freightJobs,
    activeDriverTab,
    setActiveDriverTab
  } = useApp();

  const isDriver = currentUser?.role === 'driver';
  const isOnline = currentUser?.driverAvailability !== 'offline';
  const driverActiveJob = isDriver && freightJobs ? freightJobs.find(j => (j.assignedDriverId === currentUser.id || j.assignedDriverName === currentUser.name) && j.status !== 'delivered' && j.status !== 'cancelled') : null;
  const availableOrdersCount = isDriver && freightJobs ? freightJobs.filter(j => j.status === 'available').length : 0;

  const handleSellClick = () => {
    // Just-in-time KYC restriction: user cannot sell without verified KYC
    if (!checkKycVerifiedOrPrompt('sell')) {
      return;
    }
    setNewProductModalOpen(true);
  };

  const handleProfileClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (currentUser.role === 'client') setActiveTab('dashboard_client');
    else if (currentUser.role === 'driver') setActiveTab('dashboard_driver');
    else if (currentUser.role === 'admin') setActiveTab('dashboard_admin');
    else setActiveTab('explore');
  };

  const isProfileActive = 
    activeTab === 'dashboard_client' || 
    activeTab === 'dashboard_driver' || 
    activeTab === 'dashboard_admin';

  // Couriers / Drivers get the 5 dedicated delivery bottom navigation tabs
  if (isDriver) {
    const isRadarActive = activeDriverTab === 'radar' || activeDriverTab === 'radar_map';
    const isOrdersActive = activeDriverTab === 'orders' || activeDriverTab === 'available_orders' || activeDriverTab === 'active_mission';
    const isEarningsActive = activeDriverTab === 'earnings';
    const isHistoryActive = activeDriverTab === 'history';
    const isSettingsActive = activeDriverTab === 'settings' || activeDriverTab === 'profile';

    return (
      <nav 
        id="mobile-bottom-nav-driver" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#06102E]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl transition-colors duration-200"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* 1. ONGLET RADAR */}
          <button
            id="btn-driver-mobile-radar"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('radar');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'radar' }));
            }}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              isRadarActive ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            <Navigation className={`w-5 h-5 ${isRadarActive ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.5]' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] mt-1 font-bold tracking-tight">Radar</span>
          </button>

          {/* 2. ONGLET COURSES */}
          <button
            id="btn-driver-mobile-orders"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('orders');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'orders' }));
            }}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              isOrdersActive ? 'text-[#FF5B00] font-black' : 'text-slate-500 dark:text-slate-400 hover:text-[#FF5B00]'
            }`}
          >
            <Package className={`w-5 h-5 ${isOrdersActive ? 'text-[#FF5B00] stroke-[2.5]' : 'text-slate-500 dark:text-slate-400'}`} />
            {driverActiveJob ? (
              <span className="absolute top-0 right-3 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            ) : availableOrdersCount > 0 ? (
              <span className="absolute top-0 right-3 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#FF5B00] text-white font-mono font-black text-[9px] flex items-center justify-center border border-white dark:border-[#06102E]">
                {availableOrdersCount}
              </span>
            ) : null}
            <span className="text-[10px] mt-1 font-bold tracking-tight">Courses</span>
          </button>

          {/* 3. ONGLET REVENUS */}
          <button
            id="btn-driver-mobile-earnings"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('earnings');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'earnings' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              isEarningsActive ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            <TrendingUp className={`w-5 h-5 ${isEarningsActive ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.5]' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] mt-1 font-bold tracking-tight">Revenus</span>
          </button>

          {/* 4. ONGLET HISTORIQUE */}
          <button
            id="btn-driver-mobile-history"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('history');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'history' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              isHistoryActive ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className={`w-5 h-5 ${isHistoryActive ? 'text-slate-900 dark:text-white stroke-[2.5]' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] mt-1 font-bold tracking-tight">Historique</span>
          </button>

          {/* 5. NOUVEL ONGLET PARAMÈTRES */}
          <button
            id="btn-driver-mobile-settings"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('settings');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'settings' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              isSettingsActive ? 'text-[#1E53E5] font-black' : 'text-slate-500 dark:text-slate-400 hover:text-[#1E53E5]'
            }`}
          >
            <Settings className={`w-5 h-5 ${isSettingsActive ? 'text-[#1E53E5] stroke-[2.5]' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] mt-1 font-bold tracking-tight">Paramètres</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav 
      id="mobile-bottom-nav" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-[#0B1021]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#222D4A] px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] shadow-xl transition-colors duration-200"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Explore / Auctions */}
        <button
          id="btn-mobile-nav-explore"
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'explore' || activeTab === 'feed'
              ? 'text-[#FF5B00] font-black'
              : 'text-slate-700 hover:text-[#0B1B3D] dark:text-slate-400 dark:hover:text-slate-200 font-bold'
          }`}
        >
          <Gavel className={`w-5 h-5 ${activeTab === 'explore' ? 'text-[#FF5B00] scale-110' : 'text-slate-600 dark:text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center font-bold">
            {translate("Enchères", "Auctions")}
          </span>
        </button>

        {/* 2. NOUVEL ONGLET : COURSIER EXPRESS (POINT A ➔ POINT B) */}
        <button
          id="btn-mobile-nav-express-courier"
          onClick={() => setActiveTab('express_courier')}
          className={`relative flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'express_courier' || activeTab === 'coursier_express' || activeTab === 'coursier'
              ? 'text-[#1E53E5] font-black'
              : 'text-slate-700 hover:text-[#1E53E5] dark:text-slate-400 dark:hover:text-blue-300 font-bold'
          }`}
        >
          <div className="relative">
            <Bike className={`w-5 h-5 ${
              activeTab === 'express_courier' || activeTab === 'coursier_express' || activeTab === 'coursier'
                ? 'text-[#1E53E5] scale-110' 
                : 'text-slate-600 dark:text-slate-400'
            }`} />
            <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-[#1E53E5] text-white text-[7.5px] font-black uppercase tracking-tighter scale-90 shadow-xs">
              EXP
            </span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center font-bold">
            {translate("Coursier", "Courier")}
          </span>
        </button>

        {/* 3. Cart Tab with Live Badge */}
        <button
          id="btn-mobile-nav-cart"
          onClick={() => setCartModalOpen(true)}
          className="relative flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-xl text-slate-700 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 font-bold transition-all cursor-pointer"
        >
          <ShoppingCart className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {cart.length > 0 && (
            <span className="absolute top-0 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#FF5B00] text-white font-mono-num font-black text-[8.5px] flex items-center justify-center border border-white dark:border-[#0B1021]">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center font-bold">{translate("Panier", "Cart")}</span>
        </button>

        {/* 4. Central Sell Action Button (Prominent Vibrant Orange #FF5B00) */}
        <button
          id="btn-mobile-nav-sell"
          onClick={handleSellClick}
          className="flex flex-col items-center justify-center -mt-3.5 bg-[#FF5B00] hover:bg-[#E05000] text-white w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-xl shadow-[#FF5B00]/30 border-2 border-white dark:border-[#0B1021] active:scale-95 transition-all cursor-pointer shrink-0"
          title={translate("Publier une annonce ou enchère", "Post an auction")}
        >
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          <span className="sr-only">{translate("Vendre", "Sell")}</span>
        </button>

        {/* 5. Notifications Tab with Live Badge */}
        <button
          id="btn-mobile-nav-notifs"
          onClick={() => setNotificationsModalOpen(true)}
          className="relative flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-xl text-slate-700 hover:text-[#FF5B00] dark:text-slate-400 dark:hover:text-[#FF5B00] font-bold transition-all cursor-pointer"
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white font-mono-num font-black text-[8.5px] flex items-center justify-center border border-white dark:border-[#0B1021] animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center font-bold">{translate("Notifs", "Notifs")}</span>
        </button>

        {/* 6. Profile / Role Space */}
        <button
          id="btn-mobile-nav-profile"
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-xl transition-all cursor-pointer ${
            isProfileActive
              ? 'text-[#1E53E5] font-black'
              : 'text-slate-700 hover:text-[#0B1B3D] dark:text-slate-400 dark:hover:text-slate-200 font-bold'
          }`}
        >
          {currentUser?.role === 'driver' ? (
            <Bike className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          ) : currentUser?.role === 'admin' ? (
            <ShieldCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          ) : (
            <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          )}
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center font-bold">
            {currentUser 
              ? (currentUser.role === 'driver' ? translate('Livreur', 'Courier') : currentUser.role === 'admin' ? 'Admin' : translate('Moi', 'Me'))
              : translate('Profil', 'Profile')}
          </span>
        </button>
      </div>
    </nav>
  );
};

