/**
 * Google Maps Platform Configuration & Cost Optimization Helpers
 * Attribution ID: gmp_mcp_codeassist_v1_aistudio
 */

export const GOOGLE_MAPS_API_KEY: string = 
  ((import.meta as unknown as { env?: { VITE_GOOGLE_MAPS_API_KEY?: string } }).env?.VITE_GOOGLE_MAPS_API_KEY) || '';

export const GMP_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

// Grand Abidjan Geographic Center
export const ABIDJAN_CENTER: google.maps.LatLngLiteral = {
  lat: 5.3599517,
  lng: -4.0082563
};

// Default Biasing Radius for Côte d'Ivoire / Abidjan Metropolitan Area
export const ABIDJAN_LOCATION_BIAS = {
  center: ABIDJAN_CENTER,
  radius: 35000 // 35km covering Grand Abidjan, Bingerville, Bassam, Songon
};
