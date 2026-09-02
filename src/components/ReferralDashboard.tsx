import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShoppingBag, 
  Truck, 
  Lock, 
  ArrowRight, 
  HelpCircle,
  MessageCircle,
  Zap,
  ChevronRight,
  TrendingUp,
  Info,
  Mail
} from 'lucide-react';
import { ReferralRecord, ReferralStatus } from '../types';
import { generateWhatsAppNudgeLink, generateReferralKycApprovedEmailHtml } from '../utils/referralEmailTemplate';

export const ReferralDashboard: React.FC = () => {
  const { 
    currentUser, 
    referrals, 
    addToast, 
    translate
  } = useApp();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ReferralStatus>('all');
  const [previewEmailModalOpen, setPreviewEmailModalOpen] = useState(false);
  const [selectedRefereeForEmail, setSelectedRefereeForEmail] = useState<ReferralRecord | null>(null);

  // Fallback / Defaults for current user referral state
  const referralCode = currentUser?.referralCode || 'BRAD-89A2';
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://bradci.com';
  const inviteLink = `${origin}/?ref=${referralCode}`;
  const referralCount = currentUser?.referralCount || 0;
  const maxReferrals = 10;
  const availableBonus = currentUser?.referralBalance || 0;
  const pendingBonus = currentUser?.pendingReferralBonus || 0;
  const maxBonus = 10000;
  const gaugePercent = Math.min(100, Math.round((referralCount / maxReferrals) * 100));

  // Filter referrals associated with current user as sponsor
  const myReferrals = referrals.filter(r => 
    r.sponsorId === currentUser?.id || 
    r.sponsorReferralCode === referralCode ||
    (currentUser?.name && r.sponsorName.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  const filteredReferrals = statusFilter === 'all' 
    ? myReferrals 
    : myReferrals.filter(r => r.status === statusFilter);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    addToast(
      translate("Code Copié !", "Code Copied!"),
      translate(`Code de parrainage [${referralCode}] copié dans votre presse-papier.`, `Referral code [${referralCode}] copied to clipboard.`),
      "success"
    );
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    addToast(
      translate("Lien Copié !", "Link Copied!"),
      translate("Lien d'invitation copié. Partagez-le avec vos amis pour gagner +1 000 FCFA chacun !", "Invitation link copied. Share with friends to earn +1,000 FCFA each!"),
      "success"
    );
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = (customReferee?: ReferralRecord) => {
    if (customReferee) {
      const url = generateWhatsAppNudgeLink(
        customReferee.refereePhone || '+225 07 00 00 00 00',
        customReferee.refereeName,
        currentUser?.name || 'Votre Parrain'
      );
      window.open(url, '_blank');
    } else {
      const generalMsg = `Salut ! Rejoins-moi sur BRAD'CI 🇨🇮, la 1ère place de marché sécurisée d'Abidjan (Enchères & Ventes avec remise en main propre et paiement séquestre) !

🎁 Utilise mon lien pour gagner 1 000 FCFA de bienvenue sur tes achats :
👉 ${inviteLink}

Mon code parrain : ${referralCode}`;
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(generalMsg)}`;
      window.open(shareUrl, '_blank');
    }
  };

  const handleOpenEmailPreview = (referee: ReferralRecord) => {
    setSelectedRefereeForEmail(referee);
    setPreviewEmailModalOpen(true);
  };

  return (
    <div id="referral-dashboard-container" className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. HERO BANNER WITH VISUAL REWARD HIGHLIGHT */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-[#0B111E] border border-amber-500/40 p-5 sm:p-8 shadow-2xl">
        {/* Ambient Top Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" />
              <span>{translate("Programme de Parrainage Réciproque", "Reciprocal Referral Program")}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              {translate("Gagnez jusqu'à ", "Earn up to ")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                10 000 FCFA
              </span>
              {translate(" de solde d'achat", " in shopping credit")}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {translate(
                "Invitez vos proches sur BRAD'CI. À chaque filleul validé qui réalise son premier achat ou sa première vente livrée par code OTP : vous gagnez 1 000 FCFA et votre filleul gagne 1 000 FCFA !",
                "Invite friends to BRAD'CI. For each verified referee who completes their first purchase or sale delivered via OTP: you earn 1,000 FCFA and your referee earns 1,000 FCFA!"
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-amber-200/90 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{translate("1 000 F Parrain / 1 000 F Filleul", "1,000 F Sponsor / 1,000 F Referee")}</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{translate("Plafond strict : Max 10 Filleuls", "Strict Cap: Max 10 Referees")}</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{translate("Utilisable pour achats directs", "Usable for direct purchases")}</span>
              </span>
            </div>
          </div>

          {/* Quick Share Action Box */}
          <div className="w-full lg:w-auto shrink-0 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {translate("Votre Code Unique", "Your Unique Code")}
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-amber-400 tracking-wider">
                  {referralCode}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copiedCode ? translate("Copié !", "Copied!") : translate("Copier", "Copy")}</span>
              </button>
            </div>

            {/* Invite Link input & WhatsApp share */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate flex-1 px-2 text-[11px] select-all">
                  {inviteLink}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title={translate("Copier le lien", "Copy link")}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleShareWhatsApp()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>{translate("Partager sur WhatsApp", "Share on WhatsApp")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS, BALANCES & VISUAL GAUGE (1/10 .. 10/10) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Visual Gauge */}
        <div className="p-5 rounded-2xl bg-[#0B111E] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {translate("Jauge Filleuls Validés", "Validated Referees Gauge")}
                </h4>
                <p className="text-lg font-black text-white font-mono-num">
                  {referralCount} <span className="text-sm text-slate-500 font-bold">/ {maxReferrals} max</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
              {gaugePercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 transition-all duration-500 shadow-sm shadow-amber-500/50"
                style={{ width: `${gaugePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>0 Filleul</span>
              <span>Plafond : {maxReferrals} Filleuls ({maxBonus.toLocaleString('fr-FR')} FCFA)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Solde Parrainage Utilisable */}
        <div className="p-5 rounded-2xl bg-[#0B111E] border border-emerald-500/30 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {translate("Solde d'Achat Disponible", "Available Shopping Balance")}
                </h4>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono-num mt-0.5">
                  {availableBonus.toLocaleString('fr-FR')} <span className="text-xs text-emerald-300 font-bold">FCFA</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              {translate("Actif", "Active")}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/30 text-[11px] text-emerald-200/90 flex items-start gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              {translate(
                "Déductible directement lors de vos achats d'articles sur BRAD'CI (Non-retirable en espèces).",
                "Directly deductible when purchasing items on BRAD'CI (Non-withdrawable to cash)."
              )}
            </p>
          </div>
        </div>

        {/* Card 3: Solde en Attente de Transaction */}
        <div className="p-5 rounded-2xl bg-[#0B111E] border border-amber-500/30 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {translate("Solde en Attente 1ère Livraison", "Pending 1st Delivery Balance")}
                </h4>
                <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono-num mt-0.5">
                  {pendingBonus.toLocaleString('fr-FR')} <span className="text-xs text-amber-300 font-bold">FCFA</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              {translate("En attente", "Pending")}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/30 text-[11px] text-amber-200/90 flex items-start gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              {translate(
                "Filleuls avec KYC validé : ce solde basculera en utilisable dès leur 1ère livraison validée par OTP.",
                "Referees with verified KYC: this balance unlocks upon their 1st OTP-validated delivery."
              )}
            </p>
          </div>
        </div>

      </div>

      {/* 3. STEP-BY-STEP LIFECYCLE EXPLAINER */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{translate("Comment fonctionne le déblocage en 3 étapes :", "How the 3-step unlocking works:")}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                1
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                PENDING_KYC
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">
              {translate("Inscription du Filleul", "Referee Registration")}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {translate(
                "Le filleul s'inscrit avec votre code. Le lien est enregistré et attend la vérification d'identité.",
                "The referee signs up with your code. The link is saved and awaits identity verification."
              )}
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                2
              </span>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                PENDING_TRANSACTION
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">
              {translate("Validation KYC & Alerte WhatsApp", "KYC Approved & WhatsApp Alert")}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {translate(
                "Le bonus de +1 000 FCFA passe en attente. Une alerte email/push vous invite à relancer votre filleul.",
                "+1,000 FCFA bonus appears in pending. An email/push invites you to nudge your referee."
              )}
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                3
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                COMPLETED
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">
              {translate("1ère Livraison OTP = Bonus Débloqué !", "1st OTP Delivery = Bonus Unlocked!")}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {translate(
                "Dès la 1ère vente ou achat validé sur le terrain par code OTP : +1 000 FCFA utilisables chacun et +1 sur la jauge !",
                "Upon 1st OTP-validated purchase or sale: +1,000 FCFA usable credit each and +1 on the gauge!"
              )}
            </p>
          </div>

        </div>
      </div>

      {/* 4. REFERRALS LIST & MANAGEMENT TABLE */}
      <div className="p-5 rounded-3xl bg-[#0B111E] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>{translate("Mes Filleuls Invités", "My Invited Referees")}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {myReferrals.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {translate("Suivez l'état d'avancement de chaque filleul et relancez-les en 1 clic sur WhatsApp.", "Track the status of each referee and nudge them in 1 click on WhatsApp.")}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
            {[
              { id: 'all', label: translate('Tous', 'All') },
              { id: 'PENDING_KYC', label: translate('En attente KYC', 'Pending KYC') },
              { id: 'PENDING_TRANSACTION', label: translate('KYC Validé (Relancer)', 'KYC OK (Nudge)') },
              { id: 'COMPLETED', label: translate('Complétés', 'Completed') }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === tab.id 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table / List */}
        {filteredReferrals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-3">
            <Gift className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">
              {translate("Aucun filleul dans cette catégorie", "No referees in this category")}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {translate("Partagez votre lien d'invitation à vos contacts pour commencer à accumuler vos bonus de parrainage !", "Share your invite link with your contacts to start stacking referral bonuses!")}
            </p>
            <button
              type="button"
              onClick={() => handleShareWhatsApp()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{translate("Inviter un ami sur WhatsApp", "Invite a friend on WhatsApp")}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredReferrals.map(ref => {
              const isCompleted = ref.status === 'COMPLETED';
              const isPendingTx = ref.status === 'PENDING_TRANSACTION';
              const isPendingKyc = ref.status === 'PENDING_KYC';

              return (
                <div 
                  key={ref.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : isPendingTx
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/5'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={ref.refereeAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ref.refereeName}`}
                      alt={ref.refereeName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {ref.refereeName}
                        </h4>
                        {isCompleted && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                            ✓ Complété
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {ref.refereePhone || '+225 07 00 00 00 00'} • Inscrit le {new Date(ref.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    
                    {/* Status Badge */}
                    {isPendingKyc && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Étape 1 : En attente KYC</span>
                      </span>
                    )}

                    {isPendingTx && (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>KYC Validé (+1 000 F en attente)</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(ref)}
                          className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Relancer sur WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span>Relancer WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEmailPreview(ref)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Voir l'email type envoyé"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>+1 000 FCFA Débloqué & Crédité</span>
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL: PREVIEW OF PROFESSIONAL EMAIL SENT TO SPONSOR */}
      {previewEmailModalOpen && selectedRefereeForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0B111E] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Aperçu de l'Email Envoyé au Parrain lors de la validation KYC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmailModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 p-4 text-xs font-mono text-slate-300 space-y-3">
              <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <strong>Objet :</strong> 🎁 +1 000 FCFA en attente ! KYC validé pour votre filleul {selectedRefereeForEmail.refereeName}
              </div>

              <div 
                className="prose prose-invert max-w-none text-xs"
                dangerouslySetInnerHTML={{
                  __html: generateReferralKycApprovedEmailHtml({
                    sponsorName: currentUser?.name || 'Kouassi Jean',
                    sponsorEmail: currentUser?.email || 'kouassi.jean@bradci.ci',
                    refereeName: selectedRefereeForEmail.refereeName,
                    refereePhone: selectedRefereeForEmail.refereePhone || '+225 07 00 00 00 00',
                    refereeCommune: 'Cocody',
                    referralCode: referralCode,
                    sponsorCurrentCount: referralCount,
                    sponsorMaxCount: maxReferrals,
                    pendingBonusFCFA: 1000,
                    totalPendingBonusFCFA: pendingBonus,
                    totalAvailableBonusFCFA: availableBonus
                  })
                }}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
