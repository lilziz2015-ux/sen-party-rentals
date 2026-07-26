document.addEventListener("DOMContentLoaded", () => {
  /*
   * Dynamic footer year
   */
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  /*
   * Mobile navigation
   */
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");

      toggle.setAttribute(
        "aria-expanded",
        String(open)
      );

      toggle.setAttribute(
        "aria-label",
        open ? "Close menu" : "Open menu"
      );
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");

        toggle.setAttribute(
          "aria-expanded",
          "false"
        );

        toggle.setAttribute(
          "aria-label",
          "Open menu"
        );
      });
    });
  }

  /*
   * FAQ accordion
   */
  const faqButtons =
    document.querySelectorAll(".faq-question");

  faqButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");

      if (!item) {
        return;
      }

      const wasOpen =
        item.classList.contains("open");

      document
        .querySelectorAll(".faq-item")
        .forEach((otherItem) => {
          otherItem.classList.remove("open");

          const otherButton =
            otherItem.querySelector(".faq-question");

          if (otherButton) {
            otherButton.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        });

      if (!wasOpen) {
        item.classList.add("open");

        button.setAttribute(
          "aria-expanded",
          "true"
        );
      }
    });
  });

  /*
   * Scroll reveal animation
   */
  const revealItems =
    document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    revealItems.forEach((item) => {
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => {
      item.classList.add("visible");
    });
  }

  /*
   * Website visit logger
   */
  try {
    const scriptURL =
      "https://script.google.com/macros/s/AKfycbwQAb348VKG0bBwpXeK86n3SKRPhLnIsH0quc99n0omWEWG1ciljlfD1lkPgms7sTPm/exec";

    const visitData = {
      visitedAt: new Date().toISOString(),
      page: "home"
    };

    fetch(scriptURL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },
      body: JSON.stringify(visitData)
    }).catch(() => {
      /*
       * Visit logging should never stop
       * the website from working.
       */
    });
  } catch (error) {
    console.warn(
      "Visit logger could not run.",
      error
    );
  }
});
async function loadComponent(id, file) {
    const element = document.getElementById(id);

    if (!element) return;

    const response = await fetch(file);
    element.innerHTML = await response.text();
}

loadComponent("header", "header.html");
loadComponent("footer", "footer.html");

document.getElementById("year").textContent =
new Date().getFullYear();
document.addEventListener("DOMContentLoaded", function () {
  loadSharedFile("header", "header.html", function () {
    initializeWebsiteHeader();
  });

  loadSharedFile("footer", "footer.html");
});

function loadSharedFile(elementId, fileName, callback) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  fetch(fileName)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(
          "Unable to load " + fileName
        );
      }

      return response.text();
    })
    .then(function (html) {
      element.innerHTML = html;

      if (typeof callback === "function") {
        callback();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}/* =========================================================
   SHARED FOOTER
========================================================= */

function initializeWebsiteFooter() {
  const currentYear =
    document.getElementById("footerCurrentYear");

  const backToTopButton =
    document.getElementById("footerBackToTop");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }

  backToTopButton?.addEventListener(
    "click",
    function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  );
}document.addEventListener("DOMContentLoaded", function () {

  const headerPlaceholder = document.getElementById("header");

  if (headerPlaceholder) {

    fetch("header.html")
      .then(function (response) {

        if (!response.ok) {
          throw new Error("The shared header could not be loaded.");
        }

        return response.text();

      })
      .then(function (headerHTML) {

        headerPlaceholder.innerHTML = headerHTML;
        initializeSharedHeader();

      })
      .catch(function (error) {

        console.error(error);

      });

  } else {

    initializeSharedHeader();

  }

});

function initializeSharedHeader() {

  const header = document.getElementById("site-header");
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");
  const navLinks = document.querySelectorAll(".header-nav-link");

  if (!header) {
    return;
  }

  function closeMenu() {

    if (!navToggle || !mainNav) {
      return;
    }

    mainNav.classList.remove("open");
    navToggle.classList.remove("active");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");

    document.body.classList.remove("nav-open");

  }

  if (navToggle && mainNav) {

    navToggle.addEventListener("click", function () {

      const isOpen = mainNav.classList.toggle("open");

      navToggle.classList.toggle("active", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));

      navToggle.setAttribute(
        "aria-label",
        isOpen
          ? "Close navigation menu"
          : "Open navigation menu"
      );

      document.body.classList.toggle("nav-open", isOpen);

    });

  }

  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  navLinks.forEach(function (link) {

    const linkPage = link.getAttribute("href");

    if (linkPage === currentPage) {
      link.classList.add("active");
    }

    link.addEventListener("click", closeMenu);

  });

  document.addEventListener("click", function (event) {

    if (
      mainNav &&
      navToggle &&
      mainNav.classList.contains("open") &&
      !mainNav.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeMenu();
    }

  });

  window.addEventListener("resize", function () {

    if (window.innerWidth > 1050) {
      closeMenu();
    }

  });

  window.addEventListener("scroll", function () {

    header.classList.toggle(
      "scrolled",
      window.scrollY > 40
    );

  });

}
function initializeSharedHeader() {

  const header = document.getElementById("site-header");
  const nav = document.getElementById("main-nav");
  const navToggle = document.getElementById("nav-toggle");

  if (!header || !nav || !navToggle) {
    return;
  }

  const dropdowns = header.querySelectorAll(".header-dropdown");
  const pageLinks = header.querySelectorAll(
    ".header-nav-link, .header-dropdown-menu a"
  );

  function closeMenu() {

    nav.classList.remove("open");
    navToggle.classList.remove("active");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");

    document.body.classList.remove("nav-open");

    dropdowns.forEach(function (dropdown) {

      dropdown.classList.remove("open");

      const button = dropdown.querySelector(
        ".header-dropdown-toggle"
      );

      if (button) {
        button.setAttribute("aria-expanded", "false");
      }

    });

  }

  navToggle.addEventListener("click", function () {

    const isOpen = nav.classList.toggle("open");

    navToggle.classList.toggle("active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));

    navToggle.setAttribute(
      "aria-label",
      isOpen
        ? "Close navigation menu"
        : "Open navigation menu"
    );

    document.body.classList.toggle("nav-open", isOpen);

  });

  dropdowns.forEach(function (dropdown) {

    const button = dropdown.querySelector(
      ".header-dropdown-toggle"
    );

    if (!button) {
      return;
    }

    button.addEventListener("click", function () {

      if (window.innerWidth > 1120) {
        return;
      }

      const isOpen = dropdown.classList.toggle("open");

      button.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    });

  });

  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  pageLinks.forEach(function (link) {

    const linkPage = link.getAttribute("href");

    if (linkPage === currentPage) {
      link.classList.add("active");
    }

    link.addEventListener("click", closeMenu);

  });

  document.addEventListener("click", function (event) {

    if (
      nav.classList.contains("open") &&
      !nav.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeMenu();
    }

  });

  window.addEventListener("resize", function () {

    if (window.innerWidth > 1120) {
      closeMenu();
    }

  });

  function updateHeaderScrollState() {

    header.classList.toggle(
      "scrolled",
      window.scrollY > 40
    );

  }

  updateHeaderScrollState();

  window.addEventListener(
    "scroll",
    updateHeaderScrollState,
    { passive: true }
  );

}
function initializeSharedHeader() {

  const header = document.getElementById("site-header");
  const nav = document.getElementById("main-nav");
  const navToggle = document.getElementById("nav-toggle");
  const dropdown = document.querySelector(".header-dropdown");
  const dropdownToggle = document.querySelector(
    ".header-dropdown-toggle"
  );

  if (!header || !nav || !navToggle) {
    return;
  }

  function closeMenu() {

    nav.classList.remove("open");
    navToggle.classList.remove("active");

    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute(
      "aria-label",
      "Open navigation menu"
    );

    document.body.classList.remove("nav-open");

    if (dropdown && dropdownToggle) {
      dropdown.classList.remove("open");
      dropdownToggle.setAttribute("aria-expanded", "false");
    }

  }

  navToggle.addEventListener("click", function () {

    const isOpen = nav.classList.toggle("open");

    navToggle.classList.toggle("active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));

    navToggle.setAttribute(
      "aria-label",
      isOpen
        ? "Close navigation menu"
        : "Open navigation menu"
    );

    document.body.classList.toggle("nav-open", isOpen);

  });

  if (dropdown && dropdownToggle) {

    dropdownToggle.addEventListener("click", function () {

      if (window.innerWidth > 1080) {
        return;
      }

      const isOpen = dropdown.classList.toggle("open");

      dropdownToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    });

  }

  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  document
    .querySelectorAll(
      ".header-nav-link, .header-dropdown-menu a"
    )
    .forEach(function (link) {

      const linkPage = link.getAttribute("href");

      if (linkPage === currentPage) {
        link.classList.add("active");
      }

      link.addEventListener("click", closeMenu);

    });

  document.addEventListener("click", function (event) {

    if (
      nav.classList.contains("open") &&
      !nav.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeMenu();
    }

  });

  window.addEventListener("resize", function () {

    if (window.innerWidth > 1080) {
      closeMenu();
    }

  });

  function updateHeader() {

    header.classList.toggle(
      "scrolled",
      window.scrollY > 40
    );

  }

  updateHeader();

  window.addEventListener(
    "scroll",
    updateHeader,
    { passive: true }
  );

}/* =========================================================
   CUSTOMER SERVICE MESSAGE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  if (
    document.querySelector(
      ".customer-service-widget"
    )
  ) {
    return;
  }

  const widget =
    document.createElement("aside");

  widget.className =
    "customer-service-widget";

  widget.setAttribute(
    "aria-label",
    "Customer service"
  );

  widget.innerHTML = `
    <button
      type="button"
      class="customer-service-close"
      aria-label="Close customer service message"
    >
      <i class="fa-solid fa-xmark"></i>
    </button>

    <div class="customer-service-icon">
      <i class="fa-solid fa-headset"></i>
    </div>

    <div class="customer-service-content">
      <strong>
        Need help planning your event?
      </strong>

      <p>
        Call or text Sen Party Rentals.
        We are happy to help with availability,
        pricing and rental recommendations.
      </p>

      <div class="customer-service-actions">

        <a
          href="tel:+15717199575"
          class="customer-service-call"
        >
          <i class="fa-solid fa-phone"></i>
          Call
        </a>

        <a
          href="sms:+15717199575"
          class="customer-service-text"
        >
          <i class="fa-solid fa-comment-dots"></i>
          Text
        </a>

      </div>
    </div>
  `;

  document.body.appendChild(widget);

  const closeButton =
    widget.querySelector(
      ".customer-service-close"
    );

  closeButton.addEventListener(
    "click",
    function () {

      widget.classList.add("closed");

      window.sessionStorage.setItem(
        "customerServiceClosed",
        "true"
      );

    }
  );

  const wasClosed =
    window.sessionStorage.getItem(
      "customerServiceClosed"
    );

  if (wasClosed === "true") {
    widget.classList.add("closed");
    return;
  }

  window.setTimeout(function () {

    widget.classList.add("show");

  }, 1800);

});/* =========================================================
   SERVICE WORKER REGISTRATION
========================================================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/"
        }
      );

      console.log(
        "Sen Party Rentals service worker registered:",
        registration.scope
      );
    } catch (error) {
      console.error(
        "Service worker registration failed:",
        error
      );
    }
  });
}