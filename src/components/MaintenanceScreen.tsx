import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BradCiLogo } from './BradCiLogo';
import { 
  ShieldAlert, 
  Clock, 
  Phone, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Wrench,
  Sparkles
} from 'lucide-react';

export const MaintenanceScreen: React.FC = () => {
  const { 
    maintenanceNotice, 
    adminLogin,
    setActiveTab
  } = useApp();

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = adminLogin(adminId, adminPassword);
    if (success) {
      setShowAdminLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-xl text-center space-y-6">
        <div className="flex justify-center mb-2">
          <BradCiLogo size="lg" />
        </div>

        <div className="p-8 rounded-3xl bg-[#0C121E] border border-amber-500/30 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
            <Wrench className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Intervention Technique en Cours
            </span>
            <h1 className="text-2xl font-black text-white font-display pt-1">
              Plateforme en Cours de Maintenance
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              {maintenanceNotice}
            </p>
          </div>

          {/* Guarantees pill */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2 text-left text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Vos fonds et séquestres Wave/MoMo sont 100% protégés</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Réouverture estimée : Moins de 30 minutes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Assistance d'urgence : +225 27 22 44 88 00</span>
            </div>
          </div>

          {/* Bypass Admin Login Drawer */}
          {!showAdminLogin ? (
            <div className="pt-2">
              <button
                onClick={() => setShowAdminLogin(true)}
                className="text-xs text-slate-500 hover:text-amber-400 flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Accès Direction & Équipe Technique</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminSubmit} className="pt-3 border-t border-slate-800 text-left space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Connexion Maître Administrateur :</span>
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Identifiant Admin (ex: admin@bradci.com)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Mot de passe Maître"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Déverrouiller la Console</span>
              </button>
            </form>
          )}
        </div>

        <p className="text-[11px] text-slate-600">
          © {new Date().getFullYear()} BRAD'CI Technologies S.A. • Abidjan, Côte d'Ivoire
        </p>
      </div>
    </div>
  );
};
