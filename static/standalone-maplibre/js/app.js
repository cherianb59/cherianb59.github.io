/**
 * Standalone BOM Weather Application (MapLibre GL JS + GeoJSON Vertex Morpher)
 * 100% Client-Side Single Page Application
 * True polygon vertex interpolation: zero ghosting, zero blur, crisp sharp rain contours.
 */

import { bomApi } from './api.js';
import { BomMapLibreEngine } from './map.js';
import { renderForecastTab } from './tabs/forecast.js';
import { renderPastWeatherTab } from './tabs/past_weather.js';
import { renderWarningsTab } from './tabs/warnings.js';
import { BOM_RAIN_LEVELS } from './palette.js';

class BomWeatherApp {
  constructor() {
    this.currentGeohash = localStorage.getItem('bom_geohash') || 'r3gx2f'; // Sydney
    this.currentLocation = JSON.parse(localStorage.getItem('bom_loc') || 'null') || {
      name: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      latitude: -33.8688,
      longitude: 151.2093
    };
    this.currentTab = 'forecast';
    this.weatherData = JSON.parse(localStorage.getItem('bom_cached_weather') || 'null') || {};
    this.warnings = [];
    this.radarFrames = [];
    this.mapEngine = null;

    this.init();
  }

  async init() {
    console.log('[BOM App] Initializing MapLibre Client Application...');

    this.setupEventListeners();
    this.renderLegend();

    // 1. Render immediate cached UI if available
    if (this.weatherData.dailyForecast) {
      renderForecastTab(document.getElementById('tab-forecast'), this.weatherData);
      renderPastWeatherTab(document.getElementById('tab-past'), this.weatherData);
    }
    document.getElementById('currentLocationText').innerText = `${this.currentLocation.name} ${this.currentLocation.postcode || ''}`;

    // 2. Initialize MapLibre Engine
    this.mapEngine = new BomMapLibreEngine('maplibre-map-container');
    this.mapEngine.onFrameChange = (info) => this.handleRadarFrameUpdate(info);

    // Launch Map & Data in Parallel
    await this.mapEngine.init(this.currentLocation.latitude, this.currentLocation.longitude);
    this.loadLocationData(this.currentGeohash);
    this.loadRadarCatalog();
    this.loadWarnings();
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const targetTab = tabBtn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    document.getElementById('locationHeader').addEventListener('click', () => {
      document.getElementById('searchModal').style.display = 'flex';
      document.getElementById('searchInput').focus();
    });

    document.getElementById('btnSearchClose').addEventListener('click', () => {
      document.getElementById('searchModal').style.display = 'none';
    });

    let searchDebounce = null;
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => this.handleSearchInput(e.target.value), 200);
    });

    document.getElementById('btnGeoLocation').addEventListener('click', () => {
      this.useDeviceLocation();
    });

    // Playback and Arrow Button Controls
    document.getElementById('btnPlayPause').addEventListener('click', () => {
      const isPlaying = this.mapEngine.togglePlayback();
      document.getElementById('btnPlayPause').innerText = isPlaying ? '⏸' : '▶';
    });

    document.getElementById('btnStepBack').addEventListener('click', () => {
      this.mapEngine.step(-1);
    });

    document.getElementById('btnStepForward').addEventListener('click', () => {
      this.mapEngine.step(1);
    });

    // Keyboard Arrow Controls
    window.addEventListener('keydown', (e) => {
      // Don't trigger if typing in search input
      if (document.activeElement?.tagName === 'INPUT' && document.activeElement?.type === 'text') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.mapEngine.step(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.mapEngine.step(1);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const isPlaying = this.mapEngine.togglePlayback();
        document.getElementById('btnPlayPause').innerText = isPlaying ? '⏸' : '▶';
      }
    });

    document.getElementById('radarScrubber').addEventListener('input', (e) => {
      this.mapEngine.setIndex(parseInt(e.target.value, 10));
    });

    document.getElementById('radarOpacity').addEventListener('input', (e) => {
      this.mapEngine.setOpacity(e.target.value);
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });

    if (tabName === 'maps' && this.mapEngine?.map) {
      setTimeout(() => this.mapEngine.map.resize(), 50);
    }
  }

  async loadLocationData(geohash) {
    try {
      this.currentGeohash = geohash;
      localStorage.setItem('bom_geohash', geohash);

      const [loc, obs, hourly, daily] = await Promise.all([
        bomApi.getLocation(geohash).catch(() => null),
        bomApi.getObservations(geohash).catch(() => null),
        bomApi.getHourlyForecast(geohash).catch(() => []),
        bomApi.getDailyForecast(geohash).catch(() => [])
      ]);

      if (loc) {
        this.currentLocation = loc;
        localStorage.setItem('bom_loc', JSON.stringify(loc));
        document.getElementById('currentLocationText').innerText = `${loc.name} ${loc.postcode || ''}`;
      }

      this.weatherData = { location: this.currentLocation, observations: obs, hourlyForecast: hourly, dailyForecast: daily };
      localStorage.setItem('bom_cached_weather', JSON.stringify(this.weatherData));

      renderForecastTab(document.getElementById('tab-forecast'), this.weatherData);
      renderPastWeatherTab(document.getElementById('tab-past'), this.weatherData);

      if (this.currentLocation?.latitude && this.currentLocation?.longitude && this.mapEngine) {
        this.mapEngine.flyTo(this.currentLocation.latitude, this.currentLocation.longitude);
      }
    } catch (err) {
      console.error('[BOM App] Error loading weather data:', err);
    }
  }

  async loadRadarCatalog() {
    try {
      this.radarFrames = await bomApi.getRadarCatalog();
      if (!this.radarFrames.length) return;

      this.mapEngine.setFrames(this.radarFrames);

      const scrubber = document.getElementById('radarScrubber');
      if (scrubber) {
        scrubber.max = this.radarFrames.length - 1;
        scrubber.value = 0;
        scrubber.step = '1';
      }

      // Start autoplay from the beginning
      this.mapEngine.setIndex(0);
      this.mapEngine.startPlayback();
      document.getElementById('btnPlayPause').innerText = '⏸';

    } catch (err) {
      console.error('[BOM App] Error loading radar catalog:', err);
    }
  }

  async loadWarnings() {
    try {
      this.warnings = await bomApi.getWarnings();
      renderWarningsTab(document.getElementById('tab-warnings'), {
        warnings: this.warnings,
        location: this.currentLocation,
        onSelectWarning: (warn) => this.showWarningModal(warn)
      });
    } catch (err) {
      console.error('[BOM App] Error loading warnings:', err);
    }
  }

  handleRadarFrameUpdate(info) {
    document.getElementById('frameTimeLabel').innerText = info.timeFormatted;
    document.getElementById('frameOffsetLabel').innerText = info.relativeLabel;
    document.getElementById('radarScrubber').value = info.index;

    const tag = document.getElementById('frameTypeTag');
    if (info.frame?.type === 'nowcast') {
      tag.className = 'frame-tag tag-nowcast';
      tag.innerText = 'Nowcast Forecast';
    } else {
      tag.className = 'frame-tag tag-obs';
      tag.innerText = 'Radar Observation';
    }
  }

  async handleSearchInput(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!query || query.length < 2) {
      resultsContainer.innerHTML = '';
      return;
    }

    try {
      const list = await bomApi.searchLocations(query);
      if (!list.length) {
        resultsContainer.innerHTML = '<div style="padding: 1rem; color: #64748B;">No locations found.</div>';
        return;
      }

      resultsContainer.innerHTML = list.map(item => `
        <div class="search-item" data-geohash="${item.geohash}">
          <b>${item.name}</b>
          <span>${item.state} ${item.postcode || ''}</span>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', () => {
          const gh = item.dataset.geohash;
          document.getElementById('searchModal').style.display = 'none';
          this.loadLocationData(gh);
        });
      });
    } catch (err) {
      console.error('[BOM App] Location search error:', err);
    }
  }

  useDeviceLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const list = await bomApi.searchLocations(`${latitude.toFixed(2)},${longitude.toFixed(2)}`);
      if (list.length) {
        this.loadLocationData(list[0].geohash);
      }
    }, (err) => {
      console.warn('Geolocation failed:', err);
    });
  }

  renderLegend() {
    const legendBar = document.getElementById('legendBar');
    if (legendBar) {
      legendBar.innerHTML = BOM_RAIN_LEVELS.slice(1).map(lvl => `
        <div class="legend-swatch" style="background-color: ${lvl.hex};" title="${lvl.minMm} mm/h"></div>
      `).join('');
    }
  }

  showWarningModal(warn) {
    alert(`[${warn.state}] ${warn.title}\n\n${warn.short_title || ''}\n\nIssued: ${warn.issue_time || '--'}`);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new BomWeatherApp();
});
