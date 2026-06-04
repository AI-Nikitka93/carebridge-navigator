const CACHE_NAME = "carebridge-navigator-v1";
const SHELL_PATHS = ["./", "./index.html", "./favicon.svg", "./site.webmanifest"];

function scopeUrl(path) {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_PATHS.map(scopeUrl)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseCopy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) ??
            (await caches.match(scopeUrl("./index.html"))) ??
            Response.error(),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cachedResponse) =>
        cachedResponse ??
        fetch(request).then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
          }
          return response;
        }),
    ),
  );
});
