import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Bike, 
  Car, 
  Truck, 
  Store, 
  Gavel, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Receipt, 
  Gift, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ABIDJAN_COMMUNES, getCommuneCoords } from '../data/communes';
import { calculateCartDeliveryOptimization } from '../utils/cartOptimizationEngine';
import { PaymentMethod, VehicleType } from '../types';

export const CartModal: React.FC = () => {
  const { 
    cart, 
    cartModalOpen, 
    setCartModalOpen, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart, 
    checkoutCart,
    checkKycVerifiedOrPrompt,
    currentUser,
    userLocation,
    translate
  } = useApp();

  const [deliveryCommune, setDeliveryCommune] = useState<string>(() => {
    return userLocation?.commune || currentUser?.city || 'Cocody';
  });

  const [deliveryAddress, setDeliveryAddress] = useState<string>(() => {
    return userLocation?.address || `${deliveryCommune}, Abidjan, Côte d'Ivoire`;
  });

  const [paymentChoice, setPaymentChoice] = useState<'delivery' | 'direct'>('delivery');
  const [selectedOperator, setSelectedOperator] = useState<PaymentMethod>('Wave');
  const [useReferralDiscount, setUseReferralDiscount] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!cartModalOpen) return null;

  const dropoffCoords = getCommuneCoords(deliveryCommune);
  const optimization = calculateCartDeliveryOptimization(cart, deliveryCommune, dropoffCoords);

  const availableReferralBalance = currentUser?.referralBalance || 0;
  const referralDiscountToApply = (useReferralDiscount && availableReferralBalance > 0)
    ? Math.min(availableReferralBalance, optimization.totalCostEstimate)
    : 0;

  const finalTotalAmount = Math.max(0, optimization.totalCostEstimate - referralDiscountToApply);

  const getVehicleBadge = (v: VehicleType) => {
    switch (v) {
      case 'voiture':
      case 'car':
        return { label: 'Voiture (Yango / VTC)', icon: <Car className="w-3.5 h-3.5 text-amber-400" /> };
      case 'cargo':
        return { label: 'Camionnette / Cargo', icon: <Truck className="w-3.5 h-3.5 text-purple-400" /> };
      default:
        return { label: 'Moto Express', icon: <Bike className="w-3.5 h-3.5 text-emerald-400" /> };
    }
  };

  const dominantVehicleInfo = getVehicleBadge(optimization.dominantVehicle);

  const handleConfirmCheckout = async () => {
    if (cart.length === 0) return;
    // Just-in-time KYC restriction: user cannot finalize order without verified KYC
    if (!checkKycVerifiedOrPrompt('buy')) {
      return;
    }
    setIsSubmitting(true);
    try {
      await checkoutCart(
        deliveryAddress,
        deliveryCommune,
        dropoffCoords,
        selectedOperator,
        paymentChoice,
        useReferralDiscount
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="cart-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setCartModalOpen(false)}
    >
      <div 
        id="cart-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#0B1021] border border-[#222D4A] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-100"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-display">
                  {translate("Mon Panier Multi-Articles", "My Multi-Item Cart")}
                </h2>
                {cart.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black border border-amber-500/40">
                    {optimization.totalItemCount} article{optimization.totalItemCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {cart.length > 0 
                  ? translate(
                      `Regroupement optimisé auprès de ${optimization.uniqueSellersCount} point(s) de collecte avec livraison unique.`,
                      `Consolidated pickup across ${optimization.uniqueSellersCount} seller stop(s) with single delivery.`
                    )
                  : translate("Votre panier est actuellement vide.", "Your cart is currently empty.")
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-red-400 font-bold px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-red-500/15 border border-slate-700 transition-all flex items-center gap-1"
                title="Vider tout le panier"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vider</span>
              </button>
            )}
            <button
              onClick={() => setCartModalOpen(false)}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {cart.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Votre panier est vide</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Parcourez les enchères en direct, les annonces boutiques et les lots de déstockage pour ajouter vos premiers articles.
              </p>
            </div>
            <button
              onClick={() => setCartModalOpen(false)}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              Découvrir les Articles Disponibles
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Delivery Consolidation Smart Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-blue-950/70 border border-emerald-500/40 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-300">
                      Optimisation de Tournée Active
                    </span>
                    <p className="text-[11px] text-slate-300">
                      {optimization.pickupStops.length} arrêt(s) d'enlèvement regroupés en <strong>une seule livraison finale</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-700 text-[11px] font-bold text-slate-200">
                    {dominantVehicleInfo.icon}
                    <span>{dominantVehicleInfo.label}</span>
                  </span>

                  {optimization.totalDeliverySavings > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-500/40">
                      - {optimization.totalDeliverySavings.toLocaleString('fr-FR')} FCFA économisés
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-Pickup Itinerary Steps Preview */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                {(optimization.pickupStops || []).map((stop, idx) => (
                  <div key={stop.stopId || `${stop.sellerId}-${idx}`} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center border border-blue-500/30 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="text-white font-bold block truncate">{stop.sellerName}</span>
                      <span className="text-slate-400 text-[10px] block truncate">{stop.commune} ({stop.itemCount} art.)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Items Grouped by Seller */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Articles par Vendeur ({(optimization.sellerGroups || []).length} Vendeur{(optimization.sellerGroups || []).length > 1 ? 's' : ''})</span>
              </h3>

              <div className="space-y-4">
                {(optimization.sellerGroups || []).map((group) => (
                  <div 
                    key={group.sellerId}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-sm"
                  >
                    {/* Seller Subheader */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">{group.sellerName}</span>
                          <span className="text-[10px] text-slate-400 block">{group.sellerCommune || group.commune} • {group.sellerAddress || group.pickupAddress}</span>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        Sous-total : {(group.sellerSubtotal ?? group.subtotal ?? 0).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    {/* Products in this Seller Group */}
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div 
                          key={item.id}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img 
                              src={item.imageUrl || item.productImage || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'} 
                              alt={item.title || item.productTitle} 
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0" 
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-white truncate block">{item.title || item.productTitle}</span>
                                {(item.channel === 'enchere' || (item.channel as string) === 'auction') && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                    Enchère
                                  </span>
                                )}
                                {item.channel === 'liquidation' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-cyan-300 font-bold border border-blue-500/30">
                                    B2B Lot
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-amber-400 font-mono font-bold block mt-0.5">
                                {(item.unitPrice || 0).toLocaleString('fr-FR')} FCFA <span className="text-slate-500 font-normal">/ unité</span>
                              </span>
                            </div>
                          </div>

                          {/* Quantity selector & Delete */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 p-0.5">
                              <button
                                type="button"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
                                title="Diminuer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono font-bold text-xs text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
                                title="Augmenter"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="text-xs font-mono font-bold text-white min-w-[70px] text-right">
                              {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} F
                            </span>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                              title="Supprimer l'article"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Destination & Commune Picker */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Adresse de Livraison Finale (Abidjan)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Commune de Destination :</label>
                  <select
                    value={deliveryCommune}
                    onChange={(e) => {
                      setDeliveryCommune(e.target.value);
                      setDeliveryAddress(`${e.target.value}, Abidjan`);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {ABIDJAN_COMMUNES.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name} (Zone {c.zone || 'Centrale'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Précision Adresse / Repère :</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ex: Cocody Angré 8ème Tranche, près de la pharmacie"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Referral Balance Discount Option */}
            {availableReferralBalance > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">Solde Parrainage d'Achat Disponible</span>
                    <span className="text-[11px] text-slate-400">
                      Vous disposez de <strong className="text-white font-mono">{availableReferralBalance.toLocaleString('fr-FR')} FCFA</strong> de bonus parrainage déductibles.
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={useReferralDiscount}
                    onChange={(e) => setUseReferralDiscount(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-300">
                    Appliquer (-{referralDiscountToApply.toLocaleString('fr-FR')} F)
                  </span>
                </label>
              </div>
            )}

            {/* Payment Choice Selector */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                Mode de Règlement
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentChoice('delivery')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentChoice === 'delivery'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400">Paiement Direct à la Livraison (POD)</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    0 FCFA débité maintenant. Vous payez en direct après vérification contradictoire des colis avec le coursier.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('direct')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentChoice === 'direct'
                      ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-md ring-1 ring-blue-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-300">Paiement Mobile Money Direct</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">Wave / OM / MoMo</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Règlement immédiat via Mobile Money. Votre Code Secret OTP est généré à l'avance.
                  </p>
                </button>
              </div>

              {/* Operator Picker */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {(['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money'] as PaymentMethod[]).map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setSelectedOperator(op)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedOperator === op
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            {/* Master OTP Security Guarantee Callout */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="text-white">Sécurité Maximale & 1 Seul Code OTP Panier :</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Le coursier récupère chaque article chez son vendeur respectif grâce aux codes de retrait vendeur, puis regroupe tout pour vous livrer. Vous ne communiquez votre <strong>Code Secret OTP Unique</strong> qu'une fois la commande complète entre vos mains.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer / Total Summary */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 shrink-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Sous-total Articles :</span>
                <span className="text-sm font-black text-white font-mono">
                  {(optimization.itemsSubtotal || 0).toLocaleString('fr-FR')} F
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Frais de Livraison :</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {(optimization.optimizedDeliveryFee || 0).toLocaleString('fr-FR')} F
                  </span>
                  {(optimization.totalDeliverySavings || 0) > 0 && (
                    <span className="text-[10px] text-slate-500 line-through">
                      {(optimization.rawDeliveryFeeSum || 0).toLocaleString('fr-FR')} F
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Remise Parrainage :</span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  - {(referralDiscountToApply || 0).toLocaleString('fr-FR')} F
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 uppercase font-black block">Total Net à Régler :</span>
                <span className="text-base font-black text-white font-mono">
                  {(finalTotalAmount || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCartModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-slate-700 text-center"
              >
                Continuer mes Achats
              </button>

              <button
                id="btn-confirm-cart-checkout"
                type="button"
                onClick={handleConfirmCheckout}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Optimisation & Validation en cours...</span>
                ) : (
                  <>
                    <span>Valider & Commander le Panier</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
