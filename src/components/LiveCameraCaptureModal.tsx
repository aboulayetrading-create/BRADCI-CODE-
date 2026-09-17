import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, Image, AlertCircle } from 'lucide-react';

interface LiveCameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
  subtitle?: string;
  defaultFacingMode?: 'environment' | 'user';
  aspectRatio?: 'square' | 'wide' | 'standard';
}

export const LiveCameraCaptureModal: React.FC<LiveCameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = "Prendre une photo",
  subtitle = "Cadrez votre sujet et appuyez sur le bouton déclencheur",
  defaultFacingMode = 'environment',
  aspectRatio = 'standard'
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(defaultFacingMode);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop active camera stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      setStream(null);
    }
  }, [stream]);

  // Start camera with proper error handling and fallback chains
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setIsLoading(true);
    setCameraError(null);
    stopStream();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("L'accès caméra direct n'est pas supporté par ce navigateur. Utilisez le bouton Galerie.");
      setIsLoading(false);
      return;
    }

    let activeStream: MediaStream | null = null;

    // 1. Try with ideal constraints
    try {
      activeStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch {
      // 2. Fallback to basic facingMode constraint
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false
        });
      } catch {
        // 3. Ultimate fallback: any available video device
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (err: any) {
          console.warn("[LiveCamera] Impossible d'accéder au flux vidéo:", err);
          if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
            setCameraError("Autorisation d'accès à l'appareil photo refusée. Vérifiez les paramètres de votre navigateur ou sélectionnez une image dans vos fichiers.");
          } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
            setCameraError("Aucun appareil photo détecté sur ce terminal.");
          } else {
            setCameraError("Impossible d'activer la caméra. Vous pouvez utiliser votre galerie d'images.");
          }
          setIsLoading(false);
          return;
        }
      }
    }

    if (activeStream) {
      setStream(activeStream);
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("[LiveCamera] Autoplay avertissement:", playErr);
        }
      }
    }
    setIsLoading(false);
  }, [stopStream]);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCameraError(null);
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Switch facing mode (Front / Back)
  const handleToggleFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  // Capture frame from video element
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front-facing for selfie natural look
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // Validate and apply captured image
  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Handle fallback file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
        stopStream();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Camera className="w-4 h-4" />
              </span>
              <h3 className="font-black text-white text-base sm:text-lg">{title}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[360px]">
          {/* Captured Image Preview State */}
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={capturedImage}
                alt="Capture preview"
                className={`max-h-[380px] w-auto max-w-full rounded-2xl object-contain shadow-lg ${
                  aspectRatio === 'square' ? 'aspect-square object-cover' : ''
                }`}
              />
              <div className="absolute top-4 left-4 bg-emerald-500/90 text-slate-950 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Check className="w-3.5 h-3.5" />
                <span>Photo capturée</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Error / Blocked State */
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {cameraError}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
                >
                  <Image className="w-4 h-4" />
                  <span>Choisir un fichier</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Réessayer</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 gap-2">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                  <span className="text-xs text-slate-300">Initialisation de la caméra...</span>
                </div>
              )}
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && stream) {
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder Target Guidelines */}
              <div className="absolute inset-0 pointer-events-none border-2 border-amber-400/30 m-4 rounded-2xl flex items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-l-2 border-amber-400 absolute top-2 left-2 rounded-tl-lg" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-amber-400 absolute top-2 right-2 rounded-tr-lg" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-amber-400 absolute bottom-2 left-2 rounded-bl-lg" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-amber-400 absolute bottom-2 right-2 rounded-br-lg" />
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleToggleFacing}
                title="Changer de caméra (Avant / Arrière)"
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-transform active:scale-90 cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Hidden Canvas for Frame Grab */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden File Input for Gallery / Local Photos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Controls Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reprendre</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Valider la photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Image className="w-4 h-4 text-blue-400" />
                <span>Galerie</span>
              </button>

              {/* Big Shutter Trigger Button */}
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={isLoading || !!cameraError}
                aria-label="Prendre la photo"
                className={`w-14 h-14 rounded-full border-4 border-white flex items-center justify-center transition-all cursor-pointer ${
                  isLoading || !!cameraError
                    ? 'opacity-40 cursor-not-allowed bg-slate-700'
                    : 'bg-amber-500 hover:bg-amber-400 shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-slate-950" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
