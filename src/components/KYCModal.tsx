import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  UserCheck, 
  Truck, 
  Bike,
  Car,
  Palette,
  Sparkles, 
  RotateCw,
  Eye,
  Lock,
  RefreshCw,
  Image as ImageIcon,
  User,
  Check,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';
import { UserRole, VehicleType } from '../types';
import { getTranslation } from '../utils/translations';
import { KYCDemoGuideModal } from './KYCDemoGuideModal';
import { verifyFacialBiometrics, BiometricCheckResult } from '../utils/biometricVerification';
import { 
  CNIVectorDrawing, 
  SelfieVectorDrawing, 
  SelfieWithCardVectorDrawing, 
  DriverLicenseVectorDrawing, 
  VehicleRegVectorDrawing, 
  KYC_DRAWING_DATA_URIS 
} from './KYCIllustrations';

interface KYCModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Authentic demonstration drawings conforming to fintech, banking & courier standards
const DEMO_KYC_PHOTOS = {
  cni: KYC_DRAWING_DATA_URIS.cni,
  selfie: KYC_DRAWING_DATA_URIS.selfie,
  selfieWithId: KYC_DRAWING_DATA_URIS.selfieWithId,
  driverLicense: KYC_DRAWING_DATA_URIS.driverLicense,
  driverLicenseVerso: KYC_DRAWING_DATA_URIS.driverLicense,
  driverLicenseSelfie: KYC_DRAWING_DATA_URIS.driverLicenseSelfie,
  vehicleReg: KYC_DRAWING_DATA_URIS.vehicleReg
};

// Popular vehicle models and presets used in Abidjan delivery fleets
interface VehiclePresetItem {
  model: string;
  brand: string;
  tag: string;
  badge?: string;
  defaultColor?: string;
}

const POPULAR_DELIVERY_VEHICLES: Record<string, {
  label: string;
  shortDesc: string;
  fleetCategory: string;
  icon: any;
  plateExample: string;
  suggestions: VehiclePresetItem[];
}> = {
  moto: {
    label: 'Moto / Scooter',
    shortDesc: 'Livraison Express colis légers, plis & repas (max 15 kg)',
    fleetCategory: 'Flotte BRAD\'CI Moto & Colis Express',
    icon: Bike,
    plateExample: '4523 JJ 01',
    suggestions: [
      { model: 'Yamaha Crypton 110', brand: 'Yamaha', tag: 'Standard N°1 Abidjan', badge: 'Top Vente', defaultColor: 'Noir & Rouge' },
      { model: 'Haojue 110cc Express', brand: 'Haojue', tag: 'Flotte Moto Express', badge: 'Flotte Recommandée', defaultColor: 'Bleu' },
      { model: 'TVS HLX 125 Plus', brand: 'TVS', tag: 'Robuste & Économique', badge: 'Recommandé', defaultColor: 'Rouge' },
      { model: 'Bajaj Boxer CT 100', brand: 'Bajaj', tag: 'Tout-terrain & Endurant', badge: 'Indestructible', defaultColor: 'Noir' },
      { model: 'Bajaj Boxer BM 150', brand: 'Bajaj', tag: 'Grande puissance', badge: 'Rapide', defaultColor: 'Bleu Nuit' },
      { model: 'Aloba 110', brand: 'Aloba', tag: 'Maniable dans le trafic', badge: 'Populaire', defaultColor: 'Noir & Blanc' },
      { model: 'Dayang DY 110', brand: 'Dayang', tag: 'Idéal courses quotidiennes', badge: 'Classique', defaultColor: 'Rouge' },
      { model: 'Honda Ace 125', brand: 'Honda', tag: 'Faible consommation', badge: 'Endurance', defaultColor: 'Gris' },
      { model: 'Suzuki Hayate 125', brand: 'Suzuki', tag: 'Scooter automatique', badge: 'Confort', defaultColor: 'Blanc' },
      { model: 'KTM Duke 125', brand: 'KTM', tag: 'Course ultra-rapide', badge: 'Sport', defaultColor: 'Orange & Noir' }
    ]
  },
  voiture: {
    label: 'Voiture / Citadine / Berline',
    shortDesc: 'Colis volumineux/sécurisés, écrans, pluie & haute valeur (max 80 kg)',
    fleetCategory: 'Flotte BRAD\'CI Auto & VTC Express',
    icon: Car,
    plateExample: '8912 KL 01',
    suggestions: [
      { model: 'Toyota Yaris', brand: 'Toyota', tag: 'Véhicule N°1 Abidjan Express', badge: '⭐ Top 1 Abidjan', defaultColor: 'Blanc' },
      { model: 'Hyundai Grand i10', brand: 'Hyundai', tag: 'Citadine économique', badge: 'Flotte Éco', defaultColor: 'Gris Argent' },
      { model: 'Suzuki Swift / Dzire', brand: 'Suzuki', tag: 'Flottes récentes Abidjan', badge: 'Très Populaire', defaultColor: 'Blanc' },
      { model: 'Suzuki Alto / S-Presso', brand: 'Suzuki', tag: 'Ultra maniable & Agile', badge: 'Compact', defaultColor: 'Bleu' },
      { model: 'Toyota Corolla', brand: 'Toyota', tag: 'Grand coffre sécurisé', badge: 'Confort Pro', defaultColor: 'Gris Métal' },
      { model: 'Toyota Starlet / Vitz', brand: 'Toyota', tag: 'Économique & Fiable', badge: 'Urbain', defaultColor: 'Noir' },
      { model: 'Kia Picanto', brand: 'Kia', tag: 'Facile à garer au Plateau', badge: 'Maniable', defaultColor: 'Rouge' },
      { model: 'Renault Logan / Sandero', brand: 'Renault', tag: 'Grand volume de malle', badge: 'Spacieux', defaultColor: 'Blanc' },
      { model: 'Peugeot 208 / 301', brand: 'Peugeot', tag: 'Idéal livraisons pro', badge: 'Sécurisé', defaultColor: 'Gris' },
      { model: 'Nissan Micra / Almera', brand: 'Nissan', tag: 'Moteur endurant', badge: 'Fiable', defaultColor: 'Blanc' }
    ]
  },
  cargo: {
    label: 'Cargo / Fourgon / Tricycle',
    shortDesc: 'Électroménager lourd, palettes, mobilier & cartons B2B',
    fleetCategory: 'Flotte BRAD\'CI Cargo & Fret Lourd Urbain',
    icon: Truck,
    plateExample: 'CI-3920-AB',
    suggestions: [
      { model: 'Tricycle Haojue 200cc Cargo', brand: 'Haojue', tag: 'Benne renforcée Adjamé', badge: 'Standard Marché', defaultColor: 'Bleu' },
      { model: 'Tricycle TVS King Cargo', brand: 'TVS', tag: 'Cabine fermée anti-pluie', badge: 'Sécurisé', defaultColor: 'Jaune' },
      { model: 'Peugeot Partner Fourgon', brand: 'Peugeot', tag: 'Fourgonnette grand volume', badge: 'Pro Logistique', defaultColor: 'Blanc' },
      { model: 'Renault Kangoo Express', brand: 'Renault', tag: 'Utilitaire urbain fermé', badge: 'Polyvalent', defaultColor: 'Blanc' },
      { model: 'Toyota Hilux Pick-up', brand: 'Toyota', tag: 'Plateau tout-terrain', badge: 'Fret Lourd', defaultColor: 'Gris' },
      { model: 'Hyundai H-100 Cargo', brand: 'Hyundai', tag: 'Camionnette gros volume', badge: 'Maxi Charge', defaultColor: 'Blanc' },
      { model: 'Suzuki Super Carry', brand: 'Suzuki', tag: 'Mini-camionnette compacte', badge: 'Agile', defaultColor: 'Blanc' }
    ]
  }
};

export const KYCModal: React.FC<KYCModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const { 
    currentUser, 
    submitKYC, 
    language, 
    translate,
    addToast,
    kycModalOpen,
    setKycModalOpen
  } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : kycModalOpen;
  const onClose = propOnClose || (() => setKycModalOpen(false));

  const isDriver = currentUser?.role === 'driver';
  // Buyer / Seller: 3 steps | Driver: 4 steps
  const totalSteps = isDriver ? 4 : 3;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [docType, setDocType] = useState<'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire'>('cni');
  const [docNumber, setDocNumber] = useState<string>(currentUser?.kycDocumentNumber || 'CI003928174');
  
  // Captured or uploaded photos
  const [docPhoto, setDocPhoto] = useState<string>(currentUser?.kycPhotoUrl || '');
  const [selfiePhoto, setSelfiePhoto] = useState<string>(currentUser?.kycSelfieUrl || '');
  const [selfieWithIdPhoto, setSelfieWithIdPhoto] = useState<string>(currentUser?.kycSelfieWithIdUrl || '');
  const [driverLicensePhoto, setDriverLicensePhoto] = useState<string>(currentUser?.kycDriverLicenseUrl || '');
  const [driverLicenseVersoPhoto, setDriverLicenseVersoPhoto] = useState<string>(currentUser?.kycDriverLicenseVersoUrl || '');
  const [vehicleRegPhoto, setVehicleRegPhoto] = useState<string>(currentUser?.kycVehicleRegistrationUrl || '');
  
  // Driver Vehicle Details (Matricule, Couleur, Modèle, Type)
  const [vehiclePlate, setVehiclePlate] = useState<string>(currentUser?.kycVehiclePlate || currentUser?.vehicleDetails?.plate || '4523 JJ 01');
  const [vehicleColor, setVehicleColor] = useState<string>(currentUser?.kycVehicleColor || currentUser?.vehicleDetails?.color || 'Noir & Rouge');
  const [vehicleModel, setVehicleModel] = useState<string>(currentUser?.kycVehicleModel || currentUser?.vehicleDetails?.model || 'Yamaha Crypton 110');
  const [vehicleType, setVehicleType] = useState<VehicleType>(currentUser?.kycVehicleType || currentUser?.vehicleDetails?.type || 'moto');

  // Reset steps if modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoGuideOpen, setDemoGuideOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyDemoPhotoFromGuide = (type: string, url: string, docNum?: string) => {
    if (type === 'cni') {
      setDocPhoto(url);
      if (docNum) setDocNumber(docNum);
    } else if (type === 'selfie') {
      setSelfiePhoto(url);
    } else if (type === 'selfieWithId') {
      setSelfieWithIdPhoto(url);
    } else if (type === 'driverLicense') {
      setDriverLicensePhoto(url);
      if (docNum) setDocNumber(docNum);
    } else if (type === 'driverLicenseSelfie') {
      setSelfieWithIdPhoto(url);
    } else if (type === 'vehicleReg') {
      setVehicleRegPhoto(url);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Switch between front and back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Start Camera Stream
  const startCamera = async (overrideFacingMode?: 'user' | 'environment') => {
    setCameraError(null);
    stopCamera();

    const targetMode = overrideFacingMode || facingMode;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: targetMode, 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
        
        streamRef.current = stream;
        setIsCameraActive(true);

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.warn("Video play warning:", e));
          }
        }, 100);
      } else {
        setCameraError(translate(
          "Caméra non disponible sur ce navigateur. Utilisez le bouton 'Importer depuis la galerie' ou 'Photo Démo'.",
          "Camera not available. Please use 'Upload from gallery' or 'Demo Photo'."
        ));
      }
    } catch (err) {
      console.warn("getUserMedia error:", err);
      setCameraError(translate(
        "Accès caméra refusé. Utilisez l'importation de fichier ou le guide démo.",
        "Camera access denied. Please use file upload or demo guide."
      ));
    }
  };

  // Capture frame from video to canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        assignPhotoForCurrentStep(dataUrl);
        stopCamera();
        addToast(
          translate('Photo capturée avec succès', 'Photo captured successfully'),
          translate('Votre photo a été enregistrée pour cette étape.', 'Your photo has been recorded for this step.'),
          'success'
        );
      }
    } catch (e) {
      console.error("Capture photo error:", e);
      setCameraError("Erreur lors de la capture.");
    }
  };

  // Handle manual file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          assignPhotoForCurrentStep(event.target.result as string);
          addToast(
            translate('Photo importée', 'Photo imported'),
            translate('Le fichier est prêt pour la vérification.', 'File ready for verification.'),
            'success'
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const assignPhotoForCurrentStep = (url: string) => {
    setErrorMessage(null);
    if (!isDriver) {
      if (currentStep === 1) setDocPhoto(url);
      else if (currentStep === 2) setSelfiePhoto(url);
      else if (currentStep === 3) setSelfieWithIdPhoto(url);
    } else {
      if (currentStep === 1) setDocPhoto(url);
      else if (currentStep === 2) setSelfieWithIdPhoto(url);
      else if (currentStep === 3) {
        if (!driverLicensePhoto) setDriverLicensePhoto(url);
        else setDriverLicenseVersoPhoto(url);
      }
      else if (currentStep === 4) setVehicleRegPhoto(url);
    }
  };

  const getCurrentStepPhoto = () => {
    if (!isDriver) {
      if (currentStep === 1) return docPhoto;
      if (currentStep === 2) return selfiePhoto;
      if (currentStep === 3) return selfieWithIdPhoto;
    } else {
      if (currentStep === 1) return docPhoto;
      if (currentStep === 2) return selfieWithIdPhoto;
      if (currentStep === 3) return driverLicensePhoto;
      if (currentStep === 4) return vehicleRegPhoto;
    }
    return '';
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return Boolean(docPhoto) && docNumber.trim().length >= 4;
    }
    if (!isDriver) {
      if (currentStep === 2) return Boolean(selfiePhoto);
      if (currentStep === 3) return Boolean(selfieWithIdPhoto);
    } else {
      if (currentStep === 2) return Boolean(selfieWithIdPhoto);
      if (currentStep === 3) return Boolean(driverLicensePhoto);
      if (currentStep === 4) return Boolean(vehicleRegPhoto) && vehiclePlate.trim().length >= 3;
    }
    return false;
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      stopCamera();
      setCurrentStep(prev => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      stopCamera();
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // AI Biometric Check
    const bioResult = await verifyFacialBiometrics(
      selfiePhoto || selfieWithIdPhoto || DEMO_KYC_PHOTOS.selfie,
      docPhoto || DEMO_KYC_PHOTOS.cni
    );

    if (!bioResult.success) {
      setIsSubmitting(false);
      setErrorMessage(language === 'en' ? (bioResult.errorMessageEn || bioResult.errorMessage) : bioResult.errorMessage);
      return;
    }

    const result = submitKYC({
      docType,
      docNumber: docNumber || 'CI003928174',
      photoUrl: docPhoto || DEMO_KYC_PHOTOS.cni,
      selfieUrl: selfiePhoto || DEMO_KYC_PHOTOS.selfie,
      driverLicenseUrl: driverLicensePhoto || (isDriver ? DEMO_KYC_PHOTOS.driverLicense : undefined),
      driverLicenseSelfieUrl: selfieWithIdPhoto || (isDriver ? DEMO_KYC_PHOTOS.driverLicenseSelfie : undefined),
      vehicleRegistrationUrl: vehicleRegPhoto || (isDriver ? DEMO_KYC_PHOTOS.vehicleReg : undefined),
      vehiclePlate: isDriver ? vehiclePlate.trim().toUpperCase() : undefined,
      vehicleColor: isDriver ? vehicleColor.trim() : undefined,
      vehicleModel: isDriver ? vehicleModel.trim() : undefined,
      vehicleType: isDriver ? vehicleType : undefined
    });

    setIsSubmitting(false);

    if (result.success) {
      stopCamera();
      onClose();
      addToast(
        translate('Dossier KYC Soumis', 'KYC Dossier Submitted'),
        translate('Votre dossier est en cours de validation par nos agents (Délai moyen : 15 à 30 minutes).', 'Your dossier is being reviewed by compliance officers (Average time: 15-30 min).'),
        'success'
      );
    } else {
      setErrorMessage(result.message);
    }
  };

  const stepTitles = isDriver ? [
    translate("1. Pièce d'Identité Officielle (CNI / Passeport)", "1. Official ID Document (CNI / Passport)"),
    translate("2. Selfie Tenant la Pièce d'Identité", "2. Live Selfie Holding ID Document"),
    translate("3. Permis de Conduire (Recto / Verso)", "3. Driver's License (Front / Back)"),
    translate("4. Carte Grise & Engin de Livraison (Moto / Voiture / Cargo)", "4. Vehicle Registration & Delivery Asset (Motorcycle / Car / Cargo)")
  ] : [
    translate("1. Pièce d'Identité Officielle (CNI / Passeport / Carte Consulaire)", "1. Official ID Document (CNI / Passport / Consular Card)"),
    translate("2. Selfie Simple en Direct", "2. Simple Live Selfie"),
    translate("3. Selfie Tenant la Pièce d'Identité", "3. Live Selfie Holding ID Document")
  ];

  const stepInstructions = isDriver ? [
    translate("Prenez en photo ou importez le recto de votre CNI ou Passeport.", "Take a photo or upload the front of your National ID or Passport."),
    translate("Prenez un selfie tenant votre pièce d'identité bien visible à côté de votre visage.", "Take a selfie holding your ID clearly visible next to your face."),
    translate("Prenez en photo votre permis de conduire ivoirien valide (Catégorie A moto, B auto ou C cargo).", "Take a photo of your valid Ivorian driver's license (Cat A bike, B car or C cargo)."),
    translate("Déclarez votre véhicule (suggestions Abidjan Express) et prenez en photo votre carte grise.", "Declare your vehicle (Abidjan Express presets) and photograph your registration certificate.")
  ] : [
    translate("Prenez en photo ou importez le recto de votre CNI, passeport ou carte consulaire.", "Take a photo or import the front of your ID card, passport or consular card."),
    translate("Prenez un selfie simple de face, bien éclairé, sans lunettes de soleil ni chapeau.", "Take a clear front-facing selfie in good lighting, without sunglasses or hat."),
    translate("Prenez un selfie tenant votre pièce d'identité bien visible à côté de votre visage.", "Take a selfie holding your ID clearly visible next to your face.")
  ];

  const currentPhoto = getCurrentStepPhoto();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="kyc-modal-container"
        className="w-full max-w-xl bg-[#0B111E] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Glow Top Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* Close Button */}
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-display">
            {translate("Certification d'Identité KYC BRAD'CI", "BRAD'CI KYC Identity Verification")}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isDriver 
              ? translate("Vérification en 4 étapes pour Livreurs Express Agréés", "4-Step Verification for Express Couriers") 
              : translate("Vérification en 3 étapes pour Acheteurs et Vendeurs", "3-Step Verification for Buyers and Sellers")}
          </p>

          {/* Guide & Demo Modal Trigger */}
          <button
            type="button"
            onClick={() => setDemoGuideOpen(true)}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-105"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>{translate("📸 Guide Visuel de Prise en Photo", "📸 Visual Photo Guide")}</span>
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-between gap-1.5 mb-5 px-1">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div 
                key={idx} 
                className={`flex-1 h-2 rounded-full transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' 
                    : isCurrent 
                    ? 'bg-amber-500 ring-2 ring-amber-500/30' 
                    : 'bg-slate-800'
                }`}
                title={`Étape ${stepNum}`}
              />
            );
          })}
        </div>

        {/* Step Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {translate("Étape", "Step")} {currentStep} {translate("sur", "of")} {totalSteps}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {(!isDriver && (currentStep === 2 || currentStep === 3)) || (isDriver && currentStep === 2)
                ? translate("Mode Selfie", "Selfie Mode") 
                : translate("Mode Document", "Document Mode")}
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-white mt-1">
            {stepTitles[currentStep - 1]}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {stepInstructions[currentStep - 1]}
          </p>
        </div>

        {/* Vector Drawing Exemplary Guide Banner for current step */}
        <div className="mb-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Exemple de cadrage conforme (Dessin vectoriel professionnel)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                let sampleUri = KYC_DRAWING_DATA_URIS.cni;
                if (!isDriver) {
                  if (currentStep === 1) sampleUri = KYC_DRAWING_DATA_URIS.cni;
                  else if (currentStep === 2) sampleUri = KYC_DRAWING_DATA_URIS.selfie;
                  else if (currentStep === 3) sampleUri = KYC_DRAWING_DATA_URIS.selfieWithId;
                } else {
                  if (currentStep === 1) sampleUri = KYC_DRAWING_DATA_URIS.cni;
                  else if (currentStep === 2) sampleUri = KYC_DRAWING_DATA_URIS.selfie;
                  else if (currentStep === 3) sampleUri = KYC_DRAWING_DATA_URIS.driverLicense;
                  else if (currentStep === 4) sampleUri = KYC_DRAWING_DATA_URIS.vehicleReg;
                }
                if (currentStep === 1) setDocPhoto(sampleUri);
                else if (currentStep === 2) setSelfiePhoto(sampleUri);
                else if (currentStep === 3) {
                  if (isDriver) setDriverLicensePhoto(sampleUri);
                  else setSelfieWithIdPhoto(sampleUri);
                } else if (currentStep === 4 && isDriver) {
                  setVehicleRegPhoto(sampleUri);
                }
              }}
              className="text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold transition-all flex items-center gap-1"
            >
              <span>⚡ Utiliser cet exemple</span>
            </button>
          </div>

          <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-1 flex items-center justify-center">
            {currentStep === 1 && <CNIVectorDrawing className="w-full max-w-sm h-32" isGood={true} />}
            {!isDriver && currentStep === 2 && <SelfieVectorDrawing className="w-full max-w-sm h-32" isGood={true} />}
            {!isDriver && currentStep === 3 && <SelfieWithCardVectorDrawing className="w-full max-w-sm h-32" isGood={true} />}
            {isDriver && currentStep === 2 && <SelfieVectorDrawing className="w-full max-w-sm h-32" isGood={true} />}
            {isDriver && currentStep === 3 && <DriverLicenseVectorDrawing className="w-full max-w-sm h-32" isGood={true} />}
            {isDriver && currentStep === 4 && <VehicleRegVectorDrawing vehicleType={vehicleType} className="w-full max-w-sm h-32" isGood={true} />}
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-200">{translate("Refus de validation / Non-conformité :", "Validation Issue / Rejection:")}</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Step 1 Specific: Document Type and Number */}
        {currentStep === 1 && (
          <div className="space-y-3 mb-4 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5">
                {translate("Type de document d'identité :", "Identity document type:")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cni', label: 'CNI Ivoirienne' },
                  { id: 'passeport', label: 'Passeport' },
                  { id: isDriver ? 'attestation' : 'carte_consulaire', label: isDriver ? 'Attestation ONECI' : 'Carte Consulaire' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDocType(item.id as any)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      docType === item.id 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                {translate("Numéro de la pièce d'identité (Recherche anti-doublon) :", "Document ID number (Anti-duplicate search):")}
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                placeholder="Ex: C011829482"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 4 Specific for Driver: Vehicle Registration, Plate, Color & Vehicle Model Presets */}
        {isDriver && currentStep === 4 && (
          <div className="space-y-4 mb-4 p-4 bg-slate-950/80 rounded-2xl border border-amber-500/30">
            {/* Header with Title & Context */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                {vehicleType === 'voiture' || vehicleType === 'car' ? (
                  <Car className="w-4 h-4 text-amber-400" />
                ) : vehicleType === 'cargo' ? (
                  <Truck className="w-4 h-4 text-purple-400" />
                ) : (
                  <Bike className="w-4 h-4 text-emerald-400" />
                )}
                <span>{translate("Déclaration & Matériel de Livraison (Flotte Abidjan)", "Delivery Vehicle & Asset Declaration (Abidjan Fleet)")}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                ✓ Conforme BRAD'CI
              </span>
            </div>

            {/* Vehicle Type Selection (3 Categories: Moto, Voiture, Cargo) */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
                <span>{translate("Type d'engin de livraison :", "Delivery vehicle category:")}</span>
                <span className="text-[10px] text-slate-400 font-normal">{translate("Sélectionnez pour charger les suggestions adaptées", "Select to load matching presets")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { 
                    id: 'moto', 
                    label: 'Moto / Scooter', 
                    sub: 'Moto & Colis Flash (≤ 15 kg)', 
                    icon: Bike,
                    activeColor: 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  },
                  { 
                    id: 'voiture', 
                    label: 'Voiture / Citadine', 
                    sub: 'Voiture & Colis Fragile (≤ 80 kg)', 
                    icon: Car,
                    activeColor: 'bg-amber-500/20 border-amber-500 text-amber-300'
                  },
                  { 
                    id: 'cargo', 
                    label: 'Cargo / Fourgon', 
                    sub: 'Camionnette & Fret Lourd B2B', 
                    icon: Truck,
                    activeColor: 'bg-purple-500/20 border-purple-500 text-purple-300'
                  }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const newType = item.id as VehicleType;
                      setVehicleType(newType);
                      // Set a default representative model if currently matching previous type default
                      const defaultSuggest = POPULAR_DELIVERY_VEHICLES[newType]?.suggestions[0];
                      if (defaultSuggest) {
                        setVehicleModel(defaultSuggest.model);
                        if (!vehicleColor || vehicleColor === 'Noir & Rouge' || vehicleColor === 'Blanc') {
                          if (defaultSuggest.defaultColor) setVehicleColor(defaultSuggest.defaultColor);
                        }
                      }
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      (vehicleType === item.id || (item.id === 'voiture' && vehicleType === 'car'))
                        ? `${item.activeColor} shadow-md` 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="font-bold text-xs">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Suggestions of Popular Models for Abidjan */}
            {POPULAR_DELIVERY_VEHICLES[vehicleType === 'car' ? 'voiture' : vehicleType] && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {translate("Modèles recommandés Abidjan (Cliquez pour appliquer) :", "Recommended Abidjan models (Click to apply):")}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {POPULAR_DELIVERY_VEHICLES[vehicleType === 'car' ? 'voiture' : vehicleType].fleetCategory}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto pr-1">
                  {POPULAR_DELIVERY_VEHICLES[vehicleType === 'car' ? 'voiture' : vehicleType].suggestions.map(s => {
                    const isSelected = vehicleModel.toLowerCase() === s.model.toLowerCase();
                    return (
                      <button
                        key={s.model}
                        type="button"
                        onClick={() => {
                          setVehicleModel(s.model);
                          if (s.defaultColor && (!vehicleColor || vehicleColor.trim() === '')) {
                            setVehicleColor(s.defaultColor);
                          }
                          addToast(
                            translate('Modèle appliqué', 'Model applied'),
                            `${s.model} (${s.tag})`,
                            'info'
                          );
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-left ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:text-white'
                        }`}
                      >
                        <span>{s.model}</span>
                        {s.badge && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                            isSelected 
                              ? 'bg-slate-950/20 text-slate-950' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {s.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Model & Brand text input */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                {translate("Marque & Modèle de l'engin sélectionné * :", "Brand & Model of declared vehicle *:")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Ex: Yamaha Crypton 110, Toyota Yaris, TVS HLX 125..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-amber-500 focus:outline-none"
                />
                {vehicleModel && (
                  <span className="absolute right-3 top-2 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Validé</span>
                  </span>
                )}
              </div>
            </div>

            {/* Plate (Matricule) & Color in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Plate / Matricule */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-300 font-bold">
                    {translate("Plaque d'immatriculation * :", "License Plate / Registration *:")}
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">Format CI</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="Ex: 4523 JJ 01 ou CI-3920-AB"
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 uppercase font-mono font-bold tracking-wider focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    🇨🇮 CI
                  </span>
                </div>
                {/* Plate quick format presets */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-500">Exemples :</span>
                  {['4523 JJ 01', '8912 KL 01', 'CI-3920-AB'].map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setVehiclePlate(ex)}
                      className="text-[10px] text-slate-400 hover:text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Color */}
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  {translate("Couleur de l'engin * :", "Vehicle Color *:")}
                </label>
                <input
                  type="text"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  placeholder="Ex: Noir & Rouge, Blanc, Gris Argent"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                {/* Quick color chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Noir', 'Blanc', 'Rouge', 'Bleu', 'Gris', 'Jaune', 'Noir & Rouge'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setVehicleColor(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                        vehicleColor === c 
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Client Preview Badge */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{translate("Aperçu client :", "Client view:")}</span>
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {vehicleType === 'voiture' || vehicleType === 'car' ? (
                    <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : vehicleType === 'cargo' ? (
                    <Truck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  ) : (
                    <Bike className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-white font-bold text-xs">{currentUser?.name || 'Livreur'}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400 font-semibold">{vehicleModel || 'Engin'}</span>
                  <span className="text-amber-400 font-mono text-[11px]">({vehiclePlate || 'Immatriculé'})</span>
                  <span className="text-slate-400 text-[11px]">• {vehicleColor || 'Couleur'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Central View: Live Camera OR Captured Photo Preview */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-emerald-500 shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Framing */}
              <div className="absolute inset-0 m-4 rounded-xl border-2 border-dashed border-emerald-400/80 pointer-events-none flex items-center justify-center bg-emerald-500/5">
                <span className="text-[10px] text-white font-bold bg-black/70 px-2.5 py-0.5 rounded-full">
                  {(!isDriver && (currentStep === 2 || currentStep === 3)) || (isDriver && currentStep === 2)
                    ? translate("Cadrez votre visage", "Center your face") 
                    : translate("Cadrez le document", "Center the document")}
                </span>
              </div>

              {/* Controls bar inside camera view */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-xl bg-black/60 text-slate-200 border border-white/20 hover:bg-black/80 transition-colors"
                  title="Changer de caméra"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>{translate("Capturer", "Capture")}</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-2 rounded-xl bg-black/60 text-rose-400 border border-white/20 hover:bg-black/80 transition-colors"
                  title="Fermer la caméra"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              {currentPhoto ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/50 p-2 text-center space-y-2">
                  <img
                    src={currentPhoto}
                    alt={`Étape ${currentStep}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover rounded-xl"
                  />
                  <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{translate("Photo Prête & Conforme", "Photo Ready & Compliant")}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 text-center space-y-2">
                  <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">
                    {translate("Aucune photo prise pour cette étape", "No photo captured for this step yet")}
                  </p>
                </div>
              )}
            </div>
          )}

          {cameraError && (
            <p className="text-[11px] text-amber-400 text-center mt-2">{cameraError}</p>
          )}

          {/* Action triggers */}
          {!isCameraActive && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => startCamera('user')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>{translate("Prendre Photo (Caméra)", "Take Photo (Camera)")}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>{translate("Choisir dans la Galerie", "Choose from Gallery")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  let sampleUri = KYC_DRAWING_DATA_URIS.cni;
                  if (!isDriver) {
                    if (currentStep === 1) sampleUri = KYC_DRAWING_DATA_URIS.cni;
                    else if (currentStep === 2) sampleUri = KYC_DRAWING_DATA_URIS.selfie;
                    else if (currentStep === 3) sampleUri = KYC_DRAWING_DATA_URIS.selfieWithId;
                  } else {
                    if (currentStep === 1) sampleUri = KYC_DRAWING_DATA_URIS.cni;
                    else if (currentStep === 2) sampleUri = KYC_DRAWING_DATA_URIS.selfie;
                    else if (currentStep === 3) sampleUri = KYC_DRAWING_DATA_URIS.driverLicense;
                    else if (currentStep === 4) sampleUri = KYC_DRAWING_DATA_URIS.vehicleReg;
                  }
                  if (currentStep === 1) setDocPhoto(sampleUri);
                  else if (currentStep === 2) setSelfiePhoto(sampleUri);
                  else if (currentStep === 3) {
                    if (isDriver) setDriverLicensePhoto(sampleUri);
                    else setSelfieWithIdPhoto(sampleUri);
                  } else if (currentStep === 4 && isDriver) {
                    setVehicleRegPhoto(sampleUri);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Appliquer le schéma vectoriel d'exemple conforme"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{translate("Appliquer Dessin Conforme", "Apply Compliant Drawing")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 disabled:opacity-40 transition-colors"
          >
            {translate("Précédent", "Previous")}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-900/30 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{translate("Analyse Biométrique IA...", "AI Biometric Check...")}</span>
                </>
              ) : (
                <>
                  <span>{currentStep < totalSteps ? translate("Étape Suivante", "Next Step") : translate("Soumettre le Dossier", "Submit Dossier")}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dedicated Visual Guide Component Overlay */}
        <KYCDemoGuideModal 
          isOpen={demoGuideOpen} 
          onClose={() => setDemoGuideOpen(false)}
          onApplyDemoPhoto={handleApplyDemoPhotoFromGuide}
        />
      </div>
    </div>
  );
};
