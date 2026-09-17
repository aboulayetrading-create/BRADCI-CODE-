import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Star,
  Gift,
  Wallet,
  Building2,
  FileText,
  Boxes,
  ShoppingCart,
  Package,
  BellRing,
  Zap,
  Heart
} from 'lucide-react';
import { PaymentMethod, VehicleType } from '../types';
import { nativeBridge } from '../utils/nativeBridge';
import { GooglePlacesAddressAutocomplete } from './GooglePlacesAddressAutocomplete';
import { 
  getCommuneBadgeInfo,
  COMMUNE_NAMES_ABIDJAN,
  COMMUNE_NAMES_ENVIRONS,
  calculateHaversineDistance,
  getCommuneCoords,
  findNearestCommune,
  calculateDeliveryFee
} from '../data/communes';
import { evaluerCredibiliteVendeur } from '../utils/sellerCredibilityEngine';

export const ProductDetailModal: React.FC = () => {
  const { 
    productDetailModal, 
    setProductDetailModal, 
    placeBid, 
    buyShopProductDirect,
    checkKycVerifiedOrPrompt,
    restockProduct,
    currentUser,
    setAuthModalOpen,
    setFiveBiddersModalProduct,
    setBuyerDepositModalProduct,
    buyerDeclineSelectedOffer,
    setSelectedShopForView,
    getShopBySellerId,
    translate,
    userLocation,
    currency,
    formatCurrency,
    applyReferralBalanceToPurchase,
    addToast,
    addToCart,
    setCartModalOpen,
    sellerSelectBidder,
    triggerOutbidSimulation,
    toggleFavorite,
    isFavorite
  } = useApp();

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Wave');
  const [paymentChoice, setPaymentChoice] = useState<'delivery' | 'direct'>('delivery');
  const [restockAmount, setRestockAmount] = useState<number>(5);
  const [useShoppingBalance, setUseShoppingBalance] = useState<boolean>(true);
  const [b2bQuantity, setB2bQuantity] = useState<number>(1);

  // Buyer Delivery Location States
  const [buyerCommune, setBuyerCommune] = useState<string>(userLocation?.commune || 'Marcory');
  const [buyerAddress, setBuyerAddress] = useState<string>(userLocation?.address || 'Zone 4C, Rue du Canal, Abidjan');
  const [buyerCoords, setBuyerCoords] = useState<{ lat: number; lng: number }>(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : getCommuneCoords('Marcory')
  );
  const [isLocatingBuyer, setIsLocatingBuyer] = useState<boolean>(false);
  const [buyerGpsAccuracy, setBuyerGpsAccuracy] = useState<number | null>(userLocation?.accuracy || 15);
  const [isPriceRising, setIsPriceRising] = useState<boolean>(false);
  const [lastBidDifference, setLastBidDifference] = useState<number | null>(null);
  const previousPriceRef = useRef<number>(productDetailModal?.currentPrice || 0);

  const isProductShop = productDetailModal?.listingType === 'shop' || Boolean(productDetailModal?.shopId);
  const currentModalPrice = productDetailModal?.currentPrice || 0;

  // Track price changes to trigger real-time rise animation (must be before early return)
  useEffect(() => {
    if (!isProductShop && currentModalPrice > previousPriceRef.current && previousPriceRef.current > 0) {
      const diff = currentModalPrice - previousPriceRef.current;
      setLastBidDifference(diff);
      setIsPriceRising(true);
      const timer = setTimeout(() => {
        setIsPriceRising(false);
      }, 2400);
      previousPriceRef.current = currentModalPrice;
      return () => clearTimeout(timer);
    }
    previousPriceRef.current = currentModalPrice;
  }, [currentModalPrice, isProductShop]);

  useEffect(() => {
    if (productDetailModal) {
      setB2bQuantity(1);
    }
  }, [productDetailModal?.id]);

  if (!productDetailModal) return null;

  const prod = productDetailModal;
  const isB2BLot = Boolean(prod.isB2BLot || prod.category === 'Déstockage B2B');
  const isShop = prod.listingType === 'shop' || Boolean(prod.shopId) || isB2BLot;
  const b2bUnitPrice = prod.b2bUnitPrice || (prod.b2bTotalUnitsCount ? Math.round(prod.currentPrice / prod.b2bTotalUnitsCount) : prod.currentPrice);
  const b2bTotalStock = prod.b2bTotalUnitsCount || prod.stockQuantity || 1;
  const activeB2bQuantity = Math.min(Math.max(1, b2bQuantity), b2bTotalStock);
  const b2bTotalStockValue = b2bUnitPrice * b2bTotalStock;
  const isOutOfStock = Boolean(prod.isOutOfStock || (isShop && !isB2BLot && prod.stockQuantity !== undefined && prod.stockQuantity <= 0) || (isB2BLot && b2bTotalStock <= 0));
  const isSeller = currentUser?.id === prod.sellerId;
  const communeBadge = getCommuneBadgeInfo(prod.commune);
  const minNextBid = prod.currentPrice + 5000;
  const currentBidCount = prod.bids.length;
  const baseItemPrice = isB2BLot ? (b2bUnitPrice * activeB2bQuantity) : (prod.buyNowPrice || prod.currentPrice);
  const fixedPrice = baseItemPrice;

  // Real-time distance and courier delivery fee calculation
  const sellerCoords = prod.pickupCoords || getCommuneCoords(prod.commune);
  const realDistanceKm = calculateHaversineDistance(sellerCoords.lat, sellerCoords.lng, buyerCoords.lat, buyerCoords.lng);
  const distKm = Math.max(1.5, Math.round(realDistanceKm * 10) / 10);

  const calculatedDeliveryFee = calculateDeliveryFee(prod.commune, buyerCommune, prod.requiredVehicle);

  const totalToPayBoutique = fixedPrice + calculatedDeliveryFee;
  const availableShoppingBalance = currentUser?.referralBalance || 0;
  const shoppingDiscount = (useShoppingBalance && availableShoppingBalance > 0) ? Math.min(availableShoppingBalance, totalToPayBoutique) : 0;
  const finalToPayBoutique = Math.max(0, totalToPayBoutique - shoppingDiscount);

  const captureBuyerGPS = async () => {
    setIsLocatingBuyer(true);
    try {
      const pos = await nativeBridge.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 });
      const latitude = pos.latitude;
      const longitude = pos.longitude;
      const accuracy = pos.accuracy;
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
    } catch (err: any) {
      setIsLocatingBuyer(false);
      console.warn('Capacitor Geolocation error:', err?.message);
      addToast(
        translate('Géolocalisation', 'Geolocation'),
        translate('Veuillez autoriser le GPS ou choisir votre commune manuellement.', 'Please allow GPS or select your commune manually.'),
        'info'
      );
    }
  };

  const handlePlaceBid = (amount: number) => {
    // Just-in-time KYC restriction: user cannot bid without verified KYC
    if (!checkKycVerifiedOrPrompt('bid')) {
      return;
    }
    placeBid(prod.id, amount);
  };

  const handleBuyShop = () => {
    // Just-in-time KYC restriction: user cannot buy without verified KYC
    if (!checkKycVerifiedOrPrompt('buy')) {
      return;
    }
    if (useShoppingBalance && shoppingDiscount > 0) {
      applyReferralBalanceToPurchase(shoppingDiscount);
    }
    buyShopProductDirect(prod.id, selectedPaymentMethod, isB2BLot ? activeB2bQuantity : 1);
  };

  const getVehicleIcon = (v: VehicleType) => {
    switch (v) {
      case 'cargo': return <Truck className="w-4 h-4 text-purple-400" />;
      default: return <Bike className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getVehicleLabel = (v: VehicleType) => {
    switch (v) {
      case 'cargo': return 'Fourgon / Cargo requis';
      default: return 'Livraison Moto Express';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="product-detail-modal-card" 
        className="w-full max-w-3xl bg-white dark:bg-[#0C121E] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Favoris Button */}
        <button
          onClick={() => prod && toggleFavorite(prod.id, prod.title)}
          className={`absolute top-5 right-14 p-1.5 rounded-xl border transition-all z-10 cursor-pointer ${
            prod && isFavorite(prod.id)
              ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30'
              : 'text-slate-500 hover:text-rose-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
          }`}
          title={prod && isFavorite(prod.id) ? 'Retirer des favoris' : 'Enregistrer dans mes favoris'}
        >
          <Heart className={`w-5 h-5 transition-transform ${prod && isFavorite(prod.id) ? 'fill-current scale-110 text-white' : ''}`} />
        </button>

        {/* Close Button */}
        <button
          onClick={() => setProductDetailModal(null)}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Images & Vehicle specs */}
          <div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 aspect-video relative">
              <img
                src={prod.images[activeImageIndex] || prod.images[0]}
                alt={prod.title}
                className="w-full h-full object-cover"
              />

              {/* Badges on detail image */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                {isB2BLot ? (
                  <div className={`text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border flex items-center gap-1.5 backdrop-blur-md ${
                    prod.b2bSaleKind === 'liquidation'
                      ? 'bg-gradient-to-r from-indigo-700 to-purple-800 border-indigo-400/40'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-700 border-blue-400/40'
                  }`}>
                    <span>{prod.b2bSaleKind === 'liquidation' ? '⚖️ Liquidation Totale' : '📦 Déstockage Surplus'}</span>
                  </div>
                ) : isShop ? (
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
                      activeImageIndex === idx ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Logistics & Seller details */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Commune & Zone :</span>
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold ${communeBadge.badgeClass}`}>
                  <span>{communeBadge.label}</span>
                </span>
              </div>

              {prod.pickupAddress && (
                <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Adresse de retrait :</span>
                  <span className="text-slate-800 dark:text-slate-300 font-medium">{prod.pickupAddress}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  {getVehicleIcon(prod.requiredVehicle)}
                  <span>Véhicule Requis :</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{getVehicleLabel(prod.requiredVehicle)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">{isShop ? 'Boutique Partenaire :' : 'Vendu par :'}</span>
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
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-500/30' 
                      : 'text-slate-800 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Visiter la boutique officielle"
                >
                  <Store className={`w-3.5 h-3.5 ${isShop ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span>{prod.shopName || prod.sellerName}</span>
                  {prod.sellerPlan === 'pro' && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Auction info or Shop Direct Engine */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                  {prod.category}
                </span>
                {prod.isB2BLot || prod.category === 'Déstockage B2B' ? (
                  prod.b2bSaleKind === 'liquidation' ? (
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/40">
                      <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Liquidation ({prod.b2bTotalUnitsCount || 1} Unités)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 dark:border-blue-500/40">
                      <Building2 className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                      <span>Déstockage ({prod.b2bTotalUnitsCount || 1} Unités)</span>
                    </span>
                  )
                ) : isShop ? (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/30">
                    <Store className="w-3 h-3" />
                    <span>Annonce Boutique</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200 dark:border-amber-500/30">
                    <Clock className="w-3 h-3" />
                    <span>Enchère Express Live</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('bradci_open_support', { detail: { tab: 'human' } }))}
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto cursor-pointer"
                >
                  <Headphones className="w-3 h-3" />
                  <span>Support Client</span>
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug font-display">
                {prod.title}
              </h2>

              {/* Star Rating Badge */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-3.5 h-3.5 ${star <= Math.round(prod.rating || 4.8) ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-num">
                  {(prod.rating || 4.8).toFixed(1)}/5
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ({prod.ratingCount || 14} avis vérifiés)
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {prod.description}
              </p>

              {/* B2B Liquidation / Déstockage Details & Manifest */}
              {(prod.isB2BLot || prod.category === 'Déstockage B2B') && (
                <div className="mt-3 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-gradient-to-br dark:from-[#0A1224] dark:to-[#060B17] border border-blue-200 dark:border-blue-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-cyan-300">
                      <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span>{prod.b2bCompanyName || prod.sellerName}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                      <span>Commission BRAD'CI : 5% par article</span>
                    </span>
                  </div>

                  {/* Warehouse Location & Inspection */}
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span><strong>Entrepôt / Retrait :</strong> {prod.b2bWarehouseLocation || prod.pickupAddress}</span>
                    </div>
                    {prod.b2bInspectionAllowed && (
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-cyan-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0" />
                        <span><strong>Visite autorisée :</strong> {prod.b2bInspectionHours || 'Sur RDV avant clôture'}</span>
                      </div>
                    )}
                  </div>

                  {/* Detailed Manifest Table */}
                  {prod.b2bManifest && prod.b2bManifest.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
                          <span>Inventaire du Lot ({prod.b2bTotalUnitsCount || 1} pièces) :</span>
                        </span>
                        {prod.b2bEstimatedPublicValueFCFA && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            Valeur marchande : {prod.b2bEstimatedPublicValueFCFA.toLocaleString('fr-FR')} F
                          </span>
                        )}
                      </div>

                      <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-800/80 scrollbar-thin">
                        {prod.b2bManifest.map((item) => (
                          <div key={item.id} className="p-2 text-[11px] flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {item.quantity}x {item.designation}
                              </div>
                              {item.specsSummary && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {item.specsSummary}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-blue-600 dark:text-cyan-300 font-bold text-[11px] block">
                                {(item.estimatedUnitValueFCFA * item.quantity).toLocaleString('fr-FR')} F
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                                (~{item.estimatedUnitValueFCFA.toLocaleString('fr-FR')} F/u)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Price card: Shop vs Auction */}
              <motion.div 
                animate={isPriceRising ? {
                  scale: [1, 1.025, 1],
                  borderColor: ['rgba(255, 91, 0, 0.3)', 'rgba(0, 200, 83, 0.9)', 'rgba(255, 91, 0, 0.4)'],
                  boxShadow: [
                    '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    '0 12px 35px -2px rgba(0, 200, 83, 0.35)',
                    '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  ]
                } : {}}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className={`mt-4 p-4 rounded-2xl relative overflow-hidden bg-slate-50 dark:bg-gradient-to-br ${
                  isShop 
                    ? 'border border-emerald-500/40 shadow-lg dark:from-slate-900 dark:via-emerald-950/20 dark:to-[#0A101C]' 
                    : isPriceRising
                      ? 'border border-[#00C853]/60 shadow-xl dark:from-[#151C33] dark:via-emerald-950/30 dark:to-[#0B1021]'
                      : 'border border-[#FF5B00]/40 shadow-lg shadow-[#FF5B00]/5 dark:from-[#151C33] dark:to-[#0B1021]'
                } transition-all duration-500`}
              >
                {/* Visual pulse beam when price surges */}
                <AnimatePresence>
                  {isPriceRising && (
                    <motion.div
                      initial={{ x: '-100%', opacity: 0.6 }}
                      animate={{ x: '200%', opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00C853]/25 to-transparent pointer-events-none skew-x-12"
                    />
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                        {isB2BLot 
                          ? "Prix d'un Article (Unitaire) :" 
                          : isShop 
                            ? 'Prix Boutique Garanti :' 
                            : 'Offre Actuelle en Direct :'}
                      </span>
                      {isB2BLot && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-[9px] font-black uppercase tracking-wider">
                          <span>À la pièce ou tout le stock</span>
                        </span>
                      )}
                      {!isShop && prod.bids.length > 0 && (
                        <motion.span
                          key={`live-badge-${prod.currentPrice}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#FF5B00]/20 text-[#FF5B00] border border-[#FF5B00]/30 text-[9px] font-black uppercase tracking-wider animate-pulse"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B00] inline-block" />
                          <span>Enchère Live</span>
                        </motion.span>
                      )}
                      {!isShop && isPriceRising && lastBidDifference && (
                        <motion.span
                          initial={{ opacity: 0, y: 6, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00C853]/20 text-[#008738] dark:text-[#00C853] border border-[#00C853]/40 text-[10px] font-black uppercase tracking-wider shadow-sm"
                        >
                          <TrendingUp className="w-3 h-3 text-[#008738] dark:text-[#00C853]" />
                          <span>+{lastBidDifference.toLocaleString('fr-FR')} F</span>
                        </motion.span>
                      )}
                    </div>
                    <div className="flex items-baseline overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={`price-${isB2BLot ? b2bUnitPrice : fixedPrice}`}
                          initial={{ 
                            opacity: 0, 
                            y: -20, 
                            scale: 0.88, 
                            filter: 'blur(3px)',
                            color: isShop ? '#00C853' : '#00E676'
                          }}
                          animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: [1.15, 1], 
                            filter: 'blur(0px)',
                            color: isShop ? '#00C853' : isPriceRising ? '#00E676' : '#FF5B00'
                          }}
                          exit={{ opacity: 0, y: 20, scale: 1.08, filter: 'blur(2px)' }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 420, 
                            damping: 22, 
                            mass: 0.7 
                          }}
                          className={`text-2xl sm:text-3xl font-black font-mono-num inline-block ${
                            isShop 
                              ? 'text-emerald-600 dark:text-[#00C853]' 
                              : isPriceRising 
                                ? 'text-emerald-600 dark:text-[#00E676] drop-shadow-sm' 
                                : 'text-[#FF5B00] drop-shadow-sm'
                          }`}
                        >
                          {currency === 'FCFA'
                            ? `${(isB2BLot ? b2bUnitPrice : fixedPrice).toLocaleString('fr-FR')} F`
                            : formatCurrency(isB2BLot ? b2bUnitPrice : fixedPrice)
                          }
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-semibold">
                        {currency === 'FCFA' 
                          ? (isB2BLot ? "CFA / article" : "CFA") 
                          : isB2BLot 
                            ? `/ article (≈ ${(isB2BLot ? b2bUnitPrice : fixedPrice).toLocaleString('fr-FR')} FCFA)` 
                            : `(≈ ${(isB2BLot ? b2bUnitPrice : fixedPrice).toLocaleString('fr-FR')} FCFA)`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {isB2BLot ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-blue-700 dark:text-cyan-300 font-bold flex items-center gap-1 bg-blue-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{b2bTotalStock} en stock</span>
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Total stock : <strong className="text-emerald-600 dark:text-emerald-400 font-mono-num">{b2bTotalStockValue.toLocaleString('fr-FR')} F</strong>
                        </span>
                      </div>
                    ) : isShop ? (
                      <div className="flex flex-col items-end">
                        {isOutOfStock ? (
                          <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Stock Épuisé</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-[#00C853] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>En Stock ({prod.stockQuantity ?? 1} dispo)</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {prod.soldCount ? `${prod.soldCount} vendus` : 'Séquestre Immédiat'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Mise de départ :</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono-num font-semibold">{prod.startingPrice.toLocaleString('fr-FR')} F</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status indicator & 5-Step Visual Gauge for auctions */}
                {!isShop && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                        <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
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
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono-num">
                          Plus que {5 - currentBidCount} enchère{5 - currentBidCount > 1 ? 's' : ''} avant arbitrage
                        </span>
                      )}
                    </div>

                    {/* 5-Step Visual Pills */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((stepNum) => {
                        const isFilled = currentBidCount >= stepNum;
                        return (
                          <div
                            key={stepNum}
                            className={`py-1 rounded-lg text-center font-bold text-[10px] transition-all border ${
                              isFilled
                                ? stepNum === 5
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                                  : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40'
                                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <span>Offre #{stepNum}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Option Vendeur : Vente directe anticipée dès 1 offre */}
              {!isShop && currentBidCount > 0 && currentBidCount < 5 && isSeller && prod.status === 'active' && (
                <div className="mt-3 p-3.5 bg-emerald-50/80 dark:bg-gradient-to-r dark:from-emerald-500/20 dark:via-teal-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/40 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>Option Vente Directe ({currentBidCount} offre{currentBidCount > 1 ? 's' : ''})</span>
                    </p>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                      Pas besoin d'attendre 5 offres
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Vous avez reçu {currentBidCount} proposition(s). Vous n'êtes pas obligé d'attendre 5 personnes : vous pouvez vendre immédiatement à un acheteur de votre choix ou continuer d'attendre.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProductDetailModal(null);
                      setFiveBiddersModalProduct(prod);
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>⚡ Vendre directement à un enchérisseur ({currentBidCount} offre{currentBidCount > 1 ? 's' : ''})</span>
                  </button>
                </div>
              )}

              {/* Auction Specific Notice if 5 bids reached */}
              {!isShop && currentBidCount >= 5 && (
                <div className="mt-3 p-3.5 bg-amber-50/80 dark:bg-gradient-to-r dark:from-amber-500/20 dark:via-amber-500/10 dark:to-slate-900 border border-amber-200 dark:border-amber-500/40 rounded-2xl text-xs text-amber-800 dark:text-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>Seuil des 5 Enchères Atteint !</span>
                    </p>
                    <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40 px-2 py-0.5 rounded font-bold">
                      Arbitrage Actif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Selon la règle métier BRAD'CI, l'enchère est clôturée. Le vendeur examine les 5 propositions (montants, distances en km, paiements Wave) et choisit librement l'adjudicataire ou annule sans frais.
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
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
                    Historique des Enchères ({prod.bids.length}) :
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {prod.bids.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">Aucune enchère pour le moment. Soyez le premier !</p>
                    ) : (
                      [...prod.bids].reverse().map((b, idx) => (
                        <motion.div 
                          key={b.id} 
                          layout
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25, delay: idx * 0.03 }}
                          className={`p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            b.isLeading 
                              ? 'bg-[#FF5B00]/15 border border-[#FF5B00]/40 text-slate-900 dark:text-white shadow-sm' 
                              : 'bg-slate-100 dark:bg-[#151C33] border border-slate-200 dark:border-[#222D4A] text-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={b.bidderAvatar} className="w-5 h-5 rounded-full object-cover" />
                            <span className="font-semibold text-slate-900 dark:text-slate-200">{b.bidderName}</span>
                            {b.isLeading && (
                              <span className="text-[9px] bg-[#FF5B00] text-white font-black px-1.5 rounded shadow-sm">
                                EN TÊTE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="font-mono-num font-black text-slate-900 dark:text-white block">
                                {currency === 'FCFA' ? `${b.amount.toLocaleString('fr-FR')} F` : formatCurrency(b.amount)}
                              </span>
                              {currency !== 'FCFA' && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                                  {b.amount.toLocaleString('fr-FR')} FCFA
                                </span>
                              )}
                            </div>
                            {isSeller && prod.status === 'active' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductDetailModal(null);
                                  sellerSelectBidder(prod.id, b.bidderId);
                                }}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-lg shadow transition-colors flex items-center gap-1 cursor-pointer"
                                title="Vendre immédiatement à cet acheteur"
                              >
                                <span>⚡ Vendre</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>Garanties Boutique Certifiée BRAD'CI :</span>
                  </div>
                  <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 pl-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Paiement Direct Mobile Money (Wave/MoMo/Carte) après inspection du colis sur place.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Article vérifié conforme et disponible immédiatement.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Livraison express à domicile ou retrait en boutique au choix.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* MANDATORY PRE-PURCHASE POLICY & CANCELLATION CONDITIONS NOTICE */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-gradient-to-r dark:from-amber-500/10 dark:via-slate-900 dark:to-amber-500/5 border border-amber-200 dark:border-amber-500/30 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="uppercase tracking-wide text-[11px]">Message Important Avant Tout Achat ou Enchère :</span>
              </div>
              <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                  <span><strong>Inspection physique sur place :</strong> Dès que le coursier arrive à votre porte, le colis doit être déballé et vérifié contradictoirement.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                  <span><strong>Paiement Direct à la Livraison :</strong> Vous ne payez via l'application qu'une fois le livreur sur place et le colis vérifié conforme.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span><strong>Code Secret de Remise :</strong> Ne transmettez votre Code Secret au coursier <em>qu'après validation satisfaisante</em> du produit.</span>
                </li>
              </ul>
            </div>

            {/* Action Area: Shop Buy Now vs Auction Bidding */}
            {prod.status === 'active' && (
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                {isShop ? (
                  <div className="space-y-3">
                    {isOutOfStock ? (
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/40 text-center space-y-1.5">
                          <div className="text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>Stock Épuisé • Non commandable</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            Tous les exemplaires ont été vendus. Un nouveau stock sera disponible bientôt.
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            (Règle BRAD'CI : suppression automatique sous 14 jours si aucun réapprovisionnement)
                          </p>
                        </div>

                        {/* If current user is the owner/seller: Allow restock */}
                        {isSeller && (
                          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-2">
                            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
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
                                className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono-num font-bold text-slate-900 dark:text-white text-center"
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
                        {/* B2B / Déstockage / Liquidation Quantity Selector */}
                        {isB2BLot && (
                          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-gradient-to-r dark:from-blue-950/60 dark:via-slate-900 dark:to-cyan-950/60 border border-blue-200 dark:border-cyan-500/40 space-y-3 mb-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {translate("Quantité à acheter (Déstockage / Liquidation) :", "Quantity to purchase (Liquidation / Clearance):")}
                                </span>
                              </div>
                              <span className="text-[10px] bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-mono-num font-bold px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-500/30">
                                {b2bTotalStock} article{b2bTotalStock > 1 ? 's' : ''} dispo
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                              {/* Stepper Input */}
                              <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setB2bQuantity(prev => Math.max(1, prev - 1))}
                                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                                  title="Diminuer la quantité"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={b2bTotalStock}
                                  value={activeB2bQuantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val)) {
                                      setB2bQuantity(Math.min(Math.max(1, val), b2bTotalStock));
                                    }
                                  }}
                                  className="w-16 bg-transparent text-center font-mono-num font-black text-slate-900 dark:text-white text-sm focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setB2bQuantity(prev => Math.min(b2bTotalStock, prev + 1))}
                                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                                  title="Augmenter la quantité"
                                >
                                  +
                                </button>
                              </div>

                              {/* Buy Entire Stock Button */}
                              <button
                                type="button"
                                onClick={() => setB2bQuantity(b2bTotalStock)}
                                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  activeB2bQuantity === b2bTotalStock
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/25'
                                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30'
                                }`}
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>{translate(`Acheter tout le stock (${b2bTotalStock} pièces)`, `Buy entire lot (${b2bTotalStock} pcs)`)}</span>
                              </button>
                            </div>

                            {/* Real-time Subtotal Breakdown */}
                            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1.5 border-t border-blue-200 dark:border-cyan-500/20">
                              <span>
                                {activeB2bQuantity} pièce{activeB2bQuantity > 1 ? 's' : ''} × {b2bUnitPrice.toLocaleString('fr-FR')} FCFA
                              </span>
                              <span className="font-mono-num font-black text-cyan-700 dark:text-cyan-300 text-xs">
                                Sous-total : {(activeB2bQuantity * b2bUnitPrice).toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Buyer Delivery Address & Dynamic Courier Fee Section */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                              <span>{translate("Adresse de Livraison du Client :", "Customer Delivery Address:")}</span>
                            </span>
                            <button
                              type="button"
                              onClick={captureBuyerGPS}
                              disabled={isLocatingBuyer}
                              className="text-[10px] bg-amber-50 dark:bg-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-colors"
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
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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

                            <GooglePlacesAddressAutocomplete
                              id="buyer-address-autocomplete"
                              value={buyerAddress}
                              onChange={setBuyerAddress}
                              onPlaceSelect={(details) => {
                                setBuyerAddress(details.address);
                                if (details.commune) {
                                  setBuyerCommune(details.commune);
                                }
                                if (details.lat && details.lng) {
                                  setBuyerCoords({ lat: details.lat, lng: details.lng });
                                }
                              }}
                              selectedCoords={buyerCoords}
                              placeholder={translate("Quartier, Repère exact (Google Places)...", "Neighborhood, exact landmark (Google Places)...")}
                              inputClassName="px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          {/* Payment Choice Selector (Pay on Delivery vs Pay Immediately) */}
                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                {translate("Options de Paiement Sécurisé :", "Secure Payment Options:")}
                              </span>
                              {currentUser?.isCodSuspended && (
                                <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-300 dark:border-red-500/30">
                                  ⚠️ Paiement Livraison Suspendu ({currentUser.prepaidOrdersCompletedCount || 0}/5 commandes prépayées)
                                </span>
                              )}
                            </div>

                            {currentUser?.isCodSuspended ? (
                              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs space-y-2">
                                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 font-bold">
                                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                  <div>
                                    <p>Option "Paiement à la Livraison" temporairement verrouillée</p>
                                    <p className="text-[11px] font-normal text-slate-600 dark:text-slate-300 mt-0.5">
                                      Suite à une absence ou une annulation lors de la présentation d'un livreur, vous devez régler d'avance <strong>5 commandes</strong> via dépôt sécurisé direct. Vous avez actuellement complété <strong>{currentUser.prepaidOrdersCompletedCount || 0}/5 commandes</strong>.
                                    </p>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                                  <div 
                                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, ((currentUser.prepaidOrdersCompletedCount || 0) / 5) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={currentUser?.isCodSuspended}
                                onClick={() => setPaymentChoice('delivery')}
                                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                  currentUser?.isCodSuspended
                                    ? 'bg-slate-100 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/60 opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                                    : paymentChoice === 'delivery'
                                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-slate-900 dark:text-white shadow-sm'
                                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">💵 Paiement à la Livraison</span>
                                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                                    {currentUser?.isCodSuspended ? 'Suspendu' : 'Recommandé'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                                  {currentUser?.isCodSuspended 
                                    ? "Débloqué après 5 commandes prépayées avec succès." 
                                    : "Inspectez votre colis devant le livreur, payez via Mobile Money sur place et donnez votre Code Secret."}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPaymentChoice('direct')}
                                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                  paymentChoice === 'direct' || currentUser?.isCodSuspended
                                    ? 'bg-purple-50 dark:bg-purple-500/15 border-purple-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-purple-500/40'
                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">🔒 Commande Prépayée (Séquestre)</span>
                                  <span className="text-[9px] bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded">
                                    {currentUser?.isCodSuspended ? 'Obligatoire' : 'Sécurisé 100%'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                                  Montant total bloqué sous séquestre d'avance. Remboursé intégralement sans frais si le colis est refusé/non-conforme à la livraison.
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Shopping Credit / Referral Balance Box */}
                          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/30 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                                <Gift className="w-4 h-4" />
                                <span>{translate("Solde d'Achat (Crédit Cadeau / Parrainage) :", "Shopping Credit (Gift / Referral Balance):")}</span>
                              </div>
                              <span className="font-mono-num font-black text-sm text-emerald-700 dark:text-emerald-300">
                                {availableShoppingBalance.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                            
                            {availableShoppingBalance > 0 ? (
                              <label className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/80 border border-emerald-300 dark:border-emerald-500/40 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={useShoppingBalance}
                                    onChange={(e) => setUseShoppingBalance(e.target.checked)}
                                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 accent-emerald-500"
                                  />
                                  <span className="text-slate-800 dark:text-slate-200 text-xs font-semibold">
                                    {translate("Appliquer mon solde d'achat", "Apply my shopping credit")}
                                  </span>
                                </div>
                                <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                  -{shoppingDiscount.toLocaleString('fr-FR')} FCFA
                                </span>
                              </label>
                            ) : (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {translate("Aucun solde d'achat disponible. Invitez des proches via votre lien de parrainage pour recevoir 1 000 FCFA par ami certifié !", "No shopping credit available. Invite friends with your referral link to earn 1,000 FCFA per verified friend!")}
                              </p>
                            )}
                          </div>

                          {/* Dynamic Cost Breakdown */}
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                            {isB2BLot ? (
                              <>
                                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                  <span>📦 {translate("Prix unitaire d'un article", "Unit Item Price")} :</span>
                                  <span className="font-mono-num font-bold text-cyan-700 dark:text-cyan-300">{b2bUnitPrice.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                  <span>🔢 {translate("Quantité sélectionnée", "Selected Quantity")} :</span>
                                  <span className="font-mono-num font-bold text-slate-900 dark:text-white">{activeB2bQuantity} / {b2bTotalStock}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                  <span>🛒 {translate("Sous-total articles", "Items Subtotal")} :</span>
                                  <span className="font-mono-num font-bold text-slate-900 dark:text-white">{(b2bUnitPrice * activeB2bQuantity).toLocaleString('fr-FR')} FCFA</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                <span>📦 {translate("Prix de l'article", "Item Price")} :</span>
                                <span className="font-mono-num font-bold text-slate-900 dark:text-white">{fixedPrice.toLocaleString('fr-FR')} FCFA</span>
                              </div>
                            )}
                            <div className="flex justify-between text-amber-700 dark:text-amber-300 text-[11px]">
                              <span>🚚 {translate(`Frais Coursier (${prod.commune} ➔ ${buyerCommune}, ~${distKm} km)`, `Courier Fee (${prod.commune} ➔ ${buyerCommune}, ~${distKm} km)`)} :</span>
                              <span className="font-mono-num font-bold">+{calculatedDeliveryFee.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            {shoppingDiscount > 0 && (
                              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                                <span>🎁 {translate("Déduction Solde d'Achat", "Shopping Credit Discount")} :</span>
                                <span className="font-mono-num">-{shoppingDiscount.toLocaleString('fr-FR')} FCFA</span>
                              </div>
                            )}
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-1 flex justify-between font-black text-emerald-600 dark:text-emerald-400">
                              <span>💵 {paymentChoice === 'delivery' ? translate("Total à Payer à la Livraison :", "Total to Pay on Delivery:") : translate("Total Dépôt Séquestre :", "Total Escrow Deposit:")}</span>
                              <span className="font-mono-num text-sm">{finalToPayBoutique.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium mb-1.5">
                            {translate("Moyen de paiement Mobile Money :", "Mobile Money Payment Method:")}
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                            {(['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money'] as PaymentMethod[]).map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setSelectedPaymentMethod(method)}
                                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                                  selectedPaymentMethod === method
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow'
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 flex items-center gap-1 cursor-not-allowed">
                              <span>💳 {translate("Carte Bancaire", "Credit Card")}</span>
                              <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-purple-700 dark:text-purple-300 px-1 py-0.2 rounded border border-purple-300 dark:border-purple-500/20 uppercase font-bold">{translate("Bientôt", "Soon")}</span>
                            </span>
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 flex items-center gap-1 cursor-not-allowed">
                              <span>🪙 {translate("Crypto (USDT)", "Crypto (USDT)")}</span>
                              <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-amber-700 dark:text-amber-300 px-1 py-0.2 rounded border border-amber-300 dark:border-amber-500/20 uppercase font-bold">{translate("Bientôt", "Soon")}</span>
                            </span>
                          </div>
                        </div>

                        {/* Actions: Add to Cart and Direct Buy */}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <button
                            type="button"
                            id="btn-modal-add-to-cart"
                            onClick={() => {
                              addToCart(
                                prod, 
                                isB2BLot ? activeB2bQuantity : 1, 
                                isB2BLot ? (prod.b2bSaleKind === 'liquidation' ? 'liquidation' : 'destockage') : 'boutique'
                              );
                              setProductDetailModal(null);
                              setCartModalOpen(true);
                            }}
                            className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>
                              {isB2BLot 
                                ? translate(`Ajouter au Panier (${activeB2bQuantity})`, `Add to Cart (${activeB2bQuantity})`)
                                : translate("Ajouter au Panier", "Add to Cart")
                              }
                            </span>
                          </button>

                          <button
                            id="btn-modal-buy-direct"
                            onClick={handleBuyShop}
                            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>
                              {paymentChoice === 'delivery' 
                                ? translate(`Commander Direct (${finalToPayBoutique.toLocaleString('fr-FR')} F)`, `Direct Order (${finalToPayBoutique.toLocaleString('fr-FR')} F)`)
                                : translate(`Paiement Séquestre (${finalToPayBoutique.toLocaleString('fr-FR')} F)`, `Escrow Pay (${finalToPayBoutique.toLocaleString('fr-FR')} F)`)
                              }
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Alerte Urgente si l'utilisateur a été dépassé sur cette enchère */}
                    {(() => {
                      const isUserLeading = prod.bids.some(b => b.isLeading && b.bidderId === currentUser?.id);
                      const hasUserBid = prod.bids.some(b => b.bidderId === currentUser?.id);
                      const isUserOutbid = hasUserBid && !isUserLeading && prod.status === 'active';

                      if (!isUserOutbid) return null;

                      return (
                        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-gradient-to-r dark:from-red-500/25 dark:via-red-950/40 dark:to-amber-950/30 border-2 border-red-500/70 shadow-lg shadow-red-500/20 text-xs space-y-2 mb-3 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-300 font-black text-xs sm:text-sm">
                              <BellRing className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 animate-bounce" />
                              <span>Alerte Surenchère : Vous avez été dépassé !</span>
                            </div>
                            <span className="text-[10px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                              Reprenez la main
                            </span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-100 text-xs leading-relaxed">
                            Un utilisateur a surenchéri à <strong className="text-amber-600 dark:text-amber-300 font-mono-num font-black text-sm">{prod.currentPrice.toLocaleString('fr-FR')} FCFA</strong>. Reprenez la main dès maintenant avant l'attribution !
                          </p>
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">Surenchérir vite :</span>
                            {[5000, 10000, 25000, 50000].map(inc => (
                              <button
                                key={inc}
                                type="button"
                                onClick={() => handlePlaceBid(prod.currentPrice + inc)}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
                              >
                                + {inc.toLocaleString('fr-FR')} F
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Buyer Delivery Address & Courier Fee for Auction */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>{translate("Votre adresse de réception en cas de gain :", "Your delivery address if you win:")}</span>
                        </span>
                        <button
                          type="button"
                          onClick={captureBuyerGPS}
                          disabled={isLocatingBuyer}
                          className="text-[10px] bg-amber-50 dark:bg-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-colors"
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
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-amber-700 dark:text-amber-300 pt-0.5">
                        <span>🚚 {translate(`Frais Coursier (${prod.commune} ➔ ${buyerCommune}, ${distKm} km)`, `Courier Fee (${prod.commune} ➔ ${buyerCommune}, ${distKm} km)`)} :</span>
                        <span className="font-mono-num font-bold">+{calculatedDeliveryFee.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    </div>

                    {/* User Wallet Balance for Bidding Notice */}
                    {currentUser && (
                      <div className="mb-2.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                          <Wallet className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>{translate("Votre Solde Disponible Wave/Wallet :", "Your Available Wave/Wallet Balance:")}</span>
                        </span>
                        <span className="font-mono-num font-bold text-amber-600 dark:text-amber-300 text-xs">
                          {(currentUser.walletBalance || 0).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                      {[5000, 10000, 25000].map((increment) => (
                        <button
                          key={increment}
                          type="button"
                          onClick={() => handlePlaceBid(prod.currentPrice + increment)}
                          className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono-num font-bold transition-all cursor-pointer"
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
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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
                  <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  <span>{translate(`Paiement sécurisé par séquestre ${selectedPaymentMethod}. Déblocage sur Code Secret à la livraison.`, `Secured payment in ${selectedPaymentMethod} escrow. Payout released upon secret code delivery inspection.`)}</span>
                </p>
              </div>
            )}

            {/* Pending Buyer Deposit State */}
            {prod.status === 'pending_buyer_deposit' && (
              <div className="mt-5 p-4 rounded-2xl bg-purple-50 dark:bg-gradient-to-r dark:from-purple-900/30 dark:via-slate-900 dark:to-purple-950/20 border border-purple-200 dark:border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Offre Retenue par le Vendeur : {prod.selectedBidderName}</span>
                  </div>
                  <span className="text-[9px] bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    Dépôt Attendu
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
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
                    className="py-2.5 px-3 bg-slate-100 hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-950/40 border border-slate-300 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500/40 text-slate-700 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Refuser l'Offre</span>
                  </button>
                </div>
              </div>
            )}

            {/* In Transit / Locked to Public */}
            {prod.status === 'in_transit' && (
              <div className="mt-5 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/40 text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-blue-800 dark:text-blue-300 font-black text-xs uppercase px-3 py-1 bg-blue-100 dark:bg-blue-500/10 rounded-full border border-blue-300 dark:border-blue-500/20">
                  <Bike className="w-3.5 h-3.5" />
                  <span>Achat Effectué - Fonds sous Séquestre</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  L'article a été adjugé à <strong>{prod.winnerName || prod.selectedBidderName}</strong>. Le coursier a été assigné et la livraison est en cours à Abidjan.
                </p>
              </div>
            )}

            {/* Sold & Delivered (1-hour pinned display) */}
            {(prod.status === 'sold' || prod.status === 'delivered') && (
              <div className="mt-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-xs uppercase px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 rounded-full border border-emerald-300 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enchère Terminée & Colis Livré</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
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
