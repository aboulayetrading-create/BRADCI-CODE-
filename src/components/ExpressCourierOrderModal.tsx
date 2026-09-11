import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  MapPin, 
  Bike, 
  Car, 
  Truck, 
  Package, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Phone, 
  User as UserIcon, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Banknote, 
  Navigation, 
  Copy, 
  Check, 
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
import { VehicleType, DirectCourierOrderInput, DeliveryJob } from '../types';
import { 
  ALL_COMMUNES, 
  calculateDeliveryFee, 
  calculateCommuneDistanceKm,
  getCommuneBadgeInfo 
} from '../data/communes';

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
    id: 'pli_urgent',
    label: '📄 Pli / Documents',
    desc: 'Contrat, passeport, dossier urgent',
    icon: '📄',
    size: 'document',
    vehicle: 'moto'
  },
  {
    id: 'colis_boutique',
    label: '🛍️ Colis Vendeur / Client',
    desc: 'Vêtements, chaussures, cosmétiques',
    icon: '🛍️',
    size: 'small',
    vehicle: 'moto'
  },
  {
    id: 'repas_express',
    label: '🍱 Nourriture / Repas',
    desc: 'Plat chaud, gâteau, livraison express',
    icon: '🍱',
    size: 'small',
    vehicle: 'moto'
  },
  {
    id: 'volumineux',
    label: '📦 Colis Volumineux',
    desc: 'Carton lourd, électroménager (> 8 kg)',
    icon: '📦',
    size: 'large',
    vehicle: 'car'
  }
];

export const ExpressCourierOrderModal: React.FC = () => {
  const { 
    expressCourierModalOpen, 
    setExpressCourierModalOpen, 
    createDirectCourierJob,
    currentUser, 
    userLocation,
    translate,
    addToast
  } = useApp();

  // Point A (Ramassage / Expéditeur)
  const defaultSenderCommune = userLocation?.commune || currentUser?.gpsLocation?.commune || 'Cocody';
  const defaultSenderAddress = userLocation?.address || currentUser?.gpsLocation?.address || 'Angré 8ème Tranche, Carrefour Duncan';
  
  const [pickupCommune, setPickupCommune] = useState<string>(defaultSenderCommune);
  const [pickupAddress, setPickupAddress] = useState<string>(defaultSenderAddress);
  const [senderName, setSenderName] = useState<string>(currentUser?.name || '');
  const [senderPhone, setSenderPhone] = useState<string>(currentUser?.phone || '+225 07 00 00 00 00');
  const [senderNote, setSenderNote] = useState<string>('');

  // Point B (Livraison / Destinataire)
  const [dropoffCommune, setDropoffCommune] = useState<string>('Le Plateau');
  const [dropoffAddress, setDropoffAddress] = useState<string>('Avenue Chardy, Immeuble Postel 2001, 4e étage');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientNote, setRecipientNote] = useState<string>('');

  // Détails Colis
  const [packageDescription, setPackageDescription] = useState<string>('Documents administratifs urgents sous pochette scellée');
  const [packageSize, setPackageSize] = useState<'document' | 'small' | 'medium' | 'large'>('small');
  const [requiredVehicle, setRequiredVehicle] = useState<VehicleType>('moto');
  const [declaredValue, setDeclaredValue] = useState<number>(0);

  // Écran de confirmation après commande
  const [createdJob, setCreatedJob] = useState<DeliveryJob | null>(null);
  const [copiedCode, setCopiedCode] = useState<'pickup' | 'delivery' | null>(null);

  // Distance et calcul de prix automatique
  const distanceKm = useMemo(() => {
    return calculateCommuneDistanceKm(pickupCommune, dropoffCommune);
  }, [pickupCommune, dropoffCommune]);

  const estimatedEtaMinutes = useMemo(() => {
    return Math.max(15, Math.round(distanceKm * 2.8) + 10);
  }, [distanceKm]);

  const calculatedFee = useMemo(() => {
    return calculateDeliveryFee(pickupCommune, dropoffCommune, requiredVehicle);
  }, [pickupCommune, dropoffCommune, requiredVehicle]);

  if (!expressCourierModalOpen) return null;

  const handleApplyTemplate = (tmpl: QuickTemplate) => {
    setPackageDescription(tmpl.desc);
    setPackageSize(tmpl.size);
    setRequiredVehicle(tmpl.vehicle);
  };

  const handleCopy = (text: string, type: 'pickup' | 'delivery') => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(type);
    addToast(translate('Code copié !', 'Code copied!'), text, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      addToast(translate('Nom du destinataire requis', 'Recipient name required'), translate('Veuillez renseigner le nom de la personne qui recevra le colis.', 'Please fill recipient name.'), 'warning');
      return;
    }
    if (!recipientPhone.trim()) {
      addToast(translate('Téléphone requis', 'Phone required'), translate('Veuillez renseigner le téléphone du destinataire pour que le coursier puisse le joindre.', 'Please fill recipient phone.'), 'warning');
      return;
    }

    const payload: DirectCourierOrderInput = {
      pickupCommune,
      pickupAddress: pickupAddress.trim() || `${pickupCommune}, Abidjan`,
      senderName: senderName.trim() || currentUser?.name || 'Expéditeur Anonyme',
      senderPhone: senderPhone.trim() || '+225 00 00 00 00 00',
      senderNote: senderNote.trim(),
      dropoffCommune,
      dropoffAddress: dropoffAddress.trim() || `${dropoffCommune}, Abidjan`,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      packageDescription: packageDescription.trim() || 'Colis Express A➔B',
      packageSize,
      requiredVehicle,
      deliveryFee: calculatedFee,
      itemValue: declaredValue || 0
    };

    const newJob = createDirectCourierJob(payload);
    setCreatedJob(newJob);
  };

  const handleClose = () => {
    setCreatedJob(null);
    setExpressCourierModalOpen(false);
  };

  const pickupBadge = getCommuneBadgeInfo(pickupCommune);
  const dropoffBadge = getCommuneBadgeInfo(dropoffCommune);

  return (
    <div 
      id="express-courier-order-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        id="express-courier-order-modal-card"
        className="relative w-full max-w-2xl bg-[#090F1D] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-display">
                  {translate("Commander un Coursier Express", "Order an Express Courier")}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Point A ➔ Point B
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {translate(
                  "Livraison directe de colis de main en main • 100% Paiement Cash au livreur (0% com BRAD'CI)",
                  "Hand-to-hand direct parcel courier • 100% Cash payment to driver (0% fee)"
                )}
              </p>
            </div>
          </div>

          <button
            id="btn-close-express-courier-modal"
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {createdJob ? (
            /* ========================================================================= */
            /* SUCCESS CONFIRMATION SCREEN WITH SECRET CODES & TRACKING                  */
            /* ========================================================================= */
            <div id="express-courier-success-view" className="space-y-6 text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-white">
                  {translate("Course Express Diffusée avec Succès !", "Express Trip Broadcasted Successfully!")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  {translate(
                    "Votre commande a été transmise en temps réel aux coursiers à proximité de ",
                    "Your order was transmitted in real-time to couriers near "
                  )}
                  <strong className="text-emerald-400">{createdJob.pickupCommune}</strong>.
                </p>
              </div>

              {/* Secret Security Codes Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 text-left space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {translate("Codes de Sécurité de la Course", "Trip Security Codes")}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/30">
                    ID: {createdJob.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Code Ramassage */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      1. Code Ramassage (Point A)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Donnez ce code au coursier quand il récupère le colis :
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                      <span className="font-mono text-xl font-black text-amber-400 tracking-wider">
                        {createdJob.pickupCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdJob.pickupCode, 'pickup')}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode === 'pickup' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === 'pickup' ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Livraison OTP */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      2. Code Livraison OTP (Point B)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Le destinataire le transmettra à la remise en main propre :
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                      <span className="font-mono text-xl font-black text-emerald-400 tracking-wider">
                        {createdJob.deliveryOtpCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdJob.deliveryOtpCode, 'delivery')}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode === 'delivery' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === 'delivery' ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recap Summary */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                      💵
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Prix à régler au livreur en physique :</span>
                      <span className="text-sm font-mono font-black text-white">
                        {createdJob.deliveryFee.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Trajet & Estimation :</span>
                    <span className="text-xs font-bold text-slate-200">
                      {createdJob.pickupCommune} ➔ {createdJob.dropoffCommune} ({createdJob.distanceKm} km, ~{createdJob.etaMinutes} min)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-violet-500/25 cursor-pointer"
                >
                  {translate("Consulter le Suivi dans mes Expéditions", "View Tracking in my Shipments")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedJob(null);
                    setRecipientName('');
                    setRecipientPhone('');
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs cursor-pointer"
                >
                  {translate("Commander une Autre Course", "Order Another Courier")}
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* ORDER CREATION FORM                                                       */
            /* ========================================================================= */
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Quick Template Selector */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>{translate("Suggestions Rapides de Colis", "Quick Parcel Templates")}</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUICK_TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/50 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-lg">{tmpl.icon}</div>
                      <h4 className="text-xs font-black text-white group-hover:text-violet-300 truncate mt-1">
                        {tmpl.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {tmpl.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Itinerary Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-black">
                      Point A : {pickupCommune}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                      Point B : {dropoffCommune}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Distance & Trajet</span>
                    <span className="font-mono font-black text-slate-200">
                      {distanceKm} km • ~{estimatedEtaMinutes} min
                    </span>
                  </div>
                  <div className="text-right px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/40">
                    <span className="text-[9px] uppercase font-bold text-violet-300 block">Tarif Estimé</span>
                    <span className="font-mono text-sm font-black text-white">
                      {calculatedFee.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>
              </div>

              {/* POINT A & POINT B TWO-COLUMN SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. POINT A: RAMASSAGE */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 font-black text-xs flex items-center justify-center">
                      A
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      {translate("Point A : Ramassage (Expéditeur)", "Point A: Pickup (Sender)")}
                    </h3>
                  </div>

                  {/* Commune A */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">
                      {translate("Commune de départ *", "Departure Commune *")}
                    </label>
                    <select
                      value={pickupCommune}
                      onChange={(e) => setPickupCommune(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-violet-500"
                    >
                      {ALL_COMMUNES.map(c => (
                        <option key={c.id} value={c.name}>{c.name} ({c.type === 'abidjan_intramuros' ? 'Abidjan' : 'Environs'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Adresse A */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">
                      {translate("Adresse / Quartier / Repère précis *", "Precise Address / Landmark *")}
                    </label>
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Ex: Angré 8e Tranche, Carrefour Duncan, Face Pharmacie"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      required
                    />
                  </div>

                  {/* Expéditeur Contact */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">
                        {translate("Nom de l'expéditeur", "Sender Name")}
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Votre nom"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">
                        {translate("Téléphone ramassage", "Pickup Phone")}
                      </label>
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="+225 07..."
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {/* Note pour le ramassage */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">
                      {translate("Instructions au coursier pour le ramassage", "Pickup Notes")}
                    </label>
                    <input
                      type="text"
                      value={senderNote}
                      onChange={(e) => setSenderNote(e.target.value)}
                      placeholder="Ex: Appeler au portail, appartement 2B..."
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* 2. POINT B: LIVRAISON */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                      B
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      {translate("Point B : Livraison (Destinataire)", "Point B: Dropoff (Recipient)")}
                    </h3>
                  </div>

                  {/* Commune B */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">
                      {translate("Commune de livraison *", "Destination Commune *")}
                    </label>
                    <select
                      value={dropoffCommune}
                      onChange={(e) => setDropoffCommune(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                    >
                      {ALL_COMMUNES.map(c => (
                        <option key={c.id} value={c.name}>{c.name} ({c.type === 'abidjan_intramuros' ? 'Abidjan' : 'Environs'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Adresse B */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">
                      {translate("Adresse / Rue / Repère de livraison *", "Delivery Address / Landmark *")}
                    </label>
                    <input
                      type="text"
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      placeholder="Ex: Plateau, Avenue Chardy, Immeuble Postel 2001, 3e étage"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  {/* Destinataire Contact */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">
                        {translate("Nom du destinataire *", "Recipient Name *")}
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Nom & Prénom"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">
                        {translate("Téléphone destinataire *", "Recipient Phone *")}
                      </label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+225 05..."
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Note pour la livraison */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">
                      {translate("Instructions au coursier pour la livraison", "Delivery Notes")}
                    </label>
                    <input
                      type="text"
                      value={recipientNote}
                      onChange={(e) => setRecipientNote(e.target.value)}
                      placeholder="Ex: Remettre à la réception, appeler 5 min avant..."
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* DÉTAILS DU COLIS & VÉHICULE */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Package className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    {translate("Détails du Colis & Type de Transport", "Parcel Details & Transport Type")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Description Colis */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400">
                      {translate("Contenu / Description du colis *", "Parcel Description *")}
                    </label>
                    <input
                      type="text"
                      value={packageDescription}
                      onChange={(e) => setPackageDescription(e.target.value)}
                      placeholder="Ex: Pochette de documents, sacoche d'ordinateur, boîte de chaussures..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  {/* Taille & Poids */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">
                      {translate("Gabarit du colis", "Parcel Size")}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPackageSize('document')}
                        className={`p-2 rounded-xl text-xs font-bold text-left transition-all border ${
                          packageSize === 'document' ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        📄 Pli (&lt; 1 kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackageSize('small')}
                        className={`p-2 rounded-xl text-xs font-bold text-left transition-all border ${
                          packageSize === 'small' ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        📦 Petit (1-3 kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackageSize('medium')}
                        className={`p-2 rounded-xl text-xs font-bold text-left transition-all border ${
                          packageSize === 'medium' ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        🧰 Moyen (3-7 kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPackageSize('large');
                          setRequiredVehicle('car');
                        }}
                        className={`p-2 rounded-xl text-xs font-bold text-left transition-all border ${
                          packageSize === 'large' ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        📦📦 Lourd (&gt; 7 kg)
                      </button>
                    </div>
                  </div>

                  {/* Véhicule Requis */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">
                      {translate("Véhicule Recommandé", "Recommended Vehicle")}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRequiredVehicle('moto')}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                          requiredVehicle === 'moto' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        <Bike className="w-4 h-4" />
                        <span>Moto Express</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequiredVehicle('car')}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                          requiredVehicle === 'car' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        <Car className="w-4 h-4" />
                        <span>Voiture / Break</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAYMENT MODE NOTICE: 100% CASH TO DRIVER, 0% COMMISSION */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0C1525] to-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 shadow-lg">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-white uppercase tracking-wider">
                      {translate("Paiement Physique Direct au Livreur", "Physical Direct Payment to Courier")}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                      0% Commission BRAD'CI
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11.5px]">
                    {translate(
                      "Le montant de la course est réglé en espèces (ou Mobile Money direct) directement au livreur à la livraison ou au ramassage. BRAD'CI ne prélève aucune commission sur vos courses directes de colis.",
                      "The delivery fee is paid in cash (or direct Mobile Money) directly to the courier upon delivery. BRAD'CI takes zero fee on your direct parcel trips."
                    )}
                  </p>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  id="btn-submit-express-courier-order"
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-violet-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>
                    {translate("COMMANDER LE COURSIER MAINTENANT", "ORDER COURIER NOW")} ({calculatedFee.toLocaleString('fr-FR')} FCFA)
                  </span>
                </button>
                <p className="text-center text-[10.5px] text-slate-400 mt-2">
                  {translate(
                    "Assignation instantanée au livreur vérifié le plus proche dans un rayon de 10 km.",
                    "Instant assignment to the nearest verified courier within 10 km."
                  )}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
