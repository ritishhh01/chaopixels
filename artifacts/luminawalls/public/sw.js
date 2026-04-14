const CACHE = "chaopixels-v1";
const STATIC = ["/", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never intercept API, Clerk, or external image requests
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("clerk") ||
    url.hostname.includes("images.unsplash") ||
    url.hostname.includes("fal.") ||
    e.request.method !== "GET"
  ) {
    return;
  }

  // Network-first for HTML navigation
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/"))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts)
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|svg|png|ico|webp)$/) ||
    url.pathname.startsWith("/assets/")
  ) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) => cached ?? fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
      )
    );
  }
});
