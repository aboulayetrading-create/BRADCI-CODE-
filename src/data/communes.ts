import { VehicleType } from '../types';

export interface Neighborhood {
  name: string;
  code?: string;
}

export interface ZoneCommune {
  id: string;
  name: string;
  group: 'Grand Abidjan (13 Communes)' | 'Villes Métropolitaines & Balnéaires';
  type: 'abidjan_intramuros' | 'villes_environnantes';
  tier: 'central' | 'periphery' | 'outer_axis' | 'coastal_far';
  coords: { lat: number; lng: number };
  neighborhoods: string[];
  description: string;
  baseDeliveryFeeMoto: number; // Base rate in FCFA
  zone?: string;
}

export const ALL_COMMUNES: ZoneCommune[] = [
  // ==========================================
  // 1. GRAND ABIDJAN (TOUTES LES 13 COMMUNES)
  // ==========================================
  {
    id: 'cocody',
    name: 'Cocody',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.3599, lng: -3.9875 },
    neighborhoods: [
      'Angré (8ème, 7ème, Djibi, Château)',
      'Riviera 1, 2, 3, 4, Golf & Palmeraie',
      'Deux-Plateaux & II-Plateaux Vallons',
      'Attoban',
      'Danga',
      'M\'Pouto & M\'Badon',
      'Ambassades & CHU'
    ],
    description: 'Zone résidentielle & commerciale haute intensité',
    baseDeliveryFeeMoto: 1200
  },
  {
    id: 'plateau',
    name: 'Le Plateau',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.3261, lng: -4.0197 },
    neighborhoods: [
      'Centre des Affaires & Sièges Banques',
      'Cité Administrative (Tours A à E)',
      'Avenue Chardy & Rue du Commerce',
      'Plateau Indénié'
    ],
    description: 'Centre des affaires et administrations',
    baseDeliveryFeeMoto: 1200
  },
  {
    id: 'marcory',
    name: 'Marcory',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.2954, lng: -3.9847 },
    neighborhoods: [
      'Zone 4 (Rue du 7 Décembre, Paul Langevin)',
      'Biétry',
      'Marcory Résidentiel',
      'Remblais & GFCI',
      'Anoumabo'
    ],
    description: 'Hub commercial & vie nocturne chic',
    baseDeliveryFeeMoto: 1200
  },
  {
    id: 'treichville',
    name: 'Treichville',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.3059, lng: -4.0083 },
    neighborhoods: [
      'Avenue 16 & Marché de Treichville',
      'Arras',
      'Zone Portuaire & Industrielle',
      'Belleville & CHU Treichville'
    ],
    description: 'Cœur historique commerçant et portuaire',
    baseDeliveryFeeMoto: 1200
  },
  {
    id: 'koumassi',
    name: 'Koumassi',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.2991, lng: -3.9482 },
    neighborhoods: [
      'Remblais',
      'Prodomo',
      'Zone Industrielle Koumassi',
      'Sicogi & Grand Campement',
      'Soweto'
    ],
    description: 'Carrefour d\'échanges sud et zone industrielle',
    baseDeliveryFeeMoto: 1400
  },
  {
    id: 'yopougon',
    name: 'Yopougon',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.3438, lng: -4.0768 },
    neighborhoods: [
      'Siporex & Saint-André',
      'Bel Air & Banco',
      'Yopougon Maroc',
      'Niangon (Nord, Sud, Lokoa)',
      'Kouté & Village',
      'Toit Rouge & Camp Militaire',
      'Académie & Gesco',
      'Wassakara & Sideci'
    ],
    description: 'Plus grande commune populaire et carrefour économique',
    baseDeliveryFeeMoto: 1500
  },
  {
    id: 'abobo',
    name: 'Abobo',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.4164, lng: -4.0194 },
    neighborhoods: [
      'Abobo Sogefiha & Mairie',
      'PK 18 & Agbékoi',
      'N\'Dotré & Abobo Baoulé',
      'Anador & Avocatier',
      'Abobo Banco & Gare'
    ],
    description: 'Grande plaque tournante du nord d\'Abidjan',
    baseDeliveryFeeMoto: 1500
  },
  {
    id: 'adjame',
    name: 'Adjamé',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.3582, lng: -4.0275 },
    neighborhoods: [
      'Mirador & Grand Marché',
      '220 Logements & Mermoz',
      'Williamsville',
      'Habitat Extension',
      'Gare Routière & Bracodi'
    ],
    description: 'Centre névralgique du négoce et du commerce de gros',
    baseDeliveryFeeMoto: 1300
  },
  {
    id: 'attecoube',
    name: 'Attécoubé',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.3371, lng: -4.0418 },
    neighborhoods: [
      'Locodjro',
      'Abobo-Doumé (Gare Lagunaire)',
      'Santé (1, 2, 3)',
      'Attécoubé Agban & Débarcadère'
    ],
    description: 'Zone côtière lagunaire et accès maritime',
    baseDeliveryFeeMoto: 1300
  },
  {
    id: 'port_bouet',
    name: 'Port-Bouët',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'central',
    coords: { lat: 5.2573, lng: -3.9431 },
    neighborhoods: [
      'Gonzagueville & Terre Rouge',
      'Vridi (Cité & Zone Portuaire)',
      'Zone Aéroport Félix Houphouët-Boigny',
      'Derrière-L\'Appontement & Phare',
      'Adjouffou'
    ],
    description: 'Façade maritime, aéroport international et industrie pétrolière',
    baseDeliveryFeeMoto: 1500
  },
  {
    id: 'anyama',
    name: 'Anyama',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'periphery',
    coords: { lat: 5.4947, lng: -4.0519 },
    neighborhoods: [
      'Anyama Centre & Mairie',
      'Zossonkoi',
      'Zone Industrielle PK24 & Stade Alassane Ouattara (Ebimpé)',
      'Anyama Adjamé',
      'Ahouabo'
    ],
    description: 'Pôle métropolitain nord & Stade Olympique Ebimpé',
    baseDeliveryFeeMoto: 2500
  },
  {
    id: 'brofodoume',
    name: 'Brofodoumé',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'periphery',
    coords: { lat: 5.4489, lng: -3.8821 },
    neighborhoods: [
      'Brofodoumé Centre',
      'Attiékoi',
      'Danguira',
      'M\'Brou'
    ],
    description: 'Bordure métropolitaine nord-est du District d\'Abidjan',
    baseDeliveryFeeMoto: 2800
  },
  {
    id: 'songon',
    name: 'Songon',
    group: 'Grand Abidjan (13 Communes)',
    type: 'abidjan_intramuros',
    tier: 'periphery',
    coords: { lat: 5.3182, lng: -4.2589 },
    neighborhoods: [
      'Songon Kassemblé',
      'Bimbresso',
      'Songon Dagbé & Songon Agban',
      'Songon M\'Brathé'
    ],
    description: 'Axe ouest de l\'agglomération et extension lagunaire',
    baseDeliveryFeeMoto: 2800
  },

  // ==============================================================
  // 2. VILLES MÉTROPOLITAINES & BALNÉAIRES À PROXIMITÉ (AXES STRATÉGIQUES)
  // ==============================================================
  {
    id: 'bingerville',
    name: 'Bingerville',
    group: 'Villes Métropolitaines & Balnéaires',
    type: 'villes_environnantes',
    tier: 'outer_axis',
    coords: { lat: 5.3558, lng: -3.8961 },
    neighborhoods: [
      'Ephrata & Feh Kessé',
      'Sebroko & Blanchon',
      'Faya Extension & Abatta',
      'Marché de Bingerville & Lycée Scientifique',
      'Anan'
    ],
    description: 'Ville résidentielle historique & axe périurbain est',
    baseDeliveryFeeMoto: 2000
  },
  {
    id: 'grand_bassam',
    name: 'Grand-Bassam',
    group: 'Villes Métropolitaines & Balnéaires',
    type: 'villes_environnantes',
    tier: 'outer_axis',
    coords: { lat: 5.2078, lng: -3.7388 },
    neighborhoods: [
      'Quartier France (Patrimoine UNESCO)',
      'Mockeyville',
      'Rosiers & Azuretti',
      'Zone Touristique & Plages',
      'Village Artisanal & Moossou',
      'Impérial'
    ],
    description: 'Cité balnéaire et historique classée UNESCO à 20 min d\'Abidjan',
    baseDeliveryFeeMoto: 3500
  },
  {
    id: 'assinie',
    name: 'Assinie',
    group: 'Villes Métropolitaines & Balnéaires',
    type: 'villes_environnantes',
    tier: 'coastal_far',
    coords: { lat: 5.1432, lng: -3.2798 },
    neighborhoods: [
      'Assinie-Mafia & Club Med',
      'Assouindé',
      'PK 0 à PK 10 (Zone Résidentielle)',
      'PK 11 à PK 22 (Bord de Lagune & Villas Privées)',
      'Mandjian & Akounougbé'
    ],
    description: 'Station balnéaire haut de gamme & résidences de luxe bord de lagune',
    baseDeliveryFeeMoto: 6500
  },
  {
    id: 'dabou',
    name: 'Dabou',
    group: 'Villes Métropolitaines & Balnéaires',
    type: 'villes_environnantes',
    tier: 'outer_axis',
    coords: { lat: 5.3256, lng: -4.3767 },
    neighborhoods: [
      'Dabou Centre & Mairie',
      'Armbe',
      'Quartier Hôpital Méthodiste',
      'Pass & Toupah',
      'Lycée Tiéba'
    ],
    description: 'Grand carrefour agro-industriel & ville métropolitaine de l\'axe ouest',
    baseDeliveryFeeMoto: 3800
  }
];

// Calculate Haversine distance in KM
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Find nearest commune based on coordinates
export function findNearestCommune(lat: number, lng: number): ZoneCommune {
  let minDistance = Infinity;
  let nearest = ALL_COMMUNES[0];

  for (const c of ALL_COMMUNES) {
    const dist = calculateHaversineDistance(lat, lng, c.coords.lat, c.coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = c;
    }
  }

  return nearest;
}

export function getCommuneCoords(communeName: string): { lat: number; lng: number } {
  const match = ALL_COMMUNES.find(
    c => c.name.toLowerCase() === communeName.toLowerCase() ||
         communeName.toLowerCase().includes(c.name.toLowerCase()) ||
         c.name.toLowerCase().includes(communeName.toLowerCase())
  );
  return match ? match.coords : { lat: 5.3599, lng: -4.0083 };
}

// Helper to calculate realistic delivery fees between two communes depending on vehicle type & distance tier
export function calculateDeliveryFee(
  pickupCommuneName: string,
  dropoffCommuneName: string,
  vehicle: VehicleType = 'moto'
): number {
  const pickup = ALL_COMMUNES.find(c => c.name.toLowerCase() === pickupCommuneName.toLowerCase() || pickupCommuneName.toLowerCase().includes(c.name.toLowerCase()));
  const dropoff = ALL_COMMUNES.find(c => c.name.toLowerCase() === dropoffCommuneName.toLowerCase() || dropoffCommuneName.toLowerCase().includes(c.name.toLowerCase()));

  // Vehicle multipliers (Moto Express vs Cargo / Fourgon)
  const vehicleMultiplier = vehicle === 'cargo' ? 2.5 : 1.0;

  // If same commune: intra-commune discount (reduced to 1 000 - 1 200 F)
  if (pickup && dropoff && pickup.id === dropoff.id) {
    const base = Math.max(1000, Math.round((pickup.baseDeliveryFeeMoto * 0.8) / 100) * 100);
    return Math.round((base * vehicleMultiplier) / 100) * 100;
  }

  // Check tiers
  const tierScores: Record<string, number> = {
    central: 1,
    periphery: 2,
    outer_axis: 3,
    coastal_far: 5
  };

  const score1 = pickup ? tierScores[pickup.tier] : 1;
  const score2 = dropoff ? tierScores[dropoff.tier] : 1;
  const combinedScore = score1 + score2;

  let baseFee = 1400;
  if (combinedScore <= 2) {
    baseFee = 1400; // intra central Abidjan (ex: Plateau to Cocody)
  } else if (combinedScore === 3) {
    baseFee = 2000; // Central to Periphery (ex: Marcory to Yopougon or Anyama)
  } else if (combinedScore === 4) {
    baseFee = 2800; // Central to Bingerville or Songon
  } else if (combinedScore === 5) {
    baseFee = 3800; // Grand-Bassam or Dabou
  } else if (combinedScore >= 6) {
    baseFee = 7000; // Assinie or long-distance route
  }

  return Math.round((baseFee * vehicleMultiplier) / 100) * 100;
}

// Calculate approximate road distance between two communes in Grand Abidjan (in km)
export function calculateCommuneDistanceKm(commune1Name: string, commune2Name: string): number {
  if (!commune1Name || !commune2Name) return 5.0;
  const name1 = commune1Name.trim().toLowerCase();
  const name2 = commune2Name.trim().toLowerCase();

  const c1 = ALL_COMMUNES.find(c => c.name.toLowerCase() === name1 || name1.includes(c.name.toLowerCase()));
  const c2 = ALL_COMMUNES.find(c => c.name.toLowerCase() === name2 || name2.includes(c.name.toLowerCase()));

  if (!c1 || !c2) return 5.0;
  if (c1.id === c2.id) return 1.4; // Intra-commune pickup proximity

  const R = 6371; // Earth radius in km
  const dLat = (c2.coords.lat - c1.coords.lat) * (Math.PI / 180);
  const dLng = (c2.coords.lng - c1.coords.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.coords.lat * (Math.PI / 180)) * Math.cos(c2.coords.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadDetourFactor = 1.35; // Bridges & expressways detour factor
  return Math.round(R * c * roadDetourFactor * 10) / 10;
}
export const COMMUNE_NAMES_ABIDJAN = ALL_COMMUNES.filter(c => c.type === 'abidjan_intramuros').map(c => c.name);
export const COMMUNE_NAMES_ENVIRONS = ALL_COMMUNES.filter(c => c.type === 'villes_environnantes').map(c => c.name);
export const ALL_COMMUNE_NAMES = ALL_COMMUNES.map(c => c.name);
export const ABIDJAN_COMMUNES = ALL_COMMUNES;

// Get formatted badge styling for a commune
export function getCommuneBadgeInfo(communeName: string) {
  const match = ALL_COMMUNES.find(c => c.name.toLowerCase() === communeName.toLowerCase() || communeName.toLowerCase().includes(c.name.toLowerCase()));
  if (!match) {
    return {
      label: communeName,
      isOuter: false,
      tag: 'Abidjan',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700'
    };
  }

  if (match.type === 'villes_environnantes') {
    return {
      label: match.name,
      isOuter: true,
      tag: match.tier === 'coastal_far' ? 'Balnéaire' : 'Métropole',
      badgeClass: match.tier === 'coastal_far' 
        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' 
        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    };
  }

  return {
    label: match.name,
    isOuter: false,
    tag: 'Abidjan',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
  };
}
