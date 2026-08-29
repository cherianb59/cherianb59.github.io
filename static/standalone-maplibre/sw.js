const CACHE_NAME = 'bom-weather-v1';
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/api.js',
  './js/auth.js',
  './js/map.js',
  './js/palette.js',
  './js/tabs/forecast.js',
  './js/tabs/past_weather.js',
  './js/tabs/warnings.js',
  './js/utils/formatters.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only cache local static assets and basemap tiles
  if (e.request.url.includes('/api.weather.bom.gov.au/v1/mapbox-token')) {
    // Never cache dynamic auth token
    return;
  }
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
