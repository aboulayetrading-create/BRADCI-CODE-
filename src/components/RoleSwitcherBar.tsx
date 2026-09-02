import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Store, 
  Bike, 
  ShieldCheck, 
  MapPin, 
  UserCheck, 
  Building2,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { 
    currentUser, 
    loginAsUser, 
    setActiveTab, 
    setGpsModalOpen, 
    setKycModalOpen, 
    userLocation,
    translate 
  } = useApp();

  const isClientBuyer = currentUser?.role === 'client' && currentUser?.id === 'user-kouassi';
  const isClientSeller = currentUser?.role === 'client' && (currentUser?.id === 'user-awa' || currentUser?.sellerPlan === 'pro');
  const isDriver = currentUser?.role === 'driver';

  const handleSelectBuyer = () => {
    loginAsUser('user-kouassi');
    setActiveTab('explore');
  };

  const handleSelectSeller = () => {
    loginAsUser('user-awa');
    setActiveTab('dashboard_client');
  };

  const handleSelectDriver = () => {
    loginAsUser('user-bakary-driver');
    setActiveTab('dashboard_driver');
  };

  return (
    <nav 
      id="role-switcher-bar" 
      aria-label="Sélecteur d'espace acteur"
      className="bg-[#070B18] border-b border-slate-800/80 px-2 sm:px-4 py-1.5 text-xs select-none sticky top-13 sm:top-15 lg:top-[68px] z-30 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-0.5">
        {/* Left: Role indicator label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px] sm:text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-tight uppercase">{translate("Espace Acteur", "Actor Space")}:</span>
          </div>
        </div>

        {/* Center: The 3 Main Personas (Client/Acheteur, Vendeur Déstockage, Livreur) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 1. Client / Acheteur */}
          <button
            id="role-btn-actor-buyer"
            onClick={handleSelectBuyer}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium text-[11px] sm:text-xs shrink-0 cursor-pointer ${
              isClientBuyer
                ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25 border border-blue-400'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
            title={translate("Parcours Acheteur / Client : Enchères, Panier & POD", "Buyer / Client Flow: Auctions, Cart & POD")}
          >
            <ShoppingBag className={`w-3.5 h-3.5 ${isClientBuyer ? 'text-white' : 'text-blue-400'} shrink-0`} />
            <span>{translate("Acheteur / Client", "Buyer / Client")}</span>
          </button>

          {/* 2. Vendeur de Déstockage */}
          <button
            id="role-btn-actor-seller"
            onClick={handleSelectSeller}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium text-[11px] sm:text-xs shrink-0 cursor-pointer ${
              isClientSeller
                ? 'bg-[#FF5B00] text-white font-bold shadow-sm shadow-orange-500/25 border border-orange-400'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
            title={translate("Parcours Vendeur Déstockage : Annonces, Lots B2B & Retraits", "Liquidation Seller Flow: Listings, B2B Lots & Payouts")}
          >
            <Store className={`w-3.5 h-3.5 ${isClientSeller ? 'text-white' : 'text-[#FF5B00]'} shrink-0`} />
            <span>{translate("Vendeur Déstockage", "Liquidation Seller")}</span>
          </button>

          {/* 3. Livreur Express */}
          <button
            id="role-btn-actor-driver"
            onClick={handleSelectDriver}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium text-[11px] sm:text-xs shrink-0 cursor-pointer ${
              isDriver
                ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/25 border border-emerald-400'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
            title={translate("Parcours Livreur : Bourse de fret, GPS & Validation OTP", "Courier Flow: Freight board, GPS & OTP verification")}
          >
            <Bike className={`w-3.5 h-3.5 ${isDriver ? 'text-white' : 'text-emerald-400'} shrink-0`} />
            <span>{translate("Livreur Express", "Express Courier")}</span>
          </button>
        </div>

        {/* Right: Direct Access to GPS & KYC Verification Flows */}
        <div className="flex items-center gap-1 shrink-0 ml-auto pl-1 border-l border-slate-800">
          {/* GPS Quick Action */}
          <button
            id="role-btn-gps-zone"
            onClick={() => setGpsModalOpen(true)}
            className="px-2 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 flex items-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors"
            title={translate("Modifier ma zone GPS (Abidjan & Banlieue)", "Change GPS zone (Abidjan & Environs)")}
          >
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden sm:inline font-mono-num">{userLocation ? userLocation.commune.split(' ')[0] : 'Abidjan'}</span>
            <span className="sm:hidden font-mono-num">GPS</span>
          </button>

          {/* KYC Quick Action */}
          <button
            id="role-btn-kyc-verify"
            onClick={() => setKycModalOpen(true)}
            className={`px-2 py-1 rounded-md border flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold transition-all ${
              currentUser?.kycStatus === 'verified'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
            }`}
            title={currentUser?.kycStatus === 'verified' ? translate("Identité Certifiée KYC", "KYC Certified Identity") : translate("Valider mon identité KYC", "Validate my KYC Identity")}
          >
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">
              {currentUser?.kycStatus === 'verified' ? translate("KYC Vérifié", "KYC Verified") : translate("Vérifier KYC", "Verify KYC")}
            </span>
            <span className="sm:hidden">KYC</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
