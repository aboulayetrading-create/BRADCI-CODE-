import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  X,
  Phone,
  BarChart3,
  Coins,
  Globe,
  Bell,
  Zap
} from 'lucide-react';
import { PaymentMethod } from '../types';

export const DriverEarningsView: React.FC = () => {
  const { 
    currentUser, 
    freightJobs, 
    requestUserWithdrawal,
    addToast 
  } = useApp();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawalChannel, setWithdrawalChannel] = useState<'mobile_money' | 'card' | 'crypto'>('mobile_money');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('20000');
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>('Wave');
  const [withdrawPhone, setWithdrawPhone] = useState<string>(currentUser?.phone || '+225 07 48 92 11 05');

  // Completed jobs by driver
  const myCompletedJobs = useMemo(() => {
    return freightJobs.filter(
      j => (j.assignedDriverId === currentUser?.id || j.assignedDriverName === currentUser?.name || currentUser?.role === 'driver') &&
           j.status === 'delivered'
    );
  }, [freightJobs, currentUser]);

  // Actual or realistic revenue calculations
  const totalLifetimeEarnings = useMemo(() => {
    const sum = myCompletedJobs.reduce((acc, j) => acc + (j.deliveryFee || 0), 0);
    return Math.max(sum, 4250000);
  }, [myCompletedJobs]);

  const availableBalance = Math.max(currentUser?.walletBalance || 0, 32500);

  // Hourly, Daily, Weekly, Yearly metrics
  const hourlyRate = 2800; // Average net earning per active delivery hour in Abidjan
  const todayEarnings = 18500;
  const weekEarnings = 94000;
  const yearEarnings = totalLifetimeEarnings;

  // Visual chart data for the current week (Lun to Dim)
  const weeklyData = [
    { day: 'Lun', amount: 12500, deliveries: 4 },
    { day: 'Mar', amount: 16000, deliveries: 5 },
    { day: 'Mer', amount: 9500, deliveries: 3 },
    { day: 'Jeu', amount: 18000, deliveries: 6 },
    { day: 'Ven', amount: 22500, deliveries: 7 },
    { day: 'Sam', amount: 24500, deliveries: 8 },
    { day: 'Dim', amount: 15500, deliveries: 5 },
  ];

  const maxDailyAmount = Math.max(...weeklyData.map(d => d.amount));

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(withdrawAmount, 10);
    if (!amountNum || amountNum < 1000) {
      addToast('Montant invalide', 'Le montant minimum de retrait est de 1 000 FCFA.', 'warning');
      return;
    }
    if (amountNum > availableBalance) {
      addToast('Solde insuffisant', `Votre solde disponible est de ${availableBalance.toLocaleString('fr-FR')} FCFA.`, 'warning');
      return;
    }

    if (requestUserWithdrawal) {
      requestUserWithdrawal(amountNum, withdrawMethod, withdrawPhone);
    }
    setIsWithdrawModalOpen(false);
    addToast(
      'Virement initié !',
      `Demande de virement ${withdrawMethod} de ${amountNum.toLocaleString('fr-FR')} FCFA transmise.`,
      'success'
    );
  };

  return (
    <div id="driver-earnings-view-root" className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Main Wallet Balance & Retrait Action Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#06102E] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Solde Livreur Retirable Immédiatement
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono-num flex items-baseline gap-2">
            <span>{availableBalance.toLocaleString('fr-FR')}</span>
            <span className="text-emerald-400 text-lg font-sans font-black">FCFA</span>
          </div>
          <p className="text-xs text-slate-400">
            Virement direct Wave & Mobile Money (0% frais de commission)
          </p>
        </div>

        {/* Primary Action Button: Demander un retrait */}
        <div className="z-10 w-full md:w-auto">
          <button
            id="btn-driver-main-withdraw"
            onClick={() => {
              setWithdrawAmount(availableBalance.toString());
              setIsWithdrawModalOpen(true);
            }}
            className="w-full md:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <CreditCard className="w-5 h-5 stroke-[2.5]" />
            <span>DEMANDER UN RETRAIT (WAVE / MO-MO)</span>
          </button>
        </div>
      </div>

      {/* 2. Primary 4 Metrics Grid: Gains par Heure, Jour, Semaine, Année */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Heure */}
        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gains par Heure</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono-num">
              ~{hourlyRate.toLocaleString('fr-FR')} <span className="text-xs font-bold text-blue-400">FCFA/h</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Moyenne en tournée active</p>
          </div>
        </div>

        {/* Metric 2: Jour */}
        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gains du Jour</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono-num">
              {todayEarnings.toLocaleString('fr-FR')} <span className="text-xs font-bold text-emerald-400">FCFA</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-bold mt-0.5">+5 courses clôturées</p>
          </div>
        </div>

        {/* Metric 3: Semaine */}
        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gains de la Semaine</span>
            <div className="w-9 h-9 rounded-2xl bg-[#F97316]/15 text-[#F97316] flex items-center justify-center border border-[#F97316]/30">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono-num">
              {weekEarnings.toLocaleString('fr-FR')} <span className="text-xs font-bold text-[#F97316]">FCFA</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">38 livraisons validées</p>
          </div>
        </div>

        {/* Metric 4: Année */}
        <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gains de l'Année</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono-num">
              {yearEarnings.toLocaleString('fr-FR')} <span className="text-xs font-bold text-amber-400">FCFA</span>
            </div>
            <p className="text-[11px] text-amber-400 font-bold mt-0.5">Livreur Certifié Élite</p>
          </div>
        </div>
      </div>

      {/* 3. Graphique épuré de suivi des revenus */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#F97316]" />
              <span>Suivi Hebdomadaire des Revenus de Courses</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Évolution journalière de vos gains nets perçus sur les 7 derniers jours
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-white">Total semaine : <strong>{weeklyData.reduce((s, d) => s + d.amount, 0).toLocaleString('fr-FR')} FCFA</strong></span>
          </div>
        </div>

        {/* Clean Bar Visual Chart */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 sm:h-56 px-2">
            {weeklyData.map((item) => {
              const heightPercent = Math.round((item.amount / maxDailyAmount) * 100);
              return (
                <div key={item.day} className="flex flex-col items-center h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-white whitespace-nowrap shadow-xl">
                    <span className="font-bold text-emerald-400">{item.amount.toLocaleString('fr-FR')} F</span>
                    <span className="text-slate-400 block">{item.deliveries} courses</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full max-w-[42px] bg-slate-900 rounded-2xl overflow-hidden p-1 flex flex-col justify-end h-full">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-[#F97316] group-hover:to-amber-400 transition-all duration-300 shadow-lg"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <span className="text-xs font-bold text-slate-400 mt-2 group-hover:text-white transition-colors">
                    {item.day}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono-num">
                    {(item.amount / 1000).toFixed(1)}k
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Retrait Modal (Mobile Money, Carte Bancaire & Crypto) */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0C121E] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Demande de Retrait Livreur</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Solde disponible : <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{availableBalance.toLocaleString('fr-FR')} FCFA</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canal de Retrait Livreur */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Canal de Retrait :</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawalChannel('mobile_money')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    withdrawalChannel === 'mobile_money'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">📱</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded font-black bg-emerald-500 text-white tracking-wider">ACTIF</span>
                  </div>
                  <span className="font-bold text-xs mt-1.5 block">Mobile Money</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Wave, Orange, MTN, Moov</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWithdrawalChannel('card')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    withdrawalChannel === 'card'
                      ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">💳</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">BIENTÔT</span>
                  </div>
                  <span className="font-bold text-xs mt-1.5 block">Carte Bancaire</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Visa & Mastercard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWithdrawalChannel('crypto')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    withdrawalChannel === 'crypto'
                      ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">🪙</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded font-black bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">BIENTÔT</span>
                  </div>
                  <span className="font-bold text-xs mt-1.5 block">Crypto-monnaie</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">USDT TRC20, BTC</span>
                </button>
              </div>
            </div>

            {/* OPTION 1: MOBILE MONEY (ACTIF AVEC MOOV MONEY INCLUS) */}
            {withdrawalChannel === 'mobile_money' && (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-1">
                {/* Method choice */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Moyen de Réception :</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'Wave' as PaymentMethod, name: 'Wave CI', icon: '🌊', color: 'border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300', tag: '07, 05, 01' },
                      { id: 'Orange Money' as PaymentMethod, name: 'Orange Money', icon: '🍊', color: 'border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300', tag: '07 XX' },
                      { id: 'MTN MoMo' as PaymentMethod, name: 'MTN MoMo', icon: '🟡', color: 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300', tag: '05 XX' },
                      { id: 'Moov Money' as PaymentMethod, name: 'Moov Money', icon: '🔵', color: 'border-blue-600 bg-blue-600/15 text-blue-700 dark:text-blue-300', tag: '01 XX' }
                    ].map(op => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => {
                          setWithdrawMethod(op.id);
                          if (op.id === 'Moov Money' && (!withdrawPhone || withdrawPhone.startsWith('+225 07') || withdrawPhone.startsWith('+225 05'))) {
                            setWithdrawPhone('+225 01 ');
                          } else if (op.id === 'Orange Money' && (!withdrawPhone || withdrawPhone.startsWith('+225 01') || withdrawPhone.startsWith('+225 05'))) {
                            setWithdrawPhone('+225 07 ');
                          } else if (op.id === 'MTN MoMo' && (!withdrawPhone || withdrawPhone.startsWith('+225 01') || withdrawPhone.startsWith('+225 07'))) {
                            setWithdrawPhone('+225 05 ');
                          }
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left flex flex-col justify-between ${
                          withdrawMethod === op.id
                            ? `${op.color} shadow-xs ring-1 ring-emerald-500/50`
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{op.icon}</span>
                          <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold">{op.tag}</span>
                        </div>
                        <span className="font-bold text-xs">{op.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-2 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/20">
                    <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>⚡ Frais de retrait : 1% sur tous les opérateurs (Wave, Orange, MTN, Moov) • Virement sous 15-30 min</span>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Montant à Retirer (FCFA) :</label>
                  <input
                    type="number"
                    min={1000}
                    max={availableBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex gap-2">
                  {[5000, 10000, 20000, availableBalance].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmount(amt.toString())}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-[10.5px] font-mono font-bold text-slate-800 dark:text-slate-300 rounded-lg cursor-pointer"
                    >
                      {amt === availableBalance ? 'Tout' : `${amt / 1000}k`}
                    </button>
                  ))}
                </div>

                {/* Phone input */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Numéro {withdrawMethod} de Réception :
                  </label>
                  <input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder={
                      withdrawMethod === 'Moov Money' ? '+225 01 XX XX XX XX' :
                      withdrawMethod === 'MTN MoMo' ? '+225 05 XX XX XX XX' :
                      withdrawMethod === 'Orange Money' ? '+225 07 XX XX XX XX' :
                      '+225 07 / 05 / 01 XX XX XX XX'
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Net Payout Summary with 1% fee */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Montant brut demandé :</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">{Number(withdrawAmount || 0).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
                    <span>Frais de retrait (1%) :</span>
                    <span className="font-mono font-bold">
                      - {Math.max(1, Math.round(Number(withdrawAmount || 0) * 0.01)).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800">
                    <span>Net crédité sur votre mobile :</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      {(Number(withdrawAmount || 0) - Math.max(1, Math.round(Number(withdrawAmount || 0) * 0.01))).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Valider le Virement (Net: {(Number(withdrawAmount || 0) - Math.max(1, Math.round(Number(withdrawAmount || 0) * 0.01))).toLocaleString('fr-FR')} F)
                  </button>
                </div>
              </form>
            )}

            {/* OPTION 2: CARTE BANCAIRE (MODE BIENTÔT) */}
            {withdrawalChannel === 'card' && (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-slate-900/40 rounded-2xl border border-blue-500/30 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center border border-blue-500/30">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Retrait sur Carte Bancaire Livreur</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">Visa & Mastercard (Ecobank, UBA, Société Générale, NSIA...)</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                      MODE BIENTÔT
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Les livreurs partenaires pourront bientôt recevoir leurs gains de courses et pourboires directement sur leur carte de retrait bancaire Visa ou Mastercard sans passer par un compte Mobile Money.
                  </p>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px]">
                    ⚡ Phase pilote en cours. Veuillez utiliser <strong>Mobile Money (Wave, Orange, MTN, Moov)</strong> pour vos virements immédiats.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      addToast(
                        "Alerte activée",
                        "Vous serez averti dès l'activation du virement direct sur Carte Bancaire.",
                        "info"
                      );
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 text-blue-500" />
                    <span>Me notifier au lancement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawalChannel('mobile_money')}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📱 Retirer via Mobile Money (Actif)</span>
                  </button>
                </div>
              </div>
            )}

            {/* OPTION 3: CRYPTO (MODE BIENTÔT) */}
            {withdrawalChannel === 'crypto' && (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-slate-900/40 rounded-2xl border border-purple-500/30 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center border border-purple-500/30">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Retrait en Crypto-monnaie Livreur</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">USDT TRC20, Bitcoin (BTC), USDC</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500 text-white shadow-xs">
                      MODE BIENTÔT
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Virements automatisés en stablecoins USDT vers votre portefeuille crypto (Trust Wallet, Binance, MetaMask).
                  </p>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-500/20 text-purple-800 dark:text-purple-300 text-[11px]">
                    ⚡ Phase de test smart-contracts. Pour un retrait immédiat de vos gains de livraison, utilisez <strong>Mobile Money (Wave, Orange, MTN, Moov)</strong>.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      addToast(
                        "Alerte activée",
                        "Vous serez averti dès l'activation des retraits crypto USDT TRC20 et Bitcoin.",
                        "info"
                      );
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 text-purple-500" />
                    <span>Me notifier au lancement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawalChannel('mobile_money')}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📱 Retirer via Mobile Money (Actif)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
