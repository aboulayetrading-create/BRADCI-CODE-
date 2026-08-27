import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  PlusCircle, 
  Image as ImageIcon, 
  MapPin, 
  Bike, 
  Car, 
  Truck, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck,
  Crown,
  Info,
  Gavel,
  Store,
  CheckCircle2,
  Camera,
  Upload,
  Video,
  Play,
  RotateCw,
  Trash2,
  Zap,
  Film,
  Navigation
} from 'lucide-react';
import { ListingType, VehicleType } from '../types';
import { 
  ALL_COMMUNES, 
  COMMUNE_NAMES_ABIDJAN, 
  COMMUNE_NAMES_ENVIRONS,
  calculateDeliveryFee,
  getCommuneBadgeInfo,
  getCommuneCoords,
  findNearestCommune
} from '../data/communes';

export const NewProductModal: React.FC = () => {
  const { 
    newProductModalOpen, 
    setNewProductModalOpen, 
    publishProduct, 
    canUserPublishProduct,
    currentUser,
    userLocation,
    setPricingModalOpen,
    setTargetPlanForPricing,
    addToast,
    translate
  } = useApp();

  const [listingType, setListingType] = useState<ListingType>(
    currentUser?.hasShop ? 'shop' : 'auction'
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'High-Tech' | 'Mode & Luxe' | 'Maison & Électro' | 'Véhicules & Pièces' | 'Gaming' | 'Divers'>('High-Tech');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState(25000);
  const [reservePrice, setReservePrice] = useState(35000);
  const [buyNowPrice, setBuyNowPrice] = useState(25000);
  const [stockQuantity, setStockQuantity] = useState<number>(5);
  const [commune, setCommune] = useState(userLocation?.commune || 'Cocody');
  const [pickupAddress, setPickupAddress] = useState(userLocation?.address || 'Boulevard Latrille, Résidence Soleil');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | undefined>(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : getCommuneCoords('Cocody')
  );
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(userLocation?.accuracy || 12);
  const [requiredVehicle, setRequiredVehicle] = useState<VehicleType>('moto');
  const [isBoosted, setIsBoosted] = useState<boolean>(false);
  const [boostPaymentMethod, setBoostPaymentMethod] = useState<'wave' | 'orange' | 'mtn' | 'moov'>('wave');

  const captureDeviceGPS = () => {
    setIsLocatingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const coords = { lat: latitude, lng: longitude };
          setPickupCoords(coords);
          setGpsAccuracy(Math.round(accuracy));
          setIsLocatingGps(false);
          const nearest = findNearestCommune(latitude, longitude);
          if (nearest) {
            setCommune(nearest.name);
            setPickupAddress(prev => prev && !prev.includes('Abidjan') ? `${prev}, ${nearest.name}` : `${nearest.name}, Abidjan (Point GPS Validé)`);
          }
          addToast(
            translate('📍 Position GPS Précise Enregistrée', '📍 Precise GPS Location Saved'),
            translate(
              `Coordonnées capturées (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) avec une précision de ~${Math.round(accuracy)}m. Le livreur sera guidé directement chez vous.`,
              `Coordinates captured (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) with ~${Math.round(accuracy)}m accuracy. The courier will be guided directly to you.`
            ),
            'success'
          );
        },
        (err) => {
          setIsLocatingGps(false);
          addToast(
            translate('Géolocalisation', 'Geolocation'),
            translate(
              'Veuillez autoriser l\'accès GPS de votre téléphone ou choisir manuellement votre commune et adresse de retrait.',
              'Please allow phone GPS access or manually choose your commune and pickup address.'
            ),
            'info'
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocatingGps(false);
      addToast(
        translate('GPS non disponible', 'GPS not available'),
        translate('Veuillez saisir votre adresse exacte et sélectionner votre commune.', 'Please type your exact address and select your commune.'),
        'warning'
      );
    }
  };

  // Media Management: Max 3 Images & Max 1 Video (<= 45s)
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80'
  ]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Live Camera stream states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoStreamRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  if (!newProductModalOpen) return null;

  const quota = canUserPublishProduct(currentUser);
  const selectedCommuneData = ALL_COMMUNES.find(c => c.name === commune) || ALL_COMMUNES[0];
  const estDeliveryFee = calculateDeliveryFee(commune, 'Le Plateau', requiredVehicle);

  // ================= CAMERA CAPTURE LOGIC =================
  const startCamera = async () => {
    setCameraError(null);
    if (images.length >= 3) {
      addToast('Limite atteinte', 'Vous avez déjà ajouté 3 photos (maximum autorisé).', 'warning');
      return;
    }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoStreamRef.current) {
          videoStreamRef.current.srcObject = stream;
          videoStreamRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setCameraError("La caméra n'est pas supportée sur ce navigateur. Veuillez importer un fichier.");
      }
    } catch {
      setCameraError("Impossible d'accéder à l'appareil photo. Vérifiez les autorisations du navigateur.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = async () => {
    stopCamera();
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newMode }
        });
        streamRef.current = stream;
        if (videoStreamRef.current) {
          videoStreamRef.current.srcObject = stream;
          videoStreamRef.current.play();
        }
        setIsCameraActive(true);
      } catch {
        setCameraError("Impossible de basculer la caméra.");
      }
    }, 200);
  };

  const capturePhoto = () => {
    if (!videoStreamRef.current) return;
    if (images.length >= 3) {
      addToast('Limite de 3 photos', 'Maximum 3 images par article.', 'warning');
      stopCamera();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoStreamRef.current.videoWidth || 640;
    canvas.height = videoStreamRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoStreamRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImages(prev => [...prev, dataUrl].slice(0, 3));
      addToast('Photo Prise !', `Photo ${images.length + 1}/3 capturée avec succès.`, 'success');
      stopCamera();
    }
  };

  // ================= GALLERY IMAGE UPLOAD =================
  const handleImageFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - images.length;
    if (remainingSlots <= 0) {
      addToast('Limite de 3 photos', 'Vous avez déjà atteint le maximum de 3 photos.', 'warning');
      return;
    }

    const filesToRead = (Array.from(files) as File[]).slice(0, remainingSlots);
    filesToRead.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });

    addToast('Images importées', `${filesToRead.length} photo(s) ajoutée(s).`, 'info');
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // ================= VIDEO UPLOAD & 45s VALIDATION =================
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoError(null);

    const tempUrl = URL.createObjectURL(file);
    const videoElem = document.createElement('video');
    videoElem.preload = 'metadata';
    videoElem.src = tempUrl;

    videoElem.onloadedmetadata = () => {
      window.URL.revokeObjectURL(tempUrl);
      const duration = Math.round(videoElem.duration);
      if (duration > 45) {
        setVideoError(`⚠️ La vidéo sélectionnée dure ${duration}s. La durée maximale autorisée pour une démonstration produit est de 45 secondes.`);
        addToast('Vidéo Trop Longue', `Durée : ${duration}s (Maximum autorisé : 45 secondes).`, 'error');
        setVideoUrl(null);
        setVideoDuration(0);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setVideoUrl(event.target.result as string);
            setVideoDuration(duration);
            addToast('Vidéo Validée !', `Démonstration produit enregistrée (${duration}s / 45s max).`, 'success');
          }
        };
        reader.readAsDataURL(file);
      }
    };

    videoElem.onerror = () => {
      setVideoError("Format vidéo non supporté ou fichier illisible.");
    };
  };

  const removeVideo = () => {
    setVideoUrl(null);
    setVideoDuration(0);
    setVideoError(null);
  };

  // Preset demo samples
  const sampleImagesList = [
    { label: 'Montre Luxe', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80' },
    { label: 'Drone 4K', url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80' },
    { label: 'Sneakers VIP', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80' },
    { label: 'Console PS5', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80' },
    { label: 'Smart TV', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80' },
  ];

  const sampleDemoVideos = [
    { label: 'Démo Drone (28s)', url: 'https://assets.mixkit.co/videos/preview/mixkit-drone-flying-over-a-tropical-forest-41474-large.mp4', duration: 28 },
    { label: 'Démo Montre (19s)', url: 'https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-luxury-watch-41584-large.mp4', duration: 19 },
    { label: 'Démo Chaussure (15s)', url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-tying-her-sneakers-before-jogging-42410-large.mp4', duration: 15 }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      addToast('Photos Requises', 'Veuillez ajouter au moins 1 photo de l\'article (maximum 3).', 'warning');
      return;
    }

    const success = publishProduct({
      title,
      category,
      description,
      startingPrice: Number(startingPrice),
      reservePrice: Number(reservePrice),
      buyNowPrice: listingType === 'shop' ? Number(buyNowPrice) : undefined,
      stockQuantity: listingType === 'shop' ? Number(stockQuantity) : undefined,
      listingType,
      commune,
      pickupAddress,
      pickupCoords: pickupCoords || getCommuneCoords(commune),
      requiredVehicle,
      images: images.slice(0, 3),
      videoUrl: videoUrl || undefined,
      videoDurationSeconds: videoDuration || undefined,
      isBoosted: isBoosted
    });

    if (success) {
      if (isBoosted) {
        addToast(
          '⚡ Option Boost Flash Activée (1 000 FCFA) !',
          `Votre article a été propulsé en tête de liste avec le badge doré VIP (${boostPaymentMethod.toUpperCase()}).`,
          'success'
        );
      }
      setNewProductModalOpen(false);
      setTitle('');
      setDescription('');
      setIsBoosted(false);
      setImages(['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80']);
      setVideoUrl(null);
      setVideoDuration(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="new-product-modal-card" 
        className="w-full max-w-2xl bg-[#0C121E] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => { stopCamera(); setNewProductModalOpen(false); }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Quota status banner */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Publication d'Annonce Brad'CI</span>
            </div>
            {/* Free Unlimited Indicator & Upgrade Prompt */}
            <div className="text-xs flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono-num font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <span>✓ Publications Illimitées & Gratuites (0 FCFA)</span>
              </span>
              {currentUser?.sellerPlan !== 'pro' && (
                <button
                  type="button"
                  onClick={() => {
                    setNewProductModalOpen(false);
                    setTargetPlanForPricing('standard');
                    setPricingModalOpen(true);
                  }}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                  title="Passer au Pass Certifié pour réduire vos commissions et obtenir le badge vérifié"
                >
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Passer au Sérieux (Pass Vendeur)</span>
                </button>
              )}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            {listingType === 'shop' ? 'Publier un Article de Boutique' : 'Publier une Nouvelle Enchère'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Photos haute fidélité (max 3), vidéo démo (max 45s) & modération administrative
          </p>
        </div>

        {/* Format Selector: Enchère vs Boutique */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setListingType('auction')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              listingType === 'auction'
                ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${listingType === 'auction' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-1.5">
                <span>🔨 Enchère Express</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-black">
                  Badge Enchère
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Mise aux enchères avec règle des 5 offres et arbitrage vendeur.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setListingType('shop')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              listingType === 'shop'
                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${listingType === 'shop' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-1.5">
                <span>🏪 Annonce Boutique</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-black">
                  Badge Boutique
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Achat immédiat en ligne avec vitrine certifiée et livraison directe.
              </p>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-300 font-medium block mb-1">Titre de l'article :</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: iPhone 15 Pro Max 256GB Neuf Scellé"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Catégorie :</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="High-Tech">High-Tech & Smartphones</option>
                  <option value="Mode & Luxe">Mode & Luxe</option>
                  <option value="Maison & Électro">Maison & Électroménager</option>
                  <option value="Véhicules & Pièces">Véhicules & Pièces</option>
                  <option value="Gaming">Gaming & Consoles</option>
                  <option value="Divers">Déstockage Divers</option>
                </select>
              </div>
            </div>

            {/* Commune & Pickup Address with Mandatory Warning & Phone GPS Capture */}
            <div className="space-y-3">
              {/* Prominent Mandatory Warning Alert */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>{translate("⚠️ ATTENTION : RISQUE D'ÉCHEC DE LIVRAISON SI L'ADRESSE N'EST PAS EXACTE !", "⚠️ WARNING: HIGH RISK OF DELIVERY FAILURE IF ADDRESS IS INACCURATE!")}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {translate(
                    "Cette étape est capitale : elle représente le point exact de prise en charge où le livreur partenaire viendra récupérer le colis. Veuillez indiquer précisément le lieu où se trouve le produit (commune, quartier, repère, bâtiment). La capture de la position GPS exacte de votre téléphone est fortement recommandée pour guider le livreur sans erreur.",
                    "This step is critical: it represents the exact pickup point where the partner courier will retrieve the parcel. Please specify precisely where the product is located (commune, district, landmark, building). Capturing your phone's exact GPS location is strongly recommended."
                  )}
                </p>
                
                {/* GPS Capture Button */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={captureDeviceGPS}
                    disabled={isLocatingGps}
                    className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Navigation className={`w-4 h-4 ${isLocatingGps ? 'animate-spin' : ''}`} />
                    <span>{isLocatingGps ? translate("Capture GPS en cours...", "Capturing phone GPS...") : translate("📍 Capturer la Position GPS de mon Téléphone", "📍 Capture My Phone's Exact GPS")}</span>
                  </button>

                  {pickupCoords && (
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono-num flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{translate("GPS Confirmé :", "GPS Confirmed:")} ({pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}) {gpsAccuracy ? `• Précision ~${gpsAccuracy}m` : ''}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    {translate("Commune / Zone de Retrait (Obligatoire) :", "Pickup Commune / Area (Mandatory):")}
                  </label>
                  <select
                    value={commune}
                    onChange={(e) => {
                      setCommune(e.target.value);
                      const coords = getCommuneCoords(e.target.value);
                      setPickupCoords(coords);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <optgroup label="District d'Abidjan (10 Communes)">
                      {COMMUNE_NAMES_ABIDJAN.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Villes Environs & Périphérie (Axes Logistiques)">
                      {COMMUNE_NAMES_ENVIRONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    {translate("Adresse & Repères Précis de Retrait (Obligatoire) :", "Exact Pickup Street & Landmarks (Mandatory):")}
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Ex: Deux-Plateaux Vallons, Rue des Jardins, Immeuble Horizon 2e étage"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Prices & Stock according to listing type */}
            {listingType === 'shop' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Prix Boutique Garanti (FCFA) :</label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={buyNowPrice}
                      onChange={(e) => {
                        setBuyNowPrice(Number(e.target.value));
                        setStartingPrice(Number(e.target.value));
                      }}
                      className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-sm font-mono-num text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Prix fixe d'achat direct pour les clients.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center justify-between">
                      <span>Quantité en Stock (Obligatoire) :</span>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        Règle 14 Jours
                      </span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-sm font-mono-num text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Nombre d'unités réelles disponibles.
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Gestion du Stock :</strong> Lorsque le stock est vendu, l'article affiche automatiquement <em>"Stock épuisé - Nouveau stock bientôt"</em>. Si aucun stock n'est rechargé après 2 semaines (14 jours), l'article est définitivement supprimé.
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Prix de départ (FCFA) :</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono-num text-amber-400 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Prix de réserve conseillé :</label>
                  <input
                    type="number"
                    min={startingPrice}
                    step={1000}
                    value={reservePrice}
                    onChange={(e) => setReservePrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono-num text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Anti-Fraud Banner Reminder */}
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-red-200">Filtrage Anti-Fraude & Règle des 3 Avertissements</p>
                <p className="text-[10px] text-red-300/90 leading-relaxed">
                  Il est strictement interdit d'insérer un numéro de téléphone, contact WhatsApp ou message invitant à contourner le séquestre dans le titre, la description ou les photos. Les coordonnées ne sont débloquées qu'après paiement validé. Au 3ᵉ avertissement, votre compte sera immédiatement suspendu.
                </p>
              </div>
            </div>

            {/* Required Vehicle for Delivery */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-300 font-medium">
                  Véhicule Requis pour l'enlèvement :
                </label>
                <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  Tarif course estimé : ~{estDeliveryFee.toLocaleString('fr-FR')} F
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRequiredVehicle('moto')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                    requiredVehicle === 'moto'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bike className={`w-5 h-5 ${requiredVehicle === 'moto' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Moto Express</span>
                  <span className="text-[10px] text-slate-400">&lt; 10 kg</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequiredVehicle('voiture')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                    requiredVehicle === 'voiture'
                      ? 'bg-blue-500/15 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Car className={`w-5 h-5 ${requiredVehicle === 'voiture' ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Voiture / Coffre</span>
                  <span className="text-[10px] text-slate-400">10 à 50 kg</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequiredVehicle('cargo')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                    requiredVehicle === 'cargo'
                      ? 'bg-purple-500/15 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Truck className={`w-5 h-5 ${requiredVehicle === 'cargo' ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Cargo / Fourgon</span>
                  <span className="text-[10px] text-slate-400">&gt; 50 kg (TV, Frigo)</span>
                </button>
              </div>
            </div>

            {/* ================= SECTION 1: PHOTOS (MAX 3) ================= */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>Photos de l'article</span>
                    </span>
                    <span className={`text-[10px] font-mono-num font-black px-2 py-0.2 rounded-full ${
                      images.length === 3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {images.length} / 3 Max
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Prenez une photo en direct avec la caméra ou importez depuis votre galerie
                  </p>
                </div>

                {/* Import / Camera Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={images.length >= 3}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      images.length >= 3 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10 cursor-pointer'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prendre</span> Photo
                  </button>

                  <label className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    images.length >= 3
                      ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
                  }`}>
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Importer</span> Galerie
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={images.length >= 3}
                      onChange={handleImageFilesUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Active Camera Viewfinder for Product Photos */}
              {isCameraActive && (
                <div className="rounded-2xl overflow-hidden border-2 border-amber-500 bg-black relative aspect-video flex items-center justify-center animate-in zoom-in-95">
                  <video 
                    ref={videoStreamRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-amber-400/50 pointer-events-none m-4 rounded-xl flex items-center justify-center">
                    <span className="text-[11px] text-white bg-black/70 px-2.5 py-1 rounded-md backdrop-blur">
                      Cadrez l'article sous un bon éclairage (Slot {images.length + 1}/3)
                    </span>
                  </div>
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl flex items-center gap-1.5 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Prendre Photo ({images.length + 1}/3)</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white text-xs border border-slate-700"
                      title="Changer de caméra"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white text-xs border border-slate-700"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Thumbnails & Grid (1 to 3 images) */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((slotIdx) => {
                  const img = images[slotIdx];
                  return (
                    <div 
                      key={slotIdx}
                      className={`aspect-video rounded-xl border relative overflow-hidden flex items-center justify-center transition-all ${
                        img 
                          ? 'border-slate-700 bg-slate-950' 
                          : 'border-dashed border-slate-800 bg-slate-950/40'
                      }`}
                    >
                      {img ? (
                        <>
                          <img src={img} alt={`Slot ${slotIdx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute top-1.5 left-1.5">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow ${
                              slotIdx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-black/70 text-slate-300'
                            }`}>
                              {slotIdx === 0 ? 'Principale' : `Photo ${slotIdx + 1}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(slotIdx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-500/30 transition-colors shadow"
                            title="Supprimer la photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <span className="text-[10px] text-slate-500 font-bold block">Slot {slotIdx + 1}/3</span>
                          <span className="text-[9px] text-slate-600">Vide</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Preset Samples */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                <span className="text-[10px] text-slate-500 shrink-0">Exemples rapides :</span>
                {sampleImagesList.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (images.length < 3 && !images.includes(s.url)) {
                        setImages(prev => [...prev, s.url].slice(0, 3));
                      }
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 shrink-0 transition-colors"
                  >
                    + {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ================= SECTION 2: VIDEO (MAX 1, MAX 45 SECONDES) ================= */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-purple-400" />
                      <span>Vidéo Démonstration Produit</span>
                    </span>
                    <span className="text-[10px] font-mono-num bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.2 rounded-full font-black">
                      Max 1 vidéo • 45s max
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Montrez l'état réel et le fonctionnement de votre article (Max 45 secondes)
                  </p>
                </div>

                {/* Import Video Button */}
                {!videoUrl ? (
                  <label className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                    <Video className="w-3.5 h-3.5" />
                    <span>Ajouter Vidéo</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>

              {/* Video duration error */}
              {videoError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{videoError}</span>
                </div>
              )}

              {/* Active Video Player Preview */}
              {videoUrl ? (
                <div className="rounded-xl overflow-hidden border border-purple-500/40 bg-black relative aspect-video flex items-center justify-center">
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-purple-900/80 backdrop-blur text-purple-200 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Play className="w-3 h-3 text-purple-400" />
                    <span>Durée : {videoDuration}s / 45s max</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                  <span className="text-[10px] text-slate-500 shrink-0">Vidéos démo types :</span>
                  {sampleDemoVideos.map((v, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setVideoUrl(v.url);
                        setVideoDuration(v.duration);
                        setVideoError(null);
                        addToast('Vidéo Sélectionnée', `${v.label} chargée (${v.duration}s).`, 'info');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg border border-purple-900/60 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 shrink-0 transition-colors"
                    >
                      ▶️ {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Description & État du produit :</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisez l'état, accessoires fournis, garantie, motif de vente..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Boost Flash Option Card */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              isBoosted 
                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10' 
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isBoosted ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        {translate("Option Pass Flash Boost (1 000 FCFA)", "Flash Boost Pass Option (1,000 FCFA)")}
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                        ⚡ {translate("5x Plus de Visibilité", "5x More Visibility")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {translate(
                        "Propulsez votre article en tête du fil d'accueil avec un badge doré et une alerte flash acheteurs.",
                        "Boost your listing to the top of the feed with a golden badge and buyer flash alert."
                      )}
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsBoosted(!isBoosted)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isBoosted
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {isBoosted ? translate("✓ Activé (1 000 F)", "✓ Active (1,000 F)") : translate("+ Ajouter (1 000 F)", "+ Add (1,000 F)")}
                </button>
              </div>

              {/* Payment selector when boosted */}
              {isBoosted && (
                <div className="mt-3 pt-3 border-t border-amber-500/20 animate-in fade-in">
                  <label className="text-[11px] font-bold text-amber-300 block mb-1.5">
                    {translate("Moyen de paiement pour le Pass Boost (1 000 FCFA) :", "Payment method for Boost Pass (1,000 FCFA):")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'wave', label: '🌊 Wave' },
                      { id: 'orange', label: '🍊 Orange' },
                      { id: 'mtn', label: '🟡 MTN' },
                      { id: 'moov', label: '🔵 Moov' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setBoostPaymentMethod(p.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          boostPaymentMethod === p.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900/80 border-slate-700 text-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 flex items-center gap-1 cursor-not-allowed">
                        <span>💳 Carte</span>
                        <span className="text-[8px] bg-slate-800 text-amber-300 px-1 py-0.2 rounded border border-amber-500/20 uppercase font-bold">Bientôt</span>
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 flex items-center gap-1 cursor-not-allowed">
                        <span>🪙 Crypto</span>
                        <span className="text-[8px] bg-slate-800 text-amber-300 px-1 py-0.2 rounded border border-amber-500/20 uppercase font-bold">Bientôt</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Moderation & Admin Fast/Flash Approval Notice */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">{translate("Circuit d'Approbation Administrateur BRAD'CI", "BRAD'CI Admin Approval Workflow")}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  {translate(
                    "Après soumission, votre article est examiné par l'équipe de sécurité. Les annonces conformes sont validées en Approbation Standard ou propulsées en Approbation Flash Immédiate ⚡ pour une visibilité prioritaire.",
                    "After submission, your item is reviewed by security. Compliant listings are validated in Standard Approval or propelled to Immediate Flash Approval ⚡."
                  )}
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-300">
                <span className="text-slate-400">{translate("Commission sur vente : ", "Sales commission: ")}</span>
                <span className="font-bold text-amber-400">
                  {listingType === 'auction'
                    ? '10% (' + translate('Règle fixe toutes enchères', 'Fixed rate all auctions') + ')'
                    : currentUser?.sellerPlan === 'pro'
                    ? '2.5% (' + translate('Pass VIP Or', 'VIP Gold Pass') + ')'
                    : currentUser?.sellerPlan === 'standard'
                    ? '5% (' + translate('Pass Certifié', 'Certified Pass') + ')'
                    : '10% (' + translate('Compte Basique sans abonnement', 'Basic Account no sub') + ')'
                  }
                </span>
              </div>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
                  listingType === 'shop'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-amber-500/20 cursor-pointer'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {listingType === 'shop' 
                    ? translate(isBoosted ? "Payer Boost (1 000 F) & Publier Boutique" : "Soumettre l'Article Boutique", isBoosted ? "Pay Boost (1,000 F) & Post Shop Item" : "Submit Shop Item")
                    : translate(isBoosted ? "Payer Boost (1 000 F) & Lancer Enchère" : "Soumettre l'Enchère", isBoosted ? "Pay Boost (1,000 F) & Launch Auction" : "Submit Live Auction")
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
