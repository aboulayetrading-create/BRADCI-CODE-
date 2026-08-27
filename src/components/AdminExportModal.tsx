import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar,
  Building,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { TimeFilter } from '../types';

export const AdminExportModal: React.FC = () => {
  const { 
    adminExportModalOpen, 
    setAdminExportModalOpen,
    escrowRecords,
    financialTransactions,
    users,
    exportFinancialsExcel
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('monthly');

  if (!adminExportModalOpen) return null;

  // Compute stats based on filter
  const totalHeldEscrow = escrowRecords
    .filter(e => e.status === 'held')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCommissions = financialTransactions
    .filter(t => t.category === 'commission')
    .reduce((sum, t) => sum + t.netRevenueBradCi, 0);

  const totalSubscriptions = financialTransactions
    .filter(t => t.category === 'subscription')
    .reduce((sum, t) => sum + t.grossAmount, 0);

  const totalPlatformVolume = financialTransactions
    .reduce((sum, t) => sum + t.grossAmount, 0);

  const netBradCiRevenue = totalCommissions + totalSubscriptions;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-3xl bg-[#0C121E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 print:bg-white print:text-black print:border-none print:shadow-none print:max-w-full">
        {/* Close Button (Hidden in Print) */}
        <button
          onClick={() => setAdminExportModalOpen(false)}
          className="print:hidden absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Action Header in Modal (Hidden in Print) */}
        <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Générateur de Rapports Financiers & Audit</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exporter les flux de trésorerie, séquestres et commissions certifiées
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => exportFinancialsExcel(selectedFilter)}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exporter Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Filter Selector in Modal (Hidden in Print) */}
        <div className="print:hidden my-4 p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300 font-bold">Période du Rapport :</span>
          <div className="flex flex-wrap gap-1">
            {(['hourly', 'daily', 'weekly', 'monthly', 'yearly', 'all_time'] as TimeFilter[]).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedFilter === filter
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {filter === 'hourly' ? 'Heure' : filter === 'daily' ? 'Jour' : filter === 'weekly' ? 'Semaine' : filter === 'monthly' ? 'Mois' : filter === 'yearly' ? 'Année' : 'Cumul Global'}
              </button>
            ))}
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="space-y-6 pt-2 print:text-black print:space-y-4">
          {/* Document Letterhead */}
          <div className="flex items-start justify-between border-b pb-4 border-slate-800 print:border-slate-300">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white print:text-black">BRAD'CI TECHNOLOGIES S.A.</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 print:text-black print:border border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase">
                  RAPPORT OFFICIEL
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Plateforme d'Enchères Sécurisées avec Séquestre Wave & Livraisons Géolocalisées
              </p>
              <p className="text-[11px] text-slate-500 print:text-slate-500">
                Immeuble CCIA, Cité Administrative, Le Plateau, Abidjan - RCCM : CI-ABJ-2026-B-1092
              </p>
            </div>

            <div className="text-right text-xs text-slate-400 print:text-slate-600">
              <p className="font-bold text-white print:text-black">Date d'Édition :</p>
              <p className="font-mono">{new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-[10px] text-slate-500 mt-1">Période : <strong className="uppercase">{selectedFilter}</strong></p>
            </div>
          </div>

          {/* Key Financial Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 bg-slate-900 print:bg-slate-100 rounded-2xl border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold block uppercase">Volume Brut :</span>
              <span className="text-base font-black text-white print:text-black font-mono mt-1 block">
                {totalPlatformVolume.toLocaleString('fr-FR')} F
              </span>
            </div>

            <div className="p-3.5 bg-slate-900 print:bg-slate-100 rounded-2xl border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold block uppercase">Solde Séquestre :</span>
              <span className="text-base font-black text-amber-400 print:text-amber-700 font-mono mt-1 block">
                {totalHeldEscrow.toLocaleString('fr-FR')} F
              </span>
            </div>

            <div className="p-3.5 bg-slate-900 print:bg-slate-100 rounded-2xl border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold block uppercase">Commissions Ventes :</span>
              <span className="text-base font-black text-emerald-400 print:text-emerald-700 font-mono mt-1 block">
                {totalCommissions.toLocaleString('fr-FR')} F
              </span>
            </div>

            <div className="p-3.5 bg-slate-900 print:bg-slate-100 rounded-2xl border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold block uppercase">Revenu Net BRAD'CI :</span>
              <span className="text-base font-black text-blue-400 print:text-blue-800 font-mono mt-1 block">
                {netBradCiRevenue.toLocaleString('fr-FR')} F
              </span>
            </div>
          </div>

          {/* Detailed Transaction Table */}
          <div className="border border-slate-800 print:border-slate-300 rounded-2xl overflow-hidden">
            <div className="p-3 bg-slate-900 print:bg-slate-200 border-b border-slate-800 print:border-slate-300 flex justify-between items-center text-xs font-bold">
              <span className="text-white print:text-black">Détail des Opérations Financières ({financialTransactions.length} enregistrements)</span>
              <span className="text-slate-400 print:text-slate-600 font-mono">Devise : FCFA (XOF)</span>
            </div>
            <table className="w-full text-left text-[11px] print:text-[10px]">
              <thead className="bg-slate-900/60 print:bg-slate-100 text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="p-2.5">Date/Heure</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Utilisateur</th>
                  <th className="p-2.5">Opérateur</th>
                  <th className="p-2.5 text-right">Montant Brut</th>
                  <th className="p-2.5 text-right">Part BRAD'CI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                {financialTransactions.map(t => (
                  <tr key={t.id} className="text-slate-300 print:text-black">
                    <td className="p-2.5 font-mono">{t.date} {t.time}</td>
                    <td className="p-2.5 font-medium">{t.description}</td>
                    <td className="p-2.5">{t.userName}</td>
                    <td className="p-2.5 font-mono">{t.paymentMethod}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{t.grossAmount.toLocaleString('fr-FR')} F</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-400 print:text-black">{t.netRevenueBradCi.toLocaleString('fr-FR')} F</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legal Signatures Box */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-xs border-t border-slate-800 print:border-slate-300">
            <div>
              <p className="font-bold text-slate-400 print:text-slate-700 uppercase text-[10px]">Contrôle de Conformité & Audit :</p>
              <div className="h-16 flex items-end">
                <p className="font-mono text-[11px] text-slate-500">Signé numériquement par Direction Sécurité Brad'CI</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-400 print:text-slate-700 uppercase text-[10px]">Cachet Officiel :</p>
              <div className="h-16 flex items-end justify-end">
                <div className="border-2 border-dashed border-amber-500/40 print:border-black p-2 rounded-xl text-center text-[10px] text-amber-400 print:text-black font-bold uppercase">
                  BRAD'CI S.A. • ABIDJAN<br />SÉQUESTRE CERTIFIÉ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
