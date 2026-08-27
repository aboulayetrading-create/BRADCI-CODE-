import React from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, Bike, Crown, Sparkles } from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { currentUser, loginAsUser, logout } = useApp();

  return (
    <div id="role-switcher-bar" className="bg-[#05080E] border-b border-amber-500/20 px-3 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        {/* Left: Indicator of active test persona & RBAC */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-semibold border border-amber-500/30 text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span>Simulateur RBAC</span>
          </div>
          <span className="text-slate-400 text-[11px] hidden lg:inline">
            Tester les 4 règles (3 articles offerts, Pass 5000F, Livreur 5 courses, KYC) :
          </span>
        </div>

        {/* Right: Quick switcher buttons with smooth horizontal scroll on mobile/tablet */}
        <div className="w-full md:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {/* Visitor */}
          <button
            id="role-btn-visitor"
            onClick={logout}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium text-[11px] shrink-0 ${
              !currentUser 
                ? 'bg-slate-700 text-white shadow' 
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>👤 Visiteur</span>
          </button>

          {/* Client Basic: Kouassi (2/3 products) */}
          <button
            id="role-btn-kouassi"
            onClick={() => loginAsUser('user-kouassi')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium text-[11px] shrink-0 ${
              currentUser?.id === 'user-kouassi'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Compte Basic : 2/3 produits gratuits utilisés"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Kouassi (Basic 2/3)</span>
          </button>

          {/* Client Pro: Awa Diabaté */}
          <button
            id="role-btn-awa"
            onClick={() => loginAsUser('user-awa')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium text-[11px] shrink-0 ${
              currentUser?.id === 'user-awa'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Pass Pro (10 000 FCFA) : 5% commission, illimité"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Awa (Pro 5%)</span>
          </button>

          {/* Driver Trial: Bakary (2/5 free rides left) */}
          <button
            id="role-btn-bakary"
            onClick={() => loginAsUser('user-bakary-driver')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium text-[11px] shrink-0 ${
              currentUser?.id === 'user-bakary-driver'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Livreur Essai : 2 courses gratuites restantes"
          >
            <Bike className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Bakary (Livreur 2/5)</span>
          </button>

          {/* Driver VIP: Yaya Touré */}
          <button
            id="role-btn-yaya"
            onClick={() => loginAsUser('user-yaya-driver')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium text-[11px] shrink-0 ${
              currentUser?.id === 'user-yaya-driver'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Pass Livreur VIP (6 000 FCFA) : Illimité"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Yaya (Pass VIP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
