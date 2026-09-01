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
  ArrowRight
} from 'lucide-react';
import { UserRole, VehicleType } from '../types';
import { getTranslation } from '../utils/translations';
import { KYCDemoGuideModal } from './KYCDemoGuideModal';
import { verifyFacialBiometrics, BiometricCheckResult } from '../utils/biometricVerification';

interface KYCModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Authentic demonstration photos for easy testing without camera hardware constraints
const DEMO_KYC_PHOTOS = {
  cni: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  selfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  selfieWithId: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
  driverLicense: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
  driverLicenseVerso: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
  driverLicenseSelfie: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  vehicleReg: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80'
};

export const KYCModal: React.FC<KYCModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const { 
    currentUser, 
    submitKYC, 
    adminInstantApproveMyKYC, 
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

  const handleUseDemoPhoto = () => {
    if (!isDriver) {
      if (currentStep === 1) setDocPhoto(DEMO_KYC_PHOTOS.cni);
      else if (currentStep === 2) setSelfiePhoto(DEMO_KYC_PHOTOS.selfie);
      else if (currentStep === 3) setSelfieWithIdPhoto(DEMO_KYC_PHOTOS.selfieWithId);
    } else {
      if (currentStep === 1) setDocPhoto(DEMO_KYC_PHOTOS.cni);
      else if (currentStep === 2) setSelfieWithIdPhoto(DEMO_KYC_PHOTOS.driverLicenseSelfie);
      else if (currentStep === 3) {
        setDriverLicensePhoto(DEMO_KYC_PHOTOS.driverLicense);
        setDriverLicenseVersoPhoto(DEMO_KYC_PHOTOS.driverLicenseVerso);
      }
      else if (currentStep === 4) setVehicleRegPhoto(DEMO_KYC_PHOTOS.vehicleReg);
    }
    if (!docNumber) setDocNumber('CI003928174');
    addToast(
      translate('Photo démo chargée', 'Demo photo loaded'),
      translate('Exemple officiel appliqué pour cette étape.', 'Official sample applied for this step.'),
      'info'
    );
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
    translate("4. Carte Grise du Véhicule (Moto / Fourgon)", "4. Vehicle Registration Certificate (Motorcycle / Cargo)")
  ] : [
    translate("1. Pièce d'Identité Officielle (CNI / Passeport / Carte Consulaire)", "1. Official ID Document (CNI / Passport / Consular Card)"),
    translate("2. Selfie Simple en Direct", "2. Simple Live Selfie"),
    translate("3. Selfie Tenant la Pièce d'Identité", "3. Live Selfie Holding ID Document")
  ];

  const stepInstructions = isDriver ? [
    translate("Prenez en photo ou importez le recto de votre CNI ou Passeport.", "Take a photo or upload the front of your National ID or Passport."),
    translate("Prenez un selfie tenant votre pièce d'identité bien visible à côté de votre visage.", "Take a selfie holding your ID clearly visible next to your face."),
    translate("Prenez en photo votre permis de conduire ivoirien valide.", "Take a photo of your valid Ivorian driver's license."),
    translate("Prenez en photo la carte grise du véhicule utilisé pour vos livraisons.", "Take a photo of the registration certificate of your delivery vehicle.")
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
            <span>{translate("📸 Guide & Démo Visuelle de Prise en Photo", "📸 Visual Photo Guide & Demo")}</span>
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

        {/* Step 4 Specific for Driver: Vehicle Registration, Plate & Color Information */}
        {isDriver && currentStep === 4 && (
          <div className="space-y-3 mb-4 p-3 bg-slate-950/70 rounded-2xl border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold pb-2 border-b border-slate-800">
              <Bike className="w-4 h-4" />
              <span>{translate("Identification du Véhicule ou Moto de Livraison", "Delivery Vehicle / Motorcycle Identification")}</span>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5">
                {translate("Type d'engin :", "Vehicle type:")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'moto', label: 'Moto / Scooter', icon: Bike },
                  { id: 'cargo', label: 'Cargo / Fourgon / Tricycle', icon: Truck }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVehicleType(item.id as VehicleType)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      vehicleType === item.id 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Plate (Matricule) & Color in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  {translate("Matricule / Plaque d'immatriculation * :", "License Plate / Registration *:")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="Ex: 4523 JJ 01 ou CI-3920-AB"
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 uppercase font-mono font-bold tracking-wider focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-amber-500/60 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    CI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {translate("Visible par le vendeur et l'acheteur lors des livraisons.", "Visible to buyer and seller during deliveries.")}
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  {translate("Couleur du véhicule / moto * :", "Vehicle / Motorcycle Color *:")}
                </label>
                <input
                  type="text"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  placeholder="Ex: Noir & Rouge, Bleu Nuit, Blanc"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                {/* Quick color chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Noir', 'Rouge', 'Bleu', 'Blanc', 'Gris', 'Noir & Rouge'].map(c => (
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

            {/* Model input */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                {translate("Marque / Modèle de l'engin :", "Brand / Model of vehicle:")}
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Ex: Yamaha Crypton 110, TVS HLX 150, Boxer BM 150"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
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
                onClick={handleUseDemoPhoto}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{translate("Photo Démo (1-Clic)", "Demo Photo (1-Click)")}</span>
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
