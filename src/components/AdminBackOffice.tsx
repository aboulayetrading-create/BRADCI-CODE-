import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  DollarSign, 
  Users, 
  FileCheck, 
  Radio, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Phone, 
  Eye, 
  Download, 
  Clock, 
  Activity, 
  MapPin, 
  Send, 
  Power, 
  Bell, 
  Building, 
  FileText, 
  Layers, 
  Check, 
  X, 
  MessageSquare, 
  AlertCircle, 
  Ban, 
  Store, 
  Sparkles,
  Printer,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Gavel,
  Zap,
  Video,
  Play,
  Film,
  Image as ImageIcon,
  Key,
  PhoneCall,
  ShieldAlert
} from 'lucide-react';
import { 
  TimeFilter, 
  PaymentMethod, 
  WithdrawalRequest, 
  FinancialTransaction,
  User
} from '../types';
import { ALL_COMMUNES } from '../data/communes';
import { AdminActivityAuditView } from './AdminActivityAuditView';
import { AdminCallChatArchiveView } from './AdminCallChatArchiveView';
import { AdminUserInvestigationView } from './AdminUserInvestigationView';

export const AdminBackOffice: React.FC = () => {
  const { 
    currentUser,
    users, 
    products, 
    freightJobs, 
    escrowRecords, 
    kycRecords,
    adminApproveKYC,
    adminRejectKYC,
    activeLiveVisitorsCount,
    newRegistrationsTodayCount,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    isMaintenanceMode,
    maintenanceNotice,
    toggleMaintenanceMode,
    withdrawalRequests,
    financialTransactions,
    supportTickets,
    adminResolveSupportTicket,
    adminAuthorizeSupportCall,
    adminAlerts,
    markAlertAsRead,
    dismissAlert,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    adminToggleUserSuspension,
    adminToggleShopClosure,
    adminReassignDriver,
    adminCancelDeliveryJob,
    adminApproveProduct,
    adminRejectProduct,
    setAdminExportModalOpen,
    setAdminSelectedMemberForModal,
    setAdminMessageModalRecipient,
    exportFinancialsExcel,
    language,
    translate
  } = useApp();

  // Navigation within Admin Suite
  const [adminTab, setAdminTab] = useState<'financials' | 'withdrawals' | 'members' | 'kyc' | 'product_approvals' | 'support_tickets' | 'recordings_archive' | 'theft_investigations' | 'operations_gps' | 'audit_activity_ip' | 'settings'>('financials');

  // Master Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Support Tickets states
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'call_scheduled'>('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicketForResolve, setSelectedTicketForResolve] = useState<string | null>(null);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');

  // Product Approvals states
  const [productApprovalFilter, setProductApprovalFilter] = useState<'all' | 'auction' | 'shop'>('all');
  const [productApprovalSearch, setProductApprovalSearch] = useState('');
  const [selectedProductForReject, setSelectedProductForReject] = useState<string | null>(null);
  const [productRejectReasonInput, setProductRejectReasonInput] = useState('');
  const [activeMediaPreview, setActiveMediaPreview] = useState<{ type: 'image' | 'video'; url: string; title: string; duration?: number } | null>(null);

  // Financials filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionCategory, setTransactionCategory] = useState<string>('all');

  // Withdrawal filters
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectModalRequest, setRejectModalRequest] = useState<WithdrawalRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Member directory filters
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>('all');
  const [memberSearch, setMemberSearch] = useState('');

  // KYC filters & state
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [selectedKycDoc, setSelectedKycDoc] = useState<string | null>(null);
  const [kycRejectId, setKycRejectId] = useState<string | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState('');

  // Operations GPS state
  const [selectedCommuneRadar, setSelectedCommuneRadar] = useState<string>('all');
  const [selectedJobForReassign, setSelectedJobForReassign] = useState<string | null>(null);
  const [selectedNewDriverId, setSelectedNewDriverId] = useState<string>('');

  // Settings state
  const [noticeDraft, setNoticeDraft] = useState(maintenanceNotice);

  // ================= 1. MASTER LOGIN CHECK =================
  if (!isAdminAuthenticated) {
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      adminLogin(loginIdentifier, loginPassword);
    };

    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
        <div className="w-full max-w-md bg-[#0C121E] border border-amber-500/30 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
              {translate("Accès Restreint & Sécurisé", "Restricted & Secure Access")}
            </span>
            <h1 className="text-2xl font-black text-white font-display">
              {translate("Direction Générale BRAD'CI", "BRAD'CI Executive Management")}
            </h1>
            <p className="text-xs text-slate-400">
              {translate(
                "Veuillez saisir les identifiants maîtres pour déverrouiller la console de gestion administrative.",
                "Please enter master credentials to unlock the administrative management console."
              )}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {translate("Identifiant Administrateur :", "Administrator Identifier:")}
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="ex: admin@bradci.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {translate("Mot de Passe Maître :", "Master Password:")}
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Lock className="w-4 h-4" />
              <span>{translate("Déverrouiller l'Espace Admin", "Unlock Admin Back-Office")}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= FINANCIAL COMPUTATIONS =================
  const totalEscrowHeld = escrowRecords
    .filter(e => e.status === 'held')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalUserWallets = users
    .reduce((sum, u) => sum + (u.walletBalance || 0), 0);

  // Total Immobilized Funds (Solde Total Immobilisé)
  const totalImmobilizedFunds = totalEscrowHeld + totalUserWallets;

  // Commissions vs Passes Subscriptions
  const commissionsRevenue = financialTransactions
    .filter(t => t.category === 'commission')
    .reduce((sum, t) => sum + t.netRevenueBradCi, 0);

  const subscriptionsRevenue = financialTransactions
    .filter(t => t.category === 'subscription')
    .reduce((sum, t) => sum + t.grossAmount, 0);

  const netBradCiTotalRevenue = commissionsRevenue + subscriptionsRevenue;

  const pendingWithdrawalsCount = withdrawalRequests.filter(w => w.status === 'pending').length;
  const pendingKycCount = kycRecords.filter(k => k.status === 'pending').length;
  const pendingProductsCount = products.filter(p => p.status === 'pending_approval').length;
  const pendingTicketsCount = supportTickets.filter(t => t.status === 'pending' || t.status === 'in_review').length;
  const unreadAlertsCount = adminAlerts.filter(a => !a.isRead).length;

  // Filter support tickets
  const filteredTickets = supportTickets.filter(t => {
    const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
    const matchesSearch = t.userName.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.userPhone.includes(ticketSearch) ||
      t.clientMessage.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.problemCategoryLabel.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.advisorName.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filter pending products for moderation
  const filteredPendingProducts = products.filter(p => {
    const isPending = p.status === 'pending_approval';
    const matchesType = productApprovalFilter === 'all' || 
      (productApprovalFilter === 'auction' && p.listingType === 'auction') ||
      (productApprovalFilter === 'shop' && p.listingType === 'shop');
    const matchesSearch = p.title.toLowerCase().includes(productApprovalSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productApprovalSearch.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(productApprovalSearch.toLowerCase()) ||
      p.commune.toLowerCase().includes(productApprovalSearch.toLowerCase());
    return isPending && matchesType && matchesSearch;
  });

  // Filter transactions
  const filteredTransactions = financialTransactions.filter(t => {
    const matchesCat = transactionCategory === 'all' || t.category === transactionCategory;
    const matchesSearch = t.description.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      t.userName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      t.paymentMethod.toLowerCase().includes(transactionSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filter members
  const filteredMembers = users.filter(u => {
    const matchesRole = memberRoleFilter === 'all' || u.role === memberRoleFilter;
    const matchesSearch = u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.phone.includes(memberSearch) ||
      u.email.toLowerCase().includes(memberSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 selection:bg-amber-500 selection:text-slate-950 pb-20">
      
      {/* ================= 2. TOP MANAGEMENT HEADER ================= */}
      <header className="sticky top-0 z-40 bg-[#0C121E]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Brand & Security status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-white font-display tracking-tight">
                  {translate("BRAD'CI • Espace Administration", "BRAD'CI • Admin Back-Office")}
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  {translate("Session Maître Active", "Master Session Active")}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{translate("Supervision Financière & Contrôle Opérationnel", "Financial Supervision & Operational Control")}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{translate("Portefeuille Séquestre Certifié", "Certified Escrow Vault")}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Global Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            
            {/* Live Visitors Heartbeat Counter */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">{translate("Visiteurs en direct :", "Live visitors:")}</span>
              <strong className="text-emerald-400 font-mono-num">{activeLiveVisitorsCount}</strong>
            </div>

            {/* Maintenance Mode Pill & Switch */}
            <button
              onClick={() => toggleMaintenanceMode()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isMaintenanceMode 
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30' 
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isMaintenanceMode ? translate('Maintenance ACTIVE', 'Maintenance ACTIVE') : translate('Site Ouvert', 'Site Online')}</span>
            </button>

            {/* Export Report Trigger */}
            <button
              onClick={() => setAdminExportModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>{translate("Rapport / Audit PDF", "Audit & Report PDF")}</span>
            </button>

            {/* Lock Session */}
            <button
              onClick={adminLogout}
              className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{translate("Verrouiller", "Lock Session")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= 3. NAVIGATION TABS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
          <button
            onClick={() => setAdminTab('financials')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'financials'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{translate("Comptabilité & Trésorerie", "Treasury & Finance")}</span>
          </button>

          <button
            onClick={() => setAdminTab('withdrawals')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'withdrawals'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{translate("Retraits & Alertes", "Withdrawals & Alerts")}</span>
            {pendingWithdrawalsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                adminTab === 'withdrawals' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
              }`}>
                {pendingWithdrawalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('members')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'members'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{translate(`Annuaire & Modération (${users.length})`, `Directory & Users (${users.length})`)}</span>
          </button>

          <button
            onClick={() => setAdminTab('kyc')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'kyc'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>{translate("Validations KYC & Anti-Fraude", "KYC Approvals & Security")}</span>
            {pendingKycCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                adminTab === 'kyc' ? 'bg-slate-950 text-amber-400' : 'bg-blue-500 text-white'
              }`}>
                {pendingKycCount}
              </span>
            )}
          </button>

          {/* New Tab: Approbations Produits */}
          <button
            onClick={() => setAdminTab('product_approvals')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'product_approvals'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{translate("Approbations Produits (Enchères & Boutiques)", "Product Approvals (Auctions & Stores)")}</span>
            {pendingProductsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black animate-pulse ${
                adminTab === 'product_approvals' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
              }`}>
                {pendingProductsCount}
              </span>
            )}
          </button>

          {/* New Tab: Support Client & Requêtes */}
          <button
            id="admin-tab-support-tickets"
            onClick={() => setAdminTab('support_tickets')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'support_tickets'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Phone className="w-4 h-4 text-rose-400" />
            <span>{translate("Requêtes Clients & Appels", "Support Tickets & Calls")}</span>
            {pendingTicketsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black animate-pulse ${
                adminTab === 'support_tickets' ? 'bg-slate-950 text-amber-400' : 'bg-rose-500 text-white'
              }`}>
                {pendingTicketsCount}
              </span>
            )}
          </button>

          {/* New Tab 1: Enregistrements Conversations & Appels */}
          <button
            id="admin-tab-recordings-archive"
            onClick={() => setAdminTab('recordings_archive')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'recordings_archive'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>{translate("Enregistrements Conversations & Appels", "Conversations & Calls Recordings")}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          {/* New Tab 2: Enquêtes Vol, Antivol & Accès Direct aux Comptes */}
          <button
            id="admin-tab-theft-investigations"
            onClick={() => setAdminTab('theft_investigations')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'theft_investigations'
                ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                : 'bg-slate-900/80 text-red-300 border-red-500/30 hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>{translate("Enquêtes Vol, Antivol & Accès Direct Comptes", "Theft & Direct Account Access")}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-600 text-white">
              ADMIN SEUL
            </span>
          </button>

          <button
            onClick={() => setAdminTab('operations_gps')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'operations_gps'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{translate("Radar Opérationnel & GPS", "Operational Radar & GPS")}</span>
          </button>

          <button
            id="admin-tab-activity-audit"
            onClick={() => setAdminTab('audit_activity_ip')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'audit_activity_ip'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>{translate("Activité, IP & Localisation", "Activity, IP & Geolocation")}</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>

          <button
            onClick={() => setAdminTab('settings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all ${
              adminTab === 'settings'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Paramètres Système</span>
          </button>
        </div>
      </div>

      {/* ================= 4. TAB CONTENTS ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">

        {/* ---------------------------------------------------- */}
        {/* TAB 1: FINANCIALS (Comptabilité & Trésorerie)        */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'financials' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Top 4 Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Solde Total Immobilisé */}
              <div className="p-5 rounded-3xl bg-[#0C121E] border border-amber-500/40 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="uppercase font-bold tracking-wider">Solde Total Immobilisé</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-num tracking-tight block">
                    {totalImmobilizedFunds.toLocaleString('fr-FR')} FCFA
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    <span>Séquestres en cours : <strong className="text-slate-200">{totalEscrowHeld.toLocaleString('fr-FR')} F</strong></span>
                    <span>•</span>
                    <span>Portefeuilles : <strong className="text-slate-200">{totalUserWallets.toLocaleString('fr-FR')} F</strong></span>
                  </div>
                </div>
              </div>

              {/* Revenu Net BRAD'CI */}
              <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="uppercase font-bold tracking-wider">Chiffre d'Affaires Net BRAD'CI</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-num tracking-tight block">
                    {netBradCiTotalRevenue.toLocaleString('fr-FR')} FCFA
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    <span>Part Commissions : <strong className="text-emerald-400">{commissionsRevenue.toLocaleString('fr-FR')} F</strong></span>
                    <span>•</span>
                    <span>Pass : <strong className="text-blue-400">{subscriptionsRevenue.toLocaleString('fr-FR')} F</strong></span>
                  </div>
                </div>
              </div>

              {/* Commissions sur Ventes & Courses */}
              <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="uppercase font-bold tracking-wider">Commissions Enchères & Fret</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono-num tracking-tight block">
                    {commissionsRevenue.toLocaleString('fr-FR')} FCFA
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    Taux appliqués : 10% (Basic), 7.5% (Standard), 5% (Pro VIP)
                  </p>
                </div>
              </div>

              {/* Vente de Pass & Boosts */}
              <div className="p-5 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="uppercase font-bold tracking-wider">Abonnements Pass & Boosts</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono-num tracking-tight block">
                    {subscriptionsRevenue.toLocaleString('fr-FR')} FCFA
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    Pass Vendeurs (5k/10k) • Pass Livreur VIP (6k) • Boosts Flash (1k)
                  </p>
                </div>
              </div>

            </div>

            {/* Time Filter Bar & Excel Export */}
            <div className="p-4 rounded-3xl bg-[#0C121E] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300">Périodicité d'Analyse :</span>
                <div className="flex flex-wrap gap-1">
                  {(['hourly', 'daily', 'weekly', 'monthly', 'yearly', 'all_time'] as TimeFilter[]).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        timeFilter === filter
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {filter === 'hourly' ? 'Heure par heure' : filter === 'daily' ? 'Jour' : filter === 'weekly' ? 'Semaine' : filter === 'monthly' ? 'Mois' : filter === 'yearly' ? 'Année' : 'Cumul Global'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => exportFinancialsExcel(timeFilter)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all w-full md:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter Rapport Excel (.xlsx / .csv)</span>
                </button>
              </div>
            </div>

            {/* Visual Revenue Breakdown & Operator Splits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Payment Gateways Distribution */}
              <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>Répartition par Opérateur Mobile Money</span>
                </h3>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-sky-400">🌊 Wave Côte d'Ivoire (0% frais)</span>
                      <span className="font-mono text-slate-300">58% • 1 850 000 F</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-400 h-full rounded-full w-[58%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-orange-400">🍊 Orange Money CI</span>
                      <span className="font-mono text-slate-300">26% • 830 000 F</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-400 h-full rounded-full w-[26%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-yellow-400">💛 MTN MoMo CI</span>
                      <span className="font-mono text-slate-300">12% • 385 000 F</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full rounded-full w-[12%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-blue-400">💙 Moov Money CI</span>
                      <span className="font-mono text-slate-300">4% • 135 000 F</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full rounded-full w-[4%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-white">Grand Livre des Opérations & Séquestres</h3>
                    <p className="text-xs text-slate-400">Flux financiers audités en temps réel</p>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <select
                      value={transactionCategory}
                      onChange={(e) => setTransactionCategory(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">Toutes Catégories</option>
                      <option value="commission">Commissions Seules</option>
                      <option value="subscription">Pass & Boosts</option>
                      <option value="escrow_hold">Entrées Séquestre</option>
                      <option value="payout">Retraits Décaissés</option>
                    </select>
                  </div>
                </div>

                {/* Search in Transactions */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    placeholder="Rechercher une transaction par utilisateur, motif ou opérateur..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Table */}
                <div className="border border-slate-800 rounded-2xl overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Utilisateur</th>
                        <th className="p-3">Opérateur</th>
                        <th className="p-3 text-right">Montant Brut</th>
                        <th className="p-3 text-right">Part BRAD'CI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-900/40 text-slate-300">
                          <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{t.date} {t.time}</td>
                          <td className="p-3 font-medium text-white">{t.description}</td>
                          <td className="p-3 whitespace-nowrap">{t.userName}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
                              {t.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                            {t.grossAmount.toLocaleString('fr-FR')} F
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            +{t.netRevenueBradCi.toLocaleString('fr-FR')} F
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: WITHDRAWALS & ALERTS (Retraits & Alertes SMS) */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'withdrawals' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Live SMS & WhatsApp Alert Banner */}
            <div className="p-5 rounded-3xl bg-[#0C121E] border border-blue-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Centre d'Alertes SMS / WhatsApp Administrateur</h3>
                    <p className="text-xs text-slate-400">
                      Les demandes de retrait sont notifiées instantanément au numéro officiel : <strong className="text-amber-400 font-mono">+225 07 89 96 15 80</strong>
                    </p>
                  </div>
                </div>

                <span className="text-[11px] bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-mono font-bold border border-blue-500/30">
                  {adminAlerts.length} alertes reçues
                </span>
              </div>

              {/* Alert items ticker */}
              {adminAlerts.length > 0 && (
                <div className="space-y-2 pt-2">
                  {adminAlerts.slice(0, 3).map(alert => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                        alert.isRead ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-blue-950/30 border-blue-500/40 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <div>
                          <p className="font-bold text-white text-xs">{alert.title}</p>
                          <p className="text-slate-300 text-[11px]">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(alert.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!alert.isRead && (
                          <button
                            onClick={() => markAlertAsRead(alert.id)}
                            className="text-[10px] bg-blue-500 hover:bg-blue-400 text-slate-950 px-2 py-0.5 rounded font-bold"
                          >
                            Lu
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Withdrawals Processing Module */}
            <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-amber-400" />
                    <span>Demandes de Retrait des Portefeuilles ({withdrawalRequests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Traitez les virements sortants vers Wave, Orange Money, MTN MoMo et Moov Money
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWithdrawalStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      withdrawalStatusFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Tous ({withdrawalRequests.length})
                  </button>
                  <button
                    onClick={() => setWithdrawalStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      withdrawalStatusFilter === 'pending' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    En Attente ({withdrawalRequests.filter(w => w.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setWithdrawalStatusFilter('approved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      withdrawalStatusFilter === 'approved' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Approuvés
                  </button>
                </div>
              </div>

              {/* Withdrawals Table */}
              <div className="border border-slate-800 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Référence</th>
                      <th className="p-3.5">Bénéficiaire</th>
                      <th className="p-3.5">Opérateur</th>
                      <th className="p-3.5">Numéro Destinataire</th>
                      <th className="p-3.5 text-right">Montant Demandé</th>
                      <th className="p-3.5 text-right">Frais Retrait</th>
                      <th className="p-3.5 text-right">Net à Virer</th>
                      <th className="p-3.5 text-center">Statut</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {withdrawalRequests
                      .filter(w => withdrawalStatusFilter === 'all' || w.status === withdrawalStatusFilter)
                      .map(w => (
                        <tr key={w.id} className="hover:bg-slate-900/40 text-slate-300">
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">{w.referenceNumber}</td>
                          <td className="p-3.5">
                            <strong className="text-white block">{w.userName}</strong>
                            <span className="text-[10px] text-slate-400 uppercase">{w.userRole}</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                              w.paymentMethod === 'Wave' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                              w.paymentMethod === 'Orange Money' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                              'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            }`}>
                              {w.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-white font-bold">{w.destinationPhone}</td>
                          <td className="p-3.5 text-right font-mono font-bold">{w.requestedAmount.toLocaleString('fr-FR')} F</td>
                          <td className="p-3.5 text-right font-mono text-slate-400">{w.feeAmount.toLocaleString('fr-FR')} F</td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">{w.netAmount.toLocaleString('fr-FR')} FCFA</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                              w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              w.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {w.status === 'approved' ? 'Viré' : w.status === 'rejected' ? 'Rejeté' : 'En Attente'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            {w.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => adminApproveWithdrawal(w.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approuver & Virer</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectModalRequest(w);
                                    setRejectionReasonInput('');
                                  }}
                                  className="px-2.5 py-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-500/30 font-bold rounded-xl flex items-center gap-1 transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Rejeter</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-mono">Traité le {w.processedAt ? new Date(w.processedAt).toLocaleDateString('fr-FR') : '14/08'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rejection Prompt Modal */}
            {rejectModalRequest && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                <div className="w-full max-w-md bg-[#0C121E] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Rejeter la demande de retrait</h3>
                      <p className="text-xs text-slate-400">{rejectModalRequest.userName} • {rejectModalRequest.requestedAmount.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Motif du rejet (les fonds seront recrédités sur son portefeuille) :</label>
                    <textarea
                      value={rejectionReasonInput}
                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                      rows={3}
                      placeholder="Ex: Numéro Mobile Money invalide, compte non titulaire..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setRejectModalRequest(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        adminRejectWithdrawal(rejectModalRequest.id, rejectionReasonInput || 'Compte mobile money non conforme');
                        setRejectModalRequest(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl"
                    >
                      Confirmer le Rejet & Recréditer
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: MEMBERS & MODERATION (Annuaire des Membres)   */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'members' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Live Registration and Members Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-3xl bg-[#0C121E] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs uppercase font-bold block">Inscriptions Aujourd'hui</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono-num mt-1 block">+{newRegistrationsTodayCount} nouveaux</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#0C121E] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs uppercase font-bold block">Membres Vérifiés KYC</span>
                  <span className="text-2xl font-black text-blue-400 font-mono-num mt-1 block">
                    {users.filter(u => u.kycStatus === 'verified').length} / {users.length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#0C121E] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs uppercase font-bold block">Comptes Suspendus</span>
                  <span className="text-2xl font-black text-red-400 font-mono-num mt-1 block">
                    {users.filter(u => u.isSuspended).length} comptes
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Members Directory Controls */}
            <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Rechercher par nom, téléphone, email ou commune..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={memberRoleFilter}
                    onChange={(e) => setMemberRoleFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="all">Tous les Rôles ({users.length})</option>
                    <option value="client">Acheteurs & Vendeurs</option>
                    <option value="driver">Livreurs Grand Abidjan</option>
                    <option value="admin">Administrateurs</option>
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-slate-800 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Membre</th>
                      <th className="p-3.5">Rôle</th>
                      <th className="p-3.5">Commune</th>
                      <th className="p-3.5">Statut KYC</th>
                      <th className="p-3.5">Solde Portefeuille</th>
                      <th className="p-3.5">Forfait Pass</th>
                      <th className="p-3.5">Annonces / Fret</th>
                      <th className="p-3.5 text-right">Actions Rapides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredMembers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-900/40 text-slate-300">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
                            <div>
                              <strong className="text-white font-bold block">{u.name}</strong>
                              <span className="text-[11px] text-slate-400 font-mono">{u.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            u.role === 'driver' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">
                          {u.gpsLocation?.commune || 'Abidjan'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                            u.kycStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                            u.kycStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {u.kycStatus === 'verified' ? '✓ Vérifié' : u.kycStatus === 'pending' ? '⏳ En Attente' : 'Non Vérifié'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-400">
                          {u.walletBalance.toLocaleString('fr-FR')} F
                        </td>
                        <td className="p-3.5">
                          <span className="text-xs uppercase font-bold text-slate-200">
                            {u.role === 'client' ? (u.sellerPlan || 'BASIC') : (u.driverPlan || 'TRIAL')}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {u.productsPublishedCount}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Inspect Member Details */}
                            <button
                              onClick={() => setAdminSelectedMemberForModal(u)}
                              title="Consulter la fiche complète"
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Message member */}
                            <button
                              onClick={() => setAdminMessageModalRecipient(u)}
                              title="Envoyer un message officiel"
                              className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl border border-amber-500/30 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* Suspension toggle */}
                            <button
                              onClick={() => adminToggleUserSuspension(u.id)}
                              title={u.isSuspended ? 'Débloquer' : 'Suspendre'}
                              className={`p-1.5 rounded-xl border transition-colors ${
                                u.isSuspended 
                                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30' 
                                  : 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: KYC VALIDATIONS & ANTI-FRAUDE                 */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'kyc' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-400" />
                    <span>Dossiers KYC & Détection Anti-Fraude</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Contrôle de l'unicité des pièces (1 pièce = 1 compte) et validation d'identité
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setKycFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      kycFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Tous ({kycRecords.length})
                  </button>
                  <button
                    onClick={() => setKycFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      kycFilter === 'pending' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    En Attente ({kycRecords.filter(k => k.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setKycFilter('verified')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      kycFilter === 'verified' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Validés
                  </button>
                </div>
              </div>

              {/* KYC Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kycRecords
                  .filter(k => kycFilter === 'all' || k.status === kycFilter)
                  .map(k => (
                    <div key={k.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-white">{k.userName}</h4>
                          <p className="text-xs text-slate-400 font-mono">{k.userPhone} • Rôle : {k.userRole.toUpperCase()}</p>
                          <p className="text-xs text-amber-400 font-mono mt-1 font-bold">
                            {k.documentType.toUpperCase()} : {k.documentNumber}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          k.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          k.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {k.status}
                        </span>
                      </div>

                      {/* Documents Preview */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Document d'identité :</span>
                          <img 
                            src={k.documentPhoto} 
                            alt="Pièce CNI" 
                            className="w-full h-32 object-contain bg-slate-950 rounded-xl border border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-all p-1"
                            onClick={() => setSelectedKycDoc(k.documentPhoto)}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Selfie de vérification :</span>
                          <img 
                            src={k.selfiePhoto} 
                            alt="Selfie" 
                            className="w-full h-32 object-contain bg-slate-950 rounded-xl border border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-all p-1"
                            onClick={() => setSelectedKycDoc(k.selfiePhoto)}
                          />
                        </div>
                      </div>

                      {/* Duplicate check indicator */}
                      {k.isDuplicate && (
                        <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>ALERTE ANTI-FRAUDE : Ce numéro de document existe déjà sur un autre compte !</span>
                        </div>
                      )}

                      {/* Actions */}
                      {k.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => adminApproveKYC(k.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Valider & Certifier</span>
                          </button>
                          <button
                            onClick={() => {
                              setKycRejectId(k.id);
                              setKycRejectReason('');
                            }}
                            className="px-3 py-2 bg-red-950/50 hover:bg-red-900/60 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rejeter</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* KYC Reject Modal */}
            {kycRejectId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                <div className="w-full max-w-md bg-[#0C121E] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
                  <h3 className="font-bold text-sm text-white">Motif du rejet du dossier KYC</h3>
                  <textarea
                    value={kycRejectReason}
                    onChange={(e) => setKycRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Ex: Photo illisible, document expiré, selfie non conforme..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setKycRejectId(null)}
                      className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-bold rounded-xl"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        adminRejectKYC(kycRejectId, kycRejectReason || 'Document non conforme');
                        setKycRejectId(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl"
                    >
                      Confirmer le Rejet
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Image Zoom Modal */}
            {selectedKycDoc && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedKycDoc(null)}>
                <div className="max-w-3xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
                  <img src={selectedKycDoc} alt="Zoom Document" className="w-full h-full object-contain rounded-2xl border border-slate-700" />
                  <button
                    onClick={() => setSelectedKycDoc(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white hover:bg-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB: MODÉRATION & APPROBATIONS PRODUITS               */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'product_approvals' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Header & Quick Moderation Filters */}
            <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-white flex items-center gap-2 font-display">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>Modération & Approbation des Produits</span>
                    </h3>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono-num font-black px-2.5 py-0.5 rounded-full">
                      {pendingProductsCount} en attente
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Vérifiez la conformité des photos (max 3), vidéos démo (max 45s) et tarifs avant mise en ligne publique.
                  </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productApprovalSearch}
                      onChange={(e) => setProductApprovalSearch(e.target.value)}
                      placeholder="Rechercher article, vendeur, commune..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => setProductApprovalFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        productApprovalFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setProductApprovalFilter('auction')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        productApprovalFilter === 'auction' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Enchères
                    </button>
                    <button
                      onClick={() => setProductApprovalFilter('shop')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        productApprovalFilter === 'shop' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Boutiques
                    </button>
                  </div>
                </div>
              </div>

              {/* Moderation Guide Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0 font-black">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-amber-300">Option 1 : Approbation Flash Immédiate</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Propulse l'article instantanément en ligne, avec mise en avant immédiate, notification push au vendeur et animation festive de célébration.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-emerald-300">Option 2 : Approbation Standard</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Valide l'article et le publie dans le catalogue régulier avec validation horodatée et confirmation sécurisée.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Pending Products */}
            {filteredPendingProducts.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#0C121E] border border-slate-800 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-base text-white">Toutes les annonces sont modérées !</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Il n'y a aucun produit en attente d'approbation pour les critères sélectionnés. Les nouvelles annonces publiées par les utilisateurs apparaîtront ici automatiquement.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPendingProducts.map((prod) => {
                  const sellerUser = users.find(u => u.id === prod.sellerId);
                  const isShop = prod.listingType === 'shop' || Boolean(prod.shopId);

                  return (
                    <div 
                      key={prod.id}
                      className="p-5 sm:p-6 rounded-3xl bg-[#0C121E] border border-amber-500/30 shadow-xl space-y-4 transition-all hover:border-amber-500/60"
                    >
                      {/* Top status bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider flex items-center gap-1 ${
                            isShop ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isShop ? <Store className="w-3 h-3" /> : <Gavel className="w-3 h-3" />}
                            <span>{isShop ? 'Article Boutique' : 'Enchère Express'}</span>
                          </span>

                          <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {prod.category}
                          </span>

                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span>{prod.commune}</span>
                          </span>
                        </div>

                        <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>En attente de validation admin</span>
                        </span>
                      </div>

                      {/* Main Product Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        
                        {/* Media Section: Photos (Max 3) & Video (Max 45s) */}
                        <div className="lg:col-span-5 space-y-2.5">
                          {/* Main Primary Image */}
                          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video relative group">
                            <img 
                              src={prod.images[0]} 
                              alt={prod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <button
                              type="button"
                              onClick={() => setActiveMediaPreview({ type: 'image', url: prod.images[0], title: `${prod.title} - Photo 1` })}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition-opacity"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Agrandir l'image</span>
                            </button>
                            <span className="absolute top-2 left-2 bg-black/70 text-slate-200 text-[10px] px-2 py-0.5 rounded backdrop-blur">
                              Photo Principale
                            </span>
                          </div>

                          {/* Thumbnails of up to 3 images + Video button */}
                          <div className="flex items-center gap-2">
                            {prod.images.map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveMediaPreview({ type: 'image', url: img, title: `${prod.title} - Photo ${idx + 1}` })}
                                className="w-16 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative group shrink-0"
                              >
                                <img src={img} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover" />
                                <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">
                                  Zoom
                                </span>
                              </button>
                            ))}

                            {/* Product Video badge/trigger */}
                            {prod.videoUrl ? (
                              <button
                                type="button"
                                onClick={() => setActiveMediaPreview({ 
                                  type: 'video', 
                                  url: prod.videoUrl!, 
                                  title: `Démonstration Vidéo : ${prod.title}`,
                                  duration: prod.videoDurationSeconds || 30
                                })}
                                className="flex-1 h-12 rounded-xl border border-purple-500/50 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                              >
                                <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                                <span className="truncate">Vidéo Démo ({prod.videoDurationSeconds || '≤45'}s)</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic px-2">
                                Aucune vidéo jointe
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Information & Seller Specs */}
                        <div className="lg:col-span-7 space-y-3">
                          <div>
                            <h4 className="font-extrabold text-base sm:text-lg text-white font-display">
                              {prod.title}
                            </h4>
                            <p className="text-xs text-slate-300 bg-slate-900/70 p-3 rounded-2xl border border-slate-800/80 mt-2 leading-relaxed">
                              {prod.description}
                            </p>
                          </div>

                          {/* Prices & Logistics Summary */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">
                                {isShop ? 'Prix Boutique Garanti :' : 'Prix de Départ :'}
                              </span>
                              <strong className="text-sm font-mono-num text-emerald-400 font-extrabold">
                                {(prod.buyNowPrice || prod.startingPrice).toLocaleString('fr-FR')} FCFA
                              </strong>
                            </div>

                            {!isShop && (
                              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Prix de Réserve :</span>
                                <strong className="text-sm font-mono-num text-amber-400 font-extrabold">
                                  {prod.reservePrice.toLocaleString('fr-FR')} FCFA
                                </strong>
                              </div>
                            )}

                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Véhicule Requis :</span>
                              <strong className="text-xs text-slate-200 uppercase font-bold">
                                {prod.requiredVehicle === 'cargo' ? '🚚 Fourgon / Cargo' : '🏍️ Moto Express'}
                              </strong>
                            </div>
                          </div>

                          {/* Seller Profile Summary */}
                          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                                {prod.sellerName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{prod.sellerName}</span>
                                  {sellerUser?.kycStatus === 'verified' && (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-black">
                                      KYC VÉRIFIÉ
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {sellerUser?.phone || prod.pickupAddress} • Plan {sellerUser?.sellerPlan?.toUpperCase() || 'BASIC'}
                                </span>
                              </div>
                            </div>

                            {sellerUser && (
                              <button
                                onClick={() => setAdminSelectedMemberForModal(sellerUser)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition-colors"
                              >
                                Fiche Vendeur
                              </button>
                            )}
                          </div>

                          {/* Actions: Flash Approval, Standard Approval, Reject */}
                          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                            
                            {/* Reject Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductForReject(prod.id);
                                setProductRejectReasonInput('');
                              }}
                              className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Rejeter</span>
                            </button>

                            {/* Standard Approval Button */}
                            <button
                              type="button"
                              onClick={() => adminApproveProduct(prod.id, 'standard')}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approbation Standard</span>
                            </button>

                            {/* Flash / Fast Approval Button */}
                            <button
                              type="button"
                              onClick={() => adminApproveProduct(prod.id, 'flash')}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xl shadow-amber-500/25 transition-all animate-pulse"
                            >
                              <Zap className="w-4 h-4 fill-slate-950" />
                              <span>⚡ Approbation Flash Immédiate</span>
                            </button>

                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product Reject Modal */}
            {selectedProductForReject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
                <div className="w-full max-w-md bg-[#0C121E] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Motif de refus de publication de l'annonce</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Sélectionnez un motif standard ou personnalisez l'explication qui sera notifiée au vendeur :
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Photos de mauvaise qualité ou floues',
                      'Article suspect ou contrefaçon présumée',
                      'Prix anormalement bas ou non conforme',
                      'Vidéo non conforme (>45s ou inappropriée)',
                      'Description incomplète ou non conforme'
                    ].map((reason, rIdx) => (
                      <button
                        key={rIdx}
                        type="button"
                        onClick={() => setProductRejectReasonInput(reason)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500 transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={productRejectReasonInput}
                    onChange={(e) => setProductRejectReasonInput(e.target.value)}
                    rows={3}
                    placeholder="Précisez la raison détaillée du rejet..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
                    required
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setSelectedProductForReject(null)}
                      className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-bold rounded-xl"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        adminRejectProduct(selectedProductForReject, productRejectReasonInput || 'Annonce non conforme aux règles Brad\'CI');
                        setSelectedProductForReject(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl"
                    >
                      Confirmer le Refus
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Media Zoom / Player Modal */}
            {activeMediaPreview && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
                onClick={() => setActiveMediaPreview(null)}
              >
                <div 
                  className="max-w-3xl w-full max-h-[88vh] bg-[#0C121E] border border-slate-700 rounded-3xl p-4 relative flex flex-col space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-2">
                    <h4 className="font-bold text-sm text-white truncate">
                      {activeMediaPreview.title}
                    </h4>
                    <button
                      onClick={() => setActiveMediaPreview(null)}
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center max-h-[70vh]">
                    {activeMediaPreview.type === 'video' ? (
                      <video 
                        src={activeMediaPreview.url} 
                        controls 
                        autoPlay 
                        className="w-full h-full max-h-[70vh] object-contain"
                      />
                    ) : (
                      <img 
                        src={activeMediaPreview.url} 
                        alt="Zoom" 
                        className="w-full h-full max-h-[70vh] object-contain"
                      />
                    )}
                  </div>

                  {activeMediaPreview.duration && (
                    <div className="text-center text-xs text-purple-300">
                      Durée enregistrée : <strong>{activeMediaPreview.duration}s</strong> (Respecte la limite de 45 secondes)
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: OPERATIONS & RADAR GPS (Contrôle Opérationnel)*/}
        {/* ---------------------------------------------------- */}
        {adminTab === 'operations_gps' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <span>Radar Opérationnel & Supervision des Courses Grand Abidjan</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Suivi GPS en temps réel, attribution des livreurs et arbitrage des incidents
                  </p>
                </div>

                {/* Commune Radar Filter */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <select
                    value={selectedCommuneRadar}
                    onChange={(e) => setSelectedCommuneRadar(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="all">Toutes Communes Abidjan</option>
                    {ALL_COMMUNES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Missions Table */}
              <div className="border border-slate-800 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Mission</th>
                      <th className="p-3.5">Article</th>
                      <th className="p-3.5">Trajet Communes</th>
                      <th className="p-3.5">Livreur Assigné</th>
                      <th className="p-3.5 text-right">Frais Fret</th>
                      <th className="p-3.5 text-center">Statut</th>
                      <th className="p-3.5 text-right">Contrôle Opérateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {freightJobs
                      .filter(j => selectedCommuneRadar === 'all' || j.pickupCommune === selectedCommuneRadar || j.dropoffCommune === selectedCommuneRadar)
                      .map(job => (
                        <tr key={job.id} className="hover:bg-slate-900/40 text-slate-300">
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">{job.id}</td>
                          <td className="p-3.5">
                            <strong className="text-white block">{job.productTitle}</strong>
                            <span className="text-[10px] text-slate-400">Vendeur : {job.sellerName}</span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                              <span className="text-amber-400">{job.pickupCommune}</span>
                              <span>→</span>
                              <span className="text-emerald-400">{job.dropoffCommune}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{job.distanceKm || 0} km • ETA : {job.etaMinutes || job.driverEstimatedDurationMinutes || 25} min</span>
                          </td>
                          <td className="p-3.5">
                            {job.assignedDriverName ? (
                              <div>
                                <strong className="text-white block">{job.assignedDriverName}</strong>
                                <span className="text-[10px] text-slate-400 font-mono">{job.assignedDriverPhone}</span>
                              </div>
                            ) : (
                              <span className="text-amber-400 font-bold text-xs">Non Assigné (En bourse)</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-white">
                            {job.deliveryFee.toLocaleString('fr-FR')} F
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                              job.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                              job.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                              job.status === 'accepted' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {job.status === 'in_transit' ? 'En Cours de Route' : job.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Reassign Driver */}
                              <button
                                onClick={() => {
                                  setSelectedJobForReassign(job.id);
                                  setSelectedNewDriverId('');
                                }}
                                title="Réassigner un autre livreur"
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-colors"
                              >
                                Réassigner
                              </button>

                              {/* Cancel / Arbitrate */}
                              {job.status !== 'delivered' && job.status !== 'cancelled' && (
                                <button
                                  onClick={() => adminCancelDeliveryJob(job.id, 'Arbitrage administratif')}
                                  title="Annuler et sécuriser les fonds"
                                  className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 transition-colors"
                                >
                                  Annuler
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reassign Driver Modal */}
            {selectedJobForReassign && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                <div className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
                  <h3 className="font-bold text-sm text-white">Réassigner un Livreur pour la course {selectedJobForReassign}</h3>
                  <p className="text-xs text-slate-400">Sélectionnez un livreur certifié disponible dans le Grand Abidjan :</p>
                  
                  <select
                    value={selectedNewDriverId}
                    onChange={(e) => setSelectedNewDriverId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="">-- Choisir un Livreur --</option>
                    {users.filter(u => u.role === 'driver').map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.phone}) • {d.gpsLocation?.commune || 'Abidjan'}</option>
                    ))}
                  </select>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setSelectedJobForReassign(null)}
                      className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-bold rounded-xl"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        if (selectedNewDriverId) {
                          adminReassignDriver(selectedJobForReassign, selectedNewDriverId);
                          setSelectedJobForReassign(null);
                        }
                      }}
                      disabled={!selectedNewDriverId}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl"
                    >
                      Confirmer la Réattribution
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 6: SETTINGS & MAINTENANCE SWITCH                 */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Global Maintenance Switch Card */}
            <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Power className="w-5 h-5 text-amber-400" />
                    <span>Mode Maintenance Général du Site (ON / OFF)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Activer pour bloquer temporairement l'accès aux visiteurs publics lors de mises à niveau des séquestres.
                  </p>
                </div>

                <button
                  onClick={() => toggleMaintenanceMode(!isMaintenanceMode, noticeDraft)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 border transition-all ${
                    isMaintenanceMode 
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20' 
                      : 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{isMaintenanceMode ? 'MAINTENANCE ACTIVÉE' : 'SITE EN LIGNE (OUVERT)'}</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Message d'avertissement affiché aux utilisateurs pendant la maintenance :
                </label>
                <textarea
                  value={noticeDraft}
                  onChange={(e) => setNoticeDraft(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => toggleMaintenanceMode(isMaintenanceMode, noticeDraft)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  Sauvegarder le message
                </button>
              </div>
            </div>

            {/* Platform Rates & Safety Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white">Barème des Commissions BRAD'CI</h3>
                <div className="space-y-2 text-xs text-slate-300 pt-1">
                  <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl">
                    <span>Pass Gratuit (0 FCFA) :</span>
                    <strong className="text-amber-400 font-mono">5.0% par vente</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl">
                    <span>Pass Pro (2 500 FCFA/30j) :</span>
                    <strong className="text-blue-400 font-mono">2.5% par vente</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl">
                    <span>Pass Gold VIP (5 000 FCFA/30j) :</span>
                    <strong className="text-emerald-400 font-mono">1.5% par vente</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl">
                    <span>Recharge 24h Chrono (Livraison Express) :</span>
                    <strong className="text-purple-400 font-mono">2 000 FCFA (0% comm.)</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl">
                    <span>Pass Mensuel (Commandes BRAD'CI 30j) :</span>
                    <strong className="text-indigo-400 font-mono">5 000 FCFA (0% comm.)</strong>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white">Ligne d'Urgence Séquestre & Alertes</h3>
                <div className="space-y-2 text-xs text-slate-300 pt-1">
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Numéro Réception Alertes SMS/WhatsApp :</span>
                    <strong className="text-white font-mono text-sm">+225 07 89 96 15 80</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Direction Sécurité & Litiges :</span>
                    <strong className="text-white font-mono text-sm">securite.admin@bradci.com</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Standard Téléphonique Fixe Abidjan :</span>
                    <strong className="text-white font-mono text-sm">+225 27 22 44 88 00</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB: SUPPORT CLIENT & REQUÊTES / APPELS             */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'support_tickets' && (
          <div className="space-y-6">
            
            {/* Header info & filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0C121E] p-6 rounded-3xl border border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{translate("Gestion des Requêtes & Appels Clients", "Customer Tickets & Support Calls")}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {supportTickets.length} au total
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      {translate("Résolution des problèmes signalés par les clients (blocages vente, erreurs de frappe, KYC en attente) et déclenchement d'appels après accord administrateur.", "Resolution of issues reported by customers (blocked sales, typing errors, pending KYC) and authorization of support calls.")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status filter pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder={translate("Rechercher client, tél, motif...", "Search user, phone, issue...")}
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 w-48 sm:w-60"
                  />
                </div>

                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setTicketStatusFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      ticketStatusFilter === 'all' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tous ({supportTickets.length})
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('pending')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      ticketStatusFilter === 'pending' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    En Attente ({supportTickets.filter(t => t.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('resolved')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      ticketStatusFilter === 'resolved' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Résolus ({supportTickets.filter(t => t.status === 'resolved').length})
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('call_scheduled')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      ticketStatusFilter === 'call_scheduled' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Appels Autorisés ({supportTickets.filter(t => t.status === 'call_scheduled').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center bg-[#0C121E] border border-slate-800 rounded-3xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-white font-bold text-sm">Aucune requête client trouvée</h3>
                  <p className="text-slate-400 text-xs mt-1">Toutes les demandes de support sont actuellement traitées ou correspondent à aucun filtre.</p>
                </div>
              ) : (
                filteredTickets.map(tkt => {
                  const isPending = tkt.status === 'pending' || tkt.status === 'in_review';
                  const isResolved = tkt.status === 'resolved';
                  const isCallAuthorized = tkt.callAuthorizedByAdmin || tkt.status === 'call_scheduled';

                  return (
                    <div 
                      key={tkt.id}
                      className={`p-6 rounded-3xl border transition-all ${
                        isPending 
                          ? 'bg-[#0C121E] border-amber-500/40 shadow-lg shadow-amber-500/5' 
                          : isResolved 
                            ? 'bg-slate-900/60 border-slate-800' 
                            : 'bg-[#0C121E] border-sky-500/40'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Ticket Main Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-slate-400 font-bold">
                              #{tkt.id}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : isResolved
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            }`}>
                              {isPending ? 'En attente administrateur' : isResolved ? 'Résolu par Admin' : 'Appel Autorisé & En Cours'}
                            </span>

                            <span className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                              Type : {tkt.problemCategoryLabel}
                            </span>

                            <span className="text-[11px] text-slate-400">
                              Conseillère assignée : <strong className="text-slate-200">{tkt.advisorName}</strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="text-base font-bold text-white">{tkt.userName}</h3>
                            <a href={`tel:${tkt.userPhone}`} className="text-xs text-amber-400 hover:underline font-mono">
                              {tkt.userPhone}
                            </a>
                            {tkt.userEmail && (
                              <span className="text-xs text-slate-400 font-mono">
                                ({tkt.userEmail})
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 ml-auto">
                              Créé le {new Date(tkt.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'fr-FR')}
                            </span>
                          </div>

                          {/* Message Content */}
                          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                            <strong className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Message du Client / Signalement :</strong>
                            "{tkt.clientMessage}"
                          </div>

                          {/* Reassurance badge */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Client rassuré automatiquement (recontacte prévu par mail ou appel)</span>
                            </span>
                            {tkt.adminResolutionNotes && (
                              <span className="text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                                <strong>Note Résolution Admin :</strong> {tkt.adminResolutionNotes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-56">
                          {/* 1. Resolve Ticket Button */}
                          <button
                            onClick={() => {
                              setSelectedTicketForResolve(tkt.id);
                              setResolutionNotesInput(tkt.adminResolutionNotes || 'Problème résolu après vérification technique. Paramètres corrigés avec succès.');
                            }}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isResolved 
                                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>{isResolved ? "Modifier Résolution" : "Résoudre le Problème"}</span>
                          </button>

                          {/* 2. Authorize Call with Client */}
                          <button
                            onClick={() => {
                              adminAuthorizeSupportCall(tkt.id);
                            }}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isCallAuthorized
                                ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                            }`}
                          >
                            <Phone className="w-4 h-4" />
                            <span>{isCallAuthorized ? "Appel Déjà Déclenché" : "Autoriser & Lancer Appel"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal for Resolution Notes */}
            {selectedTicketForResolve && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0C121E] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Résolution du Dossier Client</span>
                    </h3>
                    <button 
                      onClick={() => setSelectedTicketForResolve(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Indiquez la solution appliquée (ex: déblocage d'enchère validé, correction de numéro de téléphone effectuée, pièce KYC acceptée manuellement). Le client recevra une notification confirmant la régularisation.
                  </p>

                  <textarea
                    value={resolutionNotesInput}
                    onChange={(e) => setResolutionNotesInput(e.target.value)}
                    rows={4}
                    placeholder="Ex: Erreur de frappe rectifiée dans la base de données. Montant ajusté à 15 000 FCFA. Validation du dossier effectuée avec succès."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setSelectedTicketForResolve(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        if (selectedTicketForResolve) {
                          adminResolveSupportTicket(selectedTicketForResolve, resolutionNotesInput);
                          setSelectedTicketForResolve(null);
                        }
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmer la Résolution</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB: ENREGISTREMENTS CONVERSATIONS & APPELS (AUDIO)  */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'recordings_archive' && (
          <AdminCallChatArchiveView />
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB: ENQUÊTES VOL, ANTIVOL & ACCÈS DIRECT COMPTES    */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'theft_investigations' && (
          <AdminUserInvestigationView />
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 7: ACTIVITÉ, IP & GÉOLOCALISATION               */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'audit_activity_ip' && (
          <AdminActivityAuditView />
        )}

      </main>

    </div>
  );
};
