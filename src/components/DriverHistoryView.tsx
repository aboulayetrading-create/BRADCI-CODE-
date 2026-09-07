import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  Receipt, 
  FileText, 
  Download, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Calendar, 
  ArrowRight,
  ExternalLink,
  Package
} from 'lucide-react';
import { DeliveryJob } from '../types';
import { getCommuneBadgeInfo } from '../data/communes';

export const DriverHistoryView: React.FC = () => {
  const { 
    currentUser, 
    freightJobs, 
    openOfficialReceipt,
    addToast 
  } = useApp();

  // Filter completed deliveries
  const completedJobs: DeliveryJob[] = useMemo(() => {
    const directJobs = freightJobs.filter(
      j => (j.assignedDriverId === currentUser?.id || j.assignedDriverName === currentUser?.name || currentUser?.role === 'driver') &&
           j.status === 'delivered'
    );

    // If driver is new and has no recorded delivered jobs yet, provide realistic historical demo entries
    if (directJobs.length === 0) {
      return [
        {
          id: 'job-hist-01',
          productTitle: 'iPhone 13 Pro 128 Go Graphite',
          productImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
          itemValue: 280000,
          pickupCommune: 'Cocody',
          pickupAddress: 'Boutique Tech, Carrefour Duncan',
          dropoffCommune: 'Marcory',
          dropoffAddress: 'Résidence Palm Beach, Zone 4C',
          distanceKm: 9.2,
          etaMinutes: 22,
          deliveryFee: 2500,
          status: 'delivered',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          assignedDriverId: currentUser?.id,
          assignedDriverName: currentUser?.name || 'Vous'
        },
        {
          id: 'job-hist-02',
          productTitle: 'Sneakers Nike Dunk Low Retro Panda (43)',
          productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
          itemValue: 45000,
          pickupCommune: 'Plateau',
          pickupAddress: 'Avenue Chardy, près Immeuble CCIA',
          dropoffCommune: 'Yopougon',
          dropoffAddress: 'Nouveau Quartier, Face Pharmacie Keneya',
          distanceKm: 14.5,
          etaMinutes: 30,
          deliveryFee: 3200,
          status: 'delivered',
          createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
          assignedDriverId: currentUser?.id,
          assignedDriverName: currentUser?.name || 'Vous'
        },
        {
          id: 'job-hist-03',
          productTitle: 'Montre Connectée Samsung Galaxy Watch 5',
          productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80',
          itemValue: 85000,
          pickupCommune: 'Treichville',
          pickupAddress: 'Rue 12, Marché de Belleville',
          dropoffCommune: 'Koumassi',
          dropoffAddress: 'Remblais, Terminus 05',
          distanceKm: 6.8,
          etaMinutes: 18,
          deliveryFee: 2000,
          status: 'delivered',
          createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
          assignedDriverId: currentUser?.id,
          assignedDriverName: currentUser?.name || 'Vous'
        }
      ] as DeliveryJob[];
    }

    return directJobs;
  }, [freightJobs, currentUser]);

  const totalDeliveredGains = useMemo(() => {
    return completedJobs.reduce((acc, j) => acc + (j.deliveryFee || 0), 0);
  }, [completedJobs]);

  return (
    <div id="driver-history-view-root" className="space-y-6 animate-in fade-in duration-200">
      {/* Executive Header Banner */}
      <div className="p-6 rounded-3xl bg-[#06102E] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-display">Historique des Courses Clôturées</h3>
              <p className="text-xs text-slate-400">
                Paiements séquestrés validés, libérés et transférés sur votre solde
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Encaissé</span>
            <span className="text-lg font-black text-emerald-400 font-mono-num">
              +{totalDeliveredGains.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="text-right border-l border-slate-800 pl-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Courses Terminées</span>
            <span className="text-lg font-black text-white font-mono-num">
              {completedJobs.length}
            </span>
          </div>
        </div>
      </div>

      {/* Completed Deliveries List */}
      <div className="space-y-3.5">
        {completedJobs.map((job) => {
          const pickupBadge = getCommuneBadgeInfo(job.pickupCommune);
          const dropoffBadge = getCommuneBadgeInfo(job.dropoffCommune);
          const dateObj = new Date(job.createdAt || Date.now());
          const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          const timeFormatted = dateObj.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={job.id}
              className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-4"
            >
              {/* Row 1: Header (Product + Validation Badges + Gain) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <img
                    src={job.productImage}
                    alt={job.productTitle}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700 bg-slate-900 shrink-0"
                  />
                  <div>
                    <h4 className="font-black text-sm text-white line-clamp-1">{job.productTitle}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Paiement Séquestre Débloqué</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{dateFormatted} à {timeFormatted}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payout & Receipt Button */}
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Gain Net Livreur</span>
                    <span className="text-lg font-black text-emerald-400 font-mono-num">
                      +{job.deliveryFee.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <button
                    id={`btn-view-receipt-${job.id}`}
                    onClick={() => {
                      openOfficialReceipt(job.id, 'driver');
                      addToast("Reçu électronique", "Bordereau officiel de course affiché.", "info");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Visualiser le reçu officiel de livraison"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Reçu Officiel</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Route Trajectory Details */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Point A */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 border border-blue-500/30">
                    A
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">{job.pickupCommune}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border ${pickupBadge.badgeClass}`}>
                        Départ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{job.pickupAddress}</p>
                  </div>
                </div>

                {/* Point B */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 border border-emerald-500/30">
                    B
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">{job.dropoffCommune}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border ${dropoffBadge.badgeClass}`}>
                        Arrivée
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{job.dropoffAddress}</p>
                  </div>
                </div>
              </div>

              {/* Row 3: Telemetry Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Validation par OTP Client • Réf : <strong className="font-mono text-slate-300">BRAD-{job.id.toUpperCase()}</strong></span>
                </span>

                <span className="font-mono text-slate-400">
                  {job.distanceKm || 8} km • ~{job.etaMinutes || 20} min
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
