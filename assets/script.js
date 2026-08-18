"use strict";

/* =========================================================
   SEN PARTY RENTALS — SHARED WEBSITE JAVASCRIPT
   File: assets/script.js

   Handles:
   - Shared header loading
   - Shared footer loading
   - Three-line mobile menu
   - Rentals dropdown
   - Active navigation links
   - Sticky/scrolled header
   - Footer year
   - Back-to-top button
   - FAQ accordions
   - Scroll reveal effects
   - Customer-service widget
   - Website visit logging
   - Service worker registration
========================================================= */


/* =========================================================
   WEBSITE SETTINGS
========================================================= */

const SEN_PARTY_RENTALS = {
  phoneDisplay: "(571) 719-9575",
  phoneLink: "+15717199575",

  headerPath: "./header.html",
  footerPath: "./footer.html",

  mobileBreakpoint: 980,

  customerServiceDelay: 1800,

  visitLoggerUrl:
    "https://script.google.com/macros/s/" +
    "AKfycbwQAb348VKG0bBwpXeK86n3SKRPhLnIsH0quc99n0omWEWG1ciljlfD1lkPgms7sTPm/" +
    "exec"
};


/* =========================================================
   GENERAL HELPERS
========================================================= */

function prefersReducedMotion() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}


function isMobileNavigation() {
  return (
    window.innerWidth <=
    SEN_PARTY_RENTALS.mobileBreakpoint
  );
}


function getCurrentPageName() {
  const pathname =
    window.location.pathname;

  const pageName =
    pathname.split("/").pop();

  return pageName || "index.html";
}


function normalizePageHref(href) {
  if (!href) {
    return "";
  }

  try {
    const url = new URL(
      href,
      window.location.href
    );

    return (
      url.pathname.split("/").pop() ||
      "index.html"
    );
  } catch (error) {
    return href
      .replace("./", "")
      .split("?")[0]
      .split("#")[0];
  }
}


function safelyUseSessionStorage() {
  try {
    const testKey =
      "__sen_party_rentals_test__";

    window.sessionStorage.setItem(
      testKey,
      "true"
    );

    window.sessionStorage.removeItem(
      testKey
    );

    return true;
  } catch (error) {
    return false;
  }
}


/* =========================================================
   SHARED COMPONENT LOADER
========================================================= */

async function loadSharedComponent(
  elementId,
  filePath
) {
  const container =
    document.getElementById(elementId);

  if (!container) {
    return false;
  }

  if (
    container.dataset.componentLoaded ===
    "true"
  ) {
    return true;
  }

  /*
   * If the page already contains the
   * shared component directly, do not
   * replace it.
   */

  if (
    container.querySelector(
      "#site-header, #site-footer"
    )
  ) {
    container.dataset.componentLoaded =
      "true";

    return true;
  }

  try {
    const response = await fetch(
      filePath,
      {
        method: "GET",
        cache: "no-cache",
        headers: {
          Accept: "text/html"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `${filePath} returned status ${response.status}`
      );
    }

    const html =
      await response.text();

    container.innerHTML = html;

    container.dataset.componentLoaded =
      "true";

    return true;
  } catch (error) {
    console.error(
      `Could not load ${filePath}:`,
      error
    );

    container.dataset.componentError =
      "true";

    return false;
  }
}


/* =========================================================
   SHARED HEADER
========================================================= */

function initializeSharedHeader() {
  const header =
    document.getElementById(
      "site-header"
    );

  const nav =
    document.getElementById(
      "main-nav"
    );

  const navToggle =
    document.getElementById(
      "nav-toggle"
    );

  if (!header || !nav || !navToggle) {
    return;
  }

  if (
    header.dataset.initialized ===
    "true"
  ) {
    return;
  }

  header.dataset.initialized =
    "true";

  const dropdowns = Array.from(
    header.querySelectorAll(
      ".header-dropdown"
    )
  );

  const navigationLinks = Array.from(
    header.querySelectorAll(
      ".header-nav-link, " +
      ".header-dropdown-menu a"
    )
  );


  /* =======================================================
     MOBILE MENU STATE
  ======================================================== */

  function setMenuState(isOpen) {
    nav.classList.toggle(
      "is-open",
      isOpen
    );

    navToggle.classList.toggle(
      "is-active",
      isOpen
    );

    header.classList.toggle(
      "menu-open",
      isOpen
    );

    document.body.classList.toggle(
      "menu-open",
      isOpen
    );

    document.body.classList.toggle(
      "nav-open",
      isOpen
    );

    navToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    navToggle.setAttribute(
      "aria-label",
      isOpen
        ? "Close navigation menu"
        : "Open navigation menu"
    );
  }


  function closeDropdowns() {
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove(
        "is-open"
      );

      const button =
        dropdown.querySelector(
          ".header-dropdown-toggle"
        );

      button?.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  }


  function closeMenu() {
    setMenuState(false);
    closeDropdowns();
  }


  function toggleMenu() {
    const willOpen =
      !nav.classList.contains(
        "is-open"
      );

    setMenuState(willOpen);
  }


  /* =======================================================
     THREE-LINE MENU BUTTON
  ======================================================== */

  navToggle.addEventListener(
    "click",
    event => {
      event.preventDefault();
      event.stopPropagation();

      toggleMenu();
    }
  );


  /* =======================================================
     RENTALS DROPDOWN
  ======================================================== */

  dropdowns.forEach(dropdown => {
    const button =
      dropdown.querySelector(
        ".header-dropdown-toggle"
      );

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      event => {
        /*
         * Desktop dropdown is controlled
         * by hover and keyboard focus CSS.
         */

        if (!isMobileNavigation()) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const willOpen =
          !dropdown.classList.contains(
            "is-open"
          );

        dropdowns.forEach(
          otherDropdown => {
            if (
              otherDropdown === dropdown
            ) {
              return;
            }

            otherDropdown.classList.remove(
              "is-open"
            );

            otherDropdown
              .querySelector(
                ".header-dropdown-toggle"
              )
              ?.setAttribute(
                "aria-expanded",
                "false"
              );
          }
        );

        dropdown.classList.toggle(
          "is-open",
          willOpen
        );

        button.setAttribute(
          "aria-expanded",
          String(willOpen)
        );
      }
    );
  });


  /* =======================================================
     ACTIVE NAVIGATION LINK
  ======================================================== */

  const currentPage =
    getCurrentPageName();

  navigationLinks.forEach(link => {
    const linkPage =
      normalizePageHref(
        link.getAttribute("href")
      );

    const isCurrentPage =
      linkPage === currentPage;

    link.classList.toggle(
      "is-active",
      isCurrentPage
    );

    if (isCurrentPage) {
      link.setAttribute(
        "aria-current",
        "page"
      );

      const parentDropdown =
        link.closest(
          ".header-dropdown"
        );

      parentDropdown?.classList.add(
        "is-active"
      );

      parentDropdown
        ?.querySelector(
          ".header-dropdown-toggle"
        )
        ?.classList.add(
          "is-active"
        );
    } else {
      link.removeAttribute(
        "aria-current"
      );
    }

    link.addEventListener(
      "click",
      () => {
        if (isMobileNavigation()) {
          closeMenu();
        }
      }
    );
  });


  /* =======================================================
     CLOSE WHEN CLICKING OUTSIDE
  ======================================================== */

  document.addEventListener(
    "click",
    event => {
      if (
        nav.classList.contains(
          "is-open"
        ) &&
        !header.contains(event.target)
      ) {
        closeMenu();
      }

      if (!isMobileNavigation()) {
        dropdowns.forEach(dropdown => {
          if (
            !dropdown.contains(
              event.target
            )
          ) {
            dropdown.classList.remove(
              "is-open"
            );

            dropdown
              .querySelector(
                ".header-dropdown-toggle"
              )
              ?.setAttribute(
                "aria-expanded",
                "false"
              );
          }
        });
      }
    }
  );


  /* =======================================================
     ESCAPE KEY
  ======================================================== */

  document.addEventListener(
    "keydown",
    event => {
      if (event.key !== "Escape") {
        return;
      }

      closeMenu();

      navToggle.focus();
    }
  );


  /* =======================================================
     WINDOW RESIZE
  ======================================================== */

  let resizeTimer;

  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(
        resizeTimer
      );

      resizeTimer =
        window.setTimeout(
          () => {
            if (
              !isMobileNavigation()
            ) {
              closeMenu();
            }
          },
          120
        );
    }
  );


  /* =======================================================
     HEADER SCROLL STATE
  ======================================================== */

  function updateHeaderScrollState() {
    const isScrolled =
      window.scrollY > 40;

    header.classList.toggle(
      "is-scrolled",
      isScrolled
    );
  }

  updateHeaderScrollState();

  window.addEventListener(
    "scroll",
    updateHeaderScrollState,
    {
      passive: true
    }
  );
}


/* =========================================================
   SHARED FOOTER
========================================================= */

function initializeSharedFooter() {
  const footer =
    document.getElementById(
      "site-footer"
    );

  document
    .querySelectorAll(
      "[data-footer-year]"
    )
    .forEach(yearElement => {
      yearElement.textContent =
        String(
          new Date().getFullYear()
        );
    });

  /*
   * Compatibility with older footer IDs.
   */

  const oldYearElement =
    document.getElementById(
      "footerCurrentYear"
    ) ||
    document.getElementById(
      "year"
    );

  if (oldYearElement) {
    oldYearElement.textContent =
      String(
        new Date().getFullYear()
      );
  }

  if (!footer) {
    return;
  }

  if (
    footer.dataset.initialized ===
    "true"
  ) {
    return;
  }

  footer.dataset.initialized =
    "true";
}


/* =========================================================
   BACK TO TOP
========================================================= */

function initializeBackToTop() {
  if (
    document.documentElement.dataset
      .backToTopInitialized === "true"
  ) {
    return;
  }

  document.documentElement.dataset
    .backToTopInitialized = "true";

  document.addEventListener(
    "click",
    event => {
      const button =
        event.target.closest(
          "[data-footer-back-to-top], " +
          "#footerBackToTop, " +
          ".back-to-top"
        );

      if (!button) {
        return;
      }

      event.preventDefault();

      window.scrollTo({
        top: 0,
        left: 0,
        behavior:
          prefersReducedMotion()
            ? "auto"
            : "smooth"
      });
    }
  );
}


/* =========================================================
   FAQ ACCORDIONS
========================================================= */

function initializeFaqAccordions() {
  const faqButtons =
    document.querySelectorAll(
      ".faq-question, " +
      ".home-faq-question, " +
      ".faq-q"
    );

  faqButtons.forEach(button => {
    if (
      button.dataset.initialized ===
      "true"
    ) {
      return;
    }

    button.dataset.initialized =
      "true";

    button.addEventListener(
      "click",
      () => {
        const item =
          button.closest(
            ".faq-item, " +
            ".home-faq-item"
          );

        if (!item) {
          return;
        }

        const wasOpen =
          item.classList.contains(
            "open"
          );

        const accordion =
          item.parentElement ||
          document;

        accordion
          .querySelectorAll(
            ".faq-item.open, " +
            ".home-faq-item.open"
          )
          .forEach(otherItem => {
            if (
              otherItem === item
            ) {
              return;
            }

            otherItem.classList.remove(
              "open"
            );

            const otherButton =
              otherItem.querySelector(
                ".faq-question, " +
                ".home-faq-question, " +
                ".faq-q"
              );

            otherButton?.setAttribute(
              "aria-expanded",
              "false"
            );
          });

        item.classList.toggle(
          "open",
          !wasOpen
        );

        button.setAttribute(
          "aria-expanded",
          String(!wasOpen)
        );
      }
    );
  });
}


/* =========================================================
   SCROLL REVEAL
========================================================= */

function initializeScrollReveal() {
  const revealItems =
    document.querySelectorAll(
      ".reveal"
    );

  if (!revealItems.length) {
    return;
  }

  if (
    prefersReducedMotion() ||
    !(
      "IntersectionObserver" in window
    )
  ) {
    revealItems.forEach(item => {
      item.classList.add(
        "visible"
      );
    });

    return;
  }

  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (
            !entry.isIntersecting
          ) {
            return;
          }

          entry.target.classList.add(
            "visible"
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -40px 0px"
      }
    );

  revealItems.forEach(item => {
    observer.observe(item);
  });
}


/* =========================================================
   CUSTOMER SERVICE WIDGET
========================================================= */

function initializeCustomerServiceWidget() {
  if (
    document.querySelector(
      ".customer-service-widget"
    )
  ) {
    return;
  }

  const widget =
    document.createElement(
      "aside"
    );

  widget.className =
    "customer-service-widget";

  widget.setAttribute(
    "aria-label",
    "Sen Party Rentals customer service"
  );

  widget.innerHTML = `
    <button
      type="button"
      class="customer-service-close"
      aria-label="Close customer service message"
    >
      <i
        class="fa-solid fa-xmark"
        aria-hidden="true"
      ></i>
    </button>

    <div
      class="customer-service-icon"
      aria-hidden="true"
    >
      <i class="fa-solid fa-headset"></i>
    </div>

    <div class="customer-service-content">

      <strong>
        Need help planning your event?
      </strong>

      <p>
        Call or text Sen Party Rentals for
        availability, pricing and rental
        recommendations.
      </p>

      <div class="customer-service-actions">

        <a
          href="tel:${SEN_PARTY_RENTALS.phoneLink}"
          class="customer-service-call"
        >
          <i
            class="fa-solid fa-phone"
            aria-hidden="true"
          ></i>

          <span>Call</span>
        </a>

        <a
          href="sms:${SEN_PARTY_RENTALS.phoneLink}"
          class="customer-service-text"
        >
          <i
            class="fa-solid fa-comment-dots"
            aria-hidden="true"
          ></i>

          <span>Text</span>
        </a>

      </div>

    </div>
  `;

  document.body.appendChild(
    widget
  );

  const closeButton =
    widget.querySelector(
      ".customer-service-close"
    );

  const storageAvailable =
    safelyUseSessionStorage();

  const wasClosed =
    storageAvailable &&
    window.sessionStorage.getItem(
      "customerServiceClosed"
    ) === "true";

  if (wasClosed) {
    widget.classList.add(
      "closed"
    );

    return;
  }

  closeButton?.addEventListener(
    "click",
    () => {
      widget.classList.remove(
        "show"
      );

      widget.classList.add(
        "closed"
      );

      if (storageAvailable) {
        window.sessionStorage.setItem(
          "customerServiceClosed",
          "true"
        );
      }
    }
  );

  window.setTimeout(
    () => {
      if (
        !widget.classList.contains(
          "closed"
        )
      ) {
        widget.classList.add(
          "show"
        );
      }
    },
    SEN_PARTY_RENTALS
      .customerServiceDelay
  );
}


/* =========================================================
   WEBSITE VISIT LOGGER
========================================================= */

function logWebsiteVisit() {
  const visitData = {
    visitedAt:
      new Date().toISOString(),

    page:
      getCurrentPageName(),

    path:
      window.location.pathname,

    title:
      document.title,

    referrer:
      document.referrer || "",

    language:
      navigator.language || ""
  };

  try {
    fetch(
      SEN_PARTY_RENTALS
        .visitLoggerUrl,
      {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },
        body:
          JSON.stringify(
            visitData
          )
      }
    ).catch(() => {
      /*
       * Logging failure must never
       * interrupt the website.
       */
    });
  } catch (error) {
    console.warn(
      "Website visit logger could not run.",
      error
    );
  }
}


/* =========================================================
   SERVICE WORKER
========================================================= */

function registerServiceWorker() {
  if (
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    return;
  }

  window.addEventListener(
    "load",
    async () => {
      try {
        const registration =
          await navigator
            .serviceWorker
            .register(
              "./service-worker.js"
            );

        console.log(
          "Service worker registered:",
          registration.scope
        );
      } catch (error) {
        console.warn(
          "Service worker registration failed:",
          error
        );
      }
    },
    {
      once: true
    }
  );
}


/* =========================================================
   INITIALIZE DYNAMIC PAGE FEATURES
========================================================= */

function initializeDynamicPageFeatures() {
  initializeSharedHeader();
  initializeSharedFooter();
  initializeFaqAccordions();
  initializeScrollReveal();
}


/* =========================================================
   INITIALIZE WEBSITE
========================================================= */

async function initializeWebsite() {
  initializeBackToTop();

  const [
    headerLoaded,
    footerLoaded
  ] = await Promise.all([
    loadSharedComponent(
      "header",
      SEN_PARTY_RENTALS
        .headerPath
    ),

    loadSharedComponent(
      "footer",
      SEN_PARTY_RENTALS
        .footerPath
    )
  ]);

  /*
   * Initialize components after the
   * shared HTML has been inserted.
   */

  if (headerLoaded) {
    initializeSharedHeader();
  }

  if (footerLoaded) {
    initializeSharedFooter();
  }

  /*
   * Compatibility for pages where the
   * header or footer is written directly.
   */

  initializeDynamicPageFeatures();

  initializeCustomerServiceWidget();

  logWebsiteVisit();
}

let websiteInitializationPromise = null;

function startWebsite() {
  if (!websiteInitializationPromise) {
    websiteInitializationPromise =
      initializeWebsite();
  }

  return websiteInitializationPromise;
}


/* =========================================================
   START WEBSITE
========================================================= */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    startWebsite,
    {
      once: true
    }
  );
} else {
  startWebsite();
}

registerServiceWorker();
