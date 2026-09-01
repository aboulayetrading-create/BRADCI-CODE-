import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  RotateCw, 
  Eye, 
  Lock, 
  FileText, 
  UserCheck, 
  Car, 
  LogOut, 
  Check, 
  Zap, 
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { verifyFacialBiometrics, BiometricCheckResult } from '../utils/biometricVerification';

const DEMO_KYC_PHOTOS = {
  cni: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  selfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  selfieWithId: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
  driverLicense: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
  driverLicenseVerso: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
  driverLicenseSelfie: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  vehicleReg: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80'
};

export const MandatoryKYCGate: React.FC = () => {
  const { 
    currentUser, 
    submitKYC, 
    adminInstantApproveMyKYC, 
    logoutUser, 
    translate, 
    language, 
    addToast 
  } = useApp();

  // If no user or already verified or admin, gate is not active
  if (!currentUser || currentUser.role === 'admin' || currentUser.kycStatus === 'verified') {
    return null;
  }

  const isDriver = currentUser.role === 'driver';
  const isPending = currentUser.kycStatus === 'pending';
  
  // For Buyer & Seller: 3 Steps
  // 1: Official ID (CNI, Passeport, Carte Consulaire)
  // 2: Simple Selfie
  // 3: Selfie holding ID
  // For Driver: 4 Steps
  // 1: Official ID (CNI, Passeport)
  // 2: Selfie holding ID
  // 3: Driver's License (Recto / Verso)
  // 4: Vehicle Registration (Carte Grise)
  const totalSteps = isDriver ? 4 : 3;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [docType, setDocType] = useState<'cni' | 'passeport' | 'attestation' | 'permis' | 'carte_consulaire'>('cni');
  const [docNumber, setDocNumber] = useState<string>(currentUser.kycDocumentNumber || 'CI004829104');
  
  // Photos state
  const [docPhoto, setDocPhoto] = useState<string>(currentUser.kycPhotoUrl || '');
  const [selfiePhoto, setSelfiePhoto] = useState<string>(currentUser.kycSelfieUrl || '');
  const [selfieWithIdPhoto, setSelfieWithIdPhoto] = useState<string>(currentUser.kycSelfieWithIdUrl || '');
  const [driverLicensePhoto, setDriverLicensePhoto] = useState<string>(currentUser.kycDriverLicenseUrl || '');
  const [driverLicenseVersoPhoto, setDriverLicenseVersoPhoto] = useState<string>(currentUser.kycDriverLicenseVersoUrl || '');
  const [vehicleRegPhoto, setVehicleRegPhoto] = useState<string>(currentUser.kycVehicleRegistrationUrl || '');

  // Camera & verification state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isBiometricChecking, setIsBiometricChecking] = useState<boolean>(false);
  const [biometricResult, setBiometricResult] = useState<BiometricCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera
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
          "Caméra non supportée dans ce navigateur. Utilisez le bouton 'Importer depuis la galerie' ou 'Photo Démo'.",
          "Camera not supported. Please import a file or use demo photo."
        ));
      }
    } catch (err) {
      console.warn("getUserMedia error:", err);
      setCameraError(translate(
        "Accès caméra refusé. Utilisez l'import de fichier ou la photo démo.",
        "Camera access denied. Please use file upload or demo photo."
      ));
    }
  };

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
      setCameraError("Erreur lors de la capture.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          assignPhotoForCurrentStep(event.target.result as string);
          addToast(
            translate('Photo importée', 'Photo imported'),
            translate('Le fichier est chargé et prêt pour vérification.', 'File loaded and ready for verification.'),
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
    if (!docNumber) setDocNumber('CI004829104');
    addToast(
      translate('Photo de démonstration chargée', 'Demo photo loaded'),
      translate('Image de test haute résolution insérée.', 'High resolution test image inserted.'),
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
      if (currentStep === 4) return Boolean(vehicleRegPhoto);
    }
    return false;
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      stopCamera();
      setCurrentStep(prev => prev + 1);
    } else {
      await handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      stopCamera();
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setIsBiometricChecking(true);

    // AI Biometric Check simulation
    const bioResult = await verifyFacialBiometrics(
      selfiePhoto || selfieWithIdPhoto || DEMO_KYC_PHOTOS.selfie,
      docPhoto || DEMO_KYC_PHOTOS.cni
    );
    setBiometricResult(bioResult);
    setIsBiometricChecking(false);

    if (!bioResult.success) {
      setIsSubmitting(false);
      setErrorMessage(language === 'en' ? (bioResult.errorMessageEn || bioResult.errorMessage) : bioResult.errorMessage);
      return;
    }

    const res = submitKYC({
      docType,
      docNumber: docNumber || 'CI004829104',
      photoUrl: docPhoto || DEMO_KYC_PHOTOS.cni,
      selfieUrl: selfiePhoto || DEMO_KYC_PHOTOS.selfie,
      driverLicenseUrl: driverLicensePhoto || (isDriver ? DEMO_KYC_PHOTOS.driverLicense : undefined),
      driverLicenseSelfieUrl: selfieWithIdPhoto || (isDriver ? DEMO_KYC_PHOTOS.driverLicenseSelfie : undefined),
      vehicleRegistrationUrl: vehicleRegPhoto || (isDriver ? DEMO_KYC_PHOTOS.vehicleReg : undefined)
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      stopCamera();
      addToast(
        translate('Dossier KYC Soumis', 'KYC Submitted'),
        translate('Votre dossier est en attente de validation (Délai moyen : 15 à 30 minutes).', 'Your file is awaiting approval (Average time: 15-30 min).'),
        'success'
      );
    }
  };

  // Step descriptions for Buyer / Seller
  const buyerSellerStepTitles = [
    translate("1. Pièce d'Identité Officielle (CNI / Passeport / Carte Consulaire)", "1. Official ID Document (National ID / Passport / Consular Card)"),
    translate("2. Selfie Simple en Direct", "2. Simple Live Selfie"),
    translate("3. Selfie Tenant la Pièce d'Identité", "3. Live Selfie Holding ID Document")
  ];

  const buyerSellerStepInstructions = [
    translate("Prenez une photo nette du recto de votre CNI, Passeport ou Carte Consulaire.", "Take a clear picture of the front of your National ID, Passport or Consular Card."),
    translate("Prenez un selfie simple de face, bien éclairé, sans chapeau ni lunettes.", "Take a clear front-facing selfie in good lighting, without hats or glasses."),
    translate("Prenez un selfie en tenant votre pièce d'identité bien visible à côté de votre visage.", "Take a selfie holding your ID document clearly visible next to your face.")
  ];

  // Step descriptions for Courier
  const driverStepTitles = [
    translate("1. Pièce d'Identité Officielle (CNI ou Passeport)", "1. Official ID Document (National ID or Passport)"),
    translate("2. Selfie Tenant la Pièce d'Identité", "2. Live Selfie Holding ID Document"),
    translate("3. Permis de Conduire (Recto / Verso)", "3. Driver's License (Front / Back)"),
    translate("4. Carte Grise du Véhicule (Moto / Fourgon)", "4. Vehicle Registration Certificate (Motorcycle / Cargo)")
  ];

  const driverStepInstructions = [
    translate("Prenez en photo votre CNI ou Passeport officiel.", "Take a photo of your official National ID or Passport."),
    translate("Prenez un selfie tenant votre pièce d'identité bien visible à côté de votre joue.", "Take a selfie holding your ID clearly visible next to your cheek."),
    translate("Prenez en photo votre Permis de conduire ivoirien valide.", "Take a photo of your valid Ivorian driver's license."),
    translate("Prenez en photo la carte grise de l'engin (moto ou fourgon) utilisé pour vos courses.", "Take a photo of the vehicle registration document used for your deliveries.")
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0B111E] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto space-y-6">
        
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isPending ? translate("KYC EN ATTENTE DE VALIDATION", "KYC PENDING APPROVAL") : translate("ACCÈS RESTREINT - KYC OBLIGATOIRE", "RESTRICTED ACCESS - KYC REQUIRED")}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white font-display mt-0.5">
                {translate("Protocole de Sécurité & Certification KYC", "Security Protocol & KYC Certification")}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={logoutUser}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{translate("Se Déconnecter", "Sign Out")}</span>
          </button>
        </div>

        {/* IF ALREADY PENDING REVIEW */}
        {isPending ? (
          <div className="space-y-6 py-4 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-black text-white">
                {translate("Dossier KYC Transmis & En Cours d'Analyse", "KYC Dossier Submitted & Under Review")}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                {translate(
                  "Toutes les fonctionnalités de la plateforme (achats, ventes, enchères et livraisons) seront automatiquement débloquées dès la validation par nos agents de conformité.",
                  "All platform features (buying, selling, bidding, and deliveries) will be unlocked once approved by compliance officers."
                )}
              </p>

              {/* Timeframe Indicator */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-xs font-bold text-amber-300 mt-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span>{translate("Délai indicatif de traitement : 15 à 30 minutes (Délai maximum garanti : 24h)", "Estimated review time: 15 to 30 minutes (Guaranteed max: 24h)")}</span>
              </div>
            </div>

            {/* Verification Steps Summary */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {translate("État d'avancement de votre dossier :", "Dossier Processing Status:")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{translate("Pièces & Selfies Reçus", "Documents Received")}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{translate("Biométrie IA Conforme (97%)", "AI Biometrics Verified")}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-amber-500/40 flex items-center gap-2.5 text-amber-300 animate-pulse">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{translate("Contrôle Agent (15-30 min)", "Agent Review (15-30m)")}</span>
                </div>
              </div>
            </div>

            {/* Instant Admin/Tester Approval Action */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>{translate("Mode Démo & Évaluation Rapide", "Demo Mode & Fast Evaluation")}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {translate("Validez instantanément ce dossier KYC pour tester immédiatement l'ensemble des modules.", "Instantly approve this KYC file to test all platform modules immediately.")}
                </p>
              </div>

              <button
                type="button"
                onClick={adminInstantApproveMyKYC}
                className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105"
              >
                <Check className="w-4 h-4" />
                <span>{translate("⚡ Valider KYC Immédiatement", "⚡ Approve KYC Instantly")}</span>
              </button>
            </div>
          </div>
        ) : (
          /* KYC SUBMISSION FORM */
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-xs text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-200">
                    {translate("Vérification obligatoire immédiatement après inscription :", "Mandatory verification immediately post-registration:")}
                  </p>
                  <p className="mt-0.5 text-slate-300">
                    {isDriver 
                      ? translate("Livreurs : CNI/Passeport, Selfie avec pièce, Permis et Carte grise requis.", "Couriers: ID, Selfie with ID, License and Vehicle registration required.")
                      : translate("Acheteurs & Vendeurs : Pièce d'identité, Selfie simple et Selfie avec pièce requis.", "Buyers & Sellers: ID document, Simple selfie and Selfie with ID required.")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDocPhoto(DEMO_KYC_PHOTOS.cni);
                    setSelfiePhoto(DEMO_KYC_PHOTOS.selfie);
                    setSelfieWithIdPhoto(DEMO_KYC_PHOTOS.selfieWithId);
                    if (isDriver) {
                      setDriverLicensePhoto(DEMO_KYC_PHOTOS.driverLicense);
                      setDriverLicenseVersoPhoto(DEMO_KYC_PHOTOS.driverLicenseVerso);
                      setVehicleRegPhoto(DEMO_KYC_PHOTOS.vehicleReg);
                    }
                    adminInstantApproveMyKYC();
                    addToast(
                      translate("KYC Démo Validé", "Demo KYC Approved"),
                      translate("Compte certifié instantanément pour les tests.", "Account instantly certified for preview."),
                      "success"
                    );
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{translate("⚡ Bypass / Valider Démo", "⚡ Bypass / Approve Demo")}</span>
                </button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between gap-2">
              {Array.from({ length: totalSteps }).map((_, idx) => {
                const stepNum = idx + 1;
                const isDone = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                return (
                  <div key={idx} className="flex-1 space-y-1">
                    <div className={`h-2 rounded-full transition-all ${
                      isDone ? 'bg-emerald-500' : isCurrent ? 'bg-amber-500 ring-2 ring-amber-500/40' : 'bg-slate-800'
                    }`} />
                    <span className={`text-[10px] font-bold block text-center ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`}>
                      {translate("Étape", "Step")} {stepNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Active Step Content */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {translate("Étape", "Step")} {currentStep} {translate("sur", "of")} {totalSteps}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {isDriver ? driverStepTitles[currentStep - 1] : buyerSellerStepTitles[currentStep - 1]}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {isDriver ? driverStepInstructions[currentStep - 1] : buyerSellerStepInstructions[currentStep - 1]}
                </p>
              </div>

              {/* Step 1 Specific: Document Type and Number */}
              {currentStep === 1 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      {translate("Sélectionnez le type de document :", "Select document type:")}
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
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                            docType === item.id 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      {translate("Numéro officiel de la pièce :", "Official document number:")}
                    </label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                      placeholder="Ex: C012398402"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3 (Driver's License) Specific: Front and Back status */}
              {isDriver && currentStep === 3 && (
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{translate("Permis Recto :", "License Front:")}</span>
                    <span className={driverLicensePhoto ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {driverLicensePhoto ? "✓ Chargé" : "En attente"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{translate("Permis Verso :", "License Back:")}</span>
                    <span className={driverLicenseVersoPhoto ? "text-emerald-400 font-bold" : "text-slate-500"}>
                      {driverLicenseVersoPhoto ? "✓ Chargé" : "Facultatif"}
                    </span>
                  </div>
                </div>
              )}

              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Central View: Live Camera Viewfinder OR Selected Photo Preview */}
              <div className="space-y-3">
                {isCameraActive ? (
                  <div className="rounded-2xl overflow-hidden border-2 border-amber-500 bg-black relative aspect-video max-w-sm mx-auto shadow-2xl flex items-center justify-center">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />

                    {/* Guidelines Frame */}
                    <div className="absolute inset-0 m-4 rounded-xl border-2 border-dashed border-amber-400/70 pointer-events-none flex items-center justify-center bg-amber-500/5">
                      <span className="text-[10px] text-white font-bold bg-black/70 px-2.5 py-0.5 rounded-full">
                        {translate("Centrez votre visage ou document", "Center your face or document")}
                      </span>
                    </div>

                    {/* Camera Action Buttons */}
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{translate("Capturer la Photo", "Capture Photo")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="p-2 rounded-full bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700"
                        title="Annuler"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {getCurrentStepPhoto() ? (
                      <div className="rounded-2xl overflow-hidden border border-emerald-500/50 bg-slate-950 p-2 max-w-xs mx-auto text-center space-y-2">
                        <img 
                          src={getCurrentStepPhoto()} 
                          alt="KYC Step Photo"
                          referrerPolicy="no-referrer"
                          className="w-full h-40 object-cover rounded-xl"
                        />
                        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{translate("Photo Prête & Conforme", "Photo Ready & Compliant")}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/50 text-center space-y-2 max-w-sm mx-auto">
                        <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400 font-medium">
                          {translate("Aucune photo pour le moment", "No photo selected yet")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo Input Triggers */}
                {!isCameraActive && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera('user')}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>{translate("Prendre une Photo (Caméra)", "Take Photo (Camera)")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span>{translate("Choisir dans la Galerie", "Choose from Gallery")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleUseDemoPhoto}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{translate("Photo Démo (1-Clic)", "Demo Photo (1-Click)")}</span>
                    </button>
                  </div>
                )}

                {cameraError && (
                  <p className="text-[11px] text-amber-400 text-center">{cameraError}</p>
                )}
              </div>
            </div>

            {/* Error Message if Rejected */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-200">{translate("Rejet de Conformité :", "Compliance Rejection:")}</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold disabled:opacity-40 transition-colors"
              >
                {translate("Précédent", "Previous")}
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="flex-1 max-w-xs px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/30 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>{translate("Analyse Biométrique IA...", "AI Biometric Check...")}</span>
                  </>
                ) : (
                  <>
                    <span>{currentStep < totalSteps ? translate("Étape Suivante", "Next Step") : translate("Soumettre le Dossier KYC", "Submit KYC Dossier")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
