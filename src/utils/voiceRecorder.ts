/**
 * BRAD'CI - Module Natif d'Enregistrement de Notes Vocales (Audio Recorder API)
 * Permet la capture et l'envoi de notes vocales entre livreurs et clients
 */

import { 
  startRecording, 
  stopRecording, 
  cancelRecording,
  createSyntheticAudioWav 
} from './audioServices';

let isRecordingActive = false;

/**
 * Démarre l'enregistrement d'une note vocale (avec repli doux si micro restreint)
 */
export const startVoiceRecording = async (): Promise<{ isFallback: boolean }> => {
  try {
    const res = await startRecording();
    isRecordingActive = true;
    return res || { isFallback: false };
  } catch (err) {
    console.warn("[BRAD'CI Audio] Fallback enregistrement:", err);
    isRecordingActive = true;
    return { isFallback: true };
  }
};

/**
 * Arrête l'enregistrement et retourne le Blob audio final
 */
export const stopVoiceRecording = (): Promise<Blob> => {
  isRecordingActive = false;
  return stopRecording();
};

/**
 * Vérifie si l'enregistrement vocal est actuellement actif
 */
export const isVoiceRecordingActive = (): boolean => {
  return isRecordingActive;
};

/**
 * Annule l'enregistrement en cours sans sauvegarder
 */
export const cancelVoiceRecording = (): void => {
  isRecordingActive = false;
  cancelRecording();
};

// Exposition globale
export { startRecording, stopRecording, cancelRecording, createSyntheticAudioWav } from './audioServices';

if (typeof window !== 'undefined') {
  (window as any).startVoiceRecording = startVoiceRecording;
  (window as any).stopVoiceRecording = stopVoiceRecording;
}
