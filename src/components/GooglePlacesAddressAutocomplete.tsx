/**
 * Google Places Address Autocomplete Component
 * Utilizes Google Maps Platform Places API (New) with AutocompleteSessionToken
 * Cost optimization: explicit field masks, session token lifecycle
 * Attribution tracking: gmp_mcp_codeassist_v1_aistudio
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Search, 
  CheckCircle2, 
  X, 
  Loader2, 
  Navigation, 
  ExternalLink,
  LocateFixed,
  Compass
} from 'lucide-react';
import { ALL_COMMUNES, ZoneCommune } from '../data/communes';
import { ABIDJAN_CENTER } from '../utils/googleMapsConfig';

export interface SelectedPlaceDetails {
  address: string;
  lat?: number;
  lng?: number;
  commune?: string;
  placeId?: string;
  displayName?: string;
}

export interface GooglePlacesAddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (details: SelectedPlaceDetails) => void;
  placeholder?: string;
  communeHint?: string;
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  selectedCoords?: { lat: number; lng: number } | null;
  showGpsButton?: boolean;
  onGpsClick?: () => void;
  isLocatingGps?: boolean;
}

interface PlaceSuggestionItem {
  id: string;
  mainText: string;
  secondaryText: string;
  isGooglePlace: boolean;
  rawPrediction?: any;
  communeName?: string;
  coords?: { lat: number; lng: number };
}

export const GooglePlacesAddressAutocomplete: React.FC<GooglePlacesAddressAutocompleteProps> = ({
  id = 'google-places-address-input',
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Ex: Cocody Angré 8ème Tranche, Carrefour Duncan, près de la pharmacie...",
  communeHint,
  label,
  required = false,
  className = '',
  inputClassName = '',
  disabled = false,
  selectedCoords,
  showGpsButton = false,
  onGpsClick,
  isLocatingGps = false
}) => {
  const [inputValue, setInputValue] = useState<string>(value || '');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
  const [hasSelectedPlace, setHasSelectedPlace] = useState<boolean>(Boolean(selectedCoords));

  const placesLibrary = useMapsLibrary('places');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  // Sync coords state
  useEffect(() => {
    if (selectedCoords?.lat && selectedCoords?.lng) {
      setHasSelectedPlace(true);
    }
  }, [selectedCoords]);

  // Initialize or renew session token
  const getOrCreateSessionToken = useCallback((): google.maps.places.AutocompleteSessionToken | null => {
    if (sessionToken) return sessionToken;
    try {
      const AutocompleteTokenClass = (placesLibrary as any)?.AutocompleteSessionToken || window.google?.maps?.places?.AutocompleteSessionToken;
      if (AutocompleteTokenClass) {
        const token = new AutocompleteTokenClass();
        setSessionToken(token);
        return token;
      }
    } catch (e) {
      console.warn('Could not instantiate AutocompleteSessionToken:', e);
    }
    return null;
  }, [sessionToken, placesLibrary]);

  // Match commune from address text or components
  const detectCommuneFromText = useCallback((text: string): ZoneCommune | null => {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const c of ALL_COMMUNES) {
      if (lower.includes(c.name.toLowerCase())) {
        return c;
      }
      for (const n of c.neighborhoods) {
        // Match major keywords
        const keywords = n.toLowerCase().split(/[\s,()&'-]+/).filter(k => k.length >= 3);
        if (keywords.some(kw => lower.includes(kw))) {
          return c;
        }
      }
    }
    return null;
  }, []);

  // Fetch local Abidjan landmark suggestions as immediate fallback or complement
  const getLocalLandmarkSuggestions = useCallback((query: string): PlaceSuggestionItem[] => {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    const results: PlaceSuggestionItem[] = [];

    // Search across ALL_COMMUNES and their well-known neighborhoods
    for (const commune of ALL_COMMUNES) {
      const matchCommune = commune.name.toLowerCase().includes(q);
      for (const nh of commune.neighborhoods) {
        if (matchCommune || nh.toLowerCase().includes(q)) {
          results.push({
            id: `local-${commune.id}-${nh}`,
            mainText: nh,
            secondaryText: `${commune.name}, Abidjan`,
            isGooglePlace: false,
            communeName: commune.name,
            coords: commune.coords
          });
          if (results.length >= 5) break;
        }
      }
      if (results.length >= 5) break;
    }

    return results;
  }, []);

  // Query Google Places Autocomplete Suggestions (Places API New)
  const queryAutocomplete = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const localItems = getLocalLandmarkSuggestions(query);

    try {
      const gPlaces = (placesLibrary as any) || window.google?.maps?.places;

      // Modern Places API (New): AutocompleteSuggestion.fetchAutocompleteSuggestions
      if (gPlaces?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
        const token = getOrCreateSessionToken();
        const request: google.maps.places.AutocompleteRequest = {
          input: query,
          sessionToken: token || undefined,
          region: 'CI', // Côte d'Ivoire
          locationBias: {
            lat: ABIDJAN_CENTER.lat,
            lng: ABIDJAN_CENTER.lng
          }
        };

        const response = await gPlaces.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        const googleItems: PlaceSuggestionItem[] = [];

        if (response?.suggestions?.length) {
          for (const s of response.suggestions) {
            const pred = s.placePrediction;
            if (pred) {
              const main = pred.mainText?.toString() || pred.text?.toString() || '';
              const sec = pred.secondaryText?.toString() || 'Côte d\'Ivoire';
              googleItems.push({
                id: pred.placeId || `pred-${Math.random()}`,
                mainText: main,
                secondaryText: sec,
                isGooglePlace: true,
                rawPrediction: pred
              });
            }
          }
        }

        // Combine Google Places (first) with any complementary local Abidjan landmarks
        const combined = [...googleItems];
        for (const loc of localItems) {
          if (!combined.some(c => c.mainText.toLowerCase() === loc.mainText.toLowerCase())) {
            combined.push(loc);
          }
        }

        setSuggestions(combined.slice(0, 7));
      } else {
        // If Google Maps API is not yet loaded or in fallback mode
        setSuggestions(localItems);
      }
    } catch (err) {
      console.warn('Google Places Autocomplete query error:', err);
      // Fallback seamlessly to local Abidjan database
      setSuggestions(localItems);
    } finally {
      setIsLoading(false);
    }
  }, [getLocalLandmarkSuggestions, getOrCreateSessionToken]);

  // Handle Input typing with 250ms debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setHasSelectedPlace(false);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsOpen(true);
      debounceTimerRef.current = setTimeout(() => {
        queryAutocomplete(val);
      }, 250);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (item: PlaceSuggestionItem) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    setIsLoading(true);

    try {
      if (item.isGooglePlace && item.rawPrediction) {
        // Places API (New): Call toPlace() and fetchFields with explicit cost-saving mask
        const place = item.rawPrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
        });

        const addressText = place.formattedAddress || place.displayName || `${item.mainText}, ${item.secondaryText}`;
        const lat = place.location?.lat();
        const lng = place.location?.lng();

        // Extract commune from addressComponents or text
        let detectedCommune: string | undefined = undefined;
        if (place.addressComponents) {
          for (const comp of place.addressComponents) {
            const matched = detectCommuneFromText(comp.longText || comp.shortText || '');
            if (matched) {
              detectedCommune = matched.name;
              break;
            }
          }
        }
        if (!detectedCommune) {
          const matched = detectCommuneFromText(addressText);
          if (matched) detectedCommune = matched.name;
        }

        setInputValue(addressText);
        onChange(addressText);
        setHasSelectedPlace(Boolean(lat && lng));

        // Conclude session and clear sessionToken for the next interaction
        setSessionToken(null);

        onPlaceSelect?.({
          address: addressText,
          lat,
          lng,
          commune: detectedCommune,
          placeId: item.rawPrediction.placeId,
          displayName: place.displayName || item.mainText
        });
      } else {
        // Local landmark selection
        const addressText = `${item.mainText}, ${item.secondaryText}`;
        setInputValue(addressText);
        onChange(addressText);
        setHasSelectedPlace(Boolean(item.coords));

        onPlaceSelect?.({
          address: addressText,
          lat: item.coords?.lat,
          lng: item.coords?.lng,
          commune: item.communeName,
          displayName: item.mainText
        });
      }
    } catch (err) {
      console.warn('Error fetching place fields:', err);
      // Fallback to text selection
      const fallbackAddress = `${item.mainText}, ${item.secondaryText}`;
      setInputValue(fallbackAddress);
      onChange(fallbackAddress);
      onPlaceSelect?.({
        address: fallbackAddress,
        commune: item.communeName
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    setHasSelectedPlace(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{label}</span>
          </span>
          {hasSelectedPlace && selectedCoords && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>GPS Fixé ({selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)})</span>
            </span>
          )}
        </label>
      )}

      {/* Input Field Container */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className={`w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-20 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${inputClassName}`}
        />

        {/* Right Action Icons (Clear & GPS) */}
        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Effacer l'adresse"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showGpsButton && onGpsClick && (
            <button
              type="button"
              onClick={onGpsClick}
              disabled={isLocatingGps}
              className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="Utiliser la géolocalisation GPS de mon appareil"
            >
              {isLocatingGps ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
              ) : (
                <LocateFixed className="w-3 h-3 text-emerald-400" />
              )}
              <span className="hidden sm:inline">GPS</span>
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Predictions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div 
          id={`${id}-dropdown`}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0B1220] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Bar */}
          <div className="px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
              <Compass className="w-3 h-3 text-emerald-400" />
              <span>Suggestions de lieux (Abidjan & CI)</span>
            </span>
            <span className="text-[9.5px] text-slate-500">↑↓ Naviguer • Entrée Valider</span>
          </div>

          {/* Suggestions List */}
          <ul className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 py-1">
            {suggestions.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3.5 py-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-500/20 text-white' : 'hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${
                    item.isGooglePlace 
                      ? 'bg-emerald-500/15 text-emerald-400' 
                      : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate block">
                        {item.mainText}
                      </span>
                      {item.isGooglePlace ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 shrink-0 font-bold">
                          Google Places
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30 shrink-0 font-bold">
                          Repère Abidjan
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                      {item.secondaryText}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Mandatory Google Maps Compliance & Attribution Footer */}
          <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Autocomplétion d'adresses & géolocalisation directe</span>
            </span>
            <span className="font-semibold text-slate-400 tracking-wide text-[9.5px]">
              Google Maps
            </span>
          </div>
        </div>
      )}

      {/* Selected Coordinates & Google Maps Link Pill */}
      {hasSelectedPlace && selectedCoords && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-slate-300">
              Coordonnées exactes : <strong className="font-mono text-emerald-400">{selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}</strong>
            </span>
          </div>
          <a
            href={`https://www.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 shrink-0 ml-2 font-bold"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
