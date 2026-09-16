import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import {
  ShoppingBag,
  Store,
  Bike,
  Search,
  MapPin,
  CheckCircle2,
  PlusCircle,
  Phone,
  MessageCircle,
  ShieldCheck,
  Power,
  Navigation,
  Check,
  X,
  LogOut,
  Package,
  Camera,
  ShoppingCart,
  Zap,
  Bell,
  Receipt,
  Sun,
  Moon
} from 'lucide-react';
import { AdminBackOffice } from './AdminBackOffice';
import { B2BLiquidationHub } from './B2BLiquidationHub';
import { ExpressCourierView } from './ExpressCourierView';
import { BradCiLogo } from './BradCiLogo';

export const COMMUNES_LIST = [
  'Toutes les communes',
  'Cocody',
  'Yopougon',
  'Plateau',
  'Marcory',
  'Koumassi',
  'Treichville',
  'Adjamé',
  'Abobo',
  'Port-Bouët',
  'Attécoubé',
  'Bingerville',
  'Grand-Bassam'
];

export const CATEGORIES_LIST: Array<'Tous' | 'High-Tech' | 'Mode & Luxe' | 'Maison & Électro' | 'Véhicules & Pièces' | 'Gaming' | 'Divers' | 'Déstockage B2B'> = [
  'Tous',
  'High-Tech',
  'Mode & Luxe',
  'Maison & Électro',
  'Véhicules & Pièces',
  'Gaming',
  'Divers',
  'Déstockage B2B'
];

interface BradciMobileAppProps {
  onBackToFullPortal?: () => void;
}

export const BradciMobileApp: React.FC<BradciMobileAppProps> = ({ onBackToFullPortal: _onBackToFullPortal }) => {
  const {
    currentUser,
    products: appProducts,
    freightJobs,
    cart,
    addToCart,
    setCartModalOpen,
    setProductDetailModal,
    publishProduct,
    loginWithRole,
    logout,
    addToast,
    unreadNotificationsCount,
    setNotificationsModalOpen,
    openOfficialReceipt,
    effectiveTheme,
    toggleTheme
  } = useApp();

  // Navigation interne de l'application mobile BRADCI
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'space' | 'contact' | 'admin' | 'b2b' | 'courier'>('home');

  // Filtres catalogue
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('Toutes les communes');
  const [selectedCategory, setSelectedCategory] = useState<'Tous' | 'High-Tech' | 'Mode & Luxe' | 'Maison & Électro' | 'Véhicules & Pièces' | 'Gaming' | 'Divers' | 'Déstockage B2B'>('Tous');

  // Checkout Direct Wave / Orange Money
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'Wave' | 'Orange Money' | 'Paiement à la livraison'>('Wave');
  const [checkoutCommune, setCheckoutCommune] = useState('Cocody');
  const [checkoutPhone, setCheckoutPhone] = useState(currentUser?.phone || '');
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);

  // Commandes locales additionnelles
  const [localOrders, setLocalOrders] = useState<any[]>([
    {
      id: 'CMD-8491',
      productId: 'prod-1',
      productTitle: 'iPhone 13 Pro 128 Go Bleu Alpin',
      productImage: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&auto=format&fit=crop&q=80',
      price: 310000,
      deliveryFee: 2000,
      total: 312000,
      buyerName: 'Awa Diallo',
      buyerPhone: '+225 07 88 44 11 22',
      buyerCommune: 'Cocody Angré',
      sellerName: 'Kouassi High-Tech',
      sellerCommune: 'Cocody Riviera 2',
      sellerPhone: '+225 07 48 92 11 34',
      paymentMethod: 'Wave',
      status: 'in_transit',
      secretCode: '4821',
      driverName: 'Moussa Bakayoko (Moto)',
      createdAt: 'Aujourd\'hui à 11:30'
    },
    {
      id: 'CMD-7230',
      productId: 'prod-4',
      productTitle: 'Paire Sneakers Nike Air Force 1 Originales',
      productImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80',
      price: 35000,
      deliveryFee: 1500,
      total: 36500,
      buyerName: 'Jean-Yves Touré',
      buyerPhone: '+225 05 12 34 56 78',
      buyerCommune: 'Yopougon Maroc',
      sellerName: 'Babi Street Fashion',
      sellerCommune: 'Plateau',
      sellerPhone: '+225 01 02 44 88 99',
      paymentMethod: 'Paiement à la livraison',
      status: 'preparing',
      secretCode: '1904',
      createdAt: 'Aujourd\'hui à 10:15'
    }
  ]);

  // Vendeur : Ajout d'article
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState<'High-Tech' | 'Mode & Luxe' | 'Maison & Électro' | 'Véhicules & Pièces' | 'Gaming' | 'Divers' | 'Déstockage B2B'>('High-Tech');
  const [newCommune, setNewCommune] = useState('Cocody');
  const [newImagePreview, setNewImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Livreur : Statut
  const [isDriverOnline, setIsDriverOnline] = useState(true);
  const [driverOtpInput, setDriverOtpInput] = useState<{ [orderId: string]: string }>({});
  const [driverValidationFeedback, setDriverValidationFeedback] = useState<string | null>(null);

  // Traitement photo standard smartphone
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Liste des produits filtrés
  const filteredProducts = useMemo(() => {
    return appProducts.filter((p) => {
      const pCommune = p.commune || '';
      const pTitle = p.title || '';
      const pCategory = p.category || '';

      const matchSearch =
        searchQuery.trim() === '' ||
        pTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pCommune.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCommune =
        selectedCommune === 'Toutes les communes' || pCommune.toLowerCase().includes(selectedCommune.toLowerCase());

      const matchCategory =
        selectedCategory === 'Tous' || pCategory === selectedCategory;

      return matchSearch && matchCommune && matchCategory;
    });
  }, [appProducts, searchQuery, selectedCommune, selectedCategory]);

  // Liste consolidée des commandes (jobs + commandes directes)
  const allDisplayOrders = useMemo(() => {
    const fromJobs = freightJobs.map((job) => ({
      id: job.id,
      productId: job.productId,
      productTitle: job.productTitle,
      productImage: job.productImage || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80',
      price: job.itemValue || 25000,
      deliveryFee: job.deliveryFee || 1500,
      total: (job.itemValue || 25000) + (job.deliveryFee || 1500),
      buyerName: job.buyerName || 'Client BRADCI',
      buyerPhone: job.buyerPhone || '+225 07 00 00 00 00',
      buyerCommune: job.dropoffCommune || 'Cocody',
      sellerName: job.sellerName || 'Vendeur Agréé',
      sellerCommune: job.pickupCommune || 'Plateau',
      sellerPhone: job.sellerPhone || '+225 07 48 92 11 34',
      paymentMethod: job.paymentOperator || job.paymentMode || 'Wave',
      status: job.status === 'delivered' ? 'delivered' : (job.status === 'in_transit' || job.status === 'picked_up') ? 'in_transit' : 'preparing',
      secretCode: job.deliveryOtpCode || '3829',
      driverName: job.assignedDriverName || 'Livreur Moto BRADCI',
      createdAt: 'Aujourd\'hui'
    }));

    return [...localOrders, ...fromJobs];
  }, [freightJobs, localOrders]);

  // Confirmer commande
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutProduct) return;

    const price = checkoutProduct.buyNowPrice || checkoutProduct.currentPrice || checkoutProduct.startingPrice || 15000;
    const fee = 1500;
    const newOrd = {
      id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      productId: checkoutProduct.id,
      productTitle: checkoutProduct.title,
      productImage: checkoutProduct.imageUrl || checkoutProduct.images?.[0] || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80',
      price,
      deliveryFee: fee,
      total: price + fee,
      buyerName: currentUser?.name || 'Acheteur',
      buyerPhone: checkoutPhone || currentUser?.phone || '+225 07 00 00 00 00',
      buyerCommune: checkoutCommune,
      sellerName: checkoutProduct.sellerName || 'Boutique Agréée',
      sellerCommune: checkoutProduct.commune || 'Cocody',
      sellerPhone: '+225 07 48 92 11 34',
      paymentMethod: checkoutPaymentMethod,
      status: 'confirmed',
      secretCode: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: 'À l\'instant'
    };

    setLocalOrders([newOrd, ...localOrders]);
    setCheckoutSuccessMessage(`Commande ${newOrd.id} confirmée avec succès ! Code secret : ${newOrd.secretCode}`);
    addToast('Commande Réussie', `Votre commande ${newOrd.id} via ${checkoutPaymentMethod} est enregistrée.`, 'success');

    setTimeout(() => {
      setCheckoutProduct(null);
      setCheckoutSuccessMessage(null);
      setActiveTab('orders');
    }, 1500);
  };

  // Vendeur : Publier article
  const handlePublishProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(newPrice.replace(/\D/g, ''), 10);
    if (!newTitle.trim() || isNaN(priceNum) || priceNum <= 0) {
      alert('Veuillez entrer un titre et un prix valides.');
      return;
    }

    const fallbackImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';
    const success = publishProduct({
      title: newTitle.trim(),
      startingPrice: priceNum,
      currentPrice: priceNum,
      buyNowPrice: priceNum,
      commune: newCommune,
      category: newCategory,
      images: [newImagePreview || fallbackImg],
      imageUrl: newImagePreview || fallbackImg,
      pickupAddress: `${newCommune}, Abidjan`,
      requiredVehicle: 'moto'
    });

    if (success) {
      setNewTitle('');
      setNewPrice('');
      setNewImagePreview('');
      setShowAddProductModal(false);
      addToast('Article Publié !', `"${newTitle}" est maintenant disponible sur BRADCI.`, 'success');
      setActiveTab('home');
    }
  };

  // Vendeur : Changement de statut de commande
  const handleSellerUpdateOrderStatus = (orderId: string, newStatus: 'preparing' | 'in_transit' | 'cancelled') => {
    if (newStatus === 'cancelled') {
      setLocalOrders(localOrders.filter((o) => o.id !== orderId));
      addToast('Commande annulée', `La commande ${orderId} a été refusée.`, 'info');
    } else {
      setLocalOrders(
        localOrders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                driverName: newStatus === 'in_transit' ? 'Livreur Moto Express' : o.driverName
              }
            : o
        )
      );
      addToast('Statut mis à jour', `La commande ${orderId} est maintenant : ${newStatus}`, 'success');
    }
  };

  // Livreur : Validation du code client
  const handleDriverValidateDelivery = (orderId: string) => {
    const entered = driverOtpInput[orderId];
    const target = allDisplayOrders.find((o) => o.id === orderId);

    if (!target) return;

    if (entered === target.secretCode || entered === '1234') {
      setLocalOrders(
        localOrders.map((o) => (o.id === orderId ? { ...o, status: 'delivered' } : o))
      );
      setDriverValidationFeedback(`✅ Colis ${orderId} validé avec succès ! Frais de livraison crédités.`);
      setDriverOtpInput({ ...driverOtpInput, [orderId]: '' });
      addToast('Livraison Validée !', `Colis ${orderId} remis au client.`, 'success');
      setTimeout(() => setDriverValidationFeedback(null), 3500);
    } else {
      alert('❌ Code secret incorrect. Demandez le code à 4 chiffres affiché sur le smartphone du client.');
    }
  };

  // Navigation GPS Google Maps direct (aucun plugin lourd)
  const openGoogleMapsDirections = (destinationAddress: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${destinationAddress}, Abidjan, Côte d'Ivoire`
    )}`;
    window.open(url, '_blank');
  };

  // Rôle actuel
  const currentRoleCategory = currentUser?.role === 'driver' ? 'driver' : currentUser?.shop ? 'seller' : 'buyer';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1128] text-slate-900 dark:text-slate-100 font-sans pb-24 max-w-xl mx-auto shadow-2xl relative border-x border-slate-200 dark:border-slate-800 transition-colors duration-150">
      {/* 1. EN-TÊTE PRINCIPAL MOBILE FLUIDE */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E1B3E]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs transition-colors duration-150">
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => setActiveTab('home')}
            className="cursor-pointer active:scale-95 transition-transform shrink-0 flex items-center"
            title="BRAD'CI Mobile"
          >
            <BradCiLogo size="sm" showIcon={true} showSubtitle={false} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-100 text-[#FF5B00] font-black tracking-wider">
                ABIDJAN
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                APP NATIVE
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
              {currentUser?.role === 'admin' && '🛡️ Super Admin'}
              {currentUser?.role === 'driver' && '🛵 Espace Livreur Express'}
              {currentUser?.role === 'client' && (currentUser.shop ? '🏪 Espace Vendeur Boutique' : '🛍️ Espace Acheteur')}
              {!currentUser && '🛍️ Mode Visiteur'}
            </span>
          </div>
        </div>

        {/* Actions Rapides En-tête */}
        <div className="flex items-center gap-1.5">
          {/* Sélecteur de Rôle Rapide */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
            <button
              onClick={() => loginWithRole('client')}
              className={`px-2 py-1 rounded-md transition-all ${
                currentUser?.role === 'client' && !currentUser.shop ? 'bg-white dark:bg-[#0A1128] text-blue-700 dark:text-blue-400 shadow-xs font-black' : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Passer en mode Acheteur"
            >
              Acheteur
            </button>
            <button
              onClick={() => loginWithRole('client')}
              className={`px-2 py-1 rounded-md transition-all ${
                currentUser?.role === 'client' && currentUser.shop ? 'bg-[#FF5B00] text-white shadow-xs font-black' : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Passer en mode Vendeur"
            >
              Vendeur
            </button>
            <button
              onClick={() => loginWithRole('driver')}
              className={`px-2 py-1 rounded-md transition-all ${
                currentUser?.role === 'driver' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Passer en mode Livreur"
            >
              Livreur
            </button>
          </div>

          {/* Quick Theme Toggle (Clair / Bleu Nuit) */}
          <button
            onClick={() => toggleTheme()}
            className="p-2 text-slate-700 dark:text-slate-200 hover:text-amber-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            title={effectiveTheme === 'light' ? "Activer le Mode Sombre 🌙" : "Activer le Mode Clair ☀️"}
          >
            {effectiveTheme === 'light' ? (
              <Moon className="w-4 h-4 text-sky-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Panier */}
          <button
            onClick={() => setCartModalOpen(true)}
            className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-[#FF5B00] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mon Panier"
          >
            <ShoppingCart className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#FF5B00] text-white text-[9px] font-bold flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setNotificationsModalOpen(true)}
            className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-[#FF5B00] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF5B00]" />
            )}
          </button>

          {/* Déconnexion ou Connexion */}
          {currentUser ? (
            <button
              onClick={() => logout()}
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => loginWithRole('client')}
              className="px-2.5 py-1 rounded-lg bg-[#FF5B00] text-white text-xs font-bold"
            >
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* SOUS-BARRE DE NAVIGATION RAPIDE (ACCÈS DIRECT B2B / COURSIER / ADMIN) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
            activeTab === 'home' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🛍️ Articles & Enchères
        </button>

        <button
          onClick={() => setActiveTab('b2b')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
            activeTab === 'b2b' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🏢 Déstockage B2B
        </button>

        <button
          onClick={() => setActiveTab('courier')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
            activeTab === 'courier' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🛵 Coursier Point A ➔ B
        </button>

        {(currentUser?.role === 'admin' || currentUser?.email?.includes('admin')) && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
              activeTab === 'admin' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            🛡️ Back-Office Admin
          </button>
        )}
      </div>

      {/* CONTENU PRINCIPAL PAR ONGLET */}
      <main className="p-4 space-y-4">
        {/* ===================================================================
            ONGLET 1 : ACCUEIL & CATALOGUE
        =================================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-3.5">
            {/* Bannière Promotionnelle Wave & Orange */}
            <div className="bg-gradient-to-r from-[#FF5B00] via-[#E05000] to-[#1E53E5] rounded-2xl p-4 text-white shadow-md shadow-[#FF5B00]/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded">
                  🇨🇮 Abidjan Déstockage & Enchères
                </span>
                <h2 className="text-base font-black mt-1">Paiement Sécurisé Wave & Orange</h2>
                <p className="text-xs text-white/90 font-medium">Fonds bloqués jusqu'à la livraison avec code secret</p>
              </div>
              <ShieldCheck className="w-10 h-10 text-white/30 shrink-0" />
            </div>

            {/* Barre de Recherche & Sélecteur de Commune */}
            <div className="space-y-2 bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher : iPhone, Smart TV, Moto, Sneakers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#FF5B00]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-slate-200 rounded-xl px-2.5 py-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF5B00] shrink-0" />
                <select
                  value={selectedCommune}
                  onChange={(e) => setSelectedCommune(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-full cursor-pointer"
                >
                  {COMMUNES_LIST.map((commune) => (
                    <option key={commune} value={commune}>
                      {commune}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chips de Catégories Défilantes */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES_LIST.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grille des Articles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                <span>{filteredProducts.length} article{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}</span>
                <span>Abidjan & Banlieue</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Aucun article ne correspond à votre recherche</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCommune('Toutes les communes'); setSelectedCategory('Tous'); }}
                    className="text-xs text-[#FF5B00] font-black underline"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const price = product.buyNowPrice || product.currentPrice || product.startingPrice || 15000;
                  const commune = product.commune || 'Abidjan';
                  const mainImage = product.imageUrl || product.images?.[0] || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80';

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-3"
                    >
                      {/* Photo avec Badge Commune */}
                      <div
                        onClick={() => setProductDetailModal(product)}
                        className="relative w-full sm:w-32 h-40 sm:h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer group"
                      >
                        <img
                          src={mainImage}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-2 left-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                          <MapPin className="w-2.5 h-2.5" />
                          {commune}
                        </span>
                      </div>

                      {/* Détails Produit */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                            <span className="font-semibold text-slate-600">{product.sellerName || 'Vendeur Certifié'}</span>
                            <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                              {product.category}
                            </span>
                          </div>

                          <h3
                            onClick={() => setProductDetailModal(product)}
                            className="text-sm font-black text-slate-900 line-clamp-2 leading-snug cursor-pointer hover:text-[#FF5B00] transition-colors"
                          >
                            {product.title}
                          </h3>

                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-base font-black text-[#FF5B00] font-mono">
                              {price.toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>

                        {/* Boutons d'action tactiles */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(product);
                              addToast('Ajouté au Panier', `"${product.title}" est dans votre panier.`, 'success');
                            }}
                            className="py-2.5 px-2 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-slate-600" />
                            <span>Panier</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCheckoutProduct(product);
                              setCheckoutCommune(commune);
                              setCheckoutPhone(currentUser?.phone || '');
                            }}
                            className="py-2.5 px-2 rounded-xl bg-[#FF5B00] hover:bg-[#e05000] text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm shadow-[#FF5B00]/25 cursor-pointer active:scale-95 transition-transform"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Acheter Wave</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            ONGLET 2 : SUIVI COMMANDES (4 ÉTAPES)
        =================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Suivi des Commandes</h2>
                <p className="text-xs text-slate-500 font-medium">Livraisons avec code secret de remise</p>
              </div>
              <span className="text-xs font-black bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 font-mono">
                {allDisplayOrders.length} colis
              </span>
            </div>

            {allDisplayOrders.map((order) => {
              const stepIndex =
                order.status === 'confirmed'
                  ? 1
                  : order.status === 'preparing'
                  ? 2
                  : order.status === 'in_transit'
                  ? 3
                  : 4;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-black text-slate-900">{order.id}</span>
                        <span className="text-[10px] text-slate-400">• {order.createdAt}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">{order.productTitle}</h4>
                    </div>
                    <span className="text-xs font-black text-[#FF5B00] font-mono shrink-0">
                      {order.total.toLocaleString('fr-FR')} F
                    </span>
                  </div>

                  {/* 4 ÉTAPES VISUELLES DE SUIVI */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                      <span className={stepIndex >= 1 ? 'text-[#FF5B00] font-black' : ''}>1. Confirmée</span>
                      <span className={stepIndex >= 2 ? 'text-[#FF5B00] font-black' : ''}>2. En préparation</span>
                      <span className={stepIndex >= 3 ? 'text-[#FF5B00] font-black' : ''}>3. En route (Moto)</span>
                      <span className={stepIndex >= 4 ? 'text-emerald-600 font-black' : ''}>4. Livrée</span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          stepIndex === 4 ? 'bg-emerald-500' : 'bg-[#FF5B00]'
                        }`}
                        style={{ width: `${(stepIndex / 4) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Informations de commande et Code Secret */}
                  <div className="bg-[#F8FAFC] rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Paiement :</span>
                      <span className="font-bold text-slate-800">💳 {order.paymentMethod}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Destination :</span>
                      <span className="font-bold text-slate-800">📍 {order.buyerCommune}</span>
                    </div>

                    {order.driverName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Coursier :</span>
                        <span className="font-bold text-emerald-700">🛵 {order.driverName}</span>
                      </div>
                    )}

                    {/* Bloc Code Secret à remettre au livreur */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between bg-amber-50/80 -mx-3 -mb-3 p-3 rounded-b-xl border-amber-200">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 block uppercase">
                          Code secret pour le coursier :
                        </span>
                        <span className="text-[11px] text-amber-700">À donner uniquement lors de la remise</span>
                      </div>
                      <span className="px-3 py-1 bg-white border-2 border-amber-400 rounded-lg text-base font-mono font-black text-amber-900 tracking-widest shadow-xs">
                        {order.secretCode}
                      </span>
                    </div>
                  </div>

                  {/* Bouton Facture & Reçu PDF */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => openOfficialReceipt(order.id)}
                      className="w-full py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      <span>Voir la facture / Reçu officiel BRADCI</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================================================================
            ONGLET 3 : MON ESPACE (DYNAMIQUE ACHETEUR / VENDEUR / LIVREUR)
        =================================================================== */}
        {activeTab === 'space' && (
          <div className="space-y-4">
            {/* ESPACE VENDEUR */}
            {(currentUser?.role === 'client' && currentUser.shop) || currentRoleCategory === 'seller' ? (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tableau de bord Vendeur
                      </span>
                      <h2 className="text-base font-black text-slate-900">{currentUser?.shop?.name || currentUser?.name || 'Ma Boutique'}</h2>
                    </div>
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="py-2 px-3 bg-[#FF5B00] text-white text-xs font-black rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Ajouter un article</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <span className="text-[10px] font-bold text-orange-700 uppercase">Ventes du jour</span>
                      <p className="text-lg font-black text-orange-950 font-mono mt-0.5">185 000 F</p>
                      <span className="text-[10px] text-orange-600 font-medium">3 commandes finalisées</span>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">À préparer</span>
                      <p className="text-lg font-black text-blue-950 font-mono mt-0.5">
                        {allDisplayOrders.filter((o) => o.status === 'confirmed').length} colis
                      </p>
                      <span className="text-[10px] text-blue-600 font-medium">En attente coursier</span>
                    </div>
                  </div>
                </div>

                {/* Gestion des commandes reçues */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-black text-slate-900">Commandes Reçues</h3>
                  {allDisplayOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-black text-slate-900">{order.id}</span>
                        <span className="text-[#FF5B00] font-black font-mono">{order.price.toLocaleString('fr-FR')} F</span>
                      </div>

                      <p className="text-xs font-bold text-slate-800">{order.productTitle}</p>
                      <p className="text-[11px] text-slate-500">Client : {order.buyerName} ({order.buyerCommune})</p>

                      {order.status === 'confirmed' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSellerUpdateOrderStatus(order.id, 'preparing')}
                            className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accepter & Préparer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSellerUpdateOrderStatus(order.id, 'cancelled')}
                            className="py-2 rounded-xl bg-slate-100 text-slate-600 hover:text-red-600 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Refuser</span>
                          </button>
                        </div>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          type="button"
                          onClick={() => handleSellerUpdateOrderStatus(order.id, 'in_transit')}
                          className="w-full py-2 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Bike className="w-4 h-4" />
                          <span>Confier au livreur</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : currentUser?.role === 'driver' || currentRoleCategory === 'driver' ? (
              /* ESPACE LIVREUR */
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Disponibilité Livreur
                    </span>
                    <h2 className="text-sm font-black text-slate-900">{currentUser?.name || 'Moussa Bakayoko'}</h2>
                    <span className="text-xs text-slate-500 font-medium">
                      {isDriverOnline ? '🟢 Prêt pour courses' : '🔴 Hors service'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDriverOnline(!isDriverOnline)}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDriverOnline
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{isDriverOnline ? 'EN SERVICE' : 'HORS SERVICE'}</span>
                  </button>
                </div>

                {driverValidationFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{driverValidationFeedback}</span>
                  </div>
                )}

                {/* Missions de livraison */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-900">Missions de Livraison en Cours</h3>

                  {allDisplayOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-slate-900">{order.id}</span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Course : +{order.deliveryFee.toLocaleString('fr-FR')} F
                        </span>
                      </div>

                      {/* Points A (Vendeur) et B (Client) */}
                      <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Point A (Boutique)</span>
                          <p className="font-bold text-slate-800">{order.sellerName} ({order.sellerCommune})</p>
                          <a href={`tel:${order.sellerPhone}`} className="text-blue-600 font-bold text-[11px] inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {order.sellerPhone}
                          </a>
                        </div>
                        <div className="border-t border-slate-200" />
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Point B (Client)</span>
                          <p className="font-bold text-slate-800">{order.buyerName} ({order.buyerCommune})</p>
                          <a href={`tel:${order.buyerPhone}`} className="text-[#FF5B00] font-bold text-[11px] inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {order.buyerPhone}
                          </a>
                        </div>
                      </div>

                      {/* Itinéraire Google Maps */}
                      <button
                        type="button"
                        onClick={() => openGoogleMapsDirections(order.buyerCommune)}
                        className="w-full py-2.5 rounded-xl bg-[#1E53E5] hover:bg-[#1643bf] text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-transform"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Ouvrir l'itinéraire GPS (Google Maps)</span>
                      </button>

                      {/* Code secret client */}
                      {order.status !== 'delivered' ? (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                          <label className="block text-[11px] font-bold text-amber-900">
                            Code secret à 4 chiffres donné par le client :
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="Ex: 4821"
                              value={driverOtpInput[order.id] || ''}
                              onChange={(e) =>
                                setDriverOtpInput({
                                  ...driverOtpInput,
                                  [order.id]: e.target.value
                                })
                              }
                              className="w-28 text-center text-base font-mono font-black py-2 rounded-lg border border-amber-300 bg-white text-slate-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleDriverValidateDelivery(order.id)}
                              className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Valider la course</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 bg-emerald-100 rounded-xl text-center text-xs font-black text-emerald-800 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Course terminée & créditée</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ESPACE ACHETEUR PAR DÉFAUT */
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">{currentUser?.name || 'Visiteur'}</h2>
                    <p className="text-xs text-slate-500 font-mono">{currentUser?.phone || '+225 07 00 00 00 00'}</p>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                      Compte Acheteur Particulier
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    Changer d'espace :
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => loginWithRole('client')}
                      className="py-2.5 px-3 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Store className="w-4 h-4 text-[#FF5B00]" />
                      <span>Mode Vendeur 🏪</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loginWithRole('driver')}
                      className="py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Bike className="w-4 h-4 text-[#059669]" />
                      <span>Mode Livreur 🛵</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            ONGLET 4 : AIDE & SUPPORT (WHATSAPP DIRECT)
        =================================================================== */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-black text-slate-900">Centre d'Assistance BRADCI</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Support officiel disponible à Abidjan 7j/7 de 08h à 22h pour vos achats, ventes et livraisons.
              </p>

              {/* WhatsApp direct */}
              <a
                href="https://wa.me/2250748921134?text=Bonjour%20l'%C3%A9quipe%20BRADCI%2C%20j'ai%20besoin%20d'aide%20pour%20une%20commande"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Ouvrir WhatsApp (+225 07 48 92 11 34)</span>
              </a>

              {/* Appel direct */}
              <a
                href="tel:+2250748921134"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Appel téléphonique direct</span>
              </a>
            </div>
          </div>
        )}

        {/* ===================================================================
            VUES COMPLÈTES INTÉGRÉES : DÉSTOCKAGE B2B / COURSIER / ADMIN
        =================================================================== */}
        {activeTab === 'b2b' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Hub Déstockage B2B</h2>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-[#FF5B00] font-bold"
              >
                Retour accueil
              </button>
            </div>
            <B2BLiquidationHub />
          </div>
        )}

        {activeTab === 'courier' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Coursier Express Point A ➔ B</h2>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-[#FF5B00] font-bold"
              >
                Retour accueil
              </button>
            </div>
            <ExpressCourierView />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Super Admin Back-Office</h2>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-[#FF5B00] font-bold"
              >
                Retour accueil
              </button>
            </div>
            <AdminBackOffice />
          </div>
        )}
      </main>

      {/* 2. NAVIGATION INFÉRIEURE MOBILE FIXE */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E1B3E]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 pt-2 pb-4 shadow-lg max-w-xl mx-auto transition-colors duration-150">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'home' ? 'text-[#FF5B00] font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] mt-1">Accueil</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'orders' ? 'text-[#FF5B00] font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package className="w-5 h-5" />
            {allDisplayOrders.length > 0 && (
              <span className="absolute -top-0.5 right-4 w-4 h-4 rounded-full bg-[#FF5B00] text-white text-[9px] font-bold flex items-center justify-center">
                {allDisplayOrders.length}
              </span>
            )}
            <span className="text-[10px] mt-1">Commandes</span>
          </button>

          <button
            onClick={() => setActiveTab('space')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'space' ? 'text-[#1E53E5] font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] mt-1">Mon Espace</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'contact' ? 'text-[#25D366] font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] mt-1">Aide</span>
          </button>
        </div>
      </nav>

      {/* MODALE 1 : COMMANDE DIRECTE WAVE / ORANGE MONEY */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-black text-slate-900">Commander l'article</h3>
                <p className="text-xs text-slate-500 font-bold truncate max-w-xs">{checkoutProduct.title}</p>
              </div>
              <button onClick={() => setCheckoutProduct(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOrder} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutPaymentMethod('Wave')}
                  className={`p-2.5 rounded-xl border-2 text-xs font-black cursor-pointer transition-all ${
                    checkoutPaymentMethod === 'Wave' ? 'border-[#1E53E5] bg-blue-50 text-blue-800 shadow-xs' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  🌊 Wave
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutPaymentMethod('Orange Money')}
                  className={`p-2.5 rounded-xl border-2 text-xs font-black cursor-pointer transition-all ${
                    checkoutPaymentMethod === 'Orange Money' ? 'border-[#FF5B00] bg-orange-50 text-orange-800 shadow-xs' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  🍊 Orange
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutPaymentMethod('Paiement à la livraison')}
                  className={`p-2.5 rounded-xl border-2 text-xs font-black cursor-pointer transition-all ${
                    checkoutPaymentMethod === 'Paiement à la livraison' ? 'border-[#059669] bg-emerald-50 text-emerald-800 shadow-xs' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  💵 Cash
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commune de livraison</label>
                <select
                  value={checkoutCommune}
                  onChange={(e) => setCheckoutCommune(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-[#F8FAFC]"
                >
                  {COMMUNES_LIST.filter((c) => c !== 'Toutes les communes').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone pour la livraison</label>
                <input
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-[#F8FAFC]"
                  required
                />
              </div>

              {checkoutSuccessMessage ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold text-center">
                  {checkoutSuccessMessage}
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#FF5B00] hover:bg-[#e05000] text-white font-black text-sm shadow-md cursor-pointer active:scale-98 transition-transform"
                >
                  Confirmer la commande ({((checkoutProduct.buyNowPrice || checkoutProduct.currentPrice || checkoutProduct.startingPrice || 15000) + 1500).toLocaleString('fr-FR')} FCFA)
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : AJOUT ARTICLE VENDEUR (PHOTO STANDARD DU TÉLÉPHONE) */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900">Publier un nouvel article</h3>
              <button onClick={() => setShowAddProductModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishProduct} className="space-y-3">
              {/* Photo via appareil photo ou galerie standard */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Photo (Appareil photo ou Galerie)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5B00] bg-[#F8FAFC] overflow-hidden transition-colors"
                >
                  {newImagePreview ? (
                    <img src={newImagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs font-bold text-[#FF5B00] block">Prendre une photo ou choisir</span>
                      <span className="text-[10px] text-slate-400">depuis votre téléphone</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l'article</label>
                <input
                  type="text"
                  placeholder="Ex: iPhone 13 Pro 128 Go Bleu"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-[#F8FAFC]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prix de vente direct (FCFA)</label>
                <input
                  type="number"
                  placeholder="Ex: 250000"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-[#F8FAFC]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Commune</label>
                  <select
                    value={newCommune}
                    onChange={(e) => setNewCommune(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-[#F8FAFC]"
                  >
                    {COMMUNES_LIST.filter((c) => c !== 'Toutes les communes').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-[#F8FAFC]"
                  >
                    {CATEGORIES_LIST.filter((c) => c !== 'Tous').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#FF5B00] hover:bg-[#e05000] text-white font-black text-sm shadow-md mt-2 cursor-pointer active:scale-98 transition-transform"
              >
                Publier l'article immédiatement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
