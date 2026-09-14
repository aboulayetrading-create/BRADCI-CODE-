import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BradCiLogo } from './BradCiLogo';
import { 
  Gavel, 
  ShieldCheck, 
  Clock,
  PlusCircle, 
  User, 
  Bike, 
  Layers, 
  LogOut, 
  Lock, 
  Sparkles, 
  Menu, 
  X,
  CreditCard,
  PhoneCall,
  Crown,
  MapPin,
  Navigation,
  Bell,
  Building2,
  ShoppingCart,
  Settings,
  Power,
  Package,
  Receipt,
  FileCheck,
  TrendingUp,
  Volume2,
  VolumeX,
  Mic,
  Sun,
  Moon,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  Coins,
  Check
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    setAuthModalOpen, 
    setPricingModalOpen, 
    setNewProductModalOpen,
    userLocation,
    gpsPermissionStatus,
    setGpsModalOpen,
    logout,
    canUserPublishProduct,
    unreadNotificationsCount,
    setNotificationsModalOpen,
    language,
    setLanguage,
    currency,
    setCurrency,
    formatCurrency,
    t,
    translate,
    theme,
    setTheme,
    effectiveTheme,
    toggleTheme,
    voiceEnabled,
    toggleVoice,
    readCurrentScreenAloud,
    setKycModalOpen,
    checkKycVerifiedOrPrompt,
    cart,
    setCartModalOpen,
    toggleDriverAvailability,
    freightJobs,
    activeDriverTab,
    setActiveDriverTab
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSellClick = () => {
    // Just-in-time KYC restriction: user cannot sell without verified KYC
    if (!checkKycVerifiedOrPrompt('sell')) {
      return;
    }
    setNewProductModalOpen(true);
  };

  const publishQuota = currentUser ? canUserPublishProduct(currentUser) : null;
  const isDriver = currentUser?.role === 'driver';
  const driverActiveMission = isDriver && freightJobs ? freightJobs.some(j => j.assignedDriverId === currentUser.id && j.status !== 'delivered' && j.status !== 'cancelled') : false;
  const availableJobsCount = isDriver && freightJobs ? freightJobs.filter(j => j.status === 'available').length : 0;

  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-[#0B1021]/95 backdrop-blur-md border-b border-[#222D4A] transition-colors">
      <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[68px] gap-1 sm:gap-2 lg:gap-3 w-full min-w-0 overflow-x-auto no-scrollbar">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button 
              id="nav-logo"
              onClick={() => setActiveTab(isDriver ? 'dashboard_driver' : 'explore')}
              className="flex items-center text-left group focus:outline-none transition-transform active:scale-95 shrink-0 cursor-pointer"
            >
              <BradCiLogo 
                size="sm" 
                showIcon={true} 
                showSubtitle={false} 
              />
            </button>

            {/* Direct POD Guarantee Pill */}
            <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] bg-[#1E53E5]/10 text-[#467BFF] px-2.5 py-1 rounded-full border border-[#1E53E5]/30 whitespace-nowrap shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E53E5] shrink-0" />
              <span className="font-semibold">{translate("Paiement Direct à la Livraison", "Direct Pay on Delivery")}</span>
            </div>
          </div>

          {/* Desktop Navigation Links (Strict RBAC Routing) */}
          {isDriver ? (
            <nav id="nav-desktop-driver" className="hidden lg:flex items-center justify-center gap-0.5 xl:gap-1.5 flex-1 min-w-0 px-1">
              {/* 1. Radar */}
              <button
                id="nav-tab-driver-radar"
                onClick={() => {
                  setActiveTab('dashboard_driver');
                  setActiveDriverTab('radar');
                  window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'radar' }));
                }}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 xl:gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard_driver' && (activeDriverTab === 'radar' || activeDriverTab === 'radar_map')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{translate("Radar", "Radar")}</span>
              </button>

              {/* 2. Courses */}
              <button
                id="nav-tab-driver-jobs"
                onClick={() => {
                  setActiveTab('dashboard_driver');
                  setActiveDriverTab('orders');
                  window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'orders' }));
                }}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 xl:gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard_driver' && (activeDriverTab === 'orders' || activeDriverTab === 'available_orders' || activeDriverTab === 'active_mission')
                    ? 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                <span>{translate("Courses", "Deliveries")}</span>
                {driverActiveMission ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ) : availableJobsCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#F97316] text-white font-mono-num font-black text-[10px]">
                    {availableJobsCount}
                  </span>
                ) : null}
              </button>

              {/* 3. Revenus */}
              <button
                id="nav-tab-driver-earnings"
                onClick={() => {
                  setActiveTab('dashboard_driver');
                  setActiveDriverTab('earnings');
                  window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'earnings' }));
                }}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 xl:gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard_driver' && activeDriverTab === 'earnings'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{translate("Revenus", "Earnings")}</span>
              </button>

              {/* 4. Historique */}
              <button
                id="nav-tab-driver-history"
                onClick={() => {
                  setActiveTab('dashboard_driver');
                  setActiveDriverTab('history');
                  window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'history' }));
                }}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 xl:gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard_driver' && activeDriverTab === 'history'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span>{translate("Historique", "History")}</span>
              </button>

              {/* 5. Paramètres */}
              <button
                id="nav-tab-driver-settings"
                onClick={() => {
                  setActiveTab('dashboard_driver');
                  setActiveDriverTab('settings');
                  window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'settings' }));
                }}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 xl:gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard_driver' && (activeDriverTab === 'settings' || activeDriverTab === 'profile')
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{translate("Paramètres", "Settings")}</span>
              </button>
            </nav>
          ) : (
            <nav id="nav-desktop-client" className="hidden lg:flex items-center justify-center gap-0.5 xl:gap-1.5 flex-1 min-w-0 px-1">
              {/* Feed / Explore */}
              <button
                id="nav-tab-explore"
                onClick={() => setActiveTab('explore')}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs xl:text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center cursor-pointer ${
                  activeTab === 'explore' 
                    ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {translate("Enchères", "Auctions")}
              </button>

              {/* Coursier Express (Point A ➔ Point B) */}
              <button
                id="nav-tab-express-courier"
                onClick={() => setActiveTab('express_courier')}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs xl:text-sm font-medium transition-all flex items-center justify-center gap-1 xl:gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'express_courier' || activeTab === 'coursier_express' || activeTab === 'coursier'
                    ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40 font-bold shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Bike className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{translate("Coursier Express", "Express Courier")}</span>
                <span className="hidden xl:inline-block text-[9px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold px-1.5 py-0.2 rounded shadow">
                  A ➔ B
                </span>
              </button>

              {/* B2B Liquidation Hub */}
              <button
                id="nav-tab-b2b"
                onClick={() => setActiveTab('b2b_liquidation')}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs xl:text-sm font-medium transition-colors flex items-center justify-center gap-1 xl:gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'b2b_liquidation' 
                    ? 'bg-blue-600/30 text-cyan-300 border border-blue-500/40 font-bold shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{translate("Déstockage B2B", "B2B Liquidation")}</span>
                <span className="hidden xl:inline-block text-[9px] bg-blue-500/30 text-cyan-300 font-extrabold px-1.5 py-0.2 rounded">LOTS</span>
              </button>

              {/* Client Dashboard (Only for Client role) */}
              {currentUser?.role === 'client' && (
                <button
                  id="nav-tab-client-dashboard"
                  onClick={() => setActiveTab('dashboard_client')}
                  className={`h-9 px-2 xl:px-3 rounded-xl text-xs xl:text-sm font-medium transition-colors flex items-center justify-center gap-1 xl:gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'dashboard_client' 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{translate("Mon Espace", "My Space")}</span>
                </button>
              )}

              {/* Admin Dashboard (Only for Admin role - Strict RBAC) */}
              {currentUser?.role === 'admin' && (
                <button
                  id="nav-tab-admin-dashboard"
                  onClick={() => setActiveTab('dashboard_admin')}
                  className={`h-9 px-2 xl:px-3 rounded-xl text-xs xl:text-sm font-medium transition-colors flex items-center justify-center gap-1 xl:gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'dashboard_admin' 
                      ? 'bg-red-600/20 text-red-400 border border-red-500/30 font-semibold' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{translate("Back-Office", "Back-Office")}</span>
                </button>
              )}

              {/* Tarifs & Pass */}
              <button
                id="nav-tab-pricing"
                onClick={() => setActiveTab('tarifs')}
                className={`h-9 px-2 xl:px-3 rounded-xl text-xs xl:text-sm font-medium transition-colors flex items-center justify-center gap-1 xl:gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'tarifs' 
                    ? 'bg-slate-800 text-amber-400 font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{translate("Pass & Tarifs", "Pass & Rates")}</span>
              </button>

              {/* À Propos & Sécurité */}
              <button
                id="nav-tab-about"
                onClick={() => setActiveTab('about')}
                className={`hidden xl:flex h-9 px-2 xl:px-3 rounded-xl text-xs xl:text-sm font-medium transition-colors items-center justify-center whitespace-nowrap cursor-pointer ${
                  activeTab === 'about' 
                    ? 'bg-slate-800 text-amber-400 font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {translate("Séquestre", "Escrow")}
              </button>
            </nav>
          )}

          {/* Right Action Bar - Organized, Executive, Clean & Responsive */}
          <div 
            id="navbar-actions-bar" 
            className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 justify-end min-w-0"
          >
            {/* Quick Voix Off / Voice Guide Toggle Button (Always visible on mobile & desktop) */}
            <button
              id="btn-navbar-voice-toggle"
              type="button"
              onClick={() => toggleVoice()}
              className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-sm ${
                voiceEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={voiceEnabled ? translate("Voix Off Activée (Cliquer pour couper)", "Voice Assistance On (Click to mute)") : translate("Voix Off Coupée (Cliquer pour activer)", "Voice Assistance Off (Click to unmute)")}
            >
              {voiceEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
              )}
              <span className="hidden 2xl:inline text-[11px] font-bold">
                {voiceEnabled ? translate("Voix ON", "Voice ON") : translate("Voix OFF", "Voice OFF")}
              </span>
            </button>

            {/* Currency Selector (FCFA / EUR / USD) - Hidden on mobile, visible from sm screen up */}
            <div className="relative shrink-0 hidden sm:block" ref={currencyRef}>
              <button
                id="btn-navbar-currency"
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className={`h-8 sm:h-9 px-1.5 sm:px-2.5 rounded-xl border transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-sm ${
                  currencyDropdownOpen
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                }`}
                title={translate("Devise d'affichage (FCFA, EUR, USD) pour suivre les enchères", "Display currency (FCFA, EUR, USD) to track auctions")}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden xs:inline" />
                <span className="text-[11px] sm:text-xs font-extrabold flex items-center gap-1 font-mono-num">
                  <span>{currency === 'FCFA' ? '🇨🇮' : currency === 'EUR' ? '🇪🇺' : '🇺🇸'}</span>
                  <span>{currency === 'FCFA' ? 'FCFA' : currency === 'EUR' ? 'EUR' : 'USD'}</span>
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {currencyDropdownOpen && (
                <div
                  id="navbar-currency-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-[#0B1224] border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-2.5 py-1.5 border-b border-slate-800/90 mb-1.5">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{translate("Devise des Enchères", "Auctions Currency")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {translate("Suivi des offres pour acheteurs internationaux", "Offer tracking for international buyers")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {/* FCFA */}
                    <button
                      id="opt-currency-fcfa"
                      type="button"
                      onClick={() => {
                        setCurrency('FCFA');
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currency === 'FCFA'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">🇨🇮</span>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Franc CFA</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-mono font-black">FCFA</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">{translate("Monnaie locale officielle (XOF)", "Official local currency (XOF)")}</span>
                        </div>
                      </div>
                      {currency === 'FCFA' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>

                    {/* EUR */}
                    <button
                      id="opt-currency-eur"
                      type="button"
                      onClick={() => {
                        setCurrency('EUR');
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currency === 'EUR'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">🇪🇺</span>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Euro</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono font-black">EUR (€)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">1 € = 655,957 FCFA</span>
                        </div>
                      </div>
                      {currency === 'EUR' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>

                    {/* USD */}
                    <button
                      id="opt-currency-usd"
                      type="button"
                      onClick={() => {
                        setCurrency('USD');
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currency === 'USD'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">🇺🇸</span>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Dollar US</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-black">USD ($)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">1 $ ≈ 610 FCFA</span>
                        </div>
                      </div>
                      {currency === 'USD' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 px-2 py-1">
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      {translate(
                        "Règlement légal en FCFA à la livraison. Les montants en EUR/USD permettent aux acheteurs internationaux de jauger les enchères.",
                        "Direct delivery payments settle in FCFA. EUR/USD amounts enable international buyers to easily evaluate bids."
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* For Drivers: Quick Master Availability Switch */}
            {isDriver && (
              <button
                id="navbar-driver-status-toggle"
                onClick={toggleDriverAvailability}
                className={`flex h-8 sm:h-9 px-2 sm:px-3 rounded-xl font-black text-xs items-center justify-center gap-1.5 transition-all border shadow-sm cursor-pointer ${
                  currentUser.driverAvailability !== 'offline'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title={currentUser.driverAvailability !== 'offline' ? '🟢 En Service (Recevez des courses)' : '🔴 En Pause (Indisponible)'}
              >
                <Power className={`w-3.5 h-3.5 ${currentUser.driverAvailability !== 'offline' ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline text-[11px] sm:text-xs">
                  {currentUser.driverAvailability !== 'offline' ? '🟢 EN SERVICE' : '🔴 EN PAUSE'}
                </span>
              </button>
            )}

            {/* Auth / Profile Area */}
            {currentUser ? (
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="h-8 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 xl:px-2.5 rounded-xl hover:bg-slate-800 border border-amber-400/70 hover:border-amber-400 transition-all bg-slate-900/90 shadow-sm shadow-amber-500/10 shrink-0 group cursor-pointer"
                  title={`${translate("Connecté :", "Logged in:")} ${currentUser.name}`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <img 
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-amber-300 shadow-sm shrink-0 block group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-[#080C14]" />
                  </div>
                  <div className="hidden xl:block text-left text-xs pr-1">
                    <div className="font-bold text-slate-100 truncate max-w-[95px] flex items-center gap-1">
                      <span>{currentUser.name.split(' ')[0]}</span>
                      {currentUser.isVIP && <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    </div>
                    <span className="text-[9.5px] text-amber-400 font-mono block leading-none font-bold">
                      {currentUser.kycStatus === 'verified' ? '✓ KYC' : 'KYC ?'}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div 
                    id="user-profile-dropdown"
                    className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    {/* User Header */}
                    <div className="p-2 border-b border-slate-800/80 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{currentUser.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          currentUser.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          currentUser.role === 'driver' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{currentUser.email}</p>
                      
                      {/* Solde Disponible et Séquestre */}
                      <div className="mt-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono-num">
                        <div>
                          <div className="text-[10px] text-slate-500">{translate("Solde Retirable", "Available Balance")}</div>
                          <div className="text-sm font-bold text-amber-400">{currentUser.walletBalance.toLocaleString('fr-FR')} F</div>
                        </div>
                        {currentUser.blockedBalance ? (
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500">{translate("Séquestre Ventes", "Sales Escrow")}</div>
                            <div className="text-xs font-bold text-blue-400">{currentUser.blockedBalance.toLocaleString('fr-FR')} F</div>
                          </div>
                        ) : null}
                      </div>

                      {/* KYC Status Badge */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">{translate("Statut Identité :", "Identity Status:")}</span>
                        {currentUser.kycStatus === 'verified' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            {translate("Vérifié KYC", "KYC Verified")}
                          </span>
                        ) : currentUser.kycStatus === 'pending' ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold flex items-center gap-1 border border-amber-500/30">
                            <Clock className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                            <span>{translate("KYC en cours de vérification", "KYC under verification")}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => { setProfileDropdownOpen(false); setKycModalOpen(true); }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold flex items-center gap-1 border border-red-500/30 underline"
                          >
                            {translate("Non vérifié (Vérifier)", "Unverified (Verify)")}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Navigation shortcuts */}
                    <div className="space-y-1">
                      {currentUser.role === 'client' && (
                        <button
                          onClick={() => { setActiveTab('dashboard_client'); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <User className="w-4 h-4 text-blue-400" />
                          <span>{translate("Tableau de bord Client", "Client Dashboard")}</span>
                        </button>
                      )}

                      {currentUser.role === 'driver' && (
                        <button
                          onClick={() => { setActiveTab('dashboard_driver'); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Bike className="w-4 h-4 text-emerald-400" />
                          <span>{translate("Espace Livreur & Missions", "Courier & Deliveries")}</span>
                        </button>
                      )}

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => { setActiveTab('dashboard_admin'); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-red-400" />
                          <span>{translate("Back-Office Super Admin", "Super Admin Back-Office")}</span>
                        </button>
                      )}

                      {/* Cart Shortcut */}
                      {!isDriver && (
                        <button
                          id="btn-profile-dropdown-cart"
                          onClick={() => { setCartModalOpen(true); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-amber-400" />
                            <span>{translate("Mon Panier Multi-Articles", "My Cart")}</span>
                          </div>
                          {cart.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono-num font-black text-[10px]">
                              {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                          )}
                        </button>
                      )}

                      {/* Notifications Shortcut */}
                      <button
                        id="btn-profile-dropdown-notifications"
                        onClick={() => { setNotificationsModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-400" />
                          <span>{translate("Notifications & Alertes", "Notifications")}</span>
                        </div>
                        {unreadNotificationsCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono-num font-black text-[10px]">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => { setPricingModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{translate("Souscrire un Pass / Boost", "Get a Pass / Boost")}</span>
                      </button>

                      {/* Devise d'affichage dans le menu Compte */}
                      <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>{translate("Devise des montants", "Display Currency")}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-400">
                            {currency}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-0.5">
                          {(['FCFA', 'EUR', 'USD'] as const).map((curr) => (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => setCurrency(curr)}
                              className={`py-1 px-1.5 rounded-lg text-[10.5px] font-bold font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                currency === curr
                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                              }`}
                            >
                              <span>{curr === 'FCFA' ? '🇨🇮' : curr === 'EUR' ? '🇪🇺' : '🇺🇸'}</span>
                              <span>{curr}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        id="btn-profile-settings"
                        onClick={() => {
                          setActiveTab('dashboard_client');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('bradci_open_subtab', { detail: 'settings' }));
                          }, 60);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors font-bold"
                      >
                        <Settings className="w-4 h-4 text-amber-400" />
                        <span>{translate("Paramètres & Préférences", "Settings & Preferences")}</span>
                      </button>

                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => { logout(); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{translate("Se Déconnecter", "Sign Out")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-navbar-auth"
                onClick={() => setAuthModalOpen(true)}
                className="h-8 sm:h-9 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden xs:inline">{translate("Connexion", "Sign In")}</span>
              </button>
            )}

            {/* Mobile hamburger button */}
            <button
              id="btn-toggle-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-slate-300 hover:text-white rounded-xl bg-slate-900/90 hover:bg-slate-800 lg:hidden shrink-0 border border-slate-800 transition-colors cursor-pointer"
              title={translate("Menu Mobile", "Mobile Menu")}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/80 py-3 space-y-3 bg-[#06102E]/98 backdrop-blur-xl animate-in slide-in-from-top duration-200">
            {/* Branded Mobile Drawer Header */}
            <div className="px-3 pb-2 border-b border-slate-800/80 flex items-center justify-between">
              <BradCiLogo 
                size="sm" 
                showSubtitle={true} 
                subtitleText="ENCHÈRES • PAIEMENT SÉQUESTRÉ • LIVRAISON GPS" 
              />
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                SÉCURISÉ
              </span>
            </div>

            {/* Mobile Currency Selector Bar */}
            <div className="px-3 py-2 bg-slate-900/90 rounded-2xl mx-3 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{translate("Devise des Enchères", "Auction Currency")}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currency === 'FCFA' ? '🇨🇮 CFA (XOF)' : currency === 'EUR' ? '🇪🇺 1€ = 655,957 F' : '🇺🇸 1$ ≈ 610 F'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                {(['FCFA', 'EUR', 'USD'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currency === curr
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-xs">{curr === 'FCFA' ? '🇨🇮' : curr === 'EUR' ? '🇪🇺' : '🇺🇸'}</span>
                    <span>{curr === 'FCFA' ? 'FCFA' : curr === 'EUR' ? 'EUR (€)' : 'USD ($)'}</span>
                  </button>
                ))}
              </div>
            </div>
            {isDriver ? (
              <div className="px-3 space-y-3">
                {/* Driver Online / Offline master toggle */}
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Power className={`w-4 h-4 ${currentUser.driverAvailability !== 'offline' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    <div>
                      <span className="text-xs font-bold text-white block">Statut Chauffeur</span>
                      <span className="text-[10px] text-slate-400">
                        {currentUser.driverAvailability !== 'offline' ? 'Prêt à recevoir des courses' : 'En pause / Hors service'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleDriverAvailability}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      currentUser.driverAvailability !== 'offline'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {currentUser.driverAvailability !== 'offline' ? '🟢 En Service' : '🔴 En Pause'}
                  </button>
                </div>

                {/* Driver quick grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { 
                      setActiveTab('dashboard_driver'); 
                      setActiveDriverTab('available_orders');
                      window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'available_orders' }));
                      setMobileMenuOpen(false); 
                    }}
                    className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-mono-num font-black">
                        {availableJobsCount}
                      </span>
                    </div>
                    <span>Courses Dispos</span>
                  </button>

                  <button
                    onClick={() => { 
                      setActiveTab('dashboard_driver'); 
                      setActiveDriverTab('active_mission');
                      window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'active_mission' }));
                      setMobileMenuOpen(false); 
                    }}
                    className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-cyan-300 text-xs font-bold text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <Navigation className="w-4 h-4 text-cyan-400" />
                      {driverActiveMission && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                    </div>
                    <span>Mission en cours</span>
                  </button>

                  <button
                    onClick={() => { 
                      setActiveTab('dashboard_driver'); 
                      setActiveDriverTab('history');
                      window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'history' }));
                      setMobileMenuOpen(false); 
                    }}
                    className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Gain</span>
                  </button>

                  <button
                    onClick={() => { 
                      setActiveTab('dashboard_driver'); 
                      setActiveDriverTab('profile');
                      window.dispatchEvent(new CustomEvent('bradci_driver_tab', { detail: 'profile' }));
                      setMobileMenuOpen(false); 
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Véhicule & Docs</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    id="btn-mobile-driver-logout"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-red-500/20 transition-all"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>{translate("Se Déconnecter", "Sign Out")}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Drawer Quick Primary Actions */}
                <div className="px-2 space-y-1.5 pb-2">
                  {/* Notifications in drawer */}
                  <button
                    id="btn-mobile-drawer-notifications"
                    onClick={() => { setNotificationsModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-slate-200 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{translate("Notifications & Alertes", "Notifications & Alerts")}</span>
                    </div>
                    {unreadNotificationsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono-num font-black text-[10px]">
                        {unreadNotificationsCount} {translate("nouvelle(s)", "new")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">0</span>
                    )}
                  </button>

                  {/* Vendre in drawer */}
                  {!isDriver && (
                    <button
                      id="btn-mobile-drawer-sell"
                      onClick={() => { handleSellClick(); setMobileMenuOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl bg-[#FF5B00]/15 border border-[#FF5B00]/30 hover:bg-[#FF5B00]/25 text-[#FF5B00] text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-[#FF5B00] shrink-0" />
                        <span>{translate("Vendre un article (Gratuit & Illimité)", "Sell an item (Free & Unlimited)")}</span>
                      </div>
                      <span className="bg-[#FF5B00] text-white text-[9px] px-2 py-0.5 rounded font-black">
                        {translate("Vendre", "Sell")}
                      </span>
                    </button>
                  )}

                  {/* Panier in drawer */}
                  {!isDriver && (
                    <button
                      id="btn-mobile-drawer-cart"
                      onClick={() => { setCartModalOpen(true); setMobileMenuOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-slate-200 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{translate("Mon Panier Multi-Articles", "My Multi-Item Cart")}</span>
                      </div>
                      {cart.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono-num font-black text-[10px]">
                          {cart.reduce((s, i) => s + i.quantity, 0)} {translate("article(s)", "item(s)")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">{translate("Vide", "Empty")}</span>
                      )}
                    </button>
                  )}

                  {/* Factures & Reçus Comptables in drawer */}
                  <button
                    id="btn-mobile-drawer-receipts"
                    onClick={() => {
                      setActiveTab('dashboard_client');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('bradci_open_subtab', { detail: 'history' }));
                      }, 60);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{translate("Reçus & Factures Comptables (PDF)", "Official Receipts & Invoices (PDF)")}</span>
                  </button>
                </div>

                {/* Section Navigation Tabs */}
                <div className="grid grid-cols-2 gap-2 px-2 pb-2">
                  <button
                    onClick={() => { setActiveTab('explore'); setMobileMenuOpen(false); }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                      activeTab === 'explore' 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {translate("Enchères", "Auctions")}
                  </button>

                  <button
                    onClick={() => { setActiveTab('express_courier'); setMobileMenuOpen(false); }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'express_courier' || activeTab === 'coursier_express' || activeTab === 'coursier'
                        ? 'bg-violet-600/30 text-violet-300 border-violet-500/40' 
                        : 'bg-slate-900 text-violet-300 border-slate-800'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5 text-amber-400" />
                    <span>{translate("Coursier Express", "Courier")}</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('b2b_liquidation'); setMobileMenuOpen(false); }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                      activeTab === 'b2b_liquidation' 
                        ? 'bg-blue-600/30 text-cyan-300 border-blue-500/40' 
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {translate("Lots B2B", "B2B Lots")}
                  </button>

                  <button
                    onClick={() => { setActiveTab('tarifs'); setMobileMenuOpen(false); }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                      activeTab === 'tarifs' 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {translate("Pass & Tarifs", "Pass & Rates")}
                  </button>
                </div>

                {currentUser ? (
                  <div className="px-2 space-y-1">
                    {currentUser.role === 'client' && (
                      <button
                        onClick={() => { setActiveTab('dashboard_client'); setMobileMenuOpen(false); }}
                        className="w-full text-left p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        <span>{translate("Mon Espace Client & Séquestre", "Client Space & Escrow")}</span>
                      </button>
                    )}

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => { setActiveTab('dashboard_admin'); setMobileMenuOpen(false); }}
                        className="w-full text-left p-2.5 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{translate("Back-Office Super Admin", "Super Admin Back-Office")}</span>
                      </button>
                    )}

                    {/* Voix Off Toggle in Drawer */}
                    <button
                      id="btn-mobile-drawer-voice"
                      type="button"
                      onClick={() => {
                        toggleVoice();
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {voiceEnabled ? (
                          <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span>{translate("Voix Off & Lecture Audio", "Voice Off & Audio Reading")}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                        voiceEnabled 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {voiceEnabled ? translate("ACTIVÉE", "ENABLED") : translate("COUPÉE", "MUTED")}
                      </span>
                    </button>

                    {/* Micro Assistant Vocal in Drawer */}
                    <button
                      id="btn-mobile-drawer-mic"
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('bradci_open_support_mic'));
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                        <span>{translate("Micro Assistant Vocal IA", "AI Voice Mic Assistant")}</span>
                      </div>
                      <span className="bg-amber-500 text-slate-950 text-[9px] px-2 py-0.5 rounded font-black">
                        {translate("PARLER", "SPEAK")}
                      </span>
                    </button>

                    <button
                      id="btn-mobile-settings"
                      onClick={() => {
                        setActiveTab('dashboard_client');
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('bradci_open_subtab', { detail: 'settings' }));
                        }, 60);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>{translate("Paramètres & Préférences", "Settings & Preferences")}</span>
                    </button>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        id="btn-mobile-logout"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full py-2.5 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-red-500/20 transition-all"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>{translate("Se Déconnecter", "Sign Out")}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-2 pt-2 border-t border-slate-800">
                    <button
                      id="btn-mobile-drawer-login"
                      onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                      className="w-full py-2.5 px-3.5 bg-[#FF5B00] hover:bg-[#E05000] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF5B00]/25 transition-all cursor-pointer"
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span>{translate("Connexion / Créer un Compte", "Sign In / Register")}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
