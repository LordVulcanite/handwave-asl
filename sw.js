const CORE = "handwave-core-v1", BIG = "handwave-mp-v1";
const ASSETS = ["./", "index.html", "app.js", "features.js", "letters.js", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CORE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CORE && k !== BIG).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.hostname === "cdn.jsdelivr.net") {
    // the hand tracker comes from a CDN and is big, so keep one copy and reuse it (also works offline after the first use)
    e.respondWith(caches.open(BIG).then((c) => c.match(e.request).then((m) => m || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
  } else if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CORE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("index.html"))));
  } else if (/(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CORE).then((c) => c.put(e.request, cp)); return r; }).catch(() => m)));
  }
});
