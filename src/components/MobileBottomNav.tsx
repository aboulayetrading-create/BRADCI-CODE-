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
  Bell
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
    translate
  } = useApp();

  const handleSellClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
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

  return (
    <nav 
      id="mobile-bottom-nav" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C14]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 shadow-2xl safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Explore / Auctions */}
        <button
          id="btn-mobile-nav-explore"
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center justify-center w-12 py-1 rounded-xl transition-all ${
            activeTab === 'explore' || activeTab === 'feed'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gavel className={`w-5 h-5 ${activeTab === 'explore' ? 'text-amber-400 scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">{translate("Enchères", "Auctions")}</span>
        </button>

        {/* 2. Notifications Tab with Live Badge */}
        <button
          id="btn-mobile-nav-notifs"
          onClick={() => setNotificationsModalOpen(true)}
          className="relative flex flex-col items-center justify-center w-12 py-1 rounded-xl text-slate-400 hover:text-amber-300 transition-all"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0 right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-white font-mono-num font-black text-[9px] flex items-center justify-center border border-[#080C14] animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5 tracking-tight">{translate("Notifs", "Notifs")}</span>
        </button>

        {/* 3. Central Sell Action Button (Prominent) */}
        <button
          id="btn-mobile-nav-sell"
          onClick={handleSellClick}
          className="flex flex-col items-center justify-center -mt-4 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 w-12 h-12 rounded-2xl shadow-xl shadow-amber-500/30 border-2 border-[#080C14] active:scale-95 transition-transform"
          title={translate("Publier une enchère", "Post an auction")}
        >
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          <span className="sr-only">{translate("Vendre", "Sell")}</span>
        </button>

        {/* 4. Pass & Tarifs */}
        <button
          id="btn-mobile-nav-pricing"
          onClick={() => setPricingModalOpen(true)}
          className={`flex flex-col items-center justify-center w-12 py-1 rounded-xl transition-all ${
            activeTab === 'tarifs'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">{translate("Tarifs", "Rates")}</span>
        </button>

        {/* 5. Profile / Role Space */}
        <button
          id="btn-mobile-nav-profile"
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center w-12 py-1 rounded-xl transition-all ${
            isProfileActive
              ? 'text-amber-400 font-bold'
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
