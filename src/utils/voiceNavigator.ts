// Voice Navigation, Turn-by-Turn Route Engine, and Full-Site Audio Speech System for Grand Abidjan
import { AppLanguage } from '../types';
import { translateGpsInstructionToEn } from './audioServices';
export { speakGuidance } from './voiceGuidance';

export interface RouteStep {
  id: string;
  instruction: string;
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  icon: 'straight' | 'turn-right' | 'turn-left' | 'roundabout' | 'bridge' | 'destination' | 'pickup' | 'u-turn';
  streetName: string;
  speedLimitKmh?: number; // Vitesse maximale autorisée (km/h)
  roadType?: 'highway' | 'expressway' | 'avenue' | 'bridge' | 'residential';
  warning?: string;
}

// Détection intelligente de la limitation de vitesse selon l'artère d'Abidjan
export function getSpeedLimitForRoad(streetName?: string, defaultLimit: number = 50): number {
  if (!streetName) return defaultLimit;
  const lower = streetName.toLowerCase();
  // Voie rapide / Autoroute / Gesco / Rocade Y4
  if (
    lower.includes('autoroute') || 
    lower.includes('gesco') || 
    lower.includes('rocade') || 
    lower.includes('y4') || 
    lower.includes('contournement')
  ) {
    return 80;
  }
  // Ponts et franchissements lagunaires
  if (
    lower.includes('pont') || 
    lower.includes('hkb') || 
    lower.includes('ouattara') || 
    lower.includes('de gaulle') || 
    lower.includes('houphouët') || 
    lower.includes('houphouet')
  ) {
    return 70;
  }
  // Grands boulevards urbains
  if (
    lower.includes('boulevard') || 
    lower.includes('vge') || 
    lower.includes('giscard') || 
    lower.includes('mitterrand') || 
    lower.includes('latrille') || 
    lower.includes('express')
  ) {
    return 60;
  }
  // Ruelles résidentielles et pistes d'accès
  if (
    lower.includes('rue') || 
    lower.includes('ruelle') || 
    lower.includes('résidentiel') || 
    lower.includes('residential') || 
    lower.includes('lotissement') || 
    lower.includes('quartier') || 
    lower.includes('impasse') ||
    lower.includes('piste')
  ) {
    return 30;
  }
  // Avenue urbaine standard
  return defaultLimit;
}

export interface RoutePlan {
  totalDistanceKm: number;
  totalDurationMin: number;
  originCommune: string;
  destinationCommune: string;
  steps: RouteStep[];
  googleMapsUrl: string;
}

export interface RoutePlanOption {
  id: 'fastest' | 'shortest' | 'eco_bypassing';
  name: string;
  badge: string;
  description: string;
  totalDistanceKm: number;
  totalDurationMin: number;
  trafficCondition: 'fluid' | 'moderate' | 'dense';
  tollRequired: boolean;
  tollName?: string;
  viaStreet: string;
  steps: RouteStep[];
  googleMapsUrl: string;
}

export interface AlternativeRoutesBundle {
  phase: 'pickup' | 'dropoff';
  phaseTitle: string;
  originCommune: string;
  destinationCommune: string;
  targetAddress: string;
  targetContactName: string;
  targetContactPhone: string;
  options: RoutePlanOption[];
  activeOptionId: 'fastest' | 'shortest' | 'eco_bypassing';
}

// Générateur VTC Pro d'itinéraires alternatifs pour Grand Abidjan
export function generateAbidjanAlternativeRoutes(
  originCommune: string,
  destinationCommune: string,
  phase: 'pickup' | 'dropoff' = 'pickup',
  targetAddress: string = '',
  targetContactName: string = '',
  targetContactPhone: string = '',
  lang: AppLanguage = 'fr'
): AlternativeRoutesBundle {
  const origin = originCommune || 'Cocody';
  const destination = destinationCommune || 'Le Plateau';
  const isPickup = phase === 'pickup';
  const isEn = lang === 'en';

  const baseDistKm = Math.max(3.2, origin.toLowerCase() === destination.toLowerCase() ? 3.5 : 8.4);
  const baseDurationMin = Math.round(baseDistKm * 2.1);

  // Option 1 : Voie Rapide & Express (Recommandé VTC)
  const option1Steps: RouteStep[] = [
    {
      id: 'opt1-step1',
      instruction: isEn
        ? (isPickup 
            ? "Departure to seller pickup point. Take the main avenue towards the expressway."
            : "Departure to customer destination. Take the main avenue towards the expressway.")
        : (isPickup 
            ? "Départ vers le point de retrait chez le vendeur. Prenez la voie principale vers l'artère express."
            : "Départ vers le client destinataire. Prenez la voie principale vers l'artère express."),
      distanceText: '400 m',
      distanceMeters: 400,
      durationText: isEn ? '1 min' : '1 min',
      icon: isPickup ? 'pickup' : 'straight',
      streetName: isEn ? `Main Avenue of ${origin}` : `Avenue Principale de ${origin}`,
      speedLimitKmh: 50,
      roadType: 'avenue',
      warning: isEn ? 'Watch out for speed bumps and pedestrian crossings' : 'Attention aux ralentisseurs et passages piétons'
    },
    {
      id: 'opt1-step2',
      instruction: isEn
        ? "Merge onto the fluid expressway and maintain your cruising speed."
        : "Rejoignez la voie express fluide et maintenez votre vitesse de croisière.",
      distanceText: `${(baseDistKm * 0.4).toFixed(1)} km`,
      distanceMeters: Math.round(baseDistKm * 400),
      durationText: isEn ? '4 min' : '4 min',
      icon: 'straight',
      streetName: origin.toLowerCase().includes('yopougon')
        ? 'Autoroute du Nord (Échangeur Gesco)'
        : origin.toLowerCase().includes('cocody')
        ? 'Boulevard François Mitterrand'
        : 'Boulevard Valéry Giscard d\'Estaing (VGE)',
      speedLimitKmh: origin.toLowerCase().includes('yopougon') ? 80 : 60,
      roadType: origin.toLowerCase().includes('yopougon') ? 'highway' : 'expressway'
    },
    {
      id: 'opt1-step3',
      instruction: isEn
        ? "Cross the lagoon via the high-speed bridge with fluid traffic."
        : "Franchissez la lagune via la passerelle rapide à trafic vert.",
      distanceText: '2,1 km',
      distanceMeters: 2100,
      durationText: isEn ? '3 min' : '3 min',
      icon: 'bridge',
      streetName: 'Pont Henri Konan Bédié (HKB) / Pont Alassane Ouattara',
      speedLimitKmh: 70,
      roadType: 'bridge',
      warning: isEn ? 'Fluid traffic • Secure expressway' : 'Trafic fluide • Voie express sécurisée'
    },
    {
      id: 'opt1-step4',
      instruction: isEn
        ? `Take the exit ramp towards ${destination}.`
        : `Prenez la bretelle de sortie vers le secteur de ${destination}.`,
      distanceText: '900 m',
      distanceMeters: 900,
      durationText: isEn ? '2 min' : '2 min',
      icon: 'turn-right',
      streetName: isEn ? `Access ramp to ${destination}` : `Bretelle d'accès ${destination}`,
      speedLimitKmh: 50,
      roadType: 'avenue'
    },
    {
      id: 'opt1-step5',
      instruction: isEn
        ? (isPickup
            ? `Turn right onto the seller's street (${targetAddress || destination}).`
            : `Turn right onto the buyer's street (${targetAddress || destination}).`)
        : (isPickup
            ? `Tournez à droite dans la rue du Vendeur (${targetAddress || destination}).`
            : `Tournez à droite dans la rue du Client (${targetAddress || destination}).`),
      distanceText: '250 m',
      distanceMeters: 250,
      durationText: isEn ? '1 min' : '1 min',
      icon: 'turn-right',
      streetName: targetAddress || (isEn ? `Main Street ${destination}` : `Rue Principale ${destination}`),
      speedLimitKmh: 40,
      roadType: 'residential'
    },
    {
      id: 'opt1-step6',
      instruction: isEn
        ? (isPickup
            ? "You have arrived at the seller pickup point. Inspect the parcel and ask for the pickup code."
            : "You have arrived at the buyer's destination. Proceed with handover inspection and ask for the OTP code.")
        : (isPickup
            ? "Vous êtes arrivé au point de retrait vendeur. Effectuez le contrôle du colis et demandez le code d'enlèvement."
            : "Vous êtes arrivé chez le destinataire. Procédez au déballage contradictoire et demandez le code OTP."),
      distanceText: '30 m',
      distanceMeters: 30,
      durationText: isEn ? 'Arrival' : 'Arrivée',
      icon: 'destination',
      streetName: targetAddress || destination,
      speedLimitKmh: 30,
      roadType: 'residential',
      warning: isPickup 
        ? (isEn ? 'Require the 4-digit seller code' : 'Exigez le code vendeur 4 chiffres')
        : (isEn ? 'Verify parcel before sharing any code' : 'Vérifiez la conformité avant tout partage du code')
    }
  ];

  // Option 2 : Axe Direct / Voie Centrale (Distance la plus courte)
  const opt2DistKm = Number((baseDistKm * 0.82).toFixed(1));
  const opt2DurationMin = Math.round(baseDurationMin * 1.15);
  const option2Steps: RouteStep[] = [
    {
      id: 'opt2-step1',
      instruction: isEn
        ? (isPickup
            ? `Direct Route: head straight towards the pickup point in ${destination}.`
            : `Direct Route: head straight towards the customer in ${destination}.`)
        : (isPickup
            ? `Itinéraire Direct : avancez droit vers le point de retrait à ${destination}.`
            : `Itinéraire Direct : avancez droit vers le client à ${destination}.`),
      distanceText: '600 m',
      distanceMeters: 600,
      durationText: isEn ? '2 min' : '2 min',
      icon: 'straight',
      streetName: isEn ? `Central Boulevard ${origin}` : `Boulevard Central ${origin}`,
      speedLimitKmh: 50,
      roadType: 'avenue'
    },
    {
      id: 'opt2-step2',
      instruction: isEn
        ? "Continue on the main avenue without tolls."
        : "Continuez sur le boulevard principal sans péage.",
      distanceText: `${(opt2DistKm * 0.6).toFixed(1)} km`,
      distanceMeters: Math.round(opt2DistKm * 600),
      durationText: `${Math.round(opt2DurationMin * 0.5)} min`,
      icon: 'straight',
      streetName: 'Boulevard Général de Gaulle / Boulevard Latrille',
      speedLimitKmh: 60,
      roadType: 'expressway',
      warning: isEn ? 'Moderate slowdowns at traffic lights' : 'Ralentissements modérés aux feux tricolores'
    },
    {
      id: 'opt2-step3',
      instruction: isEn
        ? `At the roundabout, take the second exit towards ${destination}.`
        : `Au grand carrefour, prenez la deuxième sortie vers ${destination}.`,
      distanceText: '1,2 km',
      distanceMeters: 1200,
      durationText: isEn ? '3 min' : '3 min',
      icon: 'roundabout',
      streetName: isEn ? `Central Junction ${destination}` : `Carrefour Central ${destination}`,
      speedLimitKmh: 40,
      roadType: 'avenue'
    },
    {
      id: 'opt2-step4',
      instruction: isEn
        ? (isPickup ? "Approaching seller pickup location." : "Approaching customer delivery destination.")
        : (isPickup ? "Arrivée imminente chez le vendeur au point de retrait." : "Arrivée imminente chez le client destinataire."),
      distanceText: '50 m',
      distanceMeters: 50,
      durationText: isEn ? 'Arrival' : 'Arrivée',
      icon: 'destination',
      streetName: targetAddress || destination,
      speedLimitKmh: 30,
      roadType: 'residential'
    }
  ];

  // Option 3 : Voie Secondaire / Contournement des bouchons
  const opt3DistKm = Number((baseDistKm * 1.25).toFixed(1));
  const opt3DurationMin = Math.round(baseDurationMin * 1.05);
  const option3Steps: RouteStep[] = [
    {
      id: 'opt3-step1',
      instruction: isEn
        ? "Smart Route: take the ring road to bypass city traffic lights."
        : "Itinéraire Malin : bifurquez sur la rocade pour contourner les feux d'Abidjan.",
      distanceText: '700 m',
      distanceMeters: 700,
      durationText: isEn ? '2 min' : '2 min',
      icon: 'turn-left',
      streetName: isEn ? 'Express bypass road (Y4 / Outer Ring)' : 'Voie de dégagement express (Y4 / Contournement)',
      speedLimitKmh: 60,
      roadType: 'expressway'
    },
    {
      id: 'opt3-step2',
      instruction: isEn
        ? "Continue on the outer ring road with continuous fluid traffic."
        : "Poursuivez sur la rocade périphérique fluide sans arrêts.",
      distanceText: `${(opt3DistKm * 0.7).toFixed(1)} km`,
      distanceMeters: Math.round(opt3DistKm * 700),
      durationText: isEn ? '6 min' : '6 min',
      icon: 'straight',
      streetName: isEn ? 'Outer Ring Road Y4 / Intercommunal Axis' : 'Rocade Périphérique Y4 / Voie Intercommunale',
      speedLimitKmh: 80,
      roadType: 'highway',
      warning: isEn ? 'Very fluid traffic • Ideal during rush hours' : 'Trafic très fluide • Idéal heures de pointe'
    },
    {
      id: 'opt3-step3',
      instruction: isEn
        ? `Fork right onto the secondary ramp leading to ${destination}.`
        : `Bifurquez à droite sur la bretelle secondaire menant à ${destination}.`,
      distanceText: '1,1 km',
      distanceMeters: 1100,
      durationText: isEn ? '2 min' : '2 min',
      icon: 'turn-right',
      streetName: isEn ? `Entry corridor ${destination}` : `Axe d'entrée ${destination}`,
      speedLimitKmh: 50,
      roadType: 'avenue'
    },
    {
      id: 'opt3-step4',
      instruction: isEn
        ? (isPickup ? "Seller pickup location reached via fast bypass." : "Customer destination reached via fast bypass.")
        : (isPickup ? "Point de retrait vendeur atteint par contournement rapide." : "Client destinataire atteint par contournement rapide."),
      distanceText: '40 m',
      distanceMeters: 40,
      durationText: isEn ? 'Arrival' : 'Arrivée',
      icon: 'destination',
      streetName: targetAddress || destination,
      speedLimitKmh: 30,
      roadType: 'residential'
    }
  ];

  const buildGmapsUrl = (dest: string) => 
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin + ', Abidjan, Côte d\'Ivoire')}&destination=${encodeURIComponent(dest + ', ' + destination + ', Abidjan, Côte d\'Ivoire')}&travelmode=driving`;

  const options: RoutePlanOption[] = [
    {
      id: 'fastest',
      name: isEn ? 'Route 1: Fast Highway (Recommended)' : 'Itinéraire 1 : Voie Rapide (Recommandé)',
      badge: isEn ? 'Fastest • VTC Recommended' : 'Le plus rapide • Recommandé VTC',
      description: isEn 
        ? "Via major express corridors & bridges of Abidjan for a smooth trip."
        : "Via les grands corridors express & ponts d'Abidjan pour un trajet sans encombrement.",
      totalDistanceKm: baseDistKm,
      totalDurationMin: baseDurationMin,
      trafficCondition: 'fluid',
      tollRequired: true,
      tollName: 'Pont HKB / Alassane Ouattara',
      viaStreet: isEn ? 'Express Boulevard & Bridges' : 'Boulevard Express & Ponts',
      steps: option1Steps,
      googleMapsUrl: buildGmapsUrl(targetAddress || destination)
    },
    {
      id: 'shortest',
      name: isEn ? 'Route 2: Direct Axis (Shortest Distance)' : 'Itinéraire 2 : Axe Direct (Distance Mini)',
      badge: isEn ? 'Fewer Kilometers • Economical' : 'Moins de kilomètres • Économique',
      description: isEn
        ? "Direct line through central urban avenues without tolls."
        : "Ligne directe par les artères urbaines sans péage, pour réduire la consommation.",
      totalDistanceKm: opt2DistKm,
      totalDurationMin: opt2DurationMin,
      trafficCondition: 'moderate',
      tollRequired: false,
      viaStreet: isEn ? 'Central Urban Boulevards' : 'Boulevards Urbains Centraux',
      steps: option2Steps,
      googleMapsUrl: buildGmapsUrl(targetAddress || destination)
    },
    {
      id: 'eco_bypassing',
      name: isEn ? 'Route 3: Traffic Bypass' : 'Itinéraire 3 : Contourne Bouchons',
      badge: isEn ? 'Maximum Fluidity • Rush Hours' : 'Fluidité Maximale • Heures de pointe',
      description: isEn
        ? "Bypasses congested intersections via the ring road."
        : "Évite les carrefours à feux saturés en contournant par la rocade périphérique.",
      totalDistanceKm: opt3DistKm,
      totalDurationMin: opt3DurationMin,
      trafficCondition: 'fluid',
      tollRequired: false,
      viaStreet: isEn ? 'Ring Road Y4 & Lateral Corridors' : 'Rocade Y4 & Voies Latérales',
      steps: option3Steps,
      googleMapsUrl: buildGmapsUrl(targetAddress || destination)
    }
  ];

  return {
    phase,
    phaseTitle: isPickup 
      ? (isEn ? 'Step 1: Route to pickup location (Seller)' : 'Étape 1 : Trajet vers le point de retrait (Vendeur)')
      : (isEn ? 'Step 2: Route to delivery location (Buyer)' : 'Étape 2 : Trajet vers le point de livraison (Acheteur)'),
    originCommune: origin,
    destinationCommune: destination,
    targetAddress: targetAddress || destination,
    targetContactName: targetContactName || (isPickup ? 'Vendeur' : 'Client'),
    targetContactPhone: targetContactPhone || '+2250700000000',
    options,
    activeOptionId: 'fastest'
  };
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
      speedLimitKmh: 50,
      roadType: 'avenue',
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
        : 'Boulevard Valéry Giscard d\'Estaing (VGE)',
      speedLimitKmh: origin.toLowerCase().includes('yopougon') ? 80 : 60,
      roadType: origin.toLowerCase().includes('yopougon') ? 'highway' : 'expressway'
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
      speedLimitKmh: 70,
      roadType: 'bridge',
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
      streetName: isEn ? `Access ramp to ${destination}` : `Bretelle d'accès ${destination}`,
      speedLimitKmh: 50,
      roadType: 'avenue'
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
      streetName: isEn ? `Residential Street ${destination}` : `Rue Résidentielle ${destination}`,
      speedLimitKmh: 40,
      roadType: 'residential'
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
      speedLimitKmh: 30,
      roadType: 'residential',
      warning: isEn ? 'Verify parcel conformity before sharing the 4-digit secret code' : 'Vérifiez la conformité avant tout partage du Code Secret'
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

// Authentic Multi-Tone Delivery Ringtone for incoming orders (Courier sound alert)
export function playDriverNewOrderRingtone() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Melodic notes sequence: E5 (659Hz) -> G5 (784Hz) -> B5 (987Hz) -> E6 (1318Hz)
    // Repeat with 2 attention-grabbing pulse bursts
    const notes = [
      { freq: 659.25, time: 0.00, dur: 0.14 },
      { freq: 783.99, time: 0.14, dur: 0.14 },
      { freq: 987.77, time: 0.28, dur: 0.16 },
      { freq: 1318.5, time: 0.44, dur: 0.35 },
      // Second loop burst
      { freq: 783.99, time: 0.90, dur: 0.12 },
      { freq: 987.77, time: 1.02, dur: 0.14 },
      { freq: 1318.5, time: 1.16, dur: 0.45 }
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0.22, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  } catch (err) {
    console.warn('Driver ringtone audio playback prevented by browser policy:', err);
  }
}

export function playDriverProximityPing() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15); // D6

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio restriction handling
  }
}

export function playOrderAlertSound() {
  playDriverNewOrderRingtone();
}

export function playOutbidAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Urgent dual tone alert: rising urgency for auction outbid
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.24); // D6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
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

/**
 * Sirène radar / avertisseur sonore d'excès de vitesse (Aigu, deux tons, autoritaire)
 * Fonctionne même si l'audio du guidage GPS est désactivé
 */
export function playOverspeedAlarm() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Séquence d'alerte radar rapide deux tons : 880Hz -> 659Hz -> 880Hz -> 987Hz
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(659.25, now + 0.12);
    osc.frequency.setValueAtTime(880, now + 0.24);
    osc.frequency.setValueAtTime(659.25, now + 0.36);
    osc.frequency.setValueAtTime(987.77, now + 0.48);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.setValueAtTime(0.32, now + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);

    // Vibration haptique sur smartphone Android APK
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 350]);
    }
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
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private resumeInterval: any = null;

  constructor() {
    const savedVoiceState = typeof window !== 'undefined' ? localStorage.getItem('bradci_voice_enabled') : null;
    if (savedVoiceState !== null) {
      this.isMuted = savedVoiceState === 'false';
    }
    this.initVoices();
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  public unlockAudio() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch {
      // ignore
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bradci_voice_enabled', (!muted).toString());
    }
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeakingState = false;
      this.clearResumeInterval();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState && (typeof window !== 'undefined' && 'speechSynthesis' in window) && window.speechSynthesis.speaking;
  }

  private clearResumeInterval() {
    if (this.resumeInterval) {
      clearInterval(this.resumeInterval);
      this.resumeInterval = null;
    }
  }

  public speak(text: string, lang?: AppLanguage, onEnd?: () => void) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this browser');
      return;
    }

    try {
      playGpsChime();
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      // Resolve active language (from argument or app state in localStorage)
      const activeLang: AppLanguage = lang || (typeof localStorage !== 'undefined' ? (localStorage.getItem('bradci_lang') as AppLanguage) : 'fr') || 'fr';
      const isEn = activeLang === 'en';

      // Auto-translate to English if user interface is configured in English
      const spokenText = isEn ? translateGpsInstructionToEn(text) : text;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = isEn ? 'en-US' : 'fr-FR';
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;

      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
      if (isEn) {
        const enVoice = voices.find(v => v.lang && (v.lang.toLowerCase().startsWith('en-us') || v.lang.toLowerCase().startsWith('en-gb')))
          || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'))
          || voices.find(v => v.name && (v.name.includes('English') || v.name.includes('Google US') || v.name.includes('Samantha')));
        if (enVoice) utterance.voice = enVoice;
      } else {
        const frenchVoice = voices.find(v => v.lang && (v.lang.toLowerCase().startsWith('fr-fr') || v.lang.toLowerCase().startsWith('fr')))
          || voices.find(v => v.name && (v.name.includes('French') || v.name.includes('Google Français') || v.name.includes('Thomas')));
        if (frenchVoice) utterance.voice = frenchVoice;
      }

      this.isSpeakingState = true;

      // Chrome / Android keepalive interval to prevent freezing on utterances
      this.clearResumeInterval();
      this.resumeInterval = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else {
          this.clearResumeInterval();
        }
      }, 5000);

      utterance.onend = () => {
        this.clearResumeInterval();
        this.currentUtterance = null;
        this.isSpeakingState = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.clearResumeInterval();
        this.currentUtterance = null;
        this.isSpeakingState = false;
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice navigation error:', err);
      this.clearResumeInterval();
      this.isSpeakingState = false;
    }
  }

  public stop() {
    this.clearResumeInterval();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.isSpeakingState = false;
  }

  public announceVoiceActivated(lang: AppLanguage = 'fr') {
    const msg = lang === 'en'
      ? "BRAD'CI Voice Guidance activated. Live audio alerts for auctions and deliveries are now enabled."
      : "Assistance vocale BRAD'CI activée. Annonces en direct des enchères et des livraisons en cours.";
    this.speak(msg, lang);
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

  // 10. Outbid Announcement / Annonce de surenchère en direct
  public announceOutbid(productTitle: string, amount: number, lang: AppLanguage = 'fr') {
    const msg = lang === 'en'
      ? `Outbid alert! A user placed a higher bid of ${amount.toLocaleString()} CFA on ${productTitle}. Take back the lead now!`
      : `Alerte surenchère ! Un utilisateur a surenchéri à ${amount.toLocaleString('fr-FR')} FCFA sur ${productTitle}. Reprenez la main !`;
    this.speak(msg, lang);
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

  public testVoice(lang: AppLanguage = 'fr') {
    this.announceVoiceActivated(lang);
  }

  /**
   * Alerte Vocale de Signalisation de Vitesse Excessive (Sécurité Routière Prioritaire)
   * RÈGLE CRITIQUE : Bypasse this.isMuted !
   * Se déclenche impérativement même si le livreur a coupé le guidage vocal habituel.
   */
  public announceOverspeedAlert(
    currentSpeed: number, 
    speedLimit: number, 
    streetName: string = '', 
    lang: AppLanguage = 'fr'
  ) {
    // 1. Déclencher immédiatement la sirène radar d'urgence
    playOverspeedAlarm();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      this.unlockAudio();
      this.clearResumeInterval();
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const isEn = lang === 'en';
      const warningText = isEn
        ? `Warning! Excessive speed! You are driving at ${currentSpeed} kilometers per hour on a road limited to ${speedLimit} kilometers per hour. Slow down immediately!`
        : `Attention ! Vitesse excessive : vous roulez à ${currentSpeed} kilomètres heure, sur une voie limitée à ${speedLimit} kilomètres heure. Ralentissez immédiatement !`;

      const utterance = new SpeechSynthesisUtterance(warningText);
      utterance.lang = isEn ? 'en-US' : 'fr-FR';
      utterance.rate = 1.15; // Élocution d'urgence rapide et claire
      utterance.pitch = 1.12;

      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
      if (isEn) {
        const enVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'))
          || voices.find(v => v.name && v.name.includes('English'));
        if (enVoice) utterance.voice = enVoice;
      } else {
        const frenchVoice = voices.find(v => v.lang && (v.lang.toLowerCase().startsWith('fr-fr') || v.lang.toLowerCase().startsWith('fr')))
          || voices.find(v => v.name && (v.name.includes('French') || v.name.includes('Google Français') || v.name.includes('Thomas')));
        if (frenchVoice) utterance.voice = frenchVoice;
      }

      this.isSpeakingState = true;

      // Keepalive interval for Android Chrome / WebView
      this.resumeInterval = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else {
          this.clearResumeInterval();
        }
      }, 3000);

      utterance.onend = () => {
        this.clearResumeInterval();
        this.currentUtterance = null;
        this.isSpeakingState = false;
      };

      utterance.onerror = () => {
        this.clearResumeInterval();
        this.currentUtterance = null;
        this.isSpeakingState = false;
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);

      // Diffuse l'événement pour réagir dans l'interface (HUD, Carte, Vibration)
      window.dispatchEvent(new CustomEvent('bradci-overspeed-alert', {
        detail: {
          currentSpeed,
          speedLimit,
          streetName,
          text: warningText,
          timestamp: Date.now()
        }
      }));
    } catch (err) {
      console.warn('Overspeed voice alert error:', err);
      this.clearResumeInterval();
      this.isSpeakingState = false;
    }
  }
}

export const voiceNavigator = new VoiceNavigatorService();

export function announceOverspeedAlert(
  currentSpeed: number, 
  speedLimit: number, 
  streetName: string = '', 
  lang: AppLanguage = 'fr'
) {
  voiceNavigator.announceOverspeedAlert(currentSpeed, speedLimit, streetName, lang);
}

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
