/**
 * Nova OS — Service Worker
 * Caches all core assets for offline support.
 */

const CACHE_NAME = 'novaos-v6';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/apps.css',
  './js/core/eventBus.js',
  './js/core/storage.js',
  './js/core/processManager.js',
  './js/core/windowManager.js',
  './js/core/appLoader.js',
  './js/core/kernel.js',
  './js/core/boot.js',
  './js/services/weatherService.js',
  './js/services/youtubeService.js',
  './js/apps/notes/notes.js',
  './js/apps/clock/clock.js',
  './js/apps/calendar/calendar.js',
  './js/apps/editor/editor.js',
  './js/apps/terminal/terminal.js',
  './js/apps/files/files.js',
  './js/apps/settings/settings.js',
  './js/apps/weather/weather.js',
  './js/apps/chess/chess.js',
  './js/apps/breakout/breakout.js',
  './js/apps/music/music.js',
  './js/apps/browser/browser.js',
  './js/apps/novablender/novablender.js',
  './js/apps/taskManager/taskManager.js',
  './js/apps/playStore/playStore.js',
  './js/core/lockScreen.js',
  './js/core/soundSystem.js',
  './js/core/gestureSystem.js',
  './js/apps/security/security.js',
  './js/apps/snake/snake.js',
  './js/apps/game2048/game2048.js',
  './js/apps/tictactoe/tictactoe.js',
  './novablender.html',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache what we can, skip failures gracefully
      return Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local assets, network-first for external
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API calls (weather, fonts, youtube)
  if (event.request.method !== 'GET') return;
  if (url.hostname === 'api.open-meteo.com') return;
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) return;
  if (url.hostname.includes('youtube')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful same-origin responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
