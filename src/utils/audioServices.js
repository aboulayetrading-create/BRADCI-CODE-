/**
 * BRAD'CI - Services Audio Unifiés (Audio Services)
 * Fournit:
 * 1. speakInstruction(text): Synthèse vocale française optimisée Web & Mobile WebView
 * 2. startRecording(): Démarrage d'enregistrement audio via MediaRecorder
 * 3. stopRecording(): Arrêt et restitution du Blob audio enregistré
 */

// --- Synthèse Vocale (Voix Off / Text-to-Speech) ---

export const speakInstruction = (text) => {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn("[BRAD'CI AudioServices] Synthèse vocale non disponible ou texte vide");
    return;
  }

  try {
    // Interrompt toute lecture vocale antérieure
    window.speechSynthesis.cancel();

    // Déblocage du contexte audio pour WebView Android et iOS
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Sélection de la meilleure voix française disponible
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find((v) => v.lang && (v.lang.startsWith('fr') || v.lang.includes('FR')));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        const found = updatedVoices.find((v) => v.lang && (v.lang.startsWith('fr') || v.lang.includes('FR')));
        if (found) {
          utterance.voice = found;
        }
      };
    }

    utterance.onerror = (err) => {
      console.warn("[BRAD'CI AudioServices] Erreur speakInstruction:", err);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("[BRAD'CI AudioServices] Exception speakInstruction:", err);
  }
};

// --- Enregistrement Audio (Voice Notes / MediaRecorder) ---

let currentMediaRecorder = null;
let currentAudioChunks = [];
let recordingStream = null;

export const startRecording = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("L'accès au microphone n'est pas supporté sur cet appareil.");
  }

  recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Détection du format audio le plus compatible
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
    currentMediaRecorder = new MediaRecorder(recordingStream, { mimeType });
  } catch {
    currentMediaRecorder = new MediaRecorder(recordingStream);
  }

  currentAudioChunks = [];

  currentMediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      currentAudioChunks.push(event.data);
    }
  };

  currentMediaRecorder.start(250);
  console.log("[BRAD'CI AudioServices] Enregistrement démarré.");
};

export const stopRecording = () => {
  return new Promise((resolve, reject) => {
    if (!currentMediaRecorder) {
      reject(new Error("Aucun enregistrement audio en cours."));
      return;
    }

    currentMediaRecorder.onstop = () => {
      const mime = currentMediaRecorder?.mimeType || 'audio/mp3';
      const audioBlob = new Blob(currentAudioChunks, { type: mime });

      // Libération propre des pistes du microphone
      try {
        if (recordingStream) {
          recordingStream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.warn("[BRAD'CI AudioServices] Erreur fermeture piste audio:", err);
      }

      currentMediaRecorder = null;
      recordingStream = null;
      currentAudioChunks = [];

      console.log(`[BRAD'CI AudioServices] Enregistrement arrêté, taille: ${audioBlob.size} octets`);
      resolve(audioBlob);
    };

    if (currentMediaRecorder.state !== 'inactive') {
      currentMediaRecorder.stop();
    } else {
      currentMediaRecorder = null;
      resolve(new Blob([], { type: 'audio/mp3' }));
    }
  });
};

export const cancelRecording = () => {
  try {
    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop());
    }
    if (currentMediaRecorder && currentMediaRecorder.state !== 'inactive') {
      currentMediaRecorder.stop();
    }
  } catch (e) {
    // ignore
  }
  currentMediaRecorder = null;
  recordingStream = null;
  currentAudioChunks = [];
};

// Exposition globale pour tests et compatibilité
if (typeof window !== 'undefined') {
  window.speakInstruction = speakInstruction;
  window.startRecording = startRecording;
  window.stopRecording = stopRecording;
}
