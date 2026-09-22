// Arena Africa Service Worker — offline support for the mobile PWA
const CACHE = "arena-v1";
const ASSETS = ["/mobile", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Network-first for API, cache-first for static assets
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((r) => r || new Response(JSON.stringify({ success: false, error: "offline" }), {
          headers: { "Content-Type": "application/json" },
        }))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
  );
});
