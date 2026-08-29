/**
 * Autonomous Mapbox JWT Token Lifecycle Manager (100% Client-Side)
 * Directly requests and auto-renews rolling 1-hour session tokens from BOM API.
 */

export class BomAuthManager {
  constructor() {
    this.token = null;
    this.refreshAt = null;
    this.expiryTime = null;
    this.refreshTimer = null;
    this.listeners = [];
  }

  onTokenChange(fn) {
    this.listeners.push(fn);
  }

  async getToken() {
    if (this.token && this.expiryTime && Date.now() < this.expiryTime - 3 * 60 * 1000) {
      return this.token;
    }
    return await this.fetchNewToken();
  }

  async fetchNewToken() {
    try {
      const resp = await fetch('https://api.weather.bom.gov.au/v1/mapbox-token/android', {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!resp.ok) {
        throw new Error(`Token API returned HTTP ${resp.status}`);
      }
      const json = await resp.json();
      const tokenData = json?.data?.tokens?.public;
      if (!tokenData?.token) {
        throw new Error('Malformed token response from BOM API');
      }

      this.token = tokenData.token;
      this.refreshAt = new Date(tokenData.refresh_at).getTime();
      this.expiryTime = new Date(tokenData.expiry_time).getTime();

      console.log(`[BOM Auth] Acquired fresh Mapbox JWT (expires in ${Math.round((this.expiryTime - Date.now()) / 60000)}m)`);

      // Schedule background refresh
      const delay = Math.max(15000, this.refreshAt - Date.now());
      clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => this.fetchNewToken(), delay);

      // Notify listeners
      for (const fn of this.listeners) {
        try { fn(this.token); } catch (e) { console.error(e); }
      }

      return this.token;
    } catch (err) {
      console.warn('[BOM Auth] Failed to fetch Mapbox token, retrying in 10s:', err);
      clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => this.fetchNewToken(), 10000);
      return this.token;
    }
  }
}

export const authManager = new BomAuthManager();
