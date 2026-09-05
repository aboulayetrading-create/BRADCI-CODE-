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
  FileCheck
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
  const isOnline = currentUser?.isOnline ?? true;
  const driverActiveJob = isDriver && freightJobs ? freightJobs.find(j => j.assignedDriverId === currentUser.id && j.status !== 'delivered' && j.status !== 'cancelled') : null;
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

  // Couriers / Drivers get a dedicated "Yango Pro" delivery mobile bottom bar
  if (isDriver) {
    return (
      <nav 
        id="mobile-bottom-nav-driver" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1021]/95 backdrop-blur-xl border-t border-[#222D4A] px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] shadow-2xl"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* 1. Bourse aux Courses */}
          <button
            id="btn-driver-mobile-orders"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('available_orders');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'available_orders' }));
            }}
            className={`relative flex flex-col items-center justify-center w-12 py-1 rounded-xl transition-all cursor-pointer ${
              activeDriverTab === 'available_orders' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <Package className={`w-5 h-5 ${activeDriverTab === 'available_orders' ? 'text-emerald-400' : 'text-slate-400'}`} />
            {availableOrdersCount > 0 && (
              <span className="absolute top-0 right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono-num font-black text-[9px] flex items-center justify-center border border-[#0B1021]">
                {availableOrdersCount}
              </span>
            )}
            <span className="text-[10px] mt-0.5 tracking-tight">Courses</span>
          </button>

          {/* 2. Cockpit GPS Active Mission */}
          <button
            id="btn-driver-mobile-mission"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('active_mission');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'active_mission' }));
            }}
            className={`relative flex flex-col items-center justify-center w-12 py-1 rounded-xl transition-all cursor-pointer ${
              activeDriverTab === 'active_mission' ? 'text-cyan-300 font-black' : 'text-slate-400 hover:text-blue-400'
            }`}
          >
            <Navigation className={`w-5 h-5 ${activeDriverTab === 'active_mission' ? 'text-cyan-300' : 'text-slate-400'}`} />
            {driverActiveJob && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
            <span className="text-[10px] mt-0.5 tracking-tight">Mission</span>
          </button>

          {/* 3. Central Availability Switch (Yango Pro Style) */}
          <button
            id="btn-driver-mobile-availability"
            onClick={toggleDriverAvailability}
            className={`flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-2xl shadow-xl border-2 border-[#0B1021] active:scale-95 transition-all cursor-pointer ${
              isOnline
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={isOnline ? 'En service - Cliquer pour passer en pause' : 'En pause - Cliquer pour passer en service'}
          >
            <Power className={`w-6 h-6 stroke-[2.5] ${isOnline ? 'text-slate-950' : 'text-red-400'}`} />
            <span className="sr-only">Statut service</span>
          </button>

          {/* 4. Gains & Reçus */}
          <button
            id="btn-driver-mobile-earnings"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('history');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'history' }));
            }}
            className={`flex flex-col items-center justify-center w-12 py-1 rounded-xl transition-all cursor-pointer ${
              activeDriverTab === 'history' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <Receipt className={`w-5 h-5 ${activeDriverTab === 'history' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Gains</span>
          </button>

          {/* 5. Véhicule & KYC */}
          <button
            id="btn-driver-mobile-profile"
            onClick={() => {
              setActiveTab('dashboard_driver');
              setActiveDriverTab('profile');
              window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'profile' }));
            }}
            className={`flex flex-col items-center justify-center w-12 py-1 rounded-xl transition-all cursor-pointer ${
              activeDriverTab === 'profile' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className={`w-5 h-5 ${activeDriverTab === 'profile' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Véhicule</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav 
      id="mobile-bottom-nav" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1021]/95 backdrop-blur-xl border-t border-[#222D4A] px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] shadow-2xl"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Explore / Auctions */}
        <button
          id="btn-mobile-nav-explore"
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center justify-center w-11 py-1 rounded-xl transition-all ${
            activeTab === 'explore' || activeTab === 'feed'
              ? 'text-[#FF5B00] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gavel className={`w-5 h-5 ${activeTab === 'explore' ? 'text-[#FF5B00] scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">{translate("Enchères", "Auctions")}</span>
        </button>

        {/* 2. Cart Tab with Live Badge */}
        <button
          id="btn-mobile-nav-cart"
          onClick={() => setCartModalOpen(true)}
          className="relative flex flex-col items-center justify-center w-11 py-1 rounded-xl text-slate-400 hover:text-amber-400 transition-all"
        >
          <ShoppingCart className="w-5 h-5 text-amber-400" />
          {cart.length > 0 && (
            <span className="absolute top-0 right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-amber-500 text-slate-950 font-mono-num font-black text-[9px] flex items-center justify-center border border-[#0B1021]">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
          <span className="text-[10px] mt-0.5 tracking-tight">{translate("Panier", "Cart")}</span>
        </button>

        {/* 3. Central Sell Action Button (Prominent Vibrant Orange #FF5B00) */}
        <button
          id="btn-mobile-nav-sell"
          onClick={handleSellClick}
          className="flex flex-col items-center justify-center -mt-4 bg-[#FF5B00] hover:bg-[#E05000] text-white w-12 h-12 rounded-2xl shadow-xl shadow-[#FF5B00]/30 border-2 border-[#0B1021] active:scale-95 transition-all cursor-pointer"
          title={translate("Publier une enchère", "Post an auction")}
        >
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          <span className="sr-only">{translate("Vendre", "Sell")}</span>
        </button>

        {/* 4. Notifications Tab with Live Badge */}
        <button
          id="btn-mobile-nav-notifs"
          onClick={() => setNotificationsModalOpen(true)}
          className="relative flex flex-col items-center justify-center w-11 py-1 rounded-xl text-slate-400 hover:text-[#FF5B00] transition-all"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0 right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-white font-mono-num font-black text-[9px] flex items-center justify-center border border-[#0B1021] animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5 tracking-tight">{translate("Notifs", "Notifs")}</span>
        </button>

        {/* 5. Profile / Role Space */}
        <button
          id="btn-mobile-nav-profile"
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center w-11 py-1 rounded-xl transition-all ${
            isProfileActive
              ? 'text-[#1E53E5] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {currentUser?.role === 'driver' ? (
            <Bike className="w-5 h-5" />
          ) : currentUser?.role === 'admin' ? (
            <ShieldCheck className="w-5 h-5" />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-0.5 tracking-tight">
            {currentUser 
              ? (currentUser.role === 'driver' ? translate('Livreur', 'Courier') : currentUser.role === 'admin' ? 'Admin' : translate('Moi', 'Me'))
              : translate('Profil', 'Profile')}
          </span>
        </button>
      </div>
    </nav>
  );
};

