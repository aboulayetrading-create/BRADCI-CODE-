import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Gavel, 
  Bike, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard,
  MessageCircle,
  Phone,
  Crown
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SecurityGuideView: React.FC = () => {
  const { setPricingModalOpen, setNewProductModalOpen, translate } = useApp();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-full text-xs font-extrabold border border-amber-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{translate("Charte de Sécurité & Règles Métier Stratégiques", "Security Charter & Strategic Business Rules")}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
          {translate("Comment BRAD'CI Sécurise le Déstockage à Abidjan", "How BRAD'CI Secures Liquidation in Abidjan")}
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          {translate(
            "Découvrez les piliers technologiques et réglementaires qui font de Brad'CI la référence des enchères sécurisées en Côte d'Ivoire.",
            "Discover the technology and regulatory pillars making Brad'CI the benchmark for secure auctions in Ivory Coast."
          )}
        </p>
      </div>

      {/* The 4 Strategic Business Rules Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rule 1 */}
        <div className="p-6 rounded-3xl bg-[#0C121E] border border-emerald-500/30 space-y-3 shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            01
          </div>
          <h3 className="text-lg font-bold text-white">
            {translate("Publications 100% Illimitées & Gratuites pour Tous", "100% Free & Unlimited Listings for All")}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {translate(
              "Chaque vendeur et particulier bénéficie d'une liberté totale de publication sans aucune limite de poste pour ses annonces boutiques et ses enchères en direct à 0 FCFA. Commission compte basique : 10%.",
              "Every seller and individual benefits from complete posting freedom with zero listing limits for shop items and live auctions at 0 FCFA. Basic account commission: 10%."
            )}
          </p>
          <div className="text-[11px] text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            {translate("✓ 100% Gratuit & Illimité • Enchères et Boutiques sans abonnement obligatoire.", "✓ 100% Free & Unlimited • Auctions and Shops with no mandatory subscription.")}
          </div>
        </div>

        {/* Rule 2 */}
        <div className="p-6 rounded-3xl bg-[#0C121E] border border-blue-500/30 space-y-3 shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            02
          </div>
          <h3 className="text-lg font-bold text-white">
            {translate("Pass Certifié (5% comm.) & VIP Or (2.5% comm.)", "Certified Pass (5% fee) & VIP Gold (2.5% fee)")}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {translate(
              "Passez au sérieux : Badge officiel vérifié, commission boutique ultra-réduite à 5% (Pass Certifié 5 000 F) ou 2.5% (Pass VIP Or 10 000 F), vitrine personnalisée et déblocage express des fonds.",
              "Level up: Official verified badge, ultra-reduced shop fee to 5% (Certified Pass 5,000 F) or 2.5% (VIP Gold 10,000 F), custom storefront, and express payouts."
            )}
          </p>
          <div className="text-[11px] text-blue-300 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
            {translate("★ Enchères : 10% fixe quel que soit le pass • Boutiques : 5% (Certifié) et 2.5% (VIP Or).", "★ Auctions: 10% fixed regardless of pass • Shops: 5% (Certified) and 2.5% (VIP Gold).")}
          </div>
        </div>

        {/* Rule 3 */}
        <div className="p-6 rounded-3xl bg-[#0C121E] border border-amber-500/30 space-y-3 shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            03
          </div>
          <h3 className="text-lg font-bold text-white">
            {translate("Pass Livreur & Courses Express (6 000 F)", "Courier Pass & Express Deliveries (6,000 F)")}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {translate(
              "Tout nouveau livreur débute avec 5 courses d'essai sans frais. Au-delà, l'accès à la Bourse de Fret est conditionné au Pass Livreur (6 000 FCFA / mois) avec 0% de prélèvement sur les courses.",
              "Every new courier starts with 5 fee-free trial deliveries. Beyond that, freight radar access is unlocked with the Courier Pass (6,000 FCFA/mo) with 0% fee on runs."
            )}
          </p>
          <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            {translate("⚡ 0% commission sur toutes vos courses • Rémunération directe multi-opérateurs.", "⚡ 0% commission on all deliveries • Direct multi-operator earnings.")}
          </div>
        </div>

        {/* Rule 4 */}
        <div className="p-6 rounded-3xl bg-[#0C121E] border border-red-500/30 space-y-3 shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
            04
          </div>
          <h3 className="text-lg font-bold text-white">
            {translate("Sécurité Anti-Fraude KYC & Paiement Direct à la Livraison (POD)", "Anti-Fraud KYC & Direct Pay on Delivery (POD)")}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {translate(
              "Détection automatique des doublons d'identité. Aucun blocage de fonds en amont : le paiement s'effectue directement via API (Wave, Orange Money, MTN MoMo, Moov, Carte) uniquement lorsque le livreur arrive et après vérification du colis.",
              "Automatic identity duplicate detection. Zero upfront fund holding: payment is executed directly via API (Wave, Orange Money, MTN MoMo, Moov, Card) only when the courier arrives and after parcel verification."
            )}
          </p>
          <div className="text-[11px] text-red-300 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
            {translate("🛡️ Zéro arnaque : vous ne payez que le produit que vous avez entre les mains.", "🛡️ Zero scams: you only pay for the product in your hands.")}
          </div>
        </div>
      </div>

      {/* Pay on Delivery Mechanism Explanation */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C1424] to-[#070B14] border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>{translate("Le Mécanisme du Paiement Direct à la Livraison (Pay on Delivery API)", "The Direct Pay on Delivery Mechanism (API)")}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {translate(
            "L'acheteur passe commande ou gagne une enchère sans aucun débit préalable. Le livreur achemine le colis et signale son arrivée par GPS. L'acheteur examine le produit, initie son paiement direct via l'API de son choix (Wave, Orange Money, MTN MoMo, Moov Money, Carte), puis transmet son code secret OTP au livreur pour clôturer la livraison avec répartition automatique des fonds.",
            "The buyer places an order or wins an auction without upfront debit. The driver transports the package and reports GPS arrival. The buyer inspects the item, initiates direct payment via their chosen API (Wave, Orange Money, MTN MoMo, Moov Money, Card), and provides the secret OTP code to complete delivery with automatic split payout."
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
            <span className="text-amber-400 font-mono font-black text-sm block">1. {translate("Arrivée GPS Livreur", "Driver GPS Arrival")}</span>
            <span className="text-[11px] text-slate-400">{translate("Bouton de paiement débloqué", "Payment button unlocked")}</span>
          </div>
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
            <span className="text-blue-400 font-mono font-black text-sm block">2. {translate("Paiement API Acheteur", "Buyer API Payment")}</span>
            <span className="text-[11px] text-slate-400">{translate("Wave, Orange, MTN, Moov, Carte", "Wave, Orange, MTN, Moov, Card")}</span>
          </div>
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
            <span className="text-emerald-400 font-mono font-black text-sm block">3. {translate("Validation OTP Livreur", "Driver OTP Validation")}</span>
            <span className="text-[11px] text-slate-400">{translate("Répartition atomique immédiate", "Immediate atomic split payout")}</span>
          </div>
        </div>
      </div>

      {/* Contact & WhatsApp Support */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{translate("Besoin d'une Assistance Immédiate à Abidjan ?", "Need Immediate Assistance in Abidjan?")}</h4>
            <p className="text-xs text-slate-400">{translate("Notre équipe de modération et d'arbitrage répond 7j/7", "Our moderation & dispute arbitration team is available 7/7")}</p>
          </div>
        </div>

        <a
          href="https://wa.me/2250144778922?text=Bonjour%20BradCI%20Support"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
        >
          <Phone className="w-4 h-4" />
          <span>{translate("Support WhatsApp (+225)", "WhatsApp Support (+225)")}</span>
        </a>
      </div>
    </div>
  );
};
