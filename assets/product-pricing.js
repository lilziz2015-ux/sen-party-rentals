(() => {
  'use strict';
  if (!window.SenCatalog) return;
  const prices = [...document.querySelectorAll('[data-catalog-price]')];
  if (!prices.length) return;
  window.SenCatalog.load().then(items => {
    const primary = items.find(item => new URL(window.SenCatalog.detailPage(item), location.href).pathname === location.pathname);
    if (primary) {
      document.querySelectorAll('script[type="application/ld+json"]').forEach(node => {
        try {
          const schema = JSON.parse(node.textContent);
          const products = schema["@graph"] || [schema];
          products.filter(value => value["@type"] === "Product").forEach(product => {
            const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
            offers.filter(Boolean).forEach(offer => {offer.price = String(primary.price);});
          });
          node.textContent = JSON.stringify(schema);
        } catch {}
      });
    }
    for (const node of prices) {
      const item = items.find(item => String(item.slug).trim() === node.dataset.catalogPrice);
      if (!item) continue;
      const amount = Number(item.price);
      if (!Number.isFinite(amount)) continue;
      node.textContent = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(amount) + ' per day';
      const description = document.querySelector('[data-product-description]');
      if (description && item.description) description.textContent = item.description;
    }
  }).catch(() => {/* The verified static price remains available while offline. */});
})();
