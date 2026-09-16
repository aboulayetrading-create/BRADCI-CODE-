import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bike, 
  Car, 
  Truck, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Share2, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  Phone, 
  User, 
  Package, 
  CreditCard, 
  Banknote, 
  ArrowUpDown, 
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Radio,
  Send,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  ALL_COMMUNES, 
  COMMUNE_NAMES_ABIDJAN, 
  calculateCommuneDistanceKm, 
  calculateDeliveryFee 
} from '../data/communes';
import { VehicleType, DirectCourierOrderInput, DeliveryJob } from '../types';

interface QuickTemplate {
  id: string;
  label: string;
  desc: string;
  icon: string;
  size: 'document' | 'small' | 'medium' | 'large';
  vehicle: VehicleType;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'doc',
    label: '📄 Pli / Documents',
    desc: 'Courrier, contrat, passeport, pochette scellée (< 1 kg)',
    icon: '📄',
    size: 'document',
    vehicle: 'moto'
  },
  {
    id: 'petit_colis',
    label: '📱 Smartphone / High-Tech',
    desc: 'Téléphone, écouteurs, accessoires sous emballage (< 2 kg)',
    icon: '📱',
    size: 'small',
    vehicle: 'moto'
  },
  {
    id: 'vetement',
    label: '👗 Vêtement / Chaussure',
    desc: 'Sachet boutique, boîte à chaussure, parfum (< 3 kg)',
    icon: '👗',
    size: 'small',
    vehicle: 'moto'
  },
  {
    id: 'repas',
    label: '🍰 Gâteau / Repas Délicat',
    desc: 'Nourriture, pâtisserie fragile à transporter à plat',
    icon: '🍰',
    size: 'medium',
    vehicle: 'moto'
  },
  {
    id: 'carton',
    label: '📦 Carton Moyen',
    desc: 'Colis boutique ou articles multiples (5 à 20 kg)',
    icon: '📦',
    size: 'medium',
    vehicle: 'voiture'
  },
  {
    id: 'lourd',
    label: '🚚 Matériel / Volumineux',
    desc: 'Électroménager, matériel lourd ou encombrant (> 30 kg)',
    icon: '🚚',
    size: 'large',
    vehicle: 'cargo'
  }
];

const POPULAR_LANDMARKS: Record<string, string[]> = {
  'Cocody': [
    'Angré 8ème Tranche (Carrefour Duncan)',
    'Angré Château & Terminus 81/82',
    'Riviera Palmeraie (Rond-point Ado)',
    'Riviera Golf & Ambassades',
    'Deux-Plateaux Vallons (Rue des Jardins)',
    'Attoban (Commissariat 30ème)',
    'Saint-Jean Cocody'
  ],
  'Le Plateau': [
    'Immeuble Postel 2001 (Avenue Chardy)',
    'Cité Administrative (Tours A/B/C/D/E)',
    'Cathédrale Saint-Paul',
    'Avenue Nogues / Sièges Banques',
    'Place de la République'
  ],
  'Marcory': [
    'Zone 4 (Rue du 7 Décembre)',
    'Biétry (Boulevard de Marseille)',
    'Marcory Résidentiel',
    'Remblais & Clinique Farah',
    'Carrefour Solibra / VGE'
  ],
  'Yopougon': [
    'Yopougon Siporex (Carrefour Principal)',
    'Bel Air / Sideci',
    'Maroc & Ananeraie',
    'Niangon Sud & Nord (À gauche)',
    'Complexe Jesse Jackson'
  ],
  'Koumassi': [
    'Koumassi Remblais & Inch\'Allah',
    'Grand Carrefour Koumassi',
    'Soweto & Divo',
    'Zone Industrielle Koumassi'
  ],
  'Treichville': [
    'Avenue 16 & Grand Marché',
    'Rue 12 / CHU Treichville',
    'Palais de la Culture',
    'Zone Portuaire'
  ],
  'Port-Bouët': [
    'Aéroport Félix Houphouët-Boigny',
    'Carrefour Anani & Route Bassam',
    'Vridi Cité & Canal',
    'Derrière Wharf'
  ]
};

export const ExpressCourierView: React.FC = () => {
  const { 
    currentUser, 
    userLocation, 
    freightJobs, 
    createDirectCourierJob, 
    setGpsTrackingJob,
    translate, 
    addToast 
  } = useApp();

  // Sub-tabs in the courier portal
  const [activeSubTab, setActiveSubTab] = useState<'order' | 'my_deliveries' | 'rates'>('order');

  // Point A (Ramassage / Expéditeur)
  const defaultSenderCommune = userLocation?.commune || currentUser?.gpsLocation?.commune || 'Cocody';
  const defaultSenderAddress = userLocation?.address || currentUser?.gpsLocation?.address || 'Angré 8ème Tranche, Carrefour Duncan';
  
  const [pickupCommune, setPickupCommune] = useState<string>(defaultSenderCommune);
  const [pickupAddress, setPickupAddress] = useState<string>(defaultSenderAddress);
  const [senderName, setSenderName] = useState<string>(currentUser?.name || '');
  const [senderPhone, setSenderPhone] = useState<string>(currentUser?.phone || '+225 07 ');
  const [senderNote, setSenderNote] = useState<string>('');

  // Point B (Livraison / Destinataire)
  const [dropoffCommune, setDropoffCommune] = useState<string>('Le Plateau');
  const [dropoffAddress, setDropoffAddress] = useState<string>('Avenue Chardy, Immeuble Postel 2001, 4e étage');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('+225 05 ');
  const [recipientNote, setRecipientNote] = useState<string>('');

  // Détails Colis
  const [packageDescription, setPackageDescription] = useState<string>('Pli urgent & documents professionnels scellés');
  const [packageSize, setPackageSize] = useState<'document' | 'small' | 'medium' | 'large'>('small');
  const [requiredVehicle, setRequiredVehicle] = useState<VehicleType>('moto');
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<'cash_pickup' | 'cash_delivery' | 'mobile_money'>('cash_pickup');

  // Confirmation state
  const [createdJob, setCreatedJob] = useState<DeliveryJob | null>(null);
  const [copiedCode, setCopiedCode] = useState<'pickup' | 'delivery' | null>(null);

  // Rate simulator state
  const [simPickup, setSimPickup] = useState<string>('Cocody');
  const [simDropoff, setSimDropoff] = useState<string>('Marcory');

  // Distance et calcul de prix automatique
  const distanceKm = useMemo(() => {
    return calculateCommuneDistanceKm(pickupCommune, dropoffCommune);
  }, [pickupCommune, dropoffCommune]);

  const estimatedEtaMinutes = useMemo(() => {
    const baseMin = requiredVehicle === 'moto' ? 12 : 20;
    return Math.max(15, Math.round(distanceKm * (requiredVehicle === 'moto' ? 2.2 : 2.9)) + baseMin);
  }, [distanceKm, requiredVehicle]);

  const calculatedFee = useMemo(() => {
    const base = calculateDeliveryFee(pickupCommune, dropoffCommune, requiredVehicle);
    const fragileExtra = isFragile ? 300 : 0;
    return base + fragileExtra;
  }, [pickupCommune, dropoffCommune, requiredVehicle, isFragile]);

  // Swapping Points A and B
  const handleSwapAddresses = () => {
    const tempCommune = pickupCommune;
    const tempAddress = pickupAddress;
    const tempName = senderName;
    const tempPhone = senderPhone;

    setPickupCommune(dropoffCommune);
    setPickupAddress(dropoffAddress);
    setSenderName(recipientName);
    setSenderPhone(recipientPhone);

    setDropoffCommune(tempCommune);
    setDropoffAddress(tempAddress);
    setRecipientName(tempName);
    setRecipientPhone(tempPhone);

    addToast(
      translate("Adresses inversées", "Addresses swapped"),
      translate("Le point A et le point B ont été intervertis.", "Pickup and dropoff swapped."),
      "info"
    );
  };

  // Quick template selection
  const handleApplyTemplate = (tmpl: QuickTemplate) => {
    setPackageDescription(tmpl.desc);
    setPackageSize(tmpl.size);
    setRequiredVehicle(tmpl.vehicle);
    addToast(translate("Modèle appliqué", "Template applied"), tmpl.label, "info");
  };

  // Copy helper
  const handleCopy = (text: string, type: 'pickup' | 'delivery') => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(type);
    addToast(translate('Code copié !', 'Code copied!'), text, 'info');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Submit order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      addToast(
        translate('Nom du destinataire requis', 'Recipient name required'), 
        translate('Veuillez renseigner le nom de la personne qui recevra le colis.', 'Please fill recipient name.'), 
        'warning'
      );
      return;
    }
    if (!recipientPhone.trim() || recipientPhone.trim() === '+225 05 ') {
      addToast(
        translate('Numéro de téléphone requis', 'Phone required'), 
        translate('Veuillez renseigner le téléphone du destinataire pour que le coursier puisse le joindre.', 'Please fill recipient phone.'), 
        'warning'
      );
      return;
    }

    const payload: DirectCourierOrderInput = {
      pickupCommune,
      pickupAddress: pickupAddress.trim() || `${pickupCommune}, Abidjan`,
      senderName: senderName.trim() || currentUser?.name || 'Expéditeur',
      senderPhone: senderPhone.trim() || '+225 07 00 00 00 00',
      senderNote: senderNote.trim() || undefined,
      dropoffCommune,
      dropoffAddress: dropoffAddress.trim() || `${dropoffCommune}, Abidjan`,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientNote: recipientNote.trim() || undefined,
      packageDescription: `${packageDescription}${isFragile ? ' [⚠️ COLIS FRAGILE]' : ''}`,
      packageSize,
      requiredVehicle,
      declaredValue: isFragile ? 25000 : 5000
    };

    const newJob = createDirectCourierJob(payload);
    setCreatedJob(newJob);
    
    addToast(
      translate("🚀 Coursier Demandé avec Succès !", "🚀 Express Courier Requested!"),
      translate(
        `Mission #${newJob.id.slice(-6)} créée. Trajet ${pickupCommune} ➔ ${dropoffCommune} (${distanceKm} km) attribué aux coursiers à proximité.`,
        `Mission #${newJob.id.slice(-6)} created. Route ${pickupCommune} ➔ ${dropoffCommune} dispatched.`
      ),
      "success"
    );
  };

  // My direct courier jobs
  const myDirectJobs = useMemo(() => {
    return (freightJobs || []).filter(j => 
      j.jobKind === 'direct_courier'
    );
  }, [freightJobs]);

  return (
    <div id="express-courier-portal" className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER STYLE APPLICATION DE COURSIER MODERNE (UBER CONNECT / YANGO) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#060D20] via-[#0B1530] to-[#141F45] border border-violet-500/30 p-5 sm:p-7 shadow-2xl dark-banner banner-text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-violet-600/20 to-indigo-600/0 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-amber-300" />
                <span>BRAD'CI COURSIER EXPRESS</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Envoyez vos Colis d'un <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">Point A à un Point B</span> en Temps Record
            </h1>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('order')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeSubTab === 'order'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-slate-900/70 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Commander un Coursier</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('my_deliveries')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeSubTab === 'my_deliveries'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-slate-900/70 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Mes Envois en Direct</span>
            {myDirectJobs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] font-mono">
                {myDirectJobs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rates')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeSubTab === 'rates'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-slate-900/70 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Grille Tarifaire Abidjan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ÉCRAN DE CONFIRMATION SI COMMANDE VIENT D'ÊTRE VALIDÉE                   */}
      {/* ========================================================================= */}
      {createdJob && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border-2 border-emerald-500/50 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Mission Activée & Diffusée
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Coursier Express Demandé #{createdJob.id.slice(-6)}
                </h3>
                <p className="text-xs text-slate-300">
                  {createdJob.pickupCommune} ➔ {createdJob.dropoffCommune} ({createdJob.packageDescription})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGpsTrackingJob(createdJob)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>Suivre en Direct sur la Carte GPS</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedJob(null)}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
              >
                Nouvelle Course
              </button>
            </div>
          </div>

          {/* Double codes OTP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>1. Code Enlèvement (Ramassage)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(createdJob.pickupSecretOtp || createdJob.pickupCode || '0000', 'pickup')}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">{copiedCode === 'pickup' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Donnez ce code au livreur lorsqu'il arrive à votre adresse pour récupérer le colis :
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-widest bg-amber-500/10 p-2.5 rounded-xl text-center border border-amber-500/30">
                {createdJob.pickupSecretOtp || createdJob.pickupCode || '7412'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>2. Code Remise (Livraison)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(createdJob.deliverySecretOtp || createdJob.deliveryOtpCode || '0000', 'delivery')}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">{copiedCode === 'delivery' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Transmettez ce code secret au destinataire ({createdJob.recipientName}) :
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tracking-widest bg-emerald-500/10 p-2.5 rounded-xl text-center border border-emerald-500/30">
                {createdJob.deliverySecretOtp || createdJob.deliveryOtpCode || '9854'}
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Share Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-xs text-slate-300">
              📲 <strong>Partagez en 1 clic au destinataire</strong> : Envoyez les détails de la course et le code secret sur WhatsApp.
            </div>
            <a
              href={`https://wa.me/${createdJob.recipientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Bonjour ${createdJob.recipientName} ! Je viens de vous envoyer un colis via BRAD'CI COURSIER EXPRESS 🇨🇮.\n\n📍 Départ : ${createdJob.pickupCommune}\n🏁 Arrivée : ${createdJob.dropoffCommune}\n🔑 Votre Code Secret de Réception : ${createdJob.deliverySecretOtp || createdJob.deliveryOtpCode || '9854'}\n\nDonnez ce code au livreur à la réception de votre paquet pour valider la livraison.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Envoyer sur WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VUE PRINCIPALE : COMMANDER UN COURSIER (FORMULAIRE TRAJET & PRIX)       */}
      {/* ========================================================================= */}
      {activeSubTab === 'order' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLONNE GAUCHE : FORMULAIRE DE COMMANDE */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Templates Chips */}
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Que souhaitez-vous faire livrer ? (Choix Rapide)</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 hover:border-violet-500/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{tmpl.icon}</span>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {tmpl.label.split(' ')[1]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {tmpl.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* SECTION TRAJET POINT A ➔ POINT B */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Itinéraire de la Course
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Précisez les adresses et contacts pour l'enlèvement et la dépose
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSwapAddresses}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 shadow flex items-center gap-1 text-xs font-bold cursor-pointer transition-all active:scale-95"
                    title="Inverser le Point A et le Point B"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Inverser A ⇄ B</span>
                  </button>
                </div>

                {/* POINT A (RAMASSAGE / EXPÉDITEUR) */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                        A
                      </span>
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Point de Ramassage (Expéditeur)
                      </span>
                    </div>
                    {userLocation?.commune && (
                      <button
                        type="button"
                        onClick={() => {
                          setPickupCommune(userLocation.commune);
                          if (userLocation.address) setPickupAddress(userLocation.address);
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Ma Position GPS</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 uppercase block mb-1">
                        Commune de départ *
                      </label>
                      <select
                        value={pickupCommune}
                        onChange={(e) => setPickupCommune(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {ALL_COMMUNES.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 uppercase block mb-1">
                        Adresse précise / Carrefour repère *
                      </label>
                      <input
                        type="text"
                        required
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Ex: Angré 8e Tranche, Carrefour Duncan"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Suggestions de repères pour la commune A */}
                  {POPULAR_LANDMARKS[pickupCommune] && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <span className="text-[10px] text-slate-400 shrink-0">Repères :</span>
                      {POPULAR_LANDMARKS[pickupCommune].slice(0, 4).map((landmark, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPickupAddress(landmark)}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-800 shrink-0 cursor-pointer"
                        >
                          {landmark.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1">
                        Votre Nom / Société
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Nom expéditeur"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1">
                        Votre Numéro de Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-400 block mb-1">
                      Consigne au coursier pour l'enlèvement (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={senderNote}
                      onChange={(e) => setSenderNote(e.target.value)}
                      placeholder="Ex: Étage 2, porte droite. Appelez à la barrière."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>

                {/* POINT B (LIVRAISON / DESTINATAIRE) */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-indigo-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center font-mono">
                        B
                      </span>
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Point de Livraison (Destinataire)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 uppercase block mb-1">
                        Commune de destination *
                      </label>
                      <select
                        value={dropoffCommune}
                        onChange={(e) => setDropoffCommune(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {ALL_COMMUNES.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 uppercase block mb-1">
                        Adresse précise de destination *
                      </label>
                      <input
                        type="text"
                        required
                        value={dropoffAddress}
                        onChange={(e) => setDropoffAddress(e.target.value)}
                        placeholder="Ex: Avenue Chardy, Immeuble Postel 2001"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Suggestions de repères pour la commune B */}
                  {POPULAR_LANDMARKS[dropoffCommune] && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <span className="text-[10px] text-slate-400 shrink-0">Repères :</span>
                      {POPULAR_LANDMARKS[dropoffCommune].slice(0, 4).map((landmark, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDropoffAddress(landmark)}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-800 shrink-0 cursor-pointer"
                        >
                          {landmark.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1">
                        Nom de la personne qui reçoit *
                      </label>
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Ex: M. Jean Kouassi"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1">
                        Téléphone du destinataire *
                      </label>
                      <input
                        type="tel"
                        required
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+225 05 00 00 00 00"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono font-bold text-indigo-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-400 block mb-1">
                      Consigne pour la livraison (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={recipientNote}
                      onChange={(e) => setRecipientNote(e.target.value)}
                      placeholder="Ex: Remettre à la réceptionniste si absent"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SÉLECTEUR DE VÉHICULE ULTRA VISUEL */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>Type de Véhicule & Tarif Calculé</span>
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase">
                        Garantie 0% Commission
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tarif net calculé en fonction de la distance ({distanceKm} km)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Moto Express */}
                  <button
                    type="button"
                    onClick={() => setRequiredVehicle('moto')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      requiredVehicle === 'moto'
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                      RAPIDE
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-black text-white">Moto Express</div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Plis, documents, nourriture & petits colis (&lt; 5 kg)
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-400">Tarif :</span>
                      <span className="text-sm font-mono font-black text-amber-400">
                        {calculateDeliveryFee(pickupCommune, dropoffCommune, 'moto').toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  </button>

                  {/* Voiture / Break */}
                  <button
                    type="button"
                    onClick={() => setRequiredVehicle('voiture')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      requiredVehicle === 'voiture' || requiredVehicle === 'car'
                        ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-2">
                      <Car className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-black text-white">Voiture / Coffre</div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Cartons, gâteaux, objets fragiles & pluie (&lt; 50 kg)
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-400">Tarif :</span>
                      <span className="text-sm font-mono font-black text-blue-400">
                        {calculateDeliveryFee(pickupCommune, dropoffCommune, 'voiture').toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  </button>

                  {/* Camionnette / Cargo */}
                  <button
                    type="button"
                    onClick={() => setRequiredVehicle('cargo')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      requiredVehicle === 'cargo'
                        ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-2">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-black text-white">Cargo / Camionnette</div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Gros cartons, électroménager, déménagement (&gt; 50 kg)
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-400">Tarif :</span>
                      <span className="text-sm font-mono font-black text-purple-400">
                        {calculateDeliveryFee(pickupCommune, dropoffCommune, 'cargo').toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* DÉTAILS COLIS & SÉCURITÉ */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-violet-400" />
                  <span>Description du Colis & Options de Sécurité</span>
                </h3>

                <div>
                  <label className="text-[10.5px] font-bold text-slate-300 uppercase block mb-1">
                    Description du contenu du colis *
                  </label>
                  <input
                    type="text"
                    required
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    placeholder="Ex: Pochette avec documents, boîte de chaussures, robe..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Option Colis Fragile */}
                  <label className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFragile}
                      onChange={(e) => setIsFragile(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-700 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">⚠️ Colis Fragile (+300 F)</span>
                      <span className="text-[10px] text-slate-400">Maniement avec précaution & transport à plat</span>
                    </div>
                  </label>

                  {/* Mode de Paiement au Coursier */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Règlement du Coursier :
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                    >
                      <option value="cash_pickup">💵 Espèces au Ramassage (Expéditeur)</option>
                      <option value="cash_delivery">💵 Espèces à la Livraison (Destinataire)</option>
                      <option value="mobile_money">📱 Wave / MoMo direct au coursier</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BOUTON D'ACTION PRINCIPAL : COMMANDER */}
              <button
                type="submit"
                id="btn-submit-express-courier-order"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-violet-600/30 flex items-center justify-between transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-none text-xs text-violet-200 uppercase font-bold">Confirmer la demande</span>
                    <span className="text-base font-extrabold">Commander mon Coursier Express</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg sm:text-xl font-mono font-black text-amber-300">
                    {calculatedFee.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="block text-[9px] text-violet-200">Arrivée en {estimatedEtaMinutes} min</span>
                </div>
              </button>
            </form>
          </div>

          {/* COLONNE DROITE : CARTE GPS EN DIRECT & DEVIS RÉCAPITULATIF */}
          <div className="lg:col-span-5 space-y-6">
            {/* CARTE VISUELLE DU TRAJET INTERACTIF */}
            <div className="rounded-3xl bg-[#060D20] border border-slate-800 overflow-hidden shadow-2xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Trajet & Radar Temps Réel
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {distanceKm} km • ~{estimatedEtaMinutes} min
                </span>
              </div>

              {/* Mini visualiseur d'itinéraire */}
              <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-between p-4">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Visual Trajectory Line */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      A
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">Départ (Ramassage)</span>
                      <p className="text-xs font-black text-white truncate">{pickupCommune}</p>
                      <p className="text-[10px] text-slate-400 truncate">{pickupAddress}</p>
                    </div>
                  </div>

                  {/* Connecting Line with Bike Animation */}
                  <div className="ml-3 pl-3 border-l-2 border-dashed border-slate-700 py-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      📏 {distanceKm} km via grands boulevards
                    </span>
                    <Bike className="w-4 h-4 text-amber-400 animate-bounce mr-2" />
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                      B
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase block">Arrivée (Livraison)</span>
                      <p className="text-xs font-black text-white truncate">{dropoffCommune}</p>
                      <p className="text-[10px] text-slate-400 truncate">{dropoffAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Google Maps External Link */}
                <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">Circulation estimée : <strong className="text-emerald-400">Fluide</strong></span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupCommune + ', Abidjan')}&destination=${encodeURIComponent(dropoffCommune + ', Abidjan')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Ouvrir Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* DÉCOMPOSITION COMPLÈTE DU PRIX */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-xs font-black text-white uppercase tracking-wider block">
                  Détail Transparent du Prix
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Prise en charge de base :</span>
                    <span className="font-mono text-slate-200">1 000 FCFA</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Distance calculée ({distanceKm} km) :</span>
                    <span className="font-mono text-slate-200">
                      +{(calculatedFee - 1000 - (isFragile ? 300 : 0)).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  {isFragile && (
                    <div className="flex justify-between text-amber-400">
                      <span>Option Colis Fragile :</span>
                      <span className="font-mono">+300 FCFA</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="font-extrabold text-white">Total Net Garanti :</span>
                    <span className="text-xl font-mono font-black text-amber-400">
                      {calculatedFee.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 leading-relaxed">
                  🛡️ <strong>Paiement direct au livreur</strong> : Vous réglez 100% du montant affiché au coursier en espèces ou Wave/MoMo. Brad'CI ne prélève aucun centime.
                </div>
              </div>

              {/* ASSURANCE & GARANTIES */}
              <div className="space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Double Code OTP sécurisé remis à l'expéditeur et au destinataire</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Notification par SMS / Push à chaque étape de la course</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Contact téléphonique direct avec le coursier sans intermédiaire</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MES ENVOIS EN COURS & HISTORIQUE                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'my_deliveries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">
                Mes Courses de Colis Commandées
              </h2>
              <p className="text-xs text-slate-400">
                Suivez vos livraisons express en direct et accédez aux codes secrets
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('order')}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Commander un Colis</span>
            </button>
          </div>

          {myDirectJobs.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Aucun envoi de colis en cours</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Vous n'avez pas encore commandé de coursier express. Renseignez votre point de départ et votre point d'arrivée pour créer votre premier envoi !
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('order')}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Commander maintenant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDirectJobs.map(job => (
                <div 
                  key={job.id} 
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 transition-all shadow-xl space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/40">
                        ⚡ Colis Express
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">#{job.id.slice(-6)}</span>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      job.status === 'delivered' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : job.status === 'in_transit'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {job.status === 'delivered' ? 'Livré ✅' : job.status === 'in_transit' ? 'En route 🛵' : 'En recherche coursier 📡'}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">A</span>
                      <span className="text-slate-300 truncate font-semibold">{job.pickupCommune} ({job.pickupAddress})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px] flex items-center justify-center shrink-0">B</span>
                      <span className="text-slate-300 truncate font-semibold">{job.dropoffCommune} ({job.dropoffAddress})</span>
                    </div>
                  </div>

                  {/* Codes OTP */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <div className="p-2 rounded-xl bg-slate-950 text-center">
                      <span className="text-[9px] text-amber-400 block font-bold uppercase">Code Ramassage</span>
                      <span className="text-sm font-mono font-black text-white">{job.pickupSecretOtp || job.pickupCode || '7412'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 text-center">
                      <span className="text-[9px] text-emerald-400 block font-bold uppercase">Code Livraison</span>
                      <span className="text-sm font-mono font-black text-white">{job.deliverySecretOtp || job.deliveryOtpCode || '9854'}</span>
                    </div>
                  </div>

                  {/* Footer & Live GPS tracking */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tarif à régler au coursier :</span>
                      <span className="text-sm font-mono font-black text-amber-400">
                        {job.deliveryFee.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setGpsTrackingJob(job)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Suivi Carte GPS</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GRILLE TARIFAIRE ABIDJAN & SIMULATEUR                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'rates' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-black text-white">
                Simulateur & Barème des Tarifs Grand Abidjan
              </h2>
              <p className="text-xs text-slate-400">
                Tarifs transparents basés sur la distance routière kilométrique réelle
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase">
              0% Commission Brad'CI
            </div>
          </div>

          {/* Simulateur rapide */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase block">
              Tester un trajet entre deux communes :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Commune A (Départ)</label>
                <select
                  value={simPickup}
                  onChange={(e) => setSimPickup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                >
                  {ALL_COMMUNES.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Commune B (Arrivée)</label>
                <select
                  value={simDropoff}
                  onChange={(e) => setSimDropoff(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                >
                  {ALL_COMMUNES.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Simulated Results */}
            <div className="pt-3 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <Bike className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">Moto Express</span>
                <span className="text-base font-mono font-black text-amber-400">
                  {calculateDeliveryFee(simPickup, simDropoff, 'moto').toLocaleString('fr-FR')} F
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ~{calculateCommuneDistanceKm(simPickup, simDropoff)} km
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <Car className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">Voiture / Break</span>
                <span className="text-base font-mono font-black text-blue-400">
                  {calculateDeliveryFee(simPickup, simDropoff, 'voiture').toLocaleString('fr-FR')} F
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sécurisé & Pluie</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <Truck className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">Cargo / Camion</span>
                <span className="text-base font-mono font-black text-purple-400">
                  {calculateDeliveryFee(simPickup, simDropoff, 'cargo').toLocaleString('fr-FR')} F
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Grand Volume</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
