import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  User, 
  Sparkles, 
  RefreshCw, 
  ImageIcon, 
  ShieldCheck,
  Store,
  Bike
} from 'lucide-react';

const PRESET_AVATARS = [
  {
    id: 'demo-buyer-1',
    label: 'Acheteur Abidjan (Homme)',
    role: 'Acheteur',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'demo-buyer-2',
    label: 'Acheteuse Cocody (Femme)',
    role: 'Acheteuse',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'demo-seller-1',
    label: 'Vendeur Pro VIP Plateau',
    role: 'Vendeur Certifié',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'demo-seller-2',
    label: 'Gérante Boutique Riviera',
    role: 'Boutique VIP Or',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'demo-driver-1',
    label: 'Livreur Express Moto',
    role: 'Livreur Agréé',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'demo-driver-2',
    label: 'Coursier Fret Véhicule',
    role: 'Livreur Pro',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'
  }
];

export const ProfileAvatarModal: React.FC = () => {
  const { 
    currentUser, 
    profileAvatarModalOpen, 
    setProfileAvatarModalOpen, 
    updateUserAvatar,
    addToast,
    translate 
  } = useApp();

  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentUser?.avatar || '');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!profileAvatarModalOpen || !currentUser) return null;

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraError("Impossible d'accéder à la caméra de votre appareil. Utilisez le bouton 'Importer depuis l'appareil' ou choisissez une photo démo.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      const size = Math.min(videoRef.current.videoWidth || 480, videoRef.current.videoHeight || 480);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center-crop square
        const startX = ((videoRef.current.videoWidth || 480) - size) / 2;
        const startY = ((videoRef.current.videoHeight || 480) - size) / 2;
        ctx.drawImage(videoRef.current, startX, startY, size, size, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setSelectedAvatar(dataUrl);
        stopCamera();
        addToast(
          translate('Photo capturée avec succès', 'Photo captured successfully'),
          translate('Aperçu mis à jour. Cliquez sur Enregistrer pour confirmer.', 'Preview updated. Click Save to confirm.'),
          'success'
        );
      }
    } catch (e) {
      console.error("Capture photo error:", e);
      setCameraError("Erreur lors de la capture. Veuillez importer une photo.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedAvatar(event.target.result as string);
          addToast(
            translate('Photo importée', 'Photo imported'),
            translate('Aperçu prêt. Cliquez sur Enregistrer pour l\'appliquer.', 'Preview ready. Click Save to apply.'),
            'success'
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!selectedAvatar) return;
    stopCamera();
    updateUserAvatar(selectedAvatar);
    setProfileAvatarModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0B111E] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto space-y-5">
        
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => { stopCamera(); setProfileAvatarModalOpen(false); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-display">
            {translate("Photo de Profil & Identité", "Profile Photo & Identity")}
          </h3>
          <p className="text-xs text-slate-400">
            {translate("Importez une photo, prenez un selfie en direct ou choisissez une photo démo", "Upload a photo, take a live selfie or choose a demo photo")}
          </p>
        </div>

        {/* Hidden Native File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Central View: Live Camera OR Selected Avatar Preview */}
        <div className="space-y-3">
          {isCameraActive ? (
            <div className="rounded-2xl overflow-hidden border-2 border-emerald-500 bg-black relative aspect-square max-w-xs mx-auto shadow-2xl flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />

              {/* Guideline Circle */}
              <div className="absolute inset-0 m-6 rounded-full border-2 border-dashed border-emerald-400/70 pointer-events-none flex items-center justify-center bg-emerald-500/5">
                <span className="text-[10px] text-white font-bold bg-black/70 px-2.5 py-0.5 rounded-full backdrop-blur">
                  {translate("Cadrez votre visage", "Frame your face")}
                </span>
              </div>

              {/* Flip camera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold border border-slate-700 shadow"
                title="Basculer caméra avant / arrière"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Shutter */}
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Camera className="w-4 h-4" />
                  <span>{translate("Prendre la Photo", "Take Photo")}</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700"
                >
                  {translate("Annuler", "Cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="relative">
                <img
                  src={selectedAvatar || currentUser.avatar}
                  alt={currentUser.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-amber-500/50 shadow-xl bg-slate-950"
                />
                <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow border border-white/20">
                  {currentUser.role === 'driver' ? 'LIVREUR' : currentUser.role === 'admin' ? 'ADMIN' : 'ACHETEUR / VENDEUR'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-white">{currentUser.name}</h4>
                <p className="text-xs text-slate-400">{currentUser.email || currentUser.phone}</p>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="text-xs text-amber-300 bg-amber-500/15 p-2.5 rounded-xl border border-amber-500/30 text-left">
              ⚠️ {cameraError}
            </p>
          )}

          {/* Action Buttons: Camera vs File Upload */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (isCameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>{translate("Prendre une Photo (Caméra)", "Take Photo (Camera)")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>{translate("Importer depuis l'Appareil", "Upload from Device")}</span>
            </button>
          </div>
        </div>

        {/* Demo Preset Photos Library */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{translate("Ou choisir une photo de démonstration :", "Or choose a demo photo:")}</span>
            </span>
            <span className="text-[10px] text-slate-500">{PRESET_AVATARS.length} profils disponibles</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setSelectedAvatar(avatar.url);
                  }}
                  className={`group relative rounded-2xl overflow-hidden p-1 border transition-all text-left flex flex-col items-center ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-500/20 shadow-md ring-2 ring-amber-500/40' 
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                  title={avatar.label}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <span className="text-[9px] text-slate-300 truncate w-full text-center mt-1 font-medium">
                    {avatar.role}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save & Confirm Bar */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => { stopCamera(); setProfileAvatarModalOpen(false); }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold"
          >
            {translate("Annuler", "Cancel")}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Check className="w-4 h-4" />
            <span>{translate("Enregistrer cette Photo de Profil", "Save Profile Photo")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
