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
export type MapProvider = 'google' | 'yango';

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
  kycDocumentType?: 'cni' | 'passeport' | 'attestation' | 'permis';
  kycDocumentNumber?: string;
  kycPhotoUrl?: string;
  kycSelfieUrl?: string;
  kycDriverLicenseUrl?: string;
  kycDriverLicenseSelfieUrl?: string;
  kycVehicleRegistrationUrl?: string;
  kycSubmittedAt?: string;
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
    type: VehicleType;
  };
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
}

export type VehicleType = 'moto' | 'voiture' | 'cargo';

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

export interface Product {
  id: string;
  title: string;
  description: string;
  category: 'High-Tech' | 'Mode & Luxe' | 'Maison & Électro' | 'Véhicules & Pièces' | 'Gaming' | 'Divers';
  listingType?: ListingType; // 'auction' for Enchères, 'shop' for Annonces Boutique
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerPlan: SellerPlan;
  shopId?: string;
  shopName?: string;
  images: string[]; // Up to 3 images
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
  pickupAddress: string;
  pickupCoords?: { lat: number; lng: number };
  requiredVehicle: VehicleType;
  pickupCode: string; // 4-digit code given to courier at pickup
  deliveryOtpCode: string; // 4-digit OTP given by buyer at delivery
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
  commissionRate: number; // 0.10 (Basic), 0.075 (Standard), 0.05 (Pro)
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
  status: 'pending_review' | 'acknowledged' | 'banned';
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
  status: 'available' | 'accepted' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled' | 'returning' | 'returned';
  driverArrivedAtDestination?: boolean;
  inspectionStatus?: 'pending_arrival' | 'arrived_inspecting' | 'client_confirmed_good' | 'client_confirmed_bad';
  arrivalTimestamp?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedDriverVehicle?: VehicleType;
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
}

export interface EscrowRecord {
  id: string;
  productId: string;
  productTitle: string;
  amount: number; // Total held
  sellerAmount: number; // Amount to pay seller
  commissionAmount: number; // Brad'CI cut
  commissionRatePercent: number; // 10%, 7.5%, 5%
  deliveryFee: number;
  buyerName: string;
  sellerName: string;
  status: 'held' | 'released' | 'refunded' | 'disputed' | 'returned_delivery_paid';
  paymentMethod: 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money';
  createdAt: string;
  releasedAt?: string;
}

export interface KYCRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: UserRole;
  documentType: 'cni' | 'passeport' | 'attestation' | 'permis';
  documentNumber: string;
  documentPhoto: string;
  selfiePhoto: string;
  driverLicensePhoto?: string;
  driverLicenseSelfiePhoto?: string;
  vehicleRegistrationPhoto?: string;
  submittedAt: string;
  status: KYCStatus;
  isDuplicate: boolean;
  duplicateUserIds?: string[];
  reviewedBy?: string;
  reviewNotes?: string;
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
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  quickReplies?: string[];
}

export type TimeFilter = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';

export type PaymentMethod = 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: UserRole;
  requestedAmount: number; // in FCFA
  feeAmount: number; // Brad'CI service fee or 0
  netAmount: number; // Net transferred to phone
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
  type: 'commission_sale' | 'commission_delivery' | 'subscription_pass_standard' | 'subscription_pass_pro' | 'subscription_pass_driver' | 'escrow_deposit' | 'withdrawal_payout' | 'delivery_fee' | 'order_refund';
  description: string;
  category: 'commission' | 'subscription' | 'escrow' | 'payout' | 'delivery' | 'refund';
  grossAmount: number; // in FCFA
  netRevenueBradCi: number; // in FCFA
  userName: string;
  userRole: UserRole;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  hour: number; // 0-23
  status: 'completed' | 'pending' | 'refunded';
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
  recipientRole: UserRole | 'all';
  recipientUserId?: string;
  title: string;
  message: string;
  type: 'delivery' | 'inspection' | 'bid' | 'payment' | 'withdrawal' | 'system' | 'return' | 'fraud_strike' | 'stock_empty';
  timestamp: string;
  isRead: boolean;
  jobId?: string;
  productId?: string;
  urgency?: 'normal' | 'high' | 'critical';
}

