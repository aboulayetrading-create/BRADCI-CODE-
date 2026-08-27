import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  MessageSquare, 
  Ban, 
  CheckCircle2, 
  Store, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  Bike, 
  Crown,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User } from '../types';

export const AdminMemberDetailModal: React.FC = () => {
  const { 
    adminSelectedMemberForModal, 
    setAdminSelectedMemberForModal,
    adminToggleUserSuspension,
    adminToggleShopClosure,
    setAdminMessageModalRecipient,
    products,
    freightJobs
  } = useApp();

  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');
  const [showSuspensionPrompt, setShowSuspensionPrompt] = useState(false);

  if (!adminSelectedMemberForModal) return null;
  const user = adminSelectedMemberForModal;

  const userProducts = products.filter(p => p.sellerId === user.id);
  const userFreightMissions = freightJobs.filter(j => j.assignedDriverId === user.id);

  const handleToggleSuspension = () => {
    adminToggleUserSuspension(user.id, suspensionReasonInput);
    setShowSuspensionPrompt(false);
    setSuspensionReasonInput('');
    setAdminSelectedMemberForModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-100 my-8">
        <button
          onClick={() => setAdminSelectedMemberForModal(null)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
              />
              {user.isVIP && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow">
                  <Crown className="w-3 h-3" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">{user.name}</h3>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  user.isSuspended 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {user.isSuspended ? 'SUSPENDU' : user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>ID: <code className="text-slate-300 font-mono">{user.id}</code></span>
                <span>•</span>
                <span>Inscrit le 12/08/2026</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setAdminMessageModalRecipient(user);
                setAdminSelectedMemberForModal(null);
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contacter</span>
            </button>

            <button
              onClick={() => setShowSuspensionPrompt(!showSuspensionPrompt)}
              className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border transition-all ${
                user.isSuspended 
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30' 
                  : 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{user.isSuspended ? 'Débloquer' : 'Suspendre'}</span>
            </button>
          </div>
        </div>

        {/* Suspension prompt drawer */}
        {showSuspensionPrompt && (
          <div className="mt-4 p-4 rounded-2xl bg-red-950/30 border border-red-500/40 animate-in fade-in space-y-3">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>{user.isSuspended ? 'Confirmer le déblocage du compte :' : 'Motif de la suspension administrative :'}</span>
            </div>
            {!user.isSuspended && (
              <input
                type="text"
                value={suspensionReasonInput}
                onChange={(e) => setSuspensionReasonInput(e.target.value)}
                placeholder="Ex: Non respect des conditions d'enchères, document frauduleux..."
                className="w-full bg-slate-900 border border-red-500/30 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSuspensionPrompt(false)}
                className="px-3 py-1.5 bg-slate-900 text-slate-400 hover:text-white text-xs font-bold rounded-lg border border-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={handleToggleSuspension}
                className={`px-4 py-1.5 text-xs font-black rounded-lg text-white ${
                  user.isSuspended ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {user.isSuspended ? 'Confirmer Réactivation' : 'Confirmer Suspension Immédiate'}
              </button>
            </div>
          </div>
        )}

        {/* 4 Financial & Activity Stats Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Solde Portefeuille :</span>
            <span className="text-base font-black text-amber-400 font-mono-num mt-1 block">
              {user.walletBalance.toLocaleString('fr-FR')} F
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Forfait Actif :</span>
            <span className="text-sm font-bold text-white uppercase mt-1 block">
              {user.role === 'client' ? (user.sellerPlan || 'BASIC') : (user.driverPlan || 'TRIAL')}
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Annonces / Fret :</span>
            <span className="text-base font-black text-blue-400 font-mono-num mt-1 block">
              {user.productsPublishedCount} annonces
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Note Sécurité :</span>
            <span className="text-base font-black text-emerald-400 font-mono-num mt-1 block">
              ★ {user.rating || 4.9} ({user.reviewCount || 10})
            </span>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="space-y-4 text-xs">
          {/* Identity & KYC section */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center justify-between">
              <span>Coordonnées & Statut KYC</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                user.kycStatus === 'verified'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : user.kycStatus === 'pending'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {user.kycStatus === 'verified' ? '✓ KYC Certifié' : user.kycStatus === 'pending' ? '⏳ KYC En Attente' : 'Non Vérifié'}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Téléphone : <strong className="text-white font-mono">{user.phone}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Email : <strong className="text-white">{user.email}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Commune : <strong className="text-white">{user.gpsLocation?.commune || 'Abidjan'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Pièce : <strong className="text-white font-mono">{user.kycDocumentType?.toUpperCase()} {user.kycDocumentNumber || 'Non renseigné'}</strong></span>
              </div>
            </div>
          </div>

          {/* Shop details if seller */}
          {user.shop && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-white text-xs">Vitrine Boutique : {user.shop.name}</h4>
                </div>
                <button
                  onClick={() => adminToggleShopClosure(user.shop!.id)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                    user.shop.isClosed
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
                      : 'bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30'
                  }`}
                >
                  {user.shop.isClosed ? 'Rouvrir Boutique' : 'Fermer la Boutique'}
                </button>
              </div>
              <p className="text-slate-400 text-xs">{user.shop.description}</p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span>Catégorie : <strong className="text-slate-200">{user.shop.category}</strong></span>
                <span>•</span>
                <span>Ventes : <strong className="text-emerald-400">{user.shop.salesCount}</strong></span>
                <span>•</span>
                <span>Vues : <strong className="text-blue-400">{user.shop.viewsCount}</strong></span>
              </div>
            </div>
          )}

          {/* Active Products Summary */}
          {userProducts.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span>Articles & Enchères Actives ({userProducts.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {userProducts.map(p => (
                  <div key={p.id} className="p-2 rounded-xl bg-slate-950/60 flex items-center justify-between text-[11px]">
                    <span className="truncate max-w-[280px] text-slate-200 font-medium">{p.title}</span>
                    <span className="font-mono-num font-bold text-amber-400">{p.currentPrice.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
