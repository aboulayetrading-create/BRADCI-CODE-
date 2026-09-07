/**
 * BRAD'CI - Module Natif d'Enregistrement de Notes Vocales (Audio Recorder API)
 * Permet la capture et l'envoi de notes vocales entre livreurs et clients
 */

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingStartTime: number = 0;

/**
 * Démarre l'enregistrement d'une note vocale via le microphone
 */
export const startVoiceRecording = async (): Promise<void> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("L'enregistrement audio n'est pas supporté par ce navigateur.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Détermination du meilleur format audio supporté
  let mimeType = 'audio/webm';
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg';
    }
  }

  try {
    mediaRecorder = new MediaRecorder(stream, { mimeType });
  } catch {
    // Fallback sans option
    mediaRecorder = new MediaRecorder(stream);
  }

  audioChunks = [];
  recordingStartTime = Date.now();

  mediaRecorder.ondataavailable = (e: BlobEvent) => {
    if (e.data && e.data.size > 0) {
      audioChunks.push(e.data);
    }
  };

  mediaRecorder.start(250); // collecte des chunks toutes les 250ms
  console.log("[BRAD'CI Audio] Enregistrement note vocale démarré.");
};

/**
 * Arrête l'enregistrement et retourne le Blob audio final
 */
export const stopVoiceRecording = (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error("Aucun enregistrement en cours."));
      return;
    }

    mediaRecorder.onstop = () => {
      // Détermine le type de blob (fallback audio/mp3)
      const mime = mediaRecorder?.mimeType || 'audio/mp3';
      const audioBlob = new Blob(audioChunks, { type: mime });
      
      // Libère immédiatement les pistes audio matérielles du microphone
      try {
        if (mediaRecorder?.stream) {
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.warn("[BRAD'CI Audio] Arrêt des pistes microphone:", err);
      }

      console.log(`[BRAD'CI Audio] Note vocale enregistrée (${audioBlob.size} octets, durée: ${Math.round((Date.now() - recordingStartTime) / 1000)}s)`);
      resolve(audioBlob);
    };

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });
};

/**
 * Vérifie si l'enregistrement vocal est actuellement actif
 */
export const isVoiceRecordingActive = (): boolean => {
  return mediaRecorder !== null && mediaRecorder.state === 'recording';
};

/**
 * Annule l'enregistrement en cours sans sauvegarder
 */
export const cancelVoiceRecording = (): void => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      mediaRecorder.stop();
    } catch {
      // ignore
    }
  }
  mediaRecorder = null;
  audioChunks = [];
};

// Exposition globale
export { startRecording, stopRecording, cancelRecording } from './audioServices';

if (typeof window !== 'undefined') {
  (window as any).startVoiceRecording = startVoiceRecording;
  (window as any).stopVoiceRecording = stopVoiceRecording;
}
