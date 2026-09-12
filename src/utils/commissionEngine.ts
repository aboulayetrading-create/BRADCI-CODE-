import { SellerPlan } from '../types';

/**
 * Grille Officielle des Commissions et Pass Vendeurs BRAD'CI
 * 1. Pass Gratuit (0 FCFA) : Commission 5.0 % (Montant * 0.05)
 * 2. Pass Pro (2 500 FCFA / 30j) : Commission 2.5 % (Montant * 0.025) + Badge Pro
 * 3. Pass Gold (5 000 FCFA / 30j) : Commission 1.5 % (Montant * 0.015) + Badge VIP Gold & Priorité d'affichage
 * 4. Booster Flash (1 000 FCFA / 24h) : Option de mise en vedette de l'annonce
 */

export interface SellerPlanConfig {
  id: SellerPlan;
  name: string;
  priceFCFA: number;
  durationLabel: string;
  commissionRate: number; // e.g. 0.05, 0.025, 0.015
  commissionPercent: number; // e.g. 5.0, 2.5, 1.5
  badgeLabel: string;
  perks: string[];
}

export const SELLER_PLANS: Record<'basic' | 'standard' | 'pro', SellerPlanConfig> = {
  basic: {
    id: 'basic',
    name: 'Pass Gratuit',
    priceFCFA: 0,
    durationLabel: 'Gratuit',
    commissionRate: 0.05,
    commissionPercent: 5.0,
    badgeLabel: 'Vendeur Standard',
    perks: [
      'Publications illimitées d\'annonces et d\'enchères à 0 FCFA',
      'Commission standard de 5.0 % sur vente finalisée (Montant * 0.05)',
      'Paiement direct à la livraison avec séquestre sécurisé'
    ]
  },
  standard: {
    id: 'standard',
    name: 'Pass Pro',
    priceFCFA: 2500,
    durationLabel: '30 jours',
    commissionRate: 0.025,
    commissionPercent: 2.5,
    badgeLabel: 'Badge Pro',
    perks: [
      'Commission ultra-réduite à 2.5 % seulement (Montant * 0.025)',
      'Badge officiel "PRO" sur toutes vos annonces et votre profil',
      'Vitrine Boutique personnalisée (Logo, Bannière & Coordonnées)',
      'Déblocage express des paiements sur votre compte Mobile Money'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pass Gold',
    priceFCFA: 5000,
    durationLabel: '30 jours',
    commissionRate: 0.015,
    commissionPercent: 1.5,
    badgeLabel: 'Badge VIP Gold',
    perks: [
      'Commission record minimale à 1.5 % (Montant * 0.015)',
      'Badge officiel "VIP GOLD" doré certifié sur toutes vos annonces',
      'Priorité d\'affichage maximale en tête de liste du flux Abidjan',
      'Radar de demande acheteurs et support dédié VIP 7j/7'
    ]
  }
};

export const BOOSTER_FLASH_CONFIG = {
  name: 'Booster Flash',
  priceFCFA: 1000,
  durationLabel: '24h',
  description: "Option de mise en vedette de l'annonce en tête de fil d'accueil avec badge doré"
};

/**
 * Grille Officielle des Pass Livreurs BRAD'CI
 * 1. Recharge 24h Chrono - Livraison Express : 2 000 FCFA (rectifié de 5 000 F à 2 000 F, dédié aux courses Point A ➔ Point B)
 * 2. Pass Mensuel - Commandes BRAD'CI : 5 000 FCFA / 30 jours (dédié aux commandes marketplace BRAD'CI)
 * 0% de commission Brad'CI, 5 courses offertes au lancement
 */
export const DRIVER_PASSES = {
  daily: {
    id: 'daily_pass',
    name: 'Recharge 24h Chrono - Livraison Express',
    shortName: 'Pass Livraison Express (24h Chrono)',
    priceFCFA: 2000,
    durationLabel: '24h Chrono',
    commissionRate: 0,
    commissionPercent: 0,
    description: "Accès illimité pendant 24h chrono à toutes les courses de Livraison Express (Point A ➔ Point B) avec 0% de commission Brad'CI"
  },
  monthly: {
    id: 'vip_pass',
    name: 'Pass Mensuel - Commandes BRAD\'CI',
    shortName: 'Pass Mensuel Commandes (30 jours)',
    priceFCFA: 5000,
    durationLabel: '30 jours',
    commissionRate: 0,
    commissionPercent: 0,
    description: "Accès illimité 30 jours à toutes les courses de commandes marketplace et e-commerce BRAD'CI avec 0% de commission Brad'CI"
  }
};

/**
 * Récupère le taux de commission d'un vendeur selon son Pass actif
 */
export function getSellerCommissionRate(plan?: SellerPlan | null): number {
  if (plan === 'pro' || (plan as string) === 'gold') return 0.015; // Pass Gold (1.5%)
  if (plan === 'standard' || (plan as string) === 'pro_pass') return 0.025; // Pass Pro (2.5%)
  return 0.05; // Pass Gratuit (5.0%)
}

/**
 * Récupère le pourcentage de commission (5.0, 2.5 ou 1.5)
 */
export function getSellerCommissionPercent(plan?: SellerPlan | null): number {
  return getSellerCommissionRate(plan) * 100;
}

export const getSellerCommissionPercentage = getSellerCommissionPercent;

/**
 * Récupère les détails complets du Pass Vendeur
 */
export function getSellerPlanDetails(plan?: SellerPlan | string | null): SellerPlanConfig {
  if (plan === 'pro' || plan === 'gold') return SELLER_PLANS.pro;
  if (plan === 'standard') return SELLER_PLANS.standard;
  return SELLER_PLANS.basic;
}

/**
 * Calcule automatiquement la commission et le net vendeur
 */
export function calculateSellerCommission(amount: number, plan?: SellerPlan | null): {
  grossAmount: number;
  rate: number;
  percent: number;
  ratePercent: number;
  commissionAmount: number;
  sellerNetAmount: number;
  netSellerAmount: number;
} {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const rate = getSellerCommissionRate(plan);
  const percent = rate * 100;
  const commissionAmount = Math.round(safeAmount * rate);
  const sellerNetAmount = Math.max(0, safeAmount - commissionAmount);
  return {
    grossAmount: safeAmount,
    rate,
    percent,
    ratePercent: percent,
    commissionAmount,
    sellerNetAmount,
    netSellerAmount: sellerNetAmount
  };
}
