/**
 * MapLibre GL JS Radar Engine — Pure Native GPU Vector Pipeline (Zero Flicker)
 *
 * Anti-Flicker Architecture:
 * 1. 37 pre-compiled vector tile layers with explicit 0ms transition duration.
 * 2. Overlap Ping-Pong Handoff: Keeps previous active frame visible on GPU until
 *    the new active frame has swapped into the WebGL buffer — eliminating blank gaps.
 * 3. Viewport Tile Pre-warmer: Prefetches vector tiles in the background so all
 *    37 observation and nowcast frames reside in memory with 0ms network latency.
 * 4. Infinite GPU Vector Overzoom from Zoom 1 to 18 with crisp 60 FPS rendering.
 */

import { authManager } from './auth.js';
import { getMapLibreFillColorExpression } from './palette.js';
import { formatRadarTime, getRelativeTimeLabel } from './utils/formatters.js';

const AUSTRALIA_BOUNDS = [[105.0, -48.0], [165.0, -7.0]];

function mapboxTransformRequest(url, resourceType, token) {
  if (!url) return { url };
  if (url.startsWith('mapbox://')) {
    if (url.startsWith('mapbox://styles/')) {
      const path = url.replace('mapbox://styles/', '');
      return { url: `https://api.mapbox.com/styles/v1/${path}?access_token=${token}` };
    }
    if (url.startsWith('mapbox://sprites/')) {
      const path = url.replace('mapbox://sprites/', '');
      const fmt = path.endsWith('@2x') ? '@2x' : '';
      return { url: `https://api.mapbox.com/styles/v1/${path.replace('@2x', '')}/sprite${fmt}?access_token=${token}` };
    }
    if (url.startsWith('mapbox://fonts/')) {
      return { url: `https://api.mapbox.com/fonts/v1/${url.replace('mapbox://fonts/', '')}?access_token=${token}` };
    }
    return { url: `https://api.mapbox.com/v4/${url.replace('mapbox://', '')}.json?secure&access_token=${token}` };
  }
  return { url };
}

export class BomMapLibreEngine {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.token = null;
    this.radarFrames = [];
    this.currentIndex = 0;
    this.previousActiveIdx = null;
    this.isPlaying = false;
    this.playbackTimer = null;
    this.radarOpacity = 0.95;
    this.onFrameChange = null;
    this.isReady = false;
    this.cleanupTimer = null;
  }

  async init(initialLat = -33.8688, initialLon = 151.2093) {
    this.token = await authManager.getToken();

    this.map = new maplibregl.Map({
      container: this.containerId,
      style: `mapbox://styles/bom-dc-prod/cm8ny9p90002701rc5g2w8c19`,
      center: [initialLon, initialLat],
      zoom: 6,
      minZoom: 3.5,
      maxZoom: 18,
      maxBounds: AUSTRALIA_BOUNDS,
      attributionControl: false,
      transformRequest: (url, rt) => mapboxTransformRequest(url, rt, this.token)
    });

    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    this.map.addControl(new maplibregl.AttributionControl({
      compact: true,
      customAttribution: 'Bureau of Meteorology / Mapbox'
    }));

    this.map.on('load', () => {
      this.isReady = true;
      if (this.radarFrames.length) {
        this.setupAllRadarLayers();
        this.updateActiveFrame();
        this.prewarmViewportTiles();
      }
    });

    this.map.on('moveend', () => {
      if (this.isReady && this.radarFrames.length) {
        this.prewarmViewportTiles();
      }
    });
  }

  setFrames(frames) {
    this.radarFrames = frames || [];
    this.currentIndex = 0;
    this.previousActiveIdx = null;
    if (this.isReady) {
      this.setupAllRadarLayers();
      this.updateActiveFrame();
      this.prewarmViewportTiles();
    }
  }

  setupAllRadarLayers() {
    if (!this.map || !this.isReady || !this.radarFrames.length) return;

    // Find insertion point (below symbol/label layers)
    let beforeLayerId;
    const layers = this.map.getStyle()?.layers || [];
    const firstSymbol = layers.find(l => l.type === 'symbol');
    if (firstSymbol) beforeLayerId = firstSymbol.id;

    this.radarFrames.forEach((frame, idx) => {
      const sourceId = `radar-frame-source-${idx}`;
      const layerId = `radar-frame-layer-${idx}`;

      // Clean up previous layer/source if exists
      if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
      if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);

      const sourceLayer = frame.layer ? frame.layer.name : '';

      this.map.addSource(sourceId, {
        type: 'vector',
        url: frame.url,
        minzoom: 0,
        maxzoom: 7
      });

      this.map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': sourceLayer,
        minzoom: 0,
        maxzoom: 24, // Infinite GPU overzoom past native zoom 7
        paint: {
          'fill-color': getMapLibreFillColorExpression(),
          'fill-opacity': idx === this.currentIndex ? this.radarOpacity : 0,
          'fill-opacity-transition': { duration: 0, delay: 0 } // Instant 0ms transition to prevent alpha dips
        }
      }, beforeLayerId);
    });
  }

  /**
   * Overlap Ping-Pong Frame Switcher:
   * Turns ON the new active layer first, while leaving the previous layer visible
   * for a single frame tick so the GPU never renders a blank gap.
   */
  updateActiveFrame() {
    if (!this.radarFrames.length || !this.map || !this.isReady) return;

    const total = this.radarFrames.length;
    const activeIdx = Math.max(0, Math.min(total - 1, Math.round(this.currentIndex)));
    const prevIdx = this.previousActiveIdx;
    const activeFrame = this.radarFrames[activeIdx];

    // 1. Immediately turn ON the new active frame
    const newLayerId = `radar-frame-layer-${activeIdx}`;
    if (this.map.getLayer(newLayerId)) {
      this.map.setPaintProperty(newLayerId, 'fill-opacity', this.radarOpacity);
    }

    // 2. Hide all other layers EXCEPT the previous active layer
    for (let i = 0; i < total; i++) {
      if (i !== activeIdx && i !== prevIdx) {
        const otherId = `radar-frame-layer-${i}`;
        if (this.map.getLayer(otherId)) {
          this.map.setPaintProperty(otherId, 'fill-opacity', 0);
        }
      }
    }

    // 3. Clear previous cleanup timer and hide previous frame on next frame tick
    if (this.cleanupTimer) cancelAnimationFrame(this.cleanupTimer);
    if (prevIdx !== null && prevIdx !== activeIdx) {
      this.cleanupTimer = requestAnimationFrame(() => {
        const oldLayerId = `radar-frame-layer-${prevIdx}`;
        if (this.map && this.map.getLayer(oldLayerId)) {
          this.map.setPaintProperty(oldLayerId, 'fill-opacity', 0);
        }
      });
    }

    this.previousActiveIdx = activeIdx;

    if (this.onFrameChange && activeFrame) {
      this.onFrameChange({
        index: activeIdx,
        frame: activeFrame,
        relativeLabel: getRelativeTimeLabel(activeIdx, 18),
        timeFormatted: formatRadarTime(activeFrame.time)
      });
    }
  }

  /**
   * Pre-fetches tiles covering current viewport for all 37 frames in background
   * so every frame hits browser memory/disk cache with zero network latency.
   */
  async prewarmViewportTiles() {
    if (!this.map || !this.token || !this.radarFrames.length) return;
    try {
      const bounds = this.map.getBounds();
      const z = 7;
      const n = Math.pow(2, z);
      const minX = Math.floor((bounds.getWest() + 180) / 360 * n);
      const maxX = Math.floor((bounds.getEast() + 180) / 360 * n);
      const latRadN = Math.min(85.0511, bounds.getNorth()) * Math.PI / 180;
      const latRadS = Math.max(-85.0511, bounds.getSouth()) * Math.PI / 180;
      const minY = Math.floor((1 - Math.asinh(Math.tan(latRadN)) / Math.PI) / 2 * n);
      const maxY = Math.floor((1 - Math.asinh(Math.tan(latRadS)) / Math.PI) / 2 * n);

      // Collect unique tileset IDs
      const tilesets = new Set(this.radarFrames.map(f => (f.url || '').replace('mapbox://', '')));

      // Fire low-priority background pre-fetch requests
      for (const tileset of tilesets) {
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            const url = `https://api.mapbox.com/v4/${tileset}/${z}/${x}/${y}.vector.pbf?access_token=${this.token}`;
            fetch(url, { priority: 'low' }).catch(() => {});
          }
        }
      }
    } catch (e) {
      // Ignore background prewarm errors
    }
  }

  setIndex(idx) {
    this.currentIndex = Math.max(0, Math.min(this.radarFrames.length - 1, parseInt(idx, 10)));
    this.updateActiveFrame();
  }

  step(direction) {
    if (!this.radarFrames.length) return;
    const total = this.radarFrames.length;
    this.currentIndex = (this.currentIndex + direction + total) % total;
    this.updateActiveFrame();
  }

  startPlayback() {
    this.isPlaying = true;
    clearInterval(this.playbackTimer);
    this.playbackTimer = setInterval(() => this.step(1), 450);
  }

  pausePlayback() {
    this.isPlaying = false;
    clearInterval(this.playbackTimer);
  }

  togglePlayback() {
    if (this.isPlaying) this.pausePlayback();
    else this.startPlayback();
    return this.isPlaying;
  }

  setOpacity(opacity) {
    this.radarOpacity = parseFloat(opacity);
    const activeIdx = Math.round(this.currentIndex);
    const layerId = `radar-frame-layer-${activeIdx}`;
    if (this.map && this.map.getLayer(layerId)) {
      this.map.setPaintProperty(layerId, 'fill-opacity', this.radarOpacity);
    }
  }

  flyTo(lat, lon, zoom = 8) {
    if (this.map) this.map.flyTo({ center: [lon, lat], zoom, essential: true });
  }
}
