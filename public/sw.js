// Service Worker officiel BRAD'CI (Web, Mobile PWA & APK) - Cache & Notifications Fix v3
const CACHE_NAME = 'bradci-v3-notifications-fix';
const ASSETS_TO_CACHE = [
  '/',
  '/icon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW BRAD\'CI v3] Pre-cache non-blocking error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Invalidation immédiate des anciens caches (v1, v2, etc.)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW BRAD\'CI v3] Invalidation ancien cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception réseau : servir et rafraîchir l'icône et les assets essentiels
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/icon.png' || url.pathname === '/manifest.json') {
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

// Gestionnaire robuste de notifications push natives (Web Push, Android, PWA)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "BRAD'CI", body: event.data.text() };
    }
  } else {
    data = { title: "BRAD'CI Alerte", body: "Nouvelle notification de course !" };
  }

  const title = data.title || "BRAD'CI";
  const options = {
    body: data.body || "Nouvelle alerte course !",
    icon: data.icon || '/icon.png',
    badge: data.badge || '/icon.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'bradci-notification',
    renotify: true,
    data: data.url || data.data || '/',
    actions: data.actions || [
      { action: 'open', title: 'Ouvrir BRAD\'CI' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Réception des messages directs depuis l'application (Canal local & Tests)
self.addEventListener('message', (event) => {
  if (event.data && (
    event.data.type === 'SHOW_NOTIFICATION' || 
    event.data.type === 'SEND_TEST_NOTIFICATION' ||
    event.data.type === 'TEST_PUSH'
  )) {
    const title = event.data.title || "BRAD'CI";
    const body = event.data.body || event.data.options?.body || "Nouvelle alerte course !";
    const icon = event.data.icon || event.data.options?.icon || '/icon.png';
    const tag = event.data.tag || event.data.options?.tag || 'bradci-notification';
    const data = event.data.data || event.data.options?.data || '/';

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: icon,
        badge: '/icon.png',
        vibrate: [200, 100, 200],
        tag: tag,
        renotify: true,
        data: data
      })
    );
  }

  if (event.data && event.data.type === 'PING') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ status: 'PONG', version: CACHE_NAME });
    }
  }
});

// Clic sur notification -> Focus ou ouverture de l'application
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
            console.warn('[SW BRAD\'CI v3] postMessage error:', e);
          }
          return client.focus();
        }
      }
      const urlToOpen = (notifData && typeof notifData === 'object' && notifData.url) 
        ? notifData.url 
        : (typeof notifData === 'string' ? notifData : '/');
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
