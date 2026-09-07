/**
 * BRAD'CI - Helper Robuste de Synthèse Vocale & Guidage Voix Off
 * Optimisé pour Android WebView, iPhone iOS et Web
 */

export const speakGuidance = (text: string): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn("[BRAD'CI Voix Off] Synthèse vocale non supportée sur ce navigateur");
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stoppe la parole en cours

    // Déblocage audio immédiat pour WebView Android & iOS
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Chargement forcé des voix sur WebView Android
    let voices = window.speechSynthesis.getVoices();
    let frVoice = voices.find(v => v.lang.includes('fr') || v.lang.includes('FR'));
    
    if (frVoice) {
      utterance.voice = frVoice;
    } else {
      // Si la liste des voix n'est pas encore initialisée par le moteur Android WebView
      const handleVoicesChanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        const found = updatedVoices.find(v => v.lang.includes('fr') || v.lang.includes('FR'));
        if (found) {
          utterance.voice = found;
        }
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }

    utterance.onerror = (e) => {
      console.warn("[BRAD'CI Voix Off] Erreur lecture vocale:", e);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("[BRAD'CI Voix Off] Exception synthèse vocale:", err);
  }
};

// Exposition globale pour tests et accessibilité DevTools / scripts natifs
export { speakInstruction } from './audioServices';

if (typeof window !== 'undefined') {
  (window as any).speakGuidance = speakGuidance;
}
