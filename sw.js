// Service Worker officiel BRAD'CI (Web, Mobile PWA & APK)
const CACHE_NAME = 'bradci-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Réception des messages directs depuis l'application React
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      body: options?.body || "Mise à jour en direct de votre commande BRAD'CI",
      icon: options?.icon || './icon.png',
      badge: options?.badge || './icon.png',
      vibrate: [200, 100, 200],
      data: options?.data || './',
      tag: options?.tag || 'bradci-' + Date.now(),
      renotify: true,
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
    icon: './icon.png',
    badge: './icon.png',
    vibrate: [200, 100, 200],
    data: data.url || './',
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
