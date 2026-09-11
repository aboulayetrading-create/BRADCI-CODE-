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
  Info
} from 'lucide-react';

export const DriverPassRechargeView: React.FC = () => {
  const { 
    driverPass, 
    rechargeDriverPass,
    setDriverPassTestingState,
    currentUser,
    translate,
    addToast
  } = useApp();

  // 24-hour countdown state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 23,
    minutes: 59,
    seconds: 45,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!driverPass?.expiresAt) {
        return { hours: 24, minutes: 0, seconds: 0, isExpired: false };
      }

      const expiryTime = new Date(driverPass.expiresAt).getTime();
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, isExpired: false };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [driverPass?.expiresAt]);

  const handleSimulateRecharge = () => {
    rechargeDriverPass();
    addToast(
      translate("Pass Recharge 24h Activé !", "24h Recharge Pass Activated!"),
      translate("Votre chrono de 24h a été réinitialisé à 5.000 F (Offre gratuite active).", "Your 24h timer was reset (Free launch active)."),
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

  return (
    <div id="driver-pass-recharge-hub" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. HERO BANNER: OFFRE DE LANCEMENT & MODE BIENTÔT */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0B1528] via-[#091122] to-[#120B2E] border border-violet-500/30 shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>OFFRE DE LANCEMENT : 100% GRATUIT EN CE MOMENT</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Option Pass Quotidien : Mode Bientôt</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
              Pass Recharge Quotidien Livreur • 5.000 F / jour
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Profitez d'un accès illimité à toutes les <strong className="text-violet-300">Courses Commandes Directes (Point A ➔ Point B)</strong> avec <strong className="text-emerald-400">0% de commission Brad'CI</strong> ! Vous encaissez 100% de la somme en direct auprès du client.
            </p>
          </div>

          {/* Current Launch Advantage Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  Actuellement : Accès 100% Gratuit pour tous les livreurs
                </span>
                <span className="text-slate-400 text-[11px]">
                  Vous recevez toutes les courses sans rien débourser pendant toute la période de lancement.
                </span>
              </div>
            </div>

            <button
              id="btn-recharge-pass-now"
              onClick={handleSimulateRecharge}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs shrink-0 shadow-lg shadow-violet-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tester Recharger 24h</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHRONO 24H & SOLDE DE RECHARGE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: CHRONOMÈTRE 24H AVANT EXPIRATION */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#090F1D] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Chrono 24h Solde de Recharge
                </h3>
                <span className="text-[10px] text-slate-400">Temps restant avant fin de validité</span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              timeLeft.isExpired 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {timeLeft.isExpired ? 'Pass Expiré' : '🟢 Pass Actif (24h)'}
            </span>
          </div>

          {/* Large Countdown Display */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-mono text-2xl sm:text-3xl font-black text-white block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">Heures</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-mono text-2xl sm:text-3xl font-black text-white block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">Minutes</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-mono text-2xl sm:text-3xl font-black text-violet-400 block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">Secondes</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              {timeLeft.isExpired ? (
                <span className="text-rose-400 font-bold">
                  ⚠️ Votre recharge est terminée. Rechargez pour débloquer les courses directes.
                </span>
              ) : (
                <span>
                  Validité garantie jusqu'au <strong className="text-slate-200">{new Date(driverPass?.expiresAt || Date.now() + 86400000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong> (renouvelable à tout moment).
                </span>
              )}
            </p>
          </div>

          {/* Status Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Prix de la recharge :</span>
              <strong className="text-white font-mono">5.000 FCFA / jour</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Commission BradCi sur colis :</span>
              <strong className="text-emerald-400 font-mono">0% (100% pour vous)</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Mode de perception :</span>
              <strong className="text-slate-200">Paiement physique direct</strong>
            </div>
          </div>
        </div>

        {/* CARD 2: 5 COURSES OFFERTES AU LANCEMENT */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#090F1D] border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Courses Offertes au Lancement
                  </h3>
                  <span className="text-[10px] text-slate-400">Bonus découverte nouveau coursier</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                5 Courses Offertes
              </span>
            </div>

            {/* Big Counter */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Solde de Courses Gratuites Restantes
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-3xl font-black text-amber-400">
                    {driverPass?.freeCoursesRemaining ?? 5}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    / {driverPass?.totalFreeCoursesGranted ?? 5} courses offertes
                  </span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xl">
                🎁
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Au lancement de la commande de course, chaque livreur bénéficie de <strong className="text-white">5 courses offertes immédiatement</strong> avec 0 F de frais. Même sans recharge payante, ces 5 courses sont utilisables librement !
            </p>
          </div>

          {/* Test / Simulation Switcher */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Tester l'affichage :</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleToggleSimulationState('active')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 cursor-pointer"
              >
                Pass Actif
              </button>
              <button
                type="button"
                onClick={() => handleToggleSimulationState('expired')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 cursor-pointer"
              >
                Pass Expiré
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXPLICATION DES BADGES DE DIFFÉRENCIATION (IMPORTANT) */}
      <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <BadgeCheck className="w-5 h-5 text-violet-400" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Différenciation des Badges de Courses (Livreur)
            </h3>
            <p className="text-xs text-slate-400">
              Comment distinguer les courses directes et les commandes marketplace sur votre radar :
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BADGE 1: COURSE COMMANDE EXPRESS */}
          <div className="p-4 rounded-2xl bg-slate-950 border-2 border-violet-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/30">
                <Bike className="w-3.5 h-3.5" />
                <span>📦 COURSE COMMANDE EXPRESS (A ➔ B)</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                0% Commission
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Course directe de colis entre un expéditeur et un destinataire (ex: de Cocody à Plateau).
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mode de paiement :</span>
                <strong className="text-white">💵 Espèces directes au livreur</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frais BradCi retenus :</span>
                <strong className="text-emerald-400">0 FCFA</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Condition d'accès :</span>
                <strong className="text-violet-300">Recharge 24h ou Courses Offertes</strong>
              </div>
            </div>
          </div>

          {/* BADGE 2: COMMANDE MARKETPLACE BRADCI */}
          <div className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-[#F97316] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#F97316]/30">
                <span>⚡ COMMANDE BRAD'CI (ACHAT/ENCHÈRE)</span>
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Séquestre Brad'CI
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Livraison d'un article vendu sur la marketplace Brad'CI avec inspection de conformité obligatoire.
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mode de paiement :</span>
                <strong className="text-white">🔒 Compte Séquestre Sécurisé</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frais BradCi :</span>
                <strong className="text-amber-400">Commission standard de vente</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Condition d'accès :</span>
                <strong className="text-slate-200">Toujours accessible à 100%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
