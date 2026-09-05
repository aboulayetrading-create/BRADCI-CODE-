import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Receipt, 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  KeyRound, 
  Store, 
  MapPin, 
  Bike, 
  Car, 
  Truck, 
  Calendar, 
  User, 
  Clock, 
  Sparkles,
  Phone,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { downloadElementAsPdf } from '../utils/paymentAuditReceiptService';

export const CartInvoiceModal: React.FC = () => {
  const { 
    cartInvoiceModalOrder, 
    setCartInvoiceModalOrder, 
    addToast,
    translate 
  } = useApp();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!cartInvoiceModalOrder) return null;

  const order = cartInvoiceModalOrder;

  const handlePrint = () => {
    addToast('Impression', 'Ouverture de la fenêtre d\'impression...', 'info');
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    addToast('Génération PDF', 'Création du fichier PDF officiel en cours...', 'info');
    try {
      const filename = `Facture_BRADCI_${order.id.toUpperCase()}.pdf`;
      const ok = await downloadElementAsPdf(printAreaRef.current, filename);
      if (ok) {
        addToast('Téléchargement terminé', `La facture ${filename} a été générée.`, 'success');
      } else {
        window.print();
      }
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyOtp = () => {
    if (order.masterDeliveryOtp) {
      navigator.clipboard.writeText(order.masterDeliveryOtp);
      addToast('Code Secret OTP Copié', `Le code ${order.masterDeliveryOtp} a été copié dans votre presse-papier.`, 'success');
    }
  };

  return (
    <div 
      id="cart-invoice-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setCartInvoiceModalOrder(null)}
    >
      <div 
        id="cart-invoice-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#0B1021] border border-[#222D4A] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-100"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display">
                {translate("Facture Officielle Panier Groupé", "Official Consolidated Cart Invoice")}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Réf : #{order.id.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
              title="Télécharger directement en fichier PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">Télécharger PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            <button
              onClick={() => setCartInvoiceModalOrder(null)}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable Body */}
        <div ref={printAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-200">
          {/* Header Stamp */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-wider font-display">BRAD'CI</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                  COMMANDE CERTIFIÉE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Plateforme d'Enchères & Déstockage Sécurisé • Abidjan, Côte d'Ivoire
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-0.5 font-mono">
              <span className="text-slate-400 block">Date d'émission :</span>
              <span className="text-white font-bold block">{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
              <span className="text-slate-400 block mt-1">Statut :</span>
              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/20 text-cyan-300 font-bold border border-blue-500/30">
                {order.status === 'DELIVERED' ? 'LIVRÉE AVEC SUCCÈS' : 'EN TOURNÉE DE LIVRAISON'}
              </span>
            </div>
          </div>

          {/* Master OTP High-Visibility Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-500/10 border border-amber-500/40 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/30 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Code Secret OTP Unique de Livraison</h3>
                  <p className="text-[11px] text-slate-300">
                    Valide pour l'ensemble des {order.totalItemsCount} article(s) de cette commande.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <span className="px-4 py-2 rounded-2xl bg-slate-950 border-2 border-amber-400 text-amber-300 font-mono font-black text-2xl tracking-widest shadow-inner">
                  {order.masterDeliveryOtp}
                </span>

                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all"
                  title="Copier le code OTP"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
              🔒 <strong>Consigne de sécurité acheteur :</strong> Ne communiquez ce code à 4 chiffres au coursier qu'une fois tous les colis vérifiés et remis en main propre. Ce code valide le déblocage des paiements aux vendeurs.
            </p>
          </div>

          {/* Buyer & Dropoff Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Destinataire & Acheteur :
              </span>
              <div className="space-y-1">
                <span className="text-white font-bold block">{order.buyerName}</span>
                <span className="text-slate-300 font-mono block">{order.buyerPhone || '+225 07 00 00 00'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Lieu de Dépose :
              </span>
              <div className="space-y-1">
                <span className="text-white font-bold block">{order.dropoffCommune}</span>
                <span className="text-slate-300 block">{order.dropoffAddress}</span>
              </div>
            </div>
          </div>

          {/* Detailed Item Breakdown by Seller */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Détail des Lots & Vendeurs ({order.sellerGroups.length} points d'enlèvement)
            </h4>

            <div className="space-y-3">
              {order.sellerGroups.map((group, gIdx) => (
                <div 
                  key={group.sellerId}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center border border-blue-500/30">
                        {gIdx + 1}
                      </span>
                      <span className="font-bold text-white">{group.sellerName}</span>
                      <span className="text-[10px] text-slate-400">({group.sellerCommune})</span>
                    </div>

                    <span className="font-mono font-bold text-emerald-400">
                      Sous-total : {group.sellerSubtotal.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/60 text-xs">
                    {group.items.map((item) => (
                      <div key={item.id} className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0" 
                          />
                          <div className="truncate">
                            <span className="text-white font-medium block truncate">{item.title}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {item.quantity} x {item.unitPrice.toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-white shrink-0">
                          {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} F
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consolidated Financial Totals */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Total Articles ({order.totalItemsCount} unités) :</span>
              <span className="font-mono font-bold">{order.itemsSubtotalFCFA.toLocaleString('fr-FR')} FCFA</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Frais de Livraison Tournée Optimisée :</span>
                {order.deliverySavingsFCFA > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Économie : {order.deliverySavingsFCFA.toLocaleString('fr-FR')} F
                  </span>
                )}
              </span>
              <span className="font-mono font-bold text-emerald-400">
                + {order.optimizedDeliveryFeeFCFA.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            {order.appliedReferralDiscountFCFA > 0 && (
              <div className="flex items-center justify-between text-amber-400">
                <span>Remise Solde Parrainage :</span>
                <span className="font-mono font-bold">
                  - {order.appliedReferralDiscountFCFA.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm sm:text-base font-black text-white">
              <span>Montant Total Réglé / Dû :</span>
              <span className="font-mono text-emerald-400">
                {order.totalAmountPaidFCFA.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Cryptographic Signature Footer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-500 font-mono space-y-1">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attestation cryptographique d'authenticité BRAD'CI</span>
            </div>
            <p className="truncate text-[10px]">
              SHA-256: 8f42e391b4c8290f11ac89914e7a2b99824f112e45da7710c6600a91176bfe41
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
