import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Layers, 
  TrendingUp, 
  Gavel, 
  Package, 
  ShieldCheck, 
  FileText, 
  MapPin, 
  Clock, 
  Truck, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Eye, 
  Users, 
  Calendar,
  AlertCircle,
  PlusCircle,
  Laptop,
  Shirt,
  Tv,
  Briefcase,
  Boxes
} from 'lucide-react';
import { Product, B2BLotType } from '../types';
import { getCommuneBadgeInfo } from '../data/communes';

export const B2BLiquidationHub: React.FC = () => {
  const { 
    products, 
    setProductDetailModal, 
    setNewProductModalOpen, 
    currentUser, 
    setAuthModalOpen,
    translate 
  } = useApp();

  const [selectedLotType, setSelectedLotType] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minUnitsFilter, setMinUnitsFilter] = useState<number>(0);

  // Filter only B2B liquidation lots
  const b2bLots = products.filter(p => p.isB2BLot || p.category === 'Déstockage B2B');

  const filteredLots = b2bLots.filter(lot => {
    const matchesSearch = lot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (lot.b2bCompanyName && lot.b2bCompanyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          lot.commune.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedLotType === 'all' || lot.b2bLotType === selectedLotType;
    const matchesZone = selectedZone === 'all' || lot.commune.toLowerCase().includes(selectedZone.toLowerCase());
    const matchesUnits = (lot.b2bTotalUnitsCount || 1) >= minUnitsFilter;
    return matchesSearch && matchesType && matchesZone && matchesUnits;
  });

  const totalB2BVolumeFCFA = b2bLots.reduce((acc, curr) => acc + (curr.currentPrice || 0), 0);
  const totalUnitsInCatalog = b2bLots.reduce((acc, curr) => acc + (curr.b2bTotalUnitsCount || 0), 0);

  const getLotTypeIcon = (type?: B2BLotType) => {
    switch (type) {
      case 'it_fleet': return <Laptop className="w-4 h-4 text-cyan-400" />;
      case 'fashion_stock': return <Shirt className="w-4 h-4 text-pink-400" />;
      case 'appliances_stock': return <Tv className="w-4 h-4 text-amber-400" />;
      case 'office_furniture': return <Briefcase className="w-4 h-4 text-purple-400" />;
      default: return <Boxes className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLotTypeLabel = (type?: B2BLotType) => {
    switch (type) {
      case 'it_fleet': return translate('Parc Informatique & PC', 'IT Fleet & Laptops');
      case 'fashion_stock': return translate('Stock Vêtements & Chaussures', 'Fashion & Shoes Stock');
      case 'appliances_stock': return translate('Électroménager & TV', 'Appliances & TVs');
      case 'office_furniture': return translate('Mobilier de Bureau', 'Office Furniture');
      default: return translate('Lots Mixtes & Grossistes', 'Mixed Wholesale Lots');
    }
  };

  const handlePostB2BLotClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setNewProductModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Banner B2B Entreprises & Grossistes */}
      <section className="relative rounded-3xl overflow-hidden border border-blue-500/30 bg-gradient-to-br from-[#09152C] via-[#081021] to-[#040712] p-5 sm:p-8 lg:p-10 shadow-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-bold border border-blue-500/40 mb-3 shadow-sm">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>{translate("Espace B2B • Déstockage Massif & Ventes aux Enchères par Lots", "B2B Hub • Massive Liquidation & Wholesale Lot Auctions")}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-display leading-[1.15]">
            {translate("Liquidation d'Entreprises & ", "Corporate Liquidation & ")}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-amber-300">
              {translate("Déstockage Grossistes", "Wholesale Clearance")}
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed max-w-2xl">
            {translate(
              "Plateforme institutionnelle dédiée aux entreprises, distributeurs et grossistes pour liquider leurs surplus, fins de séries ou parcs informatiques renouvelés en lots complets aux enchères. Commission réduite à 5% par lot & inspection en entrepôt.",
              "Institutional platform dedicated to enterprises, distributors, and wholesalers to clear surplus inventory, end-of-lines, or renewed IT fleets in full bulk lots via auction. Reduced 5% commission per lot & warehouse inspections."
            )}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <div className="bg-[#0C162E]/90 border border-blue-900/50 p-3 rounded-2xl">
              <span className="text-blue-400 font-bold text-xs block">{b2bLots.length} {translate("Lots Actifs", "Active Lots")}</span>
              <span className="text-[11px] text-slate-400">{translate("Enchères ouvertes", "Open auctions")}</span>
            </div>
            <div className="bg-[#0C162E]/90 border border-blue-900/50 p-3 rounded-2xl">
              <span className="text-cyan-300 font-mono-num font-bold text-xs block">{totalUnitsInCatalog.toLocaleString('fr-FR')} {translate("Unités", "Units")}</span>
              <span className="text-[11px] text-slate-400">{translate("Matériel & Produits", "Equipment & Goods")}</span>
            </div>
            <div className="bg-[#0C162E]/90 border border-blue-900/50 p-3 rounded-2xl">
              <span className="text-emerald-400 font-mono-num font-bold text-xs block">{(totalB2BVolumeFCFA / 1000000).toFixed(1)}M FCFA</span>
              <span className="text-[11px] text-slate-400">{translate("Volume d'enchères", "Auction Volume")}</span>
            </div>
            <div className="bg-[#0C162E]/90 border border-blue-900/50 p-3 rounded-2xl">
              <span className="text-amber-400 font-bold text-xs block">{translate("Commission 5%", "5% Commission")}</span>
              <span className="text-[11px] text-slate-400">{translate("Par article / lot", "Per item / lot")}</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={handlePostB2BLotClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{translate("Publier un Lot d'Entreprise / Déstockage", "Post Enterprise Bulk Lot / Clearance")}</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{translate("Séquestre bancaire & Livraison Cargo Fret sécurisée", "Bank escrow & Secure heavy cargo freight")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Filter & Search Controls */}
      <section className="bg-[#0B1120] border border-[#1E293B] p-4 rounded-2xl space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translate(
                "Rechercher un lot B2B (PC Dell, Baskets, Entreprise SITEL, Zone Vridi, Yopougon...)",
                "Search B2B bulk lot (Dell PCs, Sneakers, SITEL company, Vridi, Yopougon...)"
              )}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Zone Industrielle / Commune */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 w-full sm:w-auto">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent text-white focus:outline-none text-xs font-medium cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">{translate("Toutes les Zones / Entrepôts", "All Zones / Warehouses")}</option>
                <option value="Marcory" className="bg-slate-900 text-white">Marcory Zone 4 / Vridi</option>
                <option value="Yopougon" className="bg-slate-900 text-white">Zone Industrielle Yopougon</option>
                <option value="Koumassi" className="bg-slate-900 text-white">Zone Industrielle Koumassi</option>
                <option value="Plateau" className="bg-slate-900 text-white">Le Plateau (Sièges)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories / Lot Type Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setSelectedLotType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedLotType === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{translate("Tous les Lots B2B", "All B2B Lots")} ({b2bLots.length})</span>
          </button>

          <button
            onClick={() => setSelectedLotType('it_fleet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedLotType === 'it_fleet'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            <span>{translate("Parcs IT / PC Portables", "IT Fleets / Laptops")}</span>
          </button>

          <button
            onClick={() => setSelectedLotType('fashion_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedLotType === 'fashion_stock'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 text-pink-400" />
            <span>{translate("Mode & Chaussures Gros", "Wholesale Fashion & Shoes")}</span>
          </button>

          <button
            onClick={() => setSelectedLotType('appliances_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedLotType === 'appliances_stock'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>{translate("Électroménager & TV", "Appliances & TVs")}</span>
          </button>
        </div>
      </section>

      {/* 3. B2B Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Gavel className="w-5 h-5 text-blue-400" />
            <span>{translate("Lots d'Entreprises en Vente aux Enchères", "Corporate Bulk Lots on Auction")}</span>
            <span className="text-xs bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
              {filteredLots.length} {translate("lots disponibles", "lots available")}
            </span>
          </h2>
        </div>

        {filteredLots.length === 0 ? (
          <div className="bg-[#0C1220] border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">{translate("Aucun lot de déstockage trouvé", "No bulk clearance lots found")}</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {translate(
                "Modifiez vos critères de recherche ou soyez la première entreprise à publier un lot de liquidation.",
                "Adjust your filters or be the first company to post a liquidation lot."
              )}
            </p>
            <button
              onClick={handlePostB2BLotClick}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{translate("Déposer une annonce B2B", "Post a B2B listing")}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredLots.map((lot) => {
              const leadingBid = lot.bids.length > 0 ? lot.bids[lot.bids.length - 1] : null;
              const unitEstimatedPrice = lot.b2bTotalUnitsCount ? Math.round(lot.currentPrice / lot.b2bTotalUnitsCount) : null;
              const savingsPercentage = lot.b2bEstimatedPublicValueFCFA 
                ? Math.round(((lot.b2bEstimatedPublicValueFCFA - lot.currentPrice) / lot.b2bEstimatedPublicValueFCFA) * 100)
                : null;

              return (
                <div
                  key={lot.id}
                  onClick={() => setProductDetailModal(lot)}
                  className="group bg-[#0D1527] hover:bg-[#111C35] border border-blue-900/40 hover:border-blue-500/60 rounded-3xl p-4 sm:p-5 transition-all duration-200 shadow-lg hover:shadow-blue-500/10 cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Top Enterprise Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {lot.b2bSaleKind === 'liquidation' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-extrabold text-[11px] flex items-center gap-1.5">
                            {getLotTypeIcon(lot.b2bLotType)}
                            <span>⚖️ LIQUIDATION ({lot.b2bTotalUnitsCount || 1} U.)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-cyan-300 font-extrabold text-[11px] flex items-center gap-1.5">
                            {getLotTypeIcon(lot.b2bLotType)}
                            <span>📦 DÉSTOCKAGE ({lot.b2bTotalUnitsCount || 1} U.)</span>
                          </span>
                        )}

                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-cyan-400" />
                          <span>{lot.b2bCompanyName || lot.sellerName}</span>
                        </span>
                      </div>

                      {savingsPercentage && savingsPercentage > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono-num font-extrabold text-xs border border-emerald-500/30">
                          -{savingsPercentage}% {translate("vs Prix Neuf", "vs Retail")}
                        </span>
                      )}
                    </div>

                    {/* Image & Title Card */}
                    <div className="flex gap-3.5 sm:gap-4">
                      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                        <img
                          src={lot.images?.[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400'}
                          alt={lot.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          LOT ENTIER
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                          {lot.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {lot.description}
                        </p>

                        {/* Manifest Mini Breakdown */}
                        {lot.b2bManifest && lot.b2bManifest.length > 0 && (
                          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                            <div className="font-semibold text-slate-400 flex items-center gap-1 text-[10px] uppercase">
                              <FileText className="w-3 h-3 text-cyan-400" />
                              <span>{translate("Extrait du Manifeste :", "Manifest Extract:")}</span>
                            </div>
                            <div className="space-y-0.5">
                              {lot.b2bManifest.slice(0, 2).map((m, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px]">
                                  <span className="truncate pr-2">• {m.quantity}x {m.designation}</span>
                                  <span className="font-mono text-cyan-300 text-[10px] shrink-0 font-bold">
                                    {(m.estimatedUnitValueFCFA * m.quantity).toLocaleString('fr-FR')} F
                                  </span>
                                </div>
                              ))}
                              {lot.b2bManifest.length > 2 && (
                                <div className="text-[10px] text-blue-400 italic">
                                  + {lot.b2bManifest.length - 2} {translate("autres références dans le lot", "other lines in lot")}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enterprise Details & Warehouse Location */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{lot.b2bWarehouseLocation || lot.commune}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] justify-end">
                        <Truck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{translate("Transport Cargo Fret", "Cargo Freight Transport")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Bid Bar */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                        {translate("Enchère Actuelle du Lot", "Current Lot Bid")}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-xl font-mono-num font-extrabold text-amber-400">
                          {lot.currentPrice.toLocaleString('fr-FR')} FCFA
                        </span>
                        {unitEstimatedPrice && (
                          <span className="text-[11px] font-mono text-slate-400">
                            (~{unitEstimatedPrice.toLocaleString('fr-FR')} F/unité)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductDetailModal(lot);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 group-hover:scale-105 shrink-0 cursor-pointer"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      <span>{translate("Enchérir sur le Lot", "Bid on Lot")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Why B2B Liquidation on Brad'CI Section */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#09101E] border border-slate-800 space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{translate("Pourquoi choisir le canal Déstockage & Liquidation B2B BRAD'CI ?", "Why choose BRAD'CI B2B Clearance & Liquidation channel?")}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-bold text-white text-sm">{translate("Séquestre & Solvabilité Entreprise", "Escrow & Corporate Solvency")}</h4>
            <p className="text-slate-400 leading-relaxed">
              {translate(
                "Les fonds des acheteurs sont séquestrés avant l'enlèvement du lot. Le vendeur est garanti d'être payé dès confirmation de conformité.",
                "Buyer funds are held in secure escrow prior to lot collection. The seller is guaranteed payout upon confirmed compliance."
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-bold text-white text-sm">{translate("Commission Brad'CI Fixe 5%", "Brad'CI 5% Flat Commission")}</h4>
            <p className="text-slate-400 leading-relaxed">
              {translate(
                "Une commission modérée de 5% par article / lot adjugé pour maximiser le retour financier sur vos invendus et parcs informatiques.",
                "A moderate 5% commission per lot / item sold to maximize your financial return on surplus inventory and IT fleets."
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-bold text-white text-sm">{translate("Logistique Cargo & Enlèvement Entrepôt", "Cargo Logistics & Warehouse Pickup")}</h4>
            <p className="text-slate-400 leading-relaxed">
              {translate(
                "Prise en charge par camions et fourgons partenaires pour l'acheminement des palettes et gros volumes vers les revendeurs.",
                "Supported by partner trucks and vans for transporting full pallets and heavy volume shipments directly to resellers."
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
