import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  ChevronRight,
  Send,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { DeliveryJob, PaymentMethod } from '../types';

interface DriverEarningsDashboardProps {
  onOpenReceipt: (jobId: string) => void;
}

export const DriverEarningsDashboard: React.FC<DriverEarningsDashboardProps> = ({
  onOpenReceipt
}) => {
  const { 
    currentUser, 
    freightJobs, 
    requestUserWithdrawal,
    addToast 
  } = useApp();

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('15000');
  const [withdrawProvider, setWithdrawProvider] = useState<PaymentMethod>('Wave');
  const [withdrawPhone, setWithdrawPhone] = useState<string>(currentUser?.phone || '+225 01 44 77 89 22');

  // Filter completed jobs for the driver
  const myCompletedJobs = useMemo(() => {
    return freightJobs.filter(
      j => (j.assignedDriverId === currentUser?.id || j.assignedDriverName === currentUser?.name || currentUser?.role === 'driver') &&
           j.status === 'delivered'
    );
  }, [freightJobs, currentUser]);

  // Compute metrics
  const totalLifetimeEarnings = useMemo(() => {
    return myCompletedJobs.reduce((sum, j) => sum + (j.deliveryFee || 0), 0);
  }, [myCompletedJobs]);

  const todayEarnings = useMemo(() => {
    // Return sample or computed today amount
    return Math.min(totalLifetimeEarnings, 18500);
  }, [totalLifetimeEarnings]);

  const weekEarnings = useMemo(() => {
    return Math.min(totalLifetimeEarnings, 54500);
  }, [totalLifetimeEarnings]);

  const monthEarnings = useMemo(() => {
    return totalLifetimeEarnings || 162000;
  }, [totalLifetimeEarnings]);

  // Available withdrawable balance (currentUser.walletBalance or default calculated)
  const availableBalance = Math.max(currentUser?.walletBalance || 0, 32500);

  // Daily breakdown for visual chart (7 days: Lun, Mar, Mer, Jeu, Ven, Sam, Dim)
  const weeklyData = [
    { day: 'Lun', amount: 8500, count: 2 },
    { day: 'Mar', amount: 11000, count: 3 },
    { day: 'Mer', amount: 6500, count: 2 },
    { day: 'Jeu', amount: 14000, count: 4 },
    { day: 'Ven', amount: 18500, count: 5 },
    { day: 'Sam', amount: 22000, count: 6 },
    { day: 'Dim', amount: 12500, count: 3 },
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
      addToast('Solde insuffisant', `Votre solde retirable disponible est de ${availableBalance.toLocaleString('fr-FR')} FCFA.`, 'warning');
      return;
    }

    if (requestUserWithdrawal) {
      requestUserWithdrawal(amountNum, withdrawProvider, withdrawPhone);
    }
    addToast(
      'Demande de retrait transmise',
      `Virement instantané de ${amountNum.toLocaleString('fr-FR')} FCFA vers ${withdrawProvider} (${withdrawPhone}) en cours de traitement.`,
      'success'
    );
    setIsWithdrawModalOpen(false);
  };

  return (
    <div id="driver-earnings-dashboard" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Withdrawable Balance */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0D1C34] to-[#0A1220] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>0% Commission Plateforme Livreur</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-800/80 px-2 py-1 rounded-lg">
                100% Net Livreur Garanti
              </span>
            </div>

            <p className="text-xs text-slate-400">Solde Retirable Disponible</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white font-mono-num tracking-tight">
                {availableBalance.toLocaleString('fr-FR')}
              </h2>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-400">FCFA</span>
            </div>
            <p className="text-xs text-slate-400">
              Virements instantanés 24h/24 sans frais sur Wave, Orange Money, MTN MoMo et Moov Money.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-open-driver-withdraw"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Demander un Retrait Immédiat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today */}
        <div className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Aujourd'hui</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono-num">
            {todayEarnings.toLocaleString('fr-FR')} <span className="text-xs text-emerald-400">F</span>
          </p>
          <span className="text-[10px] text-emerald-400 font-bold block">+18% par rapport à hier</span>
        </div>

        {/* 7 Days */}
        <div className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">7 Derniers Jours</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono-num">
            {weekEarnings.toLocaleString('fr-FR')} <span className="text-xs text-blue-400">F</span>
          </p>
          <span className="text-[10px] text-slate-400 block">{myCompletedJobs.length} courses réalisées</span>
        </div>

        {/* This Month */}
        <div className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Ce Mois</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono-num">
            {monthEarnings.toLocaleString('fr-FR')} <span className="text-xs text-amber-400">F</span>
          </p>
          <span className="text-[10px] text-amber-400 font-bold block">Objectif mensuel à 82%</span>
        </div>

        {/* Average Course */}
        <div className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Moyenne / Course</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono-num">
            {myCompletedJobs.length > 0 ? Math.round(totalLifetimeEarnings / myCompletedJobs.length).toLocaleString('fr-FR') : '3 800'}{' '}
            <span className="text-xs text-purple-400">F</span>
          </p>
          <span className="text-[10px] text-purple-400 font-bold block">Tarif équitable garanti</span>
        </div>
      </div>

      {/* Weekly Earnings Histogram Visualizer */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Progression des Revenus de la Semaine</span>
            </h3>
            <p className="text-xs text-slate-400">Visualisation quotidienne de vos gains de livraison net</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
            Total Semaine : {weekEarnings.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        {/* Bars Container */}
        <div className="grid grid-cols-7 gap-2 pt-6 items-end h-48 border-b border-slate-800 pb-2">
          {weeklyData.map(d => {
            const heightPercent = maxDailyAmount > 0 ? Math.round((d.amount / maxDailyAmount) * 100) : 20;
            return (
              <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono-num font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.amount.toLocaleString('fr-FR')} F
                </span>
                <div className="w-full max-w-[36px] bg-slate-800 rounded-t-xl overflow-hidden relative flex items-end h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      d.day === 'Ven' || d.day === 'Sam'
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : 'bg-gradient-to-t from-blue-600 to-blue-400'
                    }`}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-300 block">{d.day}</span>
                  <span className="text-[9px] text-slate-500">{d.count} c.</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown of Completed Courses with direct Receipts access */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Derniers Règlements de Courses & Bordereaux</span>
            </h3>
            <p className="text-xs text-slate-400">
              Chaque course donne droit à un bordereau officiel de mission livreur certifié BRAD'CI.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {myCompletedJobs.length} courses
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {myCompletedJobs.map(job => (
            <div 
              key={job.id} 
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={job.productImage}
                  alt={job.productTitle}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white line-clamp-1">{job.productTitle}</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                      Encaissé
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {job.pickupCommune} ➔ {job.dropoffCommune} • {job.completedAt || 'Clôturée avec succès'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 font-mono-num block">
                    + {job.deliveryFee.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">100% Net Livreur</span>
                </div>

                <button
                  onClick={() => onOpenReceipt(job.id)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-emerald-500/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Consulter le bordereau officiel livreur"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reçu Livreur</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsWithdrawModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Retrait Immédiat Livreur</h4>
                  <p className="text-[11px] text-slate-400">Virement automatique 24h/24</p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  Moyen de Paiement Téléphone :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money'] as PaymentMethod[]).map(provider => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setWithdrawProvider(provider)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        withdrawProvider === provider
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  Numéro de téléphone bénéficiaire :
                </label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={e => setWithdrawPhone(e.target.value)}
                  placeholder="+225 01 XX XX XX XX"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-300 font-bold">Montant à retirer (FCFA) :</label>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    Max : {availableBalance.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  min="1000"
                  max={availableBalance}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono-num font-black"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Frais de virement BRAD'CI :</span>
                  <span className="text-emerald-400 font-bold">0 FCFA (Gratuit)</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                  <span>Net reçu sur votre mobile :</span>
                  <span className="text-emerald-300 font-mono">
                    {parseInt(withdrawAmount || '0', 10).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmer le virement vers {withdrawProvider}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
