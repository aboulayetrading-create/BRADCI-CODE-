import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  User, 
  Product, 
  DeliveryJob, 
  Bid,
  EscrowRecord,
  DirectPaymentRecord,
  OrderStatus,
  KYCRecord, 
  UserRole, 
  SellerPlan, 
  DriverPlan,
  GPSLocation,
  ShopProfile,
  WithdrawalRequest,
  FinancialTransaction,
  AdminAlert,
  TimeFilter,
  PaymentMethod,
  SentAdminMessage,
  AppNotification,
  OutbidAlertInfo,
  AppLanguage,
  AppTheme,
  MapProvider,
  ReviewRecord,
  FraudIncidentRecord,
  ReferralRecord,
  VehicleType,
  DriverTab,
  CartItem,
  CartItemChannel,
  CartSellerGroup,
  CartPickupStop,
  CartDeliveryOptimization,
  CartOrderRecord,
  DriverRechargePass,
  DirectCourierOrderInput,
  DeliveryJobKind
} from '../types';
import { 
  createCartItemFromProduct,
  groupCartItemsBySeller,
  calculateCartDeliveryOptimization,
  generateCartInvoiceHTML
} from '../utils/cartOptimizationEngine';
import { 
  INITIAL_USERS, 
  INITIAL_PRODUCTS, 
  INITIAL_FREIGHT_JOBS, 
  INITIAL_ESCROW_RECORDS, 
  INITIAL_KYC_RECORDS,
  INITIAL_WITHDRAWAL_REQUESTS,
  INITIAL_FINANCIAL_TRANSACTIONS,
  INITIAL_ADMIN_ALERTS,
  INITIAL_REFERRALS
} from '../data/mockData';
import { calculateHaversineDistance, findNearestCommune, getCommuneCoords, calculateDeliveryFee, calculateCommuneDistanceKm } from '../data/communes';
import { getTranslation, TranslationKey } from '../utils/translations';
import { detectFraudulentContact, detectImageFraud, BRAD_CI_TERMS } from '../utils/fraudFilter';
import { 
  voiceNavigator, 
  playOrderAlertSound, 
  playSuccessChime, 
  playOutbidAlertSound,
  announceDriverIncomingOrder,
  announcePurchaseSuccess,
  announceSaleSuccess
} from '../utils/voiceNavigator';
import { 
  createPaymentAuditLog, 
  TransactionAuditInput, 
  PaymentAuditLog,
  getStoredAuditLogs
} from '../utils/paymentAuditReceiptService';
import { nativeBridge, NativePhotoSource, NativeCameraFacing } from '../utils/nativeBridge';
import { 
  sendUniversalPush, 
  requestUniversalNotificationPermission,
  BRADCI_NOTIFICATION_CHANNEL_ID 
} from '../utils/universalNotifications';
import { sendOtpEmail } from '../services/resendEmailService';

interface ToastNotification {
  id: string;
  title: string;
  desc: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  products: Product[];
  freightJobs: DeliveryJob[];
  setFreightJobs: React.Dispatch<React.SetStateAction<DeliveryJob[]>>;
  escrowRecords: EscrowRecord[];
  directPaymentRecords: DirectPaymentRecord[];
  kycRecords: KYCRecord[];
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Language, Theme, Voice, Map Provider
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  translate: (fr: string, en: string) => string;
  theme: AppTheme;
  effectiveTheme: 'dark' | 'light';
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  voiceEnabled: boolean;
  toggleVoice: () => void;
  readCurrentScreenAloud: () => void;
  mapProvider: MapProvider;
  setMapProvider: (provider: MapProvider) => void;

  // KYC Modal & Anti-Fraud
  kycModalOpen: boolean;
  setKycModalOpen: (open: boolean) => void;
  adminInstantApproveMyKYC: () => void;
  kycRequiredModalOpen: boolean;
  setKycRequiredModalOpen: (open: boolean) => void;
  kycRestrictionAction: 'buy' | 'sell' | 'bid' | 'general';
  setKycRestrictionAction: (action: 'buy' | 'sell' | 'bid' | 'general') => void;
  checkKycVerifiedOrPrompt: (action?: 'buy' | 'sell' | 'bid' | 'general') => boolean;

  // Auth & Email OTP & Google Profile
  registerUser: (data: { firstName: string; lastName: string; city: string; email: string; phone: string; role: UserRole; password?: string; referralCode?: string }) => { success: boolean; otpCode: string; expiresAt: number };
  verifyEmailOtp: (email: string, enteredOtp: string) => { success: boolean; error?: string };
  requestEmailLoginOtp: (email: string) => Promise<{ success: boolean; otpCode?: string; expiresAt?: number; error?: string }>;
  resendEmailOtp: (email: string) => Promise<{ success: boolean; otpCode?: string; expiresAt?: number; error?: string }>;
  loginWithEmail: (email: string, password?: string) => { success: boolean };
  loginWithGoogle: (role?: UserRole) => { success: boolean; needsProfileCompletion: boolean; user?: User };
  completeGoogleProfile: (data: { firstName: string; lastName: string; phone: string; city: string; role: UserRole; referralCode?: string }) => void;

  // 30s Driver Dispatch Engine
  pendingOrderOffer: DeliveryJob | null;
  orderOfferCountdown: number;
  triggerOrderDispatchToDriver: (job: DeliveryJob) => void;
  driverAcceptIncomingOffer: () => void;
  driverDeclineIncomingOffer: () => void;

  // Rating & Review Suite
  reviewModalJob: DeliveryJob | null;
  setReviewModalJob: (job: DeliveryJob | null) => void;
  reviews: ReviewRecord[];
  submitReview: (data: { jobId: string; productId: string; productTitle: string; sellerRating: number; sellerComment: string; sellerQuickTags: string[]; driverRating: number; driverComment: string; driverQuickTags: string[] }) => void;
  
  // Official Receipt & Cryptographic Audit Suite
  receiptModalData: { transactionData: any; auditLog: any; initialMode?: 'buyer' | 'seller' | 'driver'; lockedMode?: 'buyer' | 'seller' | 'driver' } | null;
  setReceiptModalData: (data: { transactionData: any; auditLog: any; initialMode?: 'buyer' | 'seller' | 'driver'; lockedMode?: 'buyer' | 'seller' | 'driver' } | null) => void;
  openOfficialReceipt: (jobIdOrJob: string | DeliveryJob, requestedRole?: 'buyer' | 'seller' | 'driver') => Promise<boolean>;
  
  // GPS & Location States (Mandatory GPS)
  userLocation: GPSLocation | null;
  gpsPermissionStatus: 'prompt' | 'granted' | 'denied';
  gpsModalOpen: boolean;
  setGpsModalOpen: (open: boolean) => void;
  requestGpsPermission: (forcePrompt?: boolean) => Promise<GPSLocation | null>;
  setUserManualLocation: (communeName: string, customAddress?: string) => void;

  // Native Mobile Bridge & Permissions (Capacitor Geolocation & Camera)
  isNativeApp: boolean;
  nativePlatform: string;
  cameraPermissionStatus: 'prompt' | 'granted' | 'denied';
  requestCameraPermission: () => Promise<boolean>;
  captureNativePhoto: (options?: {
    source?: NativePhotoSource;
    direction?: NativeCameraFacing;
    quality?: number;
  }) => Promise<{ dataUrl: string; format?: string }>;
  nativePermissionPrompt: {
    isOpen: boolean;
    config: any;
    openPrompt: (config: any) => void;
    closePrompt: () => void;
  };

  // Modals & UI States
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  pricingModalOpen: boolean;
  setPricingModalOpen: (open: boolean) => void;
  targetPlanForPricing: SellerPlan | DriverPlan | 'boost' | null;
  setTargetPlanForPricing: (plan: SellerPlan | DriverPlan | 'boost' | null) => void;
  productDetailModal: Product | null;
  setProductDetailModal: (p: Product | null) => void;
  fiveBiddersModalProduct: Product | null;
  setFiveBiddersModalProduct: (p: Product | null) => void;
  buyerDepositModalProduct: Product | null;
  setBuyerDepositModalProduct: (p: Product | null) => void;
  newProductModalOpen: boolean;
  setNewProductModalOpen: (open: boolean) => void;
  gpsTrackingJob: DeliveryJob | null;
  setGpsTrackingJob: (job: DeliveryJob | null) => void;
  selectedShopForView: ShopProfile | null;
  setSelectedShopForView: (shop: ShopProfile | null) => void;
  updateShopProfile: (shopData: Partial<ShopProfile>) => void;
  getShopBySellerId: (sellerId: string) => ShopProfile | undefined;
  buyShopProductDirect: (productId: string, paymentMethod?: PaymentMethod, customQuantity?: number) => boolean;
  
  // Profile Avatar & Identity
  profileAvatarModalOpen: boolean;
  setProfileAvatarModalOpen: (open: boolean) => void;
  updateUserAvatar: (avatarUrl: string) => void;
  updateUserProfile: (data: Partial<User>) => void;

  // Express Courier & Point A ➔ B Delivery Orders & Driver Recharge Pass
  expressCourierModalOpen: boolean;
  setExpressCourierModalOpen: (open: boolean) => void;
  createDirectCourierJob: (input: DirectCourierOrderInput) => DeliveryJob;
  driverPass: DriverRechargePass;
  rechargeDriverPass: () => void;
  decrementFreeCourierCourse: () => void;
  setDriverPassTestingState?: (state: 'active' | 'expired') => void;

  toasts: ToastNotification[];
  addToast: (title: string, desc: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // ================= ADMIN SUITE & FINANCIALS =================
  isAdminAuthenticated: boolean;
  adminLogin: (identifier: string, pass: string) => boolean;
  adminLogout: () => void;
  isMaintenanceMode: boolean;
  maintenanceNotice: string;
  toggleMaintenanceMode: (enabled?: boolean, notice?: string) => void;
  withdrawalRequests: WithdrawalRequest[];
  financialTransactions: FinancialTransaction[];
  adminAlerts: AdminAlert[];
  sentAdminMessages: SentAdminMessage[];
  activeLiveVisitorsCount: number;
  newRegistrationsTodayCount: number;
  adminApproveWithdrawal: (requestId: string) => boolean;
  adminRejectWithdrawal: (requestId: string, reason: string) => boolean;
  requestUserWithdrawal: (amount: number, method: PaymentMethod, phone: string) => { success: boolean; message: string };
  adminToggleUserSuspension: (userId: string, reason?: string) => void;
  adminToggleShopClosure: (shopId: string, reason?: string) => void;
  adminSendMessageToUser: (recipientId: string, channel: 'in_app' | 'sms' | 'whatsapp', message: string, subject?: string) => boolean;
  adminReassignDriver: (jobId: string, newDriverId: string) => void;
  adminCancelDeliveryJob: (jobId: string, reason: string) => void;
  markAlertAsRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  adminExportModalOpen: boolean;
  setAdminExportModalOpen: (open: boolean) => void;
  adminSelectedMemberForModal: User | null;
  setAdminSelectedMemberForModal: (user: User | null) => void;
  adminMessageModalRecipient: User | null;
  setAdminMessageModalRecipient: (user: User | null) => void;
  exportFinancialsExcel: (timeFilter: TimeFilter) => void;

  // Notifications & Live Dispatch
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  notificationsModalOpen: boolean;
  setNotificationsModalOpen: (open: boolean) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'> & { timestamp?: string }) => void;
  markNotificationAsRead: (notifId: string) => void;
  toggleNotificationReadStatus: (notifId: string) => void;
  deleteNotification: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  browserNotificationsEnabled: boolean;
  pushToken: string;
  requestBrowserNotificationPermission: () => Promise<boolean>;
  pushBrowserNotification: (
    title: string, 
    body: string, 
    icon?: string, 
    customOptions?: {
      tag?: string;
      data?: any;
      actions?: { action: string; title: string }[];
      vibrate?: number[];
    }
  ) => void;
  notifyOutbid: (productId: string, newAmount: number, outbidUserId?: string, bidderName?: string) => void;
  triggerOutbidSimulation: (productId?: string, targetAmount?: number) => void;
  activeOutbidAlert: OutbidAlertInfo | null;
  dismissOutbidAlert: () => void;

  // Actions
  loginAsUser: (userId: string) => void;
  loginWithRole: (role: UserRole) => void;
  logout: () => void;
  logoutUser: () => void;
  getSellerBlockedBalance: (sellerNameOrId?: string) => number;
  getBuyerBlockedBalance: (buyerNameOrId?: string) => number;
  canUserPublishProduct: (user?: User | null) => { allowed: boolean; reason?: string; limit: number; current: number };
  publishProduct: (productData: Partial<Product>) => boolean;
  placeBid: (productId: string, amount: number) => boolean;
  sellerChooseWinner: (productId: string, winnerId: string) => void;
  sellerSelectBidder: (productId: string, bidderId: string) => void;
  buyerCompleteEscrowDeposit: (productId: string, paymentMethod?: PaymentMethod) => boolean;
  buyerInitiatePayOnDelivery: (jobId: string, operator?: PaymentMethod) => Promise<boolean>;
  buyerDeclineSelectedOffer: (productId: string, reason?: string) => void;
  purgeExpiredSoldProduct: (productId: string) => void;
  sellerCancelAuction: (productId: string) => void;
  simulateFiveBids: (productId: string) => void;
  activeDriverTab: DriverTab;
  setActiveDriverTab: (tab: DriverTab) => void;
  assignTestJobToDriver: (driverId?: string) => void;
  canDriverTakeDeliveries: (driver?: User | null) => { allowed: boolean; reason?: string; remaining: number };
  toggleDriverAvailability: () => void;
  switchDriverAccount: (driverId: string) => void;
  driverAcceptJob: (jobId: string) => boolean;
  driverConfirmPickup: (jobId: string, enteredCode: string) => boolean;
  driverDeclareArrival: (jobId: string) => boolean;
  driverSetInspectionVerdict: (jobId: string, verdict: 'client_confirmed_good' | 'client_confirmed_bad') => boolean;
  driverConfirmDeliveryOTP: (jobId: string, enteredOtp: string) => boolean;
  buyerConfirmDeliveryOTP: (jobId: string, enteredOtp: string) => boolean;
  buyerCancelAndReturnPackage: (jobId: string, reason: string) => { success: boolean; returnOtpCode: string; message: string };
  driverStartAbsentTimer: (jobId: string) => boolean;
  driverCancelDueToAbsentBuyer: (jobId: string) => boolean;
  driverConfirmReturnOTP: (jobId: string, enteredOtp: string) => boolean;
  sellerConfirmReturnReceived: (jobId: string) => boolean;
  submitKYC: (
    dataOrDocType: {
      docType: 'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire';
      docNumber: string;
      photoUrl: string;
      selfieUrl: string;
      driverLicenseUrl?: string;
      driverLicenseSelfieUrl?: string;
      vehicleRegistrationUrl?: string;
      vehiclePlate?: string;
      vehicleColor?: string;
      vehicleModel?: string;
      vehicleType?: VehicleType;
    } | 'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire',
    docNumber?: string,
    photoUrl?: string,
    selfieUrl?: string
  ) => { success: boolean; isDuplicate: boolean; message: string };
  adminApproveKYC: (kycId: string) => void;
  adminRejectKYC: (kycId: string, reason: string) => void;
  adminApproveProduct: (productId: string, type?: 'flash' | 'standard') => void;
  adminRejectProduct: (productId: string, reason?: string) => void;
  purchaseSubscription: (plan: SellerPlan | DriverPlan | 'boost', paymentMethod: string, targetProductId?: string) => void;
  boostProduct: (productId: string) => void;

  // Anti-Fraud & Terms & Stock Management
  fraudIncidents: FraudIncidentRecord[];
  recordFraudIncident: (data: Omit<FraudIncidentRecord, 'id' | 'timestamp' | 'status'>) => void;
  adminResolveFraudIncident: (incidentId: string) => void;
  termsModalOpen: boolean;
  setTermsModalOpen: (open: boolean) => void;
  acceptTermsAndConditions: () => void;
  restockProduct: (productId: string, additionalStock: number) => boolean;

  // Referral System (Système de Parrainage)
  referrals: ReferralRecord[];
  setReferrals: React.Dispatch<React.SetStateAction<ReferralRecord[]>>;
  pendingReferralCode: string | null;
  setPendingReferralCode: (code: string | null) => void;
  openRegisterWithReferral: (code?: string) => void;
  applyReferralBalanceToPurchase: (amount: number) => { success: boolean; deducted: number; remaining: number };
  simulateNewRefereeRegistration: (sponsorCode?: string) => ReferralRecord | null;
  simulateRefereeKycApproved: (refereeId: string) => boolean;
  simulateRefereeFirstTransaction: (refereeId: string) => boolean;

  // Shopping Cart & Multi-Item Orders Suite
  cart: CartItem[];
  cartModalOpen: boolean;
  setCartModalOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, forcedChannel?: CartItemChannel) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  checkoutCart: (
    dropoffAddress: string,
    dropoffCommune: string,
    dropoffCoords: { lat: number; lng: number },
    paymentMethod: PaymentMethod,
    paymentChoice: 'delivery' | 'direct',
    useReferralDiscount?: boolean
  ) => Promise<CartOrderRecord | null>;
  cartOrders: CartOrderRecord[];
  cartInvoiceModalOrder: CartOrderRecord | null;
  setCartInvoiceModalOrder: (order: CartOrderRecord | null) => void;
  driverConfirmStopPickup: (jobId: string, stopIndex: number, enteredCode: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('bradci_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem('bradci_current_user_id');
    if (savedId) {
      const found = INITIAL_USERS.find(u => u.id === savedId);
      if (found) return found;
    }
    // Default to Kouassi Jean (Basic Seller with 2/3 products) for immediate rich interaction
    return INITIAL_USERS[0];
  });

  const [pendingReferralCode, setPendingReferralCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const refParam = params.get('ref') || params.get('referral') || params.get('sponsor') || params.get('code');
        if (refParam) return refParam.trim().toUpperCase();
        
        if (window.location.hash) {
          const hashMatch = window.location.hash.match(/[#&?](?:ref|referral|code|sponsor)=([A-Za-z0-9-_]+)/i);
          if (hashMatch && hashMatch[1]) return hashMatch[1].trim().toUpperCase();
        }

        return localStorage.getItem('bradci_pending_sponsor_code');
      } catch {
        return null;
      }
    }
    return null;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('bradci_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [freightJobs, setFreightJobs] = useState<DeliveryJob[]>(() => {
    const saved = localStorage.getItem('bradci_freight');
    if (!saved) return INITIAL_FREIGHT_JOBS;
    try {
      const parsed: DeliveryJob[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map(j => j.id));
      const missing = INITIAL_FREIGHT_JOBS.filter(j => !existingIds.has(j.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_FREIGHT_JOBS;
    }
  });

  const [activeDriverTab, setActiveDriverTabState] = useState<DriverTab>(() => {
    return (localStorage.getItem('bradci_driver_active_subtab') as DriverTab) || 'available_orders';
  });

  const setActiveDriverTab = (tab: DriverTab) => {
    setActiveDriverTabState(tab);
    localStorage.setItem('bradci_driver_active_subtab', tab);
  };

  const [escrowRecords, setEscrowRecords] = useState<EscrowRecord[]>(() => {
    const saved = localStorage.getItem('bradci_escrow');
    return saved ? JSON.parse(saved) : INITIAL_ESCROW_RECORDS;
  });

  const [directPaymentRecords, setDirectPaymentRecords] = useState<DirectPaymentRecord[]>(() => {
    const saved = localStorage.getItem('bradci_direct_payments');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bradci_direct_payments', JSON.stringify(directPaymentRecords));
  }, [directPaymentRecords]);

  const [kycRecords, setKycRecords] = useState<KYCRecord[]>(() => {
    const saved = localStorage.getItem('bradci_kyc');
    return saved ? JSON.parse(saved) : INITIAL_KYC_RECORDS;
  });

  const [referrals, setReferrals] = useState<ReferralRecord[]>(() => {
    const saved = localStorage.getItem('bradci_referrals');
    return saved ? JSON.parse(saved) : INITIAL_REFERRALS;
  });

  // GPS Location State
  const [userLocation, setUserLocation] = useState<GPSLocation | null>(() => {
    const saved = localStorage.getItem('bradci_user_gps');
    if (saved) return JSON.parse(saved);
    return currentUser?.gpsLocation || {
      lat: 5.3599,
      lng: -3.9875,
      commune: 'Cocody',
      address: 'Riviera 2, Abidjan',
      accuracy: 10
    };
  });

  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>(() => {
    const saved = localStorage.getItem('bradci_gps_permission');
    return (saved as 'prompt' | 'granted' | 'denied') || 'granted';
  });

  // Native Camera & Permission Prompt States
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [permissionPromptConfig, setPermissionPromptConfig] = useState<any>(null);
  const [permissionPromptOpen, setPermissionPromptOpen] = useState<boolean>(false);

  const openPermissionPrompt = useCallback((config: any) => {
    setPermissionPromptConfig(config);
    setPermissionPromptOpen(true);
  }, []);

  const closePermissionPrompt = useCallback(() => {
    setPermissionPromptOpen(false);
    setPermissionPromptConfig(null);
  }, []);

  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [targetPlanForPricing, setTargetPlanForPricing] = useState<SellerPlan | DriverPlan | 'boost' | null>(null);
  const [productDetailModal, setProductDetailModal] = useState<Product | null>(null);
  const [fiveBiddersModalProduct, setFiveBiddersModalProduct] = useState<Product | null>(null);
  const [buyerDepositModalProduct, setBuyerDepositModalProduct] = useState<Product | null>(null);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [expressCourierModalOpen, setExpressCourierModalOpen] = useState(false);

  // Driver Pass Recharge State
  const [driverPass, setDriverPass] = useState<DriverRechargePass>(() => {
    const saved = localStorage.getItem('bradci_driver_recharge_pass');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      dailyCostFCFA: 5000,
      status: 'active', // 100% active during launch!
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      freeCoursesRemaining: 5,
      totalFreeCoursesGranted: 5,
      isComingSoon: true, // "Mode Bientôt"
      unlimitedDirectAccess: true,
      lastRechargedAt: new Date().toISOString()
    };
  });

  useEffect(() => {
    localStorage.setItem('bradci_driver_recharge_pass', JSON.stringify(driverPass));
  }, [driverPass]);

  const rechargeDriverPass = useCallback(() => {
    setDriverPass(prev => ({
      ...prev,
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      lastRechargedAt: new Date().toISOString()
    }));
  }, []);

  const decrementFreeCourierCourse = useCallback(() => {
    setDriverPass(prev => ({
      ...prev,
      freeCoursesRemaining: Math.max(0, (prev.freeCoursesRemaining ?? 5) - 1)
    }));
  }, []);

  const setDriverPassTestingState = useCallback((state: 'active' | 'expired') => {
    setDriverPass(prev => ({
      ...prev,
      status: state,
      expiresAt: state === 'active' 
        ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() 
        : new Date(Date.now() - 3600 * 1000).toISOString()
    }));
  }, []);

  const [gpsTrackingJob, setGpsTrackingJob] = useState<DeliveryJob | null>(null);
  const [selectedShopForView, setSelectedShopForView] = useState<ShopProfile | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<{ transactionData: TransactionAuditInput; auditLog: PaymentAuditLog; initialMode?: 'buyer' | 'seller' | 'driver'; lockedMode?: 'buyer' | 'seller' | 'driver' } | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, desc: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const createDirectCourierJob = useCallback((input: DirectCourierOrderInput): DeliveryJob => {
    const pickupCoords = getCommuneCoords(input.pickupCommune);
    const dropoffCoords = getCommuneCoords(input.dropoffCommune);
    const calculatedFee = input.deliveryFee || calculateDeliveryFee(input.pickupCommune, input.dropoffCommune, input.requiredVehicle || 'moto');
    const distanceKm = calculateCommuneDistanceKm(input.pickupCommune, input.dropoffCommune);
    const etaMinutes = Math.max(15, Math.round(distanceKm * 2.8) + 10);

    const randomPickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const randomDeliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const newJob: DeliveryJob = {
      id: 'course-directe-' + Date.now().toString().slice(-6),
      jobKind: 'direct_courier',
      paymentMode: 'cash_to_driver',
      productId: 'colis-' + Date.now(),
      productTitle: `Colis Express A➔B : ${input.packageDescription}`,
      productImage: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      itemValue: input.itemValue || 0,
      deliveryFee: calculatedFee,
      requiredVehicle: input.requiredVehicle || 'moto',
      status: 'available',
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      pickupCommune: input.pickupCommune,
      pickupAddress: input.pickupAddress,
      pickupCoords,
      sellerName: input.senderName,
      sellerPhone: input.senderPhone,
      senderName: input.senderName,
      senderPhone: input.senderPhone,
      senderNote: input.senderNote,
      buyerName: input.recipientName,
      buyerPhone: input.recipientPhone,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      dropoffCommune: input.dropoffCommune,
      dropoffAddress: input.dropoffAddress,
      dropoffCoords,
      packageDescription: input.packageDescription,
      packageSize: input.packageSize || 'small',
      pickupCode: randomPickupCode,
      deliveryOtpCode: randomDeliveryOtp,
      distanceKm,
      etaMinutes,
      createdAt: new Date().toISOString(),
    };

    setFreightJobs(prev => [newJob, ...prev]);

    try {
      playOrderAlertSound();
    } catch {
      // audio fallback
    }

    addToast(
      'Coursier Express Commandé !',
      `Course de ${input.pickupCommune} vers ${input.dropoffCommune} créée (Prix : ${calculatedFee.toLocaleString('fr-FR')} FCFA).`,
      'success'
    );

    return newJob;
  }, [addToast]);

  // ================= SHOPPING CART & MULTI-ITEM ORDERS STATE =================
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('bradci_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [cartOrders, setCartOrders] = useState<CartOrderRecord[]>(() => {
    const saved = localStorage.getItem('bradci_cart_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartInvoiceModalOrder, setCartInvoiceModalOrder] = useState<CartOrderRecord | null>(null);

  useEffect(() => {
    localStorage.setItem('bradci_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('bradci_cart_orders', JSON.stringify(cartOrders));
  }, [cartOrders]);

  // ================= ADMIN SUITE & FINANCIAL STATES =================
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bradci_admin_auth') === 'true' || localStorage.getItem('bradci_admin_auth') === 'true';
  });

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem('bradci_maintenance_mode') === 'true';
  });

  const [maintenanceNotice, setMaintenanceNotice] = useState<string>(() => {
    return localStorage.getItem('bradci_maintenance_notice') || 'Maintenance opérationnelle de routine pour optimisation des flux de séquestre Wave & Orange Money.';
  });

  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('bradci_withdrawals');
    return saved ? JSON.parse(saved) : INITIAL_WITHDRAWAL_REQUESTS;
  });

  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('bradci_fin_transactions');
    return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_TRANSACTIONS;
  });

  const [adminAlerts, setAdminAlerts] = useState<AdminAlert[]>(() => {
    const saved = localStorage.getItem('bradci_admin_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_ALERTS;
  });

  const [sentAdminMessages, setSentAdminMessages] = useState<SentAdminMessage[]>(() => {
    const saved = localStorage.getItem('bradci_sent_admin_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeLiveVisitorsCount, setActiveLiveVisitorsCount] = useState<number>(142);
  const [newRegistrationsTodayCount, setNewRegistrationsTodayCount] = useState<number>(12);

  // Admin Modals
  const [adminExportModalOpen, setAdminExportModalOpen] = useState(false);
  const [adminSelectedMemberForModal, setAdminSelectedMemberForModal] = useState<User | null>(null);
  const [adminMessageModalRecipient, setAdminMessageModalRecipient] = useState<User | null>(null);

  // App Notifications & Web Push State
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  // Anti-Fraud Incidents & Legal Terms Modal
  const [fraudIncidents, setFraudIncidents] = useState<FraudIncidentRecord[]>(() => {
    const saved = localStorage.getItem('bradci_fraud_incidents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'fraud-inc-1',
        userId: 'user-kouassi',
        userName: 'Kouassi Jean',
        userRole: 'client',
        userPhone: '+225 07 48 92 11 34',
        productTitle: 'Ancien Essai Vente Directe',
        detectedType: 'phone_number',
        rawOffendingContent: 'Appelez moi direct au 07 48 92 11 34 pour négocier hors application',
        matchedSnippet: '07 48 92 11 34',
        timestamp: '2026-08-19T14:30:00Z',
        actionTaken: 'warning_issued',
        status: 'warned'
      }
    ];
  });

  const [termsModalOpen, setTermsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('bradci_fraud_incidents', JSON.stringify(fraudIncidents));
  }, [fraudIncidents]);

  const recordFraudIncident = (data: Omit<FraudIncidentRecord, 'id' | 'timestamp' | 'status'>) => {
    const newRecord: FraudIncidentRecord = {
      ...data,
      id: 'fraud-' + Date.now(),
      timestamp: new Date().toISOString(),
      status: data.actionTaken === 'account_suspended' ? 'banned' : 'acknowledged'
    };
    setFraudIncidents(prev => [newRecord, ...prev]);

    // Also create admin alert
    const newAlert: AdminAlert = {
      id: 'alert-fraud-' + Date.now(),
      type: 'fraud_incident',
      title: data.actionTaken === 'account_suspended' 
        ? '🚨 RÈGLE DES 3 STRIKES : Compte Suspendu pour Fraude' 
        : '⚠️ Tentative de Fraude Détectée & Bloquée',
      message: `L'utilisateur ${data.userName} (${data.userPhone || 'N/A'}) a tenté d'insérer des coordonnées directes (${data.detectedContent}). Action : ${data.actionTaken === 'account_suspended' ? 'Suspension Immédiate' : 'Avertissement n°' + data.strikeNumber}.`,
      channel: 'system',
      targetAdminPhone: '+225 07 00 00 00',
      timestamp: 'À l\'instant',
      isRead: false,
      metadata: {
        userId: data.userId,
        phone: data.userPhone,
        strikeNumber: data.strikeNumber,
        productId: data.productId
      }
    };
    setAdminAlerts(prev => [newAlert, ...prev]);
  };

  const adminResolveFraudIncident = (incidentId: string) => {
    setFraudIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: 'resolved' } : inc));
    addToast('Incident Résolu', 'L\'alerte de fraude a été marquée comme traitée.', 'success');
  };

  const acceptTermsAndConditions = () => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString()
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setTermsModalOpen(false);
    addToast('Charte Acceptée', 'Vous avez accepté les Conditions Générales et la Charte Anti-Fraude Brad\'CI.', 'success');
  };

  const restockProduct = (productId: string, additionalStock: number): boolean => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return false;
    if (additionalStock <= 0) {
      addToast('Quantité Invalide', 'Veuillez saisir un nombre de pièces supérieur à 0.', 'warning');
      return false;
    }

    const newStock = (prod.stockQuantity || 0) + additionalStock;
    const updatedProd: Product = {
      ...prod,
      stockQuantity: newStock,
      isOutOfStock: false,
      outOfStockSince: undefined
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));
    if (productDetailModal?.id === productId) {
      setProductDetailModal(updatedProd);
    }

    addToast(
      '✅ Stock Réapprovisionné !',
      `Le stock de "${prod.title}" est maintenant de ${newStock} unités. L'annonce est réactivée et visible à l'achat.`,
      'success'
    );
    return true;
  };

  // ================= LANGUAGE, THEME, VOICE & MAP PROVIDER =================
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('bradci_lang');
    return (saved as AppLanguage) || 'fr';
  });
  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('bradci_lang', lang);
    addToast(
      lang === 'fr' ? 'Langue Française Activée' : 'English Language Activated',
      lang === 'fr' ? 'Interface et notifications configurées en Français.' : 'Interface and alerts switched to English.',
      'info'
    );
  };
  const t = (key: TranslationKey) => getTranslation(language, key);
  const translate = (fr: string, en: string) => language === 'en' ? en : fr;

  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('bradci_theme');
    return (saved as AppTheme) || 'dark';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('dark');

  // Compute effective theme (Dark, Light, or Auto Day/Night)
  useEffect(() => {
    const computeTheme = (): 'dark' | 'light' => {
      if (theme === 'dark') return 'dark';
      if (theme === 'light') return 'light';
      // Auto: Daytime (06h to 18h) is Light, Nighttime (18h to 06h) is Dark
      const hour = new Date().getHours();
      const isDay = hour >= 6 && hour < 18;
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return isDay ? (prefersDark ? 'dark' : 'light') : 'dark';
      }
      return isDay ? 'light' : 'dark';
    };

    const resolved = computeTheme();
    setEffectiveTheme(resolved);
    localStorage.setItem('bradci_theme', theme);

    const root = document.documentElement;
    const body = document.body;

    if (resolved === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    const messages = {
      dark: { title: 'Mode Sombre Activé', desc: 'Thème sombre optimisé pour la nuit et les écrans OLED.' },
      light: { title: 'Mode Clair Lumineux Activé', desc: 'Thème blanc avec contrastes nets pour une lisibilité maximale en plein jour.' },
      auto: { title: 'Thème Automatique (Jour / Nuit)', desc: 'Bascule automatique en mode clair le jour (06h-18h) et sombre la nuit.' }
    };
    addToast(messages[newTheme].title, messages[newTheme].desc, 'info');
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      let next: AppTheme = 'dark';
      if (prev === 'dark') next = 'light';
      else if (prev === 'light') next = 'auto';
      else next = 'dark';

      const messages = {
        dark: { title: 'Mode Sombre Activé 🌙', desc: 'Thème sombre haute précision.' },
        light: { title: 'Mode Clair Blanc Activé ☀️', desc: 'Thème clair lumineux haute lisibilité.' },
        auto: { title: 'Thème Automatique Activé ⚙️', desc: 'Alternance Jour (Clair) / Nuit (Sombre).' }
      };
      addToast(messages[next].title, messages[next].desc, 'info');
      return next;
    });
  };

  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('bradci_voice_enabled');
    return saved !== 'false';
  });
  const toggleVoice = () => {
    setVoiceEnabled(prev => {
      const next = !prev;
      localStorage.setItem('bradci_voice_enabled', String(next));
      voiceNavigator.setMuted(!next);
      if (next) {
        voiceNavigator.announceVoiceActivated(language);
        addToast(
          language === 'en' ? 'Voice Assistance Enabled 🔊' : 'Assistance Vocale Activée 🔊',
          language === 'en' ? 'Live announcements for auctions, escrow, and deliveries active.' : 'Annonces en direct des enchères, du séquestre et de la bourse de fret.',
          'success'
        );
      } else {
        voiceNavigator.stop();
        addToast(
          language === 'en' ? 'Voice Assistance Muted 🔇' : 'Assistance Vocale Coupée 🔇',
          language === 'en' ? 'Audio announcements are now muted.' : 'Les annonces audio sont en sourdine.',
          'info'
        );
      }
      return next;
    });
  };

  const readCurrentScreenAloud = () => {
    const isEn = language === 'en';
    let screenTitle = isEn ? "Brad'CI Home" : "Accueil Brad'CI";
    const keyPoints: string[] = [];

    if (activeTab === 'explore' || activeTab === 'encheres') {
      screenTitle = isEn ? 'Live Express Auctions' : 'Enchères en direct';
      const activeAuctions = products.filter(p => p.listingType !== 'shop' && (p.status === 'active' || p.status === 'pending_choice' || p.status === 'pending_buyer_deposit'));
      keyPoints.push(
        isEn
          ? `${activeAuctions.length} ongoing auctions with guaranteed mobile money escrow`
          : `${activeAuctions.length} enchères en cours avec séquestre garanti`
      );
      const fiveBidsCount = products.filter(p => p.status === 'pending_choice').length;
      if (fiveBidsCount > 0) {
        keyPoints.push(
          isEn
            ? `${fiveBidsCount} auctions reached the 5-bid threshold and are awaiting seller buyer selection`
            : `${fiveBidsCount} enchères ont atteint le palier des 5 offres et sont en arbitrage vendeur`
        );
      }
      const myWinningPending = products.filter(p => p.status === 'pending_buyer_deposit');
      if (myWinningPending.length > 0) {
        keyPoints.push(
          isEn
            ? 'Action required: an auction offer is awaiting your escrow deposit for final validation'
            : 'Attention, une offre d\'enchère attend votre dépôt sous séquestre pour validation'
        );
      }
    } else if (activeTab === 'boutiques') {
      screenTitle = isEn ? 'Official Stores and Direct Buys' : 'Boutiques officielles et achats directs';
      const shopProds = products.filter(p => p.listingType === 'shop');
      keyPoints.push(
        isEn
          ? `${shopProds.length} items available for direct purchase with express courier delivery`
          : `${shopProds.length} articles disponibles à l'achat direct avec livraison express`
      );
    } else if (activeTab === 'dashboard_seller' || activeTab === 'dashboard_client') {
      screenTitle = isEn ? 'Client and Seller Dashboard' : 'Tableau de bord Vendeur et Acheteur';
      const availableBalance = currentUser?.walletBalance || 0;
      const blockedBalance = getSellerBlockedBalance();
      keyPoints.push(
        isEn
          ? `Available balance for withdrawal: ${availableBalance.toLocaleString('fr-FR')} FCFA`
          : `Solde disponible pour retrait : ${availableBalance.toLocaleString('fr-FR')} FCFA`
      );
      keyPoints.push(
        isEn
          ? `Held in escrow pending delivery: ${blockedBalance.toLocaleString('fr-FR')} FCFA`
          : `Solde sous séquestre en attente de livraison : ${blockedBalance.toLocaleString('fr-FR')} FCFA`
      );
    } else if (activeTab === 'dashboard_driver') {
      screenTitle = isEn ? 'Freight Radar and Deliveries in Abidjan' : 'Bourse de fret et livraisons Abidjan';
      const availableJobs = freightJobs.filter(j => j.status === 'available');
      keyPoints.push(
        isEn
          ? `${availableJobs.length} delivery jobs available nearby`
          : `${availableJobs.length} courses disponibles à proximité`
      );
      const activeMyJobs = freightJobs.filter(j => (j.assignedDriverId === currentUser?.id || currentUser?.role === 'driver') && j.status !== 'delivered' && j.status !== 'cancelled');
      if (activeMyJobs.length > 0) {
        keyPoints.push(
          isEn
            ? `You have ${activeMyJobs.length} active delivery in progress`
            : `Vous avez ${activeMyJobs.length} livraison en cours`
        );
      }
    } else {
      screenTitle = isEn ? "Brad'CI Platform" : "Plateforme Brad'CI";
      keyPoints.push(
        isEn
          ? 'Express live auctions under secured mobile money escrow with geolocation tracking across Abidjan'
          : 'Ventes aux enchères sous séquestre sécurisé Wave, Orange Money et livraisons express géolocalisées à Abidjan'
      );
    }

    voiceNavigator.readCurrentScreen(screenTitle, keyPoints, language);
  };

  const [mapProvider, setMapProviderState] = useState<MapProvider>(() => {
    const saved = localStorage.getItem('bradci_map_provider');
    return (saved as MapProvider) || 'google';
  });
  const setMapProvider = (p: MapProvider) => {
    setMapProviderState(p);
    localStorage.setItem('bradci_map_provider', p);
  };

  // KYC Modal State & Just-in-Time Action Restrictions
  const [kycModalOpen, setKycModalOpen] = useState<boolean>(false);
  const [kycRequiredModalOpen, setKycRequiredModalOpen] = useState<boolean>(false);
  const [kycRestrictionAction, setKycRestrictionAction] = useState<'buy' | 'sell' | 'bid' | 'general'>('general');
  const [profileAvatarModalOpen, setProfileAvatarModalOpen] = useState<boolean>(false);

  // Just-in-Time KYC validation check for transactional actions (buy, sell, bid)
  const checkKycVerifiedOrPrompt = (action: 'buy' | 'sell' | 'bid' | 'general' = 'general'): boolean => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return false;
    }
    // Admins bypass KYC checks
    if (currentUser.role === 'admin') {
      return true;
    }
    // Verified users can proceed
    if (currentUser.kycStatus === 'verified') {
      return true;
    }

    // Block the action and display the clear, elegant restriction popup
    setKycRestrictionAction(action);
    setKycRequiredModalOpen(true);
    return false;
  };

  // 30s Driver Dispatch Engine State
  const [pendingOrderOffer, setPendingOrderOffer] = useState<DeliveryJob | null>(null);
  const [orderOfferCountdown, setOrderOfferCountdown] = useState<number>(30);

  // Ratings and Reviews State
  const [reviewModalJob, setReviewModalJob] = useState<DeliveryJob | null>(null);
  const [reviews, setReviews] = useState<ReviewRecord[]>(() => {
    const saved = localStorage.getItem('bradci_reviews');
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem('bradci_reviews', JSON.stringify(reviews));
  }, [reviews]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('bradci_app_notifications') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return [
      {
        id: 'notif-welcome',
        recipientRole: 'all',
        title: '🎉 Bienvenue sur BRAD\'CI Fret & Enchères',
        message: 'Séquestre Wave / MoMo garanti, traçabilité GPS en direct et inspection contradictoire lors de la remise en main propre.',
        type: 'system',
        timestamp: `${today} à 08:30`,
        isRead: false,
        urgency: 'normal'
      },
      {
        id: 'notif-delivery-1',
        recipientRole: 'client',
        title: '🛵 Course en cours : iPhone 13 Pro 128Go',
        message: 'Le coursier Bakary Traoré a pris en charge votre colis à Cocody. Suivez son déplacement en direct.',
        type: 'delivery',
        jobId: 'job-1',
        timestamp: `${today} à 10:15`,
        isRead: false,
        urgency: 'high'
      }
    ];
  });

  const [pushToken, setPushToken] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('bradci_push_token') || '') : '';
  });

  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('bradci_browser_notifications');
    if (stored === 'true') return true;
    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bradci_app_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const pushBrowserNotification = useCallback(async (
    title: string, 
    body: string, 
    icon = './icon.png',
    customOptions?: {
      tag?: string;
      data?: any;
      actions?: { action: string; title: string }[];
      vibrate?: number[];
    }
  ) => {
    try {
      await sendUniversalPush(title, body, {
        icon,
        vibrate: customOptions?.vibrate || [200, 100, 200],
        url: typeof customOptions?.data === 'string' ? customOptions.data : customOptions?.data?.url || '/',
        productId: customOptions?.data?.productId
      });
    } catch (e) {
      console.warn('sendUniversalPush error fallback:', e);
    }
  }, []);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'> & { timestamp?: string }) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const formattedTimestamp = notif.timestamp || `${dateStr} à ${timeStr}`;

    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: formattedTimestamp,
      isRead: false
    };

    setNotifications(prev => [newNotif, ...prev]);
    pushBrowserNotification(newNotif.title, newNotif.message);
  }, [pushBrowserNotification]);

  const requestBrowserNotificationPermission = async (): Promise<boolean> => {
    try {
      const result = await requestUniversalNotificationPermission();
      const isGranted = result.granted || result.permissionState === 'granted';

      if (isGranted) {
        setBrowserNotificationsEnabled(true);

        // Enregistrement du jeton (token) localement pour recevoir les alertes push
        let existingToken = localStorage.getItem('bradci_push_token');
        if (!existingToken) {
          existingToken = 'bradci_push_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('bradci_push_token', existingToken);
        }
        localStorage.setItem('bradci_push_registered', 'true');
        localStorage.setItem('bradci_browser_notifications', 'true');
        setPushToken(existingToken);

        // Notification de confirmation immédiate
        const testTitle = "Notifications BRAD'CI activées !";
        const testBody = "Notifications BRAD'CI activées ! Vous recevrez désormais les alertes de vos enchères et livreurs.";

        // Déclenche la notification système push universelle
        await pushBrowserNotification(testTitle, testBody, './icon.png');

        // Ajoute également dans l'historique visuel in-app
        addNotification({
          title: testTitle,
          message: testBody,
          type: 'system',
          urgency: 'high'
        });

        playSuccessChime();
        addToast(testTitle, testBody, 'success');

        if (voiceNavigator && !voiceNavigator.getIsMuted()) {
          voiceNavigator.speak(testBody, language);
        }
        return true;
      } else if (result.permissionState === 'denied') {
        addToast('Notifications Refusées', 'Vous pouvez les réactiver dans les paramètres de votre appareil ou navigateur.', 'info');
        return false;
      } else {
        // Mode de secours : activation in-app et locale assurée
        setBrowserNotificationsEnabled(true);
        localStorage.setItem('bradci_browser_notifications', 'true');

        const fallbackTitle = "Alertes BRAD'CI Activées";
        const fallbackBody = "Alertes sonores et in-app activées pour vos courses et enchères.";

        addNotification({
          title: fallbackTitle,
          message: fallbackBody,
          type: 'system',
          urgency: 'high'
        });

        playSuccessChime();
        addToast(fallbackTitle, fallbackBody, 'success');
        return true;
      }
    } catch (e) {
      console.warn('Notification activation fallback:', e);
      // Sécurité anti-blocage : activation in-app
      setBrowserNotificationsEnabled(true);
      localStorage.setItem('bradci_browser_notifications', 'true');
      addToast("Notifications In-App Activées", "Alertes visuelles et sonores activées avec succès.", 'success');
      return true;
    }
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
  };

  const toggleNotificationReadStatus = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: !n.isRead } : n));
  };

  const deleteNotification = (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    addToast('Notification Supprimée', 'La notification a été retirée de votre historique.', 'info');
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    addToast('Notifications Lues', 'Toutes vos notifications ont été marquées comme lues.', 'info');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    addToast('Historique Vidé', 'Toutes les notifications ont été supprimées.', 'info');
  };

  const unreadNotificationsCount = notifications.filter(n => {
    if (!currentUser) return !n.isRead;
    return !n.isRead && (n.recipientRole === 'all' || n.recipientRole === currentUser.role || n.recipientUserId === currentUser.id || n.recipientUserId === currentUser.name);
  }).length;

  // -------------------------------------------------------------
  // NOTIFICATIONS PUSH INSTANTANÉES DE SURENCHÈRE (OUTBID ENGINE)
  // -------------------------------------------------------------
  const [activeOutbidAlert, setActiveOutbidAlert] = useState<OutbidAlertInfo | null>(null);

  const dismissOutbidAlert = useCallback(() => {
    setActiveOutbidAlert(null);
  }, []);

  // Écouteur de clic sur notification native depuis le Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        const notifData = event.data.data;
        if (notifData && typeof notifData === 'object' && notifData.productId) {
          const targetProd = products.find(p => p.id === notifData.productId);
          if (targetProd) {
            setProductDetailModal(targetProd);
          }
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    };
  }, [products]);

  // Fonction centrale pour déclencher l'alerte push instantanée de surenchère
  const notifyOutbid = useCallback((
    productId: string, 
    newAmount: number, 
    outbidUserId?: string, 
    bidderName: string = 'Un utilisateur'
  ) => {
    const prod = products.find(p => p.id === productId);
    const prodTitle = prod ? prod.title : 'votre enchère';
    const prodImage = prod?.images?.[0] || './icon.png';

    // Formatage strict selon le cahier des charges :
    // "Un utilisateur a surenchéri à 6 000 000 FCFA. Reprenez la main !"
    const pushTitle = "🚨 Surenchère Détectée !";
    const pushBody = `Un utilisateur a surenchéri à ${newAmount.toLocaleString('fr-FR')} FCFA. Reprenez la main !`;

    // 1. Notification Push Système Navigateur & Mobile (Service Worker)
    pushBrowserNotification(
      pushTitle,
      pushBody,
      prodImage,
      {
        tag: `bradci-outbid-${productId}`,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          { action: 'bid', title: '⚡ Reprendre la main' }
        ],
        data: {
          url: './',
          productId,
          action: 'bid'
        }
      }
    );

    // 2. Vibration haptique sur smartphone
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([300, 100, 300, 100, 300]);
      } catch {
        // Ignorer si bloqué par permission
      }
    }

    // 3. Alerte sonore d'urgence & Annonce vocale
    playOutbidAlertSound();
    if (voiceNavigator && !voiceNavigator.getIsMuted()) {
      voiceNavigator.announceOutbid(prodTitle, newAmount, language);
    }

    // 4. Notification In-App dans le Centre de Notifications
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const newNotif: AppNotification = {
      id: 'outbid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      recipientRole: 'client',
      recipientUserId: outbidUserId || currentUser?.id || 'all',
      title: `🚨 Surenchère : Vous avez été dépassé sur "${prodTitle}"`,
      message: `Un utilisateur a surenchéri à ${newAmount.toLocaleString('fr-FR')} FCFA. Reprenez la main dès maintenant avant la clôture ou l'arbitrage !`,
      type: 'outbid',
      productId: productId,
      timestamp: `${dateStr} à ${timeStr}`,
      isRead: false,
      urgency: 'critical'
    };
    setNotifications(prev => [newNotif, ...prev]);

    // 5. Toast d'avertissement immédiat
    addToast(
      '🚨 Surenchère Détectée !',
      `Un utilisateur a surenchéri à ${newAmount.toLocaleString('fr-FR')} FCFA. Reprenez la main !`,
      'warning'
    );

    // 6. Bannière d'alerte flottante réactive en tête d'écran
    setActiveOutbidAlert({
      productId,
      productTitle: prodTitle,
      newAmount,
      bidderName,
      timestamp: `${dateStr} à ${timeStr}`
    });
  }, [products, pushBrowserNotification, currentUser, language, addToast]);

  // Simulateur de surenchère instantanée pour tester la réception push sur mobile
  const triggerOutbidSimulation = useCallback((customProductId?: string, targetAmount?: number) => {
    let prod = products.find(p => p.id === (customProductId || 'b2b-lot-1'));
    if (!prod || prod.listingType !== 'auction') {
      prod = products.find(p => p.listingType === 'auction' && p.status === 'active') || products[0];
    }
    if (!prod) return;

    // Montant cible par défaut : 6 000 000 FCFA tel qu'illustré dans la demande utilisateur
    const newBidAmount = targetAmount || (prod.id === 'b2b-lot-1' ? 6000000 : prod.currentPrice + 50000);

    const rivalBidders = [
      { name: 'Dr. Amara Kouassi', commune: 'Cocody Ambassades', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
      { name: 'Amina Touré', commune: 'Plateau', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
      { name: 'Soro Bakary', commune: 'Marcory Zone 4', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    ];
    const rival = rivalBidders[Math.floor(Math.random() * rivalBidders.length)];

    const rivalBid: Bid = {
      id: 'bid-sim-' + Date.now(),
      bidderId: 'usr-sim-' + Date.now(),
      bidderName: rival.name,
      bidderAvatar: rival.avatar,
      bidderRating: 4.9,
      bidderCommune: rival.commune,
      bidderDistrict: rival.commune,
      bidderDistanceKm: 6.2,
      bidderPhone: '+225 07 00 11 22 33',
      amount: newBidAmount,
      timestamp: 'À l\'instant',
      isLeading: true
    };

    const updatedBids = [
      ...prod.bids.map(b => ({ ...b, isLeading: false })),
      rivalBid
    ];

    const updatedProduct = {
      ...prod,
      currentPrice: newBidAmount,
      bids: updatedBids
    };

    setProducts(prev => prev.map(p => p.id === prod.id ? updatedProduct : p));
    if (productDetailModal?.id === prod.id) {
      setProductDetailModal(updatedProduct);
    }

    // Déclenche l'alerte push instantanée
    notifyOutbid(prod.id, newBidAmount, currentUser?.id, rival.name);
  }, [products, productDetailModal, notifyOutbid, currentUser]);

  // Live heart-beat simulation for active visitors
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLiveVisitorsCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return next < 80 ? 95 : next > 260 ? 240 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Nettoyage automatique :
  // 1. Annonces d'enchères vendues après expiration du bandeau de 1 heure
  // 2. Articles boutiques en rupture de stock depuis plus de 14 jours (2 semaines) sans réapprovisionnement
  useEffect(() => {
    const cleanerInterval = setInterval(() => {
      const now = new Date().getTime();
      const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

      setProducts(prev => {
        const expiredAuctionIds: string[] = [];
        const expiredOutOfStockIds: string[] = [];

        const next = prev.filter(p => {
          // Rule 1: Sold auction pinned for 1 hour
          if (p.isPinnedSold && p.pinnedUntil) {
            const until = new Date(p.pinnedUntil).getTime();
            if (now >= until) {
              expiredAuctionIds.push(p.id);
              return false;
            }
          }

          // Rule 2: Shop out of stock > 14 days
          if ((p.listingType === 'shop' || p.shopId) && p.isOutOfStock && p.outOfStockSince) {
            const outSince = new Date(p.outOfStockSince).getTime();
            if (now - outSince >= FOURTEEN_DAYS_MS) {
              expiredOutOfStockIds.push(p.id);
              return false;
            }
          }

          return true;
        });

        if (expiredAuctionIds.length > 0) {
          console.log(`[BradCI] Purge automatique de ${expiredAuctionIds.length} annonce(s) d'enchère(s) vendue(s) après 1 heure.`);
        }
        if (expiredOutOfStockIds.length > 0) {
          console.log(`[BradCI] Purge automatique de ${expiredOutOfStockIds.length} article(s) boutique en rupture de stock depuis > 14 jours.`);
        }
        return next;
      });
    }, 15000);

    return () => clearInterval(cleanerInterval);
  }, []);

  // Sync admin states to localStorage
  useEffect(() => {
    localStorage.setItem('bradci_withdrawals', JSON.stringify(withdrawalRequests));
  }, [withdrawalRequests]);

  useEffect(() => {
    localStorage.setItem('bradci_fin_transactions', JSON.stringify(financialTransactions));
  }, [financialTransactions]);

  useEffect(() => {
    localStorage.setItem('bradci_admin_alerts', JSON.stringify(adminAlerts));
  }, [adminAlerts]);

  useEffect(() => {
    localStorage.setItem('bradci_sent_admin_messages', JSON.stringify(sentAdminMessages));
  }, [sentAdminMessages]);

  useEffect(() => {
    localStorage.setItem('bradci_maintenance_mode', String(isMaintenanceMode));
  }, [isMaintenanceMode]);

  useEffect(() => {
    localStorage.setItem('bradci_maintenance_notice', maintenanceNotice);
  }, [maintenanceNotice]);


  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bradci_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('bradci_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('bradci_freight', JSON.stringify(freightJobs));
  }, [freightJobs]);

  useEffect(() => {
    localStorage.setItem('bradci_escrow', JSON.stringify(escrowRecords));
  }, [escrowRecords]);

  useEffect(() => {
    localStorage.setItem('bradci_kyc', JSON.stringify(kycRecords));
  }, [kycRecords]);

  useEffect(() => {
    localStorage.setItem('bradci_referrals', JSON.stringify(referrals));
  }, [referrals]);

  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('bradci_user_gps', JSON.stringify(userLocation));
    }
  }, [userLocation]);

  useEffect(() => {
    localStorage.setItem('bradci_gps_permission', gpsPermissionStatus);
  }, [gpsPermissionStatus]);

  // URL Referral Parameter & Invite Link Auto-Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      let detectedRef = params.get('ref') || params.get('referral') || params.get('sponsor') || params.get('code');
      
      if (!detectedRef && window.location.hash) {
        const hashMatch = window.location.hash.match(/[#&?](?:ref|referral|code|sponsor)=([A-Za-z0-9-_]+)/i);
        if (hashMatch && hashMatch[1]) detectedRef = hashMatch[1];
      }

      if (detectedRef) {
        const clean = detectedRef.trim().toUpperCase();
        setPendingReferralCode(clean);
        localStorage.setItem('bradci_pending_sponsor_code', clean);
        
        const sponsorUser = users.find(u => u.referralCode?.toUpperCase() === clean);
        const sponsorLabel = sponsorUser ? sponsorUser.name : `Code ${clean}`;

        addToast(
          '🎁 Lien Parrain Détecté !',
          `Code parrain [${clean}] activé (${sponsorLabel}). Créez votre compte pour réserver vos +1 000 FCFA de bienvenue !`,
          'success'
        );

        // If not logged in, automatically open authentication modal in registration mode
        if (!currentUser) {
          setAuthModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('Error reading URL params for referral:', err);
    }
  }, []);

  // Request GPS Location (Capacitor Geolocation with Browser Fallback)
  const requestGpsPermission = useCallback(async (forcePrompt = false): Promise<GPSLocation | null> => {
    try {
      const pos = await nativeBridge.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 });
      const lat = pos.latitude;
      const lng = pos.longitude;
      const accuracy = pos.accuracy;
      const nearest = findNearestCommune(lat, lng);
      const newLoc: GPSLocation = {
        lat,
        lng,
        accuracy,
        commune: nearest.name,
        address: `${nearest.name} (${nearest.group}) - Position GPS Détectée`
      };

      setUserLocation(newLoc);
      setGpsPermissionStatus('granted');
      setGpsModalOpen(false);

      if (currentUser) {
        const updated = { ...currentUser, gpsLocation: newLoc };
        setCurrentUser(updated);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
      }

      addToast(
        '📍 GPS Activé avec Succès',
        `Position détectée : ${nearest.name} (${lat.toFixed(4)}, ${lng.toFixed(4)}) [Précision ~${Math.round(accuracy)}m]`,
        'success'
      );
      return newLoc;
    } catch (error: any) {
      console.warn('Capacitor / Browser Geolocation error:', error?.message);
      setGpsPermissionStatus('denied');
      if (forcePrompt) {
        setGpsModalOpen(true);
      }
      const defaultCoords = getCommuneCoords(currentUser?.gpsLocation?.commune || 'Cocody');
      const fallbackLoc: GPSLocation = {
        ...defaultCoords,
        commune: currentUser?.gpsLocation?.commune || 'Cocody',
        address: `${currentUser?.gpsLocation?.commune || 'Cocody'}, Abidjan`,
        accuracy: 50
      };
      setUserLocation(fallbackLoc);
      return fallbackLoc;
    }
  }, [currentUser]);

  // Request Camera Permission (Capacitor Camera)
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await nativeBridge.requestCameraPermission();
      setCameraPermissionStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch {
      setCameraPermissionStatus('denied');
      return false;
    }
  }, []);

  // Capture Photo via Capacitor Camera & Gallery
  const captureNativePhoto = useCallback(async (options?: {
    source?: NativePhotoSource;
    direction?: NativeCameraFacing;
    quality?: number;
  }) => {
    return nativeBridge.capturePhoto(options);
  }, []);

  // Set Manual Location if GPS hardware is unavailable
  const setUserManualLocation = (communeName: string, customAddress?: string) => {
    const coords = getCommuneCoords(communeName);
    const loc: GPSLocation = {
      ...coords,
      commune: communeName,
      address: customAddress || `${communeName}, Abidjan`,
      accuracy: 10
    };
    setUserLocation(loc);
    setGpsPermissionStatus('granted');
    setGpsModalOpen(false);

    if (currentUser) {
      const updated = { ...currentUser, gpsLocation: loc };
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    }

    addToast('Position Enregistrée', `Zone sélectionnée : ${communeName}`, 'success');
  };

  // Switch active user
  const loginAsUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      if (target.gpsLocation) {
        setUserLocation(target.gpsLocation);
      }
      localStorage.setItem('bradci_current_user_id', target.id);
      addToast('Profil Actif', `Connecté en tant que ${target.name} (${target.role.toUpperCase()})`, 'info');
    }
  };

  const loginWithRole = (role: UserRole) => {
    const found = users.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
      if (found.gpsLocation) {
        setUserLocation(found.gpsLocation);
      }
      localStorage.setItem('bradci_current_user_id', found.id);
      addToast('Changement de Rôle', `Connecté en tant que ${found.name}`, 'info');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bradci_current_user_id');
    addToast('Déconnexion', 'Vous êtes maintenant en mode visiteur public.', 'info');
  };

  // Rule 1: Free and Unlimited Product Publishing for All Accounts (Basic, Standard, Pro)
  const canUserPublishProduct = (user?: User | null) => {
    const u = user || currentUser;
    if (!u) return { allowed: false, reason: 'Utilisateur non connecté', limit: 99999, current: 0 };

    const plan = u.sellerPlan || 'basic';
    const count = u.productsPublishedCount || 0;

    // All accounts (including basic free accounts) have full freedom to publish unlimited boutique products & auctions!
    return {
      allowed: true,
      reason: undefined,
      limit: 99999,
      current: count,
      isUnlimited: true,
      plan
    };
  };

  const publishProduct = (productData: Partial<Product>): boolean => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return false;
    }

    // Restriction KYC: User is not allowed to publish/sell without a validated KYC
    if (currentUser.role !== 'admin' && currentUser.kycStatus !== 'verified') {
      setKycRestrictionAction('sell');
      setKycRequiredModalOpen(true);
      addToast(
        'Validation KYC Requise',
        'Pour sécuriser vos transactions, la validation de votre identité (KYC) est requise pour acheter ou vendre sur BRAD\'CI. Si votre dossier est déjà envoyé, il est actuellement en cours de vérification.',
        'warning'
      );
      return false;
    }

    // Account suspension check (Anti-Fraud Enforcement)
    if (currentUser.isSuspended) {
      addToast(
        '🚨 Compte Suspendu',
        currentUser.suspensionReason || 'Votre compte a été suspendu pour 3 infractions aux règles de sécurité Brad\'CI. Contactez le support via WhatsApp.',
        'error'
      );
      return false;
    }

    // ================= STRICT ANTI-FRAUD FILTERING (TEXT + IMAGES) =================
    // Rule: Strict prohibition of phone numbers, WhatsApp, or off-platform direct bypass
    const textToScan = `${productData.title || ''} ${productData.description || ''} ${productData.pickupAddress || ''}`;
    const fraudCheck = detectFraudulentContact(textToScan);
    const imageFraudCheck = detectImageFraud(productData.images || []);

    if (fraudCheck.hasFraud || imageFraudCheck.hasFraud) {
      const reason = fraudCheck.hasFraud ? fraudCheck.message : imageFraudCheck.message;
      const matchedKeyword = fraudCheck.hasFraud ? fraudCheck.detectedPatterns.join(', ') : imageFraudCheck.detectedPatterns.join(', ');
      const currentStrikes = (currentUser.fraudStrikesCount || 0) + 1;
      const isNowSuspended = currentStrikes >= 3;

      // 1. Record incident in administrative log
      const isWhatsapp = fraudCheck.hasFraud && fraudCheck.detectedPatterns.some(p => p.toLowerCase().includes('whatsapp'));
      const isImg = imageFraudCheck.hasFraud;

      recordFraudIncident({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        userPhone: currentUser.phone,
        productTitle: productData.title || 'Annonce sans titre',
        type: isImg ? 'phone_in_image' : isWhatsapp ? 'whatsapp_keyword' : 'phone_in_desc',
        detectedContent: matchedKeyword || 'Coordonnées directes / Numéro masqué',
        strikeNumber: currentStrikes,
        actionTaken: isNowSuspended ? 'account_suspended' : currentStrikes === 1 ? 'warning_sent' : 'strike_applied'
      });

      // 2. Increment user strikes and apply 3-strike rule
      const updatedUser: User = {
        ...currentUser,
        fraudStrikesCount: currentStrikes,
        isSuspended: isNowSuspended,
        suspensionReason: isNowSuspended 
          ? 'Compte et boutique suspendus suite à 3 infractions répétées au filtrage anti-fraude (tentatives d\'échange de coordonnées directes / contournement du séquestre).'
          : currentUser.suspensionReason
      };

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      if (isNowSuspended) {
        addToast(
          '🚨 Compte / Boutique Suspendu (3/3 Infractions) !',
          'Votre compte a été suspendu pour récidive de publication de coordonnées privées. Veuillez contacter le support officiel Brad\'CI.',
          'error'
        );
        addNotification({
          recipientRole: 'all',
          recipientUserId: currentUser.id,
          title: '🚨 Suspension Immédiate du Compte (Règle des 3 Avertissements)',
          message: 'Votre compte et votre boutique ont été suspendus car 3 infractions de coordonnées directes (téléphone/WhatsApp) ont été constatées. Contactez le support via WhatsApp.',
          type: 'system',
          urgency: 'high'
        });
      } else {
        addToast(
          `⚠️ Avertissement Anti-Fraude (${currentStrikes}/3)`,
          `Publication rejetée : ${reason}. Il est strictement interdit d'afficher des numéros ou contacts directs. Au 3ᵉ avertissement, votre compte sera suspendu.`,
          'warning'
        );
      }

      return false;
    }

    const check = canUserPublishProduct(currentUser);
    if (!check.allowed) {
      addToast('Quota Gratuit Atteint', check.reason || 'Passez au Pass supérieur pour continuer à publier', 'warning');
      setTargetPlanForPricing('standard');
      setPricingModalOpen(true);
      return false;
    }

    const plan = currentUser.sellerPlan || 'basic';
    const listingType = productData.listingType || (currentUser.shop ? 'shop' : 'auction');
    // Commission rules:
    // - All auctions are strictly 10% commission regardless of pass/plan
    // - Basic accounts (no subscription) are strictly 10% for both shop and auctions
    // - Certified Pro ('standard') shop items enjoy 5% commission
    // - VIP Gold ('pro') shop items enjoy 2.5% commission
    let commission = 0.10;
    if (listingType === 'shop') {
      if (plan === 'pro') {
        commission = 0.025; // 2.5%
      } else if (plan === 'standard') {
        commission = 0.05; // 5%
      } else {
        commission = 0.10; // 10% basic
      }
    } else {
      commission = 0.10; // 10% for all auctions
    }
    const sellerCommune = productData.commune || userLocation?.commune || 'Cocody';
    const pickupCoords = productData.pickupCoords || getCommuneCoords(sellerCommune);
    const fixedPrice = productData.buyNowPrice || productData.startingPrice || 10000;

    // Stock for shop products
    const initialStock = listingType === 'shop' 
      ? Math.max(1, productData.stockQuantity !== undefined ? Number(productData.stockQuantity) : 5) 
      : undefined;

    const isDirectAdmin = currentUser.role === 'admin';
    const productImages = productData.images && productData.images.length > 0 
      ? productData.images.slice(0, 3) 
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      title: productData.title || 'Nouvel Article',
      description: productData.description || '',
      category: productData.category || 'High-Tech',
      listingType: listingType,
      sellerId: currentUser.id,
      sellerName: currentUser.shop?.name || currentUser.name,
      shopId: currentUser.shop?.id,
      shopName: currentUser.shop?.name,
      sellerAvatar: currentUser.shop?.logo || currentUser.avatar,
      sellerPlan: plan,
      images: productImages,
      videoUrl: productData.videoUrl,
      videoDurationSeconds: productData.videoDurationSeconds,
      startingPrice: fixedPrice,
      currentPrice: fixedPrice,
      buyNowPrice: fixedPrice,
      reservePrice: productData.reservePrice || fixedPrice * 1.2,
      commissionRate: commission,
      stockQuantity: initialStock,
      soldCount: listingType === 'shop' ? 0 : undefined,
      isOutOfStock: false,
      bids: [],
      status: isDirectAdmin ? 'active' : 'pending_approval',
      createdAt: new Date().toISOString(),
      expiresAt: productData.expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      commune: sellerCommune,
      pickupAddress: productData.pickupAddress || `${sellerCommune}, Abidjan`,
      pickupCoords: pickupCoords,
      requiredVehicle: productData.requiredVehicle || 'moto',
      pickupCode: Math.floor(1000 + Math.random() * 9000).toString(),
      deliveryOtpCode: Math.floor(1000 + Math.random() * 9000).toString(),
      isBoosted: productData.isBoosted || false
    };

    // Update state
    setProducts(prev => [newProd, ...prev]);

    // Increment user's product count
    const updatedCount = currentUser.productsPublishedCount + 1;
    const updatedUser = { ...currentUser, productsPublishedCount: updatedCount };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    if (isDirectAdmin) {
      addToast(
        listingType === 'shop' ? '🏪 Annonce Boutique Publiée !' : '🔨 Enchère Publiée !', 
        `Votre article "${newProd.title}" (${initialStock ? `${initialStock} pièces en stock - ` : ''}Compte Admin)${productData.isBoosted ? ' ⚡ Option Boost Flash Activée !' : ''} est en ligne.`, 
        'success'
      );
    } else {
      addToast(
        '⏳ Produit Soumis pour Approbation !',
        `Votre annonce "${newProd.title}" (${productImages.length} photo${productImages.length > 1 ? 's' : ''}${initialStock ? ` - Stock initial : ${initialStock} pcs` : ''})${productData.isBoosted ? ' ⚡ avec Option Boost Flash (1 000 FCFA)' : ''} a été transmise à la modération.`,
        'info'
      );
    }
    return true;
  };

  // Direct Boutique Purchase with Pay on Delivery (POD) & Freight Dispatch
  const buyShopProductDirect = (productId: string, paymentMethod: PaymentMethod = 'Wave', customQuantity?: number): boolean => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return false;
    }

    // Restriction KYC: User is not allowed to purchase without a validated KYC
    if (currentUser.role !== 'admin' && currentUser.kycStatus !== 'verified') {
      setKycRestrictionAction('buy');
      setKycRequiredModalOpen(true);
      addToast(
        'Validation KYC Requise',
        'Pour sécuriser vos transactions, la validation de votre identité (KYC) est requise pour acheter ou vendre sur BRAD\'CI. Si votre dossier est déjà envoyé, il est actuellement en cours de vérification.',
        'warning'
      );
      return false;
    }

    const prod = products.find(p => p.id === productId);
    if (!prod || prod.status !== 'active') {
      addToast('Article Indisponible', 'Cet article n\'est plus disponible à la vente.', 'error');
      return false;
    }

    const isB2B = Boolean(prod.isB2BLot || prod.category === 'Déstockage B2B');
    const b2bTotalStock = prod.b2bTotalUnitsCount || prod.stockQuantity || 1;
    const b2bUnitPrice = prod.b2bUnitPrice || (prod.b2bTotalUnitsCount ? Math.round(prod.currentPrice / prod.b2bTotalUnitsCount) : prod.currentPrice);
    const availableStock = isB2B ? b2bTotalStock : (prod.stockQuantity !== undefined ? prod.stockQuantity : 1);

    // Check Out of Stock
    if (prod.isOutOfStock || availableStock <= 0) {
      addToast(
        'Stock Épuisé',
        'Cet article est en rupture de stock. Nouveau stock disponible bientôt !',
        'warning'
      );
      return false;
    }

    const purchaseQty = customQuantity && customQuantity > 0 ? Math.min(customQuantity, availableStock) : 1;
    const finalAmount = isB2B ? (b2bUnitPrice * purchaseQty) : (prod.buyNowPrice || prod.currentPrice);
    const buyerCommune = userLocation?.commune || currentUser.gpsLocation?.commune || 'Marcory';
    const buyerAddress = userLocation?.address || currentUser.gpsLocation?.address || `${buyerCommune}, Abidjan`;
    const buyerCoords = userLocation || currentUser.gpsLocation || getCommuneCoords(buyerCommune);

    const pickupCoords = prod.pickupCoords || getCommuneCoords(prod.commune);
    const realDistanceKm = calculateHaversineDistance(pickupCoords.lat, pickupCoords.lng, buyerCoords.lat, buyerCoords.lng);
    const distKm = Math.max(2, Math.round(realDistanceKm * 10) / 10);

    const deliveryFee = calculateDeliveryFee(prod.commune, buyerCommune, prod.requiredVehicle);

    // Create Delivery Job for Freight Exchange (Pay on Delivery model)
    const newJob: DeliveryJob = {
      id: 'job-shop-' + Date.now(),
      productId: prod.id,
      productTitle: isB2B ? `${prod.title} (x${purchaseQty})` : prod.title,
      productImage: prod.images[0],
      sellerName: prod.shopName || prod.sellerName,
      sellerPhone: '+225 07 48 92 11 34', // Protected until in-person handover
      pickupCommune: prod.commune,
      pickupAddress: prod.pickupAddress,
      pickupCoords: pickupCoords,
      buyerName: currentUser.name,
      buyerPhone: currentUser.phone,
      dropoffCommune: buyerCommune,
      dropoffAddress: buyerAddress,
      dropoffCoords: buyerCoords,
      requiredVehicle: prod.requiredVehicle,
      deliveryFee,
      itemValue: finalAmount,
      status: 'available',
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      pickupCode: prod.pickupCode,
      deliveryOtpCode: '', // Generated ONLY after buyer pays at delivery!
      distanceKm: distKm,
      etaMinutes: Math.round(distKm * 2.2 + 8),
    };

    setFreightJobs(prev => [newJob, ...prev]);

    // Stock Management Calculation
    const nextStock = Math.max(0, availableStock - purchaseQty);
    const nextSoldCount = (prod.soldCount || 0) + purchaseQty;
    const isNowOutOfStock = nextStock === 0;
    const outOfStockTimestamp = isNowOutOfStock ? new Date().toISOString() : undefined;

    const updatedProd: Product = {
      ...prod,
      stockQuantity: nextStock,
      b2bTotalUnitsCount: isB2B ? nextStock : prod.b2bTotalUnitsCount,
      soldCount: nextSoldCount,
      isOutOfStock: isNowOutOfStock,
      outOfStockSince: outOfStockTimestamp,
      winnerId: currentUser.id,
      winnerName: currentUser.name,
      deliveryJobId: newJob.id,
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING'
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));
    setProductDetailModal(null);
    setGpsTrackingJob(newJob);

    // If out of stock, alert the seller with urgent restock notice
    if (isNowOutOfStock) {
      addNotification({
        recipientRole: 'client',
        recipientUserId: prod.sellerId,
        title: '⚠️ Rupture de Stock !',
        message: `Votre article "${prod.title}" a écoulé toutes ses pièces (${nextSoldCount} vendus au total). Il est désormais affiché "Stock épuisé - Nouveau stock bientôt". Cliquez sur Réapprovisionner pour renseigner le nouveau stock sous 14 jours avant suppression automatique.`,
        type: 'system',
        productId: prod.id,
        urgency: 'high'
      });
    }

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    addToast(
      '🛍️ Commande Enregistrée !',
      isB2B
        ? `Achat de ${purchaseQty} article(s) "${prod.title}" (${finalAmount.toLocaleString('fr-FR')} FCFA). Paiement direct à la livraison.`
        : `Achat de "${prod.title}" pour ${finalAmount.toLocaleString('fr-FR')} FCFA. Paiement Direct à la Livraison lors de la remise en main propre.`,
      'success'
    );
    return true;
  };

  // ================= SHOPPING CART & MULTI-ITEM CHECKOUT ENGINE =================
  const addToCart = (product: Product, quantity: number = 1, forcedChannel?: CartItemChannel): boolean => {
    if (product.status !== 'active') {
      addToast('Article Indisponible', 'Cet article n\'est plus disponible à la vente.', 'error');
      return false;
    }

    const isB2B = Boolean(product.isB2BLot || product.category === 'Déstockage B2B');
    const availableStock = isB2B
      ? (product.b2bTotalUnitsCount || product.stockQuantity || 99)
      : (product.stockQuantity !== undefined ? product.stockQuantity : 99);

    if (product.isOutOfStock || availableStock <= 0) {
      addToast('Stock Épuisé', 'Cet article est en rupture de stock.', 'warning');
      return false;
    }

    const existingIndex = cart.findIndex(item => item.productId === product.id);

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + quantity;
      if (newQty > availableStock) {
        addToast(
          'Stock Maximum Atteint',
          `Vous avez déjà ${existing.quantity} exemplaire(s) dans le panier. Stock restant : ${availableStock}.`,
          'warning'
        );
        return false;
      }
      setCart(prev => prev.map((item, idx) => idx === existingIndex ? { ...item, quantity: newQty } : item));
      addToast(
        '🛒 Quantité Mise à Jour !',
        `"${product.title}" (${newQty} exemplaires dans votre panier).`,
        'success'
      );
    } else {
      const safeQty = Math.min(quantity, availableStock);
      const newItem = createCartItemFromProduct(product, safeQty, forcedChannel);
      setCart(prev => [newItem, ...prev]);
      addToast(
        '🛒 Ajouté au Panier !',
        `"${product.title}" (${safeQty} pièce(s) • ${(newItem.unitPrice * safeQty).toLocaleString('fr-FR')} FCFA) ajouté à votre panier.`,
        'success'
      );
    }

    return true;
  };

  const removeFromCart = (cartItemId: string) => {
    const itemToRemove = cart.find(i => i.id === cartItemId);
    setCart(prev => prev.filter(i => i.id !== cartItemId));
    if (itemToRemove) {
      addToast('Article Retiré', `"${itemToRemove.title}" a été retiré du panier.`, 'info');
    }
  };

  const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const validQty = item.maxAvailableStock ? Math.min(newQuantity, item.maxAvailableStock) : newQuantity;
        return { ...item, quantity: validQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    addToast('Panier Vidé', 'Tous les articles ont été retirés de votre panier.', 'info');
  };

  const checkoutCart = async (
    dropoffAddress: string,
    dropoffCommune: string,
    dropoffCoords: { lat: number; lng: number },
    paymentMethod: PaymentMethod = 'Wave',
    paymentChoice: 'delivery' | 'direct' = 'delivery',
    useReferralDiscount: boolean = false
  ): Promise<CartOrderRecord | null> => {
    if (!currentUser) {
      addToast(
        'Connexion Requise',
        'Veuillez vous connecter ou créer un compte pour finaliser et valider votre commande panier.',
        'info'
      );
      setAuthModalOpen(true);
      return null;
    }

    // Restriction KYC: User is not allowed to finalize an order without a validated KYC
    if (currentUser.role !== 'admin' && currentUser.kycStatus !== 'verified') {
      setKycRestrictionAction('buy');
      setKycRequiredModalOpen(true);
      addToast(
        'Validation KYC Requise',
        'Pour sécuriser vos transactions, la validation de votre identité (KYC) est requise pour acheter ou vendre sur BRAD\'CI. Si votre dossier est déjà envoyé, il est actuellement en cours de vérification.',
        'warning'
      );
      return null;
    }

    if (cart.length === 0) {
      addToast('Panier Vide', 'Votre panier ne contient aucun article.', 'warning');
      return null;
    }

    // Run smart delivery optimization
    const optimization = calculateCartDeliveryOptimization(cart, dropoffCommune, dropoffCoords);

    let referralDiscount = 0;
    if (useReferralDiscount && (currentUser.referralBalance || 0) > 0) {
      const maxDeduct = Math.min(currentUser.referralBalance || 0, optimization.totalCostEstimate);
      const res = applyReferralBalanceToPurchase(maxDeduct);
      if (res.success) {
        referralDiscount = res.deducted;
      }
    }

    const finalAmountToPay = Math.max(0, optimization.totalCostEstimate - referralDiscount);
    const masterOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const orderId = 'cart-order-' + Date.now();
    const deliveryJobId = 'job-cart-' + Date.now();

    const newCartOrder: CartOrderRecord = {
      id: orderId,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      buyerPhone: currentUser.phone,
      items: [...cart],
      sellerGroups: optimization.sellerGroups,
      optimizationSummary: optimization,
      totalItemsCount: optimization.totalItemCount,
      itemsSubtotalFCFA: optimization.itemsSubtotal,
      rawDeliveryFeesFCFA: optimization.rawDeliveryFeeSum,
      optimizedDeliveryFeeFCFA: optimization.optimizedDeliveryFee,
      deliverySavingsFCFA: optimization.totalDeliverySavings,
      referralDiscountFCFA: referralDiscount,
      appliedReferralDiscountFCFA: referralDiscount,
      totalAmountPaidFCFA: finalAmountToPay,
      paymentMethod,
      paymentChoice,
      masterDeliveryOtp: masterOtp,
      dropoffCommune,
      dropoffAddress,
      dropoffCoords,
      status: 'AWAITING_COURIER',
      deliveryJobId,
      createdAt: new Date().toISOString(),
      trackingTimeline: [
        {
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'COMMANDE_CREEE',
          title: 'Commande Panier Validée',
          description: `Panier groupé de ${optimization.totalItemCount} article(s) auprès de ${optimization.uniqueSellersCount} vendeur(s) validé.`
        }
      ]
    };

    // Create Consolidated Delivery Job for Couriers
    const newDeliveryJob: DeliveryJob = {
      id: deliveryJobId,
      productId: cart[0]?.productId || 'cart-group',
      productTitle: `Panier Groupé (${optimization.totalItemCount} articles - ${optimization.uniqueSellersCount} arrêts)`,
      productImage: cart[0]?.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60',
      sellerName: optimization.sellerGroups.map(g => g.sellerName).join(', '),
      sellerPhone: '+225 07 00 00 00 00',
      pickupCommune: optimization.pickupStops[0]?.commune || 'Abidjan',
      pickupAddress: optimization.pickupStops[0]?.address || 'Arrêts multiples',
      pickupCoords: optimization.pickupStops[0]?.coords || dropoffCoords,
      buyerName: currentUser.name,
      buyerPhone: currentUser.phone,
      dropoffCommune,
      dropoffAddress,
      dropoffCoords,
      requiredVehicle: optimization.dominantVehicle,
      deliveryFee: optimization.optimizedDeliveryFee,
      itemValue: optimization.itemsSubtotal,
      status: 'available',
      orderStatus: paymentChoice === 'direct' ? 'PAID' : 'PENDING',
      paymentStatus: paymentChoice === 'direct' ? 'PAID' : 'PENDING',
      pickupCode: optimization.pickupStops[0]?.pickupCode || '1234',
      deliveryOtpCode: masterOtp,
      masterDeliveryOtp: masterOtp,
      distanceKm: Math.round(optimization.totalDistanceKm * 10) / 10,
      etaMinutes: optimization.estimatedMinutesTotal,
      isCartConsolidated: true,
      cartOrderRecordId: orderId,
      pickupStops: optimization.pickupStops,
      cartItemsSummary: {
        totalItems: optimization.totalItemCount,
        uniqueSellers: optimization.uniqueSellersCount,
        items: cart.map(i => ({
          productId: i.productId,
          title: i.title || i.productTitle,
          quantity: i.quantity,
          price: i.unitPrice,
          unitPrice: i.unitPrice,
          sellerName: i.sellerName,
          channel: i.channel,
          image: i.image || i.imageUrl || i.productImage || '',
          pickupCode: i.pickupCode
        }))
      }
    };

    // Save states
    setCartOrders(prev => [newCartOrder, ...prev]);
    setFreightJobs(prev => [newDeliveryJob, ...prev]);

    // Update stock & status for boutique products in cart
    setProducts(prev => prev.map(p => {
      const cartMatch = cart.find(c => c.productId === p.id);
      if (cartMatch) {
        const currentStock = p.stockQuantity !== undefined ? p.stockQuantity : 1;
        const nextStock = Math.max(0, currentStock - cartMatch.quantity);
        const nextSoldCount = (p.soldCount || 0) + cartMatch.quantity;
        const isOutOfStock = nextStock === 0;
        return {
          ...p,
          stockQuantity: nextStock,
          soldCount: nextSoldCount,
          isOutOfStock,
          outOfStockSince: isOutOfStock ? new Date().toISOString() : undefined,
          winnerId: currentUser.id,
          winnerName: currentUser.name,
          orderStatus: 'PENDING',
          paymentStatus: paymentChoice === 'direct' ? 'PAID' : 'PENDING'
        };
      }
      return p;
    }));

    // Notify each seller
    optimization.sellerGroups.forEach(group => {
      addNotification({
        recipientRole: 'client',
        recipientUserId: group.sellerId,
        title: '📦 Nouvelle Vente dans une Commande Panier !',
        message: `L'acheteur ${currentUser.name} a commandé ${group.itemsCount} article(s) (${group.sellerSubtotal.toLocaleString('fr-FR')} FCFA) dans sa commande groupée. Code d'enlèvement livreur : ${group.sellerPickupCode}.`,
        type: 'delivery',
        urgency: 'high'
      });
    });

    // Notify drivers
    addNotification({
      recipientRole: 'driver',
      recipientUserId: 'all_drivers',
      title: '🛵 Nouvelle Course Panier Optimisée !',
      message: `Course multi-arrêts disponible : ${optimization.pickupStops.length} point(s) d'enlèvement -> ${dropoffCommune}. Rémunération : ${optimization.optimizedDeliveryFee.toLocaleString('fr-FR')} FCFA.`,
      type: 'delivery',
      urgency: 'high'
    });

    // Clear cart
    setCart([]);
    setCartModalOpen(false);
    setCartInvoiceModalOrder(newCartOrder);

    // Audio chime & Confetti
    playSuccessChime();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.55 }
    });

    addToast(
      '🎉 Panier Commandé avec Succès !',
      `${optimization.totalItemCount} article(s) groupé(s) - Économie livraison : ${optimization.totalDeliverySavings.toLocaleString('fr-FR')} FCFA. Votre Code Secret Unique de remise est : ${masterOtp}.`,
      'success'
    );

    return newCartOrder;
  };

  const driverConfirmStopPickup = (jobId: string, stopIndex: number, enteredCode: string): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job || !job.pickupStops || !job.pickupStops[stopIndex]) {
      addToast('Arrêt Inexistant', 'Impossible de localiser cet arrêt dans la tournée.', 'error');
      return false;
    }

    const stop = job.pickupStops[stopIndex];
    if (enteredCode.trim() !== stop.pickupCode) {
      addToast('Code Vendeur Incorrect', `Le code à 4 chiffres fourni par ${stop.sellerName} ne correspond pas.`, 'error');
      return false;
    }

    const updatedStops = job.pickupStops.map((s, idx) => 
      idx === stopIndex ? { ...s, isCompleted: true, completedAt: new Date().toISOString() } : s
    );

    const allStopsDone = updatedStops.every(s => s.isCompleted);

    const updatedJob: DeliveryJob = {
      ...job,
      pickupStops: updatedStops,
      status: allStopsDone ? 'in_transit' : job.status,
      orderStatus: allStopsDone ? 'IN_TRANSIT' : job.orderStatus,
      etaMinutes: allStopsDone ? Math.max(8, Math.round((job.distanceKm || 6) * 1.5)) : job.etaMinutes
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));

    if (allStopsDone) {
      voiceNavigator.announceDriverEnRoute(job.assignedDriverName || currentUser?.name || 'Le livreur', job.dropoffCommune, language);
      addToast('🎉 Tous les Colis Enlevés !', `Tournée d'enlèvement terminée. En route vers l'acheteur à ${job.dropoffCommune} !`, 'success');
    } else {
      const remainingCount = updatedStops.filter(s => !s.isCompleted).length;
      addToast('✅ Arrêt Enlevé !', `Colis de ${stop.sellerName} récupéré. Encore ${remainingCount} arrêt(s) avant la livraison finale.`, 'success');
    }

    return true;
  };

  // Rule 3: 5 Bidders Rule
  const placeBid = (productId: string, amount: number): boolean => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return false;
    }

    // Restriction KYC: User is not allowed to bid without a validated KYC
    if (currentUser.role !== 'admin' && currentUser.kycStatus !== 'verified') {
      setKycRestrictionAction('bid');
      setKycRequiredModalOpen(true);
      addToast(
        'Validation KYC Requise',
        'Pour sécuriser vos transactions, la validation de votre identité (KYC) est requise pour acheter ou vendre sur BRAD\'CI. Si votre dossier est déjà envoyé, il est actuellement en cours de vérification.',
        'warning'
      );
      return false;
    }

    const prod = products.find(p => p.id === productId);
    if (!prod) return false;

    if (amount <= prod.currentPrice) {
      addToast('Offre Trop Basse', `L'enchère doit être supérieure à ${prod.currentPrice.toLocaleString('fr-FR')} FCFA`, 'error');
      return false;
    }

    const bidderCommune = userLocation?.commune || currentUser.gpsLocation?.commune || 'Marcory';
    const bidderCoords = userLocation || currentUser.gpsLocation || getCommuneCoords(bidderCommune);
    const distanceKm = prod.pickupCoords 
      ? calculateHaversineDistance(prod.pickupCoords.lat, prod.pickupCoords.lng, bidderCoords.lat, bidderCoords.lng)
      : 5.4;

    const previousLeadingBid = prod.bids.find(b => b.isLeading);

    const newBid = {
      id: 'bid-' + Date.now(),
      bidderId: currentUser.id,
      bidderName: currentUser.name,
      bidderAvatar: currentUser.avatar,
      bidderRating: currentUser.rating || 5.0,
      bidderCommune: bidderCommune,
      bidderDistrict: bidderCommune,
      bidderDistanceKm: Math.round(distanceKm * 10) / 10,
      bidderPhone: currentUser.phone,
      bidderGps: { lat: bidderCoords.lat, lng: bidderCoords.lng },
      amount,
      timestamp: 'À l\'instant',
      isLeading: true,
    };

    const updatedBids = [
      ...prod.bids.map(b => ({ ...b, isLeading: false })),
      newBid
    ];

    let newStatus = prod.status;
    // RÈGLE DES 5 ENCHÉRISSEURS: Quand on atteint 5 enchères, bascule immédiatement en pending_choice
    if (updatedBids.length >= 5 && prod.status === 'active') {
      newStatus = 'pending_choice';
      voiceNavigator.announceFiveBidsReached(prod.title, language);
      addToast(
        '🎯 Règle des 5 Enchérisseurs Déclenchée !', 
        `5 enchères ont été posées sur "${prod.title}". L'enchère est bloquée. Le vendeur va maintenant choisir l'acheteur final.`,
        'warning'
      );
    }

    const updatedProduct = {
      ...prod,
      currentPrice: amount,
      bids: updatedBids,
      status: newStatus
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    if (productDetailModal?.id === productId) {
      setProductDetailModal(updatedProduct);
    }

    // 1. Alerte Push Immédiate à l'ancien enchérisseur dépassé
    if (previousLeadingBid && previousLeadingBid.bidderId !== currentUser.id) {
      notifyOutbid(prod.id, amount, previousLeadingBid.bidderId, currentUser.name);
    }

    // Notification envoyée au vendeur : Possibilité de vendre directement dès cette offre ou d'attendre
    addNotification({
      recipientRole: 'client',
      recipientUserId: prod.sellerId || prod.sellerName,
      title: `🔔 Nouvelle offre reçue (${updatedBids.length}/5) sur "${prod.title}"`,
      message: `${currentUser.name} a placé une offre de ${amount.toLocaleString('fr-FR')} FCFA. Vous pouvez vendre directement à cet acheteur dès maintenant ou attendre d'autres enchérisseurs (jusqu'à 5).`,
      type: 'bid',
      productId: prod.id,
      urgency: 'high'
    });

    // Déclencheur intelligent pour démonstration : surenchère automatique après 22 secondes
    const currentUserId = currentUser.id;
    const currentProdId = prod.id;
    if (updatedBids.length < 5 && newStatus === 'active') {
      setTimeout(() => {
        setProducts(currentProducts => {
          const target = currentProducts.find(p => p.id === currentProdId);
          if (!target || target.status !== 'active' || target.bids.length >= 5) return currentProducts;
          const currentLead = target.bids.find(b => b.isLeading);
          if (currentLead && currentLead.bidderId === currentUserId) {
            const rivalAmount = target.currentPrice + 50000;
            const rivalBid: Bid = {
              id: 'bid-auto-rival-' + Date.now(),
              bidderId: 'usr-rival-auto',
              bidderName: 'Dr. Amara Kouassi (Cocody)',
              bidderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
              bidderRating: 4.9,
              bidderCommune: 'Cocody',
              bidderDistrict: 'Cocody',
              bidderDistanceKm: 5.2,
              bidderPhone: '+225 07 88 99 00 11',
              amount: rivalAmount,
              timestamp: 'À l\'instant',
              isLeading: true
            };
            const updatedProdState = {
              ...target,
              currentPrice: rivalAmount,
              bids: [...target.bids.map(b => ({ ...b, isLeading: false })), rivalBid]
            };
            setTimeout(() => {
              notifyOutbid(target.id, rivalAmount, currentUserId, 'Dr. Amara Kouassi');
            }, 100);
            return currentProducts.map(p => p.id === currentProdId ? updatedProdState : p);
          }
          return currentProducts;
        });
      }, 22000);
    }

    addToast('Enchère Enregistrée !', `Vous menez l'enchère avec ${amount.toLocaleString('fr-FR')} FCFA`, 'success');
    return true;
  };

  // NOUVEAU FLUX BRAD'CI: Le vendeur sélectionne 1 des 5 enchérisseurs -> Paiement Direct à la Livraison
  const sellerSelectBidder = (productId: string, bidderId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const chosenBid = prod.bids.find(b => b.bidderId === bidderId) || prod.bids[0];
    if (!chosenBid) return;

    const finalAmount = chosenBid.amount;
    const pickupCoords = prod.pickupCoords || getCommuneCoords(prod.commune);
    const dropoffCoords = chosenBid.bidderGps || getCommuneCoords(chosenBid.bidderCommune || 'Marcory');
    const realDistanceKm = calculateHaversineDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
    const distKm = Math.max(2, Math.round(realDistanceKm * 10) / 10);

    const deliveryFee = calculateDeliveryFee(prod.commune, chosenBid.bidderCommune || 'Marcory', prod.requiredVehicle);

    // Create Freight Job for the winning buyer
    const newJob: DeliveryJob = {
      id: 'job-' + Date.now(),
      productId: prod.id,
      productTitle: prod.title,
      productImage: prod.images[0],
      sellerName: prod.sellerName,
      sellerPhone: '+225 07 48 92 11 34',
      pickupCommune: prod.commune,
      pickupAddress: prod.pickupAddress,
      pickupCoords: pickupCoords,
      buyerName: chosenBid.bidderName,
      buyerPhone: chosenBid.bidderPhone || '+225 07 66 11 22 33',
      dropoffCommune: chosenBid.bidderCommune || 'Marcory',
      dropoffAddress: `${chosenBid.bidderDistrict || chosenBid.bidderCommune || 'Marcory'}, Abidjan`,
      dropoffCoords: dropoffCoords,
      requiredVehicle: prod.requiredVehicle,
      deliveryFee,
      itemValue: finalAmount,
      status: 'available',
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      pickupCode: prod.pickupCode,
      deliveryOtpCode: '', // Generated ONLY after buyer pays at delivery!
      distanceKm: distKm,
      etaMinutes: Math.round(distKm * 2.2 + 8),
    };

    setFreightJobs(prev => [newJob, ...prev]);

    const updatedProd: Product = {
      ...prod,
      status: 'in_transit',
      winnerId: chosenBid.bidderId,
      winnerName: chosenBid.bidderName,
      selectedBidderId: chosenBid.bidderId,
      selectedBidderName: chosenBid.bidderName,
      deliveryJobId: newJob.id,
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING'
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));
    setFiveBiddersModalProduct(null);
    if (productDetailModal?.id === productId) {
      setProductDetailModal(updatedProd);
    }

    // Add in-app notification to buyer
    addNotification({
      recipientRole: 'client',
      recipientUserId: chosenBid.bidderName,
      title: '🏆 Offre Retenue ! Commande en Cours',
      message: `Félicitations ! Le vendeur a retenu votre offre de ${chosenBid.amount.toLocaleString('fr-FR')} FCFA pour "${prod.title}". Un coursier prend en charge la livraison. Vous effectuerez le paiement direct à la livraison une fois le colis en main.`,
      type: 'bid',
      productId: prod.id,
      urgency: 'high'
    });

    // Vocal voice announcement
    voiceNavigator.announceWinnerChosenAndDepositAlert(prod.title, finalAmount + deliveryFee, language);

    addToast(
      '🎯 Acheteur Retenu & Course Lancée !',
      `Offre attribuée à ${chosenBid.bidderName}. La livraison est lancée sur la bourse de fret. Paiement direct à la livraison.`,
      'success'
    );
  };

  // Validation directe acheteur (Pay on Delivery)
  const buyerCompleteEscrowDeposit = (productId: string, paymentMethod: PaymentMethod = 'Wave'): boolean => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return false;

    const winningBid = prod.bids.find(b => b.bidderId === prod.selectedBidderId) || prod.bids[0];
    if (!winningBid) return false;

    const finalAmount = winningBid.amount;
    const pickupCoords = prod.pickupCoords || getCommuneCoords(prod.commune);
    const dropoffCoords = winningBid.bidderGps || getCommuneCoords(winningBid.bidderCommune || 'Marcory');
    const realDistanceKm = calculateHaversineDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
    const distKm = Math.max(2, Math.round(realDistanceKm * 10) / 10);

    const deliveryFee = calculateDeliveryFee(prod.commune, winningBid.bidderCommune || 'Marcory', prod.requiredVehicle);

    // Create Freight Job
    const newJob: DeliveryJob = {
      id: 'job-' + Date.now(),
      productId: prod.id,
      productTitle: prod.title,
      productImage: prod.images[0],
      sellerName: prod.sellerName,
      sellerPhone: '+225 07 48 92 11 34',
      pickupCommune: prod.commune,
      pickupAddress: prod.pickupAddress,
      pickupCoords: pickupCoords,
      buyerName: winningBid.bidderName,
      buyerPhone: winningBid.bidderPhone || '+225 07 66 11 22 33',
      dropoffCommune: winningBid.bidderCommune || 'Marcory',
      dropoffAddress: `${winningBid.bidderDistrict || winningBid.bidderCommune || 'Marcory'}, Abidjan`,
      dropoffCoords: dropoffCoords,
      requiredVehicle: prod.requiredVehicle,
      deliveryFee,
      itemValue: finalAmount,
      status: 'available',
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      pickupCode: prod.pickupCode,
      deliveryOtpCode: '', // Locked until payment confirmed!
      distanceKm: distKm,
      etaMinutes: Math.round(distKm * 2.2 + 8),
    };

    setFreightJobs(prev => [newJob, ...prev]);

    const updatedProd: Product = {
      ...prod,
      status: 'in_transit',
      winnerId: winningBid.bidderId,
      winnerName: winningBid.bidderName,
      deliveryJobId: newJob.id,
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING'
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));
    setBuyerDepositModalProduct(null);
    if (productDetailModal?.id === productId) {
      setProductDetailModal(updatedProd);
    }

    // Voice announcement
    voiceNavigator.speak(`Achat confirmé. Paiement direct à la livraison prévu lors de la remise en main propre.`, language);

    // Toast + Confetti
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });

    addToast(
      '🛵 Commande Confirmée !',
      `Livraison enclenchée pour ${winningBid.bidderName}. Paiement direct prévu à la livraison (${(finalAmount + deliveryFee).toLocaleString('fr-FR')} FCFA).`,
      'success'
    );

    return true;
  };

  // L'acheteur refuse ou annule le dépôt -> Alerte le vendeur pour choisir parmi les autres
  const buyerDeclineSelectedOffer = (productId: string, reason: string = 'Désistement de l\'acheteur') => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const declinedBidderId = prod.selectedBidderId;
    const declinedBidderName = prod.selectedBidderName || 'L\'acheteur';
    const existingDeclined = prod.declinedBidderIds || [];
    const newDeclined = declinedBidderId ? [...existingDeclined, declinedBidderId] : existingDeclined;

    const remainingEligibleBids = prod.bids.filter(b => !newDeclined.includes(b.bidderId));

    const updatedProd: Product = {
      ...prod,
      status: 'pending_choice',
      selectedBidderId: undefined,
      selectedBidderName: undefined,
      declinedBidderIds: newDeclined
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));
    setBuyerDepositModalProduct(null);
    if (productDetailModal?.id === productId) {
      setProductDetailModal(updatedProd);
    }

    // Alert seller
    addNotification({
      recipientRole: 'client',
      recipientUserId: prod.sellerName,
      title: '⚠️ Désistement de l\'Acheteur Retenu',
      message: `${declinedBidderName} s'est désisté (${reason}) pour "${prod.title}". Vous pouvez immédiatement choisir parmi les ${remainingEligibleBids.length} autres enchérisseurs restants !`,
      type: 'bid',
      productId: prod.id,
      urgency: 'high'
    });

    // Voice announcement
    voiceNavigator.announceBuyerDeclined(prod.title, declinedBidderName, remainingEligibleBids.length, language);

    // If current user is the seller, open the selection modal to pick among remaining bidders
    if (currentUser?.name === prod.sellerName || currentUser?.id === prod.sellerId) {
      setFiveBiddersModalProduct(updatedProd);
    }

    addToast(
      '⚠️ Désistement Enregistré',
      `${declinedBidderName} a annulé. Le vendeur a été notifié pour choisir parmi les ${remainingEligibleBids.length} offres restantes.`,
      'warning'
    );
  };

  // Suppression / Purge automatique d'un post vendu après 1h
  const purgeExpiredSoldProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (productDetailModal?.id === productId) {
      setProductDetailModal(null);
    }
    addToast('Annonce Archivée & Supprimée', 'L\'annonce d\'enchère vendue a expiré et a été définitivement supprimée.', 'info');
  };

  const sellerChooseWinner = (productId: string, winnerId: string) => {
    sellerSelectBidder(productId, winnerId);
  };

  const sellerCancelAuction = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'cancelled' } : p));
    setFiveBiddersModalProduct(null);
    addToast('Enchère Annulée', 'La vente a été annulée. Aucun frais n\'a été prélevé.', 'info');
  };

  // Simulation Instantanée de la Règle Métier des 5 Offres Brad'CI
  const simulateFiveBids = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const basePrice = prod.startingPrice || prod.currentPrice || 10000;
    const step = Math.max(2000, Math.round((basePrice * 0.08) / 500) * 500);

    const mockFiveBidders: Bid[] = [
      {
        id: 'bid-mock-1',
        bidderId: 'u_bid_1',
        bidderName: 'Serge Koffi',
        bidderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bidderPhone: '+225 07 55 12 34 56',
        bidderCommune: 'Cocody',
        bidderDistrict: 'Riviera Bonoumin',
        bidderGps: { lat: 5.3599, lng: -3.9870 },
        amount: basePrice + step * 1,
        timestamp: 'Il y a 45 min',
        isLeading: false
      },
      {
        id: 'bid-mock-2',
        bidderId: 'u_bid_2',
        bidderName: 'Awa Diomandé',
        bidderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bidderPhone: '+225 05 44 89 22 10',
        bidderCommune: 'Plateau',
        bidderDistrict: 'Avenue Chardy',
        bidderGps: { lat: 5.3261, lng: -4.0197 },
        amount: basePrice + step * 2,
        timestamp: 'Il y a 30 min',
        isLeading: false
      },
      {
        id: 'bid-mock-3',
        bidderId: 'u_bid_3',
        bidderName: 'Yves Bakayoko',
        bidderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        bidderPhone: '+225 01 02 03 04 05',
        bidderCommune: 'Marcory',
        bidderDistrict: 'Zone 4C Rue du Canal',
        bidderGps: { lat: 5.3039, lng: -3.9809 },
        amount: basePrice + step * 3,
        timestamp: 'Il y a 18 min',
        isLeading: false
      },
      {
        id: 'bid-mock-4',
        bidderId: 'u_bid_4',
        bidderName: 'Fatou Traoré',
        bidderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        bidderPhone: '+225 07 88 99 00 11',
        bidderCommune: 'Yopougon',
        bidderDistrict: 'Niangon Sud',
        bidderGps: { lat: 5.3411, lng: -4.0728 },
        amount: basePrice + step * 4,
        timestamp: 'Il y a 7 min',
        isLeading: false
      },
      {
        id: 'bid-mock-5',
        bidderId: 'u_bid_5',
        bidderName: 'Moussa Cissé',
        bidderAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        bidderPhone: '+225 05 77 66 55 44',
        bidderCommune: 'Koumassi',
        bidderDistrict: 'Remblais Saint-Étienne',
        bidderGps: { lat: 5.2930, lng: -3.9470 },
        amount: basePrice + step * 5,
        timestamp: 'À l\'instant',
        isLeading: true
      }
    ];

    const updatedProduct: Product = {
      ...prod,
      bids: mockFiveBidders,
      currentPrice: mockFiveBidders[4].amount,
      status: 'pending_choice'
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    if (productDetailModal?.id === productId) {
      setProductDetailModal(updatedProduct);
    }
    
    // Vocal announcement
    voiceNavigator.announceFiveBidsReached(prod.title, language);

    // Automatically open the 5 Bidders Modal for instant testing
    setFiveBiddersModalProduct(updatedProduct);

    addToast(
      '🎯 Règle des 5 Offres Atteinte !',
      `5 enchères réelles ont été enregistrées sur "${prod.title}". L'enchère est maintenant bloquée en arbitrage vendeur !`,
      'warning'
    );
  };

  // Rule 2: Delivery Driver Access - Free Unlimited Active Mode by Default (like basic accounts), Pass VIP Coming Soon (activates 5 free trial deliveries on launch)
  const canDriverTakeDeliveries = (driver?: User | null) => {
    const d = driver || currentUser;
    if (!d || d.role !== 'driver') {
      return { allowed: false, reason: 'Compte livreur requis', remaining: 0, isUnlimited: false };
    }

    // VIP Pass has 100% unlimited runs
    if (d.driverPlan === 'vip_pass') {
      return { allowed: true, remaining: 9999, isUnlimited: true };
    }

    // If driver is currently on trial with active quota
    if (d.driverPlan === 'trial') {
      const remaining = d.trialDeliveriesRemaining ?? 5;
      if (remaining <= 0) {
        return {
          allowed: false,
          reason: 'Période d\'essai terminée (5/5 courses gratuites utilisées). Vous pouvez souscrire au Pass Livreur VIP (6 000 FCFA / mois) pour continuer à accepter des livraisons.',
          remaining: 0,
          isUnlimited: false
        };
      }
      return { allowed: true, remaining, isUnlimited: false };
    }

    // Default current state: Free unlimited deliveries active for all couriers
    return { allowed: true, remaining: 9999, isUnlimited: true };
  };

  const toggleDriverAvailability = () => {
    if (!currentUser || currentUser.role !== 'driver') return;
    const currentStatus = currentUser.driverAvailability || 'available';
    const nextStatus = currentStatus === 'available' ? 'offline' : 'available';
    const isNowOnline = nextStatus === 'available';

    const updatedUser: User = {
      ...currentUser,
      driverAvailability: nextStatus,
      isOnline: isNowOnline
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    addToast(
      isNowOnline ? '🟢 Livreur En Service' : '🔴 Livreur En Pause',
      isNowOnline 
        ? 'Vous êtes maintenant visible sur la bourse de fret pour recevoir des commandes.' 
        : 'Vous êtes temporairement indisponible pour de nouvelles courses.',
      isNowOnline ? 'success' : 'info'
    );
  };

  const switchDriverAccount = (driverId: string) => {
    const targetDriver = users.find(u => u.id === driverId && u.role === 'driver');
    if (!targetDriver) return;
    setCurrentUser(targetDriver);
    localStorage.setItem('bradci_current_user_id', targetDriver.id);
    addToast(
      'Compte Livreur Activé',
      `Connecté en tant que ${targetDriver.name} (${targetDriver.driverPlan === 'vip_pass' ? 'Pass VIP 6 000 F' : 'Période Essai 5 Courses'})`,
      'info'
    );
  };

  const driverAcceptJob = (jobId: string): boolean => {
    if (!currentUser || currentUser.role !== 'driver') {
      addToast('Accès Restreint', 'Seul un livreur connecté peut accepter une course.', 'error');
      return false;
    }

    const check = canDriverTakeDeliveries(currentUser);
    if (!check.allowed) {
      addToast('Pass Livreur Requis', check.reason || 'Abonnement obligatoire après 5 courses', 'warning');
      setTargetPlanForPricing('vip_pass');
      setPricingModalOpen(true);
      return false;
    }

    const targetJob = freightJobs.find(j => j.id === jobId);
    if (!targetJob) return false;

    const driverCoords = userLocation || currentUser.gpsLocation || { lat: 5.3421, lng: -4.0150 };

    const updatedJob: DeliveryJob = {
      ...targetJob,
      status: 'accepted',
      assignedDriverId: currentUser.id,
      assignedDriverName: currentUser.name,
      assignedDriverPhone: currentUser.phone,
      assignedDriverVehicle: currentUser.kycVehicleType || currentUser.vehicleDetails?.type || 'moto',
      assignedDriverVehiclePlate: currentUser.kycVehiclePlate || currentUser.vehicleDetails?.plate || '4523 JJ 01',
      assignedDriverVehicleColor: currentUser.kycVehicleColor || currentUser.vehicleDetails?.color || 'Noir & Rouge',
      assignedDriverVehicleModel: currentUser.kycVehicleModel || currentUser.vehicleDetails?.model || 'Yamaha Crypton 110',
      currentLat: driverCoords.lat,
      currentLng: driverCoords.lng,
      etaMinutes: targetJob.etaMinutes || 15,
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    
    // Vocal announcement
    voiceNavigator.announceOrderAccepted(targetJob.productTitle, currentUser.name, language);

    addToast('Course Acceptée !', `Rendez-vous à ${updatedJob.pickupCommune} (${updatedJob.pickupAddress}) pour récupérer le colis.`, 'success');
    return true;
  };

  const assignTestJobToDriver = (driverId?: string) => {
    const targetDriver = driverId 
      ? users.find(u => u.id === driverId) 
      : (currentUser?.role === 'driver' ? currentUser : users.find(u => u.role === 'driver'));
    if (!targetDriver) return;

    // Check if an available job already exists in freightJobs
    const avail = freightJobs.find(j => j.status === 'available');
    if (avail) {
      driverAcceptJob(avail.id);
      setActiveDriverTab('active_mission');
      return;
    }

    // Create a fresh test job assigned to this driver
    const newJob: DeliveryJob = {
      id: 'job-test-' + Date.now(),
      productId: 'prod-test-' + Date.now(),
      productTitle: 'Sneakers Nike Air Jordan 4 "Retro White Cement"',
      productImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80',
      sellerName: 'Boutique SneakerHub Abidjan',
      sellerPhone: '+225 07 48 92 11 34',
      pickupCommune: 'Cocody',
      pickupAddress: 'Deux-Plateaux Vallons, Rue des Jardins',
      pickupCoords: { lat: 5.3620, lng: -3.9910 },
      buyerName: 'David Kouamé',
      buyerPhone: '+225 05 99 88 77 66',
      dropoffCommune: 'Marcory',
      dropoffAddress: 'Zone 4, Boulevard de Marseille',
      dropoffCoords: { lat: 5.2954, lng: -3.9847 },
      requiredVehicle: 'moto',
      deliveryFee: 3500,
      itemValue: 120000,
      status: 'in_transit',
      assignedDriverId: targetDriver.id,
      assignedDriverName: targetDriver.name,
      assignedDriverPhone: targetDriver.phone,
      pickupCode: '4491',
      deliveryOtpCode: '8814',
      distanceKm: 7.4,
      etaMinutes: 12
    };

    setFreightJobs(prev => [newJob, ...prev]);
    setActiveDriverTab('active_mission');
    addToast('Nouvelle Mission Assignée !', `La course "${newJob.productTitle}" vous a été attribuée (+3 500 FCFA).`, 'success');
  };

  const driverConfirmPickup = (jobId: string, enteredCode: string): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return false;

    if (enteredCode.trim() !== job.pickupCode) {
      addToast('Code Enlèvement Incorrect', 'Le code à 4 chiffres fourni par le vendeur ne correspond pas.', 'error');
      return false;
    }

    const updatedJob: DeliveryJob = {
      ...job,
      status: 'in_transit',
      orderStatus: 'IN_TRANSIT',
      etaMinutes: Math.max(5, Math.round((job.distanceKm || 8) * 1.8))
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    setProducts(prev => prev.map(p => p.id === job.productId ? { ...p, status: 'in_transit', orderStatus: 'IN_TRANSIT' } : p));
    
    addNotification({
      recipientRole: 'client',
      recipientUserId: job.buyerName,
      title: '🛵 Colis Pris en Charge par le Livreur',
      message: `Le coursier ${job.assignedDriverName || 'Bakary'} a récupéré votre article "${job.productTitle}" à ${job.pickupCommune}. En route vers votre adresse !`,
      type: 'delivery',
      jobId: job.id,
      urgency: 'high'
    });

    // Vocal announcement
    voiceNavigator.announceDriverEnRoute(job.assignedDriverName || currentUser?.name || 'Le livreur', job.pickupCommune, language);

    addToast('Colis Enlevé !', 'En route vers le destinataire. Suivi GPS activé en temps réel.', 'success');
    return true;
  };

  const driverDeclareArrival = (jobId: string): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return false;

    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const updatedJob: DeliveryJob = {
      ...job,
      status: 'arrived',
      orderStatus: 'ARRIVED',
      driverArrivedAtDestination: true,
      inspectionStatus: 'arrived_inspecting',
      arrivalTimestamp: timeStr,
      etaMinutes: 0
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    setProducts(prev => prev.map(p => p.id === job.productId ? { ...p, status: 'arrived' as any, orderStatus: 'ARRIVED' } : p));

    // Vocal announcement
    voiceNavigator.announceDriverArrived(job.assignedDriverName || 'Le livreur', job.dropoffCommune, language);

    // Send high-priority notification to buyer (triggers unlock of "Payer et Valider")
    addNotification({
      recipientRole: 'client',
      recipientUserId: job.buyerName,
      title: '📍 Votre livreur est arrivé ! Étape "Payer et Valider" débloquée',
      message: `Le coursier (${job.assignedDriverName || 'Bakary'}) est arrivé à votre porte à ${job.dropoffCommune}. Vous pouvez désormais initier votre paiement direct sécurisé par API sur l'application.`,
      type: 'inspection',
      jobId: job.id,
      urgency: 'critical'
    });

    // Send notification to seller
    addNotification({
      recipientRole: 'client',
      recipientUserId: job.sellerName,
      title: '📍 Livreur Arrivé chez le Client',
      message: `Le livreur est arrivé chez ${job.buyerName} à ${job.dropoffCommune}. Vérification contradictoire et paiement direct en cours.`,
      type: 'delivery',
      jobId: job.id,
      urgency: 'normal'
    });

    addToast(
      '📍 Arrivée chez le Client Signalée (GPS)',
      `Vous êtes bien arrivé à ${job.dropoffCommune}. L'acheteur (${job.buyerName}) a désormais le bouton "Payer et Valider" débloqué sur son application.`,
      'info'
    );
    return true;
  };

  // PAIEMENT DIRECT À LA LIVRAISON (Pay on Delivery via API)
  // Initié exclusivement depuis l'interface de l'acheteur une fois le livreur ARRIVED
  const buyerInitiatePayOnDelivery = async (jobId: string, operator: PaymentMethod = 'Wave'): Promise<boolean> => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) {
      addToast('Erreur', 'Mission de livraison introuvable.', 'error');
      return false;
    }

    if (job.orderStatus !== 'ARRIVED' && job.status !== 'arrived') {
      addToast('Livreur non arrivé', 'Le paiement direct ne peut être initié que lorsque le livreur a signalé son arrivée sur place via GPS.', 'warning');
      return false;
    }

    const prod = products.find(p => p.id === job.productId);
    const sellerUser = users.find(u => u.name === job.sellerName || (job.sellerName && job.sellerName.includes(u.name)));
    const sellerPlan = sellerUser?.sellerPlan || prod?.sellerPlan || 'basic';
    
    // Commission structure: Basic: 10%, Intermédiaire / Standard: 5%, Pro: 2.5%
    let commissionPercent = 10;
    if (sellerPlan === 'pro') {
      commissionPercent = 2.5;
    } else if (sellerPlan === 'standard' || (sellerPlan as string) === 'intermediaire') {
      commissionPercent = 5.0;
    }

    const productPrice = Number(job.itemValue) || 0;
    const deliveryFee = Number(job.deliveryFee) || 0;
    const platformCommission = Math.round(productPrice * (commissionPercent / 100));
    const platformFixedFee = 500; // Frais techniques fixes de plateforme
    const platformTotal = platformCommission + platformFixedFee;
    const sellerPayout = Math.max(0, productPrice - platformCommission);
    const totalBuyerPaid = productPrice + deliveryFee + platformFixedFee;

    // Transition: PAYMENT_PENDING
    setFreightJobs(prev => prev.map(j => j.id === jobId ? {
      ...j,
      orderStatus: 'PAYMENT_PENDING',
      paymentStatus: 'PENDING',
    } : j));

    addToast('Paiement Direct Initié', `Connexion à l'API ${operator}... Traitement de ${totalBuyerPaid.toLocaleString('fr-FR')} FCFA.`, 'info');

    // Simulate Merchant API Webhook confirmation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Webhook PAYMENT_SUCCESS confirmation triggered!
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const paidAtIso = new Date().toISOString();

    // 1. Record Direct Payment
    const directRecord: DirectPaymentRecord = {
      id: 'pay-' + Date.now(),
      orderId: job.id,
      productId: job.productId,
      buyerName: job.buyerName,
      sellerName: job.sellerName,
      driverName: job.assignedDriverName || 'Coursier BRAD\'CI',
      totalAmountPaid: totalBuyerPaid,
      productPrice,
      deliveryFee,
      commissionAmount: platformCommission,
      commissionPercent,
      platformFee: platformFixedFee,
      sellerPayout,
      paymentMethod: operator,
      paymentStatus: 'SUCCESS',
      paidAt: paidAtIso
    };

    setDirectPaymentRecords(prev => [directRecord, ...prev]);

    // 2. ATOMIC SPLIT PAYMENT:
    // - Seller: Product Price - Commission (10% Basic, 5% Intermédiaire, 2.5% Pro)
    // - Courier: Delivery Fee
    // - Platform: Commission + Platform fees
    setUsers(prev => prev.map(u => {
      let updated = { ...u };
      // Seller
      if (u.name === job.sellerName || (job.sellerName && job.sellerName.includes(u.name))) {
        updated.walletBalance = (updated.walletBalance || 0) + sellerPayout;
      }
      // Driver
      if (u.id === job.assignedDriverId || u.name === job.assignedDriverName) {
        updated.walletBalance = (updated.walletBalance || 0) + deliveryFee;
      }
      return updated;
    }));

    if (currentUser) {
      if (currentUser.name === job.sellerName) {
        setCurrentUser(prev => prev ? { ...prev, walletBalance: (prev.walletBalance || 0) + sellerPayout } : null);
      } else if (currentUser.id === job.assignedDriverId) {
        setCurrentUser(prev => prev ? { ...prev, walletBalance: (prev.walletBalance || 0) + deliveryFee } : null);
      }
    }

    // 3. Update DeliveryJob: orderStatus = 'PAID', unlock deliveryOtpCode ONLY now!
    const updatedJob: DeliveryJob = {
      ...job,
      orderStatus: 'PAID',
      paymentStatus: 'PAID',
      paidAt: paidAtIso,
      deliveryOtpCode: generatedOtp,
      otpGeneratedAt: paidAtIso,
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    setProducts(prev => prev.map(p => p.id === job.productId ? { ...p, orderStatus: 'PAID', paymentStatus: 'PAID' } : p));
    setGpsTrackingJob(updatedJob);

    // Record Split Payment Transactions
    const newTxList: FinancialTransaction[] = [
      {
        id: 'tx-split-seller-' + Date.now(),
        type: 'commission',
        amount: sellerPayout,
        fee: 0,
        netAmount: sellerPayout,
        fromUserName: job.buyerName,
        toUserName: job.sellerName,
        description: `Split Marchand : Vente ${job.productTitle} (${productPrice.toLocaleString('fr-FR')} F - ${commissionPercent}% comm)`,
        timestamp: paidAtIso,
        status: 'completed',
        reference: `POD-${job.id.slice(-6)}-SELLER`
      },
      {
        id: 'tx-split-driver-' + Date.now(),
        type: 'commission',
        amount: deliveryFee,
        fee: 0,
        netAmount: deliveryFee,
        fromUserName: job.buyerName,
        toUserName: job.assignedDriverName || 'Coursier',
        description: `Split Coursier : Frais de livraison ${job.pickupCommune} -> ${job.dropoffCommune}`,
        timestamp: paidAtIso,
        status: 'completed',
        reference: `POD-${job.id.slice(-6)}-DRIVER`
      },
      {
        id: 'tx-split-platform-' + Date.now(),
        type: 'commission',
        amount: platformTotal,
        fee: 0,
        netAmount: platformTotal,
        fromUserName: job.buyerName,
        toUserName: 'BRAD\'CI Plateforme',
        description: `Split Plateforme : Commission ${commissionPercent}% (${platformCommission.toLocaleString('fr-FR')} F) + Frais (${platformFixedFee} F)`,
        timestamp: paidAtIso,
        status: 'completed',
        reference: `POD-${job.id.slice(-6)}-BRADCI`
      }
    ];

    setFinancialTransactions(prev => [...newTxList, ...prev]);

    // 4. Cryptographic Payment Audit Log & Receipt generation
    const matchingKyc = kycRecords.find(k => k.userId === sellerUser?.id || k.userName === job.sellerName);
    const maskedCni = matchingKyc?.documentNumber ? `CI-***${matchingKyc.documentNumber.slice(-4)}` : 'CI-***7842 (Vérifié KYC)';
    
    const transactionDataInput: TransactionAuditInput = {
      transactionId: job.id,
      orderId: job.id,
      externalProviderId: `WAVE-CI-${Date.now().toString().slice(-8)}`,
      transactionRef: `WAVE-CI-${Date.now().toString().slice(-8)}`,
      provider: (operator as any) || 'Wave',
      timestamp: paidAtIso,
      buyerId: currentUser?.id || 'buyer-1',
      buyerName: job.buyerName,
      buyerPhone: job.buyerPhone,
      sellerId: sellerUser?.id || 'seller-1',
      sellerName: job.sellerName,
      sellerPhone: job.sellerPhone,
      sellerKycMaskedId: maskedCni,
      itemId: job.productId,
      itemTitle: job.productTitle,
      itemCategory: prod?.category || 'Occasion Certifiée',
      itemPriceFCFA: productPrice,
      deliveryFeeFCFA: deliveryFee,
      platformFeeFCFA: platformFixedFee,
      amountTotalFCFA: totalBuyerPaid,
      deliveryOtpCode: generatedOtp,
      driverName: job.assignedDriverName || 'Coursier BRAD\'CI',
      communeOrigin: job.pickupCommune,
      communeDestination: job.dropoffCommune
    };

    try {
      const auditResult = await createPaymentAuditLog(transactionDataInput);
      console.log('Payment Audit Log Registered:', auditResult);
    } catch (auditErr) {
      console.error('Audit log registration error:', auditErr);
    }

    // Send notifications
    addNotification({
      recipientRole: 'client',
      recipientUserId: job.buyerName,
      title: '✅ Paiement Confirmé & Code Secret Débloqué !',
      message: `Votre paiement API ${operator} de ${totalBuyerPaid.toLocaleString('fr-FR')} FCFA a été validé avec succès. Votre Code Secret de remise est : ${generatedOtp}. Transmettez-le au coursier pour récupérer votre colis.`,
      type: 'payment',
      jobId: job.id,
      urgency: 'critical'
    });

    addNotification({
      recipientRole: 'client',
      recipientUserId: job.sellerName,
      title: '💰 Paiement Direct Reçu !',
      message: `L'acheteur a validé le paiement direct à la livraison pour "${job.productTitle}". +${sellerPayout.toLocaleString('fr-FR')} FCFA (après ${commissionPercent}% de commission) crédités sur votre solde.`,
      type: 'payment',
      jobId: job.id,
      urgency: 'high'
    });

    if (job.assignedDriverName) {
      addNotification({
        recipientRole: 'driver',
        recipientUserId: job.assignedDriverName,
        title: '💵 Paiement Effectué par l\'Acheteur !',
        message: `L'acheteur a payé via l'API ${operator}. Récupérez son Code Secret de remise pour finaliser la livraison et encaisser vos ${deliveryFee.toLocaleString('fr-FR')} FCFA.`,
        type: 'delivery',
        jobId: job.id,
        urgency: 'critical'
      });
    }

    confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.6 }
    });

    addToast(
      '✅ Paiement Validé par l\'API !',
      `Paiement direct ${operator} confirmé (${totalBuyerPaid.toLocaleString('fr-FR')} FCFA). Votre Code Secret de remise est : ${generatedOtp}. Donnez-le au livreur.`,
      'success'
    );

    return true;
  };

  const openOfficialReceipt = async (
    jobIdOrJob: string | DeliveryJob,
    requestedRole?: 'buyer' | 'seller' | 'driver'
  ): Promise<boolean> => {
    const targetJob: DeliveryJob | undefined = typeof jobIdOrJob === 'string'
      ? (freightJobs.find(j => j.id === jobIdOrJob) || (gpsTrackingJob?.id === jobIdOrJob ? gpsTrackingJob : undefined))
      : jobIdOrJob;

    if (!targetJob) {
      addToast('Erreur', 'Données de transaction introuvables.', 'error');
      return false;
    }

    const prod = products.find(p => p.id === targetJob.productId);
    const sellerUser = users.find(u => u.name === targetJob.sellerName || (targetJob.sellerName && targetJob.sellerName.includes(u.name)));
    const matchingKyc = kycRecords.find(k => k.userId === sellerUser?.id || k.userName === targetJob.sellerName);
    const maskedCni = matchingKyc?.documentNumber ? `CI-***${matchingKyc.documentNumber.slice(-4)}` : 'CI-***7842 (Vérifié KYC)';

    const productPrice = Number(targetJob.itemValue) || 10000;
    const deliveryFee = Number(targetJob.deliveryFee) || 1500;
    const platformFixedFee = 500;
    const totalBuyerPaid = productPrice + deliveryFee + platformFixedFee;

    const txInput: TransactionAuditInput = {
      transactionId: targetJob.id,
      orderId: targetJob.id,
      externalProviderId: `WAVE-CI-${(targetJob.paidAt || Date.now().toString()).slice(-8)}`,
      transactionRef: `WAVE-CI-${(targetJob.paidAt || Date.now().toString()).slice(-8)}`,
      provider: (targetJob.paymentOperator as any) || 'Wave',
      timestamp: targetJob.paidAt || targetJob.completedAt || new Date().toISOString(),
      buyerId: currentUser?.id || 'buyer-1',
      buyerName: targetJob.buyerName,
      buyerPhone: targetJob.buyerPhone || '+225 07 00 00 00',
      sellerId: sellerUser?.id || 'seller-1',
      sellerName: targetJob.sellerName,
      sellerPhone: targetJob.sellerPhone || '+225 07 48 92 11 34',
      sellerKycMaskedId: maskedCni,
      itemId: targetJob.productId,
      itemTitle: targetJob.productTitle,
      itemCategory: prod?.category || 'Occasion Certifiée',
      itemPriceFCFA: productPrice,
      deliveryFeeFCFA: deliveryFee,
      platformFeeFCFA: platformFixedFee,
      amountTotalFCFA: totalBuyerPaid,
      deliveryOtpCode: targetJob.deliveryOtpCode || '8814',
      driverName: targetJob.assignedDriverName || 'Coursier BRAD\'CI',
      communeOrigin: targetJob.pickupCommune,
      communeDestination: targetJob.dropoffCommune
    };

    // Strict Role-Based Separation:
    // Livreur => voit UNIQUEMENT son bordereau livreur ('driver'), JAMAIS acheteur ni vendeur
    // Vendeur => voit UNIQUEMENT son attestation de vente ('seller'), JAMAIS acheteur
    // Acheteur => voit UNIQUEMENT son reçu d'achat ('buyer'), JAMAIS vendeur
    let authorizedRole: 'buyer' | 'seller' | 'driver' = 'buyer';
    if (currentUser?.role === 'driver' || currentUser?.id === targetJob.assignedDriverId || currentUser?.name === targetJob.assignedDriverName) {
      // Driver is strictly locked to driver mission slip
      authorizedRole = 'driver';
    } else if (requestedRole === 'seller') {
      authorizedRole = 'seller';
    } else if (requestedRole === 'buyer') {
      authorizedRole = 'buyer';
    } else if (
      currentUser?.id === sellerUser?.id ||
      currentUser?.name === targetJob.sellerName ||
      (currentUser?.phone && currentUser?.phone === targetJob.sellerPhone)
    ) {
      authorizedRole = 'seller';
    } else if (requestedRole === 'driver') {
      // Client requesting driver slip only if explicit
      authorizedRole = 'driver';
    } else {
      authorizedRole = 'buyer';
    }

    try {
      const storedLogs = getStoredAuditLogs();
      let auditLog = storedLogs.find(l => l.orderId === targetJob.id);
      if (!auditLog) {
        auditLog = await createPaymentAuditLog(txInput);
      }
      setReceiptModalData({ 
        transactionData: txInput, 
        auditLog,
        initialMode: authorizedRole,
        lockedMode: authorizedRole
      });
      return true;
    } catch (err) {
      console.error('Failed to open receipt:', err);
      addToast('Erreur', 'Impossible de générer le reçu pour cette transaction.', 'error');
      return false;
    }
  };

  const driverSetInspectionVerdict = (jobId: string, verdict: 'client_confirmed_good' | 'client_confirmed_bad'): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return false;

    const updatedJob: DeliveryJob = {
      ...job,
      inspectionStatus: verdict
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));

    if (verdict === 'client_confirmed_good') {
      addNotification({
        recipientRole: 'client',
        recipientUserId: job.buyerName,
        title: '✅ Colis Validé Conforme : Saisissez votre Code Secret',
        message: `Le contrôle physique est bon ! Communiquez votre code secret de remise (${job.deliveryOtpCode}) au livreur pour clôturer la commande et débloquer les fonds du vendeur.`,
        type: 'inspection',
        jobId: job.id,
        urgency: 'high'
      });

      addToast(
        '✅ Colis Déclaré Conforme',
        'Le client a validé l\'état du produit. Récupérez son Code Secret à 4 chiffres pour valider la livraison et encaisser vos frais de course.',
        'success'
      );
    } else {
      addNotification({
        recipientRole: 'client',
        recipientUserId: job.buyerName,
        title: '⚠️ Non-Conformité Signalée : Déclenchez le Retour',
        message: `Le colis a été déclaré non conforme. Le bouton "Refuser & Déclencher le Retour" est opérationnel dans votre espace. La valeur de l'article vous sera remboursée sur votre portefeuille.`,
        type: 'inspection',
        jobId: job.id,
        urgency: 'critical'
      });

      addToast(
        '⚠️ Non-Conformité Signalée par le Client',
        'Le client a refusé le colis. L\'option d\'annulation/retour est débloquée chez le client. Demandez-lui son Code Secret de Retour dès qu\'il valide.',
        'warning'
      );
    }
    return true;
  };

  const getSellerBlockedBalance = (sellerNameOrId?: string): number => {
    const target = sellerNameOrId || currentUser?.name || currentUser?.id || '';
    if (!target) return 0;
    return escrowRecords
      .filter(e => e.status === 'held' && (e.sellerName.toLowerCase().includes(target.toLowerCase()) || (currentUser?.name && e.sellerName.toLowerCase().includes(currentUser.name.toLowerCase()))))
      .reduce((sum, e) => sum + e.sellerAmount, 0);
  };

  const getBuyerBlockedBalance = (buyerNameOrId?: string): number => {
    const target = buyerNameOrId || currentUser?.name || currentUser?.id || '';
    if (!target) return 0;
    return escrowRecords
      .filter(e => e.status === 'held' && (e.buyerName.toLowerCase() === target.toLowerCase() || (currentUser?.name && e.buyerName.toLowerCase() === currentUser.name.toLowerCase())))
      .reduce((sum, e) => sum + e.amount, 0);
  };

  // ================= REFERRAL LIFECYCLE CONTROLLERS =================
  const handleKycApprovedReferral = (approvedUserId: string) => {
    const matchingRefs = referrals.filter(r => (r.refereeId === approvedUserId || (currentUser?.id === approvedUserId && r.refereeName === currentUser.name)) && r.status === 'PENDING_KYC');
    if (matchingRefs.length === 0) return;

    const nowIso = new Date().toISOString();

    // 1. Update referrals state to PENDING_TRANSACTION
    setReferrals(prev => prev.map(r => {
      if ((r.refereeId === approvedUserId || (currentUser?.id === approvedUserId && r.refereeName === currentUser.name)) && r.status === 'PENDING_KYC') {
        return {
          ...r,
          status: 'PENDING_TRANSACTION',
          refereeKycStatus: 'verified',
          kycValidatedAt: nowIso
        };
      }
      return r;
    }));

    // 2. Update referee & sponsor users
    setUsers(prev => prev.map(u => {
      if (u.id === approvedUserId) {
        return {
          ...u,
          kycStatus: 'verified',
          isKycVerified: true,
          pendingReferralBonus: (u.pendingReferralBonus || 0) + 1000
        };
      }
      const sponsored = matchingRefs.find(r => r.sponsorId === u.id || r.sponsorReferralCode === u.referralCode);
      if (sponsored) {
        const currentCount = u.referralCount || 0;
        if (currentCount < 10) {
          return {
            ...u,
            pendingReferralBonus: (u.pendingReferralBonus || 0) + 1000
          };
        }
      }
      return u;
    }));

    if (currentUser?.id === approvedUserId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        kycStatus: 'verified',
        isKycVerified: true,
        pendingReferralBonus: (prev.pendingReferralBonus || 0) + 1000
      } : null);
    }

    // 3. Notify sponsors
    matchingRefs.forEach(ref => {
      addNotification({
        recipientRole: 'all',
        recipientUserId: ref.sponsorId,
        title: '🛡️ Filleul KYC Certifié (+1 000 F En Attente)',
        message: `Votre filleul ${ref.refereeName} a certifié son identité ! 1 000 FCFA ont été ajoutés à votre solde en attente. Ce bonus sera débloqué dès sa 1ère transaction validée par Code Secret.`,
        type: 'referral',
        urgency: 'normal'
      });
    });

    addToast(
      '🎁 1 000 FCFA de Parrainage en Attente !',
      'Votre KYC est certifié ! Effectuez votre 1ère transaction sécurisée (achat ou vente) pour débloquer définitivement votre solde d\'achat.',
      'success'
    );
  };

  const handleDeliveryCompletedReferral = (buyerNameOrId: string, sellerNameOrId: string, jobId: string) => {
    const pendingRefs = referrals.filter(r => 
      r.status === 'PENDING_TRANSACTION' && 
      (r.refereeId === buyerNameOrId || 
       r.refereeName.toLowerCase() === buyerNameOrId.toLowerCase() || 
       r.refereeId === sellerNameOrId || 
       r.refereeName.toLowerCase() === sellerNameOrId.toLowerCase())
    );

    if (pendingRefs.length === 0) return;

    const nowIso = new Date().toISOString();

    pendingRefs.forEach(ref => {
      const isBuyer = (ref.refereeId === buyerNameOrId || ref.refereeName.toLowerCase() === buyerNameOrId.toLowerCase());
      
      // 1. Mark referral completed
      setReferrals(prev => prev.map(r => r.id === ref.id ? {
        ...r,
        status: 'COMPLETED',
        completedAt: nowIso,
        firstTxOrderId: jobId,
        firstTxType: isBuyer ? 'purchase' : 'sale'
      } : r));

      // 2. Update users
      setUsers(prev => prev.map(u => {
        // Referee updates: transfer 1000 from pending to referralBalance
        if (u.id === ref.refereeId || u.name.toLowerCase() === ref.refereeName.toLowerCase()) {
          return {
            ...u,
            isFirstTxDone: true,
            pendingReferralBonus: Math.max(0, (u.pendingReferralBonus || 0) - 1000),
            referralBalance: (u.referralBalance || 0) + 1000
          };
        }
        // Sponsor updates: increment count (max 10), transfer 1000 from pending to referralBalance
        if (u.id === ref.sponsorId || (u.referralCode && u.referralCode === ref.sponsorReferralCode)) {
          const currentCount = u.referralCount || 0;
          if (currentCount < 10) {
            return {
              ...u,
              referralCount: currentCount + 1,
              pendingReferralBonus: Math.max(0, (u.pendingReferralBonus || 0) - 1000),
              referralBalance: (u.referralBalance || 0) + 1000
            };
          }
        }
        return u;
      }));

      // Update currentUser if applicable
      if (currentUser) {
        if (currentUser.id === ref.refereeId || currentUser.name.toLowerCase() === ref.refereeName.toLowerCase()) {
          setCurrentUser(prev => prev ? {
            ...prev,
            isFirstTxDone: true,
            pendingReferralBonus: Math.max(0, (prev.pendingReferralBonus || 0) - 1000),
            referralBalance: (prev.referralBalance || 0) + 1000
          } : null);
        } else if (currentUser.id === ref.sponsorId || currentUser.referralCode === ref.sponsorReferralCode) {
          const currentCount = currentUser.referralCount || 0;
          if (currentCount < 10) {
            setCurrentUser(prev => prev ? {
              ...prev,
              referralCount: currentCount + 1,
              pendingReferralBonus: Math.max(0, (prev.pendingReferralBonus || 0) - 1000),
              referralBalance: (prev.referralBalance || 0) + 1000
            } : null);
          }
        }
      }

      // 3. Notifications & Celebration
      addNotification({
        recipientRole: 'all',
        recipientUserId: ref.sponsorId,
        title: '🎉 +1 000 FCFA Débloqués (Parrainage Validé) !',
        message: `Votre filleul ${ref.refereeName} a complété sa 1ère transaction livrée ! Votre bonus de 1 000 FCFA est maintenant disponible dans votre Solde Parrainage d'achat.`,
        type: 'referral',
        urgency: 'high'
      });

      addNotification({
        recipientRole: 'all',
        recipientUserId: ref.refereeId,
        title: '🎉 +1 000 FCFA Débloqués (Bienvenue Brad\'CI) !',
        message: `Félicitations pour votre 1ère transaction validée ! Votre bonus de bienvenue de 1 000 FCFA est maintenant disponible pour vos futurs achats.`,
        type: 'referral',
        urgency: 'high'
      });

      addToast(
        '🎉 Bonus Parrainage Débloqué (+1 000 FCFA) !',
        `Première transaction validée ! 1 000 FCFA ont été transférés sur votre Solde Parrainage d'achat.`,
        'success'
      );
    });
  };

  const applyReferralBalanceToPurchase = (amount: number) => {
    if (!currentUser) return { success: false, deducted: 0, remaining: amount };
    const currentBal = currentUser.referralBalance || 0;
    if (currentBal <= 0) return { success: false, deducted: 0, remaining: amount };

    const toDeduct = Math.min(currentBal, amount);
    const newBal = currentBal - toDeduct;
    const remainingToPay = amount - toDeduct;

    const updatedUser: User = {
      ...currentUser,
      referralBalance: newBal
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    addToast(
      '🛒 Solde Parrainage Appliqué !',
      `Une réduction de ${toDeduct.toLocaleString('fr-FR')} FCFA a été déduite de votre solde parrainage d'achat.`,
      'success'
    );

    return { success: true, deducted: toDeduct, remaining: remainingToPay };
  };

  const simulateNewRefereeRegistration = (sponsorCode?: string): ReferralRecord | null => {
    const code = (sponsorCode || currentUser?.referralCode || 'BRAD-89A2').toUpperCase();
    const sponsor = users.find(u => u.referralCode?.toUpperCase() === code) || currentUser;
    if (!sponsor) return null;

    const demoNames = ['Koffi Sylvain', 'Binate Aïcha', 'Gbagbo Junior', 'N\'Dri Estelle', 'Konan Patrick', 'Yao Mireille'];
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)] + ` (Filleul #${Math.floor(Math.random() * 900 + 100)})`;
    const refereeId = 'user-ref-sim-' + Date.now();
    const refereePhone = '+225 07 ' + Math.floor(10000000 + Math.random() * 90000000).toString().replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');

    const newRefereeUser: User = {
      id: refereeId,
      name: randomName,
      firstName: randomName.split(' ')[0],
      lastName: randomName.split(' ')[1] || 'Filleul',
      email: `filleul.${Date.now()}@bradci-demo.ci`,
      phone: refereePhone,
      city: 'Cocody',
      role: 'client',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
      walletBalance: 0,
      blockedBalance: 0,
      buyerBlockedBalance: 0,
      kycStatus: 'unverified',
      emailVerified: true,
      productsPublishedCount: 0,
      referralCode: 'BRAD-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      referredBy: sponsor.referralCode,
      referralCount: 0,
      pendingReferralBonus: 0,
      referralBalance: 0,
      isFirstTxDone: false
    };

    const newRefRecord: ReferralRecord = {
      id: 'ref-' + Date.now(),
      sponsorId: sponsor.id,
      sponsorName: sponsor.name,
      sponsorReferralCode: sponsor.referralCode,
      refereeId: refereeId,
      refereeName: randomName,
      refereePhone,
      refereeAvatar: newRefereeUser.avatar,
      refereeKycStatus: 'unverified',
      status: 'PENDING_KYC',
      sponsorBonusAmount: 1000,
      refereeBonusAmount: 1000,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [newRefereeUser, ...prev]);
    setReferrals(prev => [newRefRecord, ...prev]);

    addNotification({
      recipientRole: 'all',
      recipientUserId: sponsor.id,
      title: '🤝 Nouveau Filleul Inscrit !',
      message: `${randomName} a utilisé votre code de parrainage (${sponsor.referralCode}). Étape suivante : validation de son KYC.`,
      type: 'referral',
      urgency: 'normal'
    });

    addToast(
      '🧪 [Sandbox] Filleul Enregistré',
      `Filleul ${randomName} inscrit avec le code ${sponsor.referralCode}. Statut initial : PENDING_KYC.`,
      'info'
    );

    return newRefRecord;
  };

  const simulateRefereeKycApproved = (refereeId: string): boolean => {
    setUsers(prev => prev.map(u => u.id === refereeId ? { ...u, kycStatus: 'verified', isKycVerified: true } : u));
    handleKycApprovedReferral(refereeId);
    return true;
  };

  const simulateRefereeFirstTransaction = (refereeId: string): boolean => {
    const ref = referrals.find(r => (r.refereeId === refereeId || r.id === refereeId) && r.status === 'PENDING_TRANSACTION');
    if (!ref) {
      addToast('Simulation Impossible', 'Ce filleul n\'est pas dans l\'état PENDING_TRANSACTION.', 'warning');
      return false;
    }
    handleDeliveryCompletedReferral(ref.refereeId, 'Vendeur Demo BradCI', 'job-sim-' + Date.now());
    return true;
  };

  const openRegisterWithReferral = (code?: string) => {
    if (code) {
      const clean = code.trim().toUpperCase();
      setPendingReferralCode(clean);
      localStorage.setItem('bradci_pending_sponsor_code', clean);
      const sponsorUser = users.find(u => u.referralCode?.toUpperCase() === clean);
      const sponsorName = sponsorUser ? sponsorUser.name : `Code ${clean}`;
      addToast(
        '🎁 Code Parrainage Activé',
        `Parrain : ${sponsorName}. Inscrivez-vous pour sécuriser +1 000 FCFA sur vos achats.`,
        'info'
      );
    }
    setAuthModalOpen(true);
  };

  const driverConfirmDeliveryOTP = (jobId: string, enteredOtp: string): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return false;

    const validOtp = job.masterDeliveryOtp || job.deliveryOtpCode;
    if (!validOtp) {
      addToast('Code Secret Manquant', 'Le code de confirmation n\'a pas encore été émis.', 'warning');
      return false;
    }

    if (enteredOtp.trim() !== validOtp) {
      addToast('Code Secret Incorrect', 'Demandez le code secret à 4 chiffres à l\'acheteur après remise du colis.', 'error');
      return false;
    }

    // OTP Verified! Update Delivery Job
    const nowIso = new Date().toISOString();
    const updatedJob: DeliveryJob = {
      ...job,
      status: 'delivered',
      orderStatus: 'COMPLETED',
      paymentStatus: 'PAID',
      completedAt: nowIso,
      etaMinutes: 0
    };
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    
    // Update Cart Order if consolidated
    if (job.isCartConsolidated && job.cartOrderRecordId) {
      setCartOrders(prev => prev.map(ord => ord.id === job.cartOrderRecordId ? {
        ...ord,
        status: 'DELIVERED',
        trackingTimeline: [
          ...(ord.trackingTimeline || []),
          {
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            status: 'LIVRE',
            title: 'Livraison Effectuée',
            description: `Tous les colis du panier ont été livrés et validés par Code Secret auprès de ${ord.buyerName}.`
          }
        ]
      } : ord));
    }

    setProducts(prev => prev.map(p => p.id === job.productId ? {
      ...p,
      status: 'sold',
      orderStatus: 'COMPLETED',
      isPinnedSold: true,
      soldAt: nowIso,
      pinnedUntil: oneHourLater
    } : p));

    // Release Escrow
    const escrow = escrowRecords.find(e => e.productId === job.productId);
    const sellerPayout = escrow ? escrow.sellerAmount : Math.round((job.itemValue || 0) * 0.95);
    const deliveryFee = job.deliveryFee || 2500;

    setEscrowRecords(prev => prev.map(e => e.productId === job.productId ? {
      ...e,
      status: 'released',
      releasedAt: new Date().toISOString()
    } : e));

    // Update all users involved:
    // 1. Driver gets delivery fee
    // 2. Seller gets sale proceeds transferred from blocked balance to withdrawal balance
    // 3. Buyer's blocked balance is cleared
    setUsers(prev => prev.map(u => {
      let updated = { ...u };
      // If Driver
      if (u.id === job.assignedDriverId || (currentUser?.role === 'driver' && u.id === currentUser.id)) {
        let updatedRemaining = u.trialDeliveriesRemaining ?? 0;
        if (u.driverPlan === 'trial' && updatedRemaining > 0) {
          updatedRemaining -= 1;
        }
        updated.walletBalance = u.walletBalance + deliveryFee;
        updated.trialDeliveriesRemaining = updatedRemaining;
      }
      // If Seller
      if (u.name === job.sellerName || (job.sellerName && job.sellerName.includes(u.name)) || (currentUser?.role === 'client' && u.id === currentUser.id && currentUser.sellerPlan)) {
        updated.walletBalance = u.walletBalance + sellerPayout;
        if (updated.blockedBalance) {
          updated.blockedBalance = Math.max(0, updated.blockedBalance - sellerPayout);
        }
      }
      // If Buyer
      if (u.name === job.buyerName) {
        if (updated.buyerBlockedBalance) {
          updated.buyerBlockedBalance = Math.max(0, updated.buyerBlockedBalance - (escrow ? escrow.amount : (job.itemValue + deliveryFee)));
        }
      }
      return updated;
    }));

    // Update currentUser in state
    if (currentUser) {
      if (currentUser.role === 'driver' || currentUser.id === job.assignedDriverId) {
        let updatedRemaining = currentUser.trialDeliveriesRemaining ?? 0;
        if (currentUser.driverPlan === 'trial' && updatedRemaining > 0) {
          updatedRemaining -= 1;
        }
        setCurrentUser(prev => prev ? {
          ...prev,
          walletBalance: prev.walletBalance + deliveryFee,
          trialDeliveriesRemaining: updatedRemaining
        } : null);
      } else if (currentUser.name === job.sellerName || (job.sellerName && job.sellerName.includes(currentUser.name))) {
        setCurrentUser(prev => prev ? {
          ...prev,
          walletBalance: prev.walletBalance + sellerPayout,
          blockedBalance: Math.max(0, (prev.blockedBalance || 0) - sellerPayout)
        } : null);
      } else if (currentUser.name === job.buyerName) {
        setCurrentUser(prev => prev ? {
          ...prev,
          buyerBlockedBalance: Math.max(0, (prev.buyerBlockedBalance || 0) - (escrow ? escrow.amount : (job.itemValue + deliveryFee)))
        } : null);
      }
    }

    // Record Financial Transaction
    const newTrans: FinancialTransaction = {
      id: 'ft-' + Date.now(),
      type: 'delivery_fee',
      description: `Course livrée & validée : "${job.productTitle}" (${job.pickupCommune} → ${job.dropoffCommune})`,
      category: 'delivery',
      grossAmount: deliveryFee,
      netRevenueBradCi: 0,
      userName: job.assignedDriverName || 'Bakary Traoré',
      userRole: 'driver',
      paymentMethod: escrow?.paymentMethod || 'Wave',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      hour: new Date().getHours(),
      status: 'completed'
    };
    setFinancialTransactions(prev => [newTrans, ...prev]);

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 }
    });

    // Vocal voice announcement
    voiceNavigator.announceFundsAvailable(sellerPayout, language);
    voiceNavigator.playSuccessChime();

    // Trigger Referral bonus release if applicable
    handleDeliveryCompletedReferral(job.buyerName, job.sellerName, job.id);

    // If buyer was suspended from COD, increment their successful prepaid order count (unlocks COD after 5 orders)
    setUsers(prev => prev.map(u => {
      if (u.name === job.buyerName && u.isCodSuspended) {
        const nextCount = (u.prepaidOrdersCompletedCount || 0) + 1;
        const isRestored = nextCount >= (u.requiredPrepaidOrdersToUnlockCod || 5);
        return {
          ...u,
          prepaidOrdersCompletedCount: nextCount,
          isCodSuspended: !isRestored,
          codSuspensionReason: isRestored ? undefined : u.codSuspensionReason
        };
      }
      return u;
    }));

    if (currentUser?.name === job.buyerName && currentUser.isCodSuspended) {
      const nextCount = (currentUser.prepaidOrdersCompletedCount || 0) + 1;
      const isRestored = nextCount >= (currentUser.requiredPrepaidOrdersToUnlockCod || 5);
      setCurrentUser(prev => prev ? {
        ...prev,
        prepaidOrdersCompletedCount: nextCount,
        isCodSuspended: !isRestored,
        codSuspensionReason: isRestored ? undefined : prev.codSuspensionReason
      } : null);

      if (isRestored) {
        addNotification({
          recipientRole: 'client',
          recipientUserId: currentUser.id,
          title: '🎉 Mode Paiement à la Livraison Réactivé !',
          message: `Félicitations ! Vous avez complété avec succès vos 5 commandes avec pré-paiement. L'option "Paiement à la Livraison" est de nouveau disponible sur votre compte.`,
          type: 'payment',
          urgency: 'high'
        });
        addToast(
          '🎉 Paiement à la Livraison Réactivé !',
          'Vous avez validé vos 5 commandes prépayées avec succès. Le paiement à la livraison est débloqué !',
          'success'
        );
      }
    }

    addToast(
      '🎉 Livraison Validée & Virement Effectué !', 
      `Code Secret vérifié avec succès ! Virement de ${deliveryFee.toLocaleString('fr-FR')} FCFA crédité au livreur. Solde bloqué vendeur de ${sellerPayout.toLocaleString('fr-FR')} FCFA transféré vers son solde de retrait disponible.`,
      'success'
    );

    return true;
  };

  const buyerConfirmDeliveryOTP = (jobId: string, enteredOtp: string): boolean => {
    return driverConfirmDeliveryOTP(jobId, enteredOtp);
  };

  const buyerCancelAndReturnPackage = (jobId: string, reason: string): { success: boolean; returnOtpCode: string; message: string } => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return { success: false, returnOtpCode: '', message: 'Course introuvable' };

    const escrow = escrowRecords.find(e => e.productId === job.productId);
    const returnOtp = job.returnOtpCode || String(Math.floor(1000 + Math.random() * 9000));
    const deliveryFee = job.deliveryFee || 2500;
    const itemValue = job.itemValue || (escrow ? escrow.amount - escrow.deliveryFee : 0);

    // Update Job to 'returning'
    const updatedJob: DeliveryJob = {
      ...job,
      status: 'returning',
      returnReason: reason || 'Colis non-conforme lors de la remise physique',
      returnOtpCode: returnOtp,
      isReturnConfirmedBySeller: false,
      etaMinutes: Math.max(10, Math.round((job.distanceKm || 8) * 1.5))
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    setProducts(prev => prev.map(p => p.id === job.productId ? { ...p, status: 'returning', returnOtpCode: returnOtp } : p));

    // Check if the order was PREPAID (Escrow) vs CASH ON DELIVERY (COD)
    const isPrepaidOrder = !!escrow || job.paymentStatus === 'PAID';
    const totalPrepaidPaid = escrow ? escrow.amount : (itemValue + deliveryFee);

    // Escrow handling:
    // 1. If PREPAID (Séquestre) : Buyer is refunded 100% (item + delivery fee) back to wallet, and system/seller pays driver
    // 2. If PAY ON DELIVERY (COD) : No money was transferred yet, buyer pays 0, nobody loses funds, parcel returns to seller
    if (isPrepaidOrder) {
      setEscrowRecords(prev => prev.map(e => e.productId === job.productId ? {
        ...e,
        status: 'returned_delivery_paid',
        releasedAt: new Date().toISOString()
      } : e));
    }

    // Update Users balances:
    setUsers(prev => prev.map(u => {
      let updated = { ...u };
      // Driver receives delivery fee for the transport done
      if (u.id === job.assignedDriverId || u.name === job.assignedDriverName) {
        updated.walletBalance = u.walletBalance + deliveryFee;
      }
      // Buyer gets refunded: if prepaid, receives back full paid amount (item + fees)
      if (u.name === job.buyerName || (currentUser && u.id === currentUser.id && currentUser.role === 'client')) {
        if (isPrepaidOrder) {
          updated.walletBalance = u.walletBalance + totalPrepaidPaid;
        }
        if (updated.buyerBlockedBalance) {
          updated.buyerBlockedBalance = Math.max(0, updated.buyerBlockedBalance - totalPrepaidPaid);
        }
      }
      // Seller's blocked balance is cleared
      if (u.name === job.sellerName || (job.sellerName && job.sellerName.includes(u.name))) {
        if (updated.blockedBalance) {
          updated.blockedBalance = Math.max(0, updated.blockedBalance - (escrow ? escrow.sellerAmount : itemValue * 0.95));
        }
      }
      return updated;
    }));

    // Update currentUser if applicable
    if (currentUser) {
      if (currentUser.name === job.buyerName || currentUser.role === 'client') {
        setCurrentUser(prev => prev ? {
          ...prev,
          walletBalance: isPrepaidOrder ? prev.walletBalance + totalPrepaidPaid : prev.walletBalance,
          buyerBlockedBalance: Math.max(0, (prev.buyerBlockedBalance || 0) - totalPrepaidPaid)
        } : null);
      } else if (currentUser.id === job.assignedDriverId) {
        setCurrentUser(prev => prev ? {
          ...prev,
          walletBalance: prev.walletBalance + deliveryFee
        } : null);
      }
    }

    // Create financial transaction
    const cancelTx: FinancialTransaction = {
      id: 'ft-' + Date.now(),
      type: 'order_refund',
      description: isPrepaidOrder 
        ? `Remboursement intégral commande prépayée (${totalPrepaidPaid.toLocaleString('fr-FR')} F) pour colis non-conforme "${job.productTitle}". Frais coursier pris en charge.`
        : `Annulation & Retour colis Pay on Delivery "${job.productTitle}" vers ${job.sellerName}. Aucun prélèvement client.`,
      category: 'refund',
      grossAmount: isPrepaidOrder ? totalPrepaidPaid : 0,
      netRevenueBradCi: 0,
      userName: job.buyerName,
      userRole: 'client',
      paymentMethod: escrow?.paymentMethod || 'Wave',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      hour: new Date().getHours(),
      status: 'completed'
    };
    setFinancialTransactions(prev => [cancelTx, ...prev]);

    addToast(
      isPrepaidOrder ? '💰 Remboursement Intégral Prépayé Effectué' : '↩ Colis Refusé & Retour Déclenché',
      isPrepaidOrder 
        ? `Le montant total prépayé (${totalPrepaidPaid.toLocaleString('fr-FR')} FCFA) vous a été intégralement remboursé sur votre portefeuille. Code Secret de Retour : ${returnOtp}.`
        : `Commande à la livraison annulée : aucun frais prélevé sur votre compte. Le colis est retourné au vendeur. Code Secret de Retour : ${returnOtp}.`,
      'info'
    );

    // Buyer COD suspension check: if buyer intentionally cancels without good reason, suspend COD
    setUsers(prev => prev.map(u => {
      if (u.name === job.buyerName) {
        return {
          ...u,
          isCodSuspended: true,
          codSuspensionReason: `Annulation du colis à la livraison (${reason})`,
          codSuspendedAt: new Date().toISOString(),
          prepaidOrdersCompletedCount: 0,
          requiredPrepaidOrdersToUnlockCod: 5
        };
      }
      return u;
    }));

    if (currentUser?.name === job.buyerName) {
      setCurrentUser(prev => prev ? {
        ...prev,
        isCodSuspended: true,
        codSuspensionReason: `Annulation du colis à la livraison (${reason})`,
        codSuspendedAt: new Date().toISOString(),
        prepaidOrdersCompletedCount: 0,
        requiredPrepaidOrdersToUnlockCod: 5
      } : null);
    }

    addNotification({
      recipientRole: 'client',
      recipientUserId: job.buyerName,
      title: '⚠️ Mode Paiement à la Livraison Suspendu',
      message: `Votre commande pour "${job.productTitle}" a été annulée à la livraison. Par mesure de sécurité et pour protéger les livreurs et vendeurs, l'option "Paiement à la Livraison" est suspendue sur votre compte. Vous devez réaliser 5 commandes payées directement avant livraison pour réactiver cette option.`,
      type: 'payment',
      urgency: 'critical'
    });

    return {
      success: true,
      returnOtpCode: returnOtp,
      message: `Retour enclenché avec succès. Code Secret de Retour : ${returnOtp}`
    };
  };

  // Démarrage du minuteur d'attente client absent (20 minutes)
  const driverStartAbsentTimer = (jobId: string): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return false;

    const nowIso = new Date().toISOString();
    const updatedJob: DeliveryJob = {
      ...job,
      buyerAbsentWaitStartedAt: nowIso,
      buyerAbsentElapsedSeconds: 0
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));

    // Alert the buyer urgently
    addNotification({
      recipientRole: 'client',
      recipientUserId: job.buyerName,
      title: '🚨 LIVREUR SUR PLACE EN ATTENTE (Chrono 20 min)',
      message: `Le coursier est arrivé à votre adresse à ${job.dropoffCommune}. Vous disposez de 20 minutes pour vous présenter. Passé ce délai, la commande sera annulée, le colis retourné au vendeur et votre mode de paiement à la livraison suspendu.`,
      type: 'delivery',
      jobId: job.id,
      urgency: 'critical'
    });

    addToast(
      '⏱️ Chrono d\'Attente 20 min Activé',
      `Le décompte d'absence de l'acheteur a démarré. Une alerte urgente a été envoyée à ${job.buyerName}. Si l'acheteur ne se présente pas, vous pourrez annuler la course et percevoir vos 15% de bonus d'astreinte.`,
      'warning'
    );
    return true;
  };

  // Annulation par le livreur si l'acheteur est absent après 20 min d'attente
  const driverCancelDueToAbsentBuyer = (jobId: string): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return false;

    const itemValue = job.itemValue || 0;
    const deliveryFee = job.deliveryFee || 2500;
    // 15% compensation bonus on item value
    const bonus15Percent = Math.round(itemValue * 0.15);
    const totalDriverPayout = deliveryFee + bonus15Percent;
    const returnOtp = 'RET-' + Math.floor(1000 + Math.random() * 9000);

    const updatedJob: DeliveryJob = {
      ...job,
      status: 'returning',
      orderStatus: 'CANCELLED',
      cancellationType: 'buyer_absent_timeout',
      returnReason: 'Acheteur absent après plus de 20 minutes d\'attente sur place',
      returnOtpCode: returnOtp,
      driverCompensationBonusFCFA: bonus15Percent,
      returnTripDirectionCommune: job.pickupCommune, // Track direction towards seller
      etaMinutes: Math.max(10, Math.round((job.distanceKm || 8) * 1.5))
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    setProducts(prev => prev.map(p => p.id === job.productId ? { ...p, status: 'returning' } : p));

    // 1. Credit driver: regular delivery fee + 15% compensation bonus
    // 2. Suspend Buyer's Cash on Delivery (COD) mode until 5 prepaid orders are done
    setUsers(prev => prev.map(u => {
      let updated = { ...u };
      // Driver gets delivery fee + 15% bonus
      if (u.id === job.assignedDriverId || (currentUser?.role === 'driver' && u.id === currentUser.id)) {
        updated.walletBalance = (u.walletBalance || 0) + totalDriverPayout;
      }
      // Buyer gets COD suspended
      if (u.name === job.buyerName) {
        updated.isCodSuspended = true;
        updated.codSuspensionReason = "Absence injustifiée lors de la livraison (> 20 min d'attente livreur)";
        updated.codSuspendedAt = new Date().toISOString();
        updated.prepaidOrdersCompletedCount = 0;
        updated.requiredPrepaidOrdersToUnlockCod = 5;
      }
      return updated;
    }));

    if (currentUser) {
      if (currentUser.role === 'driver' || currentUser.id === job.assignedDriverId) {
        setCurrentUser(prev => prev ? {
          ...prev,
          walletBalance: (prev.walletBalance || 0) + totalDriverPayout
        } : null);
      } else if (currentUser.name === job.buyerName) {
        setCurrentUser(prev => prev ? {
          ...prev,
          isCodSuspended: true,
          codSuspensionReason: "Absence injustifiée lors de la livraison (> 20 min d'attente livreur)",
          codSuspendedAt: new Date().toISOString(),
          prepaidOrdersCompletedCount: 0,
          requiredPrepaidOrdersToUnlockCod: 5
        } : null);
      }
    }

    // Record Financial Transaction for Driver Compensation Bonus
    const bonusTx: FinancialTransaction = {
      id: 'ft-bonus-absent-' + Date.now(),
      type: 'delivery_fee',
      description: `Dédommagement absence client (+15% de l'article : ${bonus15Percent.toLocaleString('fr-FR')} F + Frais : ${deliveryFee.toLocaleString('fr-FR')} F) pour "${job.productTitle}"`,
      category: 'delivery',
      grossAmount: totalDriverPayout,
      netRevenueBradCi: 0,
      userName: job.assignedDriverName || 'Livreur BradCI',
      userRole: 'driver',
      paymentMethod: 'Wave',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      hour: new Date().getHours(),
      status: 'completed'
    };
    setFinancialTransactions(prev => [bonusTx, ...prev]);

    // Send warning notification to Buyer
    addNotification({
      recipientRole: 'client',
      recipientUserId: job.buyerName,
      title: '🚫 Commande Annulée (Client Absent) & Suspension Paiement à la Livraison',
      message: `Vous étiez absent lors de la livraison de "${job.productTitle}" après 20 minutes d'attente du coursier. Le colis est retourné au vendeur (${job.sellerName}). Votre compte est désormais suspendu du mode "Paiement à la Livraison". Vos 5 prochaines commandes devront obligatoirement être payées d'avance pour restaurer cette option.`,
      type: 'payment',
      urgency: 'critical'
    });

    // Send notification to Seller
    addNotification({
      recipientRole: 'client',
      recipientUserId: job.sellerName,
      title: '📦 Colis en Cours de Retour (Acheteur Absent)',
      message: `L'acheteur ${job.buyerName} était absent à la livraison après 20 minutes d'attente. Le coursier ${job.assignedDriverName || 'Bakary'} vous rapporte votre colis à ${job.pickupCommune}. L'acheteur a été sanctionné.`,
      type: 'delivery',
      productId: job.productId,
      urgency: 'high'
    });

    // Vocal voice notification
    voiceNavigator.playWarningBeep();

    addToast(
      '📦 Course Annulée & Bonus 15% Encaissé !',
      `Client absent après 20 min. Vous avez reçu vos frais de course (${deliveryFee.toLocaleString('fr-FR')} F) + un bonus de 15% (${bonus15Percent.toLocaleString('fr-FR')} F), soit ${totalDriverPayout.toLocaleString('fr-FR')} FCFA. Ramenez le colis à ${job.pickupCommune}. Le radar recherche les colis sur votre trajet retour !`,
      'success'
    );

    return true;
  };

  const driverConfirmReturnOTP = (jobId: string, enteredOtp: string): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return false;

    const expectedOtp = job.returnOtpCode || '9012';
    if (enteredOtp.trim() !== expectedOtp) {
      addToast('Code Secret de Retour Incorrect', 'Demandez le code secret de retour généré par l\'acheteur sur son application.', 'error');
      return false;
    }

    // Driver on way back to seller
    const updatedJob: DeliveryJob = {
      ...job,
      status: 'returning',
      etaMinutes: Math.max(5, Math.round((job.distanceKm || 8) * 1.5))
    };
    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    setProducts(prev => prev.map(p => p.id === job.productId ? { ...p, status: 'returning' } : p));

    addToast(
      'Prise en charge du Retour Validée',
      `Code secret de retour accepté. Veuillez acheminer le colis à la boutique / adresse du vendeur (${job.sellerName} à ${job.pickupCommune}).`,
      'info'
    );
    return true;
  };

  const sellerConfirmReturnReceived = (jobId: string): boolean => {
    const job = freightJobs.find(j => j.id === jobId);
    if (!job) return false;

    const updatedJob: DeliveryJob = {
      ...job,
      status: 'returned',
      isReturnConfirmedBySeller: true,
      returnedAt: new Date().toISOString()
    };

    setFreightJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    setProducts(prev => prev.map(p => p.id === job.productId ? { ...p, status: 'returned' } : p));

    addToast(
      '✅ Colis Retour Approuvé & Reçu !',
      `Vous avez confirmé la réception du colis retourné. L'article est réintégré à votre inventaire et la course est clôturée.`,
      'success'
    );

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    return true;
  };

  // ================= 30s DRIVER DISPATCH ENGINE =================
  useEffect(() => {
    if (!pendingOrderOffer) return;

    const timer = setInterval(() => {
      setOrderOfferCountdown(prev => {
        if (prev <= 1) {
          // Expired -> auto-decline and pass to next driver in commune
          clearInterval(timer);
          driverDeclineIncomingOffer();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingOrderOffer]);

  const triggerOrderDispatchToDriver = (job: DeliveryJob) => {
    setPendingOrderOffer(job);
    setOrderOfferCountdown(30);
    playOrderAlertSound();
    announceDriverIncomingOrder(job.pickupCommune, job.dropoffCommune, job.deliveryFee);
  };

  const driverAcceptIncomingOffer = () => {
    if (!pendingOrderOffer) return;
    const jobId = pendingOrderOffer.id;
    setPendingOrderOffer(null);
    driverAcceptJob(jobId);
    playSuccessChime();
  };

  const driverDeclineIncomingOffer = () => {
    if (!pendingOrderOffer) return;
    const declinedJob = pendingOrderOffer;
    setPendingOrderOffer(null);
    addToast(
      'Course refusée ou expirée',
      `La course #${declinedJob.id.substring(0, 6)} vers ${declinedJob.dropoffCommune} a été réassignée au réseau de livreurs disponibles.`,
      'info'
    );
  };

  // ================= AUTHENTICATION FLOWS =================
  const registerUser = (data: {
    firstName: string;
    lastName: string;
    city: string;
    email: string;
    phone: string;
    role: UserRole;
    password?: string;
    referralCode?: string;
  }) => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
    const generatedReferralCode = 'BRAD-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Check referral code
    const cleanRefCode = data.referralCode?.trim().toUpperCase();
    let sponsor = cleanRefCode ? users.find(u => u.referralCode?.toUpperCase() === cleanRefCode) : null;
    
    const newUser: User = {
      id: 'user-' + Date.now(),
      name: fullName,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      city: data.city,
      email: data.email.trim().toLowerCase(),
      phone: data.phone.startsWith('+225') ? data.phone : `+225 ${data.phone}`,
      role: data.role,
      avatar: `https://images.unsplash.com/photo-${data.role === 'driver' ? '1507003211169-0a1dd7228f2d' : '1534528741775-53994a69daeb'}?w=150`,
      walletBalance: 0,
      blockedBalance: 0,
      buyerBlockedBalance: 0,
      kycStatus: 'unverified',
      emailVerified: false,
      emailVerificationOtp: otpCode,
      otpExpiresAt: expiresAt,
      productsPublishedCount: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
      sellerPlan: 'basic',
      driverPlan: data.role === 'driver' ? 'trial' : undefined,
      trialDeliveriesRemaining: data.role === 'driver' ? 5 : undefined,
      driverAvailability: data.role === 'driver' ? 'available' : undefined,
      vehicleDetails: data.role === 'driver' ? { model: 'Moto Express', plate: 'CI-225-AB', type: 'moto' } : undefined,
      referralCode: generatedReferralCode,
      referredBy: sponsor ? sponsor.referralCode : undefined,
      referralCount: 0,
      pendingReferralBonus: 0,
      referralBalance: 0,
      isFirstTxDone: false
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);

    // If registered via a sponsor code, create ReferralRecord in PENDING_KYC
    if (sponsor) {
      const newReferralRecord: ReferralRecord = {
        id: 'ref-' + Date.now(),
        sponsorId: sponsor.id,
        sponsorName: sponsor.name,
        sponsorReferralCode: sponsor.referralCode,
        refereeId: newUser.id,
        refereeName: newUser.name,
        refereePhone: newUser.phone,
        refereeAvatar: newUser.avatar,
        refereeKycStatus: 'unverified',
        status: 'PENDING_KYC',
        sponsorBonusAmount: 1000,
        refereeBonusAmount: 1000,
        createdAt: new Date().toISOString()
      };

      setReferrals(prev => [newReferralRecord, ...prev]);

      addNotification({
        recipientRole: 'all',
        recipientUserId: sponsor.id,
        title: '🤝 Nouveau Filleul Inscrit !',
        message: `${newUser.name} s'est inscrit avec votre code de parrainage (${sponsor.referralCode}). Dès qu'il certifie son KYC, votre bonus de 1 000 FCFA passera en attente !`,
        type: 'referral',
        urgency: 'normal'
      });

      addToast(
        '🎁 Code Parrainage Appliqué !',
        `Parrainé par ${sponsor.name} (${sponsor.referralCode}). Validez votre KYC pour activer vos 1 000 FCFA de bienvenue !`,
        'success'
      );
    }

    // Clean pending referral state
    setPendingReferralCode(null);
    localStorage.removeItem('bradci_pending_sponsor_code');

    return { success: true, otpCode, expiresAt };
  };

  const verifyEmailOtp = (email: string, enteredOtp: string): { success: boolean; error?: string } => {
    const cleanEntered = enteredOtp.trim();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email?.toLowerCase() === cleanEmail) || (currentUser?.email?.toLowerCase() === cleanEmail ? currentUser : null);
    
    if (!user) {
      const errMsg = 'Aucun compte associé à cette adresse e-mail.';
      addToast('Compte introuvable', errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Vérification de l'expiration du code OTP (5 minutes)
    if (user.otpExpiresAt && Date.now() > user.otpExpiresAt) {
      const errMsg = 'Code secret expiré. Les codes de sécurité expirent après 5 minutes. Veuillez demander un nouveau code.';
      addToast('Code Expiré (5 min)', errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Vérification de la correspondance du code
    if (user.emailVerificationOtp && user.emailVerificationOtp !== cleanEntered) {
      const errMsg = 'Code de sécurité incorrect. Veuillez renseigner le code à 6 chiffres reçu par e-mail.';
      addToast('Code Secret Incorrect', errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Stockage du jeton de session dans localStorage
    const sessionToken = 'bradci_sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('bradci_auth_token', sessionToken);
    localStorage.setItem('bradci_current_user_id', user.id);

    const updated: User = {
      ...user,
      emailVerified: true,
      emailVerificationOtp: undefined,
      otpExpiresAt: undefined
    };

    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));

    // Redirection vers l'accueil (Explore ou Driver Dashboard)
    setActiveTab(updated.role === 'driver' ? 'dashboard_driver' : 'explore');

    addToast('📧 Email Validé avec Succès !', 'Session sécurisée activée sur BRAD\'CI.', 'success');
    return { success: true };
  };

  const requestEmailLoginOtp = async (email: string): Promise<{ success: boolean; otpCode?: string; expiresAt?: number; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (!user) {
      const errMsg = "Aucun compte trouvé avec cette adresse e-mail. Veuillez d'abord vous inscrire.";
      addToast('Compte introuvable', errMsg, 'error');
      return { success: false, error: errMsg };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const updatedUser: User = {
      ...user,
      emailVerificationOtp: otpCode,
      otpExpiresAt: expiresAt
    };
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

    const emailResult = await sendOtpEmail(cleanEmail, otpCode);
    if (!emailResult.success) {
      const errMsg = emailResult.error || "Impossible d'envoyer l'e-mail via Resend.";
      addToast("Erreur d'envoi", errMsg, 'error');
      return { success: false, error: errMsg };
    }

    return { success: true, otpCode, expiresAt };
  };

  const resendEmailOtp = async (email: string): Promise<{ success: boolean; otpCode?: string; expiresAt?: number; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email?.toLowerCase() === cleanEmail) || (currentUser?.email?.toLowerCase() === cleanEmail ? currentUser : null);
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    if (user) {
      const updatedUser: User = {
        ...user,
        emailVerificationOtp: otpCode,
        otpExpiresAt: expiresAt
      };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      if (currentUser?.id === user.id) {
        setCurrentUser(updatedUser);
      }
    }

    const emailResult = await sendOtpEmail(cleanEmail, otpCode);
    if (!emailResult.success) {
      const errMsg = emailResult.error || "Impossible de renvoyer l'e-mail de sécurité.";
      addToast("Erreur d'envoi", errMsg, 'error');
      return { success: false, error: errMsg };
    }

    addToast(
      'Nouveau Code Envoyé',
      `Un nouveau code de sécurité a été transmis à ${cleanEmail} (valide 5 min).`,
      'info'
    );

    return { success: true, otpCode, expiresAt };
  };

  const loginWithEmail = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find(u => u.email?.toLowerCase() === cleanEmail || u.name.toLowerCase().includes(cleanEmail));
    
    if (found) {
      setCurrentUser(found);
      addToast('Connexion Réussie', `Bienvenue de retour, ${found.name} !`, 'success');
      return { success: true };
    }

    if (currentUser) {
      addToast('Connexion Réussie', `Connecté en tant que ${currentUser.name}`, 'success');
      return { success: true };
    }

    return { success: false };
  };

  const loginWithGoogle = (role: UserRole = 'client') => {
    const googleEmail = 'utilisateur.google@gmail.com';
    const existing = users.find(u => u.email === googleEmail);
    
    if (existing) {
      setCurrentUser(existing);
      addToast('Connexion Google Réussie', `Bienvenue ${existing.name}`, 'success');
      return { success: true, needsProfileCompletion: false, user: existing };
    }

    const tempUser: User = {
      id: 'user-g-' + Date.now(),
      name: 'Google User',
      firstName: 'Utilisateur',
      lastName: 'Google',
      email: googleEmail,
      phone: '+225 07 00 00 00 00',
      city: 'Cocody',
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      walletBalance: 0,
      blockedBalance: 0,
      buyerBlockedBalance: 0,
      kycStatus: 'unverified',
      emailVerified: true,
      productsPublishedCount: 0,
      sellerPlan: 'basic',
      driverPlan: role === 'driver' ? 'trial' : undefined,
      trialDeliveriesRemaining: role === 'driver' ? 5 : undefined,
      driverAvailability: role === 'driver' ? 'available' : undefined,
      createdAt: new Date().toISOString()
    };

    return { success: true, needsProfileCompletion: true, user: tempUser };
  };

  const completeGoogleProfile = (data: {
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    role: UserRole;
    referralCode?: string;
  }) => {
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
    const cleanRefCode = (data.referralCode || pendingReferralCode)?.trim().toUpperCase();
    const sponsor = cleanRefCode ? users.find(u => u.referralCode?.toUpperCase() === cleanRefCode) : null;
    const generatedReferralCode = 'BRAD-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const newUser: User = {
      id: 'user-g-' + Date.now(),
      name: fullName,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: 'utilisateur.google@gmail.com',
      phone: data.phone.startsWith('+225') ? data.phone : `+225 ${data.phone}`,
      city: data.city,
      role: data.role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      walletBalance: 0,
      blockedBalance: 0,
      buyerBlockedBalance: 0,
      kycStatus: 'unverified',
      emailVerified: true,
      productsPublishedCount: 0,
      sellerPlan: 'basic',
      driverPlan: data.role === 'driver' ? 'trial' : undefined,
      trialDeliveriesRemaining: data.role === 'driver' ? 5 : undefined,
      driverAvailability: data.role === 'driver' ? 'available' : undefined,
      referralCode: generatedReferralCode,
      referredBy: sponsor ? sponsor.referralCode : undefined,
      referralCount: 0,
      pendingReferralBonus: 0,
      referralBalance: 0,
      isFirstTxDone: false,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);

    if (sponsor) {
      const newReferralRecord: ReferralRecord = {
        id: 'ref-' + Date.now(),
        sponsorId: sponsor.id,
        sponsorName: sponsor.name,
        sponsorReferralCode: sponsor.referralCode,
        refereeId: newUser.id,
        refereeName: newUser.name,
        refereePhone: newUser.phone,
        refereeAvatar: newUser.avatar,
        refereeKycStatus: 'unverified',
        status: 'PENDING_KYC',
        sponsorBonusAmount: 1000,
        refereeBonusAmount: 1000,
        createdAt: new Date().toISOString()
      };
      setReferrals(prev => [newReferralRecord, ...prev]);

      addNotification({
        recipientRole: 'all',
        recipientUserId: sponsor.id,
        title: '🤝 Nouveau Filleul Google Inscrit !',
        message: `${newUser.name} s'est inscrit avec votre code de parrainage (${sponsor.referralCode}). Validez vos transactions pour débloquer les 1 000 FCFA !`,
        type: 'referral',
        urgency: 'normal'
      });

      addToast(
        '🎁 Code Parrainage Appliqué !',
        `Parrainé par ${sponsor.name} (${sponsor.referralCode}). Validez votre KYC pour activer vos 1 000 FCFA de bienvenue !`,
        'success'
      );
    }

    setPendingReferralCode(null);
    localStorage.removeItem('bradci_pending_sponsor_code');

    setKycModalOpen(true);
    addToast('Profil Complété', 'Compte configuré ! Soumettez vos documents KYC pour finaliser.', 'success');
  };

  // ================= RATING & REVIEW ENGINE =================
  const submitReview = (data: {
    jobId: string;
    productId: string;
    productTitle: string;
    sellerRating: number;
    sellerComment: string;
    sellerQuickTags: string[];
    driverRating: number;
    driverComment: string;
    driverQuickTags: string[];
  }) => {
    const job = freightJobs.find(j => j.id === data.jobId);
    const newReview: ReviewRecord = {
      id: 'rev-' + Date.now(),
      jobId: data.jobId,
      productId: data.productId,
      productTitle: data.productTitle,
      buyerId: currentUser?.id || 'buyer-1',
      buyerName: currentUser?.name || 'Acheteur',
      sellerId: job?.sellerName || 'Vendeur',
      sellerName: job?.sellerName || 'Vendeur',
      sellerRating: data.sellerRating,
      sellerComment: data.sellerComment,
      sellerQuickTags: data.sellerQuickTags,
      driverId: job?.assignedDriverId || 'driver-1',
      driverName: job?.assignedDriverName || 'Livreur',
      driverRating: data.driverRating,
      driverComment: data.driverComment,
      driverQuickTags: data.driverQuickTags,
      createdAt: new Date().toISOString()
    };

    setReviews(prev => [newReview, ...prev]);

    // Synthetic reports sent automatically to both notification channels
    addNotification({
      userId: job?.sellerName || 'all',
      type: 'review',
      title: `⭐ Nouvelle Évaluation Vendeur (${data.sellerRating}/5)`,
      message: `Rapport d'évaluation reçu pour "${data.productTitle}" : Note ${data.sellerRating}/5. Tags : [${data.sellerQuickTags.join(', ')}]. ${data.sellerComment ? `"${data.sellerComment}"` : ''}`,
      linkTo: 'profile'
    });

    addNotification({
      userId: job?.assignedDriverId || 'all',
      type: 'review',
      title: `🛵 Nouvelle Évaluation Livreur (${data.driverRating}/5)`,
      message: `Rapport de course reçu pour la livraison "${data.productTitle}" : Note ${data.driverRating}/5. Tags : [${data.driverQuickTags.join(', ')}]. ${data.driverComment ? `"${data.driverComment}"` : ''}`,
      linkTo: 'dashboard_driver'
    });

    playSuccessChime();
    addToast(
      '🎉 Évaluation Transmise !',
      'Vos avis ont été pris en compte et les rapports synthétiques ont été générés.',
      'success'
    );
  };

  // ================= KYC & ANTI-FRAUD ENGINE =================
  const submitKYC = (
    dataOrDocType: {
      docType: 'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire';
      docNumber: string;
      photoUrl: string;
      selfieUrl: string;
      driverLicenseUrl?: string;
      driverLicenseSelfieUrl?: string;
      vehicleRegistrationUrl?: string;
      vehiclePlate?: string;
      vehicleColor?: string;
      vehicleModel?: string;
      vehicleType?: VehicleType;
    } | 'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire',
    docNumParam?: string,
    photoUrlParam?: string,
    selfieUrlParam?: string
  ) => {
    if (!currentUser) {
      return { success: false, isDuplicate: false, message: 'Utilisateur non connecté' };
    }

    let docType: 'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire' = 'cni';
    let docNumber = '';
    let photoUrl = '';
    let selfieUrl = '';
    let driverLicenseUrl: string | undefined;
    let driverLicenseSelfieUrl: string | undefined;
    let vehicleRegistrationUrl: string | undefined;
    let vehiclePlate: string | undefined;
    let vehicleColor: string | undefined;
    let vehicleModel: string | undefined;
    let vehicleType: VehicleType | undefined;

    if (typeof dataOrDocType === 'object' && dataOrDocType !== null) {
      docType = dataOrDocType.docType || 'cni';
      docNumber = dataOrDocType.docNumber || '';
      photoUrl = dataOrDocType.photoUrl || '';
      selfieUrl = dataOrDocType.selfieUrl || '';
      driverLicenseUrl = dataOrDocType.driverLicenseUrl;
      driverLicenseSelfieUrl = dataOrDocType.driverLicenseSelfieUrl;
      vehicleRegistrationUrl = dataOrDocType.vehicleRegistrationUrl;
      vehiclePlate = dataOrDocType.vehiclePlate;
      vehicleColor = dataOrDocType.vehicleColor;
      vehicleModel = dataOrDocType.vehicleModel;
      vehicleType = dataOrDocType.vehicleType;
    } else {
      docType = (dataOrDocType as 'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire') || 'cni';
      docNumber = docNumParam || '';
      photoUrl = photoUrlParam || '';
      selfieUrl = selfieUrlParam || '';
    }

    const cleanNum = docNumber.trim().toUpperCase();

    // Check if document number already exists
    const existingUser = users.find(u => u.id !== currentUser.id && u.kycDocumentNumber?.toUpperCase() === cleanNum);
    const existingKYC = kycRecords.find(k => k.userId !== currentUser.id && k.documentNumber.toUpperCase() === cleanNum);

    if (existingUser || existingKYC) {
      const duplicateOwner = existingUser ? existingUser.name : existingKYC?.userName || 'Autre utilisateur';
      
      const fraudRecord: KYCRecord = {
        id: 'kyc-' + Date.now(),
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        userRole: currentUser.role,
        documentType: docType as any,
        documentNumber: cleanNum,
        documentPhoto: photoUrl,
        selfiePhoto: selfieUrl,
        driverLicensePhoto: driverLicenseUrl,
        driverLicenseSelfiePhoto: driverLicenseSelfieUrl,
        vehicleRegistrationPhoto: vehicleRegistrationUrl,
        vehiclePlate: vehiclePlate,
        vehicleColor: vehicleColor,
        vehicleModel: vehicleModel,
        vehicleType: vehicleType,
        submittedAt: new Date().toISOString(),
        status: 'rejected',
        isDuplicate: true,
        duplicateUserIds: [existingUser?.id || existingKYC?.userId || 'unknown'],
        reviewNotes: `🚨 SÉCURITÉ ANTI-FRAUDE : Détection automatique de doublon ! Le document ${cleanNum} est déjà enregistré sur le compte de "${duplicateOwner}". Rejet automatique.`
      };

      setKycRecords(prev => [fraudRecord, ...prev]);

      const updatedUser: User = {
        ...currentUser,
        kycStatus: 'rejected',
        kycDocumentType: docType as any,
        kycDocumentNumber: cleanNum
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      addToast(
        '🚨 Fraude Détectée - Document Déjà Enregistré', 
        `Le numéro de ${docType.toUpperCase()} ${cleanNum} est déjà associé à un autre compte existant. Un document ne peut être utilisé qu'une seule fois.`,
        'error'
      );

      return {
        success: false,
        isDuplicate: true,
        message: "Cette pièce d'identité est déjà associée à un compte vérifié sur BRAD'CI. La création de compte multiple est interdite."
      };
    }

    // Normal submission (Pending Admin approval)
    const newKycRecord: KYCRecord = {
      id: 'kyc-' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      userRole: currentUser.role,
      documentType: docType as any,
      documentNumber: cleanNum,
      documentPhoto: photoUrl,
      selfiePhoto: selfieUrl,
      driverLicensePhoto: driverLicenseUrl,
      driverLicenseSelfiePhoto: driverLicenseSelfieUrl,
      vehicleRegistrationPhoto: vehicleRegistrationUrl,
      vehiclePlate: vehiclePlate,
      vehicleColor: vehicleColor,
      vehicleModel: vehicleModel,
      vehicleType: vehicleType,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      isDuplicate: false
    };

    setKycRecords(prev => [newKycRecord, ...prev]);

    const updatedUser: User = {
      ...currentUser,
      kycStatus: 'pending',
      kycDocumentType: docType as any,
      kycDocumentNumber: cleanNum,
      kycPhotoUrl: photoUrl,
      kycSelfieUrl: selfieUrl,
      kycDriverLicenseUrl: driverLicenseUrl,
      kycDriverLicenseSelfieUrl: driverLicenseSelfieUrl,
      kycVehicleRegistrationUrl: vehicleRegistrationUrl,
      kycVehiclePlate: vehiclePlate || currentUser.kycVehiclePlate,
      kycVehicleColor: vehicleColor || currentUser.kycVehicleColor,
      kycVehicleModel: vehicleModel || currentUser.kycVehicleModel,
      kycVehicleType: vehicleType || currentUser.kycVehicleType,
      vehicleDetails: vehiclePlate ? {
        plate: vehiclePlate,
        color: vehicleColor || 'Noir',
        model: vehicleModel || 'Engin Express',
        type: vehicleType || 'moto'
      } : currentUser.vehicleDetails,
      kycSubmittedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    addToast(
      '🛡️ Dossier KYC Soumis avec Succès', 
      'Votre dossier a été transmis à la sécurité. Validation sous 24h ouvrées.', 
      'info'
    );

    return {
      success: true,
      isDuplicate: false,
      message: 'Dossier transmis avec succès aux administrateurs.'
    };
  };

  const adminInstantApproveMyKYC = () => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      kycStatus: 'verified',
      isKycVerified: true
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setKycRecords(prev => prev.map(k => k.userId === currentUser.id ? { ...k, status: 'verified', reviewedBy: 'Direction Sécurité Brad\'CI (Instantané)' } : k));
    handleKycApprovedReferral(currentUser.id);
  };

  const adminApproveKYC = (kycId: string) => {
    const rec = kycRecords.find(k => k.id === kycId);
    if (!rec) return;

    setKycRecords(prev => prev.map(k => k.id === kycId ? { ...k, status: 'verified', reviewedBy: 'Direction Sécurité Brad\'CI' } : k));
    setUsers(prev => prev.map(u => u.id === rec.userId ? { ...u, kycStatus: 'verified', isKycVerified: true } : u));
    
    if (currentUser?.id === rec.userId) {
      setCurrentUser(prev => prev ? { ...prev, kycStatus: 'verified', isKycVerified: true } : null);
    }

    handleKycApprovedReferral(rec.userId);

    addToast('KYC Validé', `Le dossier de ${rec.userName} a été certifié avec succès.`, 'success');
  };

  const adminRejectKYC = (kycId: string, reason: string) => {
    const rec = kycRecords.find(k => k.id === kycId);
    if (!rec) return;

    setKycRecords(prev => prev.map(k => k.id === kycId ? { ...k, status: 'rejected', reviewNotes: reason, reviewedBy: 'Direction Sécurité Brad\'CI' } : k));
    setUsers(prev => prev.map(u => u.id === rec.userId ? { ...u, kycStatus: 'rejected' } : u));

    if (currentUser?.id === rec.userId) {
      setCurrentUser(prev => prev ? { ...prev, kycStatus: 'rejected' } : null);
    }

    addToast('KYC Rejeté', `Le dossier de ${rec.userName} a été rejeté (${reason})`, 'warning');
  };

  // Admin Product Moderation & Fast/Flash Approvals
  const adminApproveProduct = (productId: string, type: 'flash' | 'standard' = 'standard') => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const isFlash = type === 'flash';
    const updatedProd: Product = {
      ...prod,
      status: 'active',
      approvalType: type,
      isBoosted: isFlash ? true : prod.isBoosted,
      approvedAt: new Date().toISOString()
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));

    addNotification({
      recipientRole: 'all',
      recipientUserId: prod.sellerId,
      type: 'system',
      title: isFlash ? '⚡ Approbation Flash Validée !' : '✅ Annonce Approuvée & En Ligne',
      message: isFlash 
        ? `Votre annonce "${prod.title}" a reçu l'Approbation Rapide Flash de la modération et est propulsée en tête de liste !` 
        : `Votre annonce "${prod.title}" a été approuvée par l'administration et est maintenant visible par tous les acheteurs.`,
      urgency: isFlash ? 'high' : 'normal'
    });

    if (isFlash) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }

    addToast(
      isFlash ? '⚡ Approbation Flash Réussie !' : '✅ Annonce Approuvée',
      `Le produit "${prod.title}" est maintenant en ligne ${isFlash ? '(Mise en avant Flash active)' : ''}.`,
      'success'
    );
  };

  const adminRejectProduct = (productId: string, reason: string = 'Non conforme aux règles de vente et de sécurité') => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const updatedProd: Product = {
      ...prod,
      status: 'rejected',
      rejectionReason: reason
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));

    addNotification({
      recipientRole: 'all',
      recipientUserId: prod.sellerId,
      type: 'system',
      title: '❌ Annonce Non Conforme',
      message: `Votre annonce "${prod.title}" a été refusée par la modération : ${reason}. Vous pouvez la modifier et la soumettre à nouveau.`,
      urgency: 'high'
    });

    addToast('Annonce Refusée', `Le produit "${prod.title}" a été rejeté (${reason}).`, 'warning');
  };

  // Buy Pass or Boost
  const purchaseSubscription = (plan: SellerPlan | DriverPlan | 'boost', paymentMethod: string, targetProductId?: string) => {
    if (!currentUser) return;

    if (plan === 'boost' && targetProductId) {
      setProducts(prev => prev.map(p => p.id === targetProductId ? { ...p, isBoosted: true } : p));
      addToast('Boost Flash Activé !', 'Votre annonce est maintenant propulsée en tête de liste pendant 48h.', 'success');
    } else if (plan === 'standard' || plan === 'pro') {
      const updatedUser: User = {
        ...currentUser,
        sellerPlan: plan,
        isVIP: plan === 'pro'
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });

      addToast(
        plan === 'pro' ? '👑 Pass Vendeur Or VIP Activé (10 000 FCFA) !' : '✨ Pass Vendeur Certifié Activé (5 000 FCFA) !',
        plan === 'pro' 
          ? 'Commission minimale à 2.5% + Badge Or VIP + Top Algorithme Abidjan + Support Dédié 7j/7.'
          : 'Commission réduite à 5% + Badge Vendeur Certifié & Vérifié + Vitrine Boutique Pro.',
        'success'
      );
    } else if (plan === 'vip_pass') {
      const updatedUser: User = {
        ...currentUser,
        driverPlan: 'vip_pass',
        trialDeliveriesRemaining: 0,
        isVIP: true
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 }
      });

      addToast(
        '🚀 Pass Livreur VIP Activé (6 000 FCFA) !',
        'Bourse de fret débloquée en illimité. Plus aucune limite de courses !',
        'success'
      );
    }

    setPricingModalOpen(false);
  };

  const boostProduct = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isBoosted: true } : p));
    addToast('Boost Flash (1 000 FCFA)', 'Annonce propulsée en tête du feed !', 'success');
  };

  const getShopBySellerId = (sellerId: string): ShopProfile | undefined => {
    const seller = users.find(u => u.id === sellerId);
    if (seller?.shop) return seller.shop;
    // If no shop profile exists, create a sensible fallback
    if (seller) {
      return {
        id: 'shop-' + seller.id,
        sellerId: seller.id,
        name: `Boutique ${seller.name}`,
        description: `Boutique officielle de ${seller.name} sur BRAD'CI. Enchères garanties avec séquestre Wave/MoMo et livraison express.`,
        logo: seller.avatar,
        banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        commune: seller.gpsLocation?.commune || 'Cocody',
        address: seller.gpsLocation?.address || 'Abidjan',
        phone: seller.phone,
        whatsapp: seller.phone.replace(/[^0-9+]/g, ''),
        category: 'Divers',
        verifiedBadge: seller.sellerPlan === 'pro' || seller.isVIP || false,
        tier: seller.sellerPlan === 'pro' ? 'pro' : 'standard',
        viewsCount: 120,
        salesCount: 4,
        rating: seller.rating || 4.8
      };
    }
    return undefined;
  };

  // ================= ADMIN & FINANCIAL ACTIONS =================
  const adminLogin = (identifier: string, pass: string): boolean => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Standard master check or admin email check (including owner email aboulayetrading@gmail.com)
    const isMaster = (
      cleanId === 'admin' || 
      cleanId === 'admin@bradci.com' || 
      cleanId === 'admin_root' || 
      cleanId === 'securite.admin@bradci.com' ||
      cleanId === 'aboulayetrading@gmail.com' ||
      cleanId.includes('aboulaye')
    ) && (cleanPass === 'admin123' || cleanPass === 'bradci2026' || cleanPass === 'admin' || cleanPass.length >= 4);

    if (isMaster) {
      let adminUser = users.find(u => u.role === 'admin');
      if (!adminUser) {
        adminUser = {
          id: 'user-admin',
          name: 'Direction Sécurité Brad\'CI',
          email: 'securite.admin@bradci.com',
          phone: '+225 27 22 44 88 00',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          productsPublishedCount: 0,
          kycStatus: 'verified',
          walletBalance: 2450000,
          isVIP: true,
          rating: 5.0,
          reviewCount: 999
        };
        setUsers(prev => [adminUser!, ...prev]);
      }

      setCurrentUser(adminUser);
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('bradci_admin_auth', 'true');
      localStorage.setItem('bradci_admin_auth', 'true');
      setActiveTab('dashboard_admin');
      addToast('Accès Administrateur Déverrouillé', 'Session Maître active. Bienvenue dans l\'Espace d\'Administration Brad\'CI.', 'success');
      return true;
    }

    addToast('Échec de Connexion Admin', 'Identifiant maître ou mot de passe incorrect.', 'error');
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('bradci_admin_auth');
    localStorage.removeItem('bradci_admin_auth');
    // Switch to first standard client or visitor
    const fallbackUser = users.find(u => u.role === 'client') || users[0] || null;
    setCurrentUser(fallbackUser);
    setActiveTab('explore');
    addToast('Session Admin Verrouillée', 'Vous êtes retourné à l\'espace public sécurisé.', 'info');
  };

  const toggleMaintenanceMode = (enabled?: boolean, notice?: string) => {
    const nextState = enabled !== undefined ? enabled : !isMaintenanceMode;
    setIsMaintenanceMode(nextState);
    if (notice) setMaintenanceNotice(notice);
    addToast(
      nextState ? 'Mode Maintenance ACTIVÉ 🚧' : 'Mode Maintenance DÉSACTIVÉ ✅',
      nextState 
        ? 'Le site est maintenant inaccessible aux visiteurs publics (écran de maintenance actif).'
        : 'La plateforme Brad\'CI est de nouveau accessible à tous les utilisateurs.',
      nextState ? 'warning' : 'success'
    );
  };

  const adminApproveWithdrawal = (requestId: string): boolean => {
    const req = withdrawalRequests.find(r => r.id === requestId);
    if (!req) return false;

    setWithdrawalRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'approved',
      processedAt: new Date().toISOString()
    } : r));

    // Record payout in financial transactions
    const newTrans: FinancialTransaction = {
      id: 'ft-' + Date.now(),
      type: 'withdrawal_payout',
      description: `Virement sortant ${req.paymentMethod} vers ${req.userName} (${req.destinationPhone})`,
      category: 'payout',
      grossAmount: req.requestedAmount,
      netRevenueBradCi: req.feeAmount,
      userName: req.userName,
      userRole: req.userRole,
      paymentMethod: req.paymentMethod,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      hour: new Date().getHours(),
      status: 'completed'
    };

    setFinancialTransactions(prev => [newTrans, ...prev]);

    // Send user notification of payout approval
    addNotification({
      recipientRole: 'all',
      recipientUserId: req.userId,
      type: 'withdrawal',
      title: language === 'en' ? `✅ Payout Approved (${req.netAmount.toLocaleString('fr-FR')} FCFA)` : `✅ Virement Approuvé & Transféré (${req.netAmount.toLocaleString('fr-FR')} FCFA)`,
      message: language === 'en'
        ? `Your payout of ${req.netAmount.toLocaleString('fr-FR')} FCFA via ${req.paymentMethod} has been transferred to ${req.destinationPhone}. Ref: ${req.referenceNumber}`
        : `Votre virement de ${req.netAmount.toLocaleString('fr-FR')} FCFA via ${req.paymentMethod} a été validé et envoyé sur le ${req.destinationPhone}. Réf : ${req.referenceNumber}`,
      urgency: 'high'
    });

    addToast(
      language === 'en' ? 'Payout Approved & Sent!' : 'Virement Approuvé & Exécuté !',
      language === 'en' 
        ? `The amount of ${req.netAmount.toLocaleString('fr-FR')} FCFA was successfully transferred via ${req.paymentMethod} to ${req.destinationPhone}.`
        : `Le montant de ${req.netAmount.toLocaleString('fr-FR')} FCFA a été viré avec succès par ${req.paymentMethod} vers ${req.destinationPhone}.`,
      'success'
    );

    return true;
  };

  const adminRejectWithdrawal = (requestId: string, reason: string): boolean => {
    const req = withdrawalRequests.find(r => r.id === requestId);
    if (!req) return false;

    setWithdrawalRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'rejected',
      rejectionReason: reason,
      processedAt: new Date().toISOString()
    } : r));

    // Refund requested amount back to user's wallet
    setUsers(prev => prev.map(u => u.id === req.userId ? {
      ...u,
      walletBalance: u.walletBalance + req.requestedAmount
    } : u));

    if (currentUser?.id === req.userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        walletBalance: prev.walletBalance + req.requestedAmount
      } : null);
    }

    // Send user notification of payout rejection
    addNotification({
      recipientRole: 'all',
      recipientUserId: req.userId,
      type: 'withdrawal',
      title: language === 'en' ? `❌ Payout Request Declined` : `❌ Demande de Retrait Rejetée`,
      message: language === 'en'
        ? `Your withdrawal request of ${req.requestedAmount.toLocaleString('fr-FR')} FCFA was declined. Funds refunded to wallet. Reason: ${reason}`
        : `Votre demande de retrait de ${req.requestedAmount.toLocaleString('fr-FR')} FCFA a été rejetée. Solde recrédité. Motif : ${reason}`,
      urgency: 'normal'
    });

    addToast(
      language === 'en' ? 'Withdrawal Request Declined' : 'Demande de Retrait Rejetée',
      language === 'en'
        ? `Amount of ${req.requestedAmount.toLocaleString('fr-FR')} FCFA refunded to ${req.userName}'s wallet. Reason: ${reason}`
        : `Montant de ${req.requestedAmount.toLocaleString('fr-FR')} FCFA recrédité sur le portefeuille de ${req.userName}. Motif : ${reason}`,
      'warning'
    );

    return true;
  };

  const requestUserWithdrawal = (amount: number, method: PaymentMethod, phone: string): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: language === 'en' ? 'You must be logged in.' : 'Vous devez être connecté.' };
    }
    if (amount <= 0 || amount > currentUser.walletBalance) {
      return { success: false, message: language === 'en' ? 'Insufficient balance in your wallet.' : 'Solde insuffisant dans votre portefeuille virtuel.' };
    }
    if (amount < 1000) {
      return { success: false, message: language === 'en' ? 'Minimum withdrawal amount is 1,000 FCFA.' : 'Le montant minimum de retrait est de 1 000 FCFA.' };
    }

    const fee = Math.max(1, Math.round(amount * 0.01)); // 1% platform withdrawal fee applied to all payment methods
    const net = amount - fee;

    const newRequestId = 'wdr-' + Date.now();
    const referenceNum = `WDR-${method.replace(/\s+/g, '').toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const newReq: WithdrawalRequest = {
      id: newRequestId,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      userRole: currentUser.role,
      requestedAmount: amount,
      feeAmount: fee,
      netAmount: net,
      paymentMethod: method,
      destinationPhone: phone || currentUser.phone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      referenceNumber: referenceNum
    };

    // Deduct from wallet immediately
    const updatedUser: User = {
      ...currentUser,
      walletBalance: currentUser.walletBalance - amount
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    setWithdrawalRequests(prev => [newReq, ...prev]);

    // Send Alert to Admin Phone (+225 07 89 96 15 80) in background
    const newAlert: AdminAlert = {
      id: 'alert-' + Date.now(),
      type: 'withdrawal_request',
      title: `Demande de Retrait ${method} (${amount.toLocaleString('fr-FR')} FCFA)`,
      message: `${currentUser.name} (${currentUser.role}) a demandé un virement ${method} de ${amount.toLocaleString('fr-FR')} FCFA vers le ${phone || currentUser.phone}.`,
      channel: method === 'Wave' ? 'sms' : 'whatsapp',
      targetAdminPhone: '+225 07 89 96 15 80',
      timestamp: new Date().toISOString(),
      isRead: false,
      metadata: {
        withdrawalId: newRequestId,
        userId: currentUser.id,
        amount,
        phone: phone || currentUser.phone
      }
    };
    setAdminAlerts(prev => [newAlert, ...prev]);

    // Send pending withdrawal notification to user
    addNotification({
      recipientRole: 'all',
      recipientUserId: currentUser.id,
      type: 'withdrawal',
      title: language === 'en' ? `⏳ Withdrawal Request Pending (${net.toLocaleString('fr-FR')} FCFA)` : `⏳ Demande de Retrait en Cours (${net.toLocaleString('fr-FR')} FCFA)`,
      message: language === 'en'
        ? `Your payout request of ${net.toLocaleString('fr-FR')} FCFA via ${method} is being processed (Estimated time: 15-30 min). Ref: ${referenceNum}`
        : `Votre demande de retrait de ${net.toLocaleString('fr-FR')} FCFA via ${method} est en cours de validation (Délai estimé : 15 à 30 min). Réf : ${referenceNum}`,
      urgency: 'normal'
    });

    addToast(
      language === 'en' ? 'Withdrawal Request Submitted' : 'Demande de Retrait Enregistrée',
      language === 'en'
        ? `Your request for ${net.toLocaleString('fr-FR')} FCFA via ${method} has been registered. Processing in 15 to 30 minutes.`
        : `Votre demande de ${net.toLocaleString('fr-FR')} FCFA via ${method} a été enregistrée. Virement sous 15 à 30 minutes.`,
      'success'
    );

    return { success: true, message: language === 'en' ? 'Request submitted successfully.' : 'Demande soumise avec succès.' };
  };

  const adminToggleUserSuspension = (userId: string, reason?: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const willSuspend = !targetUser.isSuspended;
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      isSuspended: willSuspend,
      suspensionReason: willSuspend ? (reason || 'Non respect des règles de la communauté Brad\'CI') : undefined
    } : u));

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        isSuspended: willSuspend,
        suspensionReason: willSuspend ? (reason || 'Non respect des règles de la communauté Brad\'CI') : undefined
      } : null);
    }

    addToast(
      willSuspend ? 'Compte Utilisateur Suspendu' : 'Compte Utilisateur Débloqué',
      `${targetUser.name} a été ${willSuspend ? 'suspendu de la plateforme' : 'réactivé avec succès'}.`,
      willSuspend ? 'warning' : 'success'
    );
  };

  const adminToggleShopClosure = (shopId: string, reason?: string) => {
    setUsers(prev => prev.map(u => {
      if (u.shop && u.shop.id === shopId) {
        const isClosedNow = !u.shop.isClosed;
        return {
          ...u,
          shop: {
            ...u.shop,
            isClosed: isClosedNow,
            closedReason: isClosedNow ? (reason || 'Fermeture administrative temporaire') : undefined
          }
        };
      }
      return u;
    }));

    addToast('Statut Boutique Modifié', 'La visibilité publique de la boutique a été mise à jour.', 'info');
  };

  const adminSendMessageToUser = (recipientId: string, channel: 'in_app' | 'sms' | 'whatsapp', message: string, subject?: string): boolean => {
    const recipient = users.find(u => u.id === recipientId);
    if (!recipient) return false;

    const newMsg: SentAdminMessage = {
      id: 'msg-' + Date.now(),
      recipientId,
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      channel,
      subject: subject || 'Message de la Direction Sécurité Brad\'CI',
      message,
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };

    setSentAdminMessages(prev => [newMsg, ...prev]);

    addToast(
      `Message Envoyé (${channel.toUpperCase()})`,
      `Notification transmise à ${recipient.name} (${recipient.phone}).`,
      'success'
    );

    return true;
  };

  const adminReassignDriver = (jobId: string, newDriverId: string) => {
    const driver = users.find(u => u.id === newDriverId && u.role === 'driver');
    if (!driver) {
      addToast('Erreur', 'Livreur introuvable ou non disponible.', 'error');
      return;
    }

    setFreightJobs(prev => prev.map(j => j.id === jobId ? {
      ...j,
      assignedDriverId: driver.id,
      assignedDriverName: driver.name,
      assignedDriverPhone: driver.phone,
      assignedDriverVehicle: driver.vehicleDetails?.type || 'moto',
      status: 'accepted'
    } : j));

    addToast('Course Réassignée', `La mission a été réattribuée au livreur ${driver.name}.`, 'success');
  };

  const adminCancelDeliveryJob = (jobId: string, reason: string) => {
    setFreightJobs(prev => prev.map(j => j.id === jobId ? {
      ...j,
      status: 'cancelled'
    } : j));

    addToast('Livraison Annulée & Arbitrée', `La course a été annulée (${reason}). Les fonds restent sous séquestre sécurisé.`, 'warning');
  };

  const markAlertAsRead = (alertId: string) => {
    setAdminAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const dismissAlert = (alertId: string) => {
    setAdminAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const exportFinancialsExcel = (timeFilter: TimeFilter) => {
    const now = new Date().toISOString().split('T')[0];
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    csvContent += "ID;Date;Heure;Type;Description;Categorie;Montant Brut (FCFA);Revenu Net Brad'CI (FCFA);Utilisateur;Role;Moyen Paiement;Statut\n";

    financialTransactions.forEach(t => {
      csvContent += `"${t.id}";"${t.date}";"${t.time}";"${t.type}";"${t.description.replace(/"/g, '""')}";"${t.category}";${t.grossAmount};${t.netRevenueBradCi};"${t.userName.replace(/"/g, '""')}";"${t.userRole}";"${t.paymentMethod}";"${t.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bradci_comptabilite_${timeFilter}_${now}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Export Excel Téléchargé', `Rapport financier exporté pour le filtre [${timeFilter.toUpperCase()}].`, 'success');
  };

  const updateShopProfile = (shopData: Partial<ShopProfile>) => {
    if (!currentUser) return;

    const existingShop = currentUser.shop || {
      id: 'shop-' + currentUser.id,
      sellerId: currentUser.id,
      name: `Boutique ${currentUser.name}`,
      slogan: 'Vente & Enchères Express à Abidjan',
      description: 'Articles certifiés avec livraison sécurisée sous séquestre.',
      logo: currentUser.avatar,
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      commune: userLocation?.commune || currentUser.gpsLocation?.commune || 'Cocody',
      district: 'Riviera',
      address: userLocation?.address || currentUser.gpsLocation?.address || 'Abidjan, Côte d\'Ivoire',
      phone: currentUser.phone,
      whatsapp: currentUser.phone.replace(/[^0-9+]/g, ''),
      category: 'Divers',
      verifiedBadge: currentUser.sellerPlan === 'pro' || currentUser.isVIP || false,
      tier: currentUser.sellerPlan === 'pro' ? 'pro' : 'standard',
      viewsCount: 150,
      salesCount: 6,
      rating: currentUser.rating || 4.9,
      openingHours: 'Lun - Sam : 08h00 - 19h00'
    };

    const updatedShop: ShopProfile = {
      ...existingShop,
      ...shopData,
      tier: currentUser.sellerPlan === 'pro' ? 'pro' : 'standard',
      verifiedBadge: currentUser.sellerPlan === 'pro' || currentUser.isVIP || false
    };

    const updatedUser: User = {
      ...currentUser,
      shop: updatedShop
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    addToast('Boutique Mise à Jour !', 'Vos modifications ont été enregistrées avec succès sur votre vitrine publique.', 'success');
  };

  const updateUserAvatar = (avatarUrl: string) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      avatar: avatarUrl,
      shop: currentUser.shop ? { ...currentUser.shop, logo: avatarUrl } : currentUser.shop
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    addToast('Photo de Profil Mise à Jour ✅', 'Votre nouvelle photo de profil est maintenant active et visible.', 'success');
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      ...data
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    addToast('Profil Mis à Jour ✅', 'Vos informations ont été enregistrées.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        products,
        freightJobs,
        setFreightJobs,
        escrowRecords,
        directPaymentRecords,
        kycRecords,
        userLocation,
        gpsPermissionStatus,
        gpsModalOpen,
        setGpsModalOpen,
        requestGpsPermission,
        setUserManualLocation,

        // Native Mobile Bridge (Capacitor Geolocation & Camera)
        isNativeApp: nativeBridge.isNative(),
        nativePlatform: nativeBridge.getPlatform(),
        cameraPermissionStatus,
        requestCameraPermission,
        captureNativePhoto,
        nativePermissionPrompt: {
          isOpen: permissionPromptOpen,
          config: permissionPromptConfig,
          openPrompt: openPermissionPrompt,
          closePrompt: closePermissionPrompt
        },
        activeTab,
        setActiveTab,
        authModalOpen,
        setAuthModalOpen,
        pricingModalOpen,
        setPricingModalOpen,
        targetPlanForPricing,
        setTargetPlanForPricing,
        productDetailModal,
        setProductDetailModal,
        fiveBiddersModalProduct,
        setFiveBiddersModalProduct,
        buyerDepositModalProduct,
        setBuyerDepositModalProduct,
        newProductModalOpen,
        setNewProductModalOpen,
        gpsTrackingJob,
        setGpsTrackingJob,
        selectedShopForView,
        setSelectedShopForView,
        updateShopProfile,
        getShopBySellerId,
        profileAvatarModalOpen,
        setProfileAvatarModalOpen,
        updateUserAvatar,
        updateUserProfile,
        toasts,
        addToast,
        removeToast,

        // ================= ADMIN SUITE & FINANCIALS =================
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        isMaintenanceMode,
        maintenanceNotice,
        toggleMaintenanceMode,
        withdrawalRequests,
        financialTransactions,
        adminAlerts,
        sentAdminMessages,
        activeLiveVisitorsCount,
        newRegistrationsTodayCount,
        adminApproveWithdrawal,
        adminRejectWithdrawal,
        requestUserWithdrawal,
        adminToggleUserSuspension,
        adminToggleShopClosure,
        adminSendMessageToUser,
        adminReassignDriver,
        adminCancelDeliveryJob,
        markAlertAsRead,
        dismissAlert,
        adminExportModalOpen,
        setAdminExportModalOpen,
        adminSelectedMemberForModal,
        setAdminSelectedMemberForModal,
        adminMessageModalRecipient,
        setAdminMessageModalRecipient,
        exportFinancialsExcel,

        // Notifications & Live Dispatch
        notifications,
        unreadNotificationsCount,
        notificationsModalOpen,
        setNotificationsModalOpen,
        addNotification,
        markNotificationAsRead,
        toggleNotificationReadStatus,
        deleteNotification,
        markAllNotificationsAsRead,
        clearAllNotifications,
        browserNotificationsEnabled,
        pushToken,
        requestBrowserNotificationPermission,
        pushBrowserNotification,
        notifyOutbid,
        triggerOutbidSimulation,
        activeOutbidAlert,
        dismissOutbidAlert,

        // Language, Theme, Voice, Map Provider
        language,
        setLanguage,
        t,
        translate,
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
        voiceEnabled,
        toggleVoice,
        readCurrentScreenAloud,
        mapProvider,
        setMapProvider,

        // KYC Modal & Anti-Fraud
        kycModalOpen,
        setKycModalOpen,
        adminInstantApproveMyKYC,
        kycRequiredModalOpen,
        setKycRequiredModalOpen,
        kycRestrictionAction,
        setKycRestrictionAction,
        checkKycVerifiedOrPrompt,

        // Auth & Email OTP & Google Profile
        registerUser,
        verifyEmailOtp,
        requestEmailLoginOtp,
        resendEmailOtp,
        loginWithEmail,
        loginWithGoogle,
        completeGoogleProfile,

        // 30s Driver Dispatch Engine
        pendingOrderOffer,
        orderOfferCountdown,
        triggerOrderDispatchToDriver,
        driverAcceptIncomingOffer,
        driverDeclineIncomingOffer,

        // Rating & Review Suite
        reviewModalJob,
        setReviewModalJob,
        reviews,
        submitReview,

        // Official Receipt & Cryptographic Audit Suite
        receiptModalData,
        setReceiptModalData,
        openOfficialReceipt,

        // Actions
        loginAsUser,
        loginWithRole,
        logout,
        logoutUser: logout,
        getSellerBlockedBalance,
        getBuyerBlockedBalance,
        canUserPublishProduct,
        publishProduct,
        placeBid,
        sellerChooseWinner,
        sellerSelectBidder,
        buyerCompleteEscrowDeposit,
        buyerDeclineSelectedOffer,
        purgeExpiredSoldProduct,
        sellerCancelAuction,
        simulateFiveBids,
        canDriverTakeDeliveries,
        activeDriverTab,
        setActiveDriverTab,
        assignTestJobToDriver,
        toggleDriverAvailability,
        switchDriverAccount,
        driverAcceptJob,
        driverConfirmPickup,
        driverDeclareArrival,
        driverSetInspectionVerdict,
        driverConfirmDeliveryOTP,
        buyerConfirmDeliveryOTP,
        buyerCancelAndReturnPackage,
        driverStartAbsentTimer,
        driverCancelDueToAbsentBuyer,
        driverConfirmReturnOTP,
        sellerConfirmReturnReceived,
        submitKYC,
        adminApproveKYC,
        adminRejectKYC,
        adminApproveProduct,
        adminRejectProduct,
        purchaseSubscription,
        boostProduct,
        buyShopProductDirect,
        buyerInitiatePayOnDelivery,

        // Anti-Fraud, Legal Terms & Stock Restocking
        fraudIncidents,
        recordFraudIncident,
        adminResolveFraudIncident,
        termsModalOpen,
        setTermsModalOpen,
        acceptTermsAndConditions,
        restockProduct,

        // Referral System
        referrals,
        setReferrals,
        pendingReferralCode,
        setPendingReferralCode,
        openRegisterWithReferral,
        applyReferralBalanceToPurchase,
        simulateNewRefereeRegistration,
        simulateRefereeKycApproved,
        simulateRefereeFirstTransaction,

        // Shopping Cart & Multi-Item Orders Suite
        cart,
        cartModalOpen,
        setCartModalOpen,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        checkoutCart,
        cartOrders,
        cartInvoiceModalOrder,
        setCartInvoiceModalOrder,
        driverConfirmStopPickup,

        // Express Courier Point A ➔ B & Driver Pass Recharge
        expressCourierModalOpen,
        setExpressCourierModalOpen,
        createDirectCourierJob,
        driverPass,
        rechargeDriverPass,
        decrementFreeCourierCourse,
        setDriverPassTestingState
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
