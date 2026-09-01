import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Check, 
  CheckCircle2,
  Sparkles, 
  Crown, 
  Bike, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { SellerPlan, DriverPlan } from '../types';

export const PricingModal: React.FC = () => {
  const { 
    pricingModalOpen, 
    setPricingModalOpen, 
    targetPlanForPricing, 
    purchaseSubscription,
    currentUser,
    translate
  } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<SellerPlan | DriverPlan | 'boost'>(
    targetPlanForPricing || 'standard'
  );
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange' | 'mtn' | 'moov'>('wave');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '+225 07 48 92 11 34');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!pricingModalOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      purchaseSubscription(selectedPlan, paymentMethod);
    }, 1200);
  };

  const getNumericPrice = (plan: SellerPlan | DriverPlan | 'boost'): number => {
    switch (plan) {
      case 'boost': return 1000;
      case 'standard': return 5000;
      case 'pro': return 10000;
      case 'vip_pass': return 6000;
      default: return 0;
    }
  };

  const getPlanPrice = (plan: SellerPlan | DriverPlan | 'boost') => {
    switch (plan) {
      case 'boost': return '1 000 FCFA';
      case 'standard': return `5 000 FCFA / ${translate('mois', 'mo')}`;
      case 'pro': return `10 000 FCFA / ${translate('mois', 'mo')}`;
      case 'vip_pass': return `6 000 FCFA / ${translate('mois', 'mo')}`;
      default: return '0 FCFA';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="pricing-modal-card" 
        className="w-full max-w-4xl bg-[#0C121E] border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => setPricingModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3.5 py-1 rounded-full text-xs font-bold border border-emerald-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{translate("Publication 100% Illimitée & Gratuite pour Tous", "100% Free & Unlimited Listings for All")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {translate("Passez au Niveau Supérieur avec les Pass BRAD'CI", "Level Up Your Business with BRAD'CI Passes")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            {translate(
              "Les comptes basiques publient librement sans limite. Les Pass Professionnels vous permettent de passer au sérieux : réduisez drastiquement vos commissions, obtenez un badge de confiance certifié et maximisez vos ventes.",
              "Basic accounts post freely with zero limits. Professional Passes let you get serious: drastically cut commission fees, get certified trust badges, and maximize your sales."
            )}
          </p>
        </div>

        {/* Free Basic Perks Reminder Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-900/80 to-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">{translate("Compte Basique Gratuit (0 FCFA)", "Free Basic Account (0 FCFA)")}</span>
              <span className="text-[11px] text-slate-300">{translate("Liberté de poste totale : Annonces Boutiques & Enchères illimitées sans abonnement obligatoire.", "Total posting freedom: Unlimited Shop listings & Live Auctions without mandatory subscription.")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-500/30">
              {translate("✓ 0 FCFA / Toujours Gratuit", "✓ 0 FCFA / Always Free")}
            </span>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Boost Flash (1 000 FCFA) */}
          <div 
            onClick={() => setSelectedPlan('boost')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
              selectedPlan === 'boost'
                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10 scale-[1.02]'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  {translate("À l'acte", "One-time")}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Boost Flash</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{translate("Propulsion 48h", "48h Feed Boost")}</p>
              <div className="mt-3 mb-4">
                <span className="text-xl font-extrabold text-white font-mono-num">1 000 F</span>
                <span className="text-[10px] text-slate-400"> {translate("/ annonce", "/ listing")}</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{translate("En tête de liste du feed Abidjan", "Top priority in Abidjan feed")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{translate("Badge doré \"En Vedette\"", "Golden \"Featured\" Badge")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{translate("5x plus d'enchérisseurs & d'appels", "5x more bidders & calls")}</span>
                </li>
              </ul>
            </div>
            <button 
              type="button" 
              className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPlan === 'boost' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {translate("Sélectionner", "Select")}
            </button>
          </div>

          {/* Card 2: Pass Vendeur Certifié (5 000 FCFA) */}
          <div 
            onClick={() => setSelectedPlan('standard')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
              selectedPlan === 'standard'
                ? 'bg-blue-500/15 border-blue-400 shadow-lg shadow-blue-500/10 scale-[1.02]'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="absolute -top-2.5 right-3 bg-blue-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
              {translate("PRO CERTIFIÉ", "CERTIFIED PRO")}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
                  {translate("Boutique Certifiée", "Certified Shop")}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">{translate("Pass Vendeur Certifié", "Certified Seller Pass")}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{translate("Passez au sérieux & gagnez +", "Get serious & earn more")}</p>
              <div className="mt-3 mb-4">
                <span className="text-xl font-extrabold text-white font-mono-num">5 000 F</span>
                <span className="text-[10px] text-slate-400"> {translate("/ mois", "/ mo")}</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-1.5 text-blue-200 font-semibold">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{translate("Badge officiel \"Vendeur Certifié & Vérifié\"", "Official \"Verified Seller\" badge")}</span>
                </li>
                <li className="flex items-start gap-1.5 text-blue-200 font-semibold">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{translate("Commission réduite à 5% seulement", "Reduced fee down to only 5%")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{translate("Vitrine Boutique Personnalisée (Logo & Bannière)", "Custom Storefront (Logo & Banner)")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{translate("Paiements directs & virements instantanés", "Direct payments & instant payouts")}</span>
                </li>
              </ul>
            </div>
            <button 
              type="button" 
              className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPlan === 'standard' ? 'bg-blue-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {translate("Sélectionner", "Select")}
            </button>
          </div>

          {/* Card 3: Pass Illimité - Boutique VIP Or (10 000 FCFA) */}
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
              selectedPlan === 'pro'
                ? 'bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
              {translate("ÉLITE OR", "GOLD ELITE")}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Crown className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  {translate("Boutique Or VIP", "VIP Gold Store")}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">{translate("Pass Vendeur Or VIP", "VIP Gold Seller Pass")}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{translate("Commission minimale 2.5%", "Minimum 2.5% fee")}</p>
              <div className="mt-3 mb-4">
                <span className="text-xl font-extrabold text-white font-mono-num">10 000 F</span>
                <span className="text-[10px] text-slate-400"> {translate("/ mois", "/ mo")}</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-1.5 text-amber-300 font-bold">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{translate("Badge Prestige \"Boutique Officielle Or VIP\"", "Prestige \"VIP Gold Store\" Badge")}</span>
                </li>
                <li className="flex items-start gap-1.5 text-amber-300 font-bold">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{translate("Commission record minimale : 2.5% seulement", "Record low commission: only 2.5%")}</span>
                </li>
                <li className="flex items-start gap-1.5 font-semibold text-white">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{translate("Top Algorithme Abidjan & En Tête d'Accueil", "Top Abidjan Algorithm & Home Placement")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{translate("Radar Demande & Support Dédié VIP 7j/7", "Demand Radar & 7/7 VIP Support")}</span>
                </li>
              </ul>
            </div>
            <button 
              type="button" 
              className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPlan === 'pro' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {translate("Sélectionner", "Select")}
            </button>
          </div>

          {/* Card 4: Pass Livreur VIP (Coming Soon with Free Unlimited Active) */}
          <div 
            onClick={() => setSelectedPlan('vip_pass')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
              selectedPlan === 'vip_pass'
                ? 'bg-emerald-500/15 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow border border-amber-300 flex items-center gap-1">
              <span>⏳</span>
              <span>{translate("PASS BIENTÔT", "COMING SOON")}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bike className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {translate("Gratuit Actuel (Illimité)", "Currently Free (Unlimited)")}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">{translate("Pass Livreur VIP", "VIP Courier Pass")}</h3>
              <p className="text-[11px] text-amber-300 font-medium mt-0.5">
                {translate("Courses illimitées gratuites actives • Lancement bientôt", "Free unlimited runs active • Launching soon")}
              </p>
              <div className="mt-3 mb-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-white font-mono-num">6 000 F</span>
                <span className="text-[10px] text-slate-400"> {translate("/ mois", "/ mo")}</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                  {translate("5 Courses Offertes au Lancement", "5 Free Trial Deliveries at Launch")}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-1.5 text-emerald-300 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{translate("Accès illimité sans blocage à toutes les courses d'Abidjan", "Unlimited unblocked access to all deliveries across Abidjan")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{translate("0% de commission sur vos frais de livraison", "0% commission on your delivery earnings")}</span>
                </li>
                <li className="flex items-start gap-1.5 text-amber-200">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{translate("Période d'essai : 5 courses offertes dès l'activation", "Trial period: 5 free deliveries upon official launch")}</span>
                </li>
              </ul>
            </div>
            <button 
              type="button" 
              className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPlan === 'vip_pass' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {translate("Offre Gratuite Active (Pass Bientôt)", "Free Active (Pass Soon)")}
            </button>
          </div>
        </div>

        {/* Payment Form (Mobile Money Abidjan) */}
        <form onSubmit={handlePay} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <p className="text-xs text-slate-400">{translate("Formule choisie :", "Selected Plan:")}</p>
              <h4 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>{selectedPlan.toUpperCase()}</span>
                <span className="font-mono-num text-amber-400">({getPlanPrice(selectedPlan)})</span>
              </h4>
            </div>

            {/* Payment Provider Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('wave')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'wave'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                🌊 Wave (0%)
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('orange')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'orange'
                    ? 'bg-orange-500/20 border-orange-400 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                🍊 Orange Money
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mtn')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'mtn'
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                🟡 MTN MoMo
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('moov' as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  (paymentMethod as string) === 'moov'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                🔵 Moov Flooz
              </button>

              {/* Credit Card (Visa / Mastercard) - Coming soon */}
              <div className="relative group">
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-800 bg-slate-900/60 text-slate-400 opacity-80 cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>💳 {translate("Carte Bancaire (Visa/MC)", "Credit Card (Visa/MC)")}</span>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30 uppercase font-black tracking-wider">
                    {translate("Bientôt", "Soon")}
                  </span>
                </button>
              </div>

              {/* Crypto Payment (USDT / BTC) - Coming soon */}
              <div className="relative group">
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-800 bg-slate-900/60 text-slate-400 opacity-80 cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>🪙 {translate("Crypto (USDT, BTC)", "Crypto (USDT, BTC)")}</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 uppercase font-black tracking-wider">
                    {translate("Bientôt", "Soon")}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="text-[11px] text-slate-400 block mb-1">
                {translate(`Numéro de débit Mobile Money (${paymentMethod.toUpperCase()}) :`, `Mobile Money Debit Number (${paymentMethod.toUpperCase()}):`)}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto mt-2 sm:mt-5 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>{translate(`Payer ${getNumericPrice(selectedPlan).toLocaleString('fr-FR')} FCFA`, `Pay ${getNumericPrice(selectedPlan).toLocaleString('fr-FR')} FCFA`)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Commission Policy Transparency Box */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>🔨 {translate("Règle Enchères Express :", "Live Auctions Rule:")}</span>
            </p>
            <p className="text-slate-300 text-[11px]">
              {translate(
                "Toutes les ventes aux enchères sont fixées à 10% de commission, quel que soit le pass vendeur souscrit.",
                "All live auction sales carry a fixed 10% commission rate, regardless of the active seller pass."
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>🏪 {translate("Règle Boutiques & Achats Directs :", "Official Stores & Direct Buy Rule:")}</span>
            </p>
            <p className="text-slate-300 text-[11px]">
              {translate(
                "Compte Basique : 10% | Pass Vendeur Certifié : 5% | Pass VIP Or : 2.5% seulement.",
                "Basic Account: 10% | Certified Pro: 5% | VIP Gold Pass: only 2.5%."
              )}
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-slate-500 text-[11px] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{translate("Transactions chiffrées & instantanées avec Wave, Orange Money, MTN MoMo et Moov Flooz en Côte d'Ivoire.", "Encrypted & instant transactions with Wave, Orange Money, MTN MoMo, and Moov Flooz across Ivory Coast.")}</span>
        </div>
      </div>
    </div>
  );
};
