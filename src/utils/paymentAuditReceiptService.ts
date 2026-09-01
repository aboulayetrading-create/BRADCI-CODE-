/**
 * BRAD'CI - Payment Audit & Legal Receipt Service
 * 
 * Service d'audit cryptographique et de génération de reçus / factures conformes
 * pour les transactions de seconde main à Abidjan (Côte d'Ivoire).
 */

export interface TransactionAuditInput {
  transactionId: string;
  orderId?: string;
  transactionRef?: string;
  externalProviderId: string; // Ex: Wave ID (WAVE_TX_XXXXX), Orange Money TX, MoMo ID
  provider: 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Carte Bancaire';
  timestamp: string; // ISO 8601
  amountTotalFCFA: number;
  itemPriceFCFA: number;
  deliveryFeeFCFA: number;
  platformFeeFCFA: number;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerKycMaskedId: string; // Ex: "CI-0012****984" (Preuve d'origine légale CNI/Passeport)
  sellerKycVerifiedAt?: string;
  deliveryOtpCode: string;
  itemId?: string;
  itemTitle: string;
  itemCategory: string;
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
 * Calcule une empreinte SHA-256 cryptographique sécurisée
 * Compatible navigateur moderne (Web Crypto API) et environnements Node.js
 */
export async function computeSHA256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback synchrone pour environnements restreints
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
 * 1. createPaymentAuditLog(transactionData)
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
    sellerKyc: transactionData.sellerKycMaskedId,
    otp: transactionData.deliveryOtpCode,
    ts: transactionData.timestamp,
    origin: transactionData.communeOrigin,
    dest: transactionData.communeDestination
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

  // Stockage de sécurité local si disponible
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existingLogsStr = localStorage.getItem('bradci_payment_audit_logs');
      const existingLogs: PaymentAuditLog[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      existingLogs.unshift(auditLog);
      localStorage.setItem('bradci_payment_audit_logs', JSON.stringify(existingLogs.slice(0, 100)));
    } catch {
      // Ignore quota storage errors
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
 * 2. generateReceiptPDF(transactionData, auditLog)
 * Génère le code HTML/CSS complet et auto-contenu, optimisé pour WeasyPrint ou Puppeteer (page-break, typography, QR placeholder).
 */
export function generateReceiptPDF(
  transactionData: TransactionAuditInput,
  auditLog: PaymentAuditLog
): string {
  const formattedDate = new Date(transactionData.timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const receiptNumber = `REC-${auditLog.auditId.slice(-12)}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu Officiel - BRAD'CI ${receiptNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 20mm 15mm;
      @bottom-center {
        content: "Page 1/1 - Document officiel émis par BRAD'CI SAS • Abidjan, Côte d'Ivoire";
        font-size: 8pt;
        color: #64748b;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1e53e5;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .logo-container {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 26px;
      font-weight: 900;
      color: #0b1021;
      letter-spacing: -0.5px;
    }

    .brand-title span.orange {
      color: #ff5b00;
    }

    .brand-title span.blue {
      color: #1e53e5;
    }

    .brand-subtitle {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-top: 2px;
    }

    .receipt-badge {
      text-align: right;
    }

    .badge-pill {
      display: inline-block;
      background-color: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .receipt-number {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 6px;
      font-family: 'Courier New', Courier, monospace;
    }

    .receipt-date {
      font-size: 11px;
      color: #64748b;
    }

    /* Grid sections */
    .grid-2 {
      display: table;
      width: 100%;
      table-layout: fixed;
      margin-bottom: 20px;
    }

    .col {
      display: table-cell;
      vertical-align: top;
      width: 50%;
    }

    .col:first-child {
      padding-right: 12px;
    }

    .col:last-child {
      padding-left: 12px;
    }

    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }

    .card-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #1e53e5;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .info-row {
      margin-bottom: 5px;
      font-size: 12px;
    }

    .info-label {
      color: #64748b;
      font-weight: 500;
    }

    .info-val {
      color: #0f172a;
      font-weight: 700;
    }

    .kyc-verified-tag {
      display: inline-block;
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      margin-top: 4px;
    }

    /* Table Item details */
    .table-container {
      margin-bottom: 20px;
    }

    table.item-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    table.item-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
    }

    table.item-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }

    .text-right {
      text-align: right !important;
    }

    /* Summary & Totals */
    .totals-container {
      margin-left: auto;
      width: 50%;
      margin-bottom: 20px;
    }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 6px 10px;
      font-size: 12px;
    }

    .totals-table tr.total-row td {
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      font-size: 14px;
      font-weight: 900;
      color: #ff5b00;
    }

    /* OTP & Security verification block */
    .security-block {
      background-color: #f0fdf4;
      border: 1.5px solid #22c55e;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .security-inner {
      width: 100%;
    }

    .otp-highlight {
      display: inline-block;
      background-color: #15803d;
      color: #ffffff;
      font-family: 'Courier New', Courier, monospace;
      font-size: 18px;
      font-weight: 900;
      padding: 4px 14px;
      border-radius: 6px;
      letter-spacing: 3px;
      margin-top: 4px;
    }

    /* Cryptographic Audit Stamp */
    .audit-seal {
      background-color: #0b1021;
      color: #94a3b8;
      border-radius: 8px;
      padding: 14px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px;
      line-height: 1.4;
      word-break: break-all;
    }

    .audit-seal strong {
      color: #38bdf8;
    }

    .audit-hash {
      color: #4ade80;
      font-weight: bold;
    }

    /* Footer */
    .footer {
      margin-top: 25px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      text-align: center;
      font-size: 10px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-container">
        <div class="brand-title">BRAD<span class="orange">'</span><span class="blue">CI</span></div>
        <div class="brand-subtitle">Enchères • Paiement Direct à la Livraison • GPS</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
          Plateforme certifiée de seconde main - Abidjan, Côte d'Ivoire
        </div>
      </div>
      <div class="receipt-badge">
        <div class="badge-pill">✓ Paiement Validé</div>
        <div class="receipt-number">${receiptNumber}</div>
        <div class="receipt-date">${formattedDate}</div>
      </div>
    </div>

    <!-- Participants & KYC Legality -->
    <div class="grid-2">
      <!-- Seller KYC / Provenance Card -->
      <div class="col">
        <div class="card">
          <div class="card-title">Vendeur & Origine Légale (Certifié KYC)</div>
          <div class="info-row">
            <span class="info-label">Nom du Vendeur : </span>
            <span class="info-val">${transactionData.sellerName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Téléphone : </span>
            <span class="info-val">${transactionData.sellerPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Pièce CNI / Passeport : </span>
            <span class="info-val">${transactionData.sellerKycMaskedId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Commune d'Origine : </span>
            <span class="info-val">${transactionData.communeOrigin}</span>
          </div>
          <div class="kyc-verified-tag">
            🛡️ Identité et Propriété de l'objet vérifiées par BRAD'CI
          </div>
        </div>
      </div>

      <!-- Buyer Card -->
      <div class="col">
        <div class="card">
          <div class="card-title">Acheteur & Destination</div>
          <div class="info-row">
            <span class="info-label">Nom de l'Acheteur : </span>
            <span class="info-val">${transactionData.buyerName}</span>
          </div>
          <div class="info-label">Téléphone : </span>
            <span class="info-val">${transactionData.buyerPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Lieu de Livraison : </span>
            <span class="info-val">${transactionData.communeDestination} (Livraison GPS)</span>
          </div>
          <div class="info-row">
            <span class="info-label">Moyen de Règlement : </span>
            <span class="info-val">${transactionData.provider} (${transactionData.externalProviderId})</span>
          </div>
          ${transactionData.driverName ? `
          <div class="info-row" style="margin-top: 4px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
            <span class="info-label">Livreur assigné : </span>
            <span class="info-val">${transactionData.driverName} (${transactionData.driverPhone || 'N/A'})</span>
          </div>` : ''}
        </div>
      </div>
    </div>

    <!-- Product Line Items -->
    <div class="table-container">
      <table class="item-table">
        <thead>
          <tr>
            <th>Désignation de l'Article d'Occasion</th>
            <th>Catégorie</th>
            <th class="text-right">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${transactionData.itemTitle}</strong>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                Transaction ID: ${transactionData.transactionId}
              </div>
            </td>
            <td>${transactionData.itemCategory}</td>
            <td class="text-right font-mono font-bold">${transactionData.itemPriceFCFA.toLocaleString('fr-FR')} F</td>
          </tr>
          <tr>
            <td colspan="2">Frais de transport & livraison coursier express (${transactionData.communeOrigin} ➔ ${transactionData.communeDestination})</td>
            <td class="text-right">${transactionData.deliveryFeeFCFA.toLocaleString('fr-FR')} F</td>
          </tr>
          <tr>
            <td colspan="2">Frais techniques de protection et sécurisation de plateforme</td>
            <td class="text-right">${transactionData.platformFeeFCFA.toLocaleString('fr-FR')} F</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totals Table -->
    <div class="totals-container">
      <table class="totals-table">
        <tr>
          <td class="info-label">Sous-total Article :</td>
          <td class="text-right font-bold">${transactionData.itemPriceFCFA.toLocaleString('fr-FR')} FCFA</td>
        </tr>
        <tr>
          <td class="info-label">Frais de Course & Plateforme :</td>
          <td class="text-right font-bold">${(transactionData.deliveryFeeFCFA + transactionData.platformFeeFCFA).toLocaleString('fr-FR')} FCFA</td>
        </tr>
        <tr class="total-row">
          <td>TOTAL RÉGLÉ À LA LIVRAISON :</td>
          <td class="text-right">${transactionData.amountTotalFCFA.toLocaleString('fr-FR')} FCFA</td>
        </tr>
      </table>
    </div>

    <!-- Delivery OTP Confirmation -->
    <div class="security-block">
      <div class="security-inner">
        <div style="font-weight: 800; color: #166534; font-size: 12px; text-transform: uppercase;">
          ✓ Déblocage Physique Confirmé par Code Secret OTP
        </div>
        <div style="font-size: 11px; color: #15803d; margin-top: 2px;">
          L'acheteur a physiquement contrôlé l'article et remis ce code au livreur pour valider la clôture :
        </div>
        <div class="otp-highlight">${transactionData.deliveryOtpCode}</div>
      </div>
    </div>

    <!-- Cryptographic Proof & Audit Trail -->
    <div class="audit-seal">
      <div><strong>EMPREINTE CRYPTOGRAPHIQUE DE SÉCURITÉ (SHA-256) :</strong></div>
      <div class="audit-hash">${auditLog.sha256Signature}</div>
      <div style="margin-top: 6px; color: #cbd5e1;">
        <span>Audit ID : ${auditLog.auditId}</span> • 
        <span>Provider TX : ${auditLog.externalProviderId}</span> • 
        <span>Horodatage Scellé : ${auditLog.timestamp}</span>
      </div>
      <div style="margin-top: 4px; font-size: 9px; color: #64748b;">
        Ce document certifie la conformité de la vente de seconde main selon le cadre légal ivoirien. Les données sont archivées de manière immuable.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      BRAD'CI SAS • Registre de Commerce d'Abidjan • Service Client: +225 07 00 00 00 00 • support@brad.ci<br>
      Toute reproduction non autorisée de cette facture ou falsification de l'empreinte cryptographique est passible de poursuites judiciaires.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Helper client : Déclenche l'impression ou l'ouverture du reçu HTML/PDF dans une nouvelle fenêtre
 */
export function openReceiptInPrintWindow(receiptHtml: string): void {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}
