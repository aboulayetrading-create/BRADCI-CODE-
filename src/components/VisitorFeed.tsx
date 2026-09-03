import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  Gavel, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Bike, 
  Car, 
  Truck, 
  Sparkles, 
  Crown,
  TrendingUp, 
  ArrowRight,
  Flame,
  CheckCircle2,
  Compass,
  Store,
  Power,
  Package,
  Users,
  Navigation,
  AlertCircle,
  Building2,
  ShoppingCart
} from 'lucide-react';
import { Product, VehicleType } from '../types';
import { 
  COMMUNE_NAMES_ABIDJAN, 
  COMMUNE_NAMES_ENVIRONS, 
  getCommuneBadgeInfo 
} from '../data/communes';
import { InteractiveAbidjanMap } from './InteractiveAbidjanMap';

export const VisitorFeed: React.FC = () => {
  const { 
    products, 
    freightJobs,
    setProductDetailModal, 
    setPricingModalOpen, 
    setNewProductModalOpen,
    currentUser,
    users,
    setSelectedShopForView,
    getShopBySellerId,
    setActiveTab,
    toggleDriverAvailability,
    driverAcceptJob,
    language,
    translate,
    t,
    addToCart,
    setCartModalOpen
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedCommune, setSelectedCommune] = useState<string>('Toutes');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Tous');
  const [selectedFeedType, setSelectedFeedType] = useState<'all' | 'auction' | 'shop' | 'five_bids' | 'b2b'>('all');
  const [driverOnlyFilter, setDriverOnlyFilter] = useState<boolean>(false);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  const isDriver = currentUser?.role === 'driver';
  const isOnline = currentUser?.driverAvailability !== 'offline';
  const remainingTrial = currentUser?.trialDeliveriesRemaining ?? 0;
  const isTrial = currentUser?.driverPlan === 'trial';
  const availableDeliveriesCount = freightJobs.filter(j => j.status === 'available').length;

  const categories = [
    { key: 'Tous', label: translate('Tous', 'All') },
    { key: 'Déstockage B2B', label: translate('🏢 Déstockage B2B (Lots)', '🏢 B2B Liquidation (Lots)') },
    { key: 'High-Tech', label: translate('High-Tech', 'High-Tech') },
    { key: 'Mode & Luxe', label: translate('Mode & Luxe', 'Fashion & Luxury') },
    { key: 'Maison & Électro', label: translate('Maison & Électro', 'Home & Appliances') },
    { key: 'Gaming', label: translate('Gaming', 'Gaming') },
    { key: 'Véhicules & Pièces', label: translate('Véhicules & Pièces', 'Vehicles & Parts') }
  ];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.commune.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.b2bCompanyName && p.b2bCompanyName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;
    const matchesCommune = selectedCommune === 'Toutes' || 
                           p.commune.toLowerCase().includes(selectedCommune.toLowerCase()) ||
                           selectedCommune.toLowerCase().includes(p.commune.toLowerCase());
    const matchesVehicle = selectedVehicle === 'Tous' || p.requiredVehicle === selectedVehicle;
    const matchesDriverFilter = !driverOnlyFilter || p.status === 'sold' || p.status === 'in_transit' || p.deliveryJobId;
    const matchesFeedType = selectedFeedType === 'all' || 
                            (selectedFeedType === 'shop' && (p.listingType === 'shop' || p.shopId)) ||
                            (selectedFeedType === 'auction' && (p.listingType === 'auction' || (!p.shopId && p.listingType !== 'shop'))) ||
                            (selectedFeedType === 'five_bids' && (p.bids.length >= 5 || p.status === 'pending_choice')) ||
                            (selectedFeedType === 'b2b' && (p.isB2BLot || p.category === 'Déstockage B2B'));
    return matchesSearch && matchesCategory && matchesCommune && matchesVehicle && matchesDriverFilter && matchesFeedType;
  });

  const getVehicleIcon = (v: VehicleType) => {
    switch (v) {
      case 'cargo': return <Truck className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Bike className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getEstimatedDeliveryFee = (p: Product) => {
    if (p.deliveryJobId) {
      const job = freightJobs.find(j => j.id === p.deliveryJobId);
      if (job) return job.deliveryFee;
    }
    if (p.requiredVehicle === 'cargo') return 12000;
    return 3000;
  };

  return (
    <div id="visitor-feed-root" className="space-y-8 pb-12">
      {/* Driver Interactive Header Banner if user is driver */}
      {isDriver && (
        <section id="driver-feed-banner" className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#0B1528] border-2 border-emerald-500/40 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/50 shadow" 
                />
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0B1528] ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5" />
                    <span>{translate("Mode Livreur Connecté", "Courier Mode Connected")}</span>
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">
                    {currentUser.name}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
                  {translate("Bourse aux Courses & Enchères Adjugées", "Delivery Board & Awarded Auctions")}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
              {/* Online/Offline Toggle */}
              <button
                id="feed-driver-toggle-online"
                onClick={toggleDriverAvailability}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow ${
                  isOnline 
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{isOnline ? translate('🟢 En Service', '🟢 On Duty') : translate('🔴 En Pause', '🔴 On Pause')}</span>
              </button>

              {/* Direct Link to Driver Dashboard */}
              <button
                id="feed-go-driver-dashboard-btn"
                onClick={() => setActiveTab('dashboard_driver')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
              >
                <Package className="w-4 h-4" />
                <span>{translate(`Voir les ${availableDeliveriesCount} Commandes Bourse`, `View ${availableDeliveriesCount} Orders`)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Banner with Abidjan Vibe & Rules Showcase (standard) */}
      {!isDriver && (
        <section className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#0C1424] via-[#090E1A] to-[#060A12] p-4 sm:p-7 lg:p-9 shadow-2xl">
          {/* Glow ambient circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-500/30 mb-3 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{translate("Grand Abidjan & Villes Balnéaires • Paiement Direct à la Livraison", "Greater Abidjan & Coastal Cities • Direct Pay on Delivery")}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-display leading-[1.15]">
              {translate("Achetez & Vendez aux Enchères avec ", "Buy & Sell with ")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
                {translate("Paiement Direct à la Livraison", "Direct Pay on Delivery")}
              </span>
              {translate(" Garanti.", " Guaranteed.")}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed max-w-2xl">
              {translate(
                "La 1ère plateforme sécurisée de déstockage express couvrant les 13 communes d'Abidjan ainsi que Grand-Bassam, Assinie, Bingerville et Dabou. Payez facilement par Mobile Money (Wave, Orange Money, MTN MoMo, Moov, Carte) après vérification du colis.",
                "The #1 secure express liquidation platform covering all 13 communes of Abidjan, as well as Grand-Bassam, Assinie, Bingerville, and Dabou. Pay easily via Mobile Money (Wave, Orange Money, MTN MoMo, Moov, Card) after parcel inspection."
              )}
            </p>

            {/* 4 Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <div className="bg-slate-900/70 border border-slate-800/80 p-2.5 sm:p-3 rounded-2xl">
                <span className="text-amber-400 font-bold text-xs block">{translate("13 Communes + 4 Villes", "13 Communes + 4 Cities")}</span>
                <span className="text-[11px] text-slate-400">{translate("Grand Abidjan & Littoral", "Greater Abidjan & Coast")}</span>
              </div>
              <div className="bg-slate-900/70 border border-slate-800/80 p-2.5 sm:p-3 rounded-2xl">
                <span className="text-blue-400 font-bold text-xs block">{translate("Pass Standard 5 000 F", "Standard Pass 5,000 F")}</span>
                <span className="text-[11px] text-slate-400">{translate("Comm. réduite 5%", "Reduced 5% comm.")}</span>
              </div>
              <div className="bg-slate-900/70 border border-slate-800/80 p-2.5 sm:p-3 rounded-2xl">
                <span className="text-emerald-400 font-bold text-xs block">{translate("5 Courses Livreur", "5 Free Courier Runs")}</span>
                <span className="text-[11px] text-slate-400">{translate("Essai gratuit offert", "Free trial included")}</span>
              </div>
              <div className="bg-slate-900/70 border border-slate-800/80 p-2.5 sm:p-3 rounded-2xl">
                <span className="text-red-400 font-bold text-xs block">{translate("Unicité KYC", "KYC Identity Check")}</span>
                <span className="text-[11px] text-slate-400">{translate("Sécurité 100% Anti-Fraude", "100% Anti-Fraud POD")}</span>
              </div>
            </div>

            {/* Fast action CTAs & Quick Filters */}
            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              <button
                id="feed-btn-new-auction"
                onClick={() => setNewProductModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Gavel className="w-4 h-4 text-slate-950" />
                <span>{translate("Vendre aux Enchères", "Post Auction")}</span>
              </button>

              <button
                id="feed-btn-pricing"
                onClick={() => setPricingModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{translate("Pass Vendeur & Livreur", "Seller & Courier Passes")}</span>
              </button>

              <button
                id="feed-btn-shops-quick"
                onClick={() => setSelectedFeedType('shop')}
                className="px-4 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>{translate("Boutiques Officielles", "Official Stores")}</span>
              </button>

              <button
                id="feed-btn-toggle-map"
                onClick={() => setIsMapExpanded(prev => !prev)}
                className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  isMapExpanded
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-blue-950/60 hover:bg-blue-900/80 border-blue-500/40 text-blue-300'
                }`}
              >
                <Compass className="w-4 h-4 text-blue-400 animate-spin" />
                <span>{isMapExpanded ? translate('Fermer la Carte', 'Close Map') : translate('🗺️ Carte & Guidage GPS', '🗺️ Interactive Map & GPS')}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Expanded Interactive Grand Abidjan Map Section */}
      {isMapExpanded && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-300">
          <InteractiveAbidjanMap onClose={() => setIsMapExpanded(false)} />
        </section>
      )}

      {/* Filters & Search Toolbar */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="feed-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translate(
                "Rechercher un article (iPhone, TV, PS5, Jet Ski...), commune (Bassam, Assinie, Cocody...)...",
                "Search item (iPhone, TV, PS5, Jet Ski...), commune (Bassam, Assinie, Cocody...)..."
              )}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 shadow-sm"
            />
          </div>

          {/* Structured Commune & Zone Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors rounded-2xl px-3.5 py-2.5 text-xs text-slate-300 w-full sm:w-auto shadow-sm">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <select
                id="feed-commune-select"
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
                className="bg-transparent text-white focus:outline-none text-xs font-medium cursor-pointer w-full"
              >
                <option value="Toutes" className="bg-slate-900 text-white font-bold">
                  {translate("📍 Toutes les Zones (Grand Abidjan & Environs)", "📍 All Zones (Greater Abidjan & Surrounds)")}
                </option>
                
                <optgroup label={translate("── 1. Grand Abidjan (13 Communes) ──", "── 1. Greater Abidjan (13 Communes) ──")} className="bg-slate-950 text-amber-400 font-bold">
                  {COMMUNE_NAMES_ABIDJAN.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                      {c}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={translate("── 2. Villes Métropolitaines & Balnéaires ──", "── 2. Coastal & Suburban Cities ──")} className="bg-slate-950 text-cyan-400 font-bold">
                  {COMMUNE_NAMES_ENVIRONS.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-cyan-200 font-normal">
                      🌴 {c}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Categories, Vehicle & Feed Type Selection */}
        <div className="space-y-2.5">
          {/* Feed Type Filter (Enchères vs Boutiques vs Véhicules de livraison) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                id="feed-filter-all"
                onClick={() => setSelectedFeedType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFeedType === 'all'
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>🌟 {translate("Tout le Flux", "All Feed")}</span>
                <span className="text-[10px] bg-slate-800/20 px-1.5 py-0.2 rounded-md font-mono-num font-extrabold">
                  {products.length}
                </span>
              </button>

              <button
                id="feed-filter-auctions"
                onClick={() => setSelectedFeedType('auction')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFeedType === 'auction'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-amber-400 hover:bg-slate-800 border border-amber-500/30'
                }`}
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>{translate("🔨 Enchères Live", "🔨 Live Auctions")}</span>
                <span className="text-[10px] bg-black/30 text-amber-200 px-1.5 py-0.2 rounded-md font-mono-num font-extrabold">
                  {products.filter(p => p.listingType === 'auction' || (!p.listingType && !p.shopId)).length}
                </span>
              </button>

              <button
                id="feed-filter-five-bids"
                onClick={() => setSelectedFeedType('five_bids')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFeedType === 'five_bids'
                    ? 'bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-500/30'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>{translate("🎯 5 Offres / Arbitrage", "🎯 5 Bids / Arbitration")}</span>
                <span className="text-[10px] bg-black/30 text-amber-200 px-1.5 py-0.2 rounded-md font-mono-num font-extrabold">
                  {products.filter(p => p.bids.length >= 5 || p.status === 'pending_choice').length}
                </span>
              </button>

              <button
                id="feed-filter-b2b"
                onClick={() => setSelectedFeedType('b2b')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFeedType === 'b2b'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 text-cyan-300 hover:bg-slate-800 border border-blue-500/30'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{translate("🏢 Déstockage B2B Lots", "🏢 B2B Liquidation Lots")}</span>
                <span className="text-[10px] bg-blue-900/60 text-cyan-200 px-1.5 py-0.2 rounded-md font-mono-num font-extrabold">
                  {products.filter(p => p.isB2BLot || p.category === 'Déstockage B2B').length}
                </span>
              </button>
            </div>

            {/* Vehicle requirement filter options */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-xl text-xs text-slate-400">
              <span className="text-[11px] font-medium hidden sm:inline">{translate("Véhicule :", "Vehicle:")}</span>
              <button
                onClick={() => setSelectedVehicle('Tous')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  selectedVehicle === 'Tous' ? 'bg-amber-500/20 text-amber-300' : 'hover:text-white'
                }`}
              >
                {translate("Tous", "All")}
              </button>
              <button
                onClick={() => setSelectedVehicle('moto')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  selectedVehicle === 'moto' ? 'bg-emerald-500/20 text-emerald-300' : 'hover:text-white'
                }`}
              >
                <Bike className="w-3 h-3" />
                <span>{translate("Moto Express", "Express Bike")}</span>
              </button>
              <button
                onClick={() => setSelectedVehicle('cargo')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  selectedVehicle === 'cargo' ? 'bg-purple-500/20 text-purple-300' : 'hover:text-white'
                }`}
              >
                <Truck className="w-3 h-3" />
                <span>{translate("Cargo / Fourgon", "Cargo Van")}</span>
              </button>
            </div>
          </div>

          {/* Categories Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.key}
                id={`feed-category-${cat.key}`}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Auction & Shop Products Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <span>
                {selectedFeedType === 'shop' 
                  ? translate('🏪 Annonces des Boutiques Officielles', '🏪 Official Stores Listings') 
                  : selectedFeedType === 'auction' 
                    ? translate('🔨 Enchères Express en Direct', '🔨 Live Express Auctions') 
                    : isDriver ? translate('Articles & Courses Enchères Associées', 'Products & Deliveries Board') : translate('Enchères & Annonces Boutiques', 'Auctions & Store Listings')}
              </span>
              <span className="text-xs bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-mono-num font-bold">
                {filteredProducts.length} {translate("articles", "items")}
              </span>
            </h3>
            {selectedCommune !== 'Toutes' && (
              <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{translate("Zone :", "Zone:")} {selectedCommune}</span>
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {translate("Séquestre Wave Garanti 🔒", "Wave Escrow Guaranteed 🔒")}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">
              {translate(`Aucun article ne correspond à vos critères dans cette zone (${selectedCommune}).`, `No items match your criteria in this zone (${selectedCommune}).`)}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('Tous'); setSelectedCommune('Toutes'); setSelectedFeedType('all'); }}
              className="mt-3 text-xs text-amber-400 hover:underline font-bold"
            >
              {translate("Réinitialiser tous les filtres", "Reset all filters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const isShop = product.listingType === 'shop' || Boolean(product.shopId);
              const isOutOfStock = Boolean(product.isOutOfStock || (isShop && product.stockQuantity !== undefined && product.stockQuantity <= 0));
              const leadingBid = product.bids.find(b => b.isLeading) || product.bids[product.bids.length - 1];
              const bidCount = product.bids.length;
              const badgeInfo = getCommuneBadgeInfo(product.commune);
              const estDeliveryFee = getEstimatedDeliveryFee(product);
              const displayPrice = isShop ? (product.buyNowPrice || product.currentPrice) : product.currentPrice;

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => setProductDetailModal(product)}
                  className={`group bg-[#0C121E] border ${
                    isOutOfStock
                      ? 'border-red-900/40 opacity-85 hover:border-red-500/50'
                      : isShop ? 'hover:border-emerald-500/60 border-slate-800' : 'hover:border-amber-500/60 border-slate-800'
                  } rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isOutOfStock ? 'grayscale-[35%]' : ''
                      }`}
                    />

                    {/* Prominent Badges for Boutique vs Enchere vs Vendu Pinned */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
                      {product.isPinnedSold || product.status === 'sold' || product.status === 'delivered' ? (
                        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-red-400/40 flex items-center gap-1.5 backdrop-blur-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>{translate("ENCHÈRE VENDUE", "AUCTION SOLD")}</span>
                          <span className="bg-slate-950/60 text-rose-200 text-[8.5px] px-1 py-0.2 rounded font-mono">1H MAX</span>
                        </div>
                      ) : product.status === 'in_transit' ? (
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-blue-400/40 flex items-center gap-1.5 backdrop-blur-md">
                          <Bike className="w-3.5 h-3.5 text-white" />
                          <span>{translate("EN COURS DE LIVRAISON", "IN TRANSIT")}</span>
                        </div>
                      ) : product.status === 'pending_buyer_deposit' ? (
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-purple-400/40 flex items-center gap-1.5 backdrop-blur-md">
                          <ShieldCheck className="w-3.5 h-3.5 text-white" />
                          <span>{translate("DÉPÔT SÉQUESTRE EN COURS", "ESCROW DEPOSIT PENDING")}</span>
                        </div>
                      ) : isOutOfStock ? (
                        <div className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-red-400/40 flex items-center gap-1.5 backdrop-blur-md">
                          <AlertCircle className="w-3.5 h-3.5 text-white" />
                          <span>{translate("STOCK ÉPUISÉ", "OUT OF STOCK")}</span>
                        </div>
                      ) : product.isB2BLot || product.category === 'Déstockage B2B' ? (
                        product.b2bSaleKind === 'liquidation' ? (
                          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-indigo-400/40 flex items-center gap-1.5 backdrop-blur-md">
                            <Building2 className="w-3.5 h-3.5 text-indigo-200" />
                            <span>{translate("LIQUIDATION", "LIQUIDATION")} ({product.b2bTotalUnitsCount || 1} {translate("U.", "U.")})</span>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-cyan-400/40 flex items-center gap-1.5 backdrop-blur-md">
                            <Building2 className="w-3.5 h-3.5 text-cyan-200" />
                            <span>{translate("DÉSTOCKAGE", "CLEARANCE")} ({product.b2bTotalUnitsCount || 1} {translate("U.", "U.")})</span>
                          </div>
                        )
                      ) : isShop ? (
                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-emerald-400/40 flex items-center gap-1.5 backdrop-blur-md">
                          <Store className="w-3.5 h-3.5 text-emerald-100" />
                          <span>{translate("Boutique", "Store")}</span>
                          {product.sellerPlan === 'pro' && (
                            <span className="bg-amber-400 text-slate-950 text-[9px] px-1 py-0.2 rounded font-black">
                              PRO
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-amber-300/40 flex items-center gap-1.5 backdrop-blur-md">
                          <Gavel className="w-3.5 h-3.5 text-slate-950" />
                          <span>{translate("Enchère", "Auction")}</span>
                        </div>
                      )}

                      {/* Boost Flash Badge */}
                      {product.isBoosted && !product.isPinnedSold && (
                        <div className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{translate("Boost Flash", "Flash Boost")}</span>
                        </div>
                      )}
                    </div>

                    {/* Driver Delivery Fee Tag */}
                    {isDriver && (
                      <div className="absolute bottom-2.5 left-2.5 bg-emerald-500/95 backdrop-blur-sm text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                        <Bike className="w-3 h-3" />
                        <span>{translate("Course : +", "Delivery: +")} {estDeliveryFee.toLocaleString('fr-FR')} F</span>
                      </div>
                    )}

                    {/* 5 Bidders alert indicator for auctions */}
                    {!isShop && (bidCount >= 5 || product.status === 'pending_choice') && product.status !== 'in_transit' && product.status !== 'sold' && (
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-1 rounded-md text-center shadow border border-amber-300">
                        {translate("5 Enchères Atteintes - Arbitrage Vendeur", "5 Bids Reached - Seller Choice")}
                      </div>
                    )}

                    {/* Vehicle requirement badge */}
                    <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm p-1.5 rounded-lg border border-slate-700">
                      {getVehicleIcon(product.requiredVehicle)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Location Badge & Category */}
                      <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold truncate max-w-[140px] ${badgeInfo.badgeClass}`}>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{badgeInfo.label}</span>
                        </span>
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">{product.category}</span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                        {product.title}
                      </h4>

                      {/* Seller or Shop Tag */}
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const shop = getShopBySellerId(product.sellerId);
                            if (shop) {
                              setSelectedShopForView(shop);
                            }
                          }}
                          className={`truncate hover:underline flex items-center gap-1 transition-colors ${
                            isShop ? 'text-emerald-400 hover:text-emerald-300 font-bold' : 'text-slate-300 hover:text-amber-400'
                          }`}
                          title={translate("Voir la vitrine boutique", "View official storefront")}
                        >
                          <Store className={`w-3 h-3 shrink-0 ${isShop ? 'text-emerald-400' : 'text-amber-400'}`} />
                          <span className="truncate">{product.shopName || product.sellerName}</span>
                        </button>
                        {isShop ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold shrink-0">
                            {translate("Boutique", "Store")}
                          </span>
                        ) : product.sellerPlan === 'pro' ? (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold shrink-0 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 text-amber-400" />
                            <span>OR VIP</span>
                          </span>
                        ) : product.sellerPlan === 'standard' ? (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold shrink-0 flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                            <span>CERTIFIÉ</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Price & Bids / Shop Direct bar */}
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">
                            {isShop ? translate('Prix Boutique Garanti', 'Store Price') : translate('Offre actuelle', 'Current bid')}
                          </span>
                          <span className={`text-base sm:text-lg font-extrabold font-mono-num ${
                            isShop ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {displayPrice.toLocaleString('fr-FR')} F
                          </span>
                        </div>

                        <div className="text-right">
                          {isShop ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{translate("Achat Direct", "Buy Now")}</span>
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              bidCount >= 5 
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              <TrendingUp className="w-3 h-3" />
                              <span>{bidCount}/5 {translate("offres", "bids")}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      {isDriver ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.deliveryJobId) {
                              setActiveTab('dashboard_driver');
                            } else {
                              setProductDetailModal(product);
                            }
                          }}
                          className="mt-3 w-full py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>{translate("Détails Course", "Delivery Details")} (+ {estDeliveryFee.toLocaleString('fr-FR')} F)</span>
                        </button>
                      ) : isOutOfStock ? (
                        <div className="mt-3 space-y-1.5">
                          <button
                            type="button"
                            className="w-full py-2 rounded-xl bg-slate-900 border border-red-500/40 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{translate("Stock Épuisé • Bientôt dispo", "Out of Stock • Restock Soon")}</span>
                          </button>
                          {product.soldCount ? (
                            <p className="text-[10px] text-center text-slate-400 font-medium">
                              {product.soldCount} exemplaire{product.soldCount > 1 ? 's' : ''} vendu{product.soldCount > 1 ? 's' : ''}
                            </p>
                          ) : null}
                        </div>
                      ) : isShop ? (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1, 'boutique');
                                setCartModalOpen(true);
                              }}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{translate("Ajouter au Panier", "Add to Cart")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductDetailModal(product);
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                              title={translate("Voir l'article", "View item")}
                            >
                              <Store className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
                            <span>{product.stockQuantity ?? 1} en stock</span>
                            {product.soldCount ? <span>{product.soldCount} vendu{product.soldCount > 1 ? 's' : ''}</span> : null}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductDetailModal(product);
                          }}
                          className="mt-3 w-full py-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-amber-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span>{translate("Enchérir en Direct", "Place Live Bid")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
