import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Gavel, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Bike, 
  Car, 
  Truck, 
  TrendingUp, 
  Crown, 
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Store,
  ShoppingBag,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Headphones,
  Star
} from 'lucide-react';
import { PaymentMethod, VehicleType } from '../types';
import { 
  getCommuneBadgeInfo,
  COMMUNE_NAMES_ABIDJAN,
  COMMUNE_NAMES_ENVIRONS,
  calculateHaversineDistance,
  getCommuneCoords,
  findNearestCommune,
  calculateDeliveryFee
} from '../data/communes';

export const ProductDetailModal: React.FC = () => {
  const { 
    productDetailModal, 
    setProductDetailModal, 
    placeBid, 
    buyShopProductDirect,
    restockProduct,
    currentUser,
    setAuthModalOpen,
    setFiveBiddersModalProduct,
    setBuyerDepositModalProduct,
    buyerDeclineSelectedOffer,
    setSelectedShopForView,
    getShopBySellerId,
    simulateFiveBids,
    translate,
    userLocation,
    addToast
  } = useApp();

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Wave');
  const [restockAmount, setRestockAmount] = useState<number>(5);

  // Buyer Delivery Location States
  const [buyerCommune, setBuyerCommune] = useState<string>(userLocation?.commune || 'Marcory');
  const [buyerAddress, setBuyerAddress] = useState<string>(userLocation?.address || 'Zone 4C, Rue du Canal, Abidjan');
  const [buyerCoords, setBuyerCoords] = useState<{ lat: number; lng: number }>(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : getCommuneCoords('Marcory')
  );
  const [isLocatingBuyer, setIsLocatingBuyer] = useState<boolean>(false);
  const [buyerGpsAccuracy, setBuyerGpsAccuracy] = useState<number | null>(userLocation?.accuracy || 15);

  if (!productDetailModal) return null;

  const prod = productDetailModal;
  const isShop = prod.listingType === 'shop' || Boolean(prod.shopId);
  const isOutOfStock = Boolean(prod.isOutOfStock || (isShop && prod.stockQuantity !== undefined && prod.stockQuantity <= 0));
  const isSeller = currentUser?.id === prod.sellerId;
  const communeBadge = getCommuneBadgeInfo(prod.commune);
  const minNextBid = prod.currentPrice + 5000;
  const currentBidCount = prod.bids.length;
  const fixedPrice = prod.buyNowPrice || prod.currentPrice;

  // Real-time distance and courier delivery fee calculation
  const sellerCoords = prod.pickupCoords || getCommuneCoords(prod.commune);
  const realDistanceKm = calculateHaversineDistance(sellerCoords.lat, sellerCoords.lng, buyerCoords.lat, buyerCoords.lng);
  const distKm = Math.max(1.5, Math.round(realDistanceKm * 10) / 10);

  const calculatedDeliveryFee = calculateDeliveryFee(prod.commune, buyerCommune, prod.requiredVehicle);

  const totalToPayBoutique = fixedPrice + calculatedDeliveryFee;

  const captureBuyerGPS = () => {
    setIsLocatingBuyer(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const coords = { lat: latitude, lng: longitude };
          setBuyerCoords(coords);
          setBuyerGpsAccuracy(Math.round(accuracy));
          setIsLocatingBuyer(false);
          const nearest = findNearestCommune(latitude, longitude);
          if (nearest) {
            setBuyerCommune(nearest.name);
            setBuyerAddress(prev => prev && !prev.includes('Abidjan') ? `${prev}, ${nearest.name}` : `${nearest.name}, Abidjan (Point GPS Destinataire)`);
          }
          addToast(
            translate('📍 Position GPS Destinataire Validée', '📍 Delivery GPS Validated'),
            translate(
              `Position capturée (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) • Précision ~${Math.round(accuracy)}m. Les frais de coursier ont été réajustés (${distKm} km).`,
              `Position captured (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) • Accuracy ~${Math.round(accuracy)}m. Courier delivery fee updated (${distKm} km).`
            ),
            'success'
          );
        },
        (err) => {
          setIsLocatingBuyer(false);
          addToast(
            translate('Géolocalisation', 'Geolocation'),
            translate('Veuillez autoriser le GPS ou choisir votre commune manuellement.', 'Please allow GPS or select your commune manually.'),
            'info'
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocatingBuyer(false);
      addToast(
        translate('GPS non supporté', 'GPS not supported'),
        translate('Veuillez sélectionner votre commune de livraison.', 'Please select your delivery commune.'),
        'warning'
      );
    }
  };

  const handlePlaceBid = (amount: number) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    placeBid(prod.id, amount);
  };

  const handleBuyShop = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    buyShopProductDirect(prod.id, selectedPaymentMethod);
  };

  const getVehicleIcon = (v: VehicleType) => {
    switch (v) {
      case 'cargo': return <Truck className="w-4 h-4 text-purple-400" />;
      case 'voiture': return <Car className="w-4 h-4 text-blue-400" />;
      default: return <Bike className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getVehicleLabel = (v: VehicleType) => {
    switch (v) {
      case 'cargo': return 'Fourgon / Cargo requis';
      case 'voiture': return 'Voiture / Coffre requis';
      default: return 'Livraison Moto Express';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="product-detail-modal-card" 
        className="w-full max-w-3xl bg-[#0C121E] border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => setProductDetailModal(null)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Images & Vehicle specs */}
          <div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video relative">
              <img
                src={prod.images[activeImageIndex] || prod.images[0]}
                alt={prod.title}
                className="w-full h-full object-cover"
              />

              {/* Badges on detail image */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                {isShop ? (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-emerald-400/40 flex items-center gap-1.5 backdrop-blur-md">
                    <Store className="w-3.5 h-3.5 text-emerald-100" />
                    <span>Boutique Officielle</span>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-amber-300/40 flex items-center gap-1.5 backdrop-blur-md">
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Enchère Express Live</span>
                  </div>
                )}

                {prod.isBoosted && (
                  <div className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md shadow flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Boost Flash</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail selector */}
            {prod.images.length > 1 && (
              <div className="flex gap-2 mt-2">
                {prod.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border transition-all ${
                      activeImageIndex === idx ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Logistics & Seller details */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Commune & Zone :</span>
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold ${communeBadge.badgeClass}`}>
                  <span>{communeBadge.label}</span>
                </span>
              </div>

              {prod.pickupAddress && (
                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Adresse de retrait :</span>
                  <span className="text-slate-300 font-medium">{prod.pickupAddress}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  {getVehicleIcon(prod.requiredVehicle)}
                  <span>Véhicule Requis :</span>
                </span>
                <span className="font-semibold text-white">{getVehicleLabel(prod.requiredVehicle)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800">
                <span className="text-slate-400">{isShop ? 'Boutique Partenaire :' : 'Vendu par :'}</span>
                <button
                  type="button"
                  onClick={() => {
                    const shop = getShopBySellerId(prod.sellerId);
                    if (shop) {
                      setProductDetailModal(null);
                      setSelectedShopForView(shop);
                    }
                  }}
                  className={`font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                    isShop 
                      ? 'text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/30' 
                      : 'text-white hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 border-slate-700'
                  }`}
                  title="Visiter la boutique officielle"
                >
                  <Store className={`w-3.5 h-3.5 ${isShop ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>{prod.shopName || prod.sellerName}</span>
                  {prod.sellerPlan === 'pro' && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Auction info or Shop Direct Engine */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {prod.category}
                </span>
                {isShop ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                    <Store className="w-3 h-3" />
                    <span>Annonce Boutique</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                    <Clock className="w-3 h-3" />
                    <span>Enchère Express Live</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('bradci_open_support', { detail: { tab: 'human' } }))}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto cursor-pointer"
                >
                  <Headphones className="w-3 h-3" />
                  <span>Support Client</span>
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug font-display">
                {prod.title}
              </h2>

              {/* Star Rating Badge */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-3.5 h-3.5 ${star <= Math.round(prod.rating || 4.8) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-white font-mono-num">
                  {(prod.rating || 4.8).toFixed(1)}/5
                </span>
                <span className="text-[11px] text-slate-400">
                  ({prod.ratingCount || 14} avis vérifiés)
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {prod.description}
              </p>

              {/* Price card: Shop vs Auction */}
              <div className={`mt-4 p-4 rounded-2xl bg-gradient-to-br ${
                isShop 
                  ? 'from-slate-900 via-emerald-950/20 to-[#0A101C] border border-emerald-500/30' 
                  : 'from-slate-900 to-[#0A101C] border border-amber-500/20'
              } shadow-lg`}>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                      {isShop ? 'Prix Boutique Garanti :' : 'Offre Actuelle :'}
                    </span>
                    <span className={`text-2xl sm:text-3xl font-extrabold font-mono-num ${
                      isShop ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {fixedPrice.toLocaleString('fr-FR')} F
                    </span>
                    <span className="text-xs text-slate-400 ml-1">CFA</span>
                  </div>

                  <div className="text-right">
                    {isShop ? (
                      <div className="flex flex-col items-end">
                        {isOutOfStock ? (
                          <span className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Stock Épuisé</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>En Stock ({prod.stockQuantity ?? 1} dispo)</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {prod.soldCount ? `${prod.soldCount} vendus` : 'Séquestre Immédiat'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] text-slate-400 block">Mise de départ :</span>
                        <span className="text-xs text-slate-300 font-mono-num">{prod.startingPrice.toLocaleString('fr-FR')} F</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status indicator & 5-Step Visual Gauge for auctions */}
                {!isShop && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        <span className="font-bold">
                          Règle Métier : {currentBidCount} / 5 Enchérisseurs
                        </span>
                      </div>
                      {currentBidCount >= 5 ? (
                        <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black shadow-sm flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span>Seuil 5/5 Atteint</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono-num">
                          Plus que {5 - currentBidCount} enchère{5 - currentBidCount > 1 ? 's' : ''} avant arbitrage
                        </span>
                      )}
                    </div>

                    {/* 5-Step Visual Pills */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((stepNum) => {
                        const isFilled = currentBidCount >= stepNum;
                        const isCurrent = currentBidCount === stepNum;
                        return (
                          <div
                            key={stepNum}
                            className={`py-1 rounded-lg text-center font-bold text-[10px] transition-all border ${
                              isFilled
                                ? stepNum === 5
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-900/60 text-slate-500 border-slate-800'
                            }`}
                          >
                            <span>Offre #{stepNum}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Simulation Trigger for testing the 5-offer rule */}
                    {currentBidCount < 5 && prod.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => simulateFiveBids(prod.id)}
                        className="mt-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 hover:from-amber-500/40 hover:to-amber-500/40 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                        title="Génère 5 enchères de démonstration à Abidjan pour déclencher l'arbitrage vendeur"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span>⚡ Simuler 5 Offres Réelles (Test Règle des 5 Enchérisseurs)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Auction Specific Notice if 5 bids reached */}
              {!isShop && currentBidCount >= 5 && (
                <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-900 border border-amber-500/40 rounded-2xl text-xs text-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold flex items-center gap-1.5 text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Seuil des 5 Enchères Atteint !</span>
                    </p>
                    <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                      Arbitrage Actif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Selon la règle métier Brad'CI, l'enchère est clôturée. Le vendeur examine les 5 propositions (montants, distances en km, paiements Wave) et choisit librement l'adjudicataire ou annule sans frais.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProductDetailModal(null);
                      setFiveBiddersModalProduct(prod);
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>🏛️ Ouvrir la Table d'Arbitrage des 5 Offres</span>
                  </button>
                </div>
              )}

              {/* Live Bids History (for auctions) or Boutique Guarantees (for shops) */}
              {!isShop ? (
                <div className="mt-4">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Historique des Enchères ({prod.bids.length}) :
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {prod.bids.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Aucune enchère pour le moment. Soyez le premier !</p>
                    ) : (
                      [...prod.bids].reverse().map((b) => (
                        <div 
                          key={b.id} 
                          className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                            b.isLeading 
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' 
                              : 'bg-slate-900/40 border border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={b.bidderAvatar} className="w-5 h-5 rounded-full object-cover" />
                            <span className="font-medium text-slate-200">{b.bidderName}</span>
                            {b.isLeading && (
                              <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 rounded">
                                EN TÊTE
                              </span>
                            )}
                          </div>
                          <div className="text-right font-mono-num font-bold">
                            {b.amount.toLocaleString('fr-FR')} F
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Garanties Boutique Certifiée Brad'CI :</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1.5 pl-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Fonds consignés sous séquestre jusqu'à validation OTP livraison.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Article vérifié conforme et disponible immédiatement.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Livraison express à domicile ou retrait en boutique au choix.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* MANDATORY PRE-PURCHASE POLICY & CANCELLATION CONDITIONS NOTICE */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-500/30 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="uppercase tracking-wide text-[11px]">Message Important Avant Tout Achat ou Enchère :</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Inspection physique sur place :</strong> Dès que le coursier arrive à votre porte, le colis doit être déballé et vérifié contradictoirement.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Conditions d'annulation :</strong> L'option "Refuser / Non-conforme" est débloquée sur place avec le livreur. En cas de refus avéré, <strong>la valeur intégrale de l'article vous est remboursée</strong> instantanément sous séquestre.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Frais de livraison :</strong> Les frais de course ({prod.deliveryFee?.toLocaleString('fr-FR') || '1 500'} FCFA) restent acquis au livreur pour couvrir son déplacement aller-retour à Abidjan.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Code OTP Secret :</strong> Ne transmettez votre Code OTP au coursier <em>qu'après validation satisfaisante</em> du produit.</span>
                </li>
              </ul>
            </div>

            {/* Action Area: Shop Buy Now vs Auction Bidding */}
            {prod.status === 'active' && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                {isShop ? (
                  <div className="space-y-3">
                    {isOutOfStock ? (
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/40 text-center space-y-1.5">
                          <div className="text-red-400 font-bold text-xs flex items-center justify-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>Stock Épuisé • Non commandable</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Tous les exemplaires ont été vendus. Un nouveau stock sera disponible bientôt.
                          </p>
                          <p className="text-[10px] text-slate-500">
                            (Règle Brad'CI : suppression automatique sous 14 jours si aucun réapprovisionnement)
                          </p>
                        </div>

                        {/* If current user is the owner/seller: Allow restock */}
                        {isSeller && (
                          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                            <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                              <span>🏪 Vous êtes le vendeur de cet article :</span>
                              <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black">
                                Réapprovisionner
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={999}
                                value={restockAmount}
                                onChange={(e) => setRestockAmount(Math.max(1, Number(e.target.value)))}
                                className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono-num font-bold text-white text-center"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  restockProduct(prod.id, restockAmount);
                                }}
                                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
                              >
                                Réactiver le produit (+{restockAmount} unités)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Buyer Delivery Address & Dynamic Courier Fee Section */}
                        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span>{translate("Adresse de Livraison du Client :", "Customer Delivery Address:")}</span>
                            </span>
                            <button
                              type="button"
                              onClick={captureBuyerGPS}
                              disabled={isLocatingBuyer}
                              className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-colors"
                            >
                              <Navigation className={`w-3 h-3 ${isLocatingBuyer ? 'animate-spin' : ''}`} />
                              <span>{isLocatingBuyer ? "GPS..." : "📍 Mon GPS"}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={buyerCommune}
                              onChange={(e) => {
                                setBuyerCommune(e.target.value);
                                setBuyerCoords(getCommuneCoords(e.target.value));
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                              <optgroup label="Abidjan (10 Communes)">
                                {COMMUNE_NAMES_ABIDJAN.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Environs">
                                {COMMUNE_NAMES_ENVIRONS.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </optgroup>
                            </select>

                            <input
                              type="text"
                              value={buyerAddress}
                              onChange={(e) => setBuyerAddress(e.target.value)}
                              placeholder="Quartier, Rue, Repère exact..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Dynamic Cost Breakdown */}
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-300">
                              <span>📦 {translate("Prix de l'article", "Item Price")} :</span>
                              <span className="font-mono-num font-bold text-white">{fixedPrice.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between text-amber-300 text-[11px]">
                              <span>🚚 {translate(`Frais Coursier (${prod.commune} ➔ ${buyerCommune}, ~${distKm} km)`, `Courier Fee (${prod.commune} ➔ ${buyerCommune}, ~${distKm} km)`)} :</span>
                              <span className="font-mono-num font-bold">+{calculatedDeliveryFee.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="border-t border-slate-800 pt-1 flex justify-between font-black text-emerald-400">
                              <span>🔒 {translate("Total Payé sous Séquestre", "Total Paid into Escrow")} :</span>
                              <span className="font-mono-num text-sm">{totalToPayBoutique.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium mb-1.5">
                            {translate("Sélectionnez le moyen de paiement pour le séquestre :", "Select payment method for escrow:")}
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                            {(['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money'] as PaymentMethod[]).map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setSelectedPaymentMethod(method)}
                                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                                  selectedPaymentMethod === method
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 flex items-center gap-1 cursor-not-allowed">
                              <span>💳 {translate("Carte Bancaire", "Credit Card")}</span>
                              <span className="text-[8px] bg-slate-800 text-purple-300 px-1 py-0.2 rounded border border-purple-500/20 uppercase font-bold">{translate("Bientôt", "Soon")}</span>
                            </span>
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 flex items-center gap-1 cursor-not-allowed">
                              <span>🪙 {translate("Crypto (USDT)", "Crypto (USDT)")}</span>
                              <span className="text-[8px] bg-slate-800 text-amber-300 px-1 py-0.2 rounded border border-amber-500/20 uppercase font-bold">{translate("Bientôt", "Soon")}</span>
                            </span>
                          </div>
                        </div>

                        {/* Direct Buy Button */}
                        <button
                          onClick={handleBuyShop}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>{translate(`Acheter & Payer Séquestre (${totalToPayBoutique.toLocaleString('fr-FR')} FCFA)`, `Buy & Pay Escrow (${totalToPayBoutique.toLocaleString('fr-FR')} FCFA)`)}</span>
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Buyer Delivery Address & Courier Fee for Auction */}
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{translate("Votre adresse de réception en cas de gain :", "Your delivery address if you win:")}</span>
                        </span>
                        <button
                          type="button"
                          onClick={captureBuyerGPS}
                          disabled={isLocatingBuyer}
                          className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-colors"
                        >
                          <Navigation className={`w-3 h-3 ${isLocatingBuyer ? 'animate-spin' : ''}`} />
                          <span>{isLocatingBuyer ? "GPS..." : "📍 Mon GPS"}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={buyerCommune}
                          onChange={(e) => {
                            setBuyerCommune(e.target.value);
                            setBuyerCoords(getCommuneCoords(e.target.value));
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <optgroup label="Abidjan (10 Communes)">
                            {COMMUNE_NAMES_ABIDJAN.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Environs">
                            {COMMUNE_NAMES_ENVIRONS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </optgroup>
                        </select>

                        <input
                          type="text"
                          value={buyerAddress}
                          onChange={(e) => setBuyerAddress(e.target.value)}
                          placeholder="Quartier, Rue, Repère exact..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-amber-300 pt-0.5">
                        <span>🚚 {translate(`Frais Coursier (${prod.commune} ➔ ${buyerCommune}, ${distKm} km)`, `Courier Fee (${prod.commune} ➔ ${buyerCommune}, ${distKm} km)`)} :</span>
                        <span className="font-mono-num font-bold">+{calculatedDeliveryFee.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                      {[5000, 10000, 25000].map((increment) => (
                        <button
                          key={increment}
                          type="button"
                          onClick={() => handlePlaceBid(prod.currentPrice + increment)}
                          className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono-num font-bold transition-all"
                        >
                          + {increment.toLocaleString('fr-FR')} F
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={minNextBid}
                        step={1000}
                        value={bidAmount || minNextBid}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono-num text-white focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handlePlaceBid(bidAmount || minNextBid)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Gavel className="w-4 h-4" />
                        <span>{translate("Enchérir", "Place Bid")}</span>
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 justify-center">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{translate(`Paiement sécurisé par séquestre ${selectedPaymentMethod}. Déblocage sur code OTP à la livraison.`, `Secured payment in ${selectedPaymentMethod} escrow. Payout released upon OTP delivery inspection.`)}</span>
                </p>
              </div>
            )}

            {/* Pending Buyer Deposit State */}
            {prod.status === 'pending_buyer_deposit' && (
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 via-slate-900 to-purple-950/20 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Offre Retenue par le Vendeur : {prod.selectedBidderName}</span>
                  </div>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    Dépôt Attendu
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  L'acheteur sélectionné doit effectuer son dépôt sous séquestre (Wave / Mobile Money). S'il refuse ou annule, le vendeur recevra une alerte pour choisir parmi les autres offres.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProductDetailModal(null);
                      setBuyerDepositModalProduct(prod);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>🔒 Effectuer le Dépôt Séquestre (Wave / MoMo)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      buyerDeclineSelectedOffer(prod.id, 'Refus par le client');
                    }}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Refuser l'Offre</span>
                  </button>
                </div>
              </div>
            )}

            {/* In Transit / Locked to Public */}
            {prod.status === 'in_transit' && (
              <div className="mt-5 p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-blue-300 font-black text-xs uppercase px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                  <Bike className="w-3.5 h-3.5" />
                  <span>Achat Effectué - Fonds sous Séquestre</span>
                </div>
                <p className="text-xs text-slate-300">
                  L'article a été adjugé à <strong>{prod.winnerName || prod.selectedBidderName}</strong>. Le coursier a été assigné et la livraison est en cours à Abidjan.
                </p>
              </div>
            )}

            {/* Sold & Delivered (1-hour pinned display) */}
            {(prod.status === 'sold' || prod.status === 'delivered') && (
              <div className="mt-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-emerald-300 font-black text-xs uppercase px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enchère Terminée & Colis Livré</span>
                </div>
                <p className="text-xs text-slate-300">
                  Transaction finalisée avec succès. Cette annonce reste affichée 1 heure en haut du site puis sera automatiquement supprimée.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
