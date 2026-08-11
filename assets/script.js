"use strict";

/* =========================================================
   SEN PARTY RENTALS — SHARED WEBSITE JAVASCRIPT
   File: assets/script.js
   Version: 45
========================================================= */


/* =========================================================
   WEBSITE SETTINGS
========================================================= */

const SEN_PARTY_RENTALS = {
  phoneDisplay: "571-719-9575",
  phoneLink: "+15717199575",
  email: "senmoonbounce@gmail.com",

  headerPath: "./header.html",
  footerPath: "./footer.html",

  /*
   * Must match style.css hamburger breakpoint.
   */
  mobileBreakpoint: 1250,

  customerServiceDelay: 1800,

  visitLoggerUrl:
    "https://script.google.com/macros/s/" +
    "AKfycbwQAb348VKG0bBwpXeK86n3SKRPhLnIsH0quc99n0omWEWG1ciljlfD1lkPgms7sTPm/" +
    "exec",

  serviceWorkerPath:
    "./service-worker.js"
};


/* =========================================================
   HELPERS
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


function debounce(callback, delay = 120) {
  let timer;

  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(
      () => callback(...args),
      delay
    );
  };
}


function getCurrentPageName() {
  const pathname =
    window.location.pathname;

  const page =
    pathname
      .split("/")
      .filter(Boolean)
      .pop();

  return page || "index.html";
}


function normalizePageHref(href) {
  if (!href) {
    return "";
  }

  try {
    const url =
      new URL(
        href,
        window.location.href
      );

    return (
      url.pathname
        .split("/")
        .filter(Boolean)
        .pop() ||
      "index.html"
    );
  } catch {
    return String(href)
      .replace("./", "")
      .split("?")[0]
      .split("#")[0];
  }
}


function safelyUseSessionStorage() {
  try {
    const key =
      "__sen_test__";

    sessionStorage.setItem(
      key,
      "1"
    );

    sessionStorage.removeItem(
      key
    );

    return true;
  } catch {
    return false;
  }
}


/* =========================================================
   SHARED HEADER / FOOTER LOADER
========================================================= */

async function loadSharedComponent(
  elementId,
  filePath
) {
  const container =
    document.getElementById(
      elementId
    );

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
   * Do not replace content already loaded
   * by another page script.
   */
  if (
    container.innerHTML.trim().length > 20
  ) {
    container.dataset.componentLoaded =
      "true";

    return true;
  }

  try {
    const response =
      await fetch(
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
        `${filePath} returned ${response.status}`
      );
    }

    const html =
      await response.text();

    if (!html.trim()) {
      throw new Error(
        `${filePath} is empty`
      );
    }

    container.innerHTML =
      html;

    container.dataset.componentLoaded =
      "true";

    return true;

  } catch (error) {

    console.warn(
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
    ) ||
    document.querySelector(
      ".site-header"
    );

  if (!header) {
    return;
  }


  const nav =
    document.getElementById(
      "main-nav"
    ) ||
    header.querySelector(
      ".header-nav"
    );


  const navToggle =
    document.getElementById(
      "nav-toggle"
    ) ||
    header.querySelector(
      ".header-menu-toggle"
    );


  if (
    !nav ||
    !navToggle
  ) {
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


  const dropdowns =
    Array.from(
      header.querySelectorAll(
        ".header-dropdown"
      )
    );


  const navLinks =
    Array.from(
      header.querySelectorAll(
        ".header-nav-link, " +
        ".header-dropdown-menu a"
      )
    );


  /* =======================================================
     MENU OPEN / CLOSE
  ======================================================== */

  function setMenuState(isOpen) {

    nav.classList.toggle(
      "open",
      isOpen
    );

    navToggle.classList.toggle(
      "active",
      isOpen
    );


    /*
     * Compatibility with older CSS.
     */
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

    dropdowns.forEach(
      dropdown => {

        dropdown.classList.remove(
          "open",
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
      }
    );
  }


  function closeMenu() {
    setMenuState(false);
    closeDropdowns();
  }


  function toggleMenu() {

    const open =
      nav.classList.contains(
        "open"
      ) ||
      nav.classList.contains(
        "is-open"
      );


    setMenuState(
      !open
    );
  }


  /* =======================================================
     THREE-BAR HAMBURGER
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

  dropdowns.forEach(
    dropdown => {

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

          if (
            !isMobileNavigation()
          ) {
            return;
          }


          event.preventDefault();
          event.stopPropagation();


          const currentlyOpen =
            dropdown.classList.contains(
              "open"
            ) ||
            dropdown.classList.contains(
              "is-open"
            );


          dropdowns.forEach(
            otherDropdown => {

              if (
                otherDropdown ===
                dropdown
              ) {
                return;
              }


              otherDropdown.classList.remove(
                "open",
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
            "open",
            !currentlyOpen
          );


          dropdown.classList.toggle(
            "is-open",
            !currentlyOpen
          );


          button.setAttribute(
            "aria-expanded",
            String(
              !currentlyOpen
            )
          );
        }
      );
    }
  );


  /* =======================================================
     ACTIVE PAGE
  ======================================================== */

  const currentPage =
    getCurrentPageName();


  navLinks.forEach(
    link => {

      const linkPage =
        normalizePageHref(
          link.getAttribute(
            "href"
          )
        );


      const isCurrent =
        linkPage ===
        currentPage;


      link.classList.toggle(
        "active",
        isCurrent
      );


      link.classList.toggle(
        "is-active",
        isCurrent
      );


      if (isCurrent) {

        link.setAttribute(
          "aria-current",
          "page"
        );


        const parentDropdown =
          link.closest(
            ".header-dropdown"
          );


        parentDropdown
          ?.classList
          .add(
            "active",
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

          if (
            isMobileNavigation()
          ) {
            closeMenu();
          }
        }
      );
    }
  );


  /* =======================================================
     CLICK OUTSIDE
  ======================================================== */

  document.addEventListener(
    "click",
    event => {

      const menuOpen =
        nav.classList.contains(
          "open"
        ) ||
        nav.classList.contains(
          "is-open"
        );


      if (
        menuOpen &&
        !header.contains(
          event.target
        )
      ) {
        closeMenu();
      }
    }
  );


  /* =======================================================
     ESCAPE
  ======================================================== */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }


      closeMenu();
    }
  );


  /* =======================================================
     RESIZE
  ======================================================== */

  const handleResize =
    debounce(
      () => {

        if (
          !isMobileNavigation()
        ) {
          closeMenu();
        }

      },
      120
    );


  window.addEventListener(
    "resize",
    handleResize
  );


  /* =======================================================
     HEADER SCROLL
  ======================================================== */

  function updateHeaderScroll() {

    const scrolled =
      window.scrollY > 40;


    header.classList.toggle(
      "scrolled",
      scrolled
    );


    header.classList.toggle(
      "is-scrolled",
      scrolled
    );
  }


  updateHeaderScroll();


  window.addEventListener(
    "scroll",
    updateHeaderScroll,
    {
      passive: true
    }
  );
}


/* =========================================================
   INVENTORY FALLBACK MOBILE MENU
========================================================= */

function initializeInventoryFallbackMenu() {

  const button =
    document.getElementById(
      "inventoryMobileMenuButton"
    );


  const drawer =
    document.getElementById(
      "inventoryMobileDrawer"
    );


  const overlay =
    document.getElementById(
      "inventoryMobileOverlay"
    );


  if (
    !button ||
    !drawer
  ) {
    return;
  }


  if (
    button.dataset.initialized ===
    "true"
  ) {
    return;
  }


  button.dataset.initialized =
    "true";


  function setOpen(isOpen) {

    button.classList.toggle(
      "active",
      isOpen
    );


    drawer.classList.toggle(
      "open",
      isOpen
    );


    overlay?.classList.toggle(
      "open",
      isOpen
    );


    button.setAttribute(
      "aria-expanded",
      String(isOpen)
    );


    button.setAttribute(
      "aria-label",
      isOpen
        ? "Close navigation menu"
        : "Open navigation menu"
    );


    overlay?.setAttribute(
      "aria-hidden",
      String(!isOpen)
    );


    document.body.classList.toggle(
      "menu-open",
      isOpen
    );
  }


  button.addEventListener(
    "click",
    () => {

      const isOpen =
        drawer.classList.contains(
          "open"
        );


      setOpen(
        !isOpen
      );
    }
  );


  overlay?.addEventListener(
    "click",
    () => {
      setOpen(false);
    }
  );


  drawer.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          "a"
        )
      ) {
        setOpen(false);
      }
    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    }
  );
}


/* =========================================================
   FOOTER
========================================================= */

function initializeSharedFooter() {

  document
    .querySelectorAll(
      "[data-footer-year], " +
      "#footerCurrentYear, " +
      "#inventoryYear, " +
      "#year"
    )
    .forEach(
      element => {

        element.textContent =
          String(
            new Date()
              .getFullYear()
          );
      }
    );


  const footer =
    document.getElementById(
      "site-footer"
    ) ||
    document.querySelector(
      ".site-footer"
    );


  if (!footer) {
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
    document.documentElement
      .dataset
      .backToTopInitialized ===
    "true"
  ) {
    return;
  }


  document.documentElement
    .dataset
    .backToTopInitialized =
    "true";


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          ".back-to-top, " +
          "#footerBackToTop, " +
          "[data-footer-back-to-top]"
        );


      if (!button) {
        return;
      }


      event.preventDefault();


      window.scrollTo({
        top: 0,

        behavior:
          prefersReducedMotion()
            ? "auto"
            : "smooth"
      });
    }
  );
}


/* =========================================================
   HOME HERO SLIDER
========================================================= */

function initializeHomeHeroSlider() {

  const slider =
    document.querySelector(
      ".home-hero-slider"
    );


  if (!slider) {
    return;
  }


  if (
    slider.dataset.initialized ===
    "true"
  ) {
    return;
  }


  const slides =
    Array.from(
      slider.querySelectorAll(
        ".home-hero-slide"
      )
    );


  if (!slides.length) {
    return;
  }


  slider.dataset.initialized =
    "true";


  const previous =
    document.querySelector(
      ".home-slider-prev"
    );


  const next =
    document.querySelector(
      ".home-slider-next"
    );


  const dots =
    Array.from(
      document.querySelectorAll(
        ".home-slider-dot"
      )
    );


  let currentIndex =
    slides.findIndex(
      slide =>
        slide.classList.contains(
          "active"
        )
    );


  if (
    currentIndex < 0
  ) {
    currentIndex = 0;
  }


  let timer = null;


  function showSlide(index) {

    currentIndex =
      (
        index +
        slides.length
      ) %
      slides.length;


    slides.forEach(
      (
        slide,
        slideIndex
      ) => {

        const active =
          slideIndex ===
          currentIndex;


        slide.classList.toggle(
          "active",
          active
        );


        slide.setAttribute(
          "aria-hidden",
          String(!active)
        );
      }
    );


    dots.forEach(
      (
        dot,
        dotIndex
      ) => {

        dot.classList.toggle(
          "active",
          dotIndex ===
            currentIndex
        );
      }
    );
  }


  function stopSlider() {

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }


  function startSlider() {

    if (
      prefersReducedMotion() ||
      slides.length < 2
    ) {
      return;
    }


    stopSlider();


    timer =
      setInterval(
        () => {

          showSlide(
            currentIndex + 1
          );

        },
        6500
      );
  }


  previous?.addEventListener(
    "click",
    () => {

      showSlide(
        currentIndex - 1
      );

      startSlider();
    }
  );


  next?.addEventListener(
    "click",
    () => {

      showSlide(
        currentIndex + 1
      );

      startSlider();
    }
  );


  dots.forEach(
    (
      dot,
      index
    ) => {

      dot.addEventListener(
        "click",
        () => {

          showSlide(index);

          startSlider();
        }
      );
    }
  );


  slider.addEventListener(
    "mouseenter",
    stopSlider
  );


  slider.addEventListener(
    "mouseleave",
    startSlider
  );


  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.hidden
      ) {
        stopSlider();
      } else {
        startSlider();
      }
    }
  );


  showSlide(
    currentIndex
  );


  startSlider();
}


/* =========================================================
   FAQ
========================================================= */

function initializeFaqAccordions() {

  const buttons =
    document.querySelectorAll(
      ".home-faq-question, " +
      ".faq-question, " +
      ".faq-q"
    );


  buttons.forEach(
    button => {

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
              ".home-faq-item, " +
              ".faq-item"
            );


          if (!item) {
            return;
          }


          const open =
            item.classList.contains(
              "open"
            ) ||
            item.classList.contains(
              "active"
            );


          const parent =
            item.parentElement ||
            document;


          parent
            .querySelectorAll(
              ".home-faq-item.open, " +
              ".faq-item.open, " +
              ".faq-item.active"
            )
            .forEach(
              other => {

                if (
                  other === item
                ) {
                  return;
                }


                other.classList.remove(
                  "open",
                  "active"
                );


                other
                  .querySelector(
                    ".home-faq-question, " +
                    ".faq-question, " +
                    ".faq-q"
                  )
                  ?.setAttribute(
                    "aria-expanded",
                    "false"
                  );
              }
            );


          item.classList.toggle(
            "open",
            !open
          );


          item.classList.toggle(
            "active",
            !open
          );


          button.setAttribute(
            "aria-expanded",
            String(!open)
          );
        }
      );
    }
  );
}


/* =========================================================
   SCROLL REVEAL
========================================================= */

function initializeScrollReveal() {

  const elements =
    document.querySelectorAll(
      ".reveal"
    );


  if (!elements.length) {
    return;
  }


  if (
    prefersReducedMotion() ||
    !(
      "IntersectionObserver" in
      window
    )
  ) {

    elements.forEach(
      element => {

        element.classList.add(
          "visible"
        );
      }
    );

    return;
  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

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
          }
        );
      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -40px 0px"
      }
    );


  elements.forEach(
    element => {
      observer.observe(element);
    }
  );
}


/* =========================================================
   GALLERY LIGHTBOX
========================================================= */

function initializeLightbox() {

  const lightbox =
    document.querySelector(
      ".lightbox"
    );


  const content =
    document.getElementById(
      "lightbox-content"
    );


  if (
    !lightbox ||
    !content
  ) {
    return;
  }


  if (
    lightbox.dataset.initialized ===
    "true"
  ) {
    return;
  }


  lightbox.dataset.initialized =
    "true";


  function closeLightbox() {

    lightbox.classList.remove(
      "active"
    );


    lightbox.setAttribute(
      "aria-hidden",
      "true"
    );


    content.innerHTML =
      "";


    document.body.classList.remove(
      "modal-open"
    );
  }


  document.addEventListener(
    "click",
    event => {

      const image =
        event.target.closest(
          ".gallery-item img, " +
          "[data-lightbox-src]"
        );


      if (!image) {
        return;
      }


      const src =
        image.dataset.lightboxSrc ||
        image.currentSrc ||
        image.src;


      if (!src) {
        return;
      }


      const newImage =
        document.createElement(
          "img"
        );


      newImage.src =
        src;


      newImage.alt =
        image.alt ||
        "Sen Party Rentals image";


      content.replaceChildren(
        newImage
      );


      lightbox.classList.add(
        "active"
      );


      lightbox.setAttribute(
        "aria-hidden",
        "false"
      );


      document.body.classList.add(
        "modal-open"
      );
    }
  );


  lightbox
    .querySelector(
      ".lightbox-close"
    )
    ?.addEventListener(
      "click",
      closeLightbox
    );


  lightbox.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        lightbox
      ) {
        closeLightbox();
      }
    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {
        closeLightbox();
      }
    }
  );
}


/* =========================================================
   THUMBNAIL GALLERIES
========================================================= */

function initializeThumbnailGalleries() {

  document
    .querySelectorAll(
      ".gallery-view"
    )
    .forEach(
      gallery => {

        if (
          gallery.dataset.initialized ===
          "true"
        ) {
          return;
        }


        const mainImage =
          gallery.querySelector(
            ".main-img"
          );


        if (!mainImage) {
          return;
        }


        gallery.dataset.initialized =
          "true";


        gallery.addEventListener(
          "click",
          event => {

            const thumbnail =
              event.target.closest(
                ".thumb-row img"
              );


            if (!thumbnail) {
              return;
            }


            mainImage.src =
              thumbnail.currentSrc ||
              thumbnail.src;


            if (
              thumbnail.alt
            ) {
              mainImage.alt =
                thumbnail.alt;
            }
          }
        );
      }
    );
}


/* =========================================================
   CUSTOMER SERVICE WIDGET
========================================================= */

function initializeCustomerServiceWidget() {

  /*
   * Prevent duplicate popup.
   */
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

          <span>
            Call
          </span>
        </a>


        <a
          href="sms:${SEN_PARTY_RENTALS.phoneLink}"
          class="customer-service-text"
        >
          <i
            class="fa-solid fa-comment-dots"
            aria-hidden="true"
          ></i>

          <span>
            Text
          </span>
        </a>

      </div>

    </div>
  `;


  document.body.appendChild(
    widget
  );


  const close =
    widget.querySelector(
      ".customer-service-close"
    );


  const storageAvailable =
    safelyUseSessionStorage();


  const closed =
    storageAvailable &&
    sessionStorage.getItem(
      "customerServiceClosed"
    ) === "true";


  if (closed) {

    widget.classList.add(
      "closed"
    );

    return;
  }


  close?.addEventListener(
    "click",
    () => {

      widget.classList.remove(
        "show"
      );


      widget.classList.add(
        "closed"
      );


      if (
        storageAvailable
      ) {

        sessionStorage.setItem(
          "customerServiceClosed",
          "true"
        );
      }
    }
  );


  setTimeout(
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
    SEN_PARTY_RENTALS.customerServiceDelay
  );
}


/* =========================================================
   EXTERNAL LINKS
========================================================= */

function initializeExternalLinks() {

  document
    .querySelectorAll(
      'a[target="_blank"]'
    )
    .forEach(
      link => {

        const existing =
          String(
            link.getAttribute(
              "rel"
            ) || ""
          )
            .split(/\s+/)
            .filter(Boolean);


        const values =
          new Set(existing);


        values.add(
          "noopener"
        );


        values.add(
          "noreferrer"
        );


        link.setAttribute(
          "rel",
          [...values].join(" ")
        );
      }
    );
}


/* =========================================================
   WEBSITE VISIT LOGGER
========================================================= */

function logWebsiteVisit() {

  if (
    window.__senPartyVisitLogged
  ) {
    return;
  }


  window.__senPartyVisitLogged =
    true;


  const data = {

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
      navigator.language || "",

    viewport:
      `${window.innerWidth}x${window.innerHeight}`
  };


  try {

    fetch(
      SEN_PARTY_RENTALS.visitLoggerUrl,
      {
        method: "POST",

        mode: "no-cors",

        keepalive: true,

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(data)
      }
    ).catch(
      () => {}
    );

  } catch (error) {

    console.warn(
      "Visit logger failed:",
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


  /*
   * Don't attempt service worker
   * registration from file:// preview.
   */
  if (
    window.location.protocol ===
    "file:"
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
              SEN_PARTY_RENTALS
                .serviceWorkerPath
            );


        console.info(
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
   INITIALIZE DYNAMIC FEATURES
========================================================= */

function initializeDynamicPageFeatures() {

  initializeSharedHeader();

  initializeInventoryFallbackMenu();

  initializeSharedFooter();

  initializeBackToTop();

  initializeHomeHeroSlider();

  initializeFaqAccordions();

  initializeScrollReveal();

  initializeLightbox();

  initializeThumbnailGalleries();

  initializeExternalLinks();
}


/* =========================================================
   INITIALIZE WEBSITE
========================================================= */

async function initializeWebsite() {

  initializeBackToTop();


  const results =
    await Promise.allSettled([
      loadSharedComponent(
        "header",
        SEN_PARTY_RENTALS.headerPath
      ),

      loadSharedComponent(
        "footer",
        SEN_PARTY_RENTALS.footerPath
      )
    ]);


  /*
   * Header/footer have now either loaded
   * or safely failed.
   */
  initializeDynamicPageFeatures();


  initializeCustomerServiceWidget();


  logWebsiteVisit();
}


/* =========================================================
   WATCH FOR HEADER / FOOTER INSERTION
========================================================= */

function initializeMutationObserver() {

  if (
    !(
      "MutationObserver" in
      window
    )
  ) {
    return;
  }


  const observer =
    new MutationObserver(
      mutations => {

        let shouldCheck =
          false;


        for (
          const mutation of
          mutations
        ) {

          if (
            mutation.addedNodes.length
          ) {

            shouldCheck =
              true;

            break;
          }
        }


        if (!shouldCheck) {
          return;
        }


        initializeSharedHeader();

        initializeInventoryFallbackMenu();

        initializeSharedFooter();

        initializeFaqAccordions();

        initializeThumbnailGalleries();
      }
    );


  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );
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
    initializeWebsite,
    {
      once: true
    }
  );

} else {

  initializeWebsite();
}


initializeMutationObserver();

registerServiceWorker();