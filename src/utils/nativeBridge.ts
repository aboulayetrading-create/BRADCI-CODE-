import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';

export interface NativeLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export interface NativePhotoResult {
  dataUrl: string;
  format?: string;
}

export type NativePhotoSource = 'camera' | 'photos' | 'prompt';
export type NativeCameraFacing = 'user' | 'environment';

class NativeBridgeService {
  /**
   * Check if running on native mobile (Android / iOS)
   */
  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get current platform: 'android' | 'ios' | 'web'
   */
  public getPlatform(): string {
    return Capacitor.getPlatform();
  }

  public isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  // =========================================================================
  // 1. GEOLOCATION GPS (CAPACITOR @capacitor/geolocation)
  // =========================================================================

  /**
   * Check current GPS permission status
   */
  public async checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if (this.isNative()) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location === 'granted') return 'granted';
        if (perm.location === 'denied') return 'denied';
        return 'prompt';
      }

      // Browser fallback permission check
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        const status = await (navigator.permissions as any).query({ name: 'geolocation' });
        if (status.state === 'granted') return 'granted';
        if (status.state === 'denied') return 'denied';
        return 'prompt';
      }
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  /**
   * Explicitly request GPS location permission
   */
  public async requestLocationPermission(): Promise<boolean> {
    try {
      if (this.isNative()) {
        const req = await Geolocation.requestPermissions({
          permissions: ['location', 'coarseLocation']
        });
        return req.location === 'granted' || req.coarseLocation === 'granted';
      }

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            (err) => resolve(err.code !== 1),
            { timeout: 10000, enableHighAccuracy: true }
          );
        });
      }
      return true;
    } catch (err) {
      console.warn('[NativeBridge] requestLocationPermission error:', err);
      return false;
    }
  }

  /**
   * Obtain accurate GPS location via Capacitor Geolocation
   */
  public async getCurrentPosition(options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }): Promise<NativeLocationResult> {
    const opts = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 12000,
      maximumAge: options?.maximumAge ?? 10000
    };

    try {
      // First try Capacitor Geolocation plugin
      const pos: Position = await Geolocation.getCurrentPosition(opts);
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        timestamp: pos.timestamp
      };
    } catch (capErr) {
      console.warn('[NativeBridge] Capacitor Geolocation fallback to web navigator:', capErr);

      // Web Browser fallback
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (webPos) => {
              resolve({
                latitude: webPos.coords.latitude,
                longitude: webPos.coords.longitude,
                accuracy: webPos.coords.accuracy,
                altitude: webPos.coords.altitude,
                speed: webPos.coords.speed,
                heading: webPos.coords.heading,
                timestamp: webPos.timestamp
              });
            },
            (err) => {
              reject(new Error(err.message || 'GPS location acquisition failed'));
            },
            opts
          );
        });
      }

      throw capErr;
    }
  }

  /**
   * Continuous position tracking for couriers / active orders
   */
  public async watchPosition(
    onSuccess: (loc: NativeLocationResult) => void,
    onError?: (err: unknown) => void
  ): Promise<string> {
    try {
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
        (position, err) => {
          if (err) {
            if (onError) onError(err);
            return;
          }
          if (position) {
            onSuccess({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              speed: position.coords.speed,
              heading: position.coords.heading,
              timestamp: position.timestamp
            });
          }
        }
      );
      return watchId;
    } catch (e) {
      console.warn('[NativeBridge] watchPosition fallback:', e);
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const webWatch = navigator.geolocation.watchPosition(
          (pos) => {
            onSuccess({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
              timestamp: pos.timestamp
            });
          },
          onError,
          { enableHighAccuracy: true, timeout: 15000 }
        );
        return String(webWatch);
      }
      throw e;
    }
  }

  public async clearWatch(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const numId = Number(watchId);
        if (!isNaN(numId)) {
          navigator.geolocation.clearWatch(numId);
        }
      }
    }
  }

  // =========================================================================
  // 2. CAMERA & GALLERY (CAPACITOR @capacitor/camera)
  // =========================================================================

  /**
   * Check current Camera permissions
   */
  public async checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if (this.isNative()) {
        const perm = await Camera.checkPermissions();
        if (perm.camera === 'granted') return 'granted';
        if (perm.camera === 'denied') return 'denied';
        return 'prompt';
      }

      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        try {
          const status = await (navigator.permissions as any).query({ name: 'camera' });
          if (status.state === 'granted') return 'granted';
          if (status.state === 'denied') return 'denied';
          return 'prompt';
        } catch {
          return 'prompt';
        }
      }
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  /**
   * Request native camera permissions (triggers browser getUserMedia prompt on Web/PWA)
   */
  public async requestCameraPermission(): Promise<boolean> {
    try {
      if (this.isNative()) {
        const req = await Camera.requestPermissions({
          permissions: ['camera', 'photos']
        });
        return req.camera === 'granted' || req.photos === 'granted';
      }

      // Web/PWA: invoke getUserMedia to display browser permission prompt
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(t => t.stop());
          return true;
        } catch (err: any) {
          console.warn('[NativeBridge] Web camera prompt error:', err);
          return false;
        }
      }
      return false;
    } catch (e) {
      console.warn('[NativeBridge] requestCameraPermission error:', e);
      return false;
    }
  }

  /**
   * Check microphone permission status
   */
  public async checkMicrophonePermission(): Promise<'prompt' | 'granted' | 'denied'> {
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        try {
          const status = await (navigator.permissions as any).query({ name: 'microphone' });
          if (status.state === 'granted') return 'granted';
          if (status.state === 'denied') return 'denied';
          return 'prompt';
        } catch {
          return 'prompt';
        }
      }
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  /**
   * Request microphone permission with real browser getUserMedia trigger
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
          return true;
        } catch (err: any) {
          console.warn('[NativeBridge] Web microphone prompt error:', err);
          return false;
        }
      }
      return false;
    } catch (err: any) {
      console.warn('[NativeBridge] requestMicrophonePermission error:', err);
      return false;
    }
  }

  /**
   * Web fallback photo capture via HTML5 file input with camera capture attribute
   */
  public capturePhotoViaInput(options?: {
    source?: NativePhotoSource;
    direction?: NativeCameraFacing;
  }): Promise<NativePhotoResult> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error("Document non disponible"));
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      // If user wants camera capture directly
      if (options?.source !== 'photos') {
        input.setAttribute('capture', options?.direction === 'user' ? 'user' : 'environment');
      }

      input.style.position = 'fixed';
      input.style.top = '-9999px';
      input.style.opacity = '0';
      document.body.appendChild(input);

      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) {
          try { document.body.removeChild(input); } catch {}
          reject(new Error("Opération annulée par l’utilisateur"));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          try { document.body.removeChild(input); } catch {}
          if (typeof reader.result === 'string') {
            resolve({
              dataUrl: reader.result,
              format: file.type.split('/')[1] || 'jpeg'
            });
          } else {
            reject(new Error("Échec de conversion de l'image"));
          }
        };
        reader.onerror = (err) => {
          try { document.body.removeChild(input); } catch {}
          reject(err);
        };
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  /**
   * Capture photo or select from gallery using Capacitor Camera API with Web fallback
   */
  public async capturePhoto(options?: {
    source?: NativePhotoSource;
    direction?: NativeCameraFacing;
    quality?: number;
    allowEditing?: boolean;
    width?: number;
    height?: number;
  }): Promise<NativePhotoResult> {
    const sourceMap: Record<NativePhotoSource, CameraSource> = {
      camera: CameraSource.Camera,
      photos: CameraSource.Photos,
      prompt: CameraSource.Prompt
    };

    const directionMap: Record<NativeCameraFacing, CameraDirection> = {
      user: CameraDirection.Front,
      environment: CameraDirection.Rear
    };

    const selectedSource = options?.source ? sourceMap[options.source] : CameraSource.Camera;
    const selectedDirection = options?.direction ? directionMap[options.direction] : CameraDirection.Rear;

    if (this.isNative()) {
      try {
        const perm = await this.checkCameraPermission();
        if (perm !== 'granted') {
          await this.requestCameraPermission();
        }

        const photo = await Camera.getPhoto({
          quality: options?.quality ?? 85,
          allowEditing: options?.allowEditing ?? false,
          resultType: CameraResultType.DataUrl,
          source: selectedSource,
          direction: selectedDirection,
          width: options?.width,
          height: options?.height,
          correctOrientation: true,
          saveToGallery: false,
          promptLabelHeader: 'Sélectionner la Photo',
          promptLabelPhoto: 'Choisir dans la Galerie Photos',
          promptLabelPicture: 'Prendre une Nouvelle Photo'
        });

        if (!photo.dataUrl) {
          throw new Error("Impossible d'obtenir la photo capturée");
        }

        return {
          dataUrl: photo.dataUrl,
          format: photo.format
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('User cancelled') || msg.includes('cancelled') || msg.includes('canceled')) {
          throw new Error('Opération annulée par l’utilisateur');
        }
        console.warn('[NativeBridge] Capacitor Camera error, falling back to Web Input:', err);
      }
    }

    // On Web / PWA / WebAPK fallback
    return this.capturePhotoViaInput(options);
  }
}

export const nativeBridge = new NativeBridgeService();
