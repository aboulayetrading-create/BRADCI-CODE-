import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Share2, 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Star, 
  Package, 
  Clock, 
  Gavel, 
  ExternalLink,
  Check,
  Building2,
  SlidersHorizontal,
  Navigation,
  ShoppingCart
} from 'lucide-react';
import { Product } from '../types';

export const ShopStorefrontModal: React.FC = () => {
  const { 
    selectedShopForView, 
    setSelectedShopForView, 
    products, 
    reviews,
    currentUser, 
    setProductDetailModal,
    setPricingModalOpen,
    setTargetPlanForPricing,
    addToast,
    addToCart,
    setCartModalOpen,
    translate
  } = useApp();

  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!selectedShopForView) return null;

  const shop = selectedShopForView;
  const isOwner = currentUser?.id === shop.sellerId;
  const shopProducts = products.filter(p => p.sellerId === shop.sellerId);
  const shopReviews = reviews.filter(r => r.targetId === shop.sellerId || r.targetType === 'seller' || r.targetName === shop.name);

  const filteredProducts = shopProducts.filter(p => {
    if (activeFilter === 'active') return p.status === 'active' || p.status === 'pending_choice';
    if (activeFilter === 'sold') return p.status === 'sold' || p.status === 'delivered';
    return true;
  });

  const handleShareLink = () => {
    const slug = shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url = `https://bradci.ci/boutique/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    addToast('Lien de la Boutique Copié !', url, 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="shop-storefront-modal" 
        className="w-full max-w-4xl bg-[#0B111E] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto text-white"
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedShopForView(null)}
          className="absolute top-4 right-4 z-20 text-slate-300 hover:text-white p-2 rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-700/60 shadow-lg transition-transform hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Banner */}
        <div className="relative h-44 sm:h-56 w-full bg-slate-900 overflow-hidden">
          <img
            src={shop.banner}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B111E] via-[#0B111E]/40 to-transparent" />
          
          {/* Pro / Superior Badge on Banner */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {shop.tier === 'pro' ? (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-3 py-1 rounded-full text-xs font-extrabold shadow-lg">
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
                <span>Boutique Supérieure VIP</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-blue-500/90 text-slate-950 px-3 py-1 rounded-full text-xs font-extrabold shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Boutique Certifiée Pro</span>
              </div>
            )}

            <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Garantie Séquestre Wave/MoMo</span>
            </div>
          </div>
        </div>

        {/* Store Profile Info */}
        <div className="px-6 sm:px-8 pb-6 -mt-16 sm:-mt-20 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            {/* Logo & Basic Info */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={shop.logo}
                  alt={shop.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-[#0B111E] shadow-2xl bg-slate-900"
                />
                {shop.verifiedBadge && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-[#0B111E]" title="Vendeur Certifié">
                    <ShieldCheck className="w-4 h-4 fill-blue-500 text-white" />
                  </div>
                )}
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
                    {shop.name}
                  </h1>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {shop.category}
                  </span>
                </div>
                {shop.slogan && (
                  <p className="text-xs sm:text-sm text-amber-400 font-medium mt-0.5">
                    {shop.slogan}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{shop.commune}{shop.district ? ` - ${shop.district}` : ''}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>{shop.rating.toFixed(1)} / 5</span>
                  </span>
                  <span>•</span>
                  <span>{shop.salesCount} ventes réalisées</span>
                </div>
              </div>
            </div>

            {/* Actions: Share & Escrow Protection Notice */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <button
                onClick={handleShareLink}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                title="Copier le lien public"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Lien Copié !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>Partager la Boutique</span>
                  </>
                )}
              </button>

              <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Paiement Séquestre Garanti • Numéro masqué avant achat</span>
              </div>
            </div>
          </div>

          {/* Description & Address GPS Bar */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {shop.description}
            </p>
            <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Adresse physique & Enlèvement : <strong className="text-white">{shop.address}</strong></span>
              </div>
              {shop.openingHours && (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{shop.openingHours}</span>
                </div>
              )}
            </div>
          </div>

          {/* If current user is Basic and looking at their own profile, prompt upgrade */}
          {isOwner && currentUser?.sellerPlan === 'basic' && (
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-white block">Vous utilisez le Pass Gratuit (Max 3 annonces)</span>
                <span className="text-slate-400">Passez au Pass Pro (5 000 F) ou Pass Illimité (10 000 F) pour booster votre vitrine !</span>
              </div>
              <button
                onClick={() => {
                  setTargetPlanForPricing('standard');
                  setPricingModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
              >
                Activer Pass Vendeur
              </button>
            </div>
          )}

          {/* Main Tabs: Articles vs Avis Clients */}
          <div className="mt-6 flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  activeTab === 'products'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Articles & Vitrine ({shopProducts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Avis & Notes Clients ({shopReviews.length})</span>
              </button>
            </div>

            {/* Customer Support direct contact */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('bradci_open_support', { detail: { tab: 'human' } }))}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
            >
              <span>Contacter Support Brad'CI</span>
            </button>
          </div>

          {activeTab === 'products' ? (
            <>
              {/* Product Filter Sub-tabs */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Tous ({shopProducts.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('active')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeFilter === 'active'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Enchères en cours ({shopProducts.filter(p => p.status === 'active' || p.status === 'pending_choice').length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('sold')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeFilter === 'sold'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Vendus ({shopProducts.filter(p => p.status === 'sold' || p.status === 'delivered').length})
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                  {filteredProducts.length} article(s) affiché(s)
                </span>
              </div>

          {/* Store Products Grid */}
          <div className="mt-5">
            {filteredProducts.length === 0 ? (
              <div className="p-10 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-bold">Aucun article dans cette section pour le moment.</p>
                <p className="text-xs text-slate-500 mt-1">Revenez très vite pour découvrir les prochaines enchères de {shop.name}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((prod) => {
                  const isShopListing = prod.listingType === 'shop' || Boolean(prod.shopId);
                  const isOutOfStock = Boolean(prod.isOutOfStock || (isShopListing && prod.stockQuantity !== undefined && prod.stockQuantity <= 0));

                  return (
                    <div
                      key={prod.id}
                      onClick={() => setProductDetailModal(prod)}
                      className={`group bg-[#0E1524] border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl flex flex-col justify-between ${
                        isOutOfStock 
                          ? 'border-red-900/40 opacity-85 hover:border-red-500/50' 
                          : 'border-slate-800 hover:border-amber-500/50 hover:shadow-amber-500/5'
                      }`}
                    >
                      <div>
                        {/* Image Thumbnail with Tag */}
                        <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                          <img
                            src={prod.images[0]}
                            alt={prod.title}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                              isOutOfStock ? 'grayscale-[40%]' : ''
                            }`}
                          />
                          <div className="absolute top-2 left-2">
                            {isOutOfStock ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded shadow bg-red-600 text-white border border-red-400/40">
                                Stock Épuisé
                              </span>
                            ) : (
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded shadow ${
                                isShopListing 
                                  ? 'bg-emerald-500 text-slate-950'
                                  : prod.status === 'active' ? 'bg-amber-500 text-slate-950' :
                                    prod.status === 'pending_choice' ? 'bg-amber-400 text-slate-950' :
                                    'bg-slate-800 text-slate-300'
                              }`}>
                                {isShopListing ? 'Boutique' : prod.status === 'active' ? 'Enchère Active' :
                                 prod.status === 'pending_choice' ? '5 Enchérisseurs' : 'Vendu'}
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                            {isShopListing ? (
                              isOutOfStock ? 'Bientôt disponible' : `${prod.stockQuantity ?? 1} en stock`
                            ) : (
                              `${prod.bids.length} offre(s)`
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{prod.category}</span>
                            <span className="flex items-center gap-1 text-emerald-400">
                              <MapPin className="w-3 h-3" />
                              <span>{prod.commune}</span>
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                            {prod.title}
                          </h4>

                          {isOutOfStock && (
                            <p className="text-[11px] text-red-400 font-semibold">
                              Stock épuisé • Nouveau stock disponible bientôt
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block">
                                {isShopListing ? 'Prix garanti :' : 'Prix actuel :'}
                              </span>
                              <span className={`text-base font-extrabold font-mono-num ${
                                isShopListing ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                {(prod.buyNowPrice || prod.currentPrice).toLocaleString('fr-FR')} F
                              </span>
                            </div>

                            <div className="flex flex-col items-end">
                              {prod.soldCount ? (
                                <span className="text-[10px] text-slate-400 font-medium mb-1">
                                  {prod.soldCount} vendu{prod.soldCount > 1 ? 's' : ''}
                                </span>
                              ) : null}
                              <span className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1 ${
                                isOutOfStock 
                                  ? 'bg-slate-900 text-slate-400'
                                  : 'bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300'
                              }`}>
                                <Gavel className="w-3.5 h-3.5" />
                                <span>{isOutOfStock ? 'Détails' : 'Voir'}</span>
                              </span>
                            </div>
                          </div>

                          {isShopListing && !isOutOfStock && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(prod, 1, 'boutique');
                                  setCartModalOpen(true);
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>{translate("Ajouter au Panier", "Add to Cart")}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Reviews Tab */
        <div className="mt-5 space-y-4 animate-in fade-in">
          {/* Average Rating Summary */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-amber-400 font-mono-num">
                {shop.rating.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(shop.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Basé sur {shopReviews.length || shop.salesCount || 12} évaluations d'acheteurs vérifiés
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800 text-center sm:text-right">
              <span className="text-emerald-400 font-bold block">✓ Avis Certifiés Brad'CI</span>
              <span>Filtrage anti-injures & conformité livraison</span>
            </div>
          </div>

          {/* Review List */}
          {shopReviews.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-2">
              <Star className="w-8 h-8 text-amber-400/50 mx-auto" />
              <p className="text-sm font-bold text-slate-300">Cette boutique maintient un score exemplaire de {shop.rating.toFixed(1)}/5</p>
              <p className="text-xs text-slate-500">Les avis des prochaines commandes livrées s'afficheront directement ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shopReviews.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400">
                        {r.authorName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{r.authorName}</span>
                        <span className="text-[10px] text-slate-500">{r.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= r.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic">
                    "{r.comment}"
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ Achat Vérifié Brad'CI Séquestre
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
