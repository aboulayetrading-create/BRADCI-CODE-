import { UserActivityLog, VipCallRequest, BannedIPRecord, ActivityActionType, ActivitySeverity } from '../types/audit';
import { UserRole } from '../types';

const AUDIT_LOGS_STORAGE_KEY = 'bradci_audit_activity_logs_v1';
const VIP_CALLS_STORAGE_KEY = 'bradci_vip_call_requests_v1';
const BANNED_IPS_STORAGE_KEY = 'bradci_banned_ips_v1';

// Preset realistic Abidjan IP and Carrier pools
const ABIDJAN_COMMUNES_GEO = [
  { name: 'Cocody', lat: 5.3599, lng: -3.9870, isp: 'Orange Côte d\'Ivoire (AS36980)', prefix: '41.202.' },
  { name: 'Plateau', lat: 5.3261, lng: -4.0197, isp: 'MTN Côte d\'Ivoire (AS29465)', prefix: '160.154.' },
  { name: 'Marcory', lat: 5.3045, lng: -3.9825, isp: 'Orange Côte d\'Ivoire (AS36980)', prefix: '41.202.' },
  { name: 'Yopougon', lat: 5.3411, lng: -4.0833, isp: 'Moov Africa CI (AS37107)', prefix: '105.235.' },
  { name: 'Koumassi', lat: 5.3011, lng: -3.9482, isp: 'MTN Côte d\'Ivoire (AS29465)', prefix: '160.154.' },
  { name: 'Treichville', lat: 5.3089, lng: -4.0089, isp: 'Orange Côte d\'Ivoire (AS36980)', prefix: '41.202.' },
  { name: 'Port-Bouët', lat: 5.2572, lng: -3.9317, isp: 'Moov Africa CI (AS37107)', prefix: '105.235.' },
  { name: 'Abobo', lat: 5.4164, lng: -4.0197, isp: 'MTN Côte d\'Ivoire (AS29465)', prefix: '160.154.' },
  { name: 'Bingerville', lat: 5.3558, lng: -3.8899, isp: 'Orange Côte d\'Ivoire (AS36980)', prefix: '41.202.' },
  { name: 'Adjamé', lat: 5.3570, lng: -4.0264, isp: 'Moov Africa CI (AS37107)', prefix: '105.235.' }
];

const INITIAL_LOGS: UserActivityLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    formattedTime: 'Il y a 3 min',
    userId: 'usr-101',
    userName: 'Koffi Jean-Luc',
    userEmail: 'koffi.jeanluc@gmail.com',
    userPhone: '+225 07 48 92 11 34',
    userRole: 'client',
    isPassAbonne: true,
    passTier: 'pro',
    ip: '41.202.144.78',
    commune: 'Cocody',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    coords: { lat: 5.3599, lng: -3.9870 },
    isp: 'Orange Côte d\'Ivoire (AS36980)',
    networkType: '4G LTE',
    device: 'Android 14 (Samsung Galaxy S24)',
    browser: 'Chrome Mobile 128',
    actionType: 'login',
    actionTitle: 'Connexion Sécurisée Validée',
    description: 'Authentification réussie par Code de Sécurité OTP email.',
    severity: 'normal'
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    formattedTime: 'Il y a 9 min',
    userId: 'usr-102',
    userName: 'Bamba Salimata',
    userEmail: 'salimata.bamba@yahoo.fr',
    userPhone: '+225 05 74 12 88 90',
    userRole: 'client',
    isPassAbonne: true,
    passTier: 'standard',
    ip: '160.154.99.23',
    commune: 'Plateau',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    coords: { lat: 5.3261, lng: -4.0197 },
    isp: 'MTN Côte d\'Ivoire (AS29465)',
    networkType: 'Fibre Optique',
    device: 'macOS Sonoma (MacBook Pro M3)',
    browser: 'Safari 17.5',
    actionType: 'vip_call_request',
    actionTitle: 'Demande d\'Assistance Prioritaire Dédiée soumise',
    description: 'Demande d\'accompagnement prioritaire pour arbitrage vendeur et gestion boutique.',
    severity: 'normal',
    metadata: { priority: 'haute', ticketId: 'VIP-CALL-4412' }
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    formattedTime: 'Il y a 17 min',
    userId: 'usr-103',
    userName: 'Yao Marc-Arthur',
    userEmail: 'marc.yao@hotmail.com',
    userPhone: '+225 01 02 33 44 55',
    userRole: 'driver',
    isPassAbonne: true,
    passTier: 'vip_pass',
    ip: '105.235.66.19',
    commune: 'Yopougon',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    coords: { lat: 5.3411, lng: -4.0833 },
    isp: 'Moov Africa CI (AS37107)',
    networkType: '4G LTE',
    device: 'Android 13 (Tecno Camon 20)',
    browser: 'Chrome Mobile 126',
    actionType: 'pod_payment',
    actionTitle: 'Paiement POD & Code Secret Validé',
    description: 'Course livrée au carrefour Bel Air, règlement Wave 35 000 FCFA reçu et code secret saisi.',
    severity: 'normal'
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    formattedTime: 'Il y a 28 min',
    userId: 'usr-104',
    userName: 'Kouassi Estelle',
    userEmail: 'estelle.kouassi@outlook.com',
    userPhone: '+225 07 88 77 66 55',
    userRole: 'client',
    isPassAbonne: false,
    passTier: 'none',
    ip: '41.202.219.112',
    commune: 'Marcory',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    coords: { lat: 5.3045, lng: -3.9825 },
    isp: 'Orange Côte d\'Ivoire (AS36980)',
    networkType: '4G LTE',
    device: 'iOS 18 (iPhone 15 Pro)',
    browser: 'Mobile Safari 18',
    actionType: 'bid',
    actionTitle: 'Nouvelle Offre Déposée (5 Enchères)',
    description: 'Offre de 65 000 FCFA soumise sur le lot iPhone 13 Pro Max - Commune Marcory Zone 4.',
    severity: 'normal'
  },
  {
    id: 'log-005',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    formattedTime: 'Il y a 42 min',
    userId: 'usr-105',
    userName: 'Traoré Bakary',
    userEmail: 'bakary.traore@driver.ci',
    userPhone: '+225 05 55 44 33 22',
    userRole: 'driver',
    isPassAbonne: true,
    passTier: 'vip_pass',
    ip: '160.154.80.45',
    commune: 'Treichville',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    coords: { lat: 5.3089, lng: -4.0089 },
    isp: 'MTN Côte d\'Ivoire (AS29465)',
    networkType: '4G LTE',
    device: 'Android 14 (Infinix Note 30)',
    browser: 'Chrome Mobile 127',
    actionType: 'kyc_submit',
    actionTitle: 'Soumission Dossier KYC & Permis Moto',
    description: 'Permis de conduire catégorie A2 et CNI téléversés pour vérification biométrique.',
    severity: 'normal'
  },
  {
    id: 'log-006',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    formattedTime: 'Il y a 1h',
    userId: 'anonymous-visitor',
    userName: 'Visiteur Inconnu',
    userEmail: 'ip-tracker@external-net.ci',
    userRole: 'visitor',
    isPassAbonne: false,
    passTier: 'none',
    ip: '185.220.101.5',
    commune: 'Adjamé',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    coords: { lat: 5.3570, lng: -4.0264 },
    isp: 'Tor Exit Node / VPN Inconnu',
    networkType: 'Wi-Fi',
    device: 'Linux x86_64',
    browser: 'Headless Chrome / Python Requests',
    actionType: 'security_alert',
    actionTitle: 'Alerte Sécurité : Tentative Accès Non Autorisé',
    description: 'Scan d\'adresses administratives privées bloqué par le pare-feu BRAD\'CI.',
    severity: 'critical',
    isFlagged: true
  }
];

const INITIAL_VIP_CALLS: VipCallRequest[] = [
  {
    id: 'VIP-CALL-85-4412',
    userId: 'usr-102',
    userName: 'Bamba Salimata',
    userPhone: '+225 05 74 12 88 90',
    userEmail: 'salimata.bamba@yahoo.fr',
    isPassAbonne: true,
    passTier: 'standard',
    subject: 'Assistance VIP Vente & Arbitrage 5 Offres',
    preferredSlot: 'Créneau Immédiat (Priorité Pass)',
    notes: 'Besoin d\'un accompagnement pour valider mon lot de cosmétiques et débloquer les paiements Wave en toute sécurité.',
    requestedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    formattedDate: 'Aujourd\'hui 14:16',
    status: 'pending',
    maxDurationMinutes: 85,
    ip: '160.154.99.23',
    commune: 'Plateau'
  },
  {
    id: 'VIP-CALL-85-4398',
    userId: 'usr-101',
    userName: 'Koffi Jean-Luc',
    userPhone: '+225 07 48 92 11 34',
    userEmail: 'koffi.jeanluc@gmail.com',
    isPassAbonne: true,
    passTier: 'pro',
    subject: 'Conseils Personnalisés Boutique Illimitée & Logistique Fret',
    preferredSlot: 'Cet Après-Midi (15h30)',
    notes: 'Examen de mes courses express entre Cocody et San-Pédro avec un conseiller senior.',
    requestedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    formattedDate: 'Aujourd\'hui 10:20',
    status: 'completed',
    maxDurationMinutes: 85,
    ip: '41.202.144.78',
    commune: 'Cocody',
    assignedAdminName: 'Direction Support Abidjan',
    adminNotes: 'Entretien téléphonique de 52 minutes réalisé avec succès. Paramétrage boutique vérifié.'
  }
];

export class ActivityAuditService {
  private static instance: ActivityAuditService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): ActivityAuditService {
    if (!ActivityAuditService.instance) {
      ActivityAuditService.instance = new ActivityAuditService();
    }
    return ActivityAuditService.instance;
  }

  private ensureInitialized(): void {
    try {
      if (!localStorage.getItem(AUDIT_LOGS_STORAGE_KEY)) {
        localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      }
      if (!localStorage.getItem(VIP_CALLS_STORAGE_KEY)) {
        localStorage.setItem(VIP_CALLS_STORAGE_KEY, JSON.stringify(INITIAL_VIP_CALLS));
      }
      if (!localStorage.getItem(BANNED_IPS_STORAGE_KEY)) {
        localStorage.setItem(BANNED_IPS_STORAGE_KEY, JSON.stringify([]));
      }
    } catch {
      // LocalStorage fallback
    }
  }

  public getLogs(): UserActivityLog[] {
    try {
      const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading audit logs:', e);
    }
    return INITIAL_LOGS;
  }

  public logActivity(entry: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    userRole: UserRole;
    isPassAbonne?: boolean;
    passTier?: 'standard' | 'pro' | 'vip_pass' | 'none';
    commune?: string;
    actionType: ActivityActionType;
    actionTitle: string;
    description: string;
    severity?: ActivitySeverity;
    metadata?: Record<string, any>;
  }): UserActivityLog {
    const communeObj = ABIDJAN_COMMUNES_GEO.find(c => c.name.toLowerCase() === (entry.commune || '').toLowerCase()) || ABIDJAN_COMMUNES_GEO[0];
    
    // Generate realistic Ivorian IP for this session/commune
    const ipSuffix = `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 250 + 2)}`;
    const ip = `${communeObj.prefix}${ipSuffix}`;

    const newLog: UserActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      formattedTime: 'À l\'instant',
      userId: entry.userId,
      userName: entry.userName,
      userEmail: entry.userEmail,
      userPhone: entry.userPhone,
      userRole: entry.userRole,
      isPassAbonne: Boolean(entry.isPassAbonne),
      passTier: entry.passTier || 'none',
      ip,
      commune: communeObj.name,
      city: 'Abidjan',
      country: 'Côte d\'Ivoire',
      countryCode: 'CI',
      coords: { lat: communeObj.lat, lng: communeObj.lng },
      isp: communeObj.isp,
      networkType: navigator.userAgent.includes('Mobile') ? '4G LTE' : 'Fibre Optique',
      device: navigator.userAgent.includes('Android') 
        ? 'Android (Mobile)' 
        : navigator.userAgent.includes('iPhone') 
          ? 'iOS (iPhone)' 
          : navigator.userAgent.includes('Mac') 
            ? 'macOS (Desktop)' 
            : 'Windows PC (Desktop)',
      browser: 'Navigateur Web Sécurisé',
      actionType: entry.actionType,
      actionTitle: entry.actionTitle,
      description: entry.description,
      severity: entry.severity || 'normal',
      metadata: entry.metadata
    };

    try {
      const currentLogs = this.getLogs();
      const updated = [newLog, ...currentLogs].slice(0, 300); // Keep last 300 logs
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save log to localStorage:', err);
    }

    return newLog;
  }

  // VIP Calls management
  public getVipCalls(): VipCallRequest[] {
    try {
      const raw = localStorage.getItem(VIP_CALLS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    return INITIAL_VIP_CALLS;
  }

  public createVipCallRequest(params: {
    userId: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    passTier: 'standard' | 'pro' | 'vip_pass';
    subject: string;
    preferredSlot: string;
    notes?: string;
    commune?: string;
  }): VipCallRequest {
    const communeName = params.commune || 'Cocody';
    const communeObj = ABIDJAN_COMMUNES_GEO.find(c => c.name.toLowerCase() === communeName.toLowerCase()) || ABIDJAN_COMMUNES_GEO[0];
    const ip = `${communeObj.prefix}${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 250 + 2)}`;

    const newRequest: VipCallRequest = {
      id: `VIP-CALL-85-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: params.userId,
      userName: params.userName,
      userPhone: params.userPhone,
      userEmail: params.userEmail,
      isPassAbonne: true,
      passTier: params.passTier,
      subject: params.subject,
      preferredSlot: params.preferredSlot,
      notes: params.notes,
      requestedAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      maxDurationMinutes: 85,
      ip,
      commune: communeObj.name
    };

    try {
      const current = this.getVipCalls();
      const updated = [newRequest, ...current];
      localStorage.setItem(VIP_CALLS_STORAGE_KEY, JSON.stringify(updated));

      // Also create an audit log
      this.logActivity({
        userId: params.userId,
        userName: params.userName,
        userEmail: params.userEmail,
        userPhone: params.userPhone,
        userRole: 'client',
        isPassAbonne: true,
        passTier: params.passTier,
        commune: communeObj.name,
        actionType: 'vip_call_request',
        actionTitle: `Demande d'Assistance Prioritaire (${newRequest.id})`,
        description: `Demande d'accompagnement prioritaire enregistrée pour "${params.subject}". Contact: ${params.userPhone}.`,
        severity: 'normal',
        metadata: { ticketId: newRequest.id, priority: 'haute' }
      });
    } catch {
      // fallback
    }

    return newRequest;
  }

  public updateVipCallStatus(
    callId: string, 
    status: VipCallRequest['status'], 
    assignedAdminName?: string, 
    adminNotes?: string
  ): boolean {
    try {
      const current = this.getVipCalls();
      const index = current.findIndex(c => c.id === callId);
      if (index >= 0) {
        current[index].status = status;
        if (assignedAdminName) current[index].assignedAdminName = assignedAdminName;
        if (adminNotes) current[index].adminNotes = adminNotes;
        if (status === 'in_progress' && !current[index].callStartedAt) {
          current[index].callStartedAt = new Date().toISOString();
        }
        if (status === 'completed' && !current[index].callEndedAt) {
          current[index].callEndedAt = new Date().toISOString();
        }
        localStorage.setItem(VIP_CALLS_STORAGE_KEY, JSON.stringify(current));
        return true;
      }
    } catch {
      // fallback
    }
    return false;
  }

  // IP Ban management
  public getBannedIPs(): BannedIPRecord[] {
    try {
      const raw = localStorage.getItem(BANNED_IPS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  public banIP(ip: string, reason: string, adminName: string, commune?: string): boolean {
    try {
      const current = this.getBannedIPs();
      if (current.some(b => b.ip === ip)) return true;
      const updated = [...current, {
        ip,
        reason,
        bannedAt: new Date().toISOString(),
        bannedBy: adminName,
        commune
      }];
      localStorage.setItem(BANNED_IPS_STORAGE_KEY, JSON.stringify(updated));

      this.logActivity({
        userId: 'admin-action',
        userName: adminName,
        userEmail: 'securite.admin@bradci.com',
        userRole: 'admin',
        actionType: 'security_alert',
        actionTitle: `Bannissement IP Réseau : ${ip}`,
        description: `Adresse IP ${ip} révoquée et bloquée par ${adminName}. Motif: ${reason}`,
        severity: 'critical'
      });
      return true;
    } catch {
      return false;
    }
  }

  public unbanIP(ip: string): boolean {
    try {
      const current = this.getBannedIPs();
      const updated = current.filter(b => b.ip !== ip);
      localStorage.setItem(BANNED_IPS_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }
}

export const auditLogger = ActivityAuditService.getInstance();
