/* El Ojo Maestro · service worker
   Objetivo: que la app abra al instante (y funcione sin internet).
   - Código (html/js): caché primero y se actualiza en segundo plano
     (stale-while-revalidate). Antes era "red primero", así que en el wifi
     lento del local la app esperaba a bajar los 300 KB de código CADA vez
     que alguien entraba. Ahora pinta al instante desde el 2º ingreso y la
     versión nueva queda lista para la siguiente apertura.
   - Imágenes y fuentes: caché primero → las 70 fotos del inventario y la
     tipografía solo se descargan una vez. */
const CACHE = 'ojo-maestro-v4';
const SHELL = ['./', 'index.html', 'app.js', 'assets.js', 'fotos-productos.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
/* ¿la copia que acaba de bajar es distinta a la que servimos del caché? */
function cambio(viejo, nuevo) {
  const et = h => h.headers.get('etag'), ln = h => h.headers.get('content-length');
  if (et(viejo) && et(nuevo)) return et(viejo) !== et(nuevo);
  if (ln(viejo) && ln(nuevo)) return ln(viejo) !== ln(nuevo);
  return false;                                   // ante la duda, no molestar
}
let avisado = false;
function avisarVersionNueva() {
  if (avisado) return; avisado = true;            // un solo aviso por carga
  self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ tipo: 'version-nueva' })));
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;                      // los POST al backend pasan directo
  if (url.hostname.includes('script.google.com')) return;      // nunca cachear el backend
  const esCodigo = url.origin === location.origin &&
    (url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('/'));
  if (esCodigo) {
    // caché primero + actualización en segundo plano (stale-while-revalidate)
    e.respondWith(
      caches.match(e.request).then(hit => {
        const red = fetch(e.request).then(r => {
          if (r && r.ok) {
            const copia = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, copia));
            if (hit && cambio(hit, r)) avisarVersionNueva();
          }
          return r;
        }).catch(() => hit);
        return hit || red;   // si ya está en caché responde YA y revalida aparte
      })
    );
  } else {
    // imágenes, fuentes, Drive thumbnails: caché primero
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
        return r;
      }).catch(() => hit))
    );
  }
});
