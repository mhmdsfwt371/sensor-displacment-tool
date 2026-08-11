/* Service worker — شبكة أولًا مع رجوع للذاكرة عشان الأداة تشتغل أوفلاين
   ومع ذلك تفضل قابلة للتحديث. غيّر SW_V مع كل إصدار. */
const SW_V = "5.1";
const CACHE = "sensor-tool-" + SW_V;
const CORE = ["./", "./index.html", "./three.min.js", "./manifest.json",
              "./icon-192.png", "./icon-512.png", "./icon-maskable.png",
              "./favicon.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ملف الإصدار: شبكة دايمًا عشان فحص التحديث يبقى صادق
  if (url.pathname.endsWith("version.json")) {
    e.respondWith(fetch(req, { cache: "no-store" }).catch(() => caches.match(req)));
    return;
  }

  e.respondWith(
    fetch(req)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
