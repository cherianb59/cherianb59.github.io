/**
 * High-Performance Client-Side Tile Caching Engine (L1 Memory + L2 CacheStorage)
 * Eliminates network latency, enables instant offline playback, and prevents zoom reloads.
 */

const CACHE_NAME = 'bom-tile-cache-v1';
const L1_MEM_CACHE = new Map();
const MAX_L1_ENTRIES = 500;

class TileCacheManager {
  constructor() {
    this.cachePromise = (typeof caches !== 'undefined') ? caches.open(CACHE_NAME) : null;
  }

  getL1(key) {
    return L1_MEM_CACHE.get(key) || null;
  }

  setL1(key, value) {
    if (L1_MEM_CACHE.size >= MAX_L1_ENTRIES) {
      const oldestKey = L1_MEM_CACHE.keys().next().value;
      L1_MEM_CACHE.delete(oldestKey);
    }
    L1_MEM_CACHE.set(key, value);
  }

  async getTileBlob(url) {
    // 1. Check L1 Memory Cache (ArrayBuffer/Blob)
    if (L1_MEM_CACHE.has(url)) {
      return L1_MEM_CACHE.get(url);
    }

    // 2. Check L2 Persistent CacheStorage
    if (this.cachePromise) {
      try {
        const cache = await this.cachePromise;
        const matched = await cache.match(url);
        if (matched) {
          const blob = await matched.blob();
          this.setL1(url, blob);
          return blob;
        }
      } catch (e) {
        console.warn('[TileCache] CacheStorage read error:', e);
      }
    }

    // 3. Fetch from Network
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Tile fetch failed: HTTP ${resp.status}`);
    }

    const blob = await resp.blob();

    // 4. Save to L2 CacheStorage in background
    if (this.cachePromise) {
      this.cachePromise.then(cache => {
        try {
          cache.put(url, new Response(blob.slice(0), {
            headers: {
              'Content-Type': blob.type || 'image/png',
              'Cache-Control': 'public, max-age=86400'
            }
          })).catch(() => {});
        } catch (e) {}
      });
    }

    // 5. Save to L1 Memory Cache
    this.setL1(url, blob);
    return blob;
  }

  // Find parent tile in memory for smooth zoom-in fallback
  findParentTile(tilesetUrl, z, x, y) {
    if (z <= 1) return null;
    const parentZ = z - 1;
    const parentX = Math.floor(x / 2);
    const parentY = Math.floor(y / 2);
    const parentKey = `${tilesetUrl}_${parentZ}_${parentX}_${parentY}`;
    return L1_MEM_CACHE.get(parentKey) || null;
  }
}

export const tileCache = new TileCacheManager();
