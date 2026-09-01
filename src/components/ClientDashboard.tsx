import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Package, 
  ShoppingBag, 
  ShieldCheck, 
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
  Gift
} from 'lucide-react';
import { Product, ShopProfile, PaymentMethod, DeliveryJob } from '../types';
import { ReferralDashboard } from './ReferralDashboard';

export const ClientDashboard: React.FC = () => {
  const { 
    currentUser, 
    products, 
    freightJobs, 
    escrowRecords,
    userLocation,
    gpsPermissionStatus,
    setGpsModalOpen,
    setNewProductModalOpen, 
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
    setKycModalOpen,
    setProfileAvatarModalOpen,
    addToast,
    translate
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'expeditions' | 'shop' | 'purchases' | 'transactions' | 'kyc' | 'referral'>('sales');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'withdrawals' | 'sales' | 'purchases' | 'subscriptions'>('all');

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
  const [docNumber, setDocNumber] = useState(currentUser?.kycDocumentNumber || 'CI0029481920');
  const [docPhoto, setDocPhoto] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80');
  const [selfiePhoto, setSelfiePhoto] = useState(currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
  const [kycFeedback, setKycFeedback] = useState<{ isDuplicate?: boolean; message?: string } | null>(null);

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
  const myPurchases = products.filter(p => p.winnerId === currentUser.id || p.bids.some(b => b.bidderId === currentUser.id));

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
      {/* Header Profile Bar */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setProfileAvatarModalOpen(true)}
            className="relative group cursor-pointer"
            title="Cliquez pour changer / importer votre photo de profil"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg group-hover:opacity-85 transition-opacity"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setProfileAvatarModalOpen(true); }}
              className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg border border-slate-900 transition-all hover:scale-110"
              title="Changer / Importer ma photo de profil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            {currentUser.isVIP && (
              <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-1 rounded-full shadow">
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white font-display">{currentUser.name}</h2>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                currentUser.sellerPlan === 'pro'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : currentUser.sellerPlan === 'standard'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {currentUser.sellerPlan === 'pro' ? 'PASS BOUTIQUE VIP OR' :
                 currentUser.sellerPlan === 'standard' ? 'PASS VENDEUR CERTIFIÉ' : 'COMPTE GRATUIT (ILLIMITÉ)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email} • {currentUser.phone}</p>
            
            <button
              type="button"
              onClick={() => setProfileAvatarModalOpen(true)}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 mt-1 transition-colors"
            >
              <Camera className="w-3 h-3" />
              <span>{translate("Modifier ma photo de profil (Caméra / Galerie)", "Change profile photo (Camera / Gallery)")}</span>
            </button>
          </div>
        </div>

        {/* Quota & Wallet Widget */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status display for Basic / Standard / Pro */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Publications :</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono-num flex items-center gap-1">
                <span>Illimitées (∞)</span>
              </span>
            </div>
            {currentUser.sellerPlan !== 'pro' && (
              <button
                onClick={() => {
                  setTargetPlanForPricing('standard');
                  setPricingModalOpen(true);
                }}
                className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg font-bold transition-colors flex items-center gap-1"
                title="Passer au Pass Certifié pour réduire vos commissions et obtenir le badge officiel"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Passer au Sérieux</span>
              </button>
            )}
          </div>

          {/* Solde Disponible Retrait */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Solde Disponible Retrait :</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono-num">
                {currentUser.walletBalance.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            {currentUser.walletBalance > 0 && (
              <button
                onClick={() => {
                  setWithdrawAmount(currentUser.walletBalance.toString());
                  setWithdrawalModalOpen(true);
                }}
                className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1"
              >
                <CreditCard className="w-3 h-3" />
                <span>Retirer</span>
              </button>
            )}
          </div>

          {/* Information Paiement Direct */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[10px] text-emerald-400 block uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Paiement Direct à la Livraison (POD) :</span>
              </span>
              <span className="text-xs font-semibold text-slate-200">
                Paiement par API une fois le colis reçu
              </span>
            </div>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded font-medium max-w-[110px] text-center leading-tight">
              0% Blocage de fonds
            </span>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {withdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Demande de Retrait Mobile Money</h3>
                  <p className="text-xs text-slate-400">Solde disponible : <strong className="text-emerald-400 font-mono">{currentUser.walletBalance.toLocaleString('fr-FR')} FCFA</strong></p>
                </div>
              </div>
              <button
                onClick={() => setWithdrawalModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
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
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Opérateur de Réception :</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Wave', 'Orange Money', 'MTN MoMo'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        withdrawMethod === m
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {withdrawMethod === 'Wave' ? '✓ Frais de retrait Wave : 0%' : 'Frais de transaction réseau : 1%'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Montant à Retirer (FCFA) :</label>
                <input
                  type="number"
                  min={1000}
                  max={currentUser.walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Numéro Mobile Money Récepteur :</label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="+225 07 XX XX XX XX"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Montant Brut :</span>
                  <span className="font-mono text-white">{Number(withdrawAmount || 0).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Net à recevoir :</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(Number(withdrawAmount || 0) - (withdrawMethod === 'Wave' ? 0 : Math.round(Number(withdrawAmount || 0) * 0.01))).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawalModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-bold rounded-xl border border-slate-800"
                >
                  {translate("Annuler", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all"
                >
                  {translate(`Confirmer le Retrait (${Number(withdrawAmount || 0).toLocaleString('fr-FR')} FCFA)`, `Confirm Withdrawal (${Number(withdrawAmount || 0).toLocaleString('fr-FR')} FCFA)`)}
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
                  <li>Un code OTP Retour sera généré à transmettre au livreur pour valider le retour.</li>
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

      {/* GPS Location & Safety Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            gpsPermissionStatus === 'granted' && userLocation 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
          }`}>
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">Position GPS d'Enlèvement & Livraison Validée</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                {userLocation?.commune || currentUser.gpsLocation?.commune || 'Abidjan'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {userLocation?.address || currentUser.gpsLocation?.address || 'Grand Abidjan, Côte d\'Ivoire'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setGpsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Modifier Adresse GPS</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveSubTab('sales')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'sales'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{translate("Mes Ventes", "My Sales")} ({mySales.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('expeditions')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'expeditions'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{translate("Suivi des Expéditions", "Shipment Tracking")} ({myExpeditions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('shop')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'shop'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{translate("Ma Boutique BRAD'CI", "My Storefront")}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'purchases'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{translate("Mes Commandes & Colis", "My Orders & Packages")} ({myPurchases.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'transactions'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{translate("Historique & Retraits", "History & Withdrawals")}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kyc')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'kyc'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{translate("Sécurité KYC", "KYC Security")}</span>
          {currentUser.kycStatus === 'verified' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
          {currentUser.kycStatus === 'pending' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('referral')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'referral'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-400" />
          <span>{translate("Parrainage & Bonus", "Referrals & Bonus")}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
            {currentUser.referralCount || 0}/10
          </span>
          {(currentUser.referralBalance || 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* SUB-TAB 1: MES VENTES */}
      {activeSubTab === 'sales' && (
        <div className="space-y-5">
          {/* Seller Plan & Active Benefits Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Formule Vendeur Active :</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase ${
                    currentUser.sellerPlan === 'pro'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : currentUser.sellerPlan === 'standard'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {currentUser.sellerPlan === 'pro' ? '👑 Pass Vendeur Or VIP (10 000 F/mois)' :
                     currentUser.sellerPlan === 'standard' ? '✨ Pass Vendeur Certifié (5 000 F/mois)' : '🌱 Compte Basique Gratuit (0 FCFA)'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {currentUser.sellerPlan === 'pro' && '✓ Avantages VIP actifs : Commission record minimale à 2.5% sur ventes directes, Badge Prestige "Boutique Officielle Or VIP", Top Algorithme Abidjan & Support Dédié VIP 7j/7.'}
                {currentUser.sellerPlan === 'standard' && '✓ Avantages Certifiés actifs : Commission réduite à 5% sur ventes directes, Badge officiel "Vendeur Certifié & Vérifié", Vitrine Boutique Personnalisée & Virements instantanés.'}
                {(!currentUser.sellerPlan || currentUser.sellerPlan === 'basic') && 'Compte Basique : Publication illimitée gratuite (10% de commission). Passez au Pass Certifié (5%) ou Or VIP (2.5%) pour maximiser vos gains et inspirer confiance.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentUser.sellerPlan !== 'pro' && (
                <button
                  onClick={() => {
                    setTargetPlanForPricing(currentUser.sellerPlan === 'standard' ? 'pro' : 'standard');
                    setPricingModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{currentUser.sellerPlan === 'standard' ? 'Passer au Pass Or VIP' : 'Activer un Pass Vendeur'}</span>
                </button>
              )}

              <button
                onClick={() => setActiveSubTab('shop')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Gérer ma Boutique</span>
              </button>

              <button
                onClick={() => setNewProductModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publier un Article</span>
              </button>
            </div>
          </div>

          {/* List of Published Products */}
          {mySales.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-bold">Vous n'avez pas encore d'article en vente.</p>
              <p className="text-xs text-slate-500 mt-1">Publiez votre premier article gratuitement (jusqu'à 3 produits offerts).</p>
              <button
                onClick={() => setNewProductModalOpen(true)}
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
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Courses Actives :</span>
              <span className="text-base font-extrabold text-blue-400 font-mono-num">{myExpeditions.length}</span>
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
                          Validation OTP acheteur = Déblocage Wave
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
                  {currentUser.sellerPlan === 'pro' ? 'Boutique Officielle Or VIP (Pass Or 10 000 F)' :
                   currentUser.sellerPlan === 'standard' ? 'Boutique Certifiée Pro (Pass Certifié 5 000 F)' : 'Boutique Basique (Compte Gratuit)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentUser.sellerPlan === 'pro' 
                  ? 'Vous bénéficiez du badge Or VIP, commission record minimale à 2.5%, algorithme prioritaire et support dédié 7j/7.'
                  : currentUser.sellerPlan === 'standard'
                  ? 'Vous bénéficiez du badge Vendeur Certifié, commission réduite à 5% et vitrine personnalisée.'
                  : 'Passez au Pass Vendeur Certifié (5 000 F - 5% com.) ou Pass Vendeur Or VIP (10 000 F - 2.5% com.) pour maximiser vos marges nettes.'}
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
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{translate("Appareil Photo", "Camera")}</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShopForm(prev => ({ ...prev, logo: reader.result as string }));
                                addToast(translate('Photo de profil capturée', 'Profile photo captured'), '', 'success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{translate("Importer Fichier", "Upload File")}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShopForm(prev => ({ ...prev, logo: reader.result as string }));
                                addToast(translate('Logo importé avec succès', 'Logo uploaded successfully'), '', 'success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
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
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{translate("Prendre Photo", "Take Photo")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setShopForm(prev => ({ ...prev, banner: reader.result as string }));
                              addToast(translate('Bannière capturée', 'Banner captured'), '', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>{translate("Importer Bannière", "Upload Banner")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setShopForm(prev => ({ ...prev, banner: reader.result as string }));
                              addToast(translate('Bannière importée', 'Banner uploaded'), '', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

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
                Aucun débit préalable ni blocage de fonds. Vous payez par API (Wave, Orange Money, MTN MoMo, Moov, Carte) directement lorsque le livreur arrive et que vous avez examiné votre colis.
              </p>
            </div>
          </div>

          {myPurchases.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-bold">Vous n'avez pas encore d'enchère ou commande en cours.</p>
              <p className="text-xs text-slate-500 mt-1">Explorez les annonces et commandez avec le Paiement Direct à la Livraison.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPurchases.map((item) => {
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
                          <span>Votre Code Secret OTP :</span>
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
                                  ✓ Colis validé conforme ! Donnez votre code secret OTP ({item.deliveryOtpCode || '8814'}) au livreur pour clôturer la commande.
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
                            Donnez ce <strong>Code OTP Retour</strong> au livreur pour confirmer la prise en charge du retour :
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
                          onClick={() => {
                            if (job) {
                              openOfficialReceipt(job);
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
                              openOfficialReceipt(tempJob);
                            }
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-[#151C33] hover:bg-[#1E53E5]/20 border border-[#222D4A] hover:border-[#1E53E5]/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#1E53E5]" />
                          <span>Voir Reçu / Facture PDF Sécurisée</span>
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
                {translate("Débloqué après remise du code secret OTP par l'acheteur.", "Released after buyer hands over secret OTP code.")}
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
                              openOfficialReceipt(matchingJob);
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
                <p className="text-sm font-extrabold text-white capitalize">
                  {currentUser.kycStatus === 'verified' ? translate('✅ Vérifié & Certifié Brad\'CI', '✅ Verified & Brad\'CI Certified') :
                   currentUser.kycStatus === 'pending' ? translate('⏳ En attente de validation par la modération', '⏳ Pending validation by moderation team') :
                   currentUser.kycStatus === 'rejected' ? translate('❌ Rejeté (Veuillez renouveler)', '❌ Rejected (Please re-submit)') :
                   translate('⚠️ Non Vérifié', '⚠️ Unverified')}
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
                      className="w-full h-24 object-cover rounded-xl border border-slate-800 bg-slate-950"
                    />
                  </div>
                )}
                {currentUser.kycSelfieUrl && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Selfie avec Pièce</span>
                    <img
                      src={currentUser.kycSelfieUrl}
                      alt="KYC Selfie"
                      className="w-full h-24 object-cover rounded-xl border border-slate-800 bg-slate-950"
                    />
                  </div>
                )}
                {currentUser.kycDriverLicenseUrl && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Permis de Conduire</span>
                    <img
                      src={currentUser.kycDriverLicenseUrl}
                      alt="Driver License"
                      className="w-full h-24 object-cover rounded-xl border border-slate-800 bg-slate-950"
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
    </div>
  );
};
