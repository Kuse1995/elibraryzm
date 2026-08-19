/* E Library Zambia service worker (2026-08-19)
 *
 * Goals, in priority order:
 *  1. Never serve stale money/auth/API data - Supabase, Lenco and cross-origin
 *     calls always go to the network untouched.
 *  2. Never block deploys - page navigations are network-first, so a new
 *     build is picked up on the very next visit.
 *  3. Offline app shell - hashed build assets and game audio are cached
 *     stale-while-revalidate, so games keep working offline once opened
 *     (matters a lot for Zambian data costs).
 *  4. A friendly offline page when even the shell is not cached yet.
 *
 * Bump VERSION to force every client to drop old caches after a big change.
 */
const VERSION = "elibrary-v1";
const SHELL_CACHE = VERSION + "-shell";
const PAGES_CACHE = VERSION + "-pages";
const ASSETS_CACHE = VERSION + "-assets";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/favicon.png", "/manifest.webmanifest"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION + "-")).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only same-origin GETs are handled. POSTs (auth, edge functions) and
  // cross-origin calls (Supabase REST/storage, fonts, Meta pixel) always go
  // straight to the network.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: network-first so new deploys apply immediately;
  // offline, fall back to the cached SPA shell, then the offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES_CACHE).then((cache) => {
            cache.put(req, copy);
            cache.put("/index.html", copy);
          });
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(PAGES_CACHE);
          return (
            (await cache.match(req)) ||
            (await cache.match("/index.html")) ||
            (await caches.match(OFFLINE_URL)) ||
            Response.error()
          );
        })
    );
    return;
  }

  // Static assets (hashed /assets/*, game audio, images, fonts):
  // stale-while-revaluate - instant from cache, refreshed in the background.
  const isStatic =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/game-audio/") ||
    /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|mp3|wav|ogg)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        return hit || (await network) || Response.error();
      })
    );
  }
  // Anything else: no respondWith -> plain network.
});
