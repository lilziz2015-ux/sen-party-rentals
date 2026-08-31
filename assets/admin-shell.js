(() => {
  "use strict";

  if (document.body.dataset.adminShellReady === "true") return;
  document.body.dataset.adminShellReady = "true";

  const links = [
    ["Dashboard", "./admin.html", "fa-chart-line", "admin.html"],
    ["Bookings", "./admin.html#bookings", "fa-calendar-check", "bookings"],
    ["Calendar", "./admin-calendar.html", "fa-calendar-days", "admin-calendar.html"],
    ["Customers", "./admin-customers.html", "fa-users", "admin-customers.html"],
    ["Payments", "./admin-payments.html", "fa-credit-card", "admin-payments.html"],
    ["Workers", "./admin-drivers.html", "fa-id-card", "admin-drivers.html"],
    ["Deliveries", "./admin-deliveries.html", "fa-truck", "admin-deliveries.html"],
    ["Inventory", "./admin-inventory.html", "fa-boxes-stacked", "admin-inventory.html"],
    ["Invoices", "./admin-invoices.html", "fa-file-invoice-dollar", "admin-invoices.html"],
    ["Reports", "./admin-reports.html", "fa-chart-column", "admin-reports.html"],
    ["Settings", "./admin-settings.html", "fa-gear", "admin-settings.html"]
  ];

  const path = location.pathname.split("/").pop() || "admin.html";
  const overlay = document.createElement("div");
  const drawer = document.createElement("aside");
  const button = document.createElement("button");

  overlay.className = "admin-shell-overlay";
  overlay.setAttribute("aria-hidden", "true");
  drawer.className = "admin-shell-drawer";
  drawer.id = "admin-shell-drawer";
  drawer.setAttribute("aria-label", "Admin navigation");
  drawer.setAttribute("aria-hidden", "true");
  button.className = "admin-shell-menu-button";
  button.type = "button";
  button.setAttribute("aria-label", "Open admin menu");
  button.setAttribute("aria-controls", drawer.id);
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';

  drawer.innerHTML = `
    <div class="admin-shell-head">
      <div class="admin-shell-mark"><i class="fa-solid fa-tent" aria-hidden="true"></i></div>
      <div class="admin-shell-brand"><strong>Sen Party Rentals</strong><small>Admin Control Center</small></div>
      <button class="admin-shell-close" type="button" aria-label="Close admin menu"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
    </div>
    <nav class="admin-shell-nav" aria-label="Admin pages">
      ${links.map(([label, href, icon, key]) => {
        const active = key === "bookings" ? false : path === key;
        return `<a href="${href}"${active ? ' class="is-active" aria-current="page"' : ""}><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span></a>`;
      }).join("")}
    </nav>
    <div class="admin-shell-footer">
      <a class="admin-shell-website" href="./index.html" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>View Website</a>
      <button class="admin-shell-signout" type="button"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>Sign Out</button>
    </div>`;

  const buttonHost = document.querySelector(".topbar-left") || document.querySelector(".topbar") || document.body;
  buttonHost.prepend(button);
  document.body.append(overlay, drawer);

  const closeButton = drawer.querySelector(".admin-shell-close");
  const signoutButton = drawer.querySelector(".admin-shell-signout");
  let lastFocused = null;

  function openMenu() {
    lastFocused = document.activeElement;
    overlay.classList.add("is-open");
    drawer.classList.add("is-open");
    document.documentElement.classList.add("admin-shell-menu-open");
    document.body.classList.add("admin-shell-menu-open");
    overlay.setAttribute("aria-hidden", "false");
    drawer.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
    closeButton.focus();
  }

  function closeMenu() {
    overlay.classList.remove("is-open");
    drawer.classList.remove("is-open");
    document.documentElement.classList.remove("admin-shell-menu-open");
    document.body.classList.remove("admin-shell-menu-open");
    overlay.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-hidden", "true");
    button.setAttribute("aria-expanded", "false");
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  button.addEventListener("click", openMenu);
  closeButton.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
  drawer.addEventListener("click", event => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) closeMenu();
  });

  signoutButton.addEventListener("click", async () => {
    signoutButton.disabled = true;
    signoutButton.textContent = "Signing out…";
    try {
      if (window.supabase) {
        const client = window.supabase.createClient(
          "https://tuttkwpnicgfcyeptrkv.supabase.co",
          "sb_publishable_-I_Yvq8T9nR0rYyS2Gaa8g_oykh__B1",
          { auth: { persistSession: true, storageKey: "sen-party-rentals-auth" } }
        );
        await client.auth.signOut({ scope: "local" });
      }
    } finally {
      location.replace("./admin-login.html");
    }
  });
})();
