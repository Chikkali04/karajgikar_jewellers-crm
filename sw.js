const CACHE_NAME = 'karajgikar-crm-cache-v14';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/logo.svg',
  './assets/login_bg.jpg',
  './js/db/database.js',
  './js/services/i18nService.js',
  './js/services/goldRateService.js',
  './js/services/customerService.js',
  './js/services/purchaseService.js',
  './js/services/followUpService.js',
  './js/services/festivalService.js',
  './js/services/campaignService.js',
  './js/services/backupService.js',
  './js/services/autoWishService.js',
  './js/ui/customers.js',
  './js/ui/customerProfile.js',
  './js/ui/purchases.js',
  './js/ui/followUps.js',
  './js/ui/dashboard.js',
  './js/ui/birthdays.js',
  './js/ui/festivals.js',
  './js/ui/campaigns.js',
  './js/ui/inactiveCustomers.js',
  './js/ui/messages.js'
];

// 1. INSTALLATION EVENT: Cache all static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Pre-caching static assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATION EVENT: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Wiping stale cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH INTERCEPT EVENT: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/S GET requests (avoid chrome-extension://, file://, or non-GET requests)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        console.warn('Fetch failed; client is offline.');
      });
    })
  );
});
