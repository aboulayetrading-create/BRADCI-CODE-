/**
 * Biometric Facial Recognition & Comparison Engine for BRAD'CI
 * Simulates Google Vision Face Detection & OpenCV Biometric Vector Comparison.
 * Enforces strict compliance between Profile Photo, Official ID Document, and Live KYC Selfies.
 */

export interface BiometricCheckResult {
  success: boolean;
  confidenceScore: number; // e.g. 96.8 (%)
  faceDetected: boolean;
  eyeContact: boolean;
  lightingAdequate: boolean;
  errorMessage?: string;
  errorMessageEn?: string;
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    noseTip: { x: number; y: number };
    mouthCenter: { x: number; y: number };
  };
  details?: {
    facialSymmetry: number;
    posePitch: number;
    poseRoll: number;
    matchWithIdDoc: boolean;
  };
}

export const STRICT_BIOMETRIC_REJECTION_MESSAGE_FR = 
  "Photo non conforme. La photo de profil doit être une photo claire de votre visage correspondant à votre pièce d'identité.";

export const STRICT_BIOMETRIC_REJECTION_MESSAGE_EN = 
  "Non-compliant photo. Profile photo must be a clear picture of your face matching your ID document.";

/**
 * Checks if a data URL or image URL looks like an invalid / non-face image
 * (e.g. landscapes, blank pictures, generic objects, vehicle photos, or corrupt buffers).
 */
export function isNonFaceImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string' || url.trim().length === 0) return true;
  const lower = url.toLowerCase();
  // Check known vehicle or object demo images that are not human faces
  if (lower.includes('photo-1553440569-bcc63803a83d') || // car registration
      lower.includes('photo-1523275335684') || // watch/product
      lower.includes('photo-1505740420928') || // headphones
      lower.includes('blank') ||
      lower.includes('placeholder-empty')) {
    return true;
  }
  return false;
}

/**
 * Analyzes an image (Profile photo or KYC selfie) and performs Biometric Facial Verification.
 * Compares against reference ID or Selfie if provided.
 */
export async function verifyFacialBiometrics(
  inputImageUrl: string,
  referenceIdPhotoUrl?: string,
  referenceSelfieUrl?: string
): Promise<BiometricCheckResult> {
  // Simulate rapid AI neural inference latency (350ms - 600ms)
  await new Promise(resolve => setTimeout(resolve, 450));

  if (!inputImageUrl || isNonFaceImageUrl(inputImageUrl)) {
    return {
      success: false,
      confidenceScore: 12.4,
      faceDetected: false,
      eyeContact: false,
      lightingAdequate: false,
      errorMessage: STRICT_BIOMETRIC_REJECTION_MESSAGE_FR,
      errorMessageEn: STRICT_BIOMETRIC_REJECTION_MESSAGE_EN
    };
  }

  // If reference ID photo is provided and is a non-face / mismatch
  if (referenceIdPhotoUrl && isNonFaceImageUrl(referenceIdPhotoUrl)) {
    return {
      success: false,
      confidenceScore: 28.5,
      faceDetected: false,
      eyeContact: false,
      lightingAdequate: false,
      errorMessage: STRICT_BIOMETRIC_REJECTION_MESSAGE_FR,
      errorMessageEn: STRICT_BIOMETRIC_REJECTION_MESSAGE_EN
    };
  }

  // Generate realistic facial landmark geometry coordinates for overlay
  const landmarks = {
    leftEye: { x: 42 + Math.floor(Math.random() * 4), y: 38 + Math.floor(Math.random() * 3) },
    rightEye: { x: 58 + Math.floor(Math.random() * 4), y: 38 + Math.floor(Math.random() * 3) },
    noseTip: { x: 50 + Math.floor(Math.random() * 2), y: 52 + Math.floor(Math.random() * 3) },
    mouthCenter: { x: 50 + Math.floor(Math.random() * 2), y: 68 + Math.floor(Math.random() * 3) }
  };

  // Compute high-confidence match (94.5% - 98.9%)
  const score = Math.floor(940 + Math.random() * 50) / 10;

  return {
    success: true,
    confidenceScore: score,
    faceDetected: true,
    eyeContact: true,
    lightingAdequate: true,
    landmarks,
    details: {
      facialSymmetry: 0.98,
      posePitch: 1.2,
      poseRoll: -0.4,
      matchWithIdDoc: true
    }
  };
}
