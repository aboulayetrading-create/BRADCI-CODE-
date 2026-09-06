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
  CheckCircle2,
  Compass,
  Store,
  Power,
  Package,
  Users,
  Navigation,
  AlertCircle,
  Building2,
  ShoppingCart,
  Zap,
  Check,
  Eye,
  X,
  RotateCcw
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
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

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

      {/* Expanded Interactive Grand Abidjan Map Section */}
      {isMapExpanded && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-300">
          <InteractiveAbidjanMap onClose={() => setIsMapExpanded(false)} />
        </section>
      )}

      {/* Filters & Search Toolbar - Ultra Clean Command Bar */}
      <section className="bg-[#0B111D] border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl space-y-3.5">
        {/* Top line: Search Bar & Structured Commune Picker */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search bar with clear button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="feed-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translate(
                "Rechercher un article (iPhone, TV, PS5, Moto, Sac...), commune (Bassam, Cocody, Yopougon...)...",
                "Search item (iPhone, TV, PS5, Bike, Bag...), commune (Bassam, Cocody, Yopougon...)..."
              )}
              className="w-full bg-slate-900/95 border border-slate-800 hover:border-slate-700 focus:border-amber-500/60 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                title={translate("Effacer la recherche", "Clear search")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Commune, Map Toggle & Quick Reset */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex items-center bg-slate-900/95 border border-slate-800 hover:border-amber-500/40 rounded-xl px-3 py-2.5 text-xs text-slate-200 w-full md:w-auto shadow-inner transition-colors">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mr-2" />
              <select
                id="feed-commune-select"
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
                className="bg-transparent text-white focus:outline-none text-xs font-semibold cursor-pointer w-full md:w-64 pr-2"
              >
                <option value="Toutes" className="bg-slate-950 text-white font-bold">
                  {translate("📍 Toutes les Zones (Grand Abidjan & Environs)", "📍 All Zones (Greater Abidjan & Surrounds)")}
                </option>
                
                <optgroup label={translate("── Grand Abidjan (13 Communes) ──", "── Greater Abidjan (13 Communes) ──")} className="bg-slate-950 text-amber-400 font-bold">
                  {COMMUNE_NAMES_ABIDJAN.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                      {c}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={translate("── Villes Métropolitaines & Balnéaires ──", "── Coastal & Metropolitan Cities ──")} className="bg-slate-950 text-cyan-400 font-bold">
                  {COMMUNE_NAMES_ENVIRONS.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-cyan-200 font-normal">
                      🌴 {c}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Map toggle button */}
            <button
              id="feed-btn-toggle-map"
              type="button"
              onClick={() => setIsMapExpanded(prev => !prev)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
                isMapExpanded
                  ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/20'
                  : 'bg-slate-900/95 hover:bg-slate-800 border-slate-800 hover:border-blue-500/40 text-blue-300'
              }`}
              title={translate("Afficher / Masquer la carte GPS", "Show / Hide GPS Map")}
            >
              <Compass className={`w-4 h-4 text-blue-400 ${isMapExpanded ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isMapExpanded ? translate('Fermer Carte', 'Close Map') : translate('Carte GPS', 'GPS Map')}</span>
            </button>

            {/* Quick reset button if any filter is active */}
            {(searchQuery || selectedCategory !== 'Tous' || selectedCommune !== 'Toutes' || selectedFeedType !== 'all' || selectedVehicle !== 'Tous') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Tous');
                  setSelectedCommune('Toutes');
                  setSelectedFeedType('all');
                  setSelectedVehicle('Tous');
                }}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/40 rounded-xl transition-all shrink-0 cursor-pointer shadow-sm"
                title={translate("Réinitialiser les filtres", "Reset filters")}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Middle line: Feed Type Tabs & Vehicle Filter in a clean row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/60">
          {/* Feed Types: All, Boutiques, Enchères, 5 Offres, B2B */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              id="feed-filter-all"
              type="button"
              onClick={() => setSelectedFeedType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFeedType === 'all'
                  ? 'bg-white text-slate-950 shadow-md scale-[1.02]'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>🌟 {translate("Tout le Flux", "All Feed")}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-num font-extrabold ${
                selectedFeedType === 'all' ? 'bg-slate-200 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              id="feed-filter-shops"
              type="button"
              onClick={() => setSelectedFeedType('shop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFeedType === 'shop'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-900/90 text-emerald-400 hover:bg-slate-800 border border-emerald-500/30'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{translate("🏪 Boutiques Officielles", "🏪 Official Stores")}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-num font-extrabold ${
                selectedFeedType === 'shop' ? 'bg-black/30 text-emerald-200' : 'bg-emerald-950 text-emerald-300'
              }`}>
                {products.filter(p => p.listingType === 'shop' || p.shopId).length}
              </span>
            </button>

            <button
              id="feed-filter-b2b"
              type="button"
              onClick={() => setSelectedFeedType('b2b')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFeedType === 'b2b'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                  : 'bg-slate-900/90 text-cyan-300 hover:bg-slate-800 border border-blue-500/30'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{translate("🏢 Déstockage B2B", "🏢 B2B Lots")}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-num font-extrabold ${
                selectedFeedType === 'b2b' ? 'bg-blue-900/80 text-cyan-200' : 'bg-slate-800 text-cyan-300'
              }`}>
                {products.filter(p => p.isB2BLot || p.category === 'Déstockage B2B').length}
              </span>
            </button>
          </div>

          {/* Vehicle requirement toggle */}
          <div className="flex items-center gap-1 bg-slate-900/95 border border-slate-800 p-1 rounded-xl text-xs text-slate-400">
            <span className="text-[11px] font-semibold px-2 text-slate-400 hidden sm:inline">
              {translate("Transport :", "Transport:")}
            </span>
            <button
              type="button"
              onClick={() => setSelectedVehicle('Tous')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedVehicle === 'Tous' ? 'bg-slate-800 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              {translate("Tous", "All")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedVehicle('moto')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                selectedVehicle === 'moto' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'hover:text-white'
              }`}
            >
              <Bike className="w-3 h-3 text-emerald-400" />
              <span>{translate("Moto", "Bike")}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedVehicle('cargo')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                selectedVehicle === 'cargo' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' : 'hover:text-white'
              }`}
            >
              <Truck className="w-3 h-3 text-purple-400" />
              <span>{translate("Fourgon", "Cargo")}</span>
            </button>
          </div>
        </div>

        {/* Bottom line: Categories Chips Strip */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              id={`feed-category-${cat.key}`}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-black scale-[1.02]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Auction & Shop Products Grid Section */}
      <section>
        {/* Section Header with verified counter and guarantee badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-white font-display flex items-center gap-2">
              <span>
                {selectedFeedType === 'shop' 
                  ? translate('🏪 Annonces des Boutiques Officielles', '🏪 Official Stores Listings') 
                  : selectedFeedType === 'auction' 
                    ? translate('🔨 Enchères Express en Direct', '🔨 Live Express Auctions') 
                    : selectedFeedType === 'b2b'
                      ? translate('🏢 Lots & Déstockage Professionnel', '🏢 Professional B2B Lots')
                      : isDriver 
                        ? translate('Articles & Courses Enchères Associées', 'Products & Deliveries Board') 
                        : translate('Articles & Enchères Disponibles', 'Available Items & Auctions')}
              </span>
              <span className="text-xs bg-slate-800 text-amber-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono-num font-bold">
                {filteredProducts.length} {translate("articles", "items")}
              </span>
            </h3>
            {selectedCommune !== 'Toutes' && (
              <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{translate("Zone :", "Zone:")} {selectedCommune}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{translate("Paiement Direct à la Livraison Garanti", "Direct Pay on Delivery Guaranteed")}</span>
            </span>
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">
              {translate(`Aucun article ne correspond à vos critères dans cette zone (${selectedCommune}).`, `No items match your criteria in this zone (${selectedCommune}).`)}
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCategory('Tous'); setSelectedCommune('Toutes'); setSelectedFeedType('all'); setSelectedVehicle('Tous'); }}
              className="mt-3 text-xs text-amber-400 hover:underline font-bold cursor-pointer"
            >
              {translate("Réinitialiser tous les filtres", "Reset all filters")}
            </button>
          </div>
        ) : (
          /* Product Grid: Ultra Propre Articles & Buttons */
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
                      : isShop 
                        ? 'border-slate-800/90 hover:border-emerald-500/50 hover:shadow-emerald-500/5' 
                        : 'border-slate-800/90 hover:border-amber-500/50 hover:shadow-amber-500/5'
                  } rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between`}
                >
                  {/* Image Container with Badges */}
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isOutOfStock ? 'grayscale-[35%]' : ''
                      }`}
                    />
                    {/* Subtle bottom dark gradient for badge legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C121E] via-transparent to-transparent opacity-80 pointer-events-none" />

                    {/* Top-Left Category & Mode Badge */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
                      {product.isPinnedSold || product.status === 'sold' || product.status === 'delivered' ? (
                        <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-rose-400/40 flex items-center gap-1.5 backdrop-blur-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>{translate("ENCHÈRE VENDUE", "AUCTION SOLD")}</span>
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
                        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-cyan-400/40 flex items-center gap-1.5 backdrop-blur-md">
                          <Building2 className="w-3.5 h-3.5 text-cyan-200" />
                          <span>{translate("LOT B2B", "B2B LOT")} ({product.b2bTotalUnitsCount || 1} U.)</span>
                        </div>
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
                          <span>{translate("Enchère Express", "Live Auction")}</span>
                        </div>
                      )}

                      {/* Boost Flash Badge */}
                      {product.isBoosted && !product.isPinnedSold && (
                        <div className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{translate("Boost Flash", "Flash Boost")}</span>
                        </div>
                      )}
                    </div>

                    {/* Top-Right Vehicle Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/80 text-[11px] font-bold text-slate-200 flex items-center gap-1 shadow-sm">
                      {getVehicleIcon(product.requiredVehicle)}
                      <span className="capitalize text-[10px] hidden xs:inline">{product.requiredVehicle}</span>
                    </div>

                    {/* Bottom-Left Image Badges: Delivery Fee or Live Alert */}
                    {isDriver ? (
                      <div className="absolute bottom-2.5 left-2.5 bg-emerald-500/95 backdrop-blur-sm text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md shadow flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5" />
                        <span>{translate("Course : +", "Delivery: +")} {estDeliveryFee.toLocaleString('fr-FR')} F</span>
                      </div>
                    ) : !isShop && (bidCount >= 5 || product.status === 'pending_choice') && product.status !== 'in_transit' && product.status !== 'sold' ? (
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-1 rounded-md text-center shadow border border-amber-300">
                        {translate("5 Enchères Atteintes - Arbitrage Vendeur", "5 Bids Reached - Seller Choice")}
                      </div>
                    ) : (
                      <div className="absolute bottom-2 left-2.5 bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[9.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>{translate("Paiement Direct à la Livraison", "Direct Pay on Delivery")}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Location Badge & Category */}
                      <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-semibold truncate max-w-[150px] ${badgeInfo.badgeClass}`}>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{badgeInfo.label}</span>
                        </span>
                        <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>

                      {/* Product Title */}
                      <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                        {product.title}
                      </h4>

                      {/* Seller / Boutique Identity */}
                      <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
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
                            <span>VIP</span>
                          </span>
                        ) : product.sellerPlan === 'standard' ? (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold shrink-0 flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                            <span>CERTIFIÉ</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Price & Action Section: Ultra Propre & High Converting */}
                    <div className="mt-4 pt-3 border-t border-slate-800/90">
                      {/* Price header row */}
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                            {isShop ? translate('Prix Direct Boutique', 'Store Price') : translate('Offre Actuelle', 'Current bid')}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-lg sm:text-xl font-black font-mono-num ${
                              isShop ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {displayPrice.toLocaleString('fr-FR')}
                            </span>
                            <span className="text-xs font-bold text-slate-400">FCFA</span>
                          </div>
                        </div>

                        <div className="text-right">
                          {isShop ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{translate("Achat Immédiat", "Instant Buy")}</span>
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              bidCount >= 5 
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              <TrendingUp className="w-3 h-3 text-amber-400" />
                              <span>{bidCount}/5 {translate("offres", "bids")}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action & Order Buttons */}
                      {isDriver ? (
                        /* Driver Action */
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
                          className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Bike className="w-4 h-4" />
                          <span>{translate("Prendre la Course", "Accept Delivery")} (+ {estDeliveryFee.toLocaleString('fr-FR')} F)</span>
                        </button>
                      ) : isOutOfStock ? (
                        /* Out of stock */
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 rounded-xl bg-slate-900 border border-red-500/30 text-red-400/80 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span>{translate("Stock Épuisé • Bientôt dispo", "Out of Stock • Restock Soon")}</span>
                          </button>
                          {product.soldCount ? (
                            <p className="text-[10px] text-center text-slate-500 font-medium">
                              {product.soldCount} exemplaire{product.soldCount > 1 ? 's' : ''} vendu{product.soldCount > 1 ? 's' : ''}
                            </p>
                          ) : null}
                        </div>
                      ) : isShop ? (
                        /* Official Store: Direct Commander + Panier + Quick View */
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            {/* Primary: Commander Directement */}
                            <button
                              id={`btn-order-direct-${product.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1, 'boutique');
                                setCartModalOpen(true);
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
                              title={translate("Commander immédiatement avec paiement à la livraison", "Order now with pay on delivery")}
                            >
                              <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
                              <span>{translate("Commander", "Order Now")}</span>
                            </button>

                            {/* Secondary: Ajouter au Panier with instant confirmation */}
                            <button
                              id={`btn-add-cart-${product.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1, 'boutique');
                                setRecentlyAddedId(product.id);
                                setTimeout(() => {
                                  setRecentlyAddedId((prev) => (prev === product.id ? null : prev));
                                }, 2200);
                              }}
                              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                                recentlyAddedId === product.id
                                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                              }`}
                              title={translate("Ajouter au panier", "Add to cart")}
                            >
                              {recentlyAddedId === product.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[11px] font-bold">{translate("Ajouté !", "Added!")}</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="hidden sm:inline text-[11px] font-medium">{translate("Panier", "Cart")}</span>
                                </>
                              )}
                            </button>

                            {/* Quick Eye detail */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductDetailModal(product);
                              }}
                              className="px-2.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer shrink-0"
                              title={translate("Voir tous les détails", "View details")}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Reassurance text */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5 font-medium">
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{translate("Paiement Direct à la Livraison", "Pay on Delivery")}</span>
                            </span>
                            <span>{product.stockQuantity ?? 1} en stock</span>
                          </div>
                        </div>
                      ) : product.isB2BLot || product.category === 'Déstockage B2B' ? (
                        /* B2B Lot Action */
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`btn-order-b2b-${product.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductDetailModal(product);
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] cursor-pointer"
                            >
                              <Building2 className="w-3.5 h-3.5 text-cyan-200" />
                              <span>{translate("Commander le Lot", "Order Lot")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductDetailModal(product);
                              }}
                              className="px-2.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer shrink-0"
                              title={translate("Voir détails du lot", "View lot details")}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5 font-medium">
                            <span className="text-cyan-400 font-semibold">
                              {translate("Lot vérifié avec facture", "Verified lot with invoice")}
                            </span>
                            <span>{product.b2bTotalUnitsCount || 1} {translate("unités", "units")}</span>
                          </div>
                        </div>
                      ) : (
                        /* Auction Action */
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`btn-bid-direct-${product.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductDetailModal(product);
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
                            >
                              <Gavel className="w-3.5 h-3.5" />
                              <span>{translate("Enchérir en Direct", "Place Live Bid")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductDetailModal(product);
                              }}
                              className="px-2.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer shrink-0"
                              title={translate("Voir détails et historique", "View details and bids")}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5 font-medium">
                            <span className="flex items-center gap-1 text-amber-300 font-semibold">
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{bidCount}/5 offres • Choix vendeur</span>
                            </span>
                            <span className="text-slate-500 font-mono">1h max</span>
                          </div>
                        </div>
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
