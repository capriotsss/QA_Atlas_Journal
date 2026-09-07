const VERSION = 'qa-atlas-shell-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './Logo.png'
];
const STATIC_HOSTS = new Set(['cdn.tailwindcss.com', 'cdn.jsdelivr.net']);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Dati live: non entrare mai nella cache dell'app shell.
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/rest/') || url.pathname.includes('/auth/')) return;

  // Solo richieste GET same-origin possono usare la cache dell'app.
  if (request.method !== 'GET' || (url.origin !== self.location.origin && !STATIC_HOSTS.has(url.hostname))) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(VERSION).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
