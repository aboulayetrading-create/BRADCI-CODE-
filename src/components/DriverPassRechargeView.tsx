import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Zap, 
  Clock, 
  ShieldCheck, 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Banknote, 
  Bike, 
  RefreshCw, 
  Timer, 
  BadgeCheck, 
  Lock, 
  Unlock,
  Info,
  Package,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { DRIVER_PASSES } from '../utils/commissionEngine';

export const DriverPassRechargeView: React.FC = () => {
  const { 
    driverPass, 
    rechargeDriverPass,
    setDriverPassTestingState,
    currentUser,
    translate,
    addToast
  } = useApp();

  // Countdown timer state (supports both 24h daily and 30-day monthly passes)
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    days: 0,
    hours: 23,
    minutes: 59,
    seconds: 45,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!driverPass?.expiresAt) {
        return { days: 0, hours: 24, minutes: 0, seconds: 0, isExpired: false };
      }

      const expiryTime = new Date(driverPass.expiresAt).getTime();
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, isExpired: false };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [driverPass?.expiresAt]);

  const handleActivatePass = (passType: 'daily' | 'monthly') => {
    rechargeDriverPass(passType);
    const passName = passType === 'daily' 
      ? "Recharge 24h Chrono (Livraison Express - 2 000 FCFA)" 
      : "Pass Mensuel (Commandes BRAD'CI - 5 000 FCFA / 30j)";
    
    addToast(
      translate("Pass Livreur Activé avec Succès !", "Courier Pass Successfully Activated!"),
      translate(
        `Votre ${passName} est désormais actif avec 0% de commission Brad'CI. 100% de vos gains vous reviennent !`,
        `Your ${passName} is now active with 0% Brad'CI commission. 100% of your earnings are yours!`
      ),
      "success"
    );
  };

  const handleToggleSimulationState = (state: 'active' | 'expired') => {
    if (setDriverPassTestingState) {
      setDriverPassTestingState(state);
      addToast(
        translate("Simulation Changée", "Simulation Changed"),
        state === 'expired' 
          ? translate("Pass expiré simulé : seules les courses BRAD'CI seront visibles.", "Expired pass simulated: only Brad'CI trips visible.")
          : translate("Pass actif simulé : toutes les courses directes et Brad'CI sont débloquées.", "Active pass simulated: all trips unlocked."),
        state === 'expired' ? "warning" : "success"
      );
    }
  };

  const isDailyActive = driverPass?.status === 'active' && driverPass?.activePassType !== 'monthly';
  const isMonthlyActive = driverPass?.status === 'active' && driverPass?.activePassType === 'monthly';

  return (
    <div id="driver-pass-recharge-hub" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. HERO BANNER: HIGH CONTRAST & CLEAR READABILITY */}
      <div className="dark-banner banner-text-white relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0B1528] via-[#091122] to-[#170E3B] border border-violet-500/40 shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/30 border border-violet-400/50 text-white text-xs font-black shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="tracking-wide">OFFRE DE LANCEMENT : 100% GRATUIT EN CE MOMENT</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Pass Livraison Express (24h) & Pass Mensuel (30j)</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight drop-shadow-md">
              Pass Livreurs BRAD'CI • Choisissez Votre Formule
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              Activez votre pass pour accéder aux courses géolocalisées en temps réel. <strong className="text-emerald-400 font-bold">0% de commission Brad'CI</strong> sur vos livraisons : vous conservez <strong className="text-white">100% de vos gains</strong> !
            </p>
          </div>

          {/* Current Launch Advantage Notice */}
          <div className="p-4 rounded-2xl bg-[#080E1D]/90 border border-slate-700/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">
                  Actuellement : Accès 100% Gratuit pour tous les livreurs
                </span>
                <span className="text-slate-300 text-xs">
                  Pendant la phase de lancement, vous recevez toutes les courses sans frais requis. Testez les deux pass ci-dessous !
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-xs">
                ✓ Lancement Actif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE TWO PASSES DISPLAY (LES DEUX PASSES LIVREURS BRAD'CI) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-500" />
              <span>Les 2 Pass Livreurs Disponibles</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sélectionnez le pass adapté à votre type de livraison (Courses directes ou Commandes e-commerce)
            </p>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            0% Commission Brad'CI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ==================== PASS 1 : RECHARGE 24H CHRONO ==================== */}
          <div className={`p-6 rounded-3xl transition-all relative flex flex-col justify-between border-2 shadow-xl ${
            isDailyActive 
              ? 'bg-white dark:bg-[#0B1222] border-violet-500 ring-2 ring-violet-500/20' 
              : 'bg-white dark:bg-[#090F1D] border-slate-200 dark:border-slate-800 hover:border-violet-500/50'
          }`}>
            {isDailyActive && (
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                ✓ Pass Actif en ce moment
              </div>
            )}

            <div className="space-y-4">
              {/* Header with Badge & Icon */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/30">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
                      Formule 1 • Courses Directes
                    </span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Recharge 24h Chrono
                    </h4>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-black border border-violet-300 dark:border-violet-700/60">
                  Point A ➔ Point B
                </span>
              </div>

              {/* Price & Duration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-950 dark:text-white font-mono">
                      2 000
                    </span>
                    <span className="text-xs font-black text-violet-600 dark:text-violet-400">
                      FCFA
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      / 24 heures
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 0% de commission (100% pour vous)
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                    Mode Encaissement
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    💵 Espèces Directes
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Dédié aux <strong className="text-slate-900 dark:text-white">courses express de colis de ville à ville</strong> (ex: Cocody ➔ Plateau). Débloque toutes les demandes de livraison directe de particuliers et commerçants.
              </p>

              {/* Feature Checklist */}
              <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Accès illimité aux courses express pendant <strong>24h chrono</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Notification radar prioritaire dans votre rayon kilométrique</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Validation par <strong>Code Secret PIN</strong> à la remise du colis</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Paiement immédiat en main propre à la livraison</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-5 mt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                id="btn-activate-pass-daily"
                onClick={() => handleActivatePass('daily')}
                className={`w-full py-3 px-4 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDailyActive
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30 ring-2 ring-violet-400'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>
                  {isDailyActive 
                    ? "Prolonger la Recharge 24h (+24h - 2 000 F)" 
                    : "Activer la Recharge 24h (2 000 FCFA)"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ==================== PASS 2 : PASS MENSUEL COMMANDES BRAD'CI ==================== */}
          <div className={`p-6 rounded-3xl transition-all relative flex flex-col justify-between border-2 shadow-xl ${
            isMonthlyActive 
              ? 'bg-white dark:bg-[#120E22] border-amber-500 ring-2 ring-amber-500/20' 
              : 'bg-white dark:bg-[#090F1D] border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
          }`}>
            {isMonthlyActive && (
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                ✓ Pass Actif en ce moment
              </div>
            )}

            <div className="space-y-4">
              {/* Header with Badge & Icon */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      Formule 2 • E-Commerce & Enchères
                    </span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Pass Mensuel BRAD'CI
                    </h4>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-700/60">
                  Commandes 30 Jours
                </span>
              </div>

              {/* Price & Duration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-950 dark:text-white font-mono">
                      5 000
                    </span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      FCFA
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      / 30 jours
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Soit seulement ~166 FCFA / jour
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                    Mode Encaissement
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    🔒 Séquestre Garanti
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Dédié aux <strong className="text-slate-900 dark:text-white">commandes de la marketplace BRAD'CI</strong> (articles vendus, enchères en direct). Sécurité totale des fonds avec inspection physique de conformité.
              </p>

              {/* Feature Checklist */}
              <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Accès illimité pendant <strong>30 jours</strong> aux commandes BRAD'CI</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Paiement garanti par Séquestre Mobile Money (Wave, Orange, MTN)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Fiche d'inspection du produit avant acheminement</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Crédit automatique instantané sur votre wallet livreur</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-5 mt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                id="btn-activate-pass-monthly"
                onClick={() => handleActivatePass('monthly')}
                className={`w-full py-3 px-4 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isMonthlyActive
                    ? 'bg-[#FF5B00] hover:bg-[#E05000] text-white shadow-orange-500/30 ring-2 ring-orange-400'
                    : 'bg-[#FF5B00] hover:bg-[#E05000] text-white shadow-orange-500/20'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {isMonthlyActive 
                    ? "Renouveler le Pass Mensuel (+30j - 5 000 F)" 
                    : "Souscrire au Pass Mensuel (5 000 FCFA / 30j)"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHRONO & SOLDE DE RECHARGE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: CHRONOMÈTRE AVANT EXPIRATION */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#090F1D] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Chrono Validité de Votre Pass
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {driverPass?.activePassType === 'monthly' ? 'Formule Mensuelle (30j)' : 'Formule Recharge 24h'}
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              timeLeft.isExpired 
                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
            }`}>
              {timeLeft.isExpired ? 'Pass Expiré' : `🟢 Pass Actif (${driverPass?.activePassType === 'monthly' ? '30j' : '24h'})`}
            </span>
          </div>

          {/* Large Countdown Display */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className={`grid gap-2 max-w-sm mx-auto ${timeLeft.days > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {timeLeft.days > 0 && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block mt-0.5">Jours</span>
                </div>
              )}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block mt-0.5">Heures</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block mt-0.5">Minutes</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-400 block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block mt-0.5">Secondes</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {timeLeft.isExpired ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  ⚠️ Votre recharge est terminée. Activez un pass ci-dessus pour débloquer les courses.
                </span>
              ) : (
                <span>
                  Validité garantie jusqu'au <strong className="text-slate-900 dark:text-slate-200 font-bold">{new Date(driverPass?.expiresAt || Date.now() + 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {new Date(driverPass?.expiresAt || Date.now() + 86400000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>.
                </span>
              )}
            </p>
          </div>

          {/* Quick Summary Lines */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Type de Pass actif :</span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {driverPass?.activePassType === 'monthly' ? "Pass Mensuel BRAD'CI (30j)" : "Recharge 24h Chrono (Express)"}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Commission Brad'CI retenue :</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-black">0% (100% pour le coursier)</strong>
            </div>
          </div>
        </div>

        {/* CARD 2: 5 COURSES OFFERTES AU LANCEMENT */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#090F1D] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Courses Offertes au Lancement
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Bonus de bienvenue pour chaque coursier</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                5 Courses Gratuites
              </span>
            </div>

            {/* Big Counter */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                  Solde de Courses Offertes Restantes
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-3xl font-black text-amber-600 dark:text-amber-400">
                    {driverPass?.freeCoursesRemaining ?? 5}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                    / {driverPass?.totalFreeCoursesGranted ?? 5} courses incluses
                  </span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-black text-xl">
                🎁
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Chaque nouveau coursier bénéficie de <strong className="text-slate-900 dark:text-white">5 courses offertes sans engagement</strong> avec 0 FCFA de frais. Utilisez-les pour tester le service et faire vos premières livraisons !
            </p>
          </div>

          {/* Test / Simulation Switcher */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Tester l'état du pass :</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleSimulationState('active')}
                className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-500/40 text-[11px] font-black text-emerald-800 dark:text-emerald-300 cursor-pointer"
              >
                Pass Actif
              </button>
              <button
                type="button"
                onClick={() => handleToggleSimulationState('expired')}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-black text-slate-800 dark:text-slate-300 cursor-pointer"
              >
                Pass Expiré
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EXPLICATION DES BADGES DE COURSES */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <BadgeCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Différenciation des Badges de Courses (Livreur)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Comment distinguer les courses directes et les commandes marketplace sur votre radar :
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BADGE 1: COURSE COMMANDE EXPRESS */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-violet-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/30">
                <Bike className="w-3.5 h-3.5" />
                <span>📦 COURSE COMMANDE EXPRESS (A ➔ B)</span>
              </span>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
                0% Commission
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Course directe de colis entre un expéditeur et un destinataire dans Abidjan.
            </p>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Mode de paiement :</span>
                <strong className="text-slate-900 dark:text-white">💵 Espèces directes au livreur</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Frais Brad'CI retenus :</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">0 FCFA</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Condition d'accès :</span>
                <strong className="text-violet-700 dark:text-violet-300 font-bold">Recharge 24h Chrono (2 000 F) ou Courses Offertes</strong>
              </div>
            </div>
          </div>

          {/* BADGE 2: COMMANDE MARKETPLACE BRADCI */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-[#FF5B00] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/30">
                <span>⚡ COMMANDE BRAD'CI (ACHAT/ENCHÈRE)</span>
              </span>
              <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/30">
                Séquestre Brad'CI
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Livraison d'un article vendu sur la marketplace Brad'CI avec inspection de conformité obligatoire.
            </p>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Mode de paiement :</span>
                <strong className="text-slate-900 dark:text-white">🔒 Compte Séquestre Sécurisé</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Frais Brad'CI sur livraison :</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">0% pour le livreur</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Condition d'accès :</span>
                <strong className="text-amber-700 dark:text-amber-300 font-bold">Pass Mensuel BRAD'CI (5 000 F / 30j)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
