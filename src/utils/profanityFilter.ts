// Anti-Profanity & Content Moderation Filter for Brad'CI Reviews & Comments

const BANNED_PATTERNS = [
  // French Profanities
  'connard', 'connasse', 'con', 'conne', 'salope', 'salaud', 'batard', 'bâtard',
  'fils de pute', 'fdp', 'putain', 'pute', 'merde', 'merdeux', 'chier', 'enculé', 'encule',
  'imbécile', 'imbecile', 'idiot', 'idiote', 'abrutit', 'abruti', 'crétin', 'cretin',
  'escroc', 'voleur', 'voleuse', 'arnaqueur', 'arnaqueuse', 'foutre', 'bordel',
  'nique', 'niquer', 'nique ta mère', 'ntm', 'taré', 'tare', 'mongol',

  // Ivorian / West African Nouchi slurs & offenses
  'gnanman', 'gnanmancro', 'cabri', 'chien', 'tchô', 'maudit', 'maudite',
  'mouff', 'gaou', 'plaiki', 'brouteur', 'brouteuse', 'tchoin', 'kpakpato'
];

/**
 * Checks if a text contains offensive words or profanity
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' '); // remove special chars

  return BANNED_PATTERNS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(normalized) || normalized.includes(word);
  });
}

/**
 * Censors profanities by replacing them with ***
 */
export function censorProfanity(text: string): string {
  if (!text) return '';
  let filtered = text;

  BANNED_PATTERNS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
    // Also replace direct occurrences if typed with repeating chars
    const flexibleRegex = new RegExp(word, 'gi');
    filtered = filtered.replace(flexibleRegex, '***');
  });

  return filtered;
}

/**
 * Validates and formats review comments with automatic filter & courteous feedback
 */
export function cleanReviewComment(text: string): { cleanedText: string; wasProfane: boolean } {
  const isProfane = containsProfanity(text);
  const cleaned = censorProfanity(text);
  return {
    cleanedText: cleaned,
    wasProfane: isProfane
  };
}
