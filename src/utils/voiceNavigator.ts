// Voice Navigation, Turn-by-Turn Route Engine, and Full-Site Audio Speech System for Grand Abidjan
import { AppLanguage } from '../types';

export interface RouteStep {
  id: string;
  instruction: string;
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  icon: 'straight' | 'turn-right' | 'turn-left' | 'roundabout' | 'bridge' | 'destination' | 'pickup' | 'u-turn';
  streetName: string;
  warning?: string;
}

export interface RoutePlan {
  totalDistanceKm: number;
  totalDurationMin: number;
  originCommune: string;
  destinationCommune: string;
  steps: RouteStep[];
  googleMapsUrl: string;
}

// Generate realistic Abidjan road corridors with iconic bridges and expressways
export function generateAbidjanRoute(
  originCommune: string,
  destinationCommune: string,
  isReturn: boolean = false,
  lang: AppLanguage = 'fr'
): RoutePlan {
  const origin = isReturn ? destinationCommune : originCommune;
  const destination = isReturn ? originCommune : destinationCommune;

  const isEn = lang === 'en';

  const steps: RouteStep[] = [
    {
      id: 'step-1',
      instruction: isEn
        ? `Departure from ${origin}. Take the main avenue towards the central arterial road.`
        : `Départ de ${origin}. Prenez la voie principale vers l'artère centrale.`,
      distanceText: '500 m',
      distanceMeters: 500,
      durationText: '2 min',
      icon: isReturn ? 'u-turn' : 'pickup',
      streetName: isEn ? `Main Avenue of ${origin}` : `Avenue Principale de ${origin}`,
      warning: isEn ? 'Watch out for speed bumps and pedestrian crossings' : 'Attention aux ralentisseurs et passages piétons'
    },
    {
      id: 'step-2',
      instruction: isEn
        ? 'Merge onto the main expressway towards central Abidjan.'
        : 'Rejoignez le grand axe express vers le centre d\'Abidjan.',
      distanceText: '2,8 km',
      distanceMeters: 2800,
      durationText: '5 min',
      icon: 'straight',
      streetName: origin.toLowerCase().includes('cocody') 
        ? 'Boulevard François Mitterrand' 
        : origin.toLowerCase().includes('yopougon')
        ? 'Autoroute du Nord (Échangeur Gesco)'
        : 'Boulevard Valéry Giscard d\'Estaing (VGE)'
    },
    {
      id: 'step-3',
      instruction: isEn
        ? 'Cross the Ébrié Lagoon via the express bridge with fluid traffic.'
        : 'Empruntez le pont pour traverser la Lagune Ébrié avec trafic fluide.',
      distanceText: '1,9 km',
      distanceMeters: 1900,
      durationText: '4 min',
      icon: 'bridge',
      streetName: 'Pont Henri Konan Bédié (HKB) / Pont Alassane Ouattara',
      warning: isEn ? 'Electronic toll expressway or direct corridor' : 'Voie rapide à péage électronique ou liaison express'
    },
    {
      id: 'step-4',
      instruction: isEn
        ? `Take the right exit towards ${destination}.`
        : `Prenez la sortie droite vers la commune de ${destination}.`,
      distanceText: '1,4 km',
      distanceMeters: 1400,
      durationText: '3 min',
      icon: 'turn-right',
      streetName: isEn ? `Access ramp to ${destination}` : `Bretelle d'accès ${destination}`
    },
    {
      id: 'step-5',
      instruction: isEn
        ? `Turn left onto the destination street in ${destination}.`
        : `Tournez à gauche dans la rue de destination à ${destination}.`,
      distanceText: '350 m',
      distanceMeters: 350,
      durationText: '1 min',
      icon: 'turn-left',
      streetName: isEn ? `Residential Street ${destination}` : `Rue Résidentielle ${destination}`
    },
    {
      id: 'step-6',
      instruction: isReturn 
        ? (isEn ? `You have arrived at the Seller's address in ${destination}. Present the package for return restitution.` : `Vous êtes arrivé chez le Vendeur à ${destination}. Présentez le colis pour restitution.`)
        : (isEn ? `You have arrived at the Buyer's destination in ${destination}. Proceed with physical hands-on inspection.` : `Vous êtes arrivé chez le Destinataire à ${destination}. Effectuez le déballage contradictoire.`),
      distanceText: '50 m',
      distanceMeters: 50,
      durationText: isEn ? 'Arrival' : 'Arrivée',
      icon: 'destination',
      streetName: isEn ? `Final drop-off point - ${destination}` : `Point de livraison final - ${destination}`,
      warning: isEn ? 'Verify parcel conformity before sharing the 4-digit OTP code' : 'Vérifiez la conformité avant tout partage du code OTP'
    }
  ];

  const totalDist = 7.6;
  const totalDur = 15;

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    origin + ', Abidjan, Côte d\'Ivoire'
  )}&destination=${encodeURIComponent(
    destination + ', Abidjan, Côte d\'Ivoire'
  )}&travelmode=driving`;

  return {
    totalDistanceKm: totalDist,
    totalDurationMin: totalDur,
    originCommune: origin,
    destinationCommune: destination,
    steps,
    googleMapsUrl: gmapsUrl
  };
}

// Sound Synthesizers for UI alerts
export function playGpsChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio restriction handling
  }
}

export function playOrderAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(784, ctx.currentTime); // G5
    osc1.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.15); // C6
    
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start();
    osc1.stop(ctx.currentTime + 0.45);
  } catch {
    // Audio restriction handling
  }
}

export function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3); // C6
    
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio restriction handling
  }
}

// Speech Synthesis Web API Manager
class VoiceNavigatorService {
  private isMuted: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState: boolean = false;
  private rate: number = 1.05;
  private pitch: number = 1.0;

  constructor() {
    const savedVoiceState = localStorage.getItem('bradci_voice_enabled');
    if (savedVoiceState !== null) {
      this.isMuted = savedVoiceState === 'false';
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('bradci_voice_enabled', (!muted).toString());
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeakingState = false;
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState && ('speechSynthesis' in window) && window.speechSynthesis.speaking;
  }

  public speak(text: string, lang: AppLanguage = 'fr', onEnd?: () => void) {
    if (this.isMuted) return;
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this browser');
      return;
    }

    try {
      playGpsChime();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'fr-FR';
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => 
        lang === 'en' 
          ? v.lang.startsWith('en') 
          : (v.lang.startsWith('fr') || v.lang.includes('FR'))
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      this.isSpeakingState = true;

      utterance.onend = () => {
        this.currentUtterance = null;
        this.isSpeakingState = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        this.isSpeakingState = false;
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice navigation error:', err);
      this.isSpeakingState = false;
    }
  }

  public stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.isSpeakingState = false;
  }

  // 1. Order Accepted / Commande Acceptée
  public announceOrderAccepted(productTitle: string, driverName: string, lang: AppLanguage = 'fr') {
    const msg = lang === 'en'
      ? `Order accepted for ${productTitle} by courier ${driverName}. Delivery in progress.`
      : `Commande acceptée pour ${productTitle} par le livreur ${driverName}. Livraison en cours.`;
    this.speak(msg, lang);
  }

  // 2. Driver en route / Livreur en route
  public announceDriverEnRoute(driverName: string, pickupCommune: string, lang: AppLanguage = 'fr') {
    const msg = lang === 'en'
      ? `Courier ${driverName} has picked up the parcel in ${pickupCommune} and is now en route.`
      : `Le coursier ${driverName} a récupéré le colis à ${pickupCommune} et est maintenant en route.`;
    this.speak(msg, lang);
  }

  // 3. Driver Arrived / Livreur Arrivé
  public announceDriverArrived(driverName: string, dropoffCommune: string, lang: AppLanguage = 'fr') {
    playOrderAlertSound();
    const msg = lang === 'en'
      ? `Courier ${driverName} has arrived at ${dropoffCommune}. Please inspect the parcel and share the O.T.P. code.`
      : `Le livreur ${driverName} est arrivé à ${dropoffCommune} ! Veuillez inspecter le colis ensemble avant de donner votre code O.T.P.`;
    this.speak(msg, lang);
  }

  // 4. 5 Bids reached - Choose winner / Enchère 5 atteint
  public announceFiveBidsReached(productTitle: string, lang: AppLanguage = 'fr') {
    playOrderAlertSound();
    const msg = lang === 'en'
      ? `Five offers reached for auction ${productTitle}! Bidding is locked. Please choose which buyer to award the sale to.`
      : `Cinq offres atteintes pour l'enchère ${productTitle} ! Les enchères sont bloquées. Veuillez choisir la personne à qui vendre parmi les cinq offres.`;
    this.speak(msg, lang);
  }

  // 5. Buyer chosen -> Deposit alert / Gagnant choisi - Alerte dépôt
  public announceWinnerChosenAndDepositAlert(productTitle: string, amount: number, lang: AppLanguage = 'fr') {
    playSuccessChime();
    const msg = lang === 'en'
      ? `Great news! Your offer has been selected for ${productTitle}. Please complete your secure escrow deposit of ${amount.toLocaleString()} FCFA.`
      : `Félicitations ! Votre offre a été retenue par le vendeur pour ${productTitle}. Effectuez votre dépôt sous séquestre de ${amount.toLocaleString()} FCFA pour bloquer les fonds.`;
    this.speak(msg, lang);
  }

  // 6. Buyer cancelled -> Choose from remaining 4 / Acheteur refusé - Choisir parmi les 4 restants
  public announceBuyerDeclined(productTitle: string, bidderName: string, remainingCount: number, lang: AppLanguage = 'fr') {
    playOrderAlertSound();
    const msg = lang === 'en'
      ? `Buyer ${bidderName} declined. Please choose among the ${remainingCount} remaining bidders for ${productTitle}.`
      : `L'acheteur ${bidderName} s'est désisté. Veuillez choisir parmi les ${remainingCount} personnes restantes de l'enchère pour ${productTitle}.`;
    this.speak(msg, lang);
  }

  // 7. Funds available for withdrawal / Fonds disponibles pour retrait
  public announceFundsAvailable(amount: number, lang: AppLanguage = 'fr') {
    playSuccessChime();
    const msg = lang === 'en'
      ? `Delivery validated! Escrow funds of ${amount.toLocaleString()} FCFA released and now available for instant withdrawal.`
      : `Livraison validée par code O.T.P. ! Les fonds de ${amount.toLocaleString()} FCFA sont débloqués du séquestre et disponibles pour retrait sur votre solde.`;
    this.speak(msg, lang);
  }

  // 8. New courier order / Nouvelle commande fret
  public announceDriverIncomingOrder(pickup: string, dropoff: string, fee: number, lang: AppLanguage = 'fr') {
    playOrderAlertSound();
    const msg = lang === 'en'
      ? `New nearby delivery order available! From ${pickup} to ${dropoff}. Payout ${fee.toLocaleString()} FCFA.`
      : `Nouvelle commande à proximité disponible ! De ${pickup} à ${dropoff}. Rémunération ${fee.toLocaleString()} FCFA.`;
    this.speak(msg, lang);
  }

  // 9. Read Current Screen / Lecture des parties essentielles
  public readCurrentScreen(title: string, keyPoints: string[], lang: AppLanguage = 'fr') {
    const joinedPoints = keyPoints.join('. ');
    const fullText = lang === 'en'
      ? `Overview for ${title}. ${joinedPoints}`
      : `Aperçu de la page ${title}. ${joinedPoints}`;
    this.speak(fullText, lang);
  }

  public playSuccessChime() {
    playOrderAlertSound();
  }

  public playWarningBeep() {
    playOrderAlertSound();
  }

  public playChime() {
    playOrderAlertSound();
  }

  public announceVoiceActivated(lang: AppLanguage = 'fr') {
    const msg = lang === 'en'
      ? "Brad'CI Voice Assistance active. Ready for live order announcements, 5-bid arbitration, and escrow updates."
      : "Assistance vocale Brad'CI activée. Annonces en direct des enchères, livraisons, arbitrages des 5 offres et séquestre prêtes.";
    this.speak(msg, lang);
  }

  public testVoice(lang: AppLanguage = 'fr') {
    this.announceVoiceActivated(lang);
  }
}

export const voiceNavigator = new VoiceNavigatorService();

export function announceDriverIncomingOrder(pickup: string, dropoff: string, fee: number, lang: AppLanguage = 'fr') {
  voiceNavigator.announceDriverIncomingOrder(pickup, dropoff, fee, lang);
}

export function announcePurchaseSuccess(productTitle: string, lang: AppLanguage = 'fr') {
  voiceNavigator.speak(
    lang === 'en'
      ? `Purchase completed successfully for ${productTitle}. Escrow locked and courier assigned.`
      : `Achat effectué avec succès pour ${productTitle}. Fonds bloqués sous séquestre et livreur attribué.`,
    lang
  );
}

export function announceSaleSuccess(productTitle: string, lang: AppLanguage = 'fr') {
  voiceNavigator.speak(
    lang === 'en'
      ? `New sale recorded for ${productTitle}. Searching for available courier.`
      : `Nouvelle vente enregistrée pour ${productTitle}. Recherche de livreur en cours.`,
    lang
  );
}
