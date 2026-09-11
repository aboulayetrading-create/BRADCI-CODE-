// Service Worker officiel BRAD'CI (Web, Mobile PWA & APK) - Cache & Push Notifications Adaptive Icon v14
const CACHE_NAME = 'bradci-adaptive-icon-v14';
const ASSETS = ['./', './index.html', './icon.png', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Purge ALL older caches immediately to force fresh icon and logo update
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: "BRAD'CI", body: "Nouvelle notification !" };
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: './icon.png?v=14',
    badge: './icon.png?v=14',
    vibrate: [200, 100, 200],
    renotify: true
  });
});

// Interception réseau et cache hors-ligne (Network First pour logos et icônes)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('icon.png') || url.pathname.endsWith('logo.png') || url.pathname.endsWith('manifest.json')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => caches.match(event.request) || caches.match('./icon.png'))
    );
    return;
  }

  if (url.pathname.endsWith('index.html') || url.pathname === '/') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        });
      })
    );
  }
});

// Réception des messages directs depuis l'application (Canal local & Tests)
self.addEventListener('message', (event) => {
  if (event.data && (
    event.data.type === 'SHOW_NOTIFICATION' || 
    event.data.type === 'SEND_TEST_NOTIFICATION' ||
    event.data.type === 'TEST_PUSH'
  )) {
    const title = event.data.title || "BRAD'CI";
    const body = event.data.body || event.data.options?.body || "Nouvelle notification !";
    const icon = event.data.icon || './icon.png';
    const tag = event.data.tag || 'bradci-notification';
    const data = event.data.data || '/';

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: icon,
        badge: './icon.png',
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
          } catch (_) {}
          return client.focus();
        }
      }
      const urlToOpen = (notifData && typeof notifData === 'object' && notifData.url) 
        ? notifData.url 
        : (typeof notifData === 'string' ? notifData : './index.html');
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
