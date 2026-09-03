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
  ShoppingCart
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
    translate
  } = useApp();

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

