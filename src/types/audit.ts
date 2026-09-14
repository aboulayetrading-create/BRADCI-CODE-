import { UserRole } from '../types';

export type ActivityActionType = 
  | 'login'
  | 'register'
  | 'logout'
  | 'bid'
  | 'order'
  | 'pod_payment'
  | 'escrow_deposit'
  | 'withdrawal'
  | 'kyc_submit'
  | 'kyc_approved'
  | 'pass_subscribed'
  | 'vip_call_request'
  | 'product_publish'
  | 'page_view'
  | 'security_alert'
  | 'admin_access'
  | 'account_update'
  | 'theft_freeze';

export type ActivitySeverity = 'normal' | 'warning' | 'critical';

export interface UserActivityLog {
  id: string;
  timestamp: string; // ISO string
  formattedTime: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userRole: UserRole;
  isPassAbonne: boolean;
  passTier?: 'standard' | 'pro' | 'vip_pass' | 'none';
  
  // IP & Geolocation
  ip: string;
  commune: string;
  city: string;
  country: string;
  countryCode: string;
  coords: { lat: number; lng: number };
  isp: string; // e.g. Orange Côte d'Ivoire, MTN Côte d'Ivoire, Moov Africa CI
  networkType: '4G LTE' | '5G' | 'Fibre Optique' | 'Wi-Fi';
  
  // Device Fingerprint
  device: string; // e.g. Android 14 (Samsung A54), iOS 18 (iPhone 15), Windows 11
  browser: string; // e.g. Chrome Mobile 128, Safari 18, Edge
  
  // Action details
  actionType: ActivityActionType;
  actionTitle: string;
  description: string;
  severity: ActivitySeverity;
  metadata?: Record<string, any>;
  isFlagged?: boolean;
}

export interface VipCallRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  isPassAbonne: boolean;
  passTier: 'standard' | 'pro' | 'vip_pass';
  subject: string;
  preferredSlot: string;
  notes?: string;
  requestedAt: string; // ISO
  formattedDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  maxDurationMinutes: number; // Always 85
  ip: string;
  commune: string;
  assignedAdminName?: string;
  callStartedAt?: string;
  callEndedAt?: string;
  adminNotes?: string;
}

export interface BannedIPRecord {
  ip: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
  commune?: string;
}
