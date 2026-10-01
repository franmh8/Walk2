// ==============================================================
// SERVICE WORKER TÁCTICO C5i HIDALGO
// SISTEMA DE NOTIFICACIONES PUSH Y ALERTAS EN SEGUNDO PLANO
// ==============================================================

const CACHE_NAME = 'c5i-radio-v2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/c5i-icon.svg',
];

// Ciclo de Instalación
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW C5i] Fallo precache inicial de algunos recursos:', err);
      });
    })
  );
});

// Ciclo de Activación y Control Inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      }),
    ])
  );
});

// -------------------------------------------------------------
// EVENTO PUSH: Notificaciones Push del Servidor en Segundo Plano
// -------------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        title: '🚨 ALERTA C5i HIDALGO',
        body: event.data.text(),
      };
    }
  } else {
    payload = {
      title: '🚨 ALERTA TÁCTICA C5i HIDALGO',
      body: 'Transmisión prioritaria en red de radiocomunicación.',
    };
  }

  const notificationTitle = payload.title || '🚨 ALERTA TÁCTICA C5i HIDALGO';
  const notificationOptions = {
    body: payload.body || 'Alerta de radio prioritaria recibida en segundo plano.',
    icon: payload.icon || '/c5i-icon.svg',
    badge: payload.badge || '/c5i-icon.svg',
    image: payload.image || undefined,
    tag: payload.tag || ('c5i-push-' + Date.now()),
    renotify: true,
    requireInteraction: payload.priority === 'emergency' || true,
    silent: false,
    vibrate: payload.priority === 'emergency'
      ? [500, 150, 500, 150, 500, 200, 800]
      : [300, 100, 300, 100, 400],
    data: {
      url: payload.url || '/',
      channelId: payload.channelId || null,
      callsign: payload.callsign || 'CENTRAL-C5I',
      priority: payload.priority || 'high',
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'open_radio',
        title: '🎙️ Abrir Frecuencia',
      },
      {
        action: 'acknowledge',
        title: '✅ Enterado',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// -------------------------------------------------------------
// EVENTO CLICK: Apertura y Enfoque de la Consola de Radio
// -------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la ventana ya está abierta, la enfocamos y le enviamos mensaje
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'C5I_PUSH_NOTIFICATION_CLICK',
            action,
            data: notifData,
          });
          return client.focus();
        }
      }

      // Si no hay ventana activa, abrimos una nueva instancia
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// -------------------------------------------------------------
// EVENTO MENSAJE: Emisión Directa desde la Aplicación
// -------------------------------------------------------------
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  if (type === 'TRIGGER_BACKGROUND_ALERT') {
    const isEmergency = data.priority === 'emergency';
    const title = data.title || (isEmergency ? '🚨 CÓDIGO ROJO C5i' : '📻 COMUNICACIÓN TÁCTICA');
    const options = {
      body: data.body || 'Alerta en segundo plano activa.',
      icon: '/c5i-icon.svg',
      badge: '/c5i-icon.svg',
      tag: 'c5i-alert-' + (data.channelId || 'general'),
      renotify: true,
      requireInteraction: isEmergency,
      vibrate: isEmergency ? [500, 200, 500, 200, 500] : [200, 100, 200],
      data: {
        url: '/',
        channelId: data.channelId || null,
        priority: data.priority || 'normal',
        timestamp: Date.now(),
      },
      actions: [
        { action: 'open_radio', title: '🎙️ Responder Radio' },
        { action: 'acknowledge', title: '✅ Enterado' },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// -------------------------------------------------------------
// FETCH: Soporte Offline Básico para Continuidad Operativa
// -------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET no API
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Si no hay red y solicita HTML, servir el index desde cache
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
