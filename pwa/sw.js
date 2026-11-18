// Offline support for the hosted copy of refill. Network first, so a new
// version is picked up whenever the site is reachable; the cache is only a
// fallback. refill.html itself does not need this file to work.
const CACHE = "refill";
// index.html and refill.html are the same page, so the page is cached once
// (as "./") and refill.html falls back to it.
const FILES = ["./", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

const sameVersion = (a, b) => {
  const tag = (r) => r?.headers.get("etag") || r?.headers.get("last-modified");
  return tag(a) !== null && tag(a) !== undefined && tag(a) === tag(b);
};

async function fromNetwork(request) {
  const res = await fetch(request);
  if (res.ok) {
    const cache = await caches.open(CACHE);
    // Skip rewriting an unchanged copy (the page is ~2 MB).
    if (!sameVersion(res, await cache.match(request))) await cache.put(request, res.clone());
  }
  return res;
}

async function fromCache(request) {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (hit) return hit;
  if (new URL(request.url).pathname.endsWith("/refill.html")) return caches.match("./");
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fromNetwork(e.request).catch(() => fromCache(e.request)));
});
