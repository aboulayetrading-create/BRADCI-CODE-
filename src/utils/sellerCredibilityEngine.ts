/**
 * Algorithme d'Évaluation de Crédibilité Marchande BRAD'CI
 *
 * Calcule le Trust Score (0 à 100), attribue les badges de confiance mérités
 * et génère une synthèse publique rassurante pour les acheteurs.
 */

export interface SellerCredibilityRawData {
  anciennete_jours: number;
  commandes_totales: number;
  delai_moyen_remise_livreur_minutes: number;
  descriptions_exactes_pourcentage: number;
  taux_annulation_vendeur: number;
  kyc_valide: boolean;
}

export interface SellerCredibilityResult {
  trust_score: number; // 0 à 100
  badges_attribues: string[];
  niveau_confiance: 'Excellent' | 'Bon' | 'À surveiller';
  resume_public: string;
  // Détails de notation analytiques pour le backoffice / audit
  details_score?: {
    points_kyc: number; // Max 20
    points_descriptions: number; // Max 30
    points_rapidite: number; // Max 20
    points_fiabilite_annulation: number; // Max 20
    points_experience: number; // Max 10
  };
}

/**
 * Calcule le Trust Score, les badges et le résumé public d'un vendeur BRAD'CI.
 * 
 * @param data Données du vendeur (ancienneté, commandes, délai de remise, conformité, annulation, KYC)
 * @returns Structure JSON normalisée BRAD'CI avec score, badges, niveau et résumé
 */
export function evaluerCredibiliteVendeur(data: SellerCredibilityRawData): SellerCredibilityResult {
  const {
    anciennete_jours = 0,
    commandes_totales = 0,
    delai_moyen_remise_livreur_minutes = 60,
    descriptions_exactes_pourcentage = 90,
    taux_annulation_vendeur = 0,
    kyc_valide = false
  } = data;

  // 1. Calcul des composantes pondérées (Total 100 points)

  // A. Identité & KYC (20 points)
  const points_kyc = kyc_valide ? 20 : 0;

  // B. Exactitude des descriptions (30 points)
  const clampedDescriptionPct = Math.min(100, Math.max(0, descriptions_exactes_pourcentage));
  const points_descriptions = Number(((clampedDescriptionPct / 100) * 30).toFixed(2));

  // C. Rapidité de remise au livreur (20 points)
  let points_rapidite = 4;
  if (delai_moyen_remise_livreur_minutes <= 30) {
    points_rapidite = 20;
  } else if (delai_moyen_remise_livreur_minutes <= 60) {
    points_rapidite = 16;
  } else if (delai_moyen_remise_livreur_minutes <= 120) {
    points_rapidite = 12;
  } else if (delai_moyen_remise_livreur_minutes <= 240) {
    points_rapidite = 8;
  }

  // D. Fiabilité & Taux d'annulation (20 points)
  let points_fiabilite_annulation = 20;
  if (taux_annulation_vendeur <= 0.01) {
    points_fiabilite_annulation = 20;
  } else if (taux_annulation_vendeur <= 0.03) {
    points_fiabilite_annulation = 18;
  } else if (taux_annulation_vendeur <= 0.05) {
    points_fiabilite_annulation = 14;
  } else if (taux_annulation_vendeur <= 0.10) {
    points_fiabilite_annulation = 8;
  } else {
    points_fiabilite_annulation = Math.max(0, 20 - Math.round(taux_annulation_vendeur * 100));
  }

  // E. Expérience & Volume de commandes (10 points)
  let points_commandes = 0;
  if (commandes_totales >= 40) points_commandes = 5;
  else if (commandes_totales >= 20) points_commandes = 4;
  else if (commandes_totales >= 10) points_commandes = 3;
  else if (commandes_totales >= 3) points_commandes = 2;
  else if (commandes_totales >= 1) points_commandes = 1;

  let points_anciennete = 0;
  if (anciennete_jours >= 90) points_anciennete = 5;
  else if (anciennete_jours >= 60) points_anciennete = 4;
  else if (anciennete_jours >= 30) points_anciennete = 3;
  else if (anciennete_jours >= 10) points_anciennete = 2;
  else if (anciennete_jours > 0) points_anciennete = 1;

  const points_experience = points_commandes + points_anciennete;

  // Calcul du score brut et normalisation entre 0 et 100
  const rawScore = points_kyc + points_descriptions + points_rapidite + points_fiabilite_annulation + points_experience;
  const trust_score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // 2. Attribution des badges mérités
  const badges_attribues: string[] = [];

  if (kyc_valide) {
    badges_attribues.push("Vendeur Vérifié (KYC)");
  }

  if (delai_moyen_remise_livreur_minutes <= 30) {
    badges_attribues.push("Expédition Express (< 30 min)");
  } else if (delai_moyen_remise_livreur_minutes <= 120) {
    badges_attribues.push("Expédition Rapide (< 2h)");
  }

  if (descriptions_exactes_pourcentage >= 95) {
    badges_attribues.push(`Conformité Description ${descriptions_exactes_pourcentage}%`);
  }

  if (taux_annulation_vendeur <= 0.03 && commandes_totales >= 5) {
    badges_attribues.push("Taux d'Annulation Minimal (< 3%)");
  }

  if (trust_score >= 95 && commandes_totales >= 20) {
    badges_attribues.push("Vendeur d'Élite");
  } else if (trust_score >= 85 && commandes_totales >= 10) {
    badges_attribues.push("Top Vendeur");
  }

  if (anciennete_jours >= 100) {
    badges_attribues.push("Vendeur Expérimenté (100+ j)");
  }

  // 3. Détermination du niveau de confiance
  let niveau_confiance: 'Excellent' | 'Bon' | 'À surveiller' = 'Bon';
  if (trust_score >= 85) {
    niveau_confiance = 'Excellent';
  } else if (trust_score >= 65) {
    niveau_confiance = 'Bon';
  } else {
    niveau_confiance = 'À surveiller';
  }

  // 4. Rédaction du résumé public
  let resume_public = '';
  if (niveau_confiance === 'Excellent') {
    resume_public = `Vendeur certifié avec une excellente réactivité (remise aux livreurs en ${delai_moyen_remise_livreur_minutes} minutes en moyenne) et un taux de conformité des articles quasi parfait (${descriptions_exactes_pourcentage}%) sur ${commandes_totales} transactions réalisées sans incident.`;
  } else if (niveau_confiance === 'Bon') {
    resume_public = `Vendeur actif avec un bon historique de vente (${commandes_totales} commandes honorées) et une expédition moyenne sous ${delai_moyen_remise_livreur_minutes} minutes avec ${descriptions_exactes_pourcentage}% de conformité.`;
  } else {
    resume_public = `Vendeur sous observation : profil récent ou délai de livraison allongé (${delai_moyen_remise_livreur_minutes} min). Inspection physique contradictoire à la livraison recommandée.`;
  }

  return {
    trust_score,
    badges_attribues,
    niveau_confiance,
    resume_public,
    details_score: {
      points_kyc,
      points_descriptions,
      points_rapidite,
      points_fiabilite_annulation,
      points_experience
    }
  };
}

// Alias pour compatibilité anglophone / camelCase
export const calculateSellerTrustScore = evaluerCredibiliteVendeur;
