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
              "Chaque vendeur et particulier bénéficie d'une liberté totale de publication sans aucune limite de poste pour ses annonces boutiques et ses enchères en direct à 0 FCFA. Commission Pass Gratuit : 5.0%.",
              "Every seller and individual benefits from complete posting freedom with zero listing limits for shop items and live auctions at 0 FCFA. Free Pass commission: 5.0%."
            )}
          </p>
          <div className="text-[11px] text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            {translate("✓ 100% Gratuit & Illimité • Commission minimale de 5.0% sur vente finalisée.", "✓ 100% Free & Unlimited • 5.0% commission upon completed sale.")}
          </div>
        </div>

        {/* Rule 2 */}
        <div className="p-6 rounded-3xl bg-[#0C121E] border border-blue-500/30 space-y-3 shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            02
          </div>
          <h3 className="text-lg font-bold text-white">
            {translate("Pass Pro (2.5% comm.) & Pass Gold (1.5% comm.)", "Pro Pass (2.5% fee) & Gold Pass (1.5% fee)")}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {translate(
              "Passez au niveau supérieur : Badges officiels vérifiés, commission ultra-réduite à 2.5% (Pass Pro 2 500 F / 30j) ou 1.5% (Pass Gold VIP 5 000 F / 30j), vitrine personnalisée et déblocage express des fonds.",
              "Level up: Official verified badges, ultra-reduced fee to 2.5% (Pro Pass 2,500 F / 30d) or 1.5% (Gold VIP Pass 5,000 F / 30d), custom storefront, and express payouts."
            )}
          </p>
          <div className="text-[11px] text-blue-300 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
            {translate("★ Pass Gratuit : 5.0% • Pass Pro : 2.5% • Pass Gold VIP : 1.5% sur toutes vos ventes.", "★ Free Pass: 5.0% • Pro Pass: 2.5% • Gold VIP Pass: 1.5% on all sales.")}
          </div>
        </div>

        {/* Rule 3 */}
        <div className="p-6 rounded-3xl bg-[#0C121E] border border-amber-500/30 space-y-3 shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            03
          </div>
          <h3 className="text-lg font-bold text-white">
            {translate("Pass Livreurs : Recharge 24h Chrono (2 000 F) & Pass Mensuel (5 000 F)", "Courier Passes: 24h Chrono Recharge (2,000 F) & Monthly Pass (5,000 F)")}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {translate(
              "Recharge 24h Chrono Livraison Express (2 000 FCFA / 24h) pour les courses directes (Point A ➔ Point B) ou Pass Mensuel Commandes BRAD'CI (5 000 FCFA / 30j) pour les colis marketplace. 0% de commission Brad'CI avec 5 courses offertes au lancement.",
              "24h Chrono Express Delivery Recharge (2,000 FCFA / 24h) for direct Point A ➔ B runs or Monthly BRAD'CI Orders Pass (5,000 FCFA / 30d) for marketplace packages. 0% Brad'CI commission with 5 free trial runs at rollout."
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
          <span>{translate("Le Mécanisme du Paiement Direct à la Livraison (Pay on Delivery Sécurisé)", "The Direct Pay on Delivery Mechanism (Secure)")}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {translate(
            "L'acheteur passe commande ou gagne une enchère sans aucun débit préalable. Le livreur achemine le colis et signale son arrivée par GPS. L'acheteur examine le produit, initie son paiement direct via le service de son choix (Wave, Orange Money, MTN MoMo, Moov Money, Carte), puis transmet son Code Secret de Remise au livreur pour clôturer la livraison avec répartition automatique des fonds.",
            "The buyer places an order or wins an auction without upfront debit. The driver transports the package and reports GPS arrival. The buyer inspects the item, initiates direct payment via their chosen service (Wave, Orange Money, MTN MoMo, Moov Money, Card), and provides the secret delivery code to complete delivery with automatic split payout."
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
            <span className="text-amber-400 font-mono font-black text-sm block">1. {translate("Arrivée GPS Livreur", "Driver GPS Arrival")}</span>
            <span className="text-[11px] text-slate-400">{translate("Bouton de paiement débloqué", "Payment button unlocked")}</span>
          </div>
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
            <span className="text-blue-400 font-mono font-black text-sm block">2. {translate("Paiement Mobile Money", "Buyer Mobile Payment")}</span>
            <span className="text-[11px] text-slate-400">{translate("Wave, Orange, MTN, Moov, Carte", "Wave, Orange, MTN, Moov, Card")}</span>
          </div>
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
            <span className="text-emerald-400 font-mono font-black text-sm block">3. {translate("Validation par Code Secret", "Secret Code Validation")}</span>
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
