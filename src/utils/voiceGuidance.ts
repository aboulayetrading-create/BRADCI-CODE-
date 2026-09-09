/**
 * BRAD'CI - Helper Robuste de Synthèse Vocale & Guidage Voix Off
 * Optimisé pour Android WebView, iPhone iOS et Web
 */
import { speakInstruction, playGpsChime } from './audioServices';

export const speakGuidance = (text: string, lang?: string): void => {
  speakInstruction(text, lang);
};

// Exposition globale pour tests et accessibilité DevTools / scripts natifs
export { speakInstruction, playGpsChime } from './audioServices';

if (typeof window !== 'undefined') {
  (window as any).speakGuidance = speakGuidance;
}

