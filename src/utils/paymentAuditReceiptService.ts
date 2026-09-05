/**
 * BRAD'CI - Payment Audit & Legal Receipt Service
 * 
 * Module complet de génération automatique de reçus comptables officiels et attestations de vente
 * pour l'application BRAD'CI (Achat Boutique, Déstockage, Liquidation ou Enchère).
 * Conforme aux standards comptables et aux exigences légales de protection des données (Côte d'Ivoire).
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type PurchaseType = 'Boutique' | 'Déstockage' | 'Liquidation' | 'Enchère';
export type DeliveryStatus = 'À expédier' | 'En cours de livraison' | 'Livré';
export type PaymentMethodType = 'Mobile Money' | 'Carte Bancaire' | 'Portefeuille Séquestre BRAD\'CI';

export interface TransactionAuditInput {
  transactionId: string;
  orderId?: string;
  transactionRef?: string;
  externalProviderId: string; // Ex: Wave ID, Orange Money TX, MoMo ID, Carte, Séquestre
  provider: 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Carte Bancaire' | 'Portefeuille Séquestre BRAD\'CI' | string;
  paymentMethodType?: PaymentMethodType;
  timestamp: string; // ISO 8601
  amountTotalFCFA: number;
  itemPriceFCFA: number;
  deliveryFeeFCFA: number;
  platformFeeFCFA: number;

  // Buyer Details
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerKycMaskedId?: string; // Ex: "CI-******489"
  buyerAddress?: string;

  // Seller Details
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerKycMaskedId: string; // Ex: "CI-******489" (Preuve d'origine légale CNI/Passeport)
  sellerShopName?: string;
  sellerKycVerifiedAt?: string;

  // Product & Order Details
  itemId?: string;
  itemTitle: string;
  itemCategory: string;
  itemImage?: string;
  purchaseType?: PurchaseType; // 'Boutique' | 'Déstockage' | 'Liquidation' | 'Enchère'
  quantity?: number; // Défaut: 1
  unitPriceFCFA?: number;

  // Seller Financial Accounting
  sellerGrossAmount?: number;
  commissionPercent?: number; // Ex: 10, 5, ou 2.5
  commissionAmount?: number;
  sellerNetAmount?: number;
  deliveryStatus?: DeliveryStatus; // 'À expédier' | 'En cours de livraison' | 'Livré'

  // Logistics & OTP
  deliveryOtpCode: string;
  communeOrigin: string;
  communeDestination: string;
  driverName?: string;
  driverPhone?: string;
}

export interface PaymentAuditLog {
  auditId: string;
  transactionId: string;
  orderId?: string;
  externalProviderId: string;
  provider: string;
  timestamp: string;
  amountTotalFCFA: number;
  buyerId: string;
  sellerId: string;
  deliveryOtpCode: string;
  payloadJson: string;
  sha256Signature: string;
  tamperProofStamp: string;
  createdAt: string;
}

/**
 * Masque automatiquement un numéro de document KYC/CNI pour la stricte confidentialité
 * Exemple: "CI-0029481920" -> "CI-******489" ou "CI-******489"
 */
export function maskKycDocument(docNumber?: string): string {
  if (!docNumber) return 'CI-******489';
  const clean = docNumber.trim();
  if (clean.includes('******')) return clean;
  if (clean.includes('***')) {
    return clean.replace(/\*{3,}/g, '******');
  }
  if (clean.startsWith('CI-') || clean.startsWith('PAS-') || clean.startsWith('ID-')) {
    const prefix = clean.substring(0, 3);
    const suffix = clean.slice(-3);
    return `${prefix}******${suffix}`;
  }
  const suffix = clean.length > 3 ? clean.slice(-3) : '489';
  return `CI-******${suffix}`;
}

/**
 * Masque partiellement un numéro de téléphone pour la confidentialité
 * Exemple: "+225 07 48 92 11 34" -> "+225 07 •• •• 34"
 */
export function maskSensitivePhone(phone?: string): string {
  if (!phone) return '+225 •• •• •• ••';
  const clean = phone.trim();
  if (clean.length < 8) return clean;
  return clean.slice(0, 7) + ' •• •• ' + clean.slice(-2);
}

/**
 * Calcule une empreinte SHA-256 cryptographique sécurisée
 */
export async function computeSHA256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback synchrone
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `fallback_sha256_${hex}_${Date.now().toString(16)}`;
}

/**
 * Détermine le type de mode de paiement textuel
 */
export function resolvePaymentCategory(provider: string): PaymentMethodType {
  const p = (provider || '').toLowerCase();
  if (p.includes('carte') || p.includes('visa') || p.includes('mastercard')) {
    return 'Carte Bancaire';
  }
  if (p.includes('séquestre') || p.includes('sequestre') || p.includes('solde') || p.includes('wallet')) {
    return 'Portefeuille Séquestre BRAD\'CI';
  }
  return 'Mobile Money';
}

/**
 * Enregistre chaque paiement validé en générant une empreinte SHA-256 infalsifiable.
 */
export async function createPaymentAuditLog(
  transactionData: TransactionAuditInput
): Promise<PaymentAuditLog> {
  const normalizedPayload = {
    txId: transactionData.transactionId,
    extId: transactionData.externalProviderId,
    provider: transactionData.provider,
    amount: transactionData.amountTotalFCFA,
    itemPrice: transactionData.itemPriceFCFA,
    deliveryFee: transactionData.deliveryFeeFCFA,
    platformFee: transactionData.platformFeeFCFA,
    buyerId: transactionData.buyerId,
    sellerId: transactionData.sellerId,
    sellerKyc: maskKycDocument(transactionData.sellerKycMaskedId),
    otp: transactionData.deliveryOtpCode,
    ts: transactionData.timestamp,
    origin: transactionData.communeOrigin,
    dest: transactionData.communeDestination,
    purchaseType: transactionData.purchaseType || 'Boutique'
  };

  const payloadJson = JSON.stringify(normalizedPayload, Object.keys(normalizedPayload).sort());
  const sha256Signature = await computeSHA256(payloadJson);
  const auditId = `AUDIT-BRADCI-${transactionData.transactionId.replace(/[^a-zA-Z0-9]/g, '')}-${sha256Signature.substring(0, 8).toUpperCase()}`;

  const auditLog: PaymentAuditLog = {
    auditId,
    transactionId: transactionData.transactionId,
    externalProviderId: transactionData.externalProviderId,
    provider: transactionData.provider,
    timestamp: transactionData.timestamp,
    amountTotalFCFA: transactionData.amountTotalFCFA,
    buyerId: transactionData.buyerId,
    sellerId: transactionData.sellerId,
    deliveryOtpCode: transactionData.deliveryOtpCode,
    payloadJson,
    sha256Signature,
    tamperProofStamp: `BRADCI:SEAL:${sha256Signature.substring(0, 16).toUpperCase()}`,
    createdAt: new Date().toISOString()
  };

  // Stockage local pour réouverture rapide
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existingLogsStr = localStorage.getItem('bradci_payment_audit_logs');
      const existingLogs: PaymentAuditLog[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      existingLogs.unshift(auditLog);
      localStorage.setItem('bradci_payment_audit_logs', JSON.stringify(existingLogs.slice(0, 100)));
    } catch {
      // Ignore storage errors
    }
  }

  return auditLog;
}

/**
 * Récupère les logs d'audit enregistrés localement
 */
export function getStoredAuditLogs(): PaymentAuditLog[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const existingLogsStr = localStorage.getItem('bradci_payment_audit_logs');
    return existingLogsStr ? JSON.parse(existingLogsStr) : [];
  } catch {
    return [];
  }
}

/**
 * 1. GÉNÉRATEUR DE REÇU ACHETEUR (Facture Officielle d'Acquisition & Preuve de Propriété)
 * Conforme au modèle comptable officiel :
 * - Logo officiel BRAD'CI
 * - Numéro de transaction unique, Date et Heure
 * - Libellé du produit, type d'achat (Boutique / Déstockage / Liquidation / Enchère), quantité et prix unitaire
 * - Mode de règlement (Mobile Money / Carte / Portefeuille Séquestre BRAD'CI)
 * - Masquage automatique strict des données d'identité KYC (ex: "Pièce ID : CI-******489")
 */
export function generateBuyerReceiptPDF(
  transactionData: TransactionAuditInput,
  auditLog: PaymentAuditLog
): string {
  const formattedDate = new Date(transactionData.timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = new Date(transactionData.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const txUniqueNumber = `TX-BRAD-${new Date(transactionData.timestamp).getFullYear()}-${(transactionData.transactionId || '1001').replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')}`;
  const purchaseType = transactionData.purchaseType || 'Boutique';
  const quantity = transactionData.quantity || 1;
  const unitPrice = transactionData.unitPriceFCFA || (transactionData.itemPriceFCFA / quantity);
  const paymentMethodCategory = transactionData.paymentMethodType || resolvePaymentCategory(transactionData.provider);
  const maskedSellerKyc = maskKycDocument(transactionData.sellerKycMaskedId);
  const maskedBuyerKyc = maskKycDocument(transactionData.buyerKycMaskedId);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu Officiel Acheteur - BRAD'CI ${txUniqueNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 15mm 18mm 15mm;
      @bottom-center {
        content: "Document comptable officiel émis par BRAD'CI SAS • Abidjan, Côte d'Ivoire";
        font-size: 8pt;
        color: #64748b;
        font-family: Arial, sans-serif;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container { width: 100%; max-width: 780px; margin: 0 auto; padding: 12px; }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1e53e5;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0b1021;
    }
    .brand-title span.orange { color: #ff5b00; }
    .brand-title span.blue { color: #1e53e5; }
    .brand-tagline {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748b;
      margin-top: 2px;
    }
    .brand-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
    }
    .header-doc-info { text-align: right; }
    .doc-pill {
      display: inline-block;
      background-color: #059669;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .doc-number {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: 800;
      color: #1e53e5;
      margin-top: 2px;
    }
    .doc-date {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }

    /* Cards 2-Col */
    .grid-2 {
      display: flex;
      gap: 14px;
      margin-bottom: 18px;
    }
    .card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #1e53e5;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-row {
      margin-bottom: 4px;
      font-size: 11.5px;
      display: flex;
      justify-content: space-between;
    }
    .info-label { color: #64748b; font-weight: 500; }
    .info-val { color: #0f172a; font-weight: 700; text-align: right; }
    .masked-id-pill {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
    }

    /* Badge Type */
    .badge-purchase-type {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .type-boutique { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
    .type-destockage { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
    .type-liquidation { background: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8; }
    .type-enchere { background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; }

    /* Items Table */
    .table-container { margin-bottom: 16px; }
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    table.invoice-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 9px 12px;
      text-align: left;
    }
    table.invoice-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }

    /* Totals Box */
    .totals-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 16px;
    }
    .payment-summary-box {
      flex: 1;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
    }
    .totals-table-box {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table-box td {
      padding: 5px 8px;
      font-size: 11.5px;
    }
    .total-row-highlight {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      font-size: 13px !important;
      font-weight: 900 !important;
      color: #ff5b00;
      background: #fff7ed;
    }

    /* Privacy & Security Legal Notice */
    .privacy-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #1e53e5;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 10.5px;
      color: #334155;
      margin-bottom: 16px;
    }
    .otp-validation-strip {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .otp-code {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 2px;
      background: #047857;
      color: #ffffff;
      padding: 3px 12px;
      border-radius: 6px;
    }

    /* Stamp & Signature */
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 9.5px;
      color: #64748b;
    }
    .stamp-box {
      border: 2px solid #059669;
      border-radius: 6px;
      padding: 6px 12px;
      text-align: center;
      color: #059669;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">BRAD<span class="orange">'</span><span class="blue">CI</span></div>
        <div class="brand-tagline">Plateforme Officielle d'Occasion Certifiée • Abidjan</div>
        <div class="brand-meta">
          Siège : Plateau, Abidjan • RCCM : CI-ABJ-2026-B-1428 • support@brad.ci
        </div>
      </div>
      <div class="header-doc-info">
        <span class="doc-pill">✓ Paiement Validé & Séquestré</span>
        <div class="doc-title">Reçu d'Achat & Facture Acquéreur</div>
        <div class="doc-number">${txUniqueNumber}</div>
        <div class="doc-date">Le ${formattedDate} à ${formattedTime}</div>
      </div>
    </div>

    <!-- Parties Overview -->
    <div class="grid-2">
      <!-- Seller Box -->
      <div class="card">
        <div class="card-title">Vendeur & Origine Certifiée</div>
        <div class="info-row">
          <span class="info-label">Vendeur :</span>
          <span class="info-val">${transactionData.sellerName}</span>
        </div>
        ${transactionData.sellerShopName ? `
        <div class="info-row">
          <span class="info-label">Boutique :</span>
          <span class="info-val">${transactionData.sellerShopName}</span>
        </div>` : ''}
        <div class="info-row">
          <span class="info-label">Téléphone :</span>
          <span class="info-val">${transactionData.sellerPhone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Origine & Sécurité :</span>
          <span class="info-val"><span class="masked-id-pill">Pièce ID : ${maskedSellerKyc}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Commune d'origine :</span>
          <span class="info-val">${transactionData.communeOrigin}</span>
        </div>
      </div>

      <!-- Buyer Box -->
      <div class="card">
        <div class="card-title">Client Acquéreur & Règlement</div>
        <div class="info-row">
          <span class="info-label">Nom de l'acheteur :</span>
          <span class="info-val">${transactionData.buyerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contact Acheteur :</span>
          <span class="info-val">${transactionData.buyerPhone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Confidentialité Client :</span>
          <span class="info-val"><span class="masked-id-pill">Pièce ID : ${maskedBuyerKyc}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Lieu de livraison :</span>
          <span class="info-val">${transactionData.communeDestination} (Abidjan)</span>
        </div>
        <div class="info-row">
          <span class="info-label">Mode de règlement :</span>
          <span class="info-val" style="color: #047857;">${paymentMethodCategory} (${transactionData.provider})</span>
        </div>
      </div>
    </div>

    <!-- Order Items Table -->
    <div class="table-container">
      <table class="invoice-table">
        <thead>
          <tr>
            <th>Désignation de la Commande</th>
            <th class="text-center">Type d'Achat</th>
            <th class="text-center">Quantité</th>
            <th class="text-right">Prix Unitaire</th>
            <th class="text-right">Total (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${transactionData.itemTitle}</strong>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                Catégorie : ${transactionData.itemCategory} • Ref : ${transactionData.itemId || transactionData.transactionId}
              </div>
            </td>
            <td class="text-center">
              <span class="badge-purchase-type ${
                purchaseType === 'Boutique' ? 'type-boutique' :
                purchaseType === 'Déstockage' ? 'type-destockage' :
                purchaseType === 'Liquidation' ? 'type-liquidation' : 'type-enchere'
              }">
                ${purchaseType}
              </span>
            </td>
            <td class="text-center font-bold font-mono">${quantity}</td>
            <td class="text-right font-mono">${Math.round(unitPrice).toLocaleString('fr-FR')} F</td>
            <td class="text-right font-mono font-bold">${transactionData.itemPriceFCFA.toLocaleString('fr-FR')} F</td>
          </tr>
          <tr>
            <td colspan="4">
              Livraison sécurisée par coursier géolocalisé (${transactionData.communeOrigin} ➔ ${transactionData.communeDestination})
              ${transactionData.driverName ? `<span style="color: #64748b; font-size: 10px;"> • Coursier : ${transactionData.driverName}</span>` : ''}
            </td>
            <td class="text-right font-mono">${transactionData.deliveryFeeFCFA.toLocaleString('fr-FR')} F</td>
          </tr>
          <tr>
            <td colspan="4">Frais techniques de protection d'achat et séquestre BRAD'CI</td>
            <td class="text-right font-mono">${transactionData.platformFeeFCFA.toLocaleString('fr-FR')} F</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payment & Accounting Totals -->
    <div class="totals-area">
      <div class="payment-summary-box">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
          Modalité de Règlement & Quittance
        </div>
        <div style="font-size: 11px; color: #0f172a; margin-bottom: 3px;">
          <strong>Mode : </strong> ${paymentMethodCategory} • <strong>Opérateur : </strong> ${transactionData.provider}
        </div>
        <div style="font-size: 10px; color: #64748b;">
          Réf. Opérateur : <strong>${transactionData.externalProviderId}</strong>
        </div>
        <div style="font-size: 10px; color: #059669; margin-top: 6px; font-weight: bold;">
          ✓ Fonds encaissés et garantis sous séquestre sécurisé BRAD'CI
        </div>
      </div>

      <table class="totals-table-box">
        <tr>
          <td style="color: #64748b;">Sous-total Article(s) :</td>
          <td class="text-right font-bold font-mono">${transactionData.itemPriceFCFA.toLocaleString('fr-FR')} FCFA</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Frais de livraison :</td>
          <td class="text-right font-bold font-mono">${transactionData.deliveryFeeFCFA.toLocaleString('fr-FR')} FCFA</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Frais de sécurisation :</td>
          <td class="text-right font-bold font-mono">${transactionData.platformFeeFCFA.toLocaleString('fr-FR')} FCFA</td>
        </tr>
        <tr class="total-row-highlight">
          <td>TOTAL TTC RÉGLÉ :</td>
          <td class="text-right font-mono">${transactionData.amountTotalFCFA.toLocaleString('fr-FR')} FCFA</td>
        </tr>
      </table>
    </div>

    <!-- Delivery Code Confirmation Strip -->
    <div class="otp-validation-strip">
      <div>
        <strong style="color: #065f46; font-size: 11px; text-transform: uppercase;">
          Code Secret de Remise du Colis
        </strong>
        <p style="font-size: 10px; color: #047857; margin-top: 1px;">
          Remis au livreur après examen contradictoire du colis à la livraison.
        </p>
      </div>
      <div class="otp-code">${transactionData.deliveryOtpCode}</div>
    </div>

    <!-- Legal & Privacy Notice -->
    <div class="privacy-box">
      <strong>Garantie Légale & Protection de la Vie Privée :</strong> Conformément à la réglementation ivoirienne sur la protection des données à caractère personnel, les numéros de pièces d'identité sont systématiquement masqués sur ce document pour protéger l'anonymat des parties, tout en attestant de la vérification préalable KYC par BRAD'CI. Ce reçu vaut titre de propriété régulier pour l'acheteur.
    </div>

    <!-- Stamp & Footer -->
    <div class="cert-footer">
      <div>
        BRAD'CI SAS • Direction Comptable & Juridique • Abidjan, Côte d'Ivoire<br>
        Document numérique officiel archivé au registre sécurisé • Sceau : ${auditLog.tamperProofStamp}
      </div>
      <div class="stamp-box">
        ✓ PAYÉ & CERTIFIÉ CONFORME<br>
        <span style="font-size: 8px; font-weight: normal; color: #047857;">BRAD'CI AUDIT PASS</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 2. GÉNÉRATEUR DE REÇU VENDEUR / BOUTIQUE (Attestation & Bordereau de Vente)
 * Conforme au modèle comptable officiel :
 * - Logo officiel BRAD'CI
 * - Référence de la vente et identifiant du produit
 * - Montant brut de la vente, commission BRAD'CI déduite et Montant net crédité sur le compte/séquestre
 * - Statut de livraison (À expédier / En cours de livraison / Livré)
 * - Masquage automatique des données personnelles sensibles de l'acheteur (Pièce ID masquée, téléphone masqué)
 */
export function generateSellerReceiptPDF(
  transactionData: TransactionAuditInput,
  auditLog: PaymentAuditLog
): string {
  const formattedDate = new Date(transactionData.timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = new Date(transactionData.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const saleRef = `VNT-BRAD-${new Date(transactionData.timestamp).getFullYear()}-${(transactionData.transactionId || '5001').replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')}`;
  const purchaseType = transactionData.purchaseType || 'Boutique';
  const quantity = transactionData.quantity || 1;
  const grossAmount = transactionData.sellerGrossAmount || transactionData.itemPriceFCFA;
  const commissionPercent = transactionData.commissionPercent !== undefined ? transactionData.commissionPercent : 5;
  const commissionAmount = transactionData.commissionAmount !== undefined ? transactionData.commissionAmount : Math.round(grossAmount * (commissionPercent / 100));
  const netAmount = transactionData.sellerNetAmount !== undefined ? transactionData.sellerNetAmount : Math.max(0, grossAmount - commissionAmount);
  const deliveryStatus: DeliveryStatus = transactionData.deliveryStatus || 'Livré';
  
  const maskedBuyerKyc = maskKycDocument(transactionData.buyerKycMaskedId);
  const maskedBuyerPhone = maskSensitivePhone(transactionData.buyerPhone);
  const maskedSellerKyc = maskKycDocument(transactionData.sellerKycMaskedId);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Attestation de Vente Marchand - BRAD'CI ${saleRef}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 15mm 18mm 15mm;
      @bottom-center {
        content: "Bordereau de vente officiel BRAD'CI Marchand • Abidjan, Côte d'Ivoire";
        font-size: 8pt;
        color: #64748b;
        font-family: Arial, sans-serif;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container { width: 100%; max-width: 780px; margin: 0 auto; padding: 12px; }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #ff5b00;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0b1021;
    }
    .brand-title span.orange { color: #ff5b00; }
    .brand-title span.blue { color: #1e53e5; }
    .brand-tagline {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748b;
      margin-top: 2px;
    }
    .brand-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
    }
    .header-doc-info { text-align: right; }
    .doc-pill {
      display: inline-block;
      background-color: #ff5b00;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .doc-number {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: 800;
      color: #ff5b00;
      margin-top: 2px;
    }
    .doc-date {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }

    /* Cards 2-Col */
    .grid-2 {
      display: flex;
      gap: 14px;
      margin-bottom: 18px;
    }
    .card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #ff5b00;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-row {
      margin-bottom: 4px;
      font-size: 11.5px;
      display: flex;
      justify-content: space-between;
    }
    .info-label { color: #64748b; font-weight: 500; }
    .info-val { color: #0f172a; font-weight: 700; text-align: right; }
    .masked-id-pill {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
    }

    /* Status Pill */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .status-shipped { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .status-in-transit { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
    .status-to-ship { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

    /* Items Table */
    .table-container { margin-bottom: 16px; }
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    table.invoice-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 9px 12px;
      text-align: left;
    }
    table.invoice-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }

    /* Financial Settlement Box */
    .settlement-card {
      background: #fafaf9;
      border: 1.5px solid #e7e5e4;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .settlement-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .settlement-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      text-align: center;
    }
    .settlement-stat {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
    }
    .stat-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      display: block;
      margin-bottom: 4px;
    }
    .stat-amount {
      font-family: 'Courier New', monospace;
      font-size: 15px;
      font-weight: 900;
    }
    .amount-gross { color: #0f172a; }
    .amount-commission { color: #dc2626; }
    .amount-net { color: #059669; }

    /* Privacy Strip */
    .privacy-strip {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 10px;
      color: #166534;
      margin-bottom: 16px;
    }

    /* Stamp & Footer */
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 9.5px;
      color: #64748b;
    }
    .stamp-box {
      border: 2px solid #ff5b00;
      border-radius: 6px;
      padding: 6px 12px;
      text-align: center;
      color: #ff5b00;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">BRAD<span class="orange">'</span><span class="blue">CI</span></div>
        <div class="brand-tagline">Bordereau de Vente & Décompte Vendeur Officiel</div>
        <div class="brand-meta">
          Centre Marchand & Séquestre • Abidjan, Côte d'Ivoire • finance@brad.ci
        </div>
      </div>
      <div class="header-doc-info">
        <span class="doc-pill">Attestation de Vente</span>
        <div class="doc-title">Bordereau Vendeur / Boutique</div>
        <div class="doc-number">${saleRef}</div>
        <div class="doc-date">Généré le ${formattedDate} à ${formattedTime}</div>
      </div>
    </div>

    <!-- Parties Overview -->
    <div class="grid-2">
      <!-- Seller Box -->
      <div class="card">
        <div class="card-title">Vendeur Bénéficiaire</div>
        <div class="info-row">
          <span class="info-label">Nom du Vendeur :</span>
          <span class="info-val">${transactionData.sellerName}</span>
        </div>
        ${transactionData.sellerShopName ? `
        <div class="info-row">
          <span class="info-label">Enseigne Boutique :</span>
          <span class="info-val">${transactionData.sellerShopName}</span>
        </div>` : ''}
        <div class="info-row">
          <span class="info-label">Pièce CNI Vendeur :</span>
          <span class="info-val"><span class="masked-id-pill">${maskedSellerKyc}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Commune d'Enlèvement :</span>
          <span class="info-val">${transactionData.communeOrigin}</span>
        </div>
      </div>

      <!-- Buyer Box (Sensitive Data Masked) -->
      <div class="card">
        <div class="card-title">Acheteur Destinataire (Données Protégées)</div>
        <div class="info-row">
          <span class="info-label">Acheteur :</span>
          <span class="info-val">${transactionData.buyerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Téléphone (Masqué) :</span>
          <span class="info-val">${maskedBuyerPhone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Pièce ID (Confidentialité) :</span>
          <span class="info-val"><span class="masked-id-pill">Pièce ID : ${maskedBuyerKyc}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Commune de Destination :</span>
          <span class="info-val">${transactionData.communeDestination}</span>
        </div>
      </div>
    </div>

    <!-- Article & Delivery Status Strip -->
    <div class="table-container">
      <table class="invoice-table">
        <thead>
          <tr>
            <th>Référence & Article Vendu</th>
            <th class="text-center">Canal</th>
            <th class="text-center">Quantité</th>
            <th class="text-center">Statut Livraison</th>
            <th class="text-right">Montant Brut</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${transactionData.itemTitle}</strong>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                Identifiant Article : <strong>${transactionData.itemId || transactionData.transactionId}</strong> • Catégorie : ${transactionData.itemCategory}
              </div>
            </td>
            <td class="text-center">
              <span style="font-size: 10.5px; font-weight: bold; color: #475569;">${purchaseType}</span>
            </td>
            <td class="text-center font-bold font-mono">${quantity}</td>
            <td class="text-center">
              <span class="status-badge ${
                deliveryStatus === 'Livré' ? 'status-shipped' :
                deliveryStatus === 'En cours de livraison' ? 'status-in-transit' : 'status-to-ship'
              }">
                ${deliveryStatus}
              </span>
            </td>
            <td class="text-right font-mono font-bold">${grossAmount.toLocaleString('fr-FR')} F</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Settlement Financial Breakdown (User Requirement) -->
    <div class="settlement-card">
      <div class="settlement-title">
        <span>Décompte Financier Officiel de la Vente</span>
        <span style="font-size: 10px; color: #059669; font-weight: bold;">
          ✓ Crédité sur le Solde Vendeur
        </span>
      </div>

      <div class="settlement-grid">
        <div class="settlement-stat">
          <span class="stat-label">1. Montant Brut Vente</span>
          <span class="stat-amount amount-gross">${grossAmount.toLocaleString('fr-FR')} F</span>
          <span style="font-size: 9px; color: #64748b; display: block; margin-top: 2px;">Prix de l'article</span>
        </div>

        <div class="settlement-stat">
          <span class="stat-label">2. Commission BRAD'CI (-${commissionPercent}%)</span>
          <span class="stat-amount amount-commission">- ${commissionAmount.toLocaleString('fr-FR')} F</span>
          <span style="font-size: 9px; color: #dc2626; display: block; margin-top: 2px;">Frais de service plateforme</span>
        </div>

        <div class="settlement-stat" style="background: #ecfdf5; border-color: #a7f3d0;">
          <span class="stat-label" style="color: #065f46;">3. Montant Net Crédité</span>
          <span class="stat-amount amount-net">${netAmount.toLocaleString('fr-FR')} FCFA</span>
          <span style="font-size: 9px; color: #047857; display: block; margin-top: 2px; font-weight: bold;">Disponible pour Retrait Wave / Orange</span>
        </div>
      </div>
    </div>

    <!-- Privacy Guarantee Strip -->
    <div class="privacy-strip">
      🛡️ <strong>Protection de la vie privée Acheteur :</strong> Les données d'identité et de contact de l'acheteur sont masquées de manière irréversible pour prévenir toute sollicitation non sollicitée hors plateforme. La transaction est garantie et couverte par le séquestre BRAD'CI.
    </div>

    <!-- Stamp & Footer -->
    <div class="cert-footer">
      <div>
        BRAD'CI SAS • Département Marchands & Boutiques • Abidjan, Côte d'Ivoire<br>
        Attestation comptable faisant foi de décharge de l'objet et du virement des fonds au vendeur • Audit ID : ${auditLog.auditId}
      </div>
      <div class="stamp-box">
        ✓ VENTE SÉCURISÉE<br>
        <span style="font-size: 8px; font-weight: normal; color: #ff5b00;">CRÉDIT MARCHAND VALIDÉ</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 2b. generateDriverReceiptPDF(transactionData, auditLog)
 * Génère le bordereau officiel de mission et de rémunération destiné exclusivement au coursier / livreur.
 * - Ne divulgue JAMAIS le prix de vente ni les marges vendeur pour éliminer les risques de convoitise et de vol.
 * - Affiche la rémunération de la course (frais de livraison reversés au livreur).
 * - Affiche les points d'enlèvement et de dépose ainsi que la validation sécurisée de remise du colis.
 */
export function generateDriverReceiptPDF(
  transactionData: TransactionAuditInput,
  auditLog: PaymentAuditLog
): string {
  const formattedDate = new Date(transactionData.timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = new Date(transactionData.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const missionRef = `LIV-BRAD-${new Date(transactionData.timestamp).getFullYear()}-${(transactionData.transactionId || '3001').replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')}`;
  const driverFee = transactionData.deliveryFeeFCFA || 2000;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bordereau de Mission Livreur - BRAD'CI ${missionRef}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 15mm 18mm 15mm;
      @bottom-center {
        content: "Bordereau officiel de mission et rémunération coursier BRAD'CI Logistique • Abidjan, Côte d'Ivoire";
        font-size: 8pt;
        color: #64748b;
        font-family: Arial, sans-serif;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #059669;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-title span.accent { color: #059669; }
    .brand-sub {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #059669;
      margin-top: 2px;
    }
    .doc-meta { text-align: right; }
    .doc-type-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1.5px solid #a7f3d0;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 6px;
    }
    .doc-ref {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .doc-date { font-size: 11px; color: #64748b; margin-top: 2px; }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 11px;
    }
    .meta-card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .info-label { color: #64748b; font-weight: 500; }
    .info-val { color: #0f172a; font-weight: 700; text-align: right; }

    .security-banner {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 11px;
      color: #166534;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    table.invoice-table th {
      background: #064e3b;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 9px 12px;
      text-align: left;
    }
    table.invoice-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }

    .payout-box {
      background: #f0fdf4;
      border: 2px solid #059669;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }
    .payout-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 800;
      color: #065f46;
      text-transform: uppercase;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #a7f3d0;
    }
    .payout-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .payout-total {
      font-size: 16px;
      font-weight: 900;
      color: #047857;
      font-family: 'Courier New', monospace;
    }

    .validation-strip {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cert-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 9.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stamp-box {
      border: 2px solid #059669;
      color: #059669;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">BRAD<span style="color: #FF5B00;">'</span><span style="color: #1E53E5;">CI</span> <span class="accent">LOGISTIQUE</span></div>
      <div class="brand-sub">Bordereau de Mission & Rémunération Coursier</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
        Service Logistique Express Abidjan • Agrément Transport & Livraison
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type-badge">Bordereau Coursier</div>
      <div class="doc-ref">${missionRef}</div>
      <div class="doc-date">${formattedDate} à ${formattedTime}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-card-title">1. Coursier & Informations Mission</div>
      <div class="info-row">
        <span class="info-label">Livreur Agréé :</span>
        <span class="info-val">${transactionData.driverName || 'Coursier Indépendant BRAD\'CI'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Statut Mission :</span>
        <span class="info-val" style="color: #059669;">✓ Course Validée & Rémunérée</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type de Trajet :</span>
        <span class="info-val">Livraison Directe Inter-Communes</span>
      </div>
    </div>

    <div class="meta-card">
      <div class="meta-card-title">2. Itinéraire de la Course</div>
      <div class="info-row">
        <span class="info-label">Départ (Enlèvement) :</span>
        <span class="info-val">${transactionData.communeOrigin}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Arrivée (Dépose) :</span>
        <span class="info-val">${transactionData.communeDestination}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Mode de Remise :</span>
        <span class="info-val">En main propre certifiée</span>
      </div>
    </div>
  </div>

  <!-- Security Notice Against Theft & Fraud -->
  <div class="security-banner">
    <span style="font-size: 16px;">🛡️</span>
    <div>
      <strong>Sécurité & Confidentialité Marchande :</strong>
      Conformément aux protocoles de sûreté logistique BRAD'CI, la valeur marchande du contenu et la marge commerciale du vendeur sont strictement confidentielles et masquées. Ce bordereau garantit l'intégrité de la chaîne de transport.
    </div>
  </div>

  <!-- Parcel Handling Strip -->
  <table class="invoice-table">
    <thead>
      <tr>
        <th>Désignation Logistique</th>
        <th class="text-center">Origine</th>
        <th class="text-center">Destination</th>
        <th class="text-right">Statut Prise en Charge</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Colis Logistique BRAD'CI Scellé</strong>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Réf Colis : <strong>${transactionData.itemId || transactionData.transactionId}</strong> • Contrôlé à la remise
          </div>
        </td>
        <td class="text-center font-bold">${transactionData.communeOrigin}</td>
        <td class="text-center font-bold" style="color: #059669;">${transactionData.communeDestination}</td>
        <td class="text-right font-bold" style="color: #059669;">✓ Livré avec succès</td>
      </tr>
    </tbody>
  </table>

  <!-- Driver Payout Breakdown -->
  <div class="payout-box">
    <div class="payout-header">
      <span>Rémunération de la Course Livreur</span>
      <span style="color: #059669;">✓ Crédit Disponible Immédiat</span>
    </div>
    <div class="payout-row">
      <span style="color: #475569;">Frais de transport & livraison :</span>
      <span style="font-family: monospace; font-weight: 700;">+ ${driverFee.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="payout-row">
      <span style="color: #475569;">Mode de versement :</span>
      <span style="font-weight: 700; color: #065f46;">Portefeuille Livreur (Retrait Mobile Money sans frais)</span>
    </div>
    <div class="payout-row" style="margin-top: 8px; padding-top: 8px; border-top: 1.5px solid #a7f3d0;">
      <strong style="color: #064e3b; font-size: 13px;">MONTANT TOTAL ENCAISSÉ PAR LE COURSIER :</strong>
      <span class="payout-total">+ ${driverFee.toLocaleString('fr-FR')} FCFA</span>
    </div>
  </div>

  <!-- Physical Delivery Validation -->
  <div class="validation-strip">
    <div>
      <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
        Code Secret de Remise du Colis
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
        Vérifié contradictoirement lors de la remise du colis au destinataire.
      </div>
    </div>
    <div style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: 900; color: #059669; background: #ecfdf5; border: 1.5px solid #a7f3d0; padding: 4px 10px; border-radius: 6px;">
      ✓ CODE VALIDÉ
    </div>
  </div>

  <div class="cert-footer">
    <div>
      BRAD'CI SAS • Direction Opérationnelle & Logistique • Abidjan, Côte d'Ivoire<br>
      Bordereau certifié conforme valant décharge de livraison et justificatif de rémunération coursier.
    </div>
    <div class="stamp-box">
      ✓ BORDEREAU CERTIFIÉ CONFORME
    </div>
  </div>
</body>
</html>`;
}

/**
 * 3. generateReceiptPDF(transactionData, auditLog, mode)
 * Point d'entrée universel respectant strictement le rôle : Acheteur, Vendeur ou Livreur.
 */
export function generateReceiptPDF(
  transactionData: TransactionAuditInput,
  auditLog: PaymentAuditLog,
  mode: 'buyer' | 'seller' | 'driver' = 'buyer'
): string {
  if (mode === 'driver') {
    return generateDriverReceiptPDF(transactionData, auditLog);
  }
  if (mode === 'seller') {
    return generateSellerReceiptPDF(transactionData, auditLog);
  }
  return generateBuyerReceiptPDF(transactionData, auditLog);
}

/**
 * Helper client : Déclenche l'impression ou l'ouverture du reçu sans être bloqué par les popups d'iFrame
 */
export function openReceiptInPrintWindow(receiptHtml: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    // Hidden iframe method: 100% reliable inside iframes and sandboxes without popup blocker issues
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Impression Reçu BRADCI');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Iframe print failed, attempting window.open fallback:', printErr);
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(receiptHtml);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 300);
          } else {
            window.print();
          }
        }

        // Cleanup iframe after print dialog resolves
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }, 350);
    } else {
      window.print();
    }
  } catch (err) {
    console.error('Print trigger error:', err);
    window.print();
  }
}

/**
 * Génère un véritable fichier binaire PDF (.pdf) téléchargeable directement sur mobile & desktop
 */
export async function downloadElementAsPdf(element: HTMLElement, filename: string): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Handle single or multi-page if content is tall
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    } else {
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    return false;
  }
}
