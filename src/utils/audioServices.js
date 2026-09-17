/**
 * BRAD'CI - Services Audio Unifiés (Audio Services)
 * Fournit:
 * 1. speakInstruction(text): Synthèse vocale française optimisée Web & Mobile WebView
 * 2. startRecording(): Démarrage d'enregistrement audio via MediaRecorder
 * 3. stopRecording(): Arrêt et restitution du Blob audio enregistré
 */

// --- Synthèse Vocale (Voix Off / Text-to-Speech) & Alertes Sonores ---

// Shared AudioContext to prevent exceeding mobile Android hardware limit
let sharedAudioCtx = null;
const getAudioCtx = () => {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

// Synthétiseur d'alerte sonore GPS (Double carillon d'attention VTC)
export const playGpsChime = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Note 1 (Mi / 659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Note 2 (La / 880 Hz - plus aigu)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.22, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.28);
  } catch (err) {
    console.warn("[BRAD'CI AudioServices] Chime sonore indisponible:", err);
  }
};

// Dictionnaire de traduction automatique Français -> Anglais pour le guidage GPS, VTC & alertes
export const translateGpsInstructionToEn = (frenchText) => {
  if (!frenchText) return '';
  let str = frenchText;

  const phraseMap = [
    // Phrases clés de guidage et cockpits
    [/Guidage Voix Off BRAD'CI activé/gi, "BRAD'CI Voice Guidance activated"],
    [/Assistance vocale BRAD'CI activée/gi, "BRAD'CI Voice Assistant activated"],
    [/Voix Off coupée/gi, "Voice Guidance muted"],
    [/Mode silencieux actif/gi, "Silent navigation active"],
    [/Répétition/gi, "Repeating maneuver"],
    [/Instruction Répétée/gi, "Instruction Repeated"],
    [/Simulation Course Active/gi, "Live courier motion active"],
    [/Course en Pause/gi, "Courier motion paused"],
    [/Recentrage sur votre position GPS/gi, "Recentering on your GPS position"],
    [/Recentrage sur le coursier en transit/gi, "Recentering on transit courier"],
    [/Recentrage GPS/gi, "Recentering GPS"],
    [/Recentrer le GPS/gi, "Recenter GPS"],
    [/Recentrer & Suivre le livreur/gi, "Recenter & Follow Courier"],
    [/Guidage vocal activé/gi, "Voice guidance enabled"],
    [/Position fixée sur/gi, "Position fixed on"],
    [/Position fixée à/gi, "GPS fixed at"],
    [/Position GPS détectée à/gi, "GPS location detected in"],
    [/Vous avez signalé votre arrivée chez le client acheteur\./gi, "You notified the buyer of your arrival."],
    [/Arrivée notifiée/gi, "Arrival notified"],
    [/L'acheteur a été notifié de votre présence\./gi, "Buyer has been notified of your presence."],
    [/Le livreur se déplace en direct sur la carte\./gi, "Courier is moving live on the map."],
    [/Mouvement du coursier suspendu\./gi, "Courier motion suspended."],
    [/Code vendeur requis/gi, "Seller pickup code required"],
    [/Veuillez saisir le code à 4 chiffres fourni par le vendeur\./gi, "Please enter the 4-digit code provided by the seller."],
    [/Code OTP client validé/gi, "Customer OTP validated"],
    [/Code OTP requis/gi, "Customer OTP required"],
    [/Les instructions seront annoncées à haute voix\./gi, "Turn-by-turn spoken instructions are active."],
    [/Départ vers le point de retrait chez le vendeur\. Prenez la voie principale vers l'artère express\./gi, "Departure to seller pickup point. Take the main avenue towards the expressway."],
    [/Départ vers le client destinataire\. Prenez la voie principale vers l'artère express\./gi, "Departure to customer destination. Take the main avenue towards the expressway."],
    [/Rejoignez la voie express fluide et maintenez votre vitesse de croisière\./gi, "Merge onto the fluid expressway and maintain cruising speed."],
    [/Rejoignez le grand axe express vers le centre d'Abidjan\./gi, "Merge onto the main expressway towards central Abidjan."],
    [/Franchissez la lagune via la passerelle rapide à trafic vert\./gi, "Cross the lagoon via the express bridge."],
    [/Empruntez le pont pour traverser la Lagune Ébrié avec trafic fluide\./gi, "Cross the Ébrié Lagoon bridge with fluid traffic."],
    [/Prenez la bretelle de sortie vers le secteur de/gi, "Take the exit ramp towards"],
    [/Tournez à droite dans la rue du Vendeur/gi, "Turn right onto the seller's street"],
    [/Tournez à droite dans la rue du Client/gi, "Turn right onto the customer's street"],
    [/Vous êtes arrivé au point de retrait vendeur\. Effectuez le contrôle du colis et demandez le code d'enlèvement\./gi, "You have arrived at the seller pickup point. Verify the parcel and request the pickup code."],
    [/Vous êtes arrivé chez le destinataire\. Procédez au déballage contradictoire et demandez le code OTP\./gi, "You have arrived at the delivery destination. Proceed with handover inspection and ask for the OTP code."],
    [/Itinéraire Direct : avancez droit vers le point de retrait à/gi, "Direct Route: head straight towards pickup at"],
    [/Itinéraire Direct : avancez droit vers le client à/gi, "Direct Route: head straight towards customer at"],
    [/Continuez sur le boulevard principal sans péage\./gi, "Continue on the main avenue without tolls."],
    [/Au grand carrefour, prenez la deuxième sortie vers/gi, "At the roundabout, take the second exit towards"],
    [/Arrivée imminente chez le vendeur au point de retrait\./gi, "Approaching seller pickup location."],
    [/Arrivée imminente chez le client destinataire\./gi, "Approaching customer delivery destination."],
    [/Itinéraire Malin : bifurquez sur la rocade pour contourner les feux d'Abidjan\./gi, "Smart Route: take the bypass ring road to avoid city traffic lights."],
    [/Poursuivez sur la rocade périphérique fluide sans arrêts\./gi, "Continue on the fluid peripheral bypass road."],
    [/Bifurquez à droite sur la bretelle secondaire menant à/gi, "Fork right onto the secondary ramp leading to"],
    [/Point de retrait vendeur atteint par contournement rapide\./gi, "Seller pickup point reached via bypass."],
    [/Client destinataire atteint par contournement rapide\./gi, "Customer destination reached via bypass."],
    [/Colis récupéré avec succès\. Démarrage de l'itinéraire de livraison vers le client à/gi, "Parcel picked up successfully. Starting delivery route to customer in"],
    [/Colis récupéré avec succès/gi, "Parcel picked up successfully"],
    [/Félicitations ! Course livrée avec succès\. Vos gains sont débloqués immédiatement\./gi, "Congratulations! Delivery completed successfully. Your earnings are unlocked immediately."],
    [/Trajet vers le point de retrait vendeur à/gi, "Route to seller pickup point in"],
    [/Trajet vers le client destinataire à/gi, "Route to customer destination in"],
    [/Voie Rapide activé\. Durée estimée :/gi, "Fast Route activated. Estimated time:"],
    [/Axe Direct activé\. Durée estimée :/gi, "Direct Route activated. Estimated time:"],
    [/Contournement activé\. Durée estimée :/gi, "Bypass Route activated. Estimated time:"],
    [/Rejoignez l'artère principale vers/gi, "Merge onto the main avenue towards"],
    [/Attention aux ralentisseurs et passages piétons/gi, "Watch out for speed bumps and pedestrian crossings"],
    [/Trafic fluide • Voie express sécurisée/gi, "Fluid traffic • Secure expressway"],
    [/Ralentissements modérés aux feux tricolores/gi, "Moderate slowdowns at traffic lights"],
    [/Trafic très fluide • Idéal heures de pointe/gi, "Very fluid traffic • Ideal for peak hours"],
    [/Annonces en direct des enchères et des livraisons en cours\./gi, "Live announcements for auctions and ongoing deliveries."],
    [/Achat confirmé\. Paiement direct à la livraison prévu lors de la remise en main propre\./gi, "Purchase confirmed. Cash on delivery scheduled upon physical handover."]
  ];

  for (const [pattern, replacement] of phraseMap) {
    str = str.replace(pattern, replacement);
  }

  // Traductions des termes de navigation et directions
  str = str
    .replace(/\bDépart de\b/gi, "Departure from")
    .replace(/\bDépart vers\b/gi, "Departure to")
    .replace(/\bPrenez la voie principale\b/gi, "Take the main avenue")
    .replace(/\bPrenez la voie\b/gi, "Take the road")
    .replace(/\bPrenez la\b/gi, "Take the")
    .replace(/\bTournez à gauche\b/gi, "Turn left")
    .replace(/\bTournez à droite\b/gi, "Turn right")
    .replace(/\bSerrez à gauche\b/gi, "Keep left")
    .replace(/\bSerrez à droite\b/gi, "Keep right")
    .replace(/\bContinuez tout droit\b/gi, "Continue straight")
    .replace(/\bFaites demi-tour\b/gi, "Make a U-turn")
    .replace(/\bAu rond-point\b/gi, "At the roundabout")
    .replace(/\bpremière sortie\b/gi, "first exit")
    .replace(/\bdeuxième sortie\b/gi, "second exit")
    .replace(/\btroisième sortie\b/gi, "third exit")
    .replace(/\bVous êtes arrivé\b/gi, "You have arrived")
    .replace(/\bvers le point de retrait\b/gi, "towards the pickup point")
    .replace(/\bchez le vendeur\b/gi, "at the seller")
    .replace(/\bchez le client\b/gi, "at the customer")
    .replace(/\bchez le destinataire\b/gi, "at the recipient")
    .replace(/\bà destination\b/gi, "at destination")
    .replace(/\bÉtape 1\b/gi, "Step 1")
    .replace(/\bÉtape 2\b/gi, "Step 2")
    .replace(/\bRetrait Colis\b/gi, "Parcel Pickup")
    .replace(/\bLivraison Client\b/gi, "Customer Delivery")
    .replace(/\bAvenue Principale de\b/gi, "Main Avenue of")
    .replace(/\bsur l'itinéraire de\b/gi, "on route from")
    .replace(/\bvers\b/gi, "towards")
    .replace(/\bDans (\d+)\s*m\b/gi, "In $1 meters")
    .replace(/\bminutes\b/gi, "minutes")
    .replace(/\bminute\b/gi, "minute")
    .replace(/\bsecondes\b/gi, "seconds");

  return str;
};

// Global cached voices for instantaneous speech across browsers
let cachedVoices = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices() || [];
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    };
  } catch (_) {}
}

export const speakInstruction = (text, forcedLang = null) => {
  if (!text || typeof window === 'undefined') {
    return;
  }

  // Détection automatique de la langue active de l'application
  const activeLang = forcedLang || (typeof localStorage !== 'undefined' ? localStorage.getItem('bradci_lang') : 'fr') || 'fr';
  const isEn = activeLang === 'en';

  // Si l'application est en anglais, traduire le texte français avant émission et vocalisation
  const spokenText = isEn ? translateGpsInstructionToEn(text) : text;

  // Émission de l'événement visuel pour le HUD de navigation (avec le texte traduit !)
  try {
    window.dispatchEvent(new CustomEvent('bradci-voice-speaking', { 
      detail: { text: spokenText, isSpeaking: true, lang: activeLang } 
    }));
  } catch (_) {}

  // 1. Déclenchement de l'alerte sonore de guidage (marche partout y compris si TTS coupé)
  playGpsChime();

  if (!('speechSynthesis' in window)) {
    console.warn("[BRAD'CI AudioServices] Synthèse vocale non disponible");
    return;
  }

  try {
    // Interrompt toute lecture vocale antérieure
    window.speechSynthesis.cancel();

    // Déblocage immédiat du moteur pour WebView Android et iOS
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = isEn ? 'en-US' : 'fr-FR';
    utterance.rate = 1.02; // Rythme naturel pour guidage GPS
    utterance.pitch = 1.0;

    // Protection essentielle contre le Garbage Collector Chromium/Android
    window.__bradCiActiveUtterance = utterance;

    // Sélection de la meilleure voix disponible pour la langue active
    const applyVoice = () => {
      try {
        const voices = (cachedVoices && cachedVoices.length > 0) ? cachedVoices : window.speechSynthesis.getVoices();
        if (isEn) {
          const enVoice = voices.find((v) => v.lang && (v.lang.toLowerCase().startsWith('en-us') || v.lang.toLowerCase().startsWith('en-gb')))
            || voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'))
            || voices.find((v) => v.name && (v.name.includes('English') || v.name.includes('Google US') || v.name.includes('Samantha')));
          if (enVoice) utterance.voice = enVoice;
        } else {
          const frenchVoice = voices.find((v) => v.lang && (v.lang.toLowerCase().startsWith('fr-fr') || v.lang.toLowerCase().startsWith('fr')))
            || voices.find((v) => v.name && (v.name.includes('French') || v.name.includes('Google Français') || v.name.includes('Thomas') || v.name.includes('Amelie')));
          if (frenchVoice) utterance.voice = frenchVoice;
        }
      } catch (_) {}
    };

    applyVoice();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = applyVoice;
    }

    utterance.onend = () => {
      window.__bradCiActiveUtterance = null;
      try {
        window.dispatchEvent(new CustomEvent('bradci-voice-speaking', { 
          detail: { text: spokenText, isSpeaking: false, lang: activeLang } 
        }));
      } catch (_) {}
    };

    utterance.onerror = (err) => {
      window.__bradCiActiveUtterance = null;
      console.warn("[BRAD'CI AudioServices] Erreur speakInstruction:", err);
      try {
        window.dispatchEvent(new CustomEvent('bradci-voice-speaking', { 
          detail: { text: spokenText, isSpeaking: false, lang: activeLang } 
        }));
      } catch (_) {}
    };

    const doSpeak = () => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("[BRAD'CI AudioServices] speak error:", e);
      }
    };

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setTimeout(doSpeak, 60);
    } else {
      doSpeak();
    }
  } catch (err) {
    console.warn("[BRAD'CI AudioServices] Exception speakInstruction:", err);
  }
};

// --- Enregistrement Audio (Voice Notes / MediaRecorder avec Fallback Silencieux) ---

let currentMediaRecorder = null;
let currentAudioChunks = [];
let recordingStream = null;
let isSyntheticFallback = false;
let syntheticStartTime = 0;

/**
 * Génère un Blob audio WAV standard (PCM 16-bit)
 * Utilisé comme fallback universel en cas d'interdiction/absence de microphone physique
 */
export const createSyntheticAudioWav = (durationSec = 2) => {
  try {
    const sampleRate = 22050;
    const safeDuration = Math.max(1, Math.min(120, durationSec));
    const numSamples = Math.floor(sampleRate * safeDuration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // fmt subchunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // data subchunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, numSamples * 2, true);

    // Écriture d'un son doux harmonieux simulant une note vocale (Do -> Sol)
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Enveloppe d'attaque et de relâchement progressive
      const env = Math.sin(Math.min(Math.PI, (t / safeDuration) * Math.PI));
      const freq = t < (safeDuration / 2) ? 523.25 : 659.25; // 523Hz (C5) puis 659Hz (E5)
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.22 * env;
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  } catch (err) {
    console.warn("[BRAD'CI AudioServices] Fallback Blob basique:", err);
    return new Blob([], { type: 'audio/wav' });
  }
};

export const startRecording = async () => {
  isSyntheticFallback = false;
  currentAudioChunks = [];
  syntheticStartTime = Date.now();

  // 1. Tenter d'accéder au microphone physique si disponible
  let stream = null;
  if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
    } catch (micErr) {
      // Try fallback to basic audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err2) {
        console.warn("[BRAD'CI AudioServices] Accès micro non autorisé ou restreint:", err2?.name || err2);
        isSyntheticFallback = true;
      }
    }
  } else {
    console.warn("[BRAD'CI AudioServices] API MediaDevices non supportée sur ce client. Mode note vocale simulée activé.");
    isSyntheticFallback = true;
  }

  // 2. Si le microphone physique est accessible et accordé
  if (stream && !isSyntheticFallback) {
    recordingStream = stream;

    // Détection du meilleur encodage audio supporté par le système
    let mimeType = '';
    if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];
      for (const c of candidates) {
        if (MediaRecorder.isTypeSupported(c)) {
          mimeType = c;
          break;
        }
      }
    }

    try {
      try {
        currentMediaRecorder = mimeType 
          ? new MediaRecorder(recordingStream, { mimeType })
          : new MediaRecorder(recordingStream);
      } catch {
        currentMediaRecorder = new MediaRecorder(recordingStream);
      }

      currentMediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          currentAudioChunks.push(event.data);
        }
      };

      try {
        currentMediaRecorder.start(250);
      } catch {
        currentMediaRecorder.start();
      }

      console.log("[BRAD'CI AudioServices] Enregistrement matériel démarré avec format:", currentMediaRecorder.mimeType || 'default');
      return { isFallback: false };
    } catch (recErr) {
      console.warn("[BRAD'CI AudioServices] Erreur initialisation MediaRecorder matériel:", recErr);
      isSyntheticFallback = true;
    }
  }

  // 3. Mode Fallback garanti (aucun crash, utilisable en démo et iframe)
  isSyntheticFallback = true;
  currentMediaRecorder = null;
  console.log("[BRAD'CI AudioServices] Enregistrement vocal (mode démo/fallback) démarré.");
  return { isFallback: true };
};

export const stopRecording = () => {
  return new Promise((resolve) => {
    // Si nous étions en mode fallback
    if (isSyntheticFallback || !currentMediaRecorder) {
      const elapsedSec = Math.max(1, Math.round((Date.now() - syntheticStartTime) / 1000));
      const fallbackBlob = createSyntheticAudioWav(elapsedSec);
      console.log(`[BRAD'CI AudioServices] Note vocale fallback générée (${fallbackBlob.size} octets, ${elapsedSec}s)`);
      isSyntheticFallback = false;
      currentMediaRecorder = null;
      recordingStream = null;
      currentAudioChunks = [];
      resolve(fallbackBlob);
      return;
    }

    let resolved = false;
    const finishRecording = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimer);

      const mime = currentMediaRecorder?.mimeType || 'audio/webm';
      let audioBlob = currentAudioChunks.length > 0
        ? new Blob(currentAudioChunks, { type: mime })
        : null;

      if (!audioBlob || audioBlob.size === 0) {
        const elapsedSec = Math.max(1, Math.round((Date.now() - syntheticStartTime) / 1000));
        audioBlob = createSyntheticAudioWav(elapsedSec);
      }

      // Libération propre des pistes du microphone
      try {
        if (recordingStream) {
          recordingStream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.warn("[BRAD'CI AudioServices] Libération pistes audio:", err);
      }

      currentMediaRecorder = null;
      recordingStream = null;
      currentAudioChunks = [];
      isSyntheticFallback = false;

      console.log(`[BRAD'CI AudioServices] Enregistrement arrêté, taille: ${audioBlob.size} octets`);
      resolve(audioBlob);
    };

    const safetyTimer = setTimeout(finishRecording, 1500);

    // Arrêt de l'enregistrement matériel standard
    currentMediaRecorder.onstop = finishRecording;

    try {
      if (currentMediaRecorder.state === 'recording') {
        try { currentMediaRecorder.requestData(); } catch (_) {}
      }
      if (currentMediaRecorder.state !== 'inactive') {
        currentMediaRecorder.stop();
      } else {
        finishRecording();
      }
    } catch (err) {
      console.warn("[BRAD'CI AudioServices] Erreur stop MediaRecorder:", err);
      finishRecording();
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
  isSyntheticFallback = false;
};

// Exposition globale pour tests et compatibilité
if (typeof window !== 'undefined') {
  window.speakInstruction = speakInstruction;
  window.startRecording = startRecording;
  window.stopRecording = stopRecording;
}
