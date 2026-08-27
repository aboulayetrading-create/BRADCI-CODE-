import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BradCiLogo } from './BradCiLogo';
import { 
  Gavel, 
  ShieldCheck, 
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
  Globe,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Laptop
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
    t,
    translate,
    theme,
    effectiveTheme,
    toggleTheme,
    voiceEnabled,
    toggleVoice,
    readCurrentScreenAloud,
    setKycModalOpen
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSellClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setNewProductModalOpen(true);
  };

  const publishQuota = currentUser ? canUserPublishProduct(currentUser) : null;

  const getThemeIcon = () => {
    if (theme === 'auto') {
      return <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />;
    }
    if (effectiveTheme === 'light') {
      return <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />;
    }
    return <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />;
  };

  const getThemeLabel = () => {
    if (theme === 'auto') return 'Auto';
    if (effectiveTheme === 'light') return translate('Clair', 'Light');
    return translate('Sombre', 'Dark');
  };

  const getThemeTitle = () => {
    if (theme === 'auto') return translate("Thème Automatique (Jour/Nuit)", "Auto Theme (Day/Night)");
    if (theme === 'light') return translate("Thème Clair (Blanc)", "Light Theme (White)");
    return translate("Thème Sombre", "Dark Theme");
  };

  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-[#080C14]/95 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="w-full max-w-[1800px] mx-auto px-1.5 sm:px-3 lg:px-6">
        <div className="flex items-center justify-between h-13 sm:h-15 lg:h-[68px] gap-1 sm:gap-2 md:gap-3">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button 
              id="nav-logo"
              onClick={() => setActiveTab('explore')}
              className="flex items-center text-left group focus:outline-none transition-transform active:scale-95 shrink-0"
            >
              <BradCiLogo size="md" />
            </button>

            {/* Escrow Guarantee Pill */}
            <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold">{translate("Séquestre 100% Garanti", "100% Escrow Guaranteed")}</span>
            </div>
          </div>

          {/* Desktop Navigation Links (Strict RBAC Routing) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1.5 shrink-0">
            {/* Feed / Explore */}
            <button
              id="nav-tab-explore"
              onClick={() => setActiveTab('explore')}
              className={`px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg xl:rounded-xl text-[11px] lg:text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'explore' 
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {translate("Enchères", "Auctions")}
            </button>

            {/* Client Dashboard (Only for Client role) */}
            {currentUser?.role === 'client' && (
              <button
                id="nav-tab-client-dashboard"
                onClick={() => setActiveTab('dashboard_client')}
                className={`px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg xl:rounded-xl text-[11px] lg:text-xs xl:text-sm font-medium transition-colors flex items-center gap-1 lg:gap-1.5 whitespace-nowrap ${
                  activeTab === 'dashboard_client' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <User className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-blue-400 shrink-0" />
                <span>{translate("Mon Espace", "My Space")}</span>
              </button>
            )}

            {/* Driver Dashboard (Only for Driver role - Strict RBAC) */}
            {currentUser?.role === 'driver' && (
              <button
                id="nav-tab-driver-dashboard"
                onClick={() => setActiveTab('dashboard_driver')}
                className={`px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg xl:rounded-xl text-[11px] lg:text-xs xl:text-sm font-medium transition-colors flex items-center gap-1 lg:gap-1.5 whitespace-nowrap ${
                  activeTab === 'dashboard_driver' 
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Bike className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-emerald-400 shrink-0" />
                <span>{translate("Fret & GPS", "Freight & GPS")}</span>
              </button>
            )}

            {/* Admin Dashboard (Only for Admin role - Strict RBAC) */}
            {currentUser?.role === 'admin' && (
              <button
                id="nav-tab-admin-dashboard"
                onClick={() => setActiveTab('dashboard_admin')}
                className={`px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg xl:rounded-xl text-[11px] lg:text-xs xl:text-sm font-medium transition-colors flex items-center gap-1 lg:gap-1.5 whitespace-nowrap ${
                  activeTab === 'dashboard_admin' 
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30 font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-red-400 shrink-0" />
                <span>{translate("Back-Office", "Back-Office")}</span>
              </button>
            )}

            {/* Tarifs & Pass */}
            <button
              id="nav-tab-pricing"
              onClick={() => setActiveTab('tarifs')}
              className={`px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg xl:rounded-xl text-[11px] lg:text-xs xl:text-sm font-medium transition-colors flex items-center gap-1 lg:gap-1.5 whitespace-nowrap ${
                activeTab === 'tarifs' 
                  ? 'bg-slate-800 text-amber-400 font-semibold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-amber-400 shrink-0" />
              <span>{translate("Pass & Tarifs", "Pass & Rates")}</span>
            </button>

            {/* À Propos & Sécurité */}
            <button
              id="nav-tab-about"
              onClick={() => setActiveTab('about')}
              className={`hidden lg:block px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg xl:rounded-xl text-[11px] lg:text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'about' 
                  ? 'bg-slate-800 text-amber-400 font-semibold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {translate("Séquestre", "Escrow")}
            </button>
          </nav>

          {/* Right Action Bar - Proportional and fully visible across mobile, tablet, and desktop */}
          <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 shrink-0">
            {/* Language Toggle (FR / EN) */}
            <button
              id="btn-toggle-language"
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="px-1.5 py-1 sm:px-2 sm:py-1 rounded-md sm:rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition-all text-[10px] sm:text-xs font-bold font-mono-num flex items-center gap-0.5 sm:gap-1 shrink-0"
              title={translate("Changer de langue (FR / EN)", "Switch language (FR / EN)")}
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Theme Toggle (Dark / Light / Auto) */}
            <button
              id="btn-toggle-theme"
              onClick={toggleTheme}
              className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition-all text-xs shrink-0 flex items-center gap-1"
              title={getThemeTitle()}
            >
              {getThemeIcon()}
              <span className="hidden xl:inline text-[10px] font-mono-num font-semibold text-slate-400">
                {getThemeLabel()}
              </span>
            </button>

            {/* Voice Assistant Toggle & Live Screen Reader */}
            <div className="flex items-center gap-1">
              <button
                id="btn-toggle-voice"
                onClick={toggleVoice}
                className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg border transition-all text-xs shrink-0 flex items-center gap-1 ${
                  voiceEnabled 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/20' 
                    : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={voiceEnabled ? translate("Assistance Vocale Active (Cliquez pour couper)", "Voice Guidance Active (Click to mute)") : translate("Assistance Vocale Coupée (Cliquez pour activer)", "Voice Guidance Muted (Click to activate)")}
              >
                {voiceEnabled ? (
                  <>
                    <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
                    <span className="hidden xl:inline text-[9px] font-bold text-emerald-400">{translate("VOIX ON", "VOICE ON")}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xl:inline text-[9px] font-medium text-slate-500">{translate("VOIX OFF", "VOICE OFF")}</span>
                  </>
                )}
              </button>

              {voiceEnabled && (
                <button
                  id="btn-read-screen-aloud"
                  onClick={readCurrentScreenAloud}
                  className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all"
                  title={translate("Lire la synthèse audio des données de la page", "Read current page audio summary aloud")}
                >
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{translate("Lire l'écran", "Read screen")}</span>
                </button>
              )}
            </div>

            {/* Notification Bell Button */}
            <button
              id="btn-navbar-notifications"
              onClick={() => setNotificationsModalOpen(true)}
              className="relative p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/40 transition-all shrink-0"
              title={translate("Notifications", "Notifications")}
            >
              <Bell className="w-3 h-3 sm:w-3.5 sm:h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[13px] h-[13px] sm:min-w-[15px] sm:h-[15px] px-0.5 rounded-full bg-red-500 text-white font-mono-num font-black text-[7.5px] sm:text-[9px] flex items-center justify-center border border-[#080C14]">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* GPS Location Pill */}
            <button
              id="btn-navbar-gps"
              onClick={() => setGpsModalOpen(true)}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold border transition-all shrink-0 ${
                gpsPermissionStatus === 'granted' && userLocation
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
              }`}
              title={translate("Position GPS", "GPS Position")}
            >
              <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[36px] xs:max-w-[50px] sm:max-w-[80px]">
                {userLocation ? userLocation.commune.split(' ')[0] : 'Abidjan'}
              </span>
            </button>

            {/* Quick Publish Product Button */}
            <button
              id="btn-publish-product"
              onClick={handleSellClick}
              className="relative group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-bold text-[10px] sm:text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              title={translate("Mettre un article en vente (Gratuit & Illimité)", "Post item for sale (Free & Unlimited)")}
            >
              <PlusCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-950 shrink-0" />
              <span>{translate("Vendre", "Sell")}</span>
              <span className="bg-slate-950/20 text-slate-950 text-[8px] sm:text-[9px] px-1 py-0.2 rounded font-mono-num font-black">
                ∞
              </span>
            </button>

            {/* Auth / Profile Area */}
            {currentUser ? (
              <div className="relative shrink-0">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 md:p-1.5 rounded-lg sm:rounded-xl hover:bg-slate-800 border-2 border-amber-400/80 hover:border-amber-400 transition-all bg-slate-900/90 shadow-md shadow-amber-500/10 shrink-0 group"
                  title={`${translate("Connecté :", "Logged in:")} ${currentUser.name}`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <img 
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 md:w-8.5 md:h-8.5 rounded-full object-cover border border-amber-300 shadow-sm shrink-0 block group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 border-2 border-[#080C14]" />
                  </div>
                  <div className="hidden lg:block text-left text-xs pr-1">
                    <div className="font-bold text-slate-100 truncate max-w-[95px] flex items-center gap-1">
                      <span>{currentUser.name.split(' ')[0]}</span>
                      {currentUser.isVIP && <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    </div>
                    <span className="text-[9.5px] text-amber-400 font-mono block leading-tight font-bold">
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
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center gap-1 border border-amber-500/30">
                            {translate("En attente", "Pending")}
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

                      <button
                        onClick={() => { setPricingModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{translate("Souscrire un Pass / Boost", "Get a Pass / Boost")}</span>
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
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{translate("Connexion", "Sign In")}</span>
              </button>
            )}

            {/* Mobile hamburger button */}
            <button
              id="btn-toggle-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 md:hidden shrink-0 border border-slate-800"
              title={translate("Menu Mobile", "Mobile Menu")}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 py-3 space-y-2 bg-[#080C14]/98 backdrop-blur-xl animate-in slide-in-from-top duration-200">
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

            {currentUser && (
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

                {currentUser.role === 'driver' && (
                  <button
                    onClick={() => { setActiveTab('dashboard_driver'); setMobileMenuOpen(false); }}
                    className="w-full text-left p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2"
                  >
                    <Bike className="w-4 h-4" />
                    <span>{translate("Espace Livreur (GPS & Bourse de Fret)", "Courier Space (GPS & Deliveries)")}</span>
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
            )}
          </div>
        )}
      </div>
    </header>
  );
};
