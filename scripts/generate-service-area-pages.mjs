import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const newAreas = [
  ["Dale City", "dale-city", "VA", "Virginia", ["Woodbridge", "Lake Ridge", "Montclair", "Dumfries"]],
  ["Lake Ridge", "lake-ridge", "VA", "Virginia", ["Woodbridge", "Dale City", "Occoquan", "Lorton"]],
  ["Dumfries", "dumfries", "VA", "Virginia", ["Montclair", "Triangle", "Woodbridge", "Stafford"]],
  ["Montclair", "montclair", "VA", "Virginia", ["Dumfries", "Dale City", "Woodbridge", "Triangle"]],
  ["Triangle", "triangle", "VA", "Virginia", ["Dumfries", "Quantico", "Stafford", "Montclair"]],
  ["Nokesville", "nokesville", "VA", "Virginia", ["Bristow", "Manassas", "Gainesville", "Warrenton"]],
  ["Bristow", "bristow", "VA", "Virginia", ["Nokesville", "Gainesville", "Manassas", "Haymarket"]],
  ["Fairfax Station", "fairfax-station", "VA", "Virginia", ["Fairfax", "Burke", "Lorton", "Springfield"]],
  ["Burke", "burke", "VA", "Virginia", ["Fairfax Station", "Springfield", "Fairfax", "Lorton"]],
  ["Springfield", "springfield", "VA", "Virginia", ["Burke", "Lorton", "Annandale", "Alexandria"]],
  ["Lorton", "lorton", "VA", "Virginia", ["Springfield", "Burke", "Fairfax Station", "Woodbridge"]],
  ["Annandale", "annandale", "VA", "Virginia", ["Falls Church", "Springfield", "Fairfax", "Alexandria"]],
  ["Oakton", "oakton", "VA", "Virginia", ["Vienna", "Fairfax", "Reston", "McLean"]],
  ["Ashburn", "ashburn", "VA", "Virginia", ["Sterling", "Leesburg", "Herndon", "South Riding"]],
  ["Aldie", "aldie", "VA", "Virginia", ["South Riding", "Haymarket", "Gainesville", "Leesburg"]],
  ["South Riding", "south-riding", "VA", "Virginia", ["Aldie", "Chantilly", "Ashburn", "Centreville"]],
  ["Alexandria", "alexandria", "VA", "Virginia", ["Arlington", "Springfield", "Annandale", "Falls Church"]],
  ["Arlington", "arlington", "VA", "Virginia", ["Alexandria", "Falls Church", "McLean", "Washington, D.C."]],
  ["Falls Church", "falls-church", "VA", "Virginia", ["Arlington", "Annandale", "McLean", "Vienna"]],
  ["McLean", "mclean", "VA", "Virginia", ["Falls Church", "Vienna", "Arlington", "Bethesda"]],
  ["Stafford", "stafford", "VA", "Virginia", ["Fredericksburg", "Triangle", "Dumfries", "Woodbridge"]],
  ["Fredericksburg", "fredericksburg", "VA", "Virginia", ["Stafford", "Warrenton", "Triangle", "Dumfries"]],
  ["Bethesda", "bethesda", "MD", "Maryland", ["Silver Spring", "McLean", "Washington, D.C.", "Arlington"]],
  ["Silver Spring", "silver-spring", "MD", "Maryland", ["Bethesda", "Washington, D.C.", "McLean", "Arlington"]]
].map(([city, slug, stateCode, stateName, nearby]) => ({ city, slug, stateCode, stateName, nearby }));

const existingAreas = [
  ["Manassas", "manassas", "VA"], ["Manassas Park", "manassas-park", "VA"],
  ["Woodbridge", "woodbridge", "VA"], ["Gainesville", "gainesville", "VA"],
  ["Haymarket", "haymarket", "VA"], ["Warrenton", "warrenton", "VA"],
  ["Centreville", "centreville", "VA"], ["Chantilly", "chantilly", "VA"],
  ["Fairfax", "fairfax", "VA"], ["Vienna", "vienna", "VA"],
  ["Reston", "reston", "VA"], ["Herndon", "herndon", "VA"],
  ["Sterling", "sterling", "VA"], ["Leesburg", "leesburg", "VA"],
  ["Washington, D.C.", "washington", "DC"]
].map(([city, slug, stateCode]) => ({ city, slug, stateCode }));

const allAreas = [...existingAreas, ...newAreas];
const byCity = new Map(allAreas.map(area => [area.city, area]));
const pageName = area => `party-rentals-${area.slug}-${area.stateCode.toLowerCase()}.html`;
const escapeHtml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function nearbyLinks(area) {
  return area.nearby.map(city => {
    const nearby = byCity.get(city);
    return nearby
      ? `<a href="./${pageName(nearby)}">${escapeHtml(city)}</a>`
      : `<a href="./service-areas.html">${escapeHtml(city)}</a>`;
  }).join("");
}

function page(area) {
  const { city, stateCode, stateName } = area;
  const file = pageName(area);
  const canonical = `https://www.senmoonbounce.com/${file}`;
  const location = `${city}, ${stateCode}`;
  const escapedCity = escapeHtml(city);
  const escapedLocation = escapeHtml(location);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Party Rentals in ${escapedLocation} | Bounce Houses &amp; Water Slides</title>
  <meta name="description" content="Party rentals in ${escapedLocation} from Sen Party Rentals. Browse bounce houses, water slides, obstacle courses, dunk tanks, tables, chairs, generators and concessions. Call 571-719-9575.">
  <meta name="author" content="Sen Party Rentals">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#d90429">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="./logo.jpeg" sizes="any">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com">
  <link rel="stylesheet" href="./assets/style.css?v=54">
  <link rel="stylesheet" href="./assets/header.css?v=54">
  <link rel="stylesheet" href="./assets/footer.css?v=54">
  <link rel="stylesheet" href="./assets/service-area.css?v=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Party Rentals in ${escapedLocation} | Sen Party Rentals">
  <meta property="og:description" content="Bounce houses, water slides and event equipment delivered in ${escapedCity}, ${stateName} based on availability.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Sen Party Rentals">
  <meta property="og:image" content="https://www.senmoonbounce.com/childrenenjoy.PNG">
  <meta property="og:image:alt" content="Children enjoying an inflatable from Sen Party Rentals">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Party Rentals in ${escapedLocation} | Sen Party Rentals">
  <meta name="twitter:description" content="Bounce houses, water slides and event equipment delivered in ${escapedCity}.">
  <meta name="twitter:image" content="https://www.senmoonbounce.com/childrenenjoy.PNG">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness", "@id": "https://www.senmoonbounce.com/#business",
        name: "Sen Party Rentals", alternateName: "Sen Moon Bounce",
        url: "https://www.senmoonbounce.com/", telephone: "+1-571-719-9575",
        email: "senmoonbounce@gmail.com", priceRange: "$$",
        image: "https://www.senmoonbounce.com/childrenenjoy.PNG",
        address: { "@type": "PostalAddress", addressLocality: "Manassas", addressRegion: "VA", postalCode: "20112", addressCountry: "US" },
        areaServed: { "@type": "Place", name: location }
      },
      {
        "@type": "Service", "@id": `${canonical}#service`,
        name: `Party Rentals in ${location}`,
        serviceType: "Bounce house, water slide and party equipment rentals",
        provider: { "@id": "https://www.senmoonbounce.com/#business" },
        areaServed: { "@type": "Place", name: location }, url: canonical
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.senmoonbounce.com/" },
          { "@type": "ListItem", position: 2, name: `Party Rentals in ${location}`, item: canonical }
        ]
      }
    ]
  })}</script>
  <link rel="manifest" href="./site.webmanifest">
</head>
<body class="sa-page">
  <div id="header"></div>
  <nav class="sa-breadcrumb" aria-label="Breadcrumb"><div class="sa-container"><a href="./index.html">Home</a> <span aria-hidden="true">›</span> <a href="./service-areas.html">Service Areas</a> <span aria-hidden="true">›</span> <span>${escapedLocation}</span></div></nav>
  <main>
    <section class="sa-hero"><div class="sa-container sa-hero-grid"><div>
      <span class="sa-kicker" style="color:#ffd5ca">Party rental delivery</span>
      <h1>Party Rentals <span>in ${escapedLocation}</span></h1>
      <p>Sen Party Rentals provides bounce houses, water slides, obstacle courses, dunk tanks, tables, chairs, generators and concession equipment for birthdays, schools, churches, family celebrations and community events in ${escapedCity}, ${stateName}, based on availability and delivery distance.</p>
      <div class="sa-actions"><a href="./inventory.html" class="sa-button sa-primary"><i class="fa-solid fa-images" aria-hidden="true"></i>Browse Rentals</a><a href="./booking.html" class="sa-button sa-light-button"><i class="fa-solid fa-calendar-check" aria-hidden="true"></i>Check Availability</a><a href="tel:+15717199575" class="sa-button sa-light-button"><i class="fa-solid fa-phone" aria-hidden="true"></i>571-719-9575</a></div>
    </div><div class="sa-hero-image"><img src="./childrenenjoy.PNG" alt="Party rental inflatable setup serving ${escapedLocation}" fetchpriority="high" decoding="async"></div></div></section>

    <section class="sa-section"><div class="sa-container"><div class="sa-head"><span class="sa-kicker">Rentals for every celebration</span><h2>Popular party rentals in ${escapedCity}</h2><p>Choose an attraction, then add seating, power and concession equipment for a complete event setup.</p></div><div class="sa-grid sa-grid-3">
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-house" aria-hidden="true"></i></div><h3>Bounce Houses</h3><p>Colorful inflatable bounce houses for birthdays, schools and family celebrations.</p><a class="sa-link" href="./bounce-houses.html">View bounce houses <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-water" aria-hidden="true"></i></div><h3>Water Slides</h3><p>Wet and dry inflatable slides for summer parties and outdoor events.</p><a class="sa-link" href="./water-slides.html">View water slides <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-person-running" aria-hidden="true"></i></div><h3>Obstacle Courses</h3><p>High-energy inflatable challenges for races, schools, churches and festivals.</p><a class="sa-link" href="./obstacle-courses.html">View obstacle courses <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-droplet" aria-hidden="true"></i></div><h3>Dunk Tanks</h3><p>A popular attraction for fundraisers, company celebrations and community events.</p><a class="sa-link" href="./dunk-tanks.html">View dunk tanks <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-chair" aria-hidden="true"></i></div><h3>Tables &amp; Chairs</h3><p>Add practical seating and tables for guests, food, gifts and registration.</p><a class="sa-link" href="./tables-chairs.html">View tables &amp; chairs <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-bolt" aria-hidden="true"></i></div><h3>Concessions &amp; Power</h3><p>Add generators, popcorn, snow cones and useful event accessories.</p><a class="sa-link" href="./concessions.html">View add-ons <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>
    </div></div></section>

    <section class="sa-section sa-alt"><div class="sa-container"><div class="sa-copy"><span class="sa-kicker">${escapedCity} delivery information</span><h2>Bounce houses, water slides and party equipment delivered in ${escapedCity}</h2><p>Planning a birthday, graduation, school event, church gathering, company celebration or neighborhood event in ${escapedCity}? Sen Party Rentals can provide delivery, professional setup and pickup for available rental equipment.</p><p>Our inventory includes bounce houses, water slides, combo units, obstacle courses, dunk tanks and interactive attractions, plus tables, chairs, generators and concession machines. Equipment and delivery availability vary by date, location and order size.</p><p>Send the full ${escapedCity} event address, date, event time, setup surface and preferred rentals when requesting availability. Those details help us confirm suitable equipment and accurate delivery pricing before your reservation is finalized.</p></div></div></section>

    <section class="sa-section"><div class="sa-container"><div class="sa-head"><span class="sa-kicker">Events of every size</span><h2>More than birthday party rentals</h2><p>Rental equipment can support backyard celebrations and larger organized events.</p></div><div class="sa-grid sa-grid-3">
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-cake-candles" aria-hidden="true"></i></div><h3>Birthday Parties</h3><p>Bounce houses, combos, slides and games for memorable birthday celebrations.</p></article>
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-school" aria-hidden="true"></i></div><h3>Schools &amp; Churches</h3><p>Inflatables and interactive attractions for field days, festivals and programs.</p></article>
      <article class="sa-card"><div class="sa-icon"><i class="fa-solid fa-people-group" aria-hidden="true"></i></div><h3>Community &amp; Company Events</h3><p>Equipment for reunions, neighborhoods, corporate celebrations and festivals.</p></article>
    </div></div></section>

    <section class="sa-section sa-alt"><div class="sa-container"><div class="sa-head"><span class="sa-kicker">Nearby delivery areas</span><h2>Serving ${escapedCity} and nearby communities</h2><p>Delivery is confirmed according to availability, travel distance, order size and site access.</p></div><div class="sa-nearby" aria-label="Nearby service areas">${nearbyLinks(area)}</div></div></section>

    <section class="sa-section"><div class="sa-container"><div class="sa-head"><span class="sa-kicker">Before you book</span><h2>${escapedCity} party rental questions</h2></div><div class="sa-grid sa-grid-2">
      <article class="sa-card"><h3>How early should I reserve?</h3><p>Booking at least two weeks ahead is recommended. Popular weekends and holidays may fill earlier.</p></article>
      <article class="sa-card"><h3>Do you set up the equipment?</h3><p>Yes. Delivery, setup and pickup are included where applicable and confirmed with your reservation.</p></article>
      <article class="sa-card"><h3>How is delivery pricing calculated?</h3><p>Pricing depends on the address, travel distance, equipment, order size, access and setup surface.</p></article>
      <article class="sa-card"><h3>How do I check availability?</h3><p>Send your date, full address and preferred rentals through the booking page or call 571-719-9575.</p></article>
    </div></div></section>

    <section class="sa-cta"><div class="sa-container sa-cta-inner"><div><span class="sa-kicker" style="color:#ffd5ca">Planning an event in ${escapedCity}?</span><h2>Check your date and delivery address</h2><p>Send your event details to confirm rental availability and delivery pricing.</p></div><div class="sa-actions"><a href="./booking.html" class="sa-button sa-dark-button"><i class="fa-solid fa-calendar-check" aria-hidden="true"></i>Check Availability</a><a href="tel:+15717199575" class="sa-button sa-light-button"><i class="fa-solid fa-phone" aria-hidden="true"></i>Call 571-719-9575</a></div></div></section>
  </main>
  <div id="footer"></div>
  <script src="./assets/script.js?v=54" defer></script>
</body>
</html>\n`;
}

for (const area of newAreas) {
  await writeFile(path.join(root, pageName(area)), page(area), "utf8");
}

let home = await readFile(path.join(root, "index.html"), "utf8");
for (const area of newAreas) {
  home = home.replace(
    `<a href="./service-areas.html">${area.city}</a>`,
    `<a href="./${pageName(area)}">${area.city}</a>`
  );
  home = home.replace(
    `<span>${area.city}</span>`,
    `<a href="./${pageName(area)}">${area.city}</a>`
  );
}
await writeFile(path.join(root, "index.html"), home, "utf8");

let serviceAreas = await readFile(path.join(root, "service-areas.html"), "utf8");
for (const area of allAreas) {
  const linkPattern = new RegExp(`href="\\./service-areas\\.html"(\\s+class="card-link"\\s*>\\s*Party Rentals in ${area.city.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`);
  serviceAreas = serviceAreas.replace(linkPattern, `href="./${pageName(area)}"$1`);
}

const directory = `    <!-- GENERATED SERVICE AREA DIRECTORY START -->\n    <section class="section">\n      <div class="container">\n        <div class="section-head"><span class="kicker">Complete delivery directory</span><h2>Browse Party Rentals by City</h2><p>Choose a city for local rental information, or contact us with your address if your community is not listed.</p></div>\n        <div class="home-area-list" aria-label="All city service pages">${allAreas.sort((a,b) => a.city.localeCompare(b.city)).map(area => `<a href="./${pageName(area)}">${area.city}</a>`).join("")}</div>\n      </div>\n    </section>\n    <!-- GENERATED SERVICE AREA DIRECTORY END -->`;
const directoryPattern = /    <!-- GENERATED SERVICE AREA DIRECTORY START -->[\s\S]*?    <!-- GENERATED SERVICE AREA DIRECTORY END -->/;
serviceAreas = directoryPattern.test(serviceAreas)
  ? serviceAreas.replace(directoryPattern, directory)
  : serviceAreas.replace("    <!-- EXTENDED DELIVERY AREA -->", `${directory}\n\n    <!-- EXTENDED DELIVERY AREA -->`);
await writeFile(path.join(root, "service-areas.html"), serviceAreas, "utf8");

let sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const newUrls = newAreas
  .filter(area => !sitemap.includes(`https://www.senmoonbounce.com/${pageName(area)}`))
  .map(area => `  <url>\n    <loc>https://www.senmoonbounce.com/${pageName(area)}</loc>\n    <lastmod>2026-08-18</lastmod>\n    <priority>0.8</priority>\n  </url>`)
  .join("\n");
if (newUrls) sitemap = sitemap.replace("</urlset>", `${newUrls}\n</urlset>`);
await writeFile(path.join(root, "sitemap.xml"), sitemap, "utf8");

console.log(`Generated ${newAreas.length} city pages and updated site links.`);
