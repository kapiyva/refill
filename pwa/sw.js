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

// One cache entry per file: the query string is ignored, and refill.html
// shares the entry of the page it is a copy of.
function cacheKey(request) {
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  if (url.pathname.endsWith("/refill.html") || url.pathname.endsWith("/index.html")) {
    url.pathname = url.pathname.replace(/[^/]+$/, "");
  }
  return url.href;
}

async function fromNetwork(request) {
  const res = await fetch(request);
  const cache = await caches.open(CACHE);
  const key = cacheKey(request);
  const cached = await cache.match(key);
  if (!res.ok) return cached ?? res; // an error page never replaces a good copy
  // Skip rewriting an unchanged copy (the page is ~2 MB).
  if (!sameVersion(res, cached)) await cache.put(key, res.clone());
  return res;
}

const fromCache = async (request) => (await caches.match(cacheKey(request))) ?? Response.error();

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fromNetwork(e.request).catch(() => fromCache(e.request)));
});
