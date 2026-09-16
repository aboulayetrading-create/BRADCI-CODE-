import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Package, 
  ShoppingBag, 
  ShieldCheck, 
  ShieldAlert, 
  PlusCircle, 
  Sparkles, 
  KeyRound, 
  Navigation, 
  AlertTriangle, 
  Crown, 
  Clock, 
  CheckCircle2, 
  Bike, 
  Upload, 
  Camera, 
  Gavel,
  Lock,
  ArrowRight,
  MapPin,
  Store,
  Share2,
  ExternalLink,
  Eye,
  Check,
  Phone,
  MessageCircle,
  Truck,
  Building2,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  CreditCard,
  RotateCcw,
  XCircle,
  Undo2,
  FileText,
  Receipt,
  Gift,
  Settings,
  Sun,
  Moon,
  Laptop,
  Globe,
  Coins,
  Volume2,
  VolumeX,
  Mic,
  Bell,
  LogOut,
  Radio,
  Smartphone,
  Zap
} from 'lucide-react';
import { Product, ShopProfile, PaymentMethod, DeliveryJob } from '../types';
import { ReferralDashboard } from './ReferralDashboard';
import { SellerProSummaryView } from './SellerProSummaryView';
import { nativeBridge } from '../utils/nativeBridge';
import { KYC_DRAWING_DATA_URIS } from './KYCIllustrations';
import { voiceNavigator } from '../utils/voiceNavigator';

export const ClientDashboard: React.FC = () => {
  const { 
    currentUser, 
    products, 
    freightJobs, 
    escrowRecords,
    reviews,
    userLocation,
    gpsPermissionStatus,
    setGpsModalOpen,
    setNewProductModalOpen, 
    checkKycVerifiedOrPrompt,
    setPricingModalOpen,
    setTargetPlanForPricing,
    setFiveBiddersModalProduct,
    setGpsTrackingJob,
    selectedShopForView,
    setSelectedShopForView,
    updateShopProfile,
    getShopBySellerId,
    boostProduct,
    submitKYC,
    canUserPublishProduct,
    requestUserWithdrawal,
    getSellerBlockedBalance,
    getBuyerBlockedBalance,
    buyerCancelAndReturnPackage,
    sellerConfirmReturnReceived,
    withdrawalRequests,
    financialTransactions,
    openOfficialReceipt,
    setActiveTab,
    setExpressCourierModalOpen,
    setKycModalOpen,
    setProfileAvatarModalOpen,
    addToast,
    translate,
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    language,
    setLanguage,
    currency,
    setCurrency,
    voiceEnabled,
    toggleVoice,
    readCurrentScreenAloud,
    logout,
    requestGpsPermission,
    browserNotificationsEnabled,
    requestBrowserNotificationPermission
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'pro_summary' | 'sales' | 'expeditions' | 'shop' | 'purchases' | 'transactions' | 'kyc' | 'referral' | 'settings'>('sales');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'withdrawals' | 'sales' | 'purchases' | 'subscriptions'>('all');

  // Notification Preferences State
  const [notifAuctions, setNotifAuctions] = useState(() => localStorage.getItem('bradci_notif_auctions') !== 'false');
  const [notifDeliveries, setNotifDeliveries] = useState(() => localStorage.getItem('bradci_notif_deliveries') !== 'false');
  const [notifPayments, setNotifPayments] = useState(() => localStorage.getItem('bradci_notif_payments') !== 'false');
  const [notifPromos, setNotifPromos] = useState(() => localStorage.getItem('bradci_notif_promos') !== 'false');

  useEffect(() => {
    const handleOpenSubTab = (e: any) => {
      if (e?.detail) {
        setActiveSubTab(e.detail);
      }
    };
    window.addEventListener('bradci_open_subtab', handleOpenSubTab);
    return () => window.removeEventListener('bradci_open_subtab', handleOpenSubTab);
  }, []);

  // Withdrawal state
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>('Wave');
  const [withdrawPhone, setWithdrawPhone] = useState(currentUser?.phone || '+225 07 00 00 00 00');

  // Buyer Return Prompt State
  const [buyerCancelModalOpen, setBuyerCancelModalOpen] = useState(false);
  const [cancelJobId, setCancelJobId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Produit non conforme à la description');


  // Shop Edit State
  const initialShop = currentUser?.shop || {
    id: 'shop-' + (currentUser?.id || 'default'),
    sellerId: currentUser?.id || '',
    name: `Boutique ${currentUser?.name || ''}`,
    slogan: 'Vente & Enchères Express certifiées à Abidjan',
    description: 'Articles certifiés avec Paiement Direct à la Livraison (Wave, Orange Money, MTN MoMo, MoVo, Carte Bancaire) et garantie conformité.',
    logo: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    commune: userLocation?.commune || currentUser?.gpsLocation?.commune || 'Cocody',
    district: 'Riviera 2',
    address: userLocation?.address || currentUser?.gpsLocation?.address || 'Cocody Riviera 2, Carrefour Sainte Famille, Abidjan',
    phone: currentUser?.phone || '+225 07 00 00 00 00',
    whatsapp: (currentUser?.phone || '+225 07 00 00 00 00').replace(/[^0-9+]/g, ''),
    category: 'High-Tech & Mode',
    verifiedBadge: currentUser?.sellerPlan === 'pro' || currentUser?.isVIP || false,
    tier: currentUser?.sellerPlan === 'pro' ? 'pro' : 'standard',
    viewsCount: 240,
    salesCount: 8,
    rating: currentUser?.rating || 4.9,
    openingHours: 'Lun - Sam : 08h30 - 19h00'
  };

  const [shopForm, setShopForm] = useState<Partial<ShopProfile>>(initialShop);
  const [copiedShopLink, setCopiedShopLink] = useState(false);

  // KYC Form state
  const [docType, setDocType] = useState<'cni' | 'passeport' | 'attestation'>('cni');
  const [docNumber, setDocNumber] = useState(currentUser?.kycDocumentNumber || '');
  const [docPhoto, setDocPhoto] = useState(KYC_DRAWING_DATA_URIS.cni);
  const [selfiePhoto, setSelfiePhoto] = useState(currentUser?.avatar || KYC_DRAWING_DATA_URIS.selfie);
  const [kycFeedback, setKycFeedback] = useState<{ isDuplicate?: boolean; message?: string } | null>(null);

  // Native Mobile Photo Captures (Logo & Banner)
  const handleCaptureLogo = async (source: 'camera' | 'photos') => {
    try {
      const res = await nativeBridge.capturePhoto({
        source,
        direction: 'user',
        quality: 90
      });
      if (res?.dataUrl) {
        setShopForm(prev => ({ ...prev, logo: res.dataUrl }));
        addToast(translate('Logo mis à jour', 'Logo updated'), '', 'success');
      }
    } catch (e: any) {
      console.warn('Capture logo cancelled or failed:', e?.message);
    }
  };

  const handleCaptureBanner = async (source: 'camera' | 'photos') => {
    try {
      const res = await nativeBridge.capturePhoto({
        source,
        direction: 'environment',
        quality: 85
      });
      if (res?.dataUrl) {
        setShopForm(prev => ({ ...prev, banner: res.dataUrl }));
        addToast(translate('Bannière mise à jour', 'Banner updated'), '', 'success');
      }
    } catch (e: any) {
      console.warn('Capture banner cancelled or failed:', e?.message);
    }
  };

  if (!currentUser || currentUser.role !== 'client') {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-slate-900/60 rounded-3xl border border-red-500/30">
        <Lock className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Accès Restreint par Rôle (RBAC)</h3>
        <p className="text-xs text-slate-300 mt-2">
          Cet espace est strictement réservé aux comptes Acheteurs & Vendeurs.
        </p>
      </div>
    );
  }

  const quota = canUserPublishProduct(currentUser);
  const mySales = products.filter(p => p.sellerId === currentUser.id);
  const myPurchases = products.filter(p => 
    p.winnerId === currentUser.id || 
    p.bids.some(b => b.bidderId === currentUser.id) ||
    freightJobs.some(j => j.productId === p.id && (j.buyerName === currentUser.name || j.buyerPhone === currentUser.phone))
  );
  // Ensure buyer has purchase items visible to test and access official receipts easily:
  const activePurchases = myPurchases.length > 0 
    ? myPurchases 
    : products.slice(0, 2);

  const sellerBlocked = getSellerBlockedBalance(currentUser.id);
  const buyerBlocked = getBuyerBlockedBalance(currentUser.id);

  // Seller Expeditions: products currently in transit, pending driver, or delivered
  const myExpeditions = freightJobs.filter(j => {
    const prod = products.find(p => p.id === j.productId);
    return prod?.sellerId === currentUser.id || j.sellerName === currentUser.name;
  });

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopProfile(shopForm);
  };

  const handleShareShopLink = () => {
    const slug = (shopForm.name || currentUser.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url = `https://bradci.ci/boutique/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedShopLink(true);
    addToast('Lien de votre boutique copié !', url, 'success');
    setTimeout(() => setCopiedShopLink(false), 2500);
  };

  const handleKYCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitKYC(docType, docNumber, docPhoto, selfiePhoto);
    setKycFeedback({ isDuplicate: res.isDuplicate, message: res.message });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Professional Executive Profile & Operational Hub */}
      <div className="rounded-3xl bg-[#0B111E] border border-slate-800/90 shadow-2xl p-5 sm:p-7 space-y-6">
        {/* Top Profile Header Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setProfileAvatarModalOpen(true)}
              className="relative group cursor-pointer shrink-0"
              title={translate("Modifier ma photo de profil", "Change profile photo")}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-amber-500/50 shadow-xl group-hover:opacity-85 transition-opacity"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setProfileAvatarModalOpen(true); }}
                className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-slate-950 transition-all hover:scale-110"
                title={translate("Changer la photo", "Change photo")}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              {currentUser.isVIP && (
                <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-1 rounded-full shadow">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight">{currentUser.name}</h2>
                <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                  currentUser.sellerPlan === 'pro'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : currentUser.sellerPlan === 'standard'
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                }`}>
                  {currentUser.sellerPlan === 'pro' ? '👑 Pass Gold VIP (1.5% comm.)' :
                   currentUser.sellerPlan === 'standard' ? '✨ Pass Pro (2.5% comm.)' : '🌱 Pass Gratuit (5.0% comm.)'}
                </span>

                {currentUser.kycStatus === 'verified' ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setActiveSubTab('kyc');
                      setKycModalOpen(true);
                    }}
                    id="profile-header-kyc-verified-badge" 
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{translate("Vérifié KYC", "KYC Verified")}</span>
                  </button>
                ) : currentUser.kycStatus === 'pending' ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setActiveSubTab('kyc');
                      setKycModalOpen(true);
                    }}
                    id="profile-header-kyc-pending-badge" 
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs hover:bg-amber-500/25 cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>{translate("KYC en cours de vérification", "KYC under verification")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('kyc');
                      setKycModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:text-amber-400 hover:border-amber-500/50 cursor-pointer transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>{translate("Vérifier KYC", "Verify KYC")}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span>{currentUser.email}</span>
                <span>•</span>
                <span>{currentUser.phone}</span>
                <span>•</span>
                <button
                  onClick={() => setGpsModalOpen(true)}
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{userLocation?.commune || currentUser.gpsLocation?.commune || 'Abidjan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Header CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => {
                if (!checkKycVerifiedOrPrompt('sell')) return;
                setNewProductModalOpen(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{translate("Publier un Article", "Post Item")}</span>
            </button>

            {/* Quick Button: Commande Coursier Express */}
            <button
              id="btn-open-express-courier-cta"
              onClick={() => setActiveTab('express_courier')}
              className="px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Accéder au portail Coursier Express (Envoi de colis immédiat d'un point A à un point B avec calcul de prix)"
            >
              <Bike className="w-4 h-4 text-amber-300" />
              <span>{translate("Coursier Express", "Express Courier")}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                A ➔ B
              </span>
            </button>

            {currentUser.sellerPlan !== 'pro' && (
              <button
                onClick={() => {
                  setTargetPlanForPricing(currentUser.sellerPlan === 'standard' ? 'pro' : 'standard');
                  setPricingModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>{translate("Changer de Pass", "Upgrade Pass")}</span>
              </button>
            )}

            <button
              onClick={() => setGpsModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              title={translate("Modifier ma zone GPS", "Change GPS zone")}
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{translate("Zone GPS", "GPS Zone")}</span>
            </button>
          </div>
        </div>

        {/* 2. Professional Streamlined Tab Switcher (Directly below Profile Photo & Header) */}
        <nav 
          id="client-dashboard-nav-bar"
          aria-label="Navigation Espace Personnel"
          className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1.5 shadow-xl"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              id="subtab-btn-pro-summary"
              onClick={() => setActiveSubTab('pro_summary')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ${
                activeSubTab === 'pro_summary'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-amber-300/90 hover:text-white hover:bg-slate-800/70 border border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <Crown className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{translate("Synthèse Pro", "Pro Summary")}</span>
              <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-black ${
                activeSubTab === 'pro_summary' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                PRO
              </span>
            </button>

            <button
              id="subtab-btn-sales"
              onClick={() => setActiveSubTab('sales')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ${
                activeSubTab === 'sales'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>{translate("Mes Ventes", "My Sales")}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-num font-black ${
                activeSubTab === 'sales' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                {mySales.length}
              </span>
            </button>

            <button
              id="subtab-btn-expeditions"
              onClick={() => setActiveSubTab('expeditions')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ${
                activeSubTab === 'expeditions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span>{translate("Expéditions", "Shipments")}</span>
              {myExpeditions.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-num font-black ${
                  activeSubTab === 'expeditions' ? 'bg-white/20 text-white' : 'bg-blue-900/40 text-blue-300'
                }`}>
                  {myExpeditions.length}
                </span>
              )}
            </button>

            <button
              id="subtab-btn-shop"
              onClick={() => setActiveSubTab('shop')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ${
                activeSubTab === 'shop'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>{translate("Ma Boutique", "My Storefront")}</span>
            </button>

            <button
              id="subtab-btn-purchases"
              onClick={() => setActiveSubTab('purchases')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ${
                activeSubTab === 'purchases'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>{translate("Mes Achats & Reçus", "My Purchases & Receipts")}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-num font-black ${
                activeSubTab === 'purchases' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {activePurchases.length}
              </span>
            </button>

            <button
              id="subtab-btn-transactions"
              onClick={() => setActiveSubTab('transactions')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ${
                activeSubTab === 'transactions'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span>{translate("Finances & Retraits", "Finances & Payouts")}</span>
            </button>

            <button
              id="subtab-btn-kyc"
              onClick={() => setActiveSubTab('kyc')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ${
                activeSubTab === 'kyc'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{translate("Sécurité KYC", "KYC Safety")}</span>
              {currentUser.kycStatus === 'verified' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
              {currentUser.kycStatus === 'pending' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              id="subtab-btn-referral"
              onClick={() => setActiveSubTab('referral')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ${
                activeSubTab === 'referral'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Gift className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{translate("Parrainage", "Referrals")}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                {currentUser.referralCount || 0}
              </span>
            </button>

            <button
              id="btn-subtab-settings"
              onClick={() => setActiveSubTab('settings')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all ml-auto ${
                activeSubTab === 'settings'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>{translate("Paramètres", "Settings")}</span>
            </button>
          </div>
        </nav>

        {/* 4 Clean Metric & Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Solde Disponible Retrait */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-colors flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{translate("Solde Retrait", "Wallet Balance")}</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono-num">
                {currentUser.walletBalance.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {translate("Paiement Direct Wave / MoMo", "Direct POD Wave / MoMo")}
              </div>
            </div>
            {currentUser.walletBalance > 0 ? (
              <button
                onClick={() => {
                  setWithdrawAmount(currentUser.walletBalance.toString());
                  setWithdrawalModalOpen(true);
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1"
              >
                <span>{translate("Demander un Retrait", "Request Withdrawal")}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
                <span>0 F frais de transfert</span>
              </div>
            )}
          </div>

          {/* KPI 2: Ventes & Catalogue */}
          <div 
            onClick={() => setActiveSubTab('sales')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-colors cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{translate("Mes Ventes", "My Sales")}</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-white font-mono-num">
                {mySales.length} {translate("article(s)", "item(s)")}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {myExpeditions.length > 0 ? `${myExpeditions.length} expédition(s) en cours` : 'Publication illimitée'}
              </div>
            </div>
            <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
              <span>{translate("Gérer les annonces", "Manage listings")}</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* KPI 3: Achats & Commandes */}
          <div 
            onClick={() => setActiveSubTab('purchases')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/30 transition-colors cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{translate("Mes Commandes", "My Purchases")}</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-white font-mono-num">
                {myPurchases.length} {translate("commande(s)", "order(s)")}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {translate("Garantie POD après inspection", "POD guaranteed after check")}
              </div>
            </div>
            <div className="text-[11px] text-blue-400 font-bold flex items-center gap-1">
              <span>{translate("Suivi des colis", "Track packages")}</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* KPI 4: Zone GPS & Sécurité */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{translate("Zone & Sécurité", "Zone & Safety")}</span>
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="text-sm font-extrabold text-white truncate">
                {userLocation?.commune || currentUser.gpsLocation?.commune || 'Grand Abidjan'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {userLocation?.address || currentUser.gpsLocation?.address || 'Côte d\'Ivoire'}
              </div>
            </div>
            <button
              onClick={() => setGpsModalOpen(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 text-left"
            >
              <span>{translate("Modifier l'adresse", "Change address")}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {withdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0C121E] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Demande de Retrait Mobile Money</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Solde disponible : <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{currentUser.walletBalance.toLocaleString('fr-FR')} FCFA</strong></p>
                </div>
              </div>
              <button
                onClick={() => setWithdrawalModalOpen(false)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const num = Number(withdrawAmount);
                const res = requestUserWithdrawal(num, withdrawMethod, withdrawPhone);
                if (res.success) {
                  setWithdrawalModalOpen(false);
                }
              }}
              className="space-y-4 pt-1"
            >
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Opérateur de Réception :</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Wave', 'Orange Money', 'MTN MoMo'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        withdrawMethod === m
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1.5">
                  <span>⚡ Frais de retrait : 1% sur tous les opérateurs (Wave, Orange Money, MTN MoMo)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Montant à Retirer (FCFA) :</label>
                <input
                  type="number"
                  min={1000}
                  max={currentUser.walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Numéro Mobile Money Récepteur :</label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="+225 07 XX XX XX XX"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Financial Calculation Breakdown with 1% fee */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Montant Brut demandé :</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{Number(withdrawAmount || 0).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
                  <span>Frais de retrait (1%) :</span>
                  <span className="font-mono font-bold">
                    - {Math.max(1, Math.round(Number(withdrawAmount || 0) * 0.01)).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800 font-bold">
                  <span className="text-slate-800 dark:text-slate-200">Net à recevoir sur votre mobile :</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    {(Number(withdrawAmount || 0) - Math.max(1, Math.round(Number(withdrawAmount || 0) * 0.01))).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {translate("Annuler", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {translate(
                    `Confirmer le Retrait (${(Number(withdrawAmount || 0) - Math.max(1, Math.round(Number(withdrawAmount || 0) * 0.01))).toLocaleString('fr-FR')} FCFA Net)`,
                    `Confirm Withdrawal (${(Number(withdrawAmount || 0) - Math.max(1, Math.round(Number(withdrawAmount || 0) * 0.01))).toLocaleString('fr-FR')} FCFA Net)`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buyer Return / Cancellation Dialog */}
      {buyerCancelModalOpen && cancelJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#0C121E] border border-red-500/40 rounded-3xl p-6 shadow-2xl relative text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <Undo2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Refuser & Retourner le Colis</h3>
                  <p className="text-xs text-slate-400">Garantie Conformité Brad'CI Sécurisée</p>
                </div>
              </div>
              <button
                onClick={() => setBuyerCancelModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const ok = buyerCancelAndReturnPackage(cancelJobId, cancelReason);
                if (ok) {
                  setBuyerCancelModalOpen(false);
                  setCancelJobId(null);
                }
              }}
              className="space-y-4 pt-1"
            >
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-red-400">Conséquences de l'annulation :</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                  <li>Le livreur effectuera le retour du colis chez le vendeur.</li>
                  <li>Le montant de l'article vous est immédiatement remboursé sur votre portefeuille Wave.</li>
                  <li>Un Code Secret de Retour sera généré à transmettre au livreur pour valider le retour.</li>
                </ul>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Motif de refus / non-conformité :</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Produit non conforme à la description de l'annonce">Produit non conforme à la description</option>
                  <option value="Article défectueux ou endommagé lors du transport">Article défectueux ou endommagé</option>
                  <option value="Modèle, taille ou couleur erronée">Modèle, taille ou couleur erronée</option>
                  <option value="Article non authentique / contrefaçon suspectée">Article non authentique</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBuyerCancelModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-bold rounded-xl border border-slate-800"
                >
                  Conserver le Colis
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg transition-all"
                >
                  Confirmer le Refus & Retour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 0: VUE SIMPLIFIÉE VENDEUR PRO (ARTICLES VENDUS, REVENUS, ÉVALUATIONS) */}
      {activeSubTab === 'pro_summary' && (
        <SellerProSummaryView
          currentUser={currentUser}
          products={products}
          freightJobs={freightJobs}
          escrowRecords={escrowRecords}
          reviews={reviews}
          financialTransactions={financialTransactions}
          translate={translate}
          onSwitchTab={(tab) => setActiveSubTab(tab)}
          onRequestWithdrawal={() => {
            setWithdrawAmount(currentUser.walletBalance.toString());
            setWithdrawalModalOpen(true);
          }}
          onNewProduct={() => {
            if (!checkKycVerifiedOrPrompt('sell')) return;
            setNewProductModalOpen(true);
          }}
          onOpenShop={() => setActiveSubTab('shop')}
          onOpenReceipt={(job, role) => openOfficialReceipt(job, role)}
        />
      )}

      {/* SUB-TAB 1: MES VENTES */}
      {activeSubTab === 'sales' && (
        <div className="space-y-5">
          {/* Quick Header Bar */}
          <div className="p-4 rounded-2xl bg-[#0B111E] border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{translate("Mes Articles en Vente", "Items for Sale")}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                    {mySales.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {currentUser.sellerPlan === 'pro' ? '👑 Pass Gold VIP • Commission 1.5%' :
                   currentUser.sellerPlan === 'standard' ? '✨ Pass Pro • Commission 2.5%' :
                   '🌱 Pass Gratuit • Vente directe sécurisée POD (5.0%)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveSubTab('pro_summary')}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Consulter la vue simplifiée vendeur pro"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>{translate("Synthèse Pro", "Pro Summary")}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('shop')}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>{translate("Ma Boutique", "My Store")}</span>
              </button>

              <button
                onClick={() => {
                  if (!checkKycVerifiedOrPrompt('sell')) return;
                  setNewProductModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{translate("Publier un Article", "Post Item")}</span>
              </button>
            </div>
          </div>

          {/* Direct Banner: Vue Simplifiée Vendeur Pro */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0B111E] via-slate-900 to-[#0C121E] border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-white">
                    {translate("Vue Simplifiée Vendeur Pro", "Pro Seller Simplified View")}
                  </h4>
                  <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                    Nouveau
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {translate(
                    "Visualisez d'un coup d'œil vos articles vendus, vos revenus cumulés et les évaluations de vos acheteurs.",
                    "Quickly review your sold items, generated revenue, and verified buyer reviews."
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('pro_summary')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
            >
              <span>{translate("Ouvrir la Synthèse Pro", "Open Pro View")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List of Published Products */}
          {mySales.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-bold">Vous n'avez pas encore d'article en vente.</p>
              <p className="text-xs text-slate-500 mt-1">Publiez votre premier article gratuitement (jusqu'à 3 produits offerts).</p>
              <button
                onClick={() => {
                  if (!checkKycVerifiedOrPrompt('sell')) return;
                  setNewProductModalOpen(true);
                }}
                className="mt-4 px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Commencer à vendre
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySales.map((item) => {
                const bidsCount = item.bids.length;
                const isFiveBids = bidsCount >= 5;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#0C121E] border border-slate-800 space-y-4 shadow-lg"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{item.category}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.status === 'pending_choice' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            item.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400' :
                            item.status === 'sold' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {item.status === 'pending_choice' ? '5 Offres - Choix Acheteur' :
                             item.status === 'in_transit' ? 'En livraison' :
                             item.status === 'sold' ? 'Vendu' : 'Enchère Active'}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-white truncate mt-1">{item.title}</h4>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-base font-extrabold text-amber-400 font-mono-num">
                            {item.currentPrice.toLocaleString('fr-FR')} FCFA
                          </span>
                          <span className="text-xs text-slate-400 font-mono font-bold">
                            {bidsCount} offres
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Crucial: Seller Pickup Code (4 digits) */}
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Code d'Enlèvement Vendeur :
                        </span>
                        <p className="text-[10px] text-slate-400">À donner au coursier pour l'enlèvement</p>
                      </div>
                      <span className="text-lg font-black font-mono-num tracking-widest text-amber-400 bg-slate-950 px-3 py-1 rounded-lg border border-amber-500/30">
                        {item.pickupCode}
                      </span>
                    </div>

                    {/* 5 Bidders arbitration button */}
                    {isFiveBids && item.status === 'pending_choice' && (
                      <button
                        onClick={() => setFiveBiddersModalProduct(item)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
                      >
                        <Gavel className="w-4 h-4" />
                        <span>Arbitrer & Valider l'Acheteur Final (5 Enchères)</span>
                      </button>
                    )}

                    {/* Boost button */}
                    {!item.isBoosted && item.status === 'active' && (
                      <button
                        onClick={() => boostProduct(item.id)}
                        className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Booster cette annonce (1 000 FCFA)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SUIVI DES EXPÉDITIONS (NOUVEAU DÉDIÉ POUR VENDEUR) */}
      {activeSubTab === 'expeditions' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-blue-300 text-xs">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">Centre de Suivi des Expéditions Vendeur</p>
                <p className="text-slate-300 mt-0.5">
                  Suivez en direct le déplacement du coursier de votre boutique jusqu'au domicile de l'acheteur.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                id="btn-expeditions-order-courier"
                onClick={() => setActiveTab('express_courier')}
                className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Bike className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ {translate("Coursier Express (Point A ➔ B)", "Express Courier (Point A ➔ B)")}</span>
              </button>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Courses Actives :</span>
                <span className="text-base font-extrabold text-blue-400 font-mono-num">{myExpeditions.length}</span>
              </div>
            </div>
          </div>

          {myExpeditions.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Aucune expédition en cours</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Dès qu'une de vos enchères est remportée et payée sous séquestre, un livreur est affecté et son suivi GPS s'affiche ici.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myExpeditions.map((job) => {
                const prod = products.find(p => p.id === job.productId);
                const isStep1 = job.status === 'pending_driver' || job.status === 'assigned';
                const isStep2 = job.status === 'in_transit';
                const isStep3 = job.status === 'delivered';

                return (
                  <div 
                    key={job.id} 
                    className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-5"
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/30">
                            Course #{job.id}
                          </span>
                          <span className="text-xs font-bold text-white">{job.productTitle}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Acheteur : <strong className="text-white">{job.buyerName}</strong> • Enlèvement : <strong className="text-emerald-400">{job.pickupCommune}</strong> ➔ Livraison : <strong className="text-amber-400">{job.dropoffCommune}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => setGpsTrackingJob(job)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Carte GPS en Direct</span>
                      </button>
                    </div>

                    {/* 3-Step Live Timeline (Seller Requirement) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Step 1: En route vers la boutique */}
                      <div className={`p-3.5 rounded-2xl border transition-all ${
                        isStep1 
                          ? 'bg-blue-500/15 border-blue-400 shadow-lg shadow-blue-500/10' 
                          : isStep2 || isStep3 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-400' 
                          : 'bg-slate-900/30 border-slate-800 text-slate-500'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Étape 1</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            isStep2 || isStep3 ? 'bg-emerald-500 text-slate-950' : 'bg-blue-500 text-white'
                          }`}>
                            {isStep2 || isStep3 ? 'Terminé' : 'En Cours'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white">1. Livreur en route vers votre boutique</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Commune de collecte : {job.pickupCommune}
                        </p>
                      </div>

                      {/* Step 2: Colis récupéré */}
                      <div className={`p-3.5 rounded-2xl border transition-all ${
                        isStep2 
                          ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10' 
                          : isStep3 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-400' 
                          : 'bg-slate-900/30 border-slate-800 text-slate-500'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Étape 2</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            isStep3 ? 'bg-emerald-500 text-slate-950' : isStep2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isStep3 ? 'Terminé' : isStep2 ? 'En Transit' : 'En Attente'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white">2. Colis récupéré & scellé</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          En transit sécurisé par le livreur
                        </p>
                      </div>

                      {/* Step 3: En route vers l'acheteur */}
                      <div className={`p-3.5 rounded-2xl border transition-all ${
                        isStep3 
                          ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10' 
                          : 'bg-slate-900/30 border-slate-800 text-slate-500'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Étape 3</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            isStep3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isStep3 ? 'Livré & Payé' : 'En Approche'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white">3. En route vers l'acheteur</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Validation par Code Secret = Déblocage Wave
                        </p>
                      </div>
                    </div>

                    {/* Driver details + Vehicle Plate & Color + Pickup code */}
                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <Bike className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Livreur : {job.assignedDriverName || 'Bakary Traoré'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{job.assignedDriverPhone || '+225 01 44 77 89 22'}</p>
                          
                          {/* Vehicle identification for Seller */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px]">
                            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-mono font-bold uppercase">
                              Plaque : {job.assignedDriverVehiclePlate || '4523 JJ 01'}
                            </span>
                            <span className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">
                              Couleur : <strong className="text-white">{job.assignedDriverVehicleColor || 'Noir & Rouge'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Code Enlèvement :</span>
                          <span className="text-base font-black font-mono-num text-amber-400 bg-slate-950 px-2.5 py-0.5 rounded border border-amber-500/30">
                            {job.pickupCode}
                          </span>
                        </div>

                        <a
                          href={`tel:${job.assignedDriverPhone || '+2250144778922'}`}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Appeler</span>
                        </a>

                        <button
                          onClick={() => setGpsTrackingJob(job)}
                          className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>GPS</span>
                        </button>

                        <button
                          id={`seller-receipt-btn-${job.id}`}
                          onClick={() => openOfficialReceipt(job, 'seller')}
                          className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          title="Consulter le Bordereau d'Expédition Officiel (Vendeur)"
                        >
                          <Receipt className="w-3.5 h-3.5 text-amber-400" />
                          <span>Bordereau Vendeur</span>
                        </button>
                      </div>
                    </div>

                    {/* Returning status for seller */}
                    {job.status === 'returning' && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                            <RotateCcw className="w-4 h-4 animate-spin" />
                            <span>Colis refusé par l'acheteur • En cours de restitution vers votre boutique</span>
                          </div>
                          <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono">
                            {job.returnReason || 'Non-conforme'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Le livreur vous rapporte le colis. Une fois le colis vérifié et réceptionné, confirmez la restitution :
                        </p>
                        <button
                          onClick={() => sellerConfirmReturnReceived(job.id)}
                          className="w-full py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmer Réception du Colis Retourné & Clôturer</span>
                        </button>
                      </div>
                    )}

                    {job.status === 'returned' && (
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Colis retourné et remis en stock dans votre boutique</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: MA BOUTIQUE BRAD'CI (GESTION & VITRINE) */}
      {activeSubTab === 'shop' && (
        <div className="space-y-6">
          {/* Top Shop Banner & Status */}
          <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30 mb-2">
                <Store className="w-3.5 h-3.5" />
                <span>Vitrine & Profil Boutique BRAD'CI</span>
              </div>
              <h3 className="text-xl font-black text-white font-display">
                {shopForm.name || `Boutique ${currentUser.name}`}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configurez l'apparence de votre boutique pour exposer vos enchères et rassurer les acheteurs ivoiriens.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const shopObj: ShopProfile = {
                    id: 'shop-' + currentUser.id,
                    sellerId: currentUser.id,
                    name: shopForm.name || `Boutique ${currentUser.name}`,
                    slogan: shopForm.slogan || '',
                    description: shopForm.description || '',
                    logo: shopForm.logo || currentUser.avatar,
                    banner: shopForm.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
                    commune: shopForm.commune || userLocation?.commune || 'Cocody',
                    district: shopForm.district || 'Riviera',
                    address: shopForm.address || userLocation?.address || 'Abidjan',
                    phone: shopForm.phone || currentUser.phone,
                    whatsapp: shopForm.whatsapp || currentUser.phone.replace(/[^0-9+]/g, ''),
                    category: shopForm.category || 'Divers',
                    verifiedBadge: currentUser.sellerPlan === 'pro' || currentUser.isVIP || false,
                    tier: currentUser.sellerPlan === 'pro' ? 'pro' : 'standard',
                    viewsCount: 240,
                    salesCount: mySales.filter(s => s.status === 'sold').length + 5,
                    rating: currentUser.rating || 4.9,
                    openingHours: shopForm.openingHours || 'Lun - Sam : 08h30 - 19h00'
                  };
                  setSelectedShopForView(shopObj);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Eye className="w-4 h-4" />
                <span>Voir ma Vitrine Publique</span>
              </button>

              <button
                type="button"
                onClick={handleShareShopLink}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedShopLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Lien Copié !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>Partager ma Boutique</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tier & Plan Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Niveau de Boutique :</span>
                <span className="text-xs font-extrabold text-amber-400 uppercase">
                  {currentUser.sellerPlan === 'pro' ? 'Boutique Officielle Gold VIP (Pass Gold 5 000 F / 30j)' :
                   currentUser.sellerPlan === 'standard' ? 'Boutique Pro Vérifiée (Pass Pro 2 500 F / 30j)' : 'Boutique Standard (Pass Gratuit)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentUser.sellerPlan === 'pro' 
                  ? 'Vous bénéficiez du badge VIP Gold, commission record minimale à 1.5%, visibilité prioritaire et support dédié 7j/7.'
                  : currentUser.sellerPlan === 'standard'
                  ? 'Vous bénéficiez du badge Vendeur Pro vérifié, commission réduite à 2.5% et vitrine personnalisée.'
                  : 'Passez au Pass Pro (2 500 F - 2.5% com.) ou Pass Gold VIP (5 000 F - 1.5% com.) pour maximiser vos marges nettes.'}
              </p>
            </div>

            {currentUser.sellerPlan !== 'pro' && (
              <button
                onClick={() => {
                  setTargetPlanForPricing('pro');
                  setPricingModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shrink-0 hover:scale-105 transition-transform"
              >
                Pass Vendeur Supérieur
              </button>
            )}
          </div>

          {/* Shop Customization Form */}
          <form onSubmit={handleSaveShop} className="bg-[#0C121E] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h4 className="text-base font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Personnaliser ma Vitrine Vendeur</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Shop Name */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Nom commercial de la boutique *
                </label>
                <input
                  type="text"
                  required
                  value={shopForm.name || ''}
                  onChange={e => setShopForm({ ...shopForm, name: e.target.value })}
                  placeholder="Ex: Ivoire Tech Express"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Slogan */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Slogan / Devise
                </label>
                <input
                  type="text"
                  value={shopForm.slogan || ''}
                  onChange={e => setShopForm({ ...shopForm, slogan: e.target.value })}
                  placeholder="Ex: Le meilleur de l'électronique garanti à Abidjan"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Catégorie principale
                </label>
                <select
                  value={shopForm.category || 'High-Tech'}
                  onChange={e => setShopForm({ ...shopForm, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="High-Tech">High-Tech & Smartphones</option>
                  <option value="Mode & Luxe">Mode & Luxe</option>
                  <option value="Électroménager">Électroménager & Maison</option>
                  <option value="Véhicules & Auto">Véhicules & Motos</option>
                  <option value="Divers">Divers & Multi-catégories</option>
                </select>
              </div>

              {/* Hours */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Horaires d'ouverture / Réponse
                </label>
                <input
                  type="text"
                  value={shopForm.openingHours || ''}
                  onChange={e => setShopForm({ ...shopForm, openingHours: e.target.value })}
                  placeholder="Ex: Lun - Sam : 08h30 - 19h00"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Numéro de Téléphone Appel
                </label>
                <input
                  type="text"
                  value={shopForm.phone || ''}
                  onChange={e => setShopForm({ ...shopForm, phone: e.target.value })}
                  placeholder="Ex: +225 07 44 88 99 11"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Numéro WhatsApp Direct
                </label>
                <input
                  type="text"
                  value={shopForm.whatsapp || ''}
                  onChange={e => setShopForm({ ...shopForm, whatsapp: e.target.value })}
                  placeholder="Ex: 2250744889911"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Commune GPS */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Commune GPS à Abidjan *
                </label>
                <select
                  value={shopForm.commune || 'Cocody'}
                  onChange={e => setShopForm({ ...shopForm, commune: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Cocody">Cocody (Riviera, Angré, Deux-Plateaux)</option>
                  <option value="Marcory">Marcory (Zone 4, Biétry)</option>
                  <option value="Plateau">Plateau (Centre des Affaires)</option>
                  <option value="Yopougon">Yopougon (Siporex, Maroc, Bel-Air)</option>
                  <option value="Treichville">Treichville (Arras, Avenue 8)</option>
                  <option value="Koumassi">Koumassi</option>
                  <option value="Port-Bouët">Port-Bouët (Vridi, Aéroport)</option>
                  <option value="Bingerville">Bingerville</option>
                  <option value="Grand-Bassam">Grand-Bassam (Balnéaire)</option>
                  <option value="Assinie">Assinie (Balnéaire)</option>
                </select>
              </div>

              {/* Quartier / Adresse */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Adresse précise d'enlèvement
                </label>
                <input
                  type="text"
                  value={shopForm.address || ''}
                  onChange={e => setShopForm({ ...shopForm, address: e.target.value })}
                  placeholder="Ex: Rue des Jardins, En face de l'Espace Crystal"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Description / Présentation de la Boutique *
              </label>
              <textarea
                rows={3}
                value={shopForm.description || ''}
                onChange={e => setShopForm({ ...shopForm, description: e.target.value })}
                placeholder="Présentez votre activité, vos garanties, vos conditions de test..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Banner & Logo Customization with Camera Capture & File Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Profile Photo / Logo */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>{translate("Photo de Profil / Logo Boutique", "Shop Profile Picture / Logo")}</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Format Carré 1:1</span>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3">
                  <img
                    src={shopForm.logo || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                    alt="Logo preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md bg-slate-950"
                  />
                  <div className="flex-1 space-y-1.5">
                    {/* Action buttons: Camera & Gallery */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCaptureLogo('camera')}
                        className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{translate("Appareil Photo", "Camera")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCaptureLogo('photos')}
                        className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{translate("Importer Galerie", "Choose Gallery")}</span>
                      </button>
                    </div>

                    <input
                      type="url"
                      value={shopForm.logo || ''}
                      onChange={e => setShopForm({ ...shopForm, logo: e.target.value })}
                      placeholder="Ou coller une URL https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Banner */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>{translate("Bannière de Couverture Vitrine", "Storefront Cover Banner")}</span>
                  </label>
                  <span className="text-[10px] text-slate-400">16:9 Panoramique</span>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <div className="h-20 w-full rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                    <img
                      src={shopForm.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80'}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCaptureBanner('camera')}
                      className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{translate("Prendre Photo", "Take Photo")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCaptureBanner('photos')}
                      className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>{translate("Importer Galerie", "Choose Gallery")}</span>
                    </button>

                    <input
                      type="url"
                      value={shopForm.banner || ''}
                      onChange={e => setShopForm({ ...shopForm, banner: e.target.value })}
                      placeholder="Ou coller une URL https://..."
                      className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer les Modifications</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: MES ACHATS & COMMANDES */}
      {activeSubTab === 'purchases' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold text-white">Modèle Paiement Direct à la Livraison (Pay on Delivery)</p>
              <p className="text-slate-300 mt-0.5">
                Aucun débit préalable ni blocage de fonds. Vous payez directement par Mobile Money (Wave, Orange Money, MTN MoMo, Moov) ou Carte lorsque le livreur arrive et que vous avez examiné votre colis.
              </p>
            </div>
          </div>

          {activePurchases.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-bold">Vous n'avez pas encore d'enchère ou commande en cours.</p>
              <p className="text-xs text-slate-500 mt-1">Explorez les annonces et commandez avec le Paiement Direct à la Livraison.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePurchases.map((item) => {
                const job = freightJobs.find(j => j.productId === item.id);

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#0C121E] border border-slate-800 space-y-4 shadow-lg"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                          {item.winnerId === currentUser.id ? 'Enchère Gagnée' : 'Enchère Active'}
                        </span>
                        <h4 className="font-bold text-sm text-white truncate mt-1">{item.title}</h4>
                        <p className="text-xs text-slate-400">Vendeur : {item.sellerName}</p>
                        <p className="text-base font-extrabold text-amber-400 font-mono-num mt-1">
                          {item.currentPrice.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                    </div>

                    {/* Secret Buyer OTP Code (4 Digits) */}
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-amber-400 uppercase font-extrabold flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Votre Code Secret de Remise :</span>
                        </span>
                        <p className="text-[10px] text-slate-300 mt-0.5">À donner au livreur uniquement après déballage</p>
                      </div>
                      <span className="text-xl font-black font-mono-num tracking-widest text-white bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500/40">
                        {item.deliveryOtpCode || '8814'}
                      </span>
                    </div>

                      {/* Driver & Vehicle Information for Buyer */}
                      {job && job.assignedDriverName && (
                        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Bike className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{job.assignedDriverName}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{job.assignedDriverPhone || '+225 01 44 77 89 22'}</p>
                              </div>
                            </div>
                            <a
                              href={`tel:${job.assignedDriverPhone || '+2250144778922'}`}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Appeler</span>
                            </a>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
                            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-mono font-bold uppercase">
                              Matricule : {job.assignedDriverVehiclePlate || '4523 JJ 01'}
                            </span>
                            <span className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">
                              Couleur : <strong className="text-white">{job.assignedDriverVehicleColor || 'Noir & Rouge'}</strong>
                            </span>
                            {job.assignedDriverVehicleModel && (
                              <span className="text-[10px] text-slate-400">
                                ({job.assignedDriverVehicleModel})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Live GPS Tracking & Inspection Guarded Actions */}
                      {job ? (
                        <div className="space-y-2.5">
                          <button
                            onClick={() => setGpsTrackingJob(job)}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                          >
                            <Navigation className="w-4 h-4 animate-pulse" />
                            <span>Suivre mon Colis en Direct (GPS Abidjan)</span>
                          </button>

                          {/* Phase 1: In transit -> Refusal locked until driver arrival */}
                          {job.status === 'in_transit' && (
                            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
                              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                <strong>Annulation bloquée :</strong> L'option de refus ou retour est verrouillée jusqu'à l'arrivée du coursier et la vérification contradictoire du colis sur place.
                              </span>
                            </div>
                          )}

                          {/* Phase 2: Driver Arrived on site */}
                          {job.status === 'arrived' && (
                            <div className="space-y-2 p-3.5 bg-slate-900 border border-amber-500/30 rounded-xl">
                              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                                <ShieldCheck className="w-4 h-4 text-amber-400 animate-spin" />
                                <span>Livreur sur place : Contrôle contradictoire</span>
                              </div>

                              {job.inspectionStatus === 'arrived_inspecting' && (
                                <p className="text-[11px] text-slate-300">
                                  Le livreur est devant votre porte. Ouvrez le colis avec lui pour vérifier l'état du produit.
                                </p>
                              )}

                              {job.inspectionStatus === 'client_confirmed_good' && (
                                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-bold">
                                  ✓ Colis validé conforme ! Donnez votre code secret de remise ({item.deliveryOtpCode || '8814'}) au livreur pour clôturer la commande.
                                </div>
                              )}

                              {job.inspectionStatus === 'client_confirmed_bad' && (
                                <div className="space-y-2">
                                  <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-xs text-red-300 font-bold">
                                    ⚠️ Non-conformité constatée. Vous pouvez maintenant déclencher le retour :
                                  </div>
                                  <button
                                    onClick={() => {
                                      setCancelJobId(job.id);
                                      setBuyerCancelModalOpen(true);
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all animate-pulse"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span>Confirmer le Refus & Déclencher le Retour (Non-conforme)</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            // Fallback sample tracking job
                            const sampleJob: DeliveryJob = {
                              id: 'job-' + item.id,
                              productId: item.id,
                              productTitle: item.title,
                              productImage: item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
                              sellerName: item.sellerName,
                              sellerPhone: '+225 07 44 88 12 34',
                              buyerName: currentUser.name,
                              buyerPhone: currentUser.phone,
                              pickupCommune: item.commune,
                              dropoffCommune: userLocation?.commune || 'Cocody',
                              pickupAddress: item.pickupAddress || item.address || item.commune,
                              pickupCoords: item.pickupCoords || { lat: 5.359952, lng: -4.008256 },
                              dropoffAddress: userLocation?.address || 'Abidjan',
                              dropoffCoords: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: 5.3484, lng: -4.0152 },
                              requiredVehicle: item.requiredVehicle || 'moto',
                              deliveryFee: 1500,
                              itemValue: item.currentPrice || 10000,
                              status: 'in_transit' as const,
                              assignedDriverName: 'Bakary Traoré',
                              assignedDriverPhone: '+225 01 44 77 89 22',
                              pickupCode: item.pickupCode,
                              deliveryOtpCode: item.deliveryOtpCode || '8814',
                              etaMinutes: 14
                            };
                            setGpsTrackingJob(sampleJob);
                          }}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <Navigation className="w-4 h-4 animate-pulse" />
                          <span>Suivre mon Colis en Direct</span>
                        </button>
                      )}

                      {/* Returning status indicator for buyer */}
                      {job?.status === 'returning' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                            <span>Colis en cours de retour vers le vendeur</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Donnez ce <strong>Code Secret de Retour</strong> au livreur pour confirmer la prise en charge du retour :
                          </p>
                          <div className="p-2 bg-slate-950 rounded-lg text-center font-mono-num font-black text-lg text-red-400 border border-red-500/30 tracking-widest">
                            {job.returnOtpCode || '4921'}
                          </div>
                          <p className="text-[10px] text-emerald-400 font-medium">
                            ✓ Valeur article ({item.currentPrice.toLocaleString('fr-FR')} FCFA) remboursée sur votre portefeuille Wave.
                          </p>
                        </div>
                      )}

                      {job?.status === 'returned' && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Colis restitué au vendeur & Achat Remboursé avec succès</span>
                        </div>
                      )}

                      {/* Official Receipt & Cryptographic Audit Seal button */}
                      <div className="pt-1">
                        <button
                          id={`btn-buyer-receipt-${item.id}`}
                          onClick={() => {
                            if (job) {
                              openOfficialReceipt(job, 'buyer');
                            } else {
                              // Fallback minimal job for product
                              const tempJob: DeliveryJob = {
                                id: 'job-' + item.id,
                                productId: item.id,
                                productTitle: item.title,
                                productImage: item.images?.[0] || '',
                                sellerName: item.sellerName,
                                sellerPhone: '+225 07 44 88 12 34',
                                buyerName: currentUser.name,
                                buyerPhone: currentUser.phone,
                                pickupCommune: item.commune,
                                dropoffCommune: userLocation?.commune || 'Marcory',
                                pickupAddress: item.pickupAddress || item.commune,
                                pickupCoords: item.pickupCoords || { lat: 5.359952, lng: -4.008256 },
                                dropoffAddress: userLocation?.address || 'Abidjan',
                                dropoffCoords: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: 5.3484, lng: -4.0152 },
                                requiredVehicle: item.requiredVehicle || 'moto',
                                deliveryFee: 1500,
                                itemValue: item.currentPrice || 10000,
                                status: 'delivered',
                                orderStatus: 'PAID',
                                paymentStatus: 'PAID',
                                pickupCode: item.pickupCode || '5521',
                                deliveryOtpCode: item.deliveryOtpCode || '8814'
                              };
                              openOfficialReceipt(tempJob, 'buyer');
                            }
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Voir mon Reçu d'Achat Officiel (Acheteur)</span>
                        </button>
                      </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: HISTORIQUE DES TRANSACTIONS & RETRAITS */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6">
          {/* Summary Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">
                {translate("Solde Disponible Wave", "Wave Available Balance")}
              </span>
              <div className="text-xl font-black text-amber-400 font-mono-num">
                {currentUser.walletBalance.toLocaleString('fr-FR')} FCFA
              </div>
              <button
                onClick={() => setWithdrawalModalOpen(true)}
                className="mt-3 w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{translate("Demander un Retrait", "Request Withdrawal")}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">
                {translate("Fonds Sous Séquestre (Ventes)", "Escrow Funds (Sales)")}
              </span>
              <div className="text-xl font-black text-blue-400 font-mono-num">
                {sellerBlocked.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                {translate("Débloqué après validation par le Code Secret remis par l'acheteur.", "Released after buyer hands over secret delivery code.")}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">
                {translate("Fonds Bloqués (Achats)", "Locked Funds (Purchases)")}
              </span>
              <div className="text-xl font-black text-emerald-400 font-mono-num">
                {buyerBlocked.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                {translate("Protégé jusqu'à réception conforme de vos commandes.", "Protected until compliant receipt of your orders.")}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setTransactionFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  transactionFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {translate("Toutes les Opérations", "All Operations")}
              </button>
              <button
                onClick={() => setTransactionFilter('withdrawals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  transactionFilter === 'withdrawals'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {translate("Demandes de Retraits", "Withdrawal Requests")}
              </button>
              <button
                onClick={() => setTransactionFilter('sales')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  transactionFilter === 'sales'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {translate("Ventes Débloquées", "Unlocked Sales")}
              </button>
              <button
                onClick={() => setTransactionFilter('purchases')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  transactionFilter === 'purchases'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {translate("Achats Séquestre", "Escrow Purchases")}
              </button>
              <button
                onClick={() => setTransactionFilter('subscriptions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  transactionFilter === 'subscriptions'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {translate("Pass & Abonnements", "Passes & Plans")}
              </button>
            </div>

            <button
              onClick={() => setWithdrawalModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-[1.02] transition-transform"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{translate("Nouveau Retrait", "New Withdrawal")}</span>
            </button>
          </div>

          {/* Withdrawal Requests List */}
          {(transactionFilter === 'all' || transactionFilter === 'withdrawals') && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{translate("Historique des Demandes de Retrait", "Withdrawal Requests History")}</span>
              </h4>

              {withdrawalRequests.filter(r => r.userId === currentUser.id).length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                  {translate("Aucune demande de retrait effectuée pour le moment.", "No withdrawal requests made yet.")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {withdrawalRequests.filter(r => r.userId === currentUser.id).map(req => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-[#0C121E] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          req.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {req.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> :
                           req.status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                           <Clock className="w-5 h-5 animate-spin" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-xs text-white">
                              {translate("Retrait", "Withdrawal")} {req.paymentMethod}
                            </h5>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              req.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                            }`}>
                              {req.status === 'approved' ? translate('✅ Virement Approuvé & Transféré', '✅ Transfer Approved & Paid') :
                               req.status === 'rejected' ? translate('❌ Rejeté & Remboursé', '❌ Rejected & Refunded') :
                               translate('⏳ En attente de validation', '⏳ Pending Admin Approval')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {translate("Vers", "To")} : <span className="text-slate-200 font-mono font-bold">{req.destinationPhone}</span> • Ref : <span className="font-mono">{req.id}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right self-end sm:self-auto">
                        <div className="text-sm font-black text-amber-400 font-mono-num">
                          {req.requestedAmount.toLocaleString('fr-FR')} FCFA
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Net versé : {(req.netPayoutAmount || req.requestedAmount).toLocaleString('fr-FR')} FCFA (Frais : {req.feeAmount} FCFA)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* General Platform Financial Transactions */}
          {transactionFilter !== 'withdrawals' && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>{translate("Transactions & Factures Récents", "Recent Transactions & Invoices")}</span>
              </h4>

              {financialTransactions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                  {translate("Aucune transaction enregistrée.", "No transactions recorded yet.")}
                </div>
              ) : (
                <div className="space-y-2">
                  {financialTransactions.slice(0, 10).map(tx => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-[#0C121E] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.category === 'revenue' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.category === 'payout' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {tx.category === 'revenue' ? <TrendingUp className="w-4 h-4" /> :
                           tx.category === 'payout' ? <CreditCard className="w-4 h-4" /> :
                           <Package className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{tx.description}</p>
                          <span className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleDateString('fr-FR')} • Ref : {tx.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right font-mono-num font-bold">
                          <span className={tx.category === 'payout' ? 'text-amber-400' : 'text-emerald-400'}>
                            {tx.grossAmount.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const matchingJob = freightJobs.find(j => j.productTitle && tx.description.includes(j.productTitle)) || freightJobs[0];
                            if (matchingJob) {
                              openOfficialReceipt(matchingJob, tx.category === 'payout' || tx.category === 'revenue' ? 'seller' : 'buyer');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-[#151C33] hover:bg-[#1E53E5]/20 border border-[#222D4A] hover:border-[#1E53E5]/40 text-blue-400 cursor-pointer transition-all"
                          title="Voir Reçu / Facture PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 6: MON KYC & SÉCURITÉ (ANTI-FRAUDE UNICITÉ) */}
      {activeSubTab === 'kyc' && (
        <div className="max-w-2xl bg-[#0C121E] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{translate("Contrôle Anti-Fraude & Unicité KYC", "Anti-Fraud & KYC Uniqueness Control")}</span>
            </div>
            <h3 className="text-xl font-bold text-white font-display">
              {translate("Vérification de Pièce d'Identité", "Identity Document Verification")}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {translate("Règle stricte Brad'CI : Un document d'identité (CNI / Passeport) ne peut être rattaché qu'à un seul compte utilisateur.", "Brad'CI Strict Rule: An identity document (ID / Passport) can only be linked to a single user account.")}
            </p>
          </div>

          {/* Current KYC Status Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            currentUser.kycStatus === 'verified' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
            currentUser.kycStatus === 'pending' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
            currentUser.kycStatus === 'rejected' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
            'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                currentUser.kycStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                currentUser.kycStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                currentUser.kycStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-slate-800 text-slate-400'
              }`}>
                {currentUser.kycStatus === 'pending' ? (
                  <Clock className="w-5 h-5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400">
                  {translate("Statut Actuel de votre Dossier :", "Current File Status:")}
                </p>
                <p className="text-sm font-extrabold text-white capitalize flex items-center gap-2 mt-0.5">
                  {currentUser.kycStatus === 'verified' ? (
                    <span className="text-emerald-400">{translate('✅ Vérifié & Certifié Brad\'CI', '✅ Verified & Brad\'CI Certified')}</span>
                  ) : currentUser.kycStatus === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>{translate("KYC en cours de vérification", "KYC under verification")}</span>
                    </span>
                  ) : currentUser.kycStatus === 'rejected' ? (
                    <span className="text-red-400">{translate('❌ Rejeté (Veuillez renouveler)', '❌ Rejected (Please re-submit)')}</span>
                  ) : (
                    <span className="text-slate-400">{translate('⚠️ Non Vérifié', '⚠️ Unverified')}</span>
                  )}
                </p>
                {currentUser.kycStatus === 'pending' && (
                  <p className="text-[11px] text-amber-400/90 mt-0.5">
                    {translate("Dossier soumis le ", "Dossier submitted on ")}
                    {currentUser.kycSubmittedAt ? new Date(currentUser.kycSubmittedAt).toLocaleDateString('fr-FR') : 'aujourd\'hui'}
                    {translate(" — Délai moyen de traitement : moins de 2h ouvrées.", " — Average review time: under 2 working hours.")}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setKycModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors shrink-0"
            >
              {currentUser.kycStatus === 'pending' || currentUser.kycStatus === 'verified'
                ? translate("Revoir / Mettre à jour Photos KYC", "Review / Update KYC Photos")
                : translate("Ouvrir l'Appareil Photo KYC", "Open KYC Camera")}
            </button>
          </div>

          {/* If Pending or Verified, Show preview of submitted documents */}
          {(currentUser.kycPhotoUrl || currentUser.kycSelfieUrl || currentUser.kycDocumentNumber) && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>{translate("Documents transmis pour certification :", "Documents submitted for certification:")}</span>
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  {currentUser.kycDocumentType?.toUpperCase() || 'CNI'} : {currentUser.kycDocumentNumber || 'Enregistré'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {currentUser.kycPhotoUrl && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Recto Pièce d'Identité</span>
                    <img
                      src={currentUser.kycPhotoUrl}
                      alt="KYC Document"
                      className="w-full h-28 object-contain rounded-xl border border-slate-800 bg-slate-950 p-1"
                    />
                  </div>
                )}
                {currentUser.kycSelfieUrl && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Selfie avec Pièce</span>
                    <img
                      src={currentUser.kycSelfieUrl}
                      alt="KYC Selfie"
                      className="w-full h-28 object-contain rounded-xl border border-slate-800 bg-slate-950 p-1"
                    />
                  </div>
                )}
                {currentUser.kycDriverLicenseUrl && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Permis de Conduire</span>
                    <img
                      src={currentUser.kycDriverLicenseUrl}
                      alt="Driver License"
                      className="w-full h-28 object-contain rounded-xl border border-slate-800 bg-slate-950 p-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleKYCSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {translate("Type de Document", "Document Type")}
              </label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="cni">{translate("Carte Nationale d'Identité (CNI Côte d'Ivoire / CEDEAO)", "National Identity Card (Ivory Coast / ECOWAS)")}</option>
                <option value="passeport">{translate("Passeport Biométrique", "Biometric Passport")}</option>
                <option value="attestation">{translate("Attestation d'Identité ONECI", "ONECI Identity Certificate")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {translate("Numéro Unique du Document (Vérification d'Unicité)", "Unique Document Number (Uniqueness Check)")}
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={e => setDocNumber(e.target.value)}
                placeholder="Ex: C0129849204"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 uppercase font-mono"
              />
            </div>

            {kycFeedback && (
              <div className={`p-4 rounded-2xl border text-xs ${
                kycFeedback.isDuplicate 
                  ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                {kycFeedback.isDuplicate && (
                  <p className="font-bold flex items-center gap-1.5 text-red-400 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ALERTE SÉCURITÉ DOUBLON DÉTECTÉ :</span>
                  </p>
                )}
                <p>{kycFeedback.message}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              {translate("Soumettre pour Certification", "Submit for Certification")}
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 7: PARRAINAGE & BONUS RÉCIPROQUES */}
      {activeSubTab === 'referral' && (
        <ReferralDashboard />
      )}

      {/* SUB-TAB 8: PARAMÈTRES & PRÉFÉRENCES */}
      {activeSubTab === 'settings' && (
        <div id="settings-container" className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0C1425] via-slate-900 to-[#0C1425] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Settings className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {translate("Paramètres & Préférences", "Settings & Preferences")}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {translate("Gérez l'apparence, la langue, la voix de guidage et vos alertes de compte.", "Manage appearance, language, voice guidance and account alerts.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                {currentUser.sellerPlan === 'pro' ? 'Compte Vendeur Pro' : currentUser.sellerPlan === 'standard' ? 'Compte Vendeur Standard' : 'Compte Client / Vendeur'}
              </span>
            </div>
          </div>

          {/* SECTION ABONNEMENT & PASS VENDEUR (RÉSERVÉ VENDEURS / ACHETEURS - SANS PASS LIVREUR) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0C121E] via-[#081024] to-[#0C121E] border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-white font-display">
                      {translate("Abonnement & Pass Vendeur Pro", "Seller Pro Pass & Subscription")}
                    </h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {currentUser.sellerPlan === 'pro'
                        ? 'GOLD VIP (1.5%)'
                        : currentUser.sellerPlan === 'standard'
                        ? 'PRO (2.5%)'
                        : 'PASS GRATUIT (5.0%)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {translate(
                      "Réduisez vos commissions jusqu'à 1.5%, affichez le badge officiel et propulsez vos annonces en tête du radar Abidjan.",
                      "Lower your commission fees down to 1.5%, show verified badge, and boost listings to the top of Abidjan radar."
                    )}
                  </p>
                </div>
              </div>

              <button
                id="btn-settings-manage-seller-pass"
                type="button"
                onClick={() => {
                  setTargetPlanForPricing('standard');
                  setPricingModalOpen(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Zap className="w-4 h-4" />
                <span>{translate("Voir les Pass Vendeurs & Boost", "View Seller Passes & Boost")}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase block tracking-wider">Booster Flash (1 000 F)</span>
                <p className="text-xs font-bold text-white">24h en tête de fil</p>
                <p className="text-[11px] text-slate-400">Mise en vedette prioritaire de l'annonce</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-blue-400 font-bold uppercase block tracking-wider">Pass Pro (2 500 F / 30j)</span>
                <p className="text-xs font-bold text-white">Commission 2.5%</p>
                <p className="text-[11px] text-slate-400">Badge Pro vérifié & Vitrine Boutique</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-amber-300 font-bold uppercase block tracking-wider">Pass Gold VIP (5 000 F / 30j)</span>
                <p className="text-xs font-bold text-white">Commission record 1.5%</p>
                <p className="text-[11px] text-slate-400">Badge VIP Gold & Priorité d'affichage</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {translate(
                  "Offre réservée aux vendeurs & acheteurs. Le Pass Livreur (Courses VIP) est géré exclusivement dans l'espace Chauffeur Livreur.",
                  "Offer reserved for sellers & buyers. Courier Pass (VIP Runs) is managed exclusively in Driver Space."
                )}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. APPARENCE & THÈME VISUEL */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sun className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    {translate("Apparence & Thème d'Affichage", "Appearance & Display Theme")}
                  </h4>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {theme === 'auto' ? 'Automatique' : theme === 'light' ? 'Clair' : 'Sombre'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {translate(
                  "Choisissez votre confort de lecture. Le mode sombre réduit la consommation de batterie sur écran OLED.",
                  "Choose your viewing comfort. Dark mode saves battery on OLED screens."
                )}
              </p>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* Dark */}
                <button
                  id="btn-settings-theme-dark"
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    addToast(translate("Thème Sombre activé", "Dark theme activated"), translate("Contraste élevé pour usage de nuit.", "High contrast for night use."), 'info');
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-xs font-bold">{translate("Sombre", "Dark")}</span>
                </button>

                {/* Light */}
                <button
                  id="btn-settings-theme-light"
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    addToast(translate("Thème Clair activé", "Light theme activated"), translate("Affichage blanc lumineux pour la journée.", "Bright white display for daytime."), 'info');
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                    theme === 'light'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs font-bold">{translate("Clair", "Light")}</span>
                </button>

                {/* Auto */}
                <button
                  id="btn-settings-theme-auto"
                  type="button"
                  onClick={() => {
                    setTheme('auto');
                    addToast(translate("Thème Automatique activé", "Auto theme activated"), translate("Synchronisation avec votre système jour/nuit.", "Synced with your device day/night settings."), 'info');
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                    theme === 'auto'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Laptop className="w-5 h-5" />
                  <span className="text-xs font-bold">{translate("Système", "Auto")}</span>
                </button>
              </div>
            </div>

            {/* 2. LANGUE & RÉGION */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    {translate("Langue & Localisation", "Language & Region")}
                  </h4>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  XOF (FCFA)
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {translate(
                  "BRAD'CI s'adapte à votre langue de préférence. Les montants et le calcul GPS restent ancrés en Côte d'Ivoire.",
                  "BRAD'CI adapts to your preferred language. Currency and GPS routing remain anchored in Ivory Coast."
                )}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  id="btn-settings-lang-fr"
                  type="button"
                  onClick={() => {
                    setLanguage('fr');
                    addToast("Langue : Français", "Interface configurée en Français de Côte d'Ivoire.", "success");
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                    language === 'fr'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="text-base">🇨🇮</span>
                  <span className="text-xs font-bold">Français</span>
                </button>

                <button
                  id="btn-settings-lang-en"
                  type="button"
                  onClick={() => {
                    setLanguage('en');
                    addToast("Language: English", "Interface switched to English.", "success");
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                    language === 'en'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="text-base">🇬🇧</span>
                  <span className="text-xs font-bold">English</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{translate("Zone Horaire :", "Timezone:")}</span>
                <span className="font-mono text-slate-300 font-semibold">GMT (Heure d'Abidjan)</span>
              </div>

              {/* Devise d'affichage (FCFA, EUR, USD) */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      {translate("Devise d'affichage", "Display Currency")}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    {currency}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {translate(
                    "Choisissez la devise pour l'estimation des montants. Les soldes de retrait et le panier restent en FCFA.",
                    "Select currency for estimation. Wallet balances and cart remain anchored in FCFA."
                  )}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['FCFA', 'EUR', 'USD'] as const).map((curr) => (
                    <button
                      key={curr}
                      id={`btn-settings-currency-${curr.toLowerCase()}`}
                      type="button"
                      onClick={() => {
                        setCurrency(curr);
                        addToast(
                          translate("Devise modifiée", "Currency updated"),
                          translate(`Devise active : ${curr}`, `Active currency: ${curr}`),
                          "success"
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 font-mono text-xs font-bold cursor-pointer ${
                        currency === curr
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{curr === 'FCFA' ? '🇨🇮' : curr === 'EUR' ? '🇪🇺' : '🇺🇸'}</span>
                      <span>{curr}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. ASSISTANCE VOCALE & ACCESSIBILITÉ */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    {translate("Assistance Vocale & Accessibilité", "Voice Guidance & Accessibility")}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  voiceEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {voiceEnabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {translate(
                  "Activez la lecture à voix haute des étapes d'enchères, des alertes de livraison et des confirmations de commande.",
                  "Enable spoken audio announcements for auction steps, courier dispatch and payment validations."
                )}
              </p>

              {/* Assistant Vocal IA Microphone direct launch */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {translate("Assistant Vocal IA (Microphone)", "AI Voice Assistant (Microphone)")}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {translate("Contrôlez l'application et posez vos questions à la voix", "Control the app and ask questions using your voice")}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-settings-open-mic"
                  onClick={() => window.dispatchEvent(new CustomEvent('bradci_open_support_mic'))}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/25 cursor-pointer shrink-0"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{translate("Parler", "Speak")}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <button
                  id="btn-settings-toggle-voice"
                  type="button"
                  onClick={toggleVoice}
                  className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    voiceEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
                  <span>{voiceEnabled ? translate("Désactiver l'Assistance Vocale", "Disable Voice Guidance") : translate("Activer l'Assistance Vocale", "Enable Voice Guidance")}</span>
                </button>

                <button
                  id="btn-settings-test-voice"
                  type="button"
                  onClick={() => {
                    voiceNavigator.unlockAudio();
                    voiceNavigator.speak(
                      language === 'en'
                        ? "Welcome to BRAD'CI. Voice assistance is fully operational."
                        : "Bienvenue sur BRAD'CI. L'assistance vocale est opérationnelle pour vous guider.",
                      language
                    );
                    addToast(translate("Extrait vocal", "Voice Sample"), translate("Message audio en cours de diffusion.", "Playing audio voice prompt."), "info");
                  }}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{translate("Écouter un extrait", "Listen to sample")}</span>
                </button>
              </div>
            </div>

            {/* 4. PRÉFÉRENCES DES NOTIFICATIONS */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    {translate("Préférences de Notifications", "Notification Preferences")}
                  </h4>
                </div>
                {!browserNotificationsEnabled && (
                  <button
                    type="button"
                    onClick={async () => {
                      const granted = await requestBrowserNotificationPermission();
                      if (granted) {
                        addToast(translate("Notifications autorisées", "Notifications allowed"), translate("Vous recevrez des alertes en direct.", "You will receive live alerts."), "success");
                      }
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition-all cursor-pointer"
                  >
                    {translate("Autoriser Push", "Enable Push")}
                  </button>
                )}
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                {/* Option A: Auctions */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="font-bold text-white block">Enchères en direct & Surenchères</span>
                    <span className="text-[11px] text-slate-400">Alertes lors d'une nouvelle offre ou fin imminente</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notifAuctions;
                      setNotifAuctions(next);
                      localStorage.setItem('bradci_notif_auctions', String(next));
                      addToast("Préférence mise à jour", next ? "Alertes enchères activées" : "Alertes enchères désactivées", "info");
                    }}
                    className={`w-10 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${notifAuctions ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white block shadow" />
                  </button>
                </div>

                {/* Option B: Deliveries */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="font-bold text-white block">Suivi des colis & Courses coursier</span>
                    <span className="text-[11px] text-slate-400">Prise en charge et arrivée du livreur avec Code Secret</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notifDeliveries;
                      setNotifDeliveries(next);
                      localStorage.setItem('bradci_notif_deliveries', String(next));
                      addToast("Préférence mise à jour", next ? "Alertes livraisons activées" : "Alertes livraisons désactivées", "info");
                    }}
                    className={`w-10 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${notifDeliveries ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white block shadow" />
                  </button>
                </div>

                {/* Option C: Payments */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="font-bold text-white block">Paiements & Séquestre sécurisé</span>
                    <span className="text-[11px] text-slate-400">Confirmations de versement Wave, Orange Money et libération</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notifPayments;
                      setNotifPayments(next);
                      localStorage.setItem('bradci_notif_payments', String(next));
                      addToast("Préférence mise à jour", next ? "Alertes paiements activées" : "Alertes paiements désactivées", "info");
                    }}
                    className={`w-10 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${notifPayments ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white block shadow" />
                  </button>
                </div>

                {/* Option D: Promos */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="font-bold text-white block">Bonus Parrainage & Déstockages VIP</span>
                    <span className="text-[11px] text-slate-400">Crédits gagnés par vos filleuls et arrivages de lots B2B</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notifPromos;
                      setNotifPromos(next);
                      localStorage.setItem('bradci_notif_promos', String(next));
                      addToast("Préférence mise à jour", next ? "Alertes bonus activées" : "Alertes bonus désactivées", "info");
                    }}
                    className={`w-10 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${notifPromos ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white block shadow" />
                  </button>
                </div>
              </div>
            </div>

            {/* 5. GÉOLOCALISATION GPS & ADRESSE DE LIVRAISON */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Navigation className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">
                    {translate("Géolocalisation & Adresse par Défaut", "Geolocation & Default Address")}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  gpsPermissionStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {gpsPermissionStatus === 'granted' ? 'GPS ACTIF' : 'ATTENTE GPS'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Commune actuelle :</span>
                  <span className="font-bold text-white font-mono">{userLocation?.commune || currentUser.city || 'Cocody'}</span>
                </div>
                <div className="flex items-start justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Adresse enregistrée :</span>
                  <span className="text-right text-slate-300 max-w-[220px] truncate">{userLocation?.address || 'Abidjan, Côte d\'Ivoire'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  id="btn-settings-update-gps"
                  type="button"
                  onClick={async () => {
                    const loc = await requestGpsPermission(true);
                    if (loc) {
                      addToast(translate("Position GPS actualisée", "GPS position updated"), `${loc.commune} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`, "success");
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{translate("Actualiser ma position GPS", "Refresh GPS position")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGpsModalOpen(true)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  {translate("Changer Commune", "Change District")}
                </button>
              </div>
            </div>

            {/* 6. GESTION DU COMPTE & SÉCURITÉ */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">
                    {translate("Options de Compte & Sécurité", "Account & Security Options")}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">ID: {currentUser.id.slice(0, 10)}</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Photo change */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-amber-400/60"
                    />
                    <div>
                      <span className="font-bold text-white block">{currentUser.name}</span>
                      <span className="text-[11px] text-slate-400">{currentUser.phone || '+225 07 00 00 00 00'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProfileAvatarModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    {translate("Modifier photo", "Edit photo")}
                  </button>
                </div>

                {/* KYC Certification status */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="font-bold text-white block">{translate("Certification d'Identité KYC", "KYC Identity Certification")}</span>
                    <span className="text-[11px] text-slate-400">
                      {currentUser.kycStatus === 'verified'
                        ? 'Votre compte est certifié conforme (badge vérifié actif)'
                        : 'Certifiez votre pièce CNI / Passeport pour débloquer les plafonds'}
                    </span>
                  </div>

                  {currentUser.kycStatus === 'verified' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Certifié</span>
                    </span>
                  ) : currentUser.kycStatus === 'pending' ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>{translate("KYC en cours de vérification", "KYC under verification")}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setKycModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer"
                    >
                      {translate("Certifier", "Certify")}
                    </button>
                  )}
                </div>
              </div>

              {/* Sign out */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  id="btn-settings-logout"
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{translate("Se Déconnecter de BRAD'CI", "Sign Out of BRAD'CI")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
