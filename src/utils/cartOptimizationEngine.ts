/**
 * BRAD'CI - Cart Optimization & Multi-Pickup Delivery Engine
 * 
 * Algorithme d'optimisation de tournée multi-boutiques et facturation
 * groupée intelligente pour Abidjan (Côte d'Ivoire).
 */

import { 
  CartItem, 
  CartSellerGroup, 
  CartPickupStop, 
  CartDeliveryOptimization, 
  Product, 
  VehicleType, 
  CartOrderRecord,
  PaymentMethod
} from '../types';
import { 
  calculateDeliveryFee, 
  calculateHaversineDistance, 
  getCommuneCoords 
} from '../data/communes';

/**
 * Convertit un produit BRAD'CI (Boutique, Enchère, Déstockage, Liquidation) en CartItem
 */
export function createCartItemFromProduct(
  product: Product, 
  quantity: number = 1,
  forcedChannel?: 'boutique' | 'enchere' | 'destockage' | 'liquidation'
): CartItem {
  // Déterminer le canal de vente
  let channel: 'boutique' | 'enchere' | 'destockage' | 'liquidation' = 'boutique';
  if (forcedChannel) {
    channel = forcedChannel;
  } else if (product.isB2BLot || product.category === 'Déstockage B2B') {
    channel = product.b2bSaleKind === 'liquidation' ? 'liquidation' : 'destockage';
  } else if (product.listingType === 'auction' || (product.bids && product.bids.length > 0 && !product.shopId)) {
    channel = 'enchere';
  } else {
    channel = 'boutique';
  }

  // Prix unitaire selon le canal
  let unitPrice = product.currentPrice;
  if (channel === 'boutique' && product.buyNowPrice) {
    unitPrice = product.buyNowPrice;
  } else if (channel === 'enchere') {
    unitPrice = product.buyNowPrice || product.currentPrice;
  }

  // Stock maximum disponible
  let maxStock = 1;
  if (channel === 'boutique') {
    maxStock = product.stockQuantity !== undefined ? Math.max(1, product.stockQuantity) : 10;
  } else if (product.isB2BLot && product.b2bTotalUnitsCount) {
    maxStock = product.b2bTotalUnitsCount;
  }

  const safeQty = Math.min(Math.max(1, quantity), maxStock);

  return {
    id: `cart-item-${product.id}`,
    productId: product.id,
    productTitle: product.title,
    productImage: product.images?.[0] || product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    category: product.category,
    channel,
    unitPrice,
    quantity: safeQty,
    maxAvailableStock: maxStock,
    sellerId: product.sellerId,
    sellerName: product.shopName || product.sellerName || 'Vendeur Certifié',
    sellerPhone: '+225 07 48 92 11 34',
    shopId: product.shopId,
    shopName: product.shopName,
    sellerAvatar: product.sellerAvatar,
    commune: product.commune || 'Marcory',
    pickupAddress: product.pickupAddress || `${product.commune || 'Marcory'}, Abidjan`,
    pickupCoords: product.pickupCoords || getCommuneCoords(product.commune || 'Marcory'),
    requiredVehicle: product.requiredVehicle || 'moto',
    pickupCode: product.pickupCode || Math.floor(1000 + Math.random() * 9000).toString(),
    isB2BLot: product.isB2BLot,
    b2bSaleKind: product.b2bSaleKind,
    b2bTotalUnitsCount: product.b2bTotalUnitsCount,
    b2bCompanyName: product.b2bCompanyName
  };
}

/**
 * Regroupe les articles du panier par vendeur / boutique
 */
export function groupCartItemsBySeller(items: CartItem[]): CartSellerGroup[] {
  const groupsMap = new Map<string, CartSellerGroup>();

  items.forEach(item => {
    const key = item.sellerId || item.shopId || item.sellerName;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        sellerPhone: item.sellerPhone || '+225 07 48 92 11 34',
        shopId: item.shopId,
        shopName: item.shopName,
        sellerAvatar: item.sellerAvatar,
        commune: item.commune,
        pickupAddress: item.pickupAddress,
        pickupCoords: item.pickupCoords || getCommuneCoords(item.commune),
        pickupCode: item.pickupCode,
        isPickedUp: false,
        items: [],
        subtotal: 0,
        requiredVehicle: item.requiredVehicle
      });
    }

    const group = groupsMap.get(key)!;
    group.items.push(item);
    group.subtotal += item.unitPrice * item.quantity;

    // Upgrader le véhicule si un article nécessite plus grand
    if (item.requiredVehicle === 'cargo') {
      group.requiredVehicle = 'cargo';
    } else if (item.requiredVehicle === 'voiture' && group.requiredVehicle !== 'cargo') {
      group.requiredVehicle = 'voiture';
    }
  });

  return Array.from(groupsMap.values());
}

/**
 * Algorithme d'optimisation de livraison groupée multi-boutiques
 */
export function calculateCartDeliveryOptimization(
  items: CartItem[],
  dropoffCommune: string,
  dropoffCoords?: { lat: number; lng: number }
): CartDeliveryOptimization {
  if (items.length === 0) {
    return {
      totalItemCount: 0,
      totalUniqueSellers: 0,
      totalUniqueCommunes: 0,
      dominantVehicle: 'moto',
      rawIndividualDeliveryFees: 0,
      optimizedDeliveryFee: 0,
      groupingSavingsFCFA: 0,
      driverMultiPickupBonusFCFA: 0,
      pickupStops: []
    };
  }

  const sellerGroups = groupCartItemsBySeller(items);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalUniqueSellers = sellerGroups.length;

  const uniqueCommunesSet = new Set<string>();
  sellerGroups.forEach(g => uniqueCommunesSet.add(g.commune.toLowerCase()));
  const totalUniqueCommunes = uniqueCommunesSet.size;

  // Déterminer le véhicule dominant sur tout le panier
  let dominantVehicle: VehicleType = 'moto';
  if (items.some(i => i.requiredVehicle === 'cargo')) {
    dominantVehicle = 'cargo';
  } else if (items.some(i => i.requiredVehicle === 'voiture' || i.requiredVehicle === 'car')) {
    dominantVehicle = 'voiture';
  }

  // 1. Calcul des frais individuels bruts (si le client payait chaque course séparément)
  let rawIndividualDeliveryFees = 0;
  sellerGroups.forEach(group => {
    // Tarif complet par vendeur
    const fee = calculateDeliveryFee(group.commune, dropoffCommune, group.requiredVehicle);
    rawIndividualDeliveryFees += fee;
  });

  // 2. Calcul du tarif groupé optimisé (Tournée de ramassage)
  // - Base = tarif du trajet le plus long / le plus exigeant
  // - +500 FCFA par point de ramassage supplémentaire (au lieu de payer 1500 - 2500 F plein pot)
  // - Si tous les articles viennent de la même boutique : 0 F de supplément !
  let baseMaxFee = 0;
  sellerGroups.forEach(group => {
    const fee = calculateDeliveryFee(group.commune, dropoffCommune, dominantVehicle);
    if (fee > baseMaxFee) {
      baseMaxFee = fee;
    }
  });

  const extraStopFeePerSeller = dominantVehicle === 'cargo' ? 1000 : 500;
  const extraStopsCount = Math.max(0, totalUniqueSellers - 1);
  const optimizedDeliveryFee = baseMaxFee + (extraStopsCount * extraStopFeePerSeller);

  const groupingSavingsFCFA = Math.max(0, rawIndividualDeliveryFees - optimizedDeliveryFee);
  const driverMultiPickupBonusFCFA = extraStopsCount * (dominantVehicle === 'cargo' ? 800 : 400);

  // 3. Génération des étapes de ramassage ordonnées (Itinéraire livreur)
  const targetCoords = dropoffCoords || getCommuneCoords(dropoffCommune);
  
  // Trier les stops par distance vers la destination pour optimiser la boucle
  const sortedGroups = [...sellerGroups].sort((a, b) => {
    const distA = calculateHaversineDistance(
      a.pickupCoords?.lat || 5.35, 
      a.pickupCoords?.lng || -4.00, 
      targetCoords.lat, 
      targetCoords.lng
    );
    const distB = calculateHaversineDistance(
      b.pickupCoords?.lat || 5.35, 
      b.pickupCoords?.lng || -4.00, 
      targetCoords.lat, 
      targetCoords.lng
    );
    // Ramasser d'abord le plus éloigné puis se rapprocher de la destination
    return distB - distA;
  });

  const pickupStops: CartPickupStop[] = sortedGroups.map((group, idx) => ({
    stopIndex: idx + 1,
    sellerId: group.sellerId,
    sellerName: group.sellerName,
    sellerPhone: group.sellerPhone || '+225 07 48 92 11 34',
    commune: group.commune,
    address: group.pickupAddress,
    coords: group.pickupCoords || getCommuneCoords(group.commune),
    pickupCode: group.pickupCode,
    itemCount: group.items.reduce((acc, i) => acc + i.quantity, 0),
    itemTitles: group.items.map(i => `${i.productTitle} (x${i.quantity})`),
    isCompleted: false
  }));

  return {
    totalItemCount,
    totalUniqueSellers,
    totalUniqueCommunes,
    dominantVehicle,
    rawIndividualDeliveryFees,
    optimizedDeliveryFee,
    groupingSavingsFCFA,
    driverMultiPickupBonusFCFA,
    pickupStops
  };
}

/**
 * Génère le document HTML de Facture / Reçu pour le panier complet
 */
export function generateCartInvoiceHTML(
  order: CartOrderRecord,
  sha256Stamp: string
): string {
  const itemsRows = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 8px; font-weight: bold; color: #0f172a;">
        ${item.productTitle}
        <div style="font-size: 10px; color: #64748b; font-weight: normal;">
          Vendeur: ${item.sellerName} (${item.commune}) • Type: ${item.channel.toUpperCase()}
        </div>
      </td>
      <td style="padding: 10px 8px; text-align: center; color: #334155;">${item.quantity}</td>
      <td style="padding: 10px 8px; text-align: right; color: #334155;">${item.unitPrice.toLocaleString('fr-FR')} F</td>
      <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #0f172a;">${(item.unitPrice * item.quantity).toLocaleString('fr-FR')} FCFA</td>
    </tr>
  `).join('');

  const stopsList = order.sellerGroups.map((g, idx) => `
    <li style="margin-bottom: 4px;">
      <strong>Arrêt ${idx + 1} (${g.commune}) :</strong> ${g.sellerName} (${g.items.length} article(s))
    </li>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Facture Panier BRAD'CI - ${order.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 24px; background: #fff; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1E53E5; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { font-size: 26px; font-weight: 900; color: #0f172a; }
        .logo span { color: #FF5B00; }
        .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
        th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
        .totals { margin-top: 16px; width: 100%; border-top: 2px solid #e2e8f0; padding-top: 12px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .grand-total { font-size: 18px; font-weight: 900; color: #1E53E5; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 8px; }
        .otp-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 12px; text-align: center; margin: 16px 0; }
        .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">BRAD<span>'</span>CI</div>
          <div style="font-size: 12px; color: #475569; font-weight: bold;">FACTURE OFFICIELLE PANIER MULTI-BOUTIQUES</div>
          <div style="font-size: 11px; color: #64748b;">Plateforme Sécurisée d'Occasion & Déstockage • Abidjan (CI)</div>
        </div>
        <div style="text-align: right;">
          <span class="badge">✓ PAIEMENT DIRECT SÉCURISÉ</span>
          <div style="font-size: 12px; font-family: monospace; font-weight: bold; margin-top: 6px;">${order.id}</div>
          <div style="font-size: 11px; color: #64748b;">${new Date(order.createdAt).toLocaleString('fr-FR')}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 12px; margin-bottom: 16px;">
        <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px;">
          <strong style="color: #1E53E5;">DESTINATAIRE (ACHETEUR) :</strong>
          <div>${order.buyerName}</div>
          <div>Tél : ${order.buyerPhone}</div>
          <div>Lieu de livraison : <strong>${order.dropoffCommune}</strong> (${order.dropoffAddress})</div>
        </div>
        <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px;">
          <strong style="color: #1E53E5;">TOURNÉE DE RAMASSAGE GROUPÉE :</strong>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            ${order.sellerGroups.length} boutique(s) / vendeur(s) collecté(s)
          </div>
          <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 11px;">
            ${stopsList}
          </ul>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Article & Vendeur</th>
            <th style="text-align: center;">Qté</th>
            <th style="text-align: right;">Prix Unitaire</th>
            <th style="text-align: right;">Total Ligne</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Sous-total articles (${order.items.length} références) :</span>
          <span>${order.itemsSubtotalFCFA.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div class="total-row">
          <span>Frais de livraison groupée optimisée :</span>
          <span style="color: #166534; font-weight: bold;">+ ${order.optimizedDeliveryFeeFCFA.toLocaleString('fr-FR')} FCFA</span>
        </div>
        ${order.deliverySavingsFCFA > 0 ? `
          <div class="total-row" style="color: #059669; font-size: 12px;">
            <span>⚡ Économie de groupage livraison :</span>
            <span>- ${order.deliverySavingsFCFA.toLocaleString('fr-FR')} FCFA</span>
          </div>
        ` : ''}
        ${order.referralDiscountFCFA > 0 ? `
          <div class="total-row" style="color: #059669; font-size: 12px;">
            <span>🎁 Solde d'achat parrainage appliqué :</span>
            <span>- ${order.referralDiscountFCFA.toLocaleString('fr-FR')} FCFA</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>NET À PAYER À LA LIVRAISON :</span>
          <span>${order.totalAmountPaidFCFA.toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>

      <div class="otp-box">
        <div style="font-size: 11px; color: #166534; font-weight: bold;">CODE OTP MAÎTRE DE LIVRAISON CLIENT (À REMETTRE AU LIVREUR APRÈS CONTRÔLE)</div>
        <div style="font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #15803d; font-family: monospace; margin: 4px 0;">
          ${order.masterDeliveryOtp}
        </div>
        <div style="font-size: 10px; color: #475569;">Ne communiquez ce code au livreur qu'après avoir inspecté et validé tous les articles.</div>
      </div>

      <div class="footer">
        <div>Empreinte Numérique Cryptographique SHA-256 : <span style="font-family: monospace;">${sha256Stamp}</span></div>
        <div>Moyen de paiement : <strong>${order.paymentMethod}</strong> • Mode : <strong>${order.paymentChoice === 'delivery' ? 'Paiement Direct à la Livraison' : 'Prépaiement Sécurisé'}</strong></div>
        <div style="margin-top: 4px;">BRAD'CI Technologies S.A. • Abidjan, Côte d'Ivoire • Support : +225 07 48 92 11 34</div>
      </div>
    </body>
    </html>
  `;
}
