/**
 * Direct Client-Side BOM Weather REST API Client (100% CORS-Enabled)
 * Connects directly to https://api.weather.bom.gov.au/v1 without proxy.
 */

const API_BASE = 'https://api.weather.bom.gov.au/v1';

async function fetchJson(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!resp.ok) {
    throw new Error(`BOM API request to ${endpoint} failed with HTTP ${resp.status}`);
  }
  return await resp.json();
}

export const bomApi = {
  // Location Search & Autocomplete
  async searchLocations(query) {
    if (!query || query.trim().length < 2) return [];
    const json = await fetchJson(`/locations?search=${encodeURIComponent(query.trim())}`);
    return json?.data || [];
  },

  // Location Geohash Details
  async getLocation(geohash) {
    const json = await fetchJson(`/locations/${geohash}`);
    return json?.data || null;
  },

  // Current AWS Observations
  async getObservations(geohash) {
    const json = await fetchJson(`/locations/${geohash}/observations`);
    return json?.data || null;
  },

  // 72-Hour Hourly Forecast
  async getHourlyForecast(geohash) {
    const json = await fetchJson(`/locations/${geohash}/forecasts/hourly`);
    return json?.data || [];
  },

  // 7-Day Extended Daily Forecast
  async getDailyForecast(geohash) {
    const json = await fetchJson(`/locations/${geohash}/forecasts/daily`);
    return json?.data || [];
  },

  // Active Bureau Warnings
  async getWarnings() {
    const json = await fetchJson('/warnings');
    return json?.data || [];
  },

  // Warning Bulletin Detail
  async getWarningDetail(id) {
    const json = await fetchJson(`/warnings/${id}`);
    return json?.data || null;
  },

  // 37-Frame Radar Catalog (18 Past Observations + 19 Nowcasts)
  async getRadarCatalog() {
    const json = await fetchJson('/map/radar');
    return json?.data?.rain || [];
  },

  // Hazards & Warnings Map Overlay
  async getMapHazards() {
    const json = await fetchJson('/map/hazards');
    return json?.data || [];
  }
};
