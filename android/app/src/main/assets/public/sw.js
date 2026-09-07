// Service Worker officiel BRAD'CI (Web, Mobile PWA & APK) - Cache v2 Universel
const CACHE_NAME = 'bradci-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/icon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW BRAD\'CI] Pre-cache non-blocking error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Invalidation immédiate des anciens caches pour remplacer l'ancienne icône
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW BRAD\'CI] Invalidation ancien cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception réseau : privilégier la version fraîche de l'icône
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/icon.png') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Réception des messages directs depuis l'application React
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      body: options?.body || "Mise à jour en direct de votre commande BRAD'CI",
      icon: options?.icon || '/icon.png',
      badge: options?.badge || '/icon.png',
      vibrate: [200, 100, 200],
      data: options?.data || '/',
      tag: options?.tag || 'bradci-' + Date.now(),
      renotify: true,
      channelId: 'bradci_orders', // Canal Android 8.0+ (API 26+)
      ...options
    };
    self.registration.showNotification(title || "BRAD'CI Alerte", finalOptions);
  }
  if (event.data && event.data.type === 'PING') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ status: 'PONG', version: CACHE_NAME });
    }
  }
});

// Gestion des notifications push natives Android & Mobile
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || "BRAD'CI Notification";
  const options = {
    body: data.body || "Mise à jour en temps réel de votre commande ou enchère",
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    channelId: 'bradci_orders', // Canal Android 8.0+ (API 26+)
    actions: [
      { action: 'open', title: 'Ouvrir' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur notification -> Focus ou ouverture de l'application et transmission d'action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data;
  const actionClicked = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          try {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              action: actionClicked,
              data: notifData
            });
          } catch (e) {
            console.warn('Could not postMessage to client:', e);
          }
          return client.focus();
        }
      }
      const urlToOpen = (notifData && typeof notifData === 'object' && notifData.url) 
        ? notifData.url 
        : (typeof notifData === 'string' ? notifData : './');
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
