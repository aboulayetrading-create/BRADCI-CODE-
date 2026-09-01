import React, { useState } from 'react';
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
  ExternalLink 
} from 'lucide-react';
import { generateReceiptPDF, openReceiptInPrintWindow, PaymentAuditLog, TransactionAuditInput } from '../utils/paymentAuditReceiptService';

export interface ReceiptModalData {
  transactionData: TransactionAuditInput;
  auditLog: PaymentAuditLog;
}

export const ReceiptModal: React.FC = () => {
  const { receiptModalData, setReceiptModalData, addToast, translate } = useApp();
  const [copiedHash, setCopiedHash] = useState(false);

  if (!receiptModalData) return null;

  const { transactionData, auditLog } = receiptModalData;
  const receiptHtml = generateReceiptPDF(transactionData, auditLog);

  const handlePrint = () => {
    openReceiptInPrintWindow(receiptHtml);
    addToast('Impression en cours', 'La fenêtre d\'impression du reçu BRAD\'CI a été ouverte.', 'info');
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recu_Officiel_${auditLog.auditId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Téléchargement terminé', 'Le reçu officiel sécurisé a été téléchargé.', 'success');
  };

  const copyShaHash = () => {
    navigator.clipboard.writeText(auditLog.sha256Signature);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    addToast('Empreinte copiée', 'L\'empreinte SHA-256 a été copiée dans votre presse-papier.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0B1021] border border-[#222D4A] rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto text-white space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222D4A]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#1E53E5]/20 text-[#1E53E5] border border-[#1E53E5]/40 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>{translate("Reçu Officiel & Preuve de Propriété", "Official Receipt & Title Proof")}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Conforme CI
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {auditLog.auditId}
              </p>
            </div>
          </div>

          <button
            onClick={() => setReceiptModalData(null)}
            className="p-1.5 rounded-xl bg-[#151C33] border border-[#222D4A] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Simulation Frame */}
        <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-6 shadow-inner text-xs space-y-4 border border-slate-200">
          {/* Header Paper */}
          <div className="flex justify-between items-start border-b-2 border-[#1E53E5] pb-3">
            <div>
              <div className="text-xl font-black text-slate-950 tracking-tight">
                BRAD<span className="text-[#FF5B00]">'</span><span className="text-[#1E53E5]">CI</span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Paiement Direct à la Livraison • Sécurité Occasion
              </div>
              <div className="text-[9px] text-slate-400">Abidjan, Côte d'Ivoire</div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                ✓ Validé
              </span>
              <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                REC-{auditLog.auditId.slice(-8)}
              </div>
              <div className="text-[10px] text-slate-500">
                {new Date(transactionData.timestamp).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          {/* KYC Seller & Buyer Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-[#1E53E5] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vendeur Certifié KYC (Origine Légale)</span>
              </div>
              <div className="font-bold text-slate-900">{transactionData.sellerName}</div>
              <div className="text-slate-600 text-[11px]">{transactionData.sellerPhone}</div>
              <div className="text-slate-600 text-[11px]">CNI / Passeport : <span className="font-mono font-bold text-slate-800">{transactionData.sellerKycMaskedId}</span></div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                🛡️ Propriété & identité vérifiées
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-600">
                Acheteur & Destination
              </div>
              <div className="font-bold text-slate-900">{transactionData.buyerName}</div>
              <div className="text-slate-600 text-[11px]">{transactionData.buyerPhone}</div>
              <div className="text-slate-600 text-[11px]">Lieu : <span className="font-bold">{transactionData.communeDestination}</span></div>
              <div className="text-slate-600 text-[11px]">Règlement : <span className="font-bold">{transactionData.provider}</span></div>
            </div>
          </div>

          {/* Product and Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-1.5 font-bold text-[11px] flex justify-between">
              <span>Article & Prestations</span>
              <span>Montant</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-start font-semibold">
                <div>
                  <div>{transactionData.itemTitle}</div>
                  <div className="text-[10px] text-slate-500 font-normal">Catégorie: {transactionData.itemCategory}</div>
                </div>
                <div className="font-mono font-bold">{transactionData.itemPriceFCFA.toLocaleString('fr-FR')} F</div>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Course livreur express ({transactionData.communeOrigin} ➔ {transactionData.communeDestination})</span>
                <span className="font-mono">{transactionData.deliveryFeeFCFA.toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Frais de sécurisation & plateforme</span>
                <span className="font-mono">{transactionData.platformFeeFCFA.toLocaleString('fr-FR')} F</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-[#FF5B00]">
                <span>TOTAL RÉGLÉ À LA LIVRAISON :</span>
                <span className="font-mono">{transactionData.amountTotalFCFA.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          {/* OTP confirmation */}
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              <span className="text-[11px] font-bold text-emerald-800">Code Secret OTP Validé par le Livreur :</span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-700 text-white font-mono font-black rounded-lg text-sm tracking-widest">
              {transactionData.deliveryOtpCode}
            </span>
          </div>

          {/* Cryptographic Hash Seal */}
          <div className="p-3 bg-slate-900 text-slate-300 rounded-xl text-[10px] space-y-1 font-mono">
            <div className="text-[#38BDF8] font-bold flex items-center justify-between">
              <span>EMPREINTE CRYPTOGRAPHIQUE SHA-256 :</span>
              <button 
                onClick={copyShaHash}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
            <div className="text-emerald-400 break-all">{auditLog.sha256Signature}</div>
            <div className="text-slate-400 text-[9px] pt-1">
              Horodatage : {auditLog.timestamp} • Sceau : {auditLog.tamperProofStamp}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            onClick={handleDownloadHtml}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{translate("Télécharger Reçu (HTML/PDF)", "Download Receipt (HTML/PDF)")}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E53E5] to-[#1644C4] hover:from-[#1644C4] hover:to-[#1236A0] text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{translate("Imprimer / Exporter PDF", "Print / Export PDF")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
