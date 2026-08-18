/* =========================================================
   SEN PARTY RENTALS — SERVICE WORKER
   File: /service-worker.js
   Version: 49
========================================================= */

"use strict";


/* =========================================================
   CACHE SETTINGS
========================================================= */

const SW_VERSION =
  "49";

const CACHE_PREFIX =
  "sen-party-rentals";

const STATIC_CACHE =
  `${CACHE_PREFIX}-static-v${SW_VERSION}`;

const RUNTIME_CACHE =
  `${CACHE_PREFIX}-runtime-v${SW_VERSION}`;

const IMAGE_CACHE =
  `${CACHE_PREFIX}-images-v${SW_VERSION}`;


/* =========================================================
   CORE WEBSITE FILES
========================================================= */

const CORE_ASSETS = [
  "./",
  "./index.html",

  "./assets/style.css",
  "./assets/header.css",
  "./assets/footer.css",
  "./assets/script.js",

  "./header.html",
  "./footer.html",

  "./logo.jpeg",
  "./site.webmanifest",
  "./assets/icons/icon-192x192.png",
  "./assets/icons/icon-512x512.png"
];


/* =========================================================
   NEVER CACHE THESE SERVICES
========================================================= */

const NETWORK_ONLY_HOSTS =
  new Set([
    "tuttkwpnicgfcyeptrkv.supabase.co",
    "www.googletagmanager.com",
    "www.google-analytics.com",
    "region1.google-analytics.com",
    "script.google.com",
    "script.googleusercontent.com"
  ]);


/* =========================================================
   FILE TYPES
========================================================= */

const STATIC_FILE_PATTERN =
  /\.(?:css|js|mjs|woff|woff2|ttf|otf)$/i;

const IMAGE_FILE_PATTERN =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i;


/* =========================================================
   HELPERS
========================================================= */

function isHttpRequest(
  request
) {
  try {
    const url =
      new URL(
        request.url
      );

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );

  } catch {
    return false;
  }
}


function isSameOrigin(
  request
) {
  try {
    const url =
      new URL(
        request.url
      );

    return (
      url.origin ===
      self.location.origin
    );

  } catch {
    return false;
  }
}


function isNavigationRequest(
  request
) {
  return (
    request.mode ===
      "navigate" ||
    request.destination ===
      "document"
  );
}


function shouldUseNetworkOnly(
  request
) {
  try {
    const url =
      new URL(
        request.url
      );


    if (
      NETWORK_ONLY_HOSTS.has(
        url.hostname
      )
    ) {
      return true;
    }


    /*
     * Never cache any Supabase
     * REST, auth, storage or
     * realtime request.
     */
    if (
      url.hostname.endsWith(
        ".supabase.co"
      )
    ) {
      return true;
    }


    return false;

  } catch {
    return true;
  }
}


function requestCanBeCached(
  request
) {
  return (
    request.method ===
      "GET" &&
    isHttpRequest(
      request
    ) &&
    !shouldUseNetworkOnly(
      request
    )
  );
}


function responseCanBeCached(
  response
) {
  return Boolean(
    response &&
    response.status >=
      200 &&
    response.status <
      300
  );
}


/* =========================================================
   INSTALL SERVICE WORKER
========================================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(
      (async () => {

        const cache =
          await caches.open(
            STATIC_CACHE
          );


        /*
         * Cache each file separately.
         * If one file is missing,
         * installation still continues.
         */
        await Promise.allSettled(
          CORE_ASSETS.map(
            async asset => {

              try {

                const request =
                  new Request(
                    asset,
                    {
                      cache:
                        "reload"
                    }
                  );


                const response =
                  await fetch(
                    request
                  );


                if (
                  responseCanBeCached(
                    response
                  )
                ) {

                  await cache.put(
                    request,
                    response.clone()
                  );
                }

              } catch (
                error
              ) {

                console.warn(
                  "[Service Worker] Could not cache:",
                  asset,
                  error
                );
              }
            }
          )
        );


        /*
         * Activate updated
         * service worker immediately.
         */
        await self.skipWaiting();

      })()
    );
  }
);


/* =========================================================
   ACTIVATE SERVICE WORKER
========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      (async () => {

        const validCaches =
          new Set([
            STATIC_CACHE,
            RUNTIME_CACHE,
            IMAGE_CACHE
          ]);


        const cacheNames =
          await caches.keys();


        /*
         * Delete old Sen Party
         * Rentals caches.
         */
        await Promise.all(
          cacheNames.map(
            cacheName => {

              if (
                cacheName.startsWith(
                  CACHE_PREFIX
                ) &&
                !validCaches.has(
                  cacheName
                )
              ) {

                return caches.delete(
                  cacheName
                );
              }


              return Promise.resolve(
                false
              );
            }
          )
        );


        /*
         * Control open website
         * tabs immediately.
         */
        await self.clients.claim();

      })()
    );
  }
);


/* =========================================================
   NETWORK FIRST
   HTML / PAGES
========================================================= */

async function networkFirst(
  request
) {

  const cache =
    await caches.open(
      RUNTIME_CACHE
    );


  try {

    /*
     * Always try the newest
     * page from the internet.
     */
    const networkResponse =
      await fetch(
        request,
        {
          cache:
            "no-store"
        }
      );


    if (
      responseCanBeCached(
        networkResponse
      )
    ) {

      await cache.put(
        request,
        networkResponse.clone()
      );
    }


    return networkResponse;

  } catch (
    error
  ) {

    /*
     * If offline, use the
     * last working copy.
     */
    const cachedResponse =
      await cache.match(
        request
      );


    if (
      cachedResponse
    ) {
      return cachedResponse;
    }


    /*
     * If the requested page
     * isn't cached, show the
     * cached homepage.
     */
    if (
      isNavigationRequest(
        request
      )
    ) {

      const homepage =
        (
          await caches.match(
            "./index.html"
          )
        ) ||
        (
          await caches.match(
            "./"
          )
        );


      if (
        homepage
      ) {
        return homepage;
      }
    }


    throw error;
  }
}


/* =========================================================
   STATIC FILE CACHE
   CSS / JS / FONTS
========================================================= */

async function cacheFirstWithRefresh(
  request
) {

  const cache =
    await caches.open(
      STATIC_CACHE
    );


  /*
   * Ignore ?v=45, ?v=46 etc.
   * when looking for an existing
   * cached copy.
   */
  const cached =
    await cache.match(
      request,
      {
        ignoreSearch:
          true
      }
    );


  /*
   * Also try downloading the
   * latest file in background.
   */
  const refreshPromise =
    fetch(
      request,
      {
        cache:
          "no-cache"
      }
    )
      .then(
        async response => {

          if (
            responseCanBeCached(
              response
            )
          ) {

            await cache.put(
              request,
              response.clone()
            );
          }


          return response;
        }
      )
      .catch(
        () => null
      );


  /*
   * Cached file loads immediately.
   */
  if (
    cached
  ) {

    void refreshPromise;

    return cached;
  }


  /*
   * No cached copy,
   * use network.
   */
  const refreshed =
    await refreshPromise;


  if (
    refreshed
  ) {
    return refreshed;
  }


  throw new Error(
    "Static asset unavailable"
  );
}


/* =========================================================
   IMAGE CACHE
========================================================= */

async function imageCacheFirst(
  request
) {

  const cache =
    await caches.open(
      IMAGE_CACHE
    );


  const cached =
    await cache.match(
      request
    );


  if (
    cached
  ) {
    return cached;
  }


  const response =
    await fetch(
      request
    );


  if (
    responseCanBeCached(
      response
    )
  ) {

    await cache.put(
      request,
      response.clone()
    );
  }


  return response;
}


/* =========================================================
   FETCH REQUEST ROUTER
========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    /*
     * Skip POST, Supabase,
     * Analytics, etc.
     */
    if (
      !requestCanBeCached(
        request
      )
    ) {
      return;
    }


    const url =
      new URL(
        request.url
      );


    /* =====================================================
       SUPABASE / ANALYTICS
       NETWORK ONLY
    ===================================================== */

    if (
      shouldUseNetworkOnly(
        request
      )
    ) {
      return;
    }


    /* =====================================================
       HTML
       NETWORK FIRST
    ===================================================== */

    if (
      isNavigationRequest(
        request
      ) ||
      (
        isSameOrigin(
          request
        ) &&
        url.pathname.endsWith(
          ".html"
        )
      )
    ) {

      event.respondWith(
        networkFirst(
          request
        )
      );

      return;
    }


    /* =====================================================
       CSS / JS / FONTS
    ===================================================== */

    if (
      isSameOrigin(
        request
      ) &&
      STATIC_FILE_PATTERN.test(
        url.pathname
      )
    ) {

      event.respondWith(
        cacheFirstWithRefresh(
          request
        )
      );

      return;
    }


    /* =====================================================
       IMAGES
    ===================================================== */

    if (
      isSameOrigin(
        request
      ) &&
      IMAGE_FILE_PATTERN.test(
        url.pathname
      )
    ) {

      event.respondWith(
        imageCacheFirst(
          request
        )
      );

      return;
    }


    /*
     * Everything else uses
     * normal browser networking.
     */
  }
);


/* =========================================================
   SERVICE WORKER COMMANDS
========================================================= */

self.addEventListener(
  "message",
  event => {

    const data =
      event.data || {};


    /*
     * Activate newest worker.
     */
    if (
      data.type ===
      "SKIP_WAITING"
    ) {

      self.skipWaiting();

      return;
    }


    /*
     * Clear website caches
     * manually if needed.
     */
    if (
      data.type ===
      "CLEAR_SITE_CACHES"
    ) {

      event.waitUntil(
        (async () => {

          const names =
            await caches.keys();


          await Promise.all(
            names
              .filter(
                name =>
                  name.startsWith(
                    CACHE_PREFIX
                  )
              )
              .map(
                name =>
                  caches.delete(
                    name
                  )
              )
          );

        })()
      );
    }
  }
);
