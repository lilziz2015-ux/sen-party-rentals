(() => {
  "use strict";

  const categorySlugs = Array.isArray(window.SEN_CATEGORY_SLUGS)
    ? window.SEN_CATEGORY_SLUGS.map(value => String(value).trim()).filter(Boolean)
    : [];

  if (!categorySlugs.length || !window.supabase) return;

  const url = "https://tuttkwpnicgfcyeptrkv.supabase.co";
  const key = "sb_publishable_-I_Yvq8T9nR0rYyS2Gaa8g_oykh__B1";
  const client = window.supabase.createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const detailPages = new Set([
    "modular-moonbounce-rental.html",
    "castle-fun-house-bounce-house-rental.html",
    "princess-castle-bounce-house-rental.html",
    "giant-flip-flop-water-slide-rental.html",
    "dino-splash-water-slide-rental.html",
    "wild-rapid-water-slide-rental.html",
    "big-wave-water-slide-rental.html",
    "tropical-thunder-water-slide-rental.html",
    "castle-combo-bounce-house-rental.html",
    "high-sky-combo-rental.html",
    "jurassic-combo-rental.html",
    "toxic-revenge-obstacle-course-rental.html",
    "black-opps-60ft-obstacle-course-rental.html",
    "60ft-backyard-extreme-obstacle-course-rental.html",
    "popcorn-machine-rental.html",
    "snow-cone-machine-rental.html"
  ]);

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeImage(value) {
    const source = String(value ?? "").trim();
    if (!source) return "";
    try {
      const parsed = new URL(source, window.location.href);
      return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
    } catch {
      return "";
    }
  }

  function safeDetail(value) {
    const path = String(value ?? "").trim().replace(/^\.\//, "");
    return detailPages.has(path) ? `./${path}` : "";
  }

  function card(item, categoryName) {
    const name = item.name || "Party Rental";
    const image = safeImage(item.image_url);
    const detail = safeDetail(item.product_page_url);
    const price = Number(item.price || 0);
    return `
      <article class="sen-live-card">
        <div class="sen-live-media">
          ${image
            ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async">`
            : `<div class="sen-live-placeholder" aria-hidden="true"><i class="fa-solid fa-image"></i></div>`}
          <span>${escapeHtml(categoryName)}</span>
        </div>
        <div class="sen-live-body">
          <h3>${escapeHtml(name)}</h3>
          <p>${escapeHtml(item.description || "Available for parties, schools, churches and community events.")}</p>
          <strong>${price > 0 ? `${money.format(price)} per day` : "Call for pricing"}</strong>
          <div class="sen-live-actions">
            ${detail ? `<a class="sen-live-secondary" href="${escapeHtml(detail)}">Details</a>` : ""}
            <a class="sen-live-primary" href="./booking.html?add=${encodeURIComponent(item.id)}">Book Now</a>
          </div>
        </div>
      </article>`;
  }

  function installStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .sen-live-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;width:100%}
      .sen-live-card{overflow:hidden;border:1px solid #e5e7eb;border-radius:20px;background:#fff;box-shadow:0 16px 40px rgba(17,24,39,.09)}
      .sen-live-media{position:relative;aspect-ratio:4/3;overflow:hidden;background:#f3f4f6}
      .sen-live-media img{width:100%;height:100%;display:block;object-fit:cover}
      .sen-live-media span{position:absolute;left:14px;bottom:14px;padding:7px 10px;border-radius:999px;color:#fff;background:#d90429;font-size:.72rem;font-weight:900}
      .sen-live-placeholder{height:100%;display:grid;place-items:center;color:#d90429;font-size:2rem}
      .sen-live-body{padding:20px}.sen-live-body h3{margin:0 0 10px;font-size:1.15rem}.sen-live-body p{min-height:3.2em;margin:0 0 14px;color:#6b7280;line-height:1.55}
      .sen-live-body>strong{display:block;margin-bottom:16px;color:#d90429;font-size:1.05rem}
      .sen-live-actions{display:flex;gap:10px;flex-wrap:wrap}.sen-live-actions a{min-height:43px;display:inline-flex;align-items:center;justify-content:center;padding:0 15px;border-radius:11px;font-weight:900;text-decoration:none}
      .sen-live-primary{color:#fff;background:linear-gradient(135deg,#970018,#d90429 58%,#ff6a00)}.sen-live-secondary{border:1px solid #d90429;color:#d90429;background:#fff}
      @media(max-width:900px){.sen-live-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px){.sen-live-grid{grid-template-columns:1fr}.sen-live-body p{min-height:0}}
    `;
    document.head.appendChild(style);
  }

  async function render() {
    const existingCards = [...document.querySelectorAll(".rental-card, .item-card")];
    const grids = [...new Set(existingCards.map(node => node.parentElement).filter(Boolean))];
    const target = grids[0];
    if (!target) return;

    const categoriesResult = await client
      .from("rental_categories")
      .select("id, name, slug")
      .in("slug", categorySlugs)
      .eq("active", true);
    if (categoriesResult.error) throw categoriesResult.error;

    const categories = categoriesResult.data || [];
    const categoryMap = new Map(categories.map(category => [String(category.id), category.name]));
    const ids = categories.map(category => category.id);
    if (!ids.length) return;

    const itemsResult = await client
      .from("rental_items")
      .select("id, category_id, name, description, price, image_url, product_page_url, sort_order")
      .in("category_id", ids)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (itemsResult.error) throw itemsResult.error;

    const items = itemsResult.data || [];
    if (!items.length) return;

    installStyles();
    target.className = "sen-live-grid";
    target.innerHTML = items
      .map(item => card(item, categoryMap.get(String(item.category_id)) || "Rental"))
      .join("");

    grids.slice(1).forEach(grid => {
      const section = grid.closest("section");
      if (section && !section.contains(target)) {
        section.hidden = true;
      } else {
        grid.hidden = true;
      }
    });
  }

  render().catch(error => {
    console.error("Category inventory could not be loaded:", error);
  });
})();
