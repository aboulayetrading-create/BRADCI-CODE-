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

  const isDriverUser = currentUser?.role === 'driver' || targetPlanForPricing === 'vip_pass' || targetPlanForPricing === 'daily_pass';

  const [selectedPlan, setSelectedPlan] = useState<SellerPlan | DriverPlan | 'boost'>(() => {
    if (targetPlanForPricing) {
      if ((targetPlanForPricing === 'vip_pass' || targetPlanForPricing === 'daily_pass') && currentUser?.role !== 'driver') {
        return 'standard';
      }
      return targetPlanForPricing;
    }
    return currentUser?.role === 'driver' ? 'daily_pass' : 'standard';
  });

  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange' | 'mtn' | 'moov'>('wave');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '+225 07 48 92 11 34');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fallback safety if role changes or driver plan for a non-driver
  React.useEffect(() => {
    if (currentUser?.role !== 'driver' && (selectedPlan === 'vip_pass' || selectedPlan === 'daily_pass')) {
      setSelectedPlan('standard');
    }
  }, [currentUser?.role, selectedPlan]);

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
      case 'standard': return 2500; // Pass Pro (2 500 FCFA / 30j)
      case 'pro': return 5000; // Pass Gold (5 000 FCFA / 30j)
      case 'gold': return 5000; // Pass Gold (5 000 FCFA / 30j)
      case 'daily_pass': return 2000; // Recharge 24h Chrono - Livraison Express (2 000 FCFA / 24h)
      case 'vip_pass': return 5000; // Pass Mensuel - Commandes BRAD'CI (5 000 FCFA / 30j)
      default: return 0;
    }
  };

  const getPlanPrice = (plan: SellerPlan | DriverPlan | 'boost') => {
    switch (plan) {
      case 'boost': return '1 000 FCFA / 24h';
      case 'standard': return `2 500 FCFA / ${translate('30j', '30d')}`;
      case 'pro': return `5 000 FCFA / ${translate('30j', '30d')}`;
      case 'gold': return `5 000 FCFA / ${translate('30j', '30d')}`;
      case 'daily_pass': return '2 000 FCFA / 24h';
      case 'vip_pass': return `5 000 FCFA / ${translate('30j', '30d')}`;
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

        {/* Title & Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3.5 py-1 rounded-full text-xs font-bold border border-emerald-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isDriverUser 
                ? translate("Espace Chauffeur & Coursier Agréé BRAD'CI", "Approved BRAD'CI Driver & Courier Space")
                : translate("Publication 100% Illimitée & Gratuite pour Tous", "100% Free & Unlimited Listings for All")
              }
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {isDriverUser
              ? translate("Pass Livreur VIP BRAD'CI", "BRAD'CI VIP Courier Pass")
              : translate("Passez au Niveau Supérieur avec les Pass Vendeurs BRAD'CI", "Level Up with BRAD'CI Seller Passes")
            }
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            {isDriverUser
              ? translate(
                  "Offre exclusive réservée aux livreurs et transporteurs partenaires. Profitez de 0% de commission et d'un accès prioritaire aux courses d'Abidjan.",
                  "Exclusive offer reserved for couriers and delivery drivers. Enjoy 0% commission and priority access to Abidjan deliveries."
                )
              : translate(
                  "Les comptes basiques publient librement sans limite. Les Pass Vendeurs vous permettent de passer au sérieux : réduisez drastiquement vos commissions, obtenez un badge de confiance certifié et maximisez vos ventes.",
                  "Basic accounts post freely with zero limits. Seller Passes let you get serious: drastically cut commission fees, get certified trust badges, and maximize your sales."
                )
            }
          </p>
        </div>

        {/* Perks Reminder Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-900/80 to-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">
                {isDriverUser
                  ? translate("Accès Bourse de Fret 100% Offert (0 FCFA)", "100% Free Delivery Board Access (0 FCFA)")
                  : translate("Compte Vendeur & Acheteur Gratuit (0 FCFA)", "Free Buyer & Seller Account (0 FCFA)")
                }
              </span>
              <span className="text-[11px] text-slate-300">
                {isDriverUser
                  ? translate("Phase de lancement : Toutes les courses sont sans frais d'abonnement pour les chauffeurs certifiés.", "Launch phase: All deliveries have zero subscription fee for verified drivers.")
                  : translate("Liberté de poste totale : Annonces Boutiques & Enchères illimitées sans abonnement obligatoire.", "Total posting freedom: Unlimited Shop listings & Live Auctions without mandatory subscription.")
                }
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-500/30">
              {translate("✓ 0 FCFA / Actuellement Gratuit", "✓ 0 FCFA / Currently Free")}
            </span>
          </div>
        </div>

        {/* Cards Grid: DRIVER VIEW vs BUYER/SELLER VIEW */}
        {isDriverUser ? (
          /* Driver View: 2 PASS LIVREURS (Recharge 24h Chrono Livraison Express 2 000 F & Pass Mensuel Commandes BRAD'CI 5 000 F) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 max-w-3xl mx-auto">
            {/* Driver Pass 1: Recharge 24h Chrono - Livraison Express (2 000 FCFA / 24h) */}
            <div 
              onClick={() => setSelectedPlan('daily_pass')}
              className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                selectedPlan === 'daily_pass'
                  ? 'bg-emerald-500/15 border-emerald-400 shadow-xl shadow-emerald-500/10 scale-[1.02]'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-lg border border-amber-300 flex items-center gap-1.5">
                <span>⚡</span>
                <span>{translate("24H CHRONO EXPRESS", "24H CHRONO EXPRESS")}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <Bike className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {translate("Courses 100% Gratuites", "100% Free Runs")}
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-white font-display">
                  {translate("Recharge 24h Chrono - Livraison Express", "24h Chrono Express Delivery Recharge")}
                </h3>
                <p className="text-xs text-amber-300 font-medium mt-1">
                  {translate("Validité 24h chrono • Courses directes Point A ➔ Point B • 0% commission", "Valid 24 consecutive hours • Direct Point A ➔ B deliveries • 0% commission")}
                </p>

                <div className="mt-4 mb-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono-num">2 000 F</span>
                  <span className="text-xs text-slate-400"> / 24h chrono</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                    {translate("5 Courses d'Essai Offertes", "5 Free Trial Runs")}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2 text-emerald-300 font-semibold">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{translate("0% de commission Brad'CI : vous conservez 100% de vos gains", "0% Brad'CI commission: keep 100% of your earnings")}</span>
                  </li>
                  <li className="flex items-start gap-2 text-emerald-300 font-semibold">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{translate("Accès illimité 24h chrono à toutes les courses directes (Point A ➔ Point B)", "Unlimited 24h chrono access to all direct Point A ➔ Point B runs")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{translate("Dédié aux livraisons express rapides partout à Abidjan", "Dedicated to express on-demand courier deliveries across Abidjan")}</span>
                  </li>
                  <li className="flex items-start gap-2 text-amber-200">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{translate("5 courses gratuites offertes dès l'ouverture officielle", "5 free runs included upon official rollout")}</span>
                  </li>
                </ul>
              </div>

              <button 
                type="button" 
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPlan === 'daily_pass' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {selectedPlan === 'daily_pass' ? translate("✓ Sélectionné (2 000 F / 24h Chrono)", "✓ Selected (2,000 F / 24h Chrono)") : translate("Sélectionner (2 000 F)", "Select (2,000 F)")}
              </button>
            </div>

            {/* Driver Pass 2: Pass Mensuel Commandes BRAD'CI (5 000 FCFA / 30j) */}
            <div 
              onClick={() => setSelectedPlan('vip_pass')}
              className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                selectedPlan === 'vip_pass'
                  ? 'bg-purple-500/15 border-purple-400 shadow-xl shadow-purple-500/10 scale-[1.02]'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-lg border border-purple-300 flex items-center gap-1.5">
                <span>📦</span>
                <span>{translate("COMMANDES BRAD'CI (30J)", "BRAD'CI ORDERS (30D)")}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                    <Crown className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                    {translate("Commandes Marketplace", "Marketplace Orders")}
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-white font-display">
                  {translate("Pass Mensuel - Commandes BRAD'CI", "Monthly Pass - BRAD'CI Orders")}
                </h3>
                <p className="text-xs text-purple-300 font-medium mt-1">
                  {translate("Accès illimité 30 jours • Colis marketplace, déstockage & enchères • 0% commission", "Unlimited 30 consecutive days • Marketplace orders & auctions • 0% commission")}
                </p>

                <div className="mt-4 mb-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono-num">5 000 F</span>
                  <span className="text-xs text-slate-400"> / {translate("30 jours", "30 days")}</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-500/30">
                    {translate("Économie Maxi", "Max Savings")}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2 text-purple-200 font-semibold">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{translate("0% de commission Brad'CI sur toutes les commandes livrées", "0% commission on all delivered orders")}</span>
                  </li>
                  <li className="flex items-start gap-2 text-purple-200 font-semibold">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{translate("Accès illimité prioritaire à tous les colis et commandes BRAD'CI", "Unlimited priority access to all BRAD'CI packages and orders")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{translate("Badge officiel \"Livreur Certifié BRAD'CI\" sur le profil", "Official \"Certified BRAD'CI Courier\" badge on profile")}</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{translate("Rentabilisé en seulement 2 à 3 courses dans le mois", "Profitable in just 2 to 3 rides per month")}</span>
                  </li>
                </ul>
              </div>

              <button 
                type="button" 
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPlan === 'vip_pass' ? 'bg-purple-500 text-white font-black shadow-lg' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {selectedPlan === 'vip_pass' ? translate("✓ Sélectionné (5 000 F / 30j)", "✓ Selected (5,000 F / 30d)") : translate("Sélectionner (5 000 F)", "Select (5,000 F)")}
              </button>
            </div>
          </div>
        ) : (
          /* Buyer/Seller View: STRICTLY Seller Passes (Booster Flash 1000 F, Pass Pro 2500 F, Pass Gold 5000 F) */
          <div className="space-y-4 mb-8">
            {/* Active Status Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">{translate("Votre statut vendeur actuel :", "Your current seller status:")}</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  {currentUser?.sellerPlan === 'pro' || (currentUser?.sellerPlan as string) === 'gold' ? (
                    <>
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pass Gold (Commission 1.5%)</span>
                    </>
                  ) : currentUser?.sellerPlan === 'standard' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Pass Pro (Commission 2.5%)</span>
                    </>
                  ) : (
                    <span>Pass Gratuit (Commission 5.0%)</span>
                  )}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {translate("Appliquez un Pass pour réduire immédiatement votre commission à 2.5% ou 1.5%", "Upgrade your Pass to instantly slash commission to 2.5% or 1.5%")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Booster Flash (1 000 FCFA / 24h) */}
              <div 
                onClick={() => setSelectedPlan('boost')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
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
                      {translate("24h Vedette", "24h Featured")}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{translate("Booster Flash", "Booster Flash")}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{translate("Option de mise en vedette", "Featured listing option")}</p>
                  <div className="mt-3 mb-4">
                    <span className="text-xl font-extrabold text-white font-mono-num">1 000 F</span>
                    <span className="text-[10px] text-slate-400"> / 24h</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-1.5 font-semibold text-amber-300">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{translate("Mise en vedette de l'annonce en tête de fil", "Featured top listing on home feed")}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{translate("Badge doré officiel \"En Vedette\"", "Official golden \"Featured\" badge")}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{translate("5x plus d'acheteurs et d'offres en 24h", "5x more buyers & offers in 24h")}</span>
                    </li>
                  </ul>
                </div>
                <button 
                  type="button" 
                  className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPlan === 'boost' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {selectedPlan === 'boost' ? translate("✓ Sélectionné (1 000 F)", "✓ Selected (1,000 F)") : translate("Sélectionner (1 000 F)", "Select (1,000 F)")}
                </button>
              </div>

              {/* Card 2: Pass Pro (2 500 FCFA / 30j) */}
              <div 
                onClick={() => setSelectedPlan('standard')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                  selectedPlan === 'standard'
                    ? 'bg-blue-500/15 border-blue-400 shadow-lg shadow-blue-500/10 scale-[1.02]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-blue-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                  {translate("BADGE PRO", "PRO BADGE")}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
                      {translate("Commission 2.5%", "2.5% Commission")}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{translate("Pass Pro", "Pro Pass")}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{translate("2 500 FCFA / 30 jours", "2,500 FCFA / 30 days")}</p>
                  <div className="mt-3 mb-4">
                    <span className="text-xl font-extrabold text-white font-mono-num">2 500 F</span>
                    <span className="text-[10px] text-slate-400"> / 30j</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-1.5 text-blue-200 font-bold">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{translate("Commission 2.5 % (Montant * 0.025)", "2.5% Commission (Amount * 0.025)")}</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-blue-200 font-semibold">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{translate("Badge Pro certifié sur toutes vos annonces", "Certified Pro badge on all listings")}</span>
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
                  className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPlan === 'standard' ? 'bg-blue-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {selectedPlan === 'standard' ? translate("✓ Sélectionné (2 500 F)", "✓ Selected (2,500 F)") : translate("Sélectionner (2 500 F)", "Select (2,500 F)")}
                </button>
              </div>

              {/* Card 3: Pass Gold (5 000 FCFA / 30j) */}
              <div 
                onClick={() => setSelectedPlan('pro')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                  selectedPlan === 'pro'
                    ? 'bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                  {translate("VIP GOLD", "VIP GOLD")}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <Crown className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {translate("Commission record 1.5%", "Record 1.5% Commission")}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{translate("Pass Gold", "Gold Pass")}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{translate("5 000 FCFA / 30 jours", "5,000 FCFA / 30 days")}</p>
                  <div className="mt-3 mb-4">
                    <span className="text-xl font-extrabold text-white font-mono-num">5 000 F</span>
                    <span className="text-[10px] text-slate-400"> / 30j</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-1.5 text-amber-300 font-black">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{translate("Commission record 1.5 % (Montant * 0.015)", "Record 1.5% Commission (Amount * 0.015)")}</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-amber-300 font-bold">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{translate("Badge VIP Gold doré certifié officiel", "Official certified golden VIP Gold badge")}</span>
                    </li>
                    <li className="flex items-start gap-1.5 font-bold text-white">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{translate("Priorité d'affichage en tête du flux d'accueil", "Top display priority in homepage feed")}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{translate("Support Dédié VIP 7j/7 & Radar Demande", "Dedicated 7/7 VIP Support & Demand Radar")}</span>
                    </li>
                  </ul>
                </div>
                <button 
                  type="button" 
                  className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPlan === 'pro' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {selectedPlan === 'pro' ? translate("✓ Sélectionné (5 000 F)", "✓ Selected (5,000 F)") : translate("Sélectionner (5 000 F)", "Select (5,000 F)")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form (Mobile Money Abidjan) */}
        <form onSubmit={handlePay} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <p className="text-xs text-slate-400">{translate("Formule choisie :", "Selected Plan:")}</p>
              <h4 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>{selectedPlan === 'vip_pass' ? translate("PASS LIVREUR VIP (BIENTÔT)", "VIP COURIER PASS (SOON)") : selectedPlan.toUpperCase()}</span>
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
          {isDriverUser ? (
            <>
              <div className="space-y-1">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span>🛵 {translate("Règle Chauffeurs & Coursiers :", "Drivers & Couriers Rule:")}</span>
                </p>
                <p className="text-slate-300 text-[11px]">
                  {translate(
                    "Recharge 24h Chrono Livraison Express (2 000 FCFA / 24h) ou Pass Mensuel Commandes BRAD'CI (5 000 FCFA / 30j) : 0% de commission sur vos frais de livraison. Vous conservez 100% de la rémunération versée.",
                    "24h Chrono Express Delivery Pass (2,000 FCFA / 24h) or Monthly BRAD'CI Orders Pass (5,000 FCFA / 30d): 0% commission on delivery fees. You keep 100% of payout."
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>⏳ {translate("Statut Lancement :", "Launch Status:")}</span>
                </p>
                <p className="text-slate-300 text-[11px]">
                  {translate(
                    "Accès bourse de fret actuellement 100% offert. Au lancement officiel, 5 courses d'essai gratuites vous seront offertes avant recharge.",
                    "Freight board access is currently 100% free. At official rollout, 5 free trial deliveries are granted before recharge."
                  )}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span>🏷️ {translate("Taux de Commission Vendeurs :", "Seller Commission Rates:")}</span>
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong>{translate("Pass Gratuit (0 F)", "Free Pass (0 F)")}</strong> : {translate("Commission 5.0 % (Montant * 0.05)", "5.0% Commission (Amount * 0.05)")}<br />
                  • <strong>{translate("Pass Pro (2 500 F / 30j)", "Pro Pass (2,500 F / 30d)")}</strong> : {translate("Commission 2.5 % (Montant * 0.025) + Badge Pro", "2.5% Commission (Amount * 0.025) + Pro Badge")}<br />
                  • <strong>{translate("Pass Gold (5 000 F / 30j)", "Gold Pass (5,000 F / 30d)")}</strong> : {translate("Commission 1.5 % (Montant * 0.015) + Badge VIP Gold & Priorité", "1.5% Commission (Amount * 0.015) + VIP Gold Badge & Priority")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>⚡ {translate("Booster Flash (1 000 F / 24h) :", "Booster Flash (1,000 F / 24h):")}</span>
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {translate(
                    "Option de mise en vedette de l'annonce : propulse immédiatement votre article en tête du fil d'accueil avec badge doré pendant 24h.",
                    "Featured listing option: immediately propels your item to the top of the feed with a golden badge for 24h."
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-slate-500 text-[11px] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{translate("Transactions chiffrées & instantanées avec Wave, Orange Money, MTN MoMo et Moov Flooz en Côte d'Ivoire.", "Encrypted & instant transactions with Wave, Orange Money, MTN MoMo, and Moov Flooz across Ivory Coast.")}</span>
        </div>
      </div>
    </div>
  );
};
