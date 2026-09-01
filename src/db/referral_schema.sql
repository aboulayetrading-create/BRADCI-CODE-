-- ==========================================================
-- BRAD'CI - SCHÉMA DE BASE DE DONNÉES DU SYSTÈME DE PARRAINAGE
-- Réciproque, Sécurisé et Plafonné à 10 000 FCFA (Max 10 Filleuls)
-- Compatible PostgreSQL / MySQL (InnoDB)
-- ==========================================================

-- 1. MISE À JOUR DE LA TABLE `users`
-- Ajout des colonnes de gestion du parrainage et des soldes dédiés
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_bonus INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_bonus INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_first_tx_done BOOLEAN NOT NULL DEFAULT FALSE;

-- Index pour accélérer la recherche par code parrain et parrainage
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Contrainte de plafond : referral_count ne doit jamais dépasser 10
ALTER TABLE users 
  ADD CONSTRAINT chk_users_max_referral_count CHECK (referral_count >= 0 AND referral_count <= 10);

-- Contrainte de positivité des soldes de parrainage
ALTER TABLE users 
  ADD CONSTRAINT chk_users_pending_bonus_positive CHECK (pending_bonus >= 0),
  ADD CONSTRAINT chk_users_available_bonus_positive CHECK (available_bonus >= 0);


-- 2. TABLE `referrals` (Historique et Traçabilité des Relations Parrain-Filleul)
CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR(36) PRIMARY KEY,
  sponsor_id VARCHAR(36) NOT NULL,
  referee_id VARCHAR(36) NOT NULL UNIQUE, -- Un utilisateur ne peut être filleul qu'une seule fois
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING_KYC',
  sponsor_bonus_amount INT NOT NULL DEFAULT 1000, -- 1 000 FCFA pour le parrain
  referee_bonus_amount INT NOT NULL DEFAULT 1000, -- 1 000 FCFA pour le filleul
  first_tx_type VARCHAR(20) NULL, -- 'purchase' (Achat) ou 'sale' (Vente)
  first_tx_order_id VARCHAR(36) NULL, -- Référence de la course / commande livrée avec OTP
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  kyc_validated_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,

  -- Contraintes d'intégrité
  CONSTRAINT fk_referrals_sponsor FOREIGN KEY (sponsor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_referrals_referee FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_referral_status CHECK (status IN ('PENDING_KYC', 'PENDING_TRANSACTION', 'COMPLETED')),
  CONSTRAINT chk_prevent_self_referral CHECK (sponsor_id <> referee_id) -- Interdiction formelle de s'auto-parrainer
);

-- Index pour requêtes performantes
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_id ON referrals(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);


-- 3. TABLE DE LOGS D'UTILISATION DU SOLDE PARRAINAGE (`referral_transactions`)
-- Traçabilité stricte : le solde est NON-RETIRABLE en cash Mobile Money et utilisable UNIQUEMENT pour les achats BRAD'CI
CREATE TABLE IF NOT EXISTS referral_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36) NOT NULL,
  amount_spent INT NOT NULL, -- Déduit du available_bonus
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_ref_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_spent_positive CHECK (amount_spent > 0)
);

CREATE INDEX IF NOT EXISTS idx_ref_tx_user_id ON referral_transactions(user_id);
