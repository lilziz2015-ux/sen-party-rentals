"use strict";

const CACHE_VERSION = "sen-party-rentals-v1";

const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const OFFLINE_PAGE = "/offline.html";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/inventory.html",
  "/booking.html",
  "/contact.html",
  "/water-slides.html",
  "/bounce-houses.html",
  "/obstacle-courses.html",
  "/offline.html",
  "/site.webmanifest",
  "/assets/style.css?v=20",
  "/assets/header.css?v=20",
  "/assets/rental.css?v=20",
  "/assets/script.js?v=20",
  "/assets/images/logo.png",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png"
];

/* =========================================================
   INSTALL
========================================================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error("Service worker installation failed:", error);
      })
  );
});

/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== STATIC_CACHE &&
                cacheName !== PAGE_CACHE &&
                cacheName !== IMAGE_CACHE
              );
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* =========================================================
   FETCH
========================================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

/* =========================================================
   NETWORK-FIRST FOR HTML PAGES
========================================================= */

async function networkFirstPage(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const offlineResponse = await caches.match(OFFLINE_PAGE);

    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Offline | Sen Party Rentals</title>
        </head>
        <body>
          <main>
            <h1>You Are Offline</h1>
            <p>Please reconnect to the internet and try again.</p>
          </main>
        </body>
      </html>
      `,
      {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      }
    );
  }
}

/* =========================================================
   CACHE-FIRST FOR IMAGES
========================================================= */

async function cacheFirstImage(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    return new Response("", {
      status: 504,
      statusText: "Image unavailable while offline"
    });
  }
}

/* =========================================================
   STALE-WHILE-REVALIDATE
========================================================= */

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || networkPromise;
}

/* =========================================================
   CACHE-FIRST
========================================================= */

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    return new Response("Resource unavailable while offline.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
}