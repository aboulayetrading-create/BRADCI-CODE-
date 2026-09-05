import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  FileText, 
  Printer, 
  Download, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  Copy, 
  Check, 
  UserCheck,
  Store,
  Truck,
  CreditCard,
  Building2,
  Lock,
  Loader2
} from 'lucide-react';
import { 
  generateReceiptPDF, 
  openReceiptInPrintWindow, 
  downloadElementAsPdf,
  PaymentAuditLog, 
  TransactionAuditInput,
  maskKycDocument,
  maskSensitivePhone,
  resolvePaymentCategory
} from '../utils/paymentAuditReceiptService';

export interface ReceiptModalData {
  transactionData: TransactionAuditInput;
  auditLog: PaymentAuditLog;
  initialMode?: 'buyer' | 'seller';
}

export const ReceiptModal: React.FC = () => {
  const { receiptModalData, setReceiptModalData, addToast, translate } = useApp();
  const [activeMode, setActiveMode] = useState<'buyer' | 'seller'>('buyer');
  const [copiedRef, setCopiedRef] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const paperPreviewRef = useRef<HTMLDivElement>(null);

  // Sync mode when modal data changes
  React.useEffect(() => {
    if (receiptModalData?.initialMode) {
      setActiveMode(receiptModalData.initialMode);
    } else {
      setActiveMode('buyer');
    }
  }, [receiptModalData]);

  if (!receiptModalData) return null;

  const { transactionData, auditLog } = receiptModalData;
  const currentReceiptHtml = generateReceiptPDF(transactionData, auditLog, activeMode);

  const purchaseType = transactionData.purchaseType || 'Boutique';
  const quantity = transactionData.quantity || 1;
  const unitPrice = transactionData.unitPriceFCFA || (transactionData.itemPriceFCFA / quantity);
  const paymentMethodCategory = transactionData.paymentMethodType || resolvePaymentCategory(transactionData.provider);
  const maskedSellerKyc = maskKycDocument(transactionData.sellerKycMaskedId);
  const maskedBuyerKyc = maskKycDocument(transactionData.buyerKycMaskedId);
  const maskedBuyerPhone = maskSensitivePhone(transactionData.buyerPhone);

  const grossAmount = transactionData.sellerGrossAmount || transactionData.itemPriceFCFA;
  const commissionPercent = transactionData.commissionPercent !== undefined ? transactionData.commissionPercent : 5;
  const commissionAmount = transactionData.commissionAmount !== undefined ? transactionData.commissionAmount : Math.round(grossAmount * (commissionPercent / 100));
  const netAmount = transactionData.sellerNetAmount !== undefined ? transactionData.sellerNetAmount : Math.max(0, grossAmount - commissionAmount);
  const deliveryStatus = transactionData.deliveryStatus || 'Livré';

  const txUniqueNumber = `TX-BRAD-${new Date(transactionData.timestamp).getFullYear()}-${(transactionData.transactionId || '1001').replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')}`;
  const saleRef = `VNT-BRAD-${new Date(transactionData.timestamp).getFullYear()}-${(transactionData.transactionId || '5001').replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')}`;

  const formattedDate = new Date(transactionData.timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = new Date(transactionData.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    addToast(
      'Impression officielle', 
      `Préparation du document ${activeMode === 'buyer' ? 'Acheteur' : 'Vendeur'} pour impression / export PDF...`, 
      'info'
    );
    openReceiptInPrintWindow(currentReceiptHtml);
  };

  const handleDownloadPdf = async () => {
    const filename = activeMode === 'buyer'
      ? `Recu_Acheteur_${txUniqueNumber}.pdf`
      : `Attestation_Vente_${saleRef}.pdf`;

    if (paperPreviewRef.current) {
      setIsGeneratingPdf(true);
      addToast('Génération PDF', 'Génération du fichier PDF officiel en cours...', 'info');
      try {
        const success = await downloadElementAsPdf(paperPreviewRef.current, filename);
        if (success) {
          addToast('PDF Prêt', `Le reçu officiel ${filename} a été téléchargé avec succès.`, 'success');
        } else {
          // Fallback to HTML document
          handleDownloadHtml();
        }
      } catch (err) {
        console.error('PDF error, falling back:', err);
        handleDownloadHtml();
      } finally {
        setIsGeneratingPdf(false);
      }
    } else {
      handleDownloadHtml();
    }
  };

  const handleDownloadHtml = () => {
    const filename = activeMode === 'buyer'
      ? `Recu_Acheteur_${txUniqueNumber}.html`
      : `Attestation_Vente_${saleRef}.html`;

    const blob = new Blob([currentReceiptHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Téléchargement terminé', `Le document officiel ${filename} a été généré.`, 'success');
  };

  const copyRefCode = () => {
    const code = activeMode === 'buyer' ? txUniqueNumber : saleRef;
    navigator.clipboard.writeText(code);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    addToast('Référence copiée', `La référence ${code} a été copiée dans le presse-papier.`, 'info');
  };

  return (
    <div 
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto"
      onClick={() => setReceiptModalData(null)}
    >
      <div 
        id="receipt-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#0B1021] border border-[#222D4A] rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] overflow-y-auto text-white space-y-4"
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222D4A]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E53E5]/20 to-[#FF5B00]/20 text-[#1E53E5] border border-[#1E53E5]/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{translate("Module Reçus & Factures BRAD'CI", "BRAD'CI Receipts & Invoices Module")}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Conforme OHADA / CI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Génération automatique • {activeMode === 'buyer' ? txUniqueNumber : saleRef}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                id="btn-tab-buyer-receipt"
                onClick={() => setActiveMode('buyer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMode === 'buyer' 
                    ? 'bg-[#1E53E5] text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Reçu Acheteur</span>
              </button>

              <button
                id="btn-tab-seller-receipt"
                onClick={() => setActiveMode('seller')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMode === 'seller' 
                    ? 'bg-[#FF5B00] text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Reçu Vendeur</span>
              </button>
            </div>

            <button
              id="btn-close-receipt-modal"
              onClick={() => setReceiptModalData(null)}
              className="p-2 rounded-xl bg-[#151C33] border border-[#222D4A] text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Simulation Frame (Pure Accounting Document - No Technical Artifacts) */}
        <div 
          ref={paperPreviewRef}
          id="receipt-paper-preview-container"
          className="bg-white text-slate-900 rounded-2xl p-5 sm:p-8 shadow-2xl text-xs space-y-5 border border-slate-200"
        >
          {/* Header Paper */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 pb-4 gap-4" style={{ borderColor: activeMode === 'buyer' ? '#1E53E5' : '#FF5B00' }}>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                BRAD<span className="text-[#FF5B00]">'</span><span className="text-[#1E53E5]">CI</span>
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mt-0.5">
                Plateforme Certifiée d'Occasion & Déstockage • Abidjan, Côte d'Ivoire
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                RCCM : CI-ABJ-2026-B-1428 • Régime Fiscal Vente Particulier / Micro-Entreprise
              </div>
            </div>

            <div className="sm:text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                activeMode === 'buyer' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {activeMode === 'buyer' ? '✓ Transaction Validée & Payée' : `✓ ${deliveryStatus.toUpperCase()}`}
              </span>
              <div className="text-sm font-black text-slate-900 mt-1.5 uppercase font-display">
                {activeMode === 'buyer' ? "Reçu d'Achat & Facture Acquéreur" : "Attestation & Bordereau Vendeur"}
              </div>
              <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                <span className="font-mono text-xs font-extrabold text-blue-700">
                  {activeMode === 'buyer' ? txUniqueNumber : saleRef}
                </span>
                <button
                  onClick={copyRefCode}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                  title="Copier la référence"
                >
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Date : {formattedDate} à {formattedTime}
              </div>
            </div>
          </div>

          {/* Parties 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 1: Seller Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-[#1E53E5] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Vendeur Partenaire Certifié</span>
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  KYC Vérifié
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900">{transactionData.sellerName}</div>
              {transactionData.sellerShopName && (
                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Store className="w-3 h-3 text-amber-600" />
                  <span>Boutique : {transactionData.sellerShopName}</span>
                </div>
              )}
              <div className="text-slate-600 text-[11px]">Téléphone : {transactionData.sellerPhone}</div>
              <div className="text-slate-600 text-[11px] flex items-center gap-1 pt-1 border-t border-slate-200">
                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Pièce ID (Confidentialité) : <strong className="font-mono text-slate-900 bg-white px-1.5 py-0.2 rounded border border-slate-200">{maskedSellerKyc}</strong></span>
              </div>
              <div className="text-slate-500 text-[10px]">
                Origine : {transactionData.communeOrigin} (Abidjan)
              </div>
            </div>

            {/* Box 2: Buyer Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Client Acquéreur</span>
                </span>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                  Paiement Garanti
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900">{transactionData.buyerName}</div>
              <div className="text-slate-600 text-[11px]">
                Téléphone : {activeMode === 'buyer' ? transactionData.buyerPhone : maskedBuyerPhone}
              </div>
              <div className="text-slate-600 text-[11px] flex items-center gap-1 pt-1 border-t border-slate-200">
                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Pièce ID (Confidentialité) : <strong className="font-mono text-slate-900 bg-white px-1.5 py-0.2 rounded border border-slate-200">{maskedBuyerKyc}</strong></span>
              </div>
              <div className="text-slate-500 text-[10px]">
                Destination : {transactionData.communeDestination} (Abidjan)
              </div>
            </div>
          </div>

          {/* Mode-Specific Body */}
          {activeMode === 'buyer' ? (
            /* ================= BUYER VIEW ================= */
            <div className="space-y-4">
              {/* Order Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-white px-4 py-2 font-black text-[11px] uppercase tracking-wider flex justify-between">
                  <span>Désignation de la Commande</span>
                  <div className="flex gap-8">
                    <span className="hidden sm:inline">Type</span>
                    <span>Qté</span>
                    <span className="text-right">Montant</span>
                  </div>
                </div>
                <div className="p-4 space-y-3 divide-y divide-slate-100">
                  <div className="flex justify-between items-start font-semibold">
                    <div className="space-y-1 pr-3">
                      <div className="text-sm font-black text-slate-900">{transactionData.itemTitle}</div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-700">
                          Catégorie : {transactionData.itemCategory}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-black uppercase text-blue-700 bg-blue-50 border border-blue-200">
                          {purchaseType}
                        </span>
                        <span className="text-slate-500 font-mono">
                          ID : {transactionData.itemId || transactionData.transactionId}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-sm text-slate-900">
                        {transactionData.itemPriceFCFA.toLocaleString('fr-FR')} FCFA
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {quantity} × {Math.round(unitPrice).toLocaleString('fr-FR')} F
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between text-slate-600 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Livraison sécurisée par coursier ({transactionData.communeOrigin} ➔ {transactionData.communeDestination})</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">{transactionData.deliveryFeeFCFA.toLocaleString('fr-FR')} FCFA</span>
                  </div>

                  <div className="pt-2 flex justify-between text-slate-600 text-xs">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Frais techniques de protection d'achat et séquestre BRAD'CI</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">{transactionData.platformFeeFCFA.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Payment & Totals Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Method Badge Box */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Mode de Règlement Validé</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    {paymentMethodCategory} ({transactionData.provider})
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    Réf. Transaction : <strong>{transactionData.externalProviderId}</strong>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-bold pt-1 border-t border-blue-200/60">
                    ✓ Fonds débités & sécurisés sous séquestre BRAD'CI
                  </p>
                </div>

                {/* Accounting Totals Box */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Sous-total Article(s) :</span>
                    <span className="font-mono font-bold">{transactionData.itemPriceFCFA.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Frais de livraison :</span>
                    <span className="font-mono">{transactionData.deliveryFeeFCFA.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Sécurisation & plateforme :</span>
                    <span className="font-mono">{transactionData.platformFeeFCFA.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-black text-amber-400 uppercase">TOTAL RÉGLÉ (TTC) :</span>
                    <span className="text-base font-black font-mono text-[#FF5B00]">
                      {transactionData.amountTotalFCFA.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery OTP Validation */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      Code Secret OTP de Déblocage Physique :
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Vérifié et validé avec le coursier à la livraison du colis
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-700 text-white font-mono font-black rounded-lg text-sm tracking-widest">
                  {transactionData.deliveryOtpCode || '8814'}
                </span>
              </div>
            </div>
          ) : (
            /* ================= SELLER VIEW ================= */
            <div className="space-y-4">
              {/* Product and Delivery Status Strip */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-500">Article Vendu</div>
                    <div className="text-sm font-black text-slate-900">{transactionData.itemTitle}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Réf Article : {transactionData.itemId || transactionData.transactionId} • Canal : {purchaseType}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Statut de Livraison</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                      deliveryStatus === 'Livré' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : deliveryStatus === 'En cours de livraison'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {deliveryStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Accounting Settlement Grid */}
              <div className="border-2 border-orange-200 bg-orange-50/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-orange-200/80">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase">
                    <Building2 className="w-4 h-4 text-[#FF5B00]" />
                    <span>Décompte Financier de la Vente (Bordereau Vendeur)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Validé & Crédité
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      1. Montant Brut Vente
                    </span>
                    <span className="font-mono text-base font-black text-slate-900">
                      {grossAmount.toLocaleString('fr-FR')} F
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Prix de l'article</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-red-200 shadow-sm">
                    <span className="text-[10px] font-bold text-red-600 uppercase block mb-1">
                      2. Commission (-{commissionPercent}%)
                    </span>
                    <span className="font-mono text-base font-black text-red-600">
                      - {commissionAmount.toLocaleString('fr-FR')} F
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Frais de service plateforme</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                      3. Montant Net Crédité
                    </span>
                    <span className="font-mono text-base font-black text-emerald-700">
                      {netAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">
                      Disponible pour Retrait Wave / Orange
                    </span>
                  </div>
                </div>
              </div>

              {/* Privacy Notice for Seller */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-[10px] text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Protection de la vie privée :</strong> Conformément à la législation sur les données personnelles, les coordonnées sensibles de l'acheteur sont masquées pour garantir la neutralité et la sécurité de l'échange.
                </span>
              </div>
            </div>
          )}

          {/* Official Stamp & Certificate Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-500">
            <div>
              <strong>BRAD'CI SAS</strong> • Registre Numérique Certifié • Abidjan, Côte d'Ivoire<br />
              Attestation d'acquisition officielle conforme au cadre légal du commerce électronique en Côte d'Ivoire.
            </div>
            <div className="px-3 py-1.5 rounded-lg border-2 border-emerald-600 text-emerald-800 font-black text-[10px] uppercase text-center tracking-wider shrink-0">
              ✓ DOCUMENT OFFICIEL CERTIFIÉ CONFORME
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Document immuable scellé par BRAD'CI</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-download-receipt-pdf"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 disabled:opacity-50 shadow-sm"
              title="Télécharger directement le fichier PDF (.pdf)"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Génération PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>{translate("Télécharger le reçu (PDF)", "Download Receipt (PDF)")}</span>
                </>
              )}
            </button>

            <button
              id="btn-print-receipt-modal"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E53E5] to-[#1644C4] hover:from-[#1644C4] hover:to-[#1236A0] text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              title="Imprimer ou enregistrer au format PDF via l'imprimante système"
            >
              <Printer className="w-4 h-4" />
              <span>{translate("Imprimer / Exporter PDF", "Print / Export PDF")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
