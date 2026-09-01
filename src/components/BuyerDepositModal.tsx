import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Sparkles,
  ArrowRight,
  Info,
  MapPin,
  Navigation,
  Headphones
} from 'lucide-react';
import { PaymentMethod } from '../types';
import { 
  COMMUNE_NAMES_ABIDJAN, 
  COMMUNE_NAMES_ENVIRONS, 
  calculateHaversineDistance, 
  getCommuneCoords, 
  findNearestCommune,
  calculateDeliveryFee
} from '../data/communes';

export const BuyerDepositModal: React.FC = () => {
  const { 
    buyerDepositModalProduct, 
    setBuyerDepositModalProduct, 
    buyerCompleteEscrowDeposit, 
    buyerDeclineSelectedOffer, 
    currentUser,
    userLocation,
    translate,
    getBuyerBlockedBalance,
    addToast
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Wave');
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser?.phone || '+225 07 55 12 34 56');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Delivery Location
  const [buyerCommune, setBuyerCommune] = useState<string>(userLocation?.commune || 'Marcory');
  const [buyerAddress, setBuyerAddress] = useState<string>(userLocation?.address || 'Zone 4C, Rue du Canal, Abidjan');
  const [buyerCoords, setBuyerCoords] = useState<{ lat: number; lng: number }>(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : getCommuneCoords('Marcory')
  );
  const [isLocatingBuyer, setIsLocatingBuyer] = useState<boolean>(false);

  if (!buyerDepositModalProduct) return null;

  const prod = buyerDepositModalProduct;
  const chosenBid = prod.bids.find(b => b.bidderId === prod.selectedBidderId) || prod.bids[0];
  const itemPrice = chosenBid ? chosenBid.amount : prod.currentPrice;

  // Real-time dynamic distance and courier delivery fee calculation
  const sellerCoords = prod.pickupCoords || getCommuneCoords(prod.commune);
  const realDistanceKm = calculateHaversineDistance(sellerCoords.lat, sellerCoords.lng, buyerCoords.lat, buyerCoords.lng);
  const distKm = Math.max(1.5, Math.round(realDistanceKm * 10) / 10);

  const deliveryFee = calculateDeliveryFee(prod.commune, buyerCommune, prod.requiredVehicle);

  const totalDeposit = itemPrice + deliveryFee;

  const captureBuyerGPS = () => {
    setIsLocatingBuyer(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setBuyerCoords({ lat: latitude, lng: longitude });
          setIsLocatingBuyer(false);
          const nearest = findNearestCommune(latitude, longitude);
          if (nearest) {
            setBuyerCommune(nearest.name);
            setBuyerAddress(prev => prev && !prev.includes('Abidjan') ? `${prev}, ${nearest.name}` : `${nearest.name}, Abidjan (Point GPS Livré)`);
          }
          addToast(
            translate('📍 GPS Destinataire Validé', '📍 Delivery GPS Validated'),
            translate(
              `Position GPS enregistrée (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Frais de coursier actualisés : ${deliveryFee.toLocaleString()} FCFA (${distKm} km).`,
              `GPS location saved (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Courier fee updated: ${deliveryFee.toLocaleString()} FCFA (${distKm} km).`
            ),
            'success'
          );
        },
        () => {
          setIsLocatingBuyer(false);
          addToast('Géolocalisation', 'Veuillez sélectionner manuellement votre commune de réception.', 'info');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocatingBuyer(false);
    }
  };

  const handlePayAndLockEscrow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      buyerCompleteEscrowDeposit(prod.id, paymentMethod);
      setIsProcessing(false);
      setBuyerDepositModalProduct(null);
    }, 600);
  };

  const handleDecline = () => {
    buyerDeclineSelectedOffer(prod.id, 'Annulation volontaire par l\'acheteur');
    setBuyerDepositModalProduct(null);
  };

  const paymentOptions: { id: PaymentMethod | 'Carte Bancaire' | 'Crypto'; label: string; logo: string; fee: string; color: string; comingSoon?: boolean }[] = [
    { id: 'Wave', label: 'Wave Mobile Money', logo: '🌊', fee: '1% sans frais cachés', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
    { id: 'Orange Money', label: 'Orange Money CI', logo: '🍊', fee: 'Paiement instantané', color: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
    { id: 'MTN MoMo', label: 'MTN Mobile Money', logo: '🟡', fee: 'Sécurisé par code PIN', color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
    { id: 'Moov Money', label: 'Moov Money Flooz', logo: '🔵', fee: 'Validation SMS', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
    { id: 'Carte Bancaire', label: 'Carte Bancaire (Visa / MC)', logo: '💳', fee: 'Bientôt disponible', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400', comingSoon: true },
    { id: 'Crypto', label: 'Crypto-Monnaies (USDT, BTC)', logo: '🪙', fee: 'Bientôt disponible', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400', comingSoon: true }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="buyer-deposit-escrow-modal"
        className="w-full max-w-xl bg-[#0B111E] border border-emerald-500/30 rounded-3xl p-4 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* Close */}
        <button
          onClick={() => setBuyerDepositModalProduct(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-500/30 mb-1">
            <Sparkles className="w-3 h-3" />
            <span>{translate("Votre offre a été retenue par le vendeur !", "Your offer was accepted by the seller!")}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-display">
            {translate("Dépôt Sécurisé sous Séquestre Anti-Fraude", "Secure Anti-Fraud Escrow Deposit")}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {translate(
              "Effectuez votre dépôt pour bloquer les fonds sous séquestre. Le vendeur ne sera payé qu'après votre inspection physique à la livraison.",
              "Make your deposit to lock funds in escrow. The seller is only paid after your physical inspection upon delivery."
            )}
          </p>
        </div>

        {/* Product Recap Card */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl mb-4 flex items-center gap-3">
          <img 
            src={prod.images[0]} 
            alt={prod.title}
            referrerPolicy="no-referrer" 
            className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" 
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{prod.title}</h4>
            <p className="text-xs text-slate-400">
              {translate("Prise en charge Vendeur :", "Seller Pickup:")} <span className="text-slate-200 font-semibold">{prod.sellerName}</span> ({prod.commune} - {prod.pickupAddress || 'Point Retrait'})
            </p>
            <p className="text-xs text-amber-400 font-bold mt-0.5 font-mono-num">
              {translate("Montant de votre offre :", "Your winning offer:")} {itemPrice.toLocaleString('fr-FR')} FCFA
            </p>
          </div>
        </div>

        {/* Buyer Delivery Address Picker */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{translate("Votre Adresse de Réception :", "Your Delivery Destination:")}</span>
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
        </div>

        {/* Escrow Blocked Balance Breakdown */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>{translate("Montant adjugé de l'article :", "Item winning bid:")}</span>
            <span className="font-mono-num font-bold text-white">{itemPrice.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>{translate(`Frais de livraison coursier (${prod.commune} ➔ ${buyerCommune}, ${distKm} km) :`, `Courier delivery fee (${prod.commune} ➔ ${buyerCommune}, ${distKm} km):`)}</span>
            <span className="font-mono-num font-bold text-amber-400">+{deliveryFee.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              {translate("Total à Bloquer sous Séquestre :", "Total to Lock in Escrow:")}
            </span>
            <span className="text-base font-extrabold text-emerald-400 font-mono-num">
              {totalDeposit.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div className="mb-4 space-y-2">
          <label className="text-xs font-bold text-slate-300 block">
            {translate("Choisissez votre moyen de paiement :", "Select your payment method:")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {paymentOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                disabled={opt.comingSoon}
                onClick={() => !opt.comingSoon && setPaymentMethod(opt.id as PaymentMethod)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  opt.comingSoon 
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-80 cursor-not-allowed'
                    : paymentMethod === opt.id 
                    ? `${opt.color} ring-2 ring-emerald-500/40 shadow-md cursor-pointer` 
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <span className="text-lg">{opt.logo}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-white truncate">{opt.label}</p>
                    {opt.comingSoon && (
                      <span className="text-[9px] bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 uppercase font-black">
                        {translate("Bientôt", "Soon")}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{opt.fee}</p>
                </div>
                {paymentMethod === opt.id && !opt.comingSoon && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Number input for Mobile Money */}
        {paymentMethod !== 'Carte Bancaire' && (
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {translate("Numéro de compte Mobile Money :", "Mobile Money phone number:")}
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono-num focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Security Warning Notice */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-5 flex items-start gap-2.5 text-[11px] text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            {translate(
              "Garantie Séquestre 100% : Vos fonds sont bloqués sur compte séquestre. En cas de non-conformité lors de la remise en main propre, vous êtes remboursé immédiatement sans frais.",
              "100% Escrow Guarantee: Your funds are held securely. If the parcel is non-compliant upon physical inspection, you are instantly refunded fee-free."
            )}
          </p>
        </div>

        {/* Action Buttons: Pay & Lock OR Decline */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="btn-buyer-decline-selected-offer"
            type="button"
            onClick={handleDecline}
            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-red-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{translate("Refuser / Annuler l'Achat", "Decline / Cancel Purchase")}</span>
          </button>

          <button
            id="btn-buyer-confirm-escrow-deposit"
            type="button"
            onClick={handlePayAndLockEscrow}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isProcessing 
                ? translate("Pré-paiement Séquestre en cours...", "Processing Prepayment...") 
                : translate(`Valider la Commande Prépayée (${totalDeposit.toLocaleString('fr-FR')} F)`, `Validate Prepaid Order (${totalDeposit.toLocaleString('fr-FR')} F)`)}
            </span>
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-3">
          {translate(
            "Si vous annulez, le vendeur recevra une alerte pour choisir parmi les 4 autres offres.",
            "If you decline, the seller will receive an alert to select among the remaining 4 bids."
          )}
        </p>
      </div>
    </div>
  );
};
