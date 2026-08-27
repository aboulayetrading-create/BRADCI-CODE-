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
  Car, 
  Sparkles, 
  RotateCw,
  Eye,
  Lock,
  RefreshCw,
  Image as ImageIcon,
  User,
  Check,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { UserRole } from '../types';
import { getTranslation } from '../utils/translations';
import { KYCDemoGuideModal } from './KYCDemoGuideModal';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Authentic demonstration photos for easy testing without camera hardware constraints
const DEMO_KYC_PHOTOS = {
  cni: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  selfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  driverLicense: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
  driverLicenseSelfie: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  vehicleReg: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80'
};

export const KYCModal: React.FC<KYCModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    submitKYC, 
    adminInstantApproveMyKYC, 
    language, 
    translate,
    addToast 
  } = useApp();

  const isDriver = currentUser?.role === 'driver';
  const totalSteps = isDriver ? 5 : 2;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [docType, setDocType] = useState<'cni' | 'passeport' | 'attestation' | 'permis'>('cni');
  const [docNumber, setDocNumber] = useState<string>(currentUser?.kycDocumentNumber || 'CI003928174');
  
  // Captured or uploaded photos
  const [docPhoto, setDocPhoto] = useState<string>(currentUser?.kycPhotoUrl || '');
  const [selfiePhoto, setSelfiePhoto] = useState<string>(currentUser?.kycSelfieUrl || '');
  const [driverLicensePhoto, setDriverLicensePhoto] = useState<string>(currentUser?.kycDriverLicenseUrl || '');
  const [driverLicenseSelfiePhoto, setDriverLicenseSelfiePhoto] = useState<string>(currentUser?.kycDriverLicenseSelfieUrl || '');
  const [vehicleRegPhoto, setVehicleRegPhoto] = useState<string>(currentUser?.kycVehicleRegistrationUrl || '');

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

  const handleApplyDemoPhotoFromGuide = (type: 'cni' | 'selfie' | 'driverLicense' | 'driverLicenseSelfie' | 'vehicleReg', url: string, docNum?: string) => {
    if (type === 'cni') {
      setDocPhoto(url);
      if (docNum) setDocNumber(docNum);
    } else if (type === 'selfie') {
      setSelfiePhoto(url);
    } else if (type === 'driverLicense') {
      setDriverLicensePhoto(url);
      if (docNum) setDocNumber(docNum);
    } else if (type === 'driverLicenseSelfie') {
      setDriverLicenseSelfiePhoto(url);
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
            videoRef.current.play().catch(e => {
              console.warn("Video play error:", e);
            });
          }
        }, 100);
      } else {
        setCameraError(translate(
          "La caméra n'est pas supportée dans cet environnement. Veuillez importer une photo depuis votre appareil.",
          "Camera is not supported in this environment. Please import a photo from your device."
        ));
      }
    } catch (err: any) {
      console.warn("getUserMedia error:", err);
      setCameraError(translate(
        "Accès à la caméra refusé ou non disponible. Utilisez le bouton 'Importer depuis l'appareil' ou 'Photo Démo'.",
        "Camera access denied or unavailable. Use the 'Import from device' or 'Demo Photo' button."
      ));
    }
  };

  // Set default camera facing mode based on step
  useEffect(() => {
    if (currentStep === 2 || currentStep === 4) {
      setFacingMode('user');
    } else {
      setFacingMode('environment');
    }
  }, [currentStep]);

  // Clean up camera stream on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen || !currentUser) return null;

  // Capture Image from Video
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
          translate('Votre photo a été enregistrée pour cette étape.', 'Your photo has been saved for this step.'),
          'success'
        );
      }
    } catch (e) {
      console.error("Capture photo error:", e);
      setCameraError("Erreur lors de la capture. Veuillez importer le fichier directement.");
    }
  };

  // File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          assignPhotoForCurrentStep(event.target.result as string);
          addToast(
            translate('Photo importée', 'Photo imported'),
            translate('Le fichier sélectionné est affiché et prêt pour vérification.', 'Selected file is displayed and ready for verification.'),
            'success'
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Use Demo Photo for quick 1-click test
  const handleUseDemoPhoto = () => {
    let url = DEMO_KYC_PHOTOS.cni;
    if (currentStep === 2) url = DEMO_KYC_PHOTOS.selfie;
    else if (currentStep === 3) url = DEMO_KYC_PHOTOS.driverLicense;
    else if (currentStep === 4) url = DEMO_KYC_PHOTOS.driverLicenseSelfie;
    else if (currentStep === 5) url = DEMO_KYC_PHOTOS.vehicleReg;

    assignPhotoForCurrentStep(url);
    if (!docNumber) setDocNumber('CI003928174');
    addToast(
      translate('Photo de démonstration chargée', 'Demo photo loaded'),
      translate('Image de test haute résolution insérée avec succès.', 'High resolution test image inserted successfully.'),
      'info'
    );
  };

  const assignPhotoForCurrentStep = (photoUrl: string) => {
    if (currentStep === 1) setDocPhoto(photoUrl);
    else if (currentStep === 2) setSelfiePhoto(photoUrl);
    else if (currentStep === 3) setDriverLicensePhoto(photoUrl);
    else if (currentStep === 4) setDriverLicenseSelfiePhoto(photoUrl);
    else if (currentStep === 5) setVehicleRegPhoto(photoUrl);
    setErrorMessage(null);
  };

  const getCurrentStepPhoto = () => {
    if (currentStep === 1) return docPhoto;
    if (currentStep === 2) return selfiePhoto;
    if (currentStep === 3) return driverLicensePhoto;
    if (currentStep === 4) return driverLicenseSelfiePhoto;
    if (currentStep === 5) return vehicleRegPhoto;
    return '';
  };

  const canProceedToNext = () => {
    if (currentStep === 1) {
      return docNumber.trim().length >= 4 && Boolean(docPhoto);
    }
    return Boolean(getCurrentStepPhoto());
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      stopCamera();
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmitAll();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      stopCamera();
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmitAll = () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = submitKYC({
      docType,
      docNumber: docNumber || 'CI003928174',
      photoUrl: docPhoto || DEMO_KYC_PHOTOS.cni,
      selfieUrl: selfiePhoto || DEMO_KYC_PHOTOS.selfie,
      driverLicenseUrl: driverLicensePhoto || (isDriver ? DEMO_KYC_PHOTOS.driverLicense : undefined),
      driverLicenseSelfieUrl: driverLicenseSelfiePhoto || (isDriver ? DEMO_KYC_PHOTOS.driverLicenseSelfie : undefined),
      vehicleRegistrationUrl: vehicleRegPhoto || (isDriver ? DEMO_KYC_PHOTOS.vehicleReg : undefined)
    });

    setIsSubmitting(false);

    if (result.success) {
      stopCamera();
      onClose();
      addToast(
        translate('Dossier KYC Soumis', 'KYC Dossier Submitted'),
        translate('Votre dossier est en cours de validation par nos agents de conformité.', 'Your dossier is being reviewed by our compliance officers.'),
        'success'
      );
    } else {
      setErrorMessage(result.message);
    }
  };

  const stepTitles = isDriver ? [
    translate("Étape 1 : Pièce d'Identité Officielle (Recto CNI / Passeport)", "Step 1: Official ID Document (Front CNI / Passport)"),
    translate("Étape 2 : Selfie en Direct avec votre Pièce d'Identité", "Step 2: Live Selfie holding your ID Document"),
    translate("Étape 3 : Permis de Conduire Valide (Recto)", "Step 3: Valid Driving License (Front)"),
    translate("Étape 4 : Selfie en Direct avec votre Permis de Conduire", "Step 4: Live Selfie with Driving License"),
    translate("Étape 5 : Carte Grise du Véhicule / Moto", "Step 5: Vehicle / Motorcycle Registration Document")
  ] : [
    translate("Étape 1 : Pièce d'Identité Officielle (Recto CNI / Passeport)", "Step 1: Official ID Document (Front CNI / Passport)"),
    translate("Étape 2 : Selfie en Direct avec votre Pièce d'Identité", "Step 2: Live Selfie holding your ID Document")
  ];

  const stepInstructions = isDriver ? [
    translate("Prenez en photo ou importez le recto de votre CNI, passeport ou attestation ONECI.", "Take a photo or import the front of your ID card, passport or ONECI certificate."),
    translate("Prenez un selfie tenant votre pièce d'identité à côté de votre visage, sans lunettes de soleil.", "Take a selfie holding your ID next to your face, without sunglasses."),
    translate("Prenez en photo ou importez votre permis de conduire ivoirien (Catégorie A / B).", "Take a photo or import your Ivorian driving license (Category A / B)."),
    translate("Prenez un selfie tenant votre permis de conduire à côté de votre joue.", "Take a selfie holding your driving license next to your cheek."),
    translate("Prenez en photo ou importez la carte grise du véhicule utilisé pour vos livraisons.", "Take a photo or import the registration certificate of your delivery vehicle.")
  ] : [
    translate("Prenez en photo ou importez le recto de votre CNI, passeport ou attestation ONECI.", "Take a photo or import the front of your ID card, passport or ONECI certificate."),
    translate("Prenez un selfie tenant votre pièce d'identité à côté de votre visage, sans lunettes de soleil.", "Take a selfie holding your ID next to your face, without sunglasses.")
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
              ? translate("Vérification en 5 étapes pour Livreurs Express Agréés", "5-Step Verification for Express Couriers") 
              : translate("Vérification en 2 étapes pour Acheteurs et Vendeurs", "2-Step Verification for Buyers and Sellers")}
          </p>

          {/* Dedicated Guide & Demo Modal Trigger */}
          <button
            type="button"
            onClick={() => setDemoGuideOpen(true)}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-105"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>{translate("📸 Guide & Démo Visuelle de Prise en Photo (Voir Exemples)", "📸 Visual Photo Guide & Demo (View Samples)")}</span>
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
              {currentStep === 2 || currentStep === 4 ? translate("Mode Selfie Visage", "Selfie Mode") : translate("Mode Document", "Document Mode")}
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
              <p className="font-bold text-red-200">{translate("Refus de validation / Fraude détectée :", "Verification issue / Fraud check:")}</p>
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
                  { id: 'attestation', label: 'Attestation ONECI' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDocType(item.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      docType === item.id 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                {translate("Numéro de la pièce d'identité (Identifiant Unique Anti-Fraude) :", "Identity Document Number (Unique Anti-Fraud ID):")}
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => { setDocNumber(e.target.value.toUpperCase()); setErrorMessage(null); }}
                placeholder="Ex: CI003928174 / C01928374"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono-num uppercase focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {translate("Le numéro est vérifié contre la base anti-doublon et sécurisé.", "The document number is verified against the anti-duplicate escrow registry.")}
              </p>
            </div>
          </div>
        )}

        {/* Hidden File Input for Native Image Import / Mobile Camera */}
        <input
          ref={fileInputRef}
          id="kyc-native-file-picker"
          type="file"
          accept="image/*"
          capture={currentStep === 2 || currentStep === 4 ? "user" : "environment"}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Camera / Capture / Upload Area */}
        <div className="mb-5">
          {/* Active Camera Viewfinder */}
          {isCameraActive ? (
            <div className="rounded-2xl overflow-hidden border-2 border-emerald-500 bg-black relative aspect-video flex items-center justify-center shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Guideline Box */}
              <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 pointer-events-none m-4 sm:m-6 rounded-2xl flex items-center justify-center bg-emerald-500/5">
                <span className="text-[11px] text-white font-bold bg-black/70 px-3 py-1 rounded-full backdrop-blur border border-white/20 shadow">
                  {currentStep === 2 || currentStep === 4 
                    ? translate("Cadrez votre visage et la pièce", "Frame your face and the ID") 
                    : translate("Cadrez bien le document", "Frame document clearly")}
                </span>
              </div>

              {/* Top Controls: Flip Front/Back Camera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 shadow"
                title="Basculer caméra avant / arrière"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{facingMode === 'user' ? 'Caméra Arrière' : 'Caméra Avant (Selfie)'}</span>
              </button>

              {/* Bottom Shutter Buttons */}
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Camera className="w-4 h-4" />
                  <span>{translate("Prendre la Photo", "Take Photo")}</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
                >
                  {translate("Annuler", "Cancel")}
                </button>
              </div>
            </div>
          ) : currentPhoto ? (
            /* Photo Preview Card - High Visibility Full Display */
            <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 relative flex flex-col items-center justify-center shadow-xl">
              <div className="w-full max-h-72 bg-black/90 flex items-center justify-center overflow-hidden p-2">
                <img 
                  src={currentPhoto} 
                  alt="Capture KYC" 
                  referrerPolicy="no-referrer"
                  className="max-h-64 w-auto max-w-full object-contain rounded-xl shadow-md border border-slate-800"
                />
              </div>

              {/* Status Header Badge */}
              <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-extrabold text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{translate("✓ Photo Enregistrée & Prête", "✓ Photo Saved & Ready")}</span>
              </div>

              {/* Action Buttons underneath preview */}
              <div className="w-full p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>{translate("Image nette & lisible", "Clear & legible image")}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      assignPhotoForCurrentStep('');
                      startCamera();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{translate("Reprendre Caméra", "Retake Camera")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{translate("Changer de fichier", "Change file")}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Option Select: Camera vs Import from Device vs Demo Example */
            <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/60 p-5 sm:p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                {currentStep === 2 || currentStep === 4 ? (
                  <UserCheck className="w-7 h-7" />
                ) : (
                  <Camera className="w-7 h-7" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  {currentStep === 2 || currentStep === 4 
                    ? translate("Prenez un selfie tenant votre pièce à côté du visage", "Take a selfie holding your ID next to your face") 
                    : translate("Capturez ou importez le document d'identité", "Capture or import identity document")}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {translate(
                    "Choisissez ci-dessous pour utiliser votre appareil photo, importer une image de votre galerie ou utiliser une photo d'exemple.",
                    "Choose below to use your camera, import an image from your gallery or use a demo photo."
                  )}
                </p>
              </div>

              {cameraError && (
                <p className="text-xs text-amber-300 bg-amber-500/15 p-2.5 rounded-xl border border-amber-500/30 text-left">
                  ⚠️ {cameraError}
                </p>
              )}

              {/* 3 Prominent Import Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {/* 1. Camera Direct */}
                <button
                  id="btn-kyc-start-camera"
                  type="button"
                  onClick={() => startCamera()}
                  className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  <Camera className="w-5 h-5" />
                  <span>{translate("Ouvrir la Caméra", "Open Camera")}</span>
                  <span className="text-[9.5px] opacity-80 font-normal">{translate("Prendre photo en direct", "Take direct live photo")}</span>
                </button>

                {/* 2. Import from Device (File Picker) */}
                <button
                  id="btn-kyc-import-device"
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-700 transition-all hover:scale-[1.02]"
                >
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span>{translate("Importer Appareil", "Import Device")}</span>
                  <span className="text-[9.5px] text-slate-400 font-normal">{translate("Galerie / Fichiers", "Gallery / Files")}</span>
                </button>

                {/* 3. Demo Preset Photo (1-Click Instant Test) */}
                <button
                  id="btn-kyc-use-demo-preset"
                  type="button"
                  onClick={handleUseDemoPhoto}
                  className="p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-amber-500/30 transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{translate("Photo Démo", "Demo Photo")}</span>
                  <span className="text-[9.5px] text-amber-400/80 font-normal">{translate("Test 1-clic instantané", "Instant 1-click test")}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              ← {translate("Étape Précédente", "Previous Step")}
            </button>
          ) : (
            <div />
          )}

          <button
            id="btn-kyc-proceed-next"
            type="button"
            onClick={handleNextStep}
            disabled={!canProceedToNext() || isSubmitting}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              canProceedToNext() && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/20 cursor-pointer hover:scale-[1.02]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            {currentStep < totalSteps ? (
              <span>{translate("Continuer vers l'Étape", "Continue to Step")} {currentStep + 1} →</span>
            ) : (
              <span>{translate("Soumettre mon Dossier KYC", "Submit my KYC Dossier")}</span>
            )}
          </button>
        </div>

        {/* Demo Admin Instant Validation Helper */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1 text-slate-500">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>{translate("Chiffrement Séquestre AES-256", "AES-256 Escrow Encryption")}</span>
          </div>

          <button
            id="btn-kyc-instant-approve-demo"
            type="button"
            onClick={() => {
              adminInstantApproveMyKYC();
              onClose();
              addToast(
                translate('KYC Validé Instantanément', 'KYC Approved Instantly'), 
                translate('Votre compte est maintenant vérifié avec badge officiel.', 'Your account is now verified with official badge.'), 
                'success'
              );
            }}
            className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 text-[10px]"
          >
            <Sparkles className="w-3 h-3" />
            <span>{translate("⚡ Mode Démo : Valider KYC sans attente", "⚡ Demo Mode: Instant KYC Approval")}</span>
          </button>
        </div>

        {/* Visual KYC Guide Modal */}
        <KYCDemoGuideModal 
          isOpen={demoGuideOpen} 
          onClose={() => setDemoGuideOpen(false)} 
          onApplyDemoPhoto={handleApplyDemoPhotoFromGuide} 
        />
      </div>
    </div>
  );
};
