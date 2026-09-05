export type UserRole = 'visitor' | 'client' | 'driver' | 'admin';

export type SellerPlan = 'basic' | 'standard' | 'pro'; // basic: Gratuit (3 items), standard: Pass Pro Boutique Inférieure 5 000 F (15 items), pro: Pass Illimité Boutique Supérieure 10 000 F (unlimited)
export type DriverPlan = 'trial' | 'vip_pass';

export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  commune?: string;
  address?: string;
  timestamp?: string;
}

export interface ShopProfile {
  id: string;
  sellerId: string;
  name: string;
  slogan?: string;
  description: string;
  logo: string;
  banner: string;
  commune: string;
  district?: string;
  address: string;
  phone: string;
  whatsapp?: string;
  category: string;
  verifiedBadge: boolean;
  tier: 'standard' | 'pro';
  viewsCount: number;
  salesCount: number;
  rating: number;
  openingHours?: string;
  gpsCoords?: { lat: number; lng: number };
  isClosed?: boolean;
  closedReason?: string;
}

export type AppLanguage = 'fr' | 'en';
export type AppTheme = 'dark' | 'light' | 'auto';
export type MapProvider = 'google' | 'satellite' | 'radar';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  sellerPlan?: SellerPlan;
  driverPlan?: DriverPlan;
  productsPublishedCount: number; // Max 3 on Basic, Max 15 on Standard, unlimited on Pro
  trialDeliveriesRemaining?: number; // Starts at 5 for trial driver
  kycStatus: KYCStatus;
  isVerified?: boolean;
  hasShop?: boolean;
  kycDocumentType?: 'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire';
  kycDocumentNumber?: string;
  kycPhotoUrl?: string;
  kycSelfieUrl?: string;
  kycSelfieWithIdUrl?: string;
  kycDriverLicenseUrl?: string;
  kycDriverLicenseVersoUrl?: string;
  kycDriverLicenseSelfieUrl?: string;
  kycVehicleRegistrationUrl?: string;
  kycVehicleRegistrationVersoUrl?: string;
  kycSubmittedAt?: string;
  biometricVerified?: boolean;
  biometricScore?: number;
  emailVerified?: boolean;
  emailVerificationOtp?: string;
  walletBalance: number; // in FCFA (Solde disponible pour retrait)
  blockedBalance?: number; // in FCFA (Solde vendeur bloqué en attente de livraison)
  buyerBlockedBalance?: number; // in FCFA (Solde acheteur bloqué sous séquestre pour commandes en cours)
  isVIP?: boolean;
  isOnline?: boolean;
  driverAvailability?: 'available' | 'busy' | 'offline';
  vehicleDetails?: {
    model: string;
    plate: string;
    color?: string;
    type: VehicleType;
  };
  kycVehiclePlate?: string;
  kycVehicleColor?: string;
  kycVehicleModel?: string;
  kycVehicleType?: VehicleType;
  gpsLocation?: GPSLocation;
  shop?: ShopProfile;
  rating?: number; // e.g. 4.9
  reviewCount?: number;
  isSuspended?: boolean;
  suspensionReason?: string;
  fraudStrikesCount?: number; // 0, 1, 2, or 3 (3 = suspended)
  fraudAlerts?: Array<{
    id: string;
    timestamp: string;
    reason: string;
    itemTitle?: string;
    detectedText?: string;
    strikeNumber: number;
  }>;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  createdAt?: string;
  lastActiveAt?: string;
  totalPurchasesCount?: number;
  totalSalesCount?: number;
  totalSpentFCFA?: number;
  totalEarnedFCFA?: number;
  // Referral System Fields
  referralCode?: string; // e.g. "BRAD-89A2"
  referredBy?: string; // Referral code of sponsor
  referralCount?: number; // 0 to 10 (Max 10)
  pendingReferralBonus?: number; // in FCFA (Solde en attente de transaction)
  referralBalance?: number; // in FCFA (Solde d'achat utilisable)
  isKycVerified?: boolean;
  isFirstTxDone?: boolean; // True once 1st buy or sell is validated via OTP
  // COD (Cash On Delivery) Sanction and Progressive Recovery System
  isCodSuspended?: boolean; // If buyer cancelled at delivery or was absent for 20+ min
  codSuspensionReason?: string;
  codSuspendedAt?: string;
  prepaidOrdersCompletedCount?: number; // Number of prepaid orders completed since suspension (needs 5 to unlock COD)
  requiredPrepaidOrdersToUnlockCod?: number; // Default 5
  // B2B Enterprise Account
  isEnterpriseAccount?: boolean;
  companyName?: string;
  businessSector?: string;
  // Seller Credibility & Trust Engine (BRAD'CI Algorithme)
  sellerCredibility?: {
    trust_score: number;
    badges_attribues: string[];
    niveau_confiance: 'Excellent' | 'Bon' | 'À surveiller';
    resume_public: string;
    delai_moyen_remise_livreur_minutes?: number;
    descriptions_exactes_pourcentage?: number;
  };
}

export type ReferralStatus = 'PENDING_KYC' | 'PENDING_TRANSACTION' | 'COMPLETED';

export interface ReferralRecord {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorReferralCode: string;
  refereeId: string;
  refereeName: string;
  refereePhone?: string;
  refereeAvatar?: string;
  refereeKycStatus: KYCStatus;
  status: ReferralStatus;
  sponsorBonusAmount: number; // 1000 FCFA
  refereeBonusAmount: number; // 1000 FCFA
  createdAt: string;
  kycValidatedAt?: string;
  completedAt?: string;
  firstTxOrderId?: string;
  firstTxType?: 'purchase' | 'sale';
}

export type VehicleType = 'moto' | 'voiture' | 'car' | 'cargo';

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  bidderAvatar: string;
  amount: number;
  timestamp: string;
  isLeading?: boolean;
  bidderRating?: number;
  bidderCommune?: string;
  bidderDistrict?: string;
  bidderDistanceKm?: number;
  bidderPhone?: string;
  bidderGps?: { lat: number; lng: number };
}

export type ProductStatus = 'pending_approval' | 'active' | 'pending_choice' | 'pending_buyer_deposit' | 'sold' | 'in_transit' | 'delivered' | 'cancelled' | 'rejected' | 'returning' | 'returned';
export type ListingType = 'auction' | 'shop';

export type B2BLotType = 'it_fleet' | 'fashion_stock' | 'appliances_stock' | 'office_furniture' | 'raw_material' | 'industrial_equipment' | 'wholesale_mix';
export type B2BSaleKind = 'destockage' | 'liquidation';
export type B2BCompanyType = 'enterprise' | 'wholesaler' | 'retail_chain' | 'it_park_renewer' | 'liquidator' | 'distributor';

export interface B2BManifestItem {
  id: string;
  designation: string;
  brand?: string;
  model?: string;
  quantity: number;
  unitCondition: 'neuf_scelle' | 'reconditionne_a' | 'tres_bon_etat' | 'fonctionnel' | 'pour_pieces';
  estimatedUnitValueFCFA: number;
  specsSummary?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: 'High-Tech' | 'Mode & Luxe' | 'Maison & Électro' | 'Véhicules & Pièces' | 'Gaming' | 'Divers' | 'Déstockage B2B';
  listingType?: ListingType; // 'auction' for Enchères, 'shop' for Annonces Boutique
  
  // B2B Déstockage & Liquidation
  isB2BLot?: boolean; // Vrai s'il s'agit d'un lot de liquidation / déstockage B2B
  b2bSaleKind?: B2BSaleKind; // 'destockage' (Surplus, fin de série) ou 'liquidation' (Liquidation totale, fermeture, parc)
  b2bLotType?: B2BLotType;
  b2bCompanyName?: string;
  b2bTotalUnitsCount?: number; // Ex: 50 ordinateurs, 100 paires de chaussures
  b2bLotCondition?: 'neuf_surplus' | 'reconditionne_pro' | 'retour_client' | 'fin_de_serie' | 'parc_renouvele';
  b2bEstimatedPublicValueFCFA?: number; // Valeur marchande publique totale estimée
  b2bManifest?: B2BManifestItem[]; // Inventaire détaillé du lot
  b2bWarehouseLocation?: string; // Zone industrielle ou commune (ex: Zone Industrielle Yopougon, Vridi, Koumassi)
  b2bMinimumBidIncrementFCFA?: number; // Pas d'enchère spécifique pour les gros lots (ex: 50 000 F)
  b2bInspectionAllowed?: boolean; // Visite sur site de stockage autorisée avant clôture
  b2bInspectionHours?: string;
  
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerPlan: SellerPlan;
  shopId?: string;
  shopName?: string;
  images: string[]; // Up to 3 images
  imageUrl?: string;
  videoUrl?: string; // Max 1 video (max 45 seconds)
  videoDurationSeconds?: number;
  startingPrice: number; // in FCFA
  currentPrice: number; // in FCFA
  buyNowPrice?: number; // for direct purchase in shop
  reservePrice?: number;
  bids: Bid[];
  status: ProductStatus;
  approvalType?: 'flash' | 'standard';
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  expiresAt: string; // ISO String
  commune: string; // Cocody, Marcory, Plateau, etc.
  address?: string;
  pickupAddress: string;
  pickupCoords?: { lat: number; lng: number };
  requiredVehicle: VehicleType;
  pickupCode: string; // 4-digit code given to courier at pickup
  deliveryOtpCode: string; // 4-digit OTP given by buyer at delivery
  deliveryFee?: number;
  returnOtpCode?: string; // 4-digit OTP given by buyer if rejecting/cancelling parcel
  isBoosted?: boolean;
  winnerId?: string;
  winnerName?: string;
  selectedBidderId?: string;
  selectedBidderName?: string;
  declinedBidderIds?: string[];
  soldAt?: string;
  pinnedUntil?: string;
  isPinnedSold?: boolean;
  deliveryJobId?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: 'PENDING' | 'PAYMENT_SUCCESS' | 'PAID' | 'COMPLETED' | 'FAILED';
  paidAt?: string;
  otpGeneratedAt?: string;
  commissionRate: number; // 0.10 (Basic), 0.05 (Standard/Intermédiaire), 0.025 (Pro)
  stockQuantity?: number; // Obligatoire pour les boutiques (ex: 5 unités en stock)
  soldCount?: number; // Nombre d'unités déjà vendues pour cette annonce boutique
  isOutOfStock?: boolean; // Vrai si le stock est tombé à 0
  outOfStockSince?: string; // Date ISO du passage en rupture de stock (suppression automatique après 14 jours)
  isAutoDeleted?: boolean; // Vrai si supprimé automatiquement après 14 jours d'inactivité de stock
  fraudRejectionReason?: string; // Motif de rejet anti-fraude si détecté
  rating?: number; // Product rating 1-5
  ratingCount?: number;
}

export interface FraudIncidentRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userRole: UserRole;
  type: 'phone_in_desc' | 'whatsapp_keyword' | 'phone_in_image' | 'suspicious_link' | 'direct_contact';
  detectedContent: string;
  productId?: string;
  productTitle?: string;
  timestamp: string;
  strikeNumber: number; // 1, 2, 3
  actionTaken: 'warning_sent' | 'strike_applied' | 'account_suspended';
  status: 'pending_review' | 'acknowledged' | 'banned' | 'resolved';
  adminNotes?: string;
}

export interface DeliveryJob {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  sellerName: string;
  sellerPhone: string;
  pickupCommune: string;
  pickupAddress: string;
  pickupCoords: { lat: number; lng: number };
  buyerName: string;
  buyerPhone: string;
  dropoffCommune: string;
  dropoffAddress: string;
  dropoffCoords: { lat: number; lng: number };
  requiredVehicle: VehicleType;
  deliveryFee: number; // FCFA
  itemValue: number; // FCFA
  status: 'available' | 'accepted' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled' | 'returning' | 'returned' | 'pending_driver' | 'assigned';
  orderStatus?: OrderStatus;
  paymentStatus?: 'PENDING' | 'PAYMENT_SUCCESS' | 'PAID' | 'COMPLETED' | 'FAILED';
  paymentOperator?: PaymentMethod;
  paidAt?: string;
  completedAt?: string;
  otpGeneratedAt?: string;
  driverArrivedAtDestination?: boolean;
  inspectionStatus?: 'pending_arrival' | 'arrived_inspecting' | 'client_confirmed_good' | 'client_confirmed_bad';
  arrivalTimestamp?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedDriverVehicle?: VehicleType;
  assignedDriverVehiclePlate?: string;
  assignedDriverVehicleColor?: string;
  assignedDriverVehicleModel?: string;
  pickupCode: string;
  deliveryOtpCode: string;
  returnOtpCode?: string;
  returnReason?: string;
  isReturnConfirmedBySeller?: boolean;
  returnedAt?: string;
  currentLat?: number;
  currentLng?: number;
  distanceKm?: number;
  etaMinutes?: number;
  estimatedDurationMin?: number;
  // Packaging & Delay Penalty Tracking
  driverArrivedAtSellerTimestamp?: string;
  sellerPackagingTimerStartedAt?: string;
  sellerPackagingDelayMinutes?: number;
  sellerPackagingPenaltyFCFA?: number; // 100 FCFA / min past 10 min
  sellerPackagingVerified?: boolean; // Driver verified unpackaged item before packing
  driverDepartureTimestamp?: string;
  driverEstimatedDurationMinutes?: number;
  driverTransitDelayMinutes?: number;
  driverTransitPenaltyFCFA?: number; // 100 FCFA / min past (ETA + 20 min)
  driverArrivedAtBuyerTimestamp?: string;
  driverCannotCancel?: boolean;
  activeDriversBrowsingCount?: number;
  // Absent Buyer & 20-min wait / 15% compensation fields
  buyerAbsentWaitStartedAt?: string; // ISO string when 20 min timer started
  buyerAbsentElapsedSeconds?: number;
  cancellationType?: 'buyer_absent_timeout' | 'buyer_refused_inspection' | 'buyer_cancelled';
  driverCompensationBonusFCFA?: number; // 15% of item value paid to driver wallet
  returnTripDirectionCommune?: string; // Direction of the seller for route matching
  
  // Cart & Multi-Pickup Grouped Delivery Fields
  isCartConsolidated?: boolean;
  cartOrderRecordId?: string;
  masterDeliveryOtp?: string;
  pickupStops?: CartPickupStop[];
  cartItemsSummary?: {
    totalItems: number;
    uniqueSellers?: number;
    items: {
      productId: string;
      title: string;
      quantity: number;
      price: number;
      sellerName: string;
      channel: CartItemChannel;
      image: string;
      pickupCode?: string;
    }[];
  };
}

export type CartItemChannel = 'boutique' | 'enchere' | 'destockage' | 'liquidation';

export interface CartItem {
  id: string; // unique item id in cart
  productId: string;
  productTitle: string;
  productImage: string;
  title?: string;
  imageUrl?: string;
  image?: string;
  price?: number;
  category: string;
  channel: CartItemChannel;
  unitPrice: number; // in FCFA
  quantity: number;
  maxAvailableStock: number; // e.g. stockQuantity or 1 for auction/unique lots
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  shopId?: string;
  shopName?: string;
  sellerAvatar?: string;
  commune: string;
  pickupAddress: string;
  pickupCoords?: { lat: number; lng: number };
  requiredVehicle: VehicleType;
  pickupCode: string; // 4-digit code for this seller
  isB2BLot?: boolean;
  b2bSaleKind?: B2BSaleKind;
  b2bTotalUnitsCount?: number;
  b2bCompanyName?: string;
}

export interface CartSellerGroup {
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  shopId?: string;
  shopName?: string;
  sellerAvatar?: string;
  commune: string;
  sellerCommune?: string;
  pickupAddress: string;
  sellerAddress?: string;
  pickupCoords?: { lat: number; lng: number };
  pickupCode: string; // Individual pickup code for driver at this seller
  sellerPickupCode?: string;
  itemsCount?: number;
  isPickedUp?: boolean;
  pickedUpAt?: string;
  items: CartItem[];
  subtotal: number;
  sellerSubtotal?: number;
  requiredVehicle: VehicleType;
}

export interface CartPickupStop {
  stopIndex: number; // 1, 2, 3...
  stopId?: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  commune: string;
  address: string;
  coords: { lat: number; lng: number };
  pickupCode: string;
  itemCount: number;
  itemTitles: string[];
  isCompleted: boolean;
  completedAt?: string;
}

export interface CartDeliveryOptimization {
  totalItemCount: number;
  totalUniqueSellers: number;
  uniqueSellersCount: number;
  totalUniqueCommunes: number;
  dominantVehicle: VehicleType;
  rawIndividualDeliveryFees: number; // If paid separately (e.g. 3 x 2000 = 6000 F)
  rawDeliveryFeeSum: number;
  optimizedDeliveryFee: number; // Grouped fee (e.g. 2500 F)
  groupingSavingsFCFA: number; // Savings for buyer (e.g. 3500 F)
  totalDeliverySavings: number;
  driverMultiPickupBonusFCFA: number; // Multi-stop incentive for driver
  pickupStops: CartPickupStop[];
  sellerGroups: CartSellerGroup[];
  itemsSubtotal: number;
  totalCostEstimate: number;
  totalDistanceKm: number;
  estimatedMinutesTotal: number;
}

export interface CartOrderRecord {
  id: string; // e.g. "ORDER-CART-XXXX"
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  dropoffCommune: string;
  dropoffAddress: string;
  dropoffCoords: { lat: number; lng: number };
  items: CartItem[];
  sellerGroups: CartSellerGroup[];
  itemsSubtotalFCFA: number;
  rawDeliveryFeesFCFA: number;
  optimizedDeliveryFeeFCFA: number;
  deliverySavingsFCFA: number;
  referralDiscountFCFA?: number;
  totalAmountPaidFCFA: number;
  paymentMethod: PaymentMethod;
  paymentChoice: 'delivery' | 'direct';
  paymentStatus?: 'PENDING' | 'PAYMENT_SUCCESS' | 'PAID' | 'COMPLETED';
  status?: string;
  totalItemsCount?: number;
  appliedReferralDiscountFCFA?: number;
  optimizationSummary?: any;
  trackingTimeline?: any;
  deliveryJobId?: string;
  masterDeliveryOtp: string; // Unified 4-digit OTP for final client handover
  createdAt: string;
  completedAt?: string;
  invoiceAuditId?: string;
}

export type OrderStatus = 'PENDING' | 'IN_TRANSIT' | 'ARRIVED' | 'PAYMENT_PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export interface DirectPaymentRecord {
  id: string;
  orderId?: string;
  jobId?: string;
  productId: string;
  productTitle?: string;
  totalAmount?: number; // Total payé par l'acheteur (itemValue + deliveryFee)
  totalAmountPaid?: number; // Total payé
  productPrice: number;
  deliveryFee: number;
  sellerAmount?: number; // Montant net versé au vendeur (productPrice - commission)
  sellerPayout?: number;
  commissionAmount: number; // Montant commission BRAD'CI
  commissionRatePercent?: number; // 10% (Basic), 5% (Intermédiaire), 2.5% (Pro)
  commissionPercent?: number;
  platformFee?: number;
  driverAmount?: number; // Montant versé au livreur (deliveryFee)
  buyerName: string;
  sellerName: string;
  driverName?: string;
  paymentMethod: PaymentMethod;
  status?: 'PENDING' | 'PAYMENT_SUCCESS' | 'COMPLETED' | 'FAILED' | 'SUCCESS';
  paymentStatus?: 'PENDING' | 'PAYMENT_SUCCESS' | 'COMPLETED' | 'FAILED' | 'SUCCESS' | 'PAID';
  transactionReference?: string;
  paidAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface EscrowRecord {
  id: string;
  productId: string;
  productTitle: string;
  amount: number; // Total Pay on Delivery
  sellerAmount: number; // Net versé au vendeur
  commissionAmount: number; // Brad'CI cut
  commissionRatePercent: number; // 10%, 5%, 2.5%
  deliveryFee: number;
  buyerName: string;
  sellerName: string;
  status: 'held' | 'released' | 'refunded' | 'disputed' | 'returned_delivery_paid';
  paymentMethod: PaymentMethod;
  createdAt: string;
  releasedAt?: string;
}

export interface KYCRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: UserRole;
  documentType: 'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire';
  documentNumber: string;
  documentPhoto: string;
  selfiePhoto: string;
  selfieWithIdPhoto?: string;
  driverLicensePhoto?: string;
  driverLicenseVersoPhoto?: string;
  driverLicenseSelfiePhoto?: string;
  vehicleRegistrationPhoto?: string;
  vehicleRegistrationVersoPhoto?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  vehicleModel?: string;
  vehicleType?: VehicleType;
  submittedAt: string;
  status: KYCStatus;
  isDuplicate: boolean;
  duplicateUserIds?: string[];
  reviewedBy?: string;
  reviewNotes?: string;
  biometricScore?: number;
  biometricVerified?: boolean;
}

export interface ReviewRecord {
  id: string;
  jobId: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  driverId: string;
  driverName: string;
  sellerRating: number; // 1-5
  sellerComment: string;
  sellerQuickTags: string[];
  driverRating: number; // 1-5
  driverComment: string;
  driverQuickTags: string[];
  createdAt: string;
  syntheticReport?: string;
  targetId?: string;
  targetType?: 'seller' | 'driver' | 'shop' | 'product';
  targetName?: string;
  authorName?: string;
  rating?: number;
  comment?: string;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  quickReplies?: string[];
}

export type TimeFilter = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';

export type DriverTab = 'available_orders' | 'active_mission' | 'history' | 'profile';

export type PaymentMethod = 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Carte Bancaire';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: UserRole;
  requestedAmount: number; // in FCFA
  feeAmount: number; // Brad'CI service fee or 0
  netAmount: number; // Net transferred to phone
  netPayoutAmount?: number;
  paymentMethod: PaymentMethod;
  destinationPhone: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  rejectionReason?: string;
  referenceNumber: string;
}

export interface AdminAlert {
  id: string;
  type: 'withdrawal_request' | 'kyc_duplicate' | 'dispute' | 'high_value_escrow' | 'driver_issue' | 'fraud_incident' | 'stock_empty';
  title: string;
  message: string;
  channel: 'sms' | 'whatsapp' | 'system';
  targetAdminPhone: string;
  timestamp: string;
  isRead: boolean;
  metadata?: {
    withdrawalId?: string;
    userId?: string;
    amount?: number;
    phone?: string;
    incidentId?: string;
    strikeNumber?: number;
    productId?: string;
  };
}

export interface FinancialTransaction {
  id: string;
  type: 'commission_sale' | 'commission_delivery' | 'subscription_pass_standard' | 'subscription_pass_pro' | 'subscription_pass_driver' | 'escrow_deposit' | 'withdrawal_payout' | 'delivery_fee' | 'order_refund' | 'revenue' | 'commission';
  description: string;
  category?: 'commission' | 'subscription' | 'escrow' | 'payout' | 'delivery' | 'refund' | 'revenue' | 'commission_sale' | 'commission_delivery';
  grossAmount?: number; // in FCFA
  netRevenueBradCi?: number; // in FCFA
  userName?: string;
  userRole?: UserRole;
  paymentMethod?: PaymentMethod;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  hour?: number; // 0-23
  status: 'completed' | 'pending' | 'refunded';
  timestamp?: string;
  amount?: number;
  fee?: number;
  netAmount?: number;
  fromUserName?: string;
  toUserName?: string;
  reference?: string;
}

export interface SentAdminMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  channel: 'in_app' | 'sms' | 'whatsapp';
  subject?: string;
  message: string;
  sentAt: string;
  status: 'delivered' | 'sent';
}

export interface AppNotification {
  id: string;
  recipientRole?: UserRole | 'all';
  recipientUserId?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'delivery' | 'inspection' | 'bid' | 'payment' | 'withdrawal' | 'system' | 'return' | 'fraud_strike' | 'stock_empty' | 'review' | 'referral';
  timestamp: string;
  isRead: boolean;
  jobId?: string;
  productId?: string;
  linkTo?: string;
  urgency?: 'normal' | 'high' | 'critical';
}

