"use strict";

/*
=========================================================
SEN PARTY RENTALS AVAILABILITY CALENDAR
=========================================================

Booking statuses supported:

PENDING
QUOTED
CONFIRMED
PAID
CANCELLED

Confirmed and paid bookings show as Reserved.
Pending and quoted bookings show as Pending.
Cancelled bookings do not block a rental.
*/


const rentals = [
  {
    id: "modular-moon-bounce",
    name: "Modular Moon Bounce",
    category: "bounce-house",
    categoryName: "Bounce House",
    size: "13 × 13 × 15 ft",
    price: "$200",
    image: "./images/modular-moon-bounce.jpg",
    page: "./modular-moon-bounce-rental.html"
  },
  {
    id: "sponge-bob-moon-bounce",
    name: "Sponge Bob Moon Bounce",
    category: "bounce-house",
    categoryName: "Bounce House",
    size: "15 × 15 × 15 ft",
    price: "$200",
    image: "./images/sponge-bob-moon-bounce.jpg",
    page: "./sponge-bob-moon-bounce-rental.html"
  },
  {
    id: "castle-fun-house",
    name: "Castle Fun House",
    category: "bounce-house",
    categoryName: "Bounce House",
    size: "15 × 15 × 16 ft",
    price: "$250",
    image: "./images/castle-fun-house.jpg",
    page: "./castle-fun-house-rental.html"
  },
  {
    id: "magic-castle-hoop",
    name: "Magic Castle Hoop",
    category: "bounce-house",
    categoryName: "Bounce House",
    size: "13 × 13 × 15 ft",
    price: "$200",
    image: "./images/magic-castle-hoop.jpg",
    page: "./magic-castle-hoop-rental.html"
  },
  {
    id: "princess-castle",
    name: "Princess Castle",
    category: "bounce-house",
    categoryName: "Bounce House",
    size: "13 × 13 × 16 ft",
    price: "$200",
    image: "./images/princess-castle.jpg",
    page: "./princess-castle-rental.html"
  },
  {
    id: "castle-splash-combo",
    name: "Castle Splash Combo",
    category: "combo",
    categoryName: "Wet or Dry Combo",
    size: "30 × 13 × 15 ft",
    price: "$350",
    image: "./images/castle-splash-combo.jpg",
    page: "./castle-splash-combo-rental.html"
  },
  {
    id: "high-sky-combo",
    name: "High Sky Combo",
    category: "combo",
    categoryName: "Combo",
    size: "32 × 13 × 16 ft",
    price: "$350",
    image: "./images/high-sky-combo.jpg",
    page: "./high-sky-combo-rental.html"
  },
  {
    id: "jurassic-combo",
    name: "Jurassic Combo",
    category: "combo",
    categoryName: "Combo",
    size: "28 × 13 × 16 ft",
    price: "$350",
    image: "./images/jurassic-combo.jpg",
    page: "./jurassic-combo-rental.html"
  },
  {
    id: "giant-flip-flop-water-slide",
    name: "Giant Flip-Flop Water Slide",
    category: "water-slide",
    categoryName: "Water Slide",
    size: "28 × 12 × 18 ft",
    price: "$450",
    image: "./images/giant-flip-flop-water-slide.jpg",
    page: "./giant-flip-flop-water-slide-rental.html"
  },
  {
    id: "dino-splash-water-slide",
    name: "Dino Splash Water Slide",
    category: "water-slide",
    categoryName: "Water Slide",
    size: "25 × 10 × 16 ft",
    price: "$400",
    image: "./images/dino-splash-water-slide.jpg",
    page: "./dino-splash-water-slide-rental.html"
  },
  {
    id: "wild-rapid-water-slide",
    name: "Wild Rapid Water Slide",
    category: "water-slide",
    categoryName: "Two-Lane Water Slide",
    size: "32 × 16 × 18 ft",
    price: "$500",
    image: "./images/wild-rapid-water-slide.jpg",
    page: "./wild-rapid-water-slide-rental.html"
  },
  {
    id: "big-wave-water-slide",
    name: "Big Wave Water Slide",
    category: "water-slide",
    categoryName: "Water Slide",
    size: "30 × 12 × 18 ft",
    price: "$450",
    image: "./images/big-wave-water-slide.jpg",
    page: "./big-wave-water-slide-rental.html"
  },
  {
    id: "tropical-thunder",
    name: "Tropical Thunder",
    category: "water-slide",
    categoryName: "Wet or Dry Water Slide",
    size: "28 × 13 × 16 ft",
    price: "$480",
    image: "./images/tropical-thunder.jpg",
    page: "./tropical-thunder-rental.html"
  },
  {
    id: "black-ops-obstacle-course",
    name: "Black Ops Obstacle Course",
    category: "obstacle-course",
    categoryName: "Obstacle Course",
    size: "60 × 12 × 16 ft",
    price: "$500",
    image: "./images/black-ops-obstacle-course.jpg",
    page: "./black-ops-obstacle-course-rental.html"
  },
  {
    id: "backyard-extreme-obstacle-course",
    name: "60ft Backyard Extreme",
    category: "obstacle-course",
    categoryName: "Obstacle Course",
    size: "60 × 12 × 15 ft",
    price: "$500",
    image: "./images/backyard-extreme-obstacle-course.jpg",
    page: "./backyard-extreme-obstacle-course-rental.html"
  },
  {
    id: "dunk-tank",
    name: "Dunk Tank",
    category: "party-extra",
    categoryName: "Interactive Game",
    size: "8 × 8 × 8 ft",
    price: "$400",
    image: "./images/dunk-tank.jpg",
    page: "./dunk-tank-rental.html"
  },
  {
    id: "generator",
    name: "Generator",
    category: "party-extra",
    categoryName: "Equipment Rental",
    size: "Fuel included when specified",
    price: "$100",
    image: "./images/generator-rental.jpg",
    page: "./generator-rental.html"
  },
  {
    id: "popcorn-machine",
    name: "Popcorn Machine",
    category: "party-extra",
    categoryName: "Concession Rental",
    size: "Tabletop machine",
    price: "Call for price",
    image: "./images/popcorn-machine.jpg",
    page: "./popcorn-machine-rental.html"
  },
  {
    id: "snow-cone-machine",
    name: "Snow Cone Machine",
    category: "party-extra",
    categoryName: "Concession Rental",
    size: "Tabletop machine",
    price: "Call for price",
    image: "./images/snow-cone-machine.jpg",
    page: "./snow-cone-machine-rental.html"
  },
  {
    id: "sand-bags",
    name: "Sand Bags",
    category: "party-extra",
    categoryName: "Safety Equipment",
    size: "Required for some hard-surface setups",
    price: "Call for price",
    image: "./images/sand-bags.jpg",
    page: "./sand-bags-rental.html"
  }
];


const dateInput = document.getElementById("availabilityDate");
const availabilityGrid = document.getElementById("availabilityGrid");
const selectedDateMessage = document.getElementById(
  "selectedDateMessage"
);
const emptyMessage = document.getElementById("availabilityEmpty");
const filterButtons = document.querySelectorAll(".calendar-filter");

let selectedCategory = "all";


function getLocalToday() {
  const currentDate = new Date();

  const localDate = new Date(
    currentDate.getTime() -
    currentDate.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().split("T")[0];
}


function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const parts = dateString.split("-");

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}


function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function getSavedBookings() {
  const possibleStorageKeys = [
    "senPartyBookings",
    "bookings",
    "rentalBookings",
    "senBookings"
  ];

  for (const storageKey of possibleStorageKeys) {
    try {
      const storedValue = localStorage.getItem(storageKey);

      if (!storedValue) {
        continue;
      }

      const parsedValue = JSON.parse(storedValue);

      if (Array.isArray(parsedValue)) {
        return parsedValue;
      }

      if (
        parsedValue &&
        Array.isArray(parsedValue.bookings)
      ) {
        return parsedValue.bookings;
      }
    } catch (error) {
      console.warn(
        `Could not read booking storage: ${storageKey}`,
        error
      );
    }
  }

  return [];
}


function getBookingDate(booking) {
  return (
    booking.eventDate ||
    booking.date ||
    booking.rentalDate ||
    booking.bookingDate ||
    ""
  );
}


function getBookingStatus(booking) {
  return String(
    booking.status ||
    booking.bookingStatus ||
    "PENDING"
  ).toUpperCase();
}


function getBookingRentalValues(booking) {
  const values = [];

  const possibleValues = [
    booking.rentalId,
    booking.itemId,
    booking.productId,
    booking.rental,
    booking.item,
    booking.product,
    booking.rentalName,
    booking.itemName,
    booking.productName,
    booking.unit
  ];

  possibleValues.forEach((value) => {
    if (typeof value === "string") {
      values.push(normalizeText(value));
    }

    if (Array.isArray(value)) {
      value.forEach((arrayItem) => {
        if (typeof arrayItem === "string") {
          values.push(normalizeText(arrayItem));
        }

        if (
          arrayItem &&
          typeof arrayItem === "object"
        ) {
          values.push(
            normalizeText(
              arrayItem.id ||
              arrayItem.name ||
              arrayItem.rentalName
            )
          );
        }
      });
    }

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      values.push(
        normalizeText(
          value.id ||
          value.name ||
          value.rentalName
        )
      );
    }
  });

  return values.filter(Boolean);
}


function bookingMatchesRental(booking, rental) {
  const bookingRentalValues = getBookingRentalValues(booking);

  const rentalValues = [
    normalizeText(rental.id),
    normalizeText(rental.name)
  ];

  return bookingRentalValues.some((bookingValue) => {
    return rentalValues.some((rentalValue) => {
      return (
        bookingValue === rentalValue ||
        bookingValue.includes(rentalValue) ||
        rentalValue.includes(bookingValue)
      );
    });
  });
}


function getRentalStatus(rental, selectedDate) {
  if (!selectedDate) {
    return "available";
  }

  const bookings = getSavedBookings();

  const matchingBookings = bookings.filter((booking) => {
    const bookingDate = getBookingDate(booking);
    const bookingStatus = getBookingStatus(booking);

    const activeStatuses = [
      "PENDING",
      "QUOTED",
      "CONFIRMED",
      "PAID"
    ];

    return (
      bookingDate === selectedDate &&
      activeStatuses.includes(bookingStatus) &&
      bookingMatchesRental(booking, rental)
    );
  });

  const hasReservedBooking = matchingBookings.some((booking) => {
    const status = getBookingStatus(booking);

    return status === "CONFIRMED" || status === "PAID";
  });

  if (hasReservedBooking) {
    return "reserved";
  }

  const hasPendingBooking = matchingBookings.some((booking) => {
    const status = getBookingStatus(booking);

    return status === "PENDING" || status === "QUOTED";
  });

  if (hasPendingBooking) {
    return "pending";
  }

  return "available";
}


function getStatusLabel(status) {
  const labels = {
    available: "Available",
    pending: "Pending Request",
    reserved: "Reserved",
    unavailable: "Unavailable"
  };

  return labels[status] || "Available";
}


function getStatusIcon(status) {
  const icons = {
    available: "fa-circle-check",
    pending: "fa-clock",
    reserved: "fa-calendar-check",
    unavailable: "fa-circle-xmark"
  };

  return icons[status] || "fa-circle-check";
}


function createBookingLink(rental, selectedDate) {
  const parameters = new URLSearchParams();

  parameters.set("rental", rental.name);

  if (selectedDate) {
    parameters.set("date", selectedDate);
  }

  return `./booking.html?${parameters.toString()}`;
}


function createRentalCard(rental, selectedDate) {
  const status = getRentalStatus(rental, selectedDate);
  const statusLabel = getStatusLabel(status);
  const statusIcon = getStatusIcon(status);

  const bookingDisabled =
    status === "reserved" ||
    status === "unavailable";

  const bookingText = bookingDisabled
    ? "Not Available"
    : status === "pending"
      ? "Join Waiting List"
      : "Request Booking";

  const bookingLink = bookingDisabled
    ? "#"
    : createBookingLink(rental, selectedDate);

  return `
    <article class="availability-card">

      <div class="availability-card-image">

        <img
          src="${rental.image}"
          alt="${rental.name} rental from Sen Party Rentals"
          loading="lazy"
          onerror="
            this.onerror=null;
            this.src='./images/sen-party-rentals-placeholder.jpg';
          "
        >

        <span class="availability-status ${status}">

          <i class="fa-solid ${statusIcon}"></i>

          ${statusLabel}

        </span>

      </div>

      <div class="availability-card-body">

        <div class="availability-category">
          ${rental.categoryName}
        </div>

        <h3>
          ${rental.name}
        </h3>

        <p class="availability-card-details">

          ${rental.size}

          <br>

          Starting at
          <strong>${rental.price}</strong>

        </p>

        <div class="availability-card-actions">

          <a
            href="${bookingLink}"
            class="
              calendar-book-button
              ${bookingDisabled ? "disabled" : ""}
            "
            ${bookingDisabled ? 'aria-disabled="true"' : ""}
          >
            ${bookingText}
          </a>

          <a
            href="${rental.page}"
            class="calendar-view-button"
          >
            View Details
          </a>

        </div>

      </div>

    </article>
  `;
}


function renderRentals() {
  const selectedDate = dateInput.value;

  const filteredRentals = rentals.filter((rental) => {
    return (
      selectedCategory === "all" ||
      rental.category === selectedCategory
    );
  });

  if (selectedDate) {
    selectedDateMessage.textContent =
      `Showing rental availability for ${formatDate(selectedDate)}.`;
  } else {
    selectedDateMessage.textContent =
      "Select an event date to check availability.";
  }

  availabilityGrid.innerHTML = filteredRentals
    .map((rental) => {
      return createRentalCard(rental, selectedDate);
    })
    .join("");

  emptyMessage.hidden = filteredRentals.length !== 0;
}


function setDateFromUrl() {
  const urlParameters = new URLSearchParams(
    window.location.search
  );

  const dateFromUrl = urlParameters.get("date");

  if (
    dateFromUrl &&
    dateFromUrl >= getLocalToday()
  ) {
    dateInput.value = dateFromUrl;
  }
}


function updateUrlDate(dateValue) {
  const currentUrl = new URL(window.location.href);

  if (dateValue) {
    currentUrl.searchParams.set("date", dateValue);
  } else {
    currentUrl.searchParams.delete("date");
  }

  window.history.replaceState(
    {},
    "",
    currentUrl.toString()
  );
}


dateInput.min = getLocalToday();

setDateFromUrl();
renderRentals();


dateInput.addEventListener("change", () => {
  updateUrlDate(dateInput.value);
  renderRentals();
});


filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove("active");
    });

    button.classList.add("active");
    selectedCategory = button.dataset.category;

    renderRentals();
  });
});


window.addEventListener("storage", (event) => {
  const bookingStorageKeys = [
    "senPartyBookings",
    "bookings",
    "rentalBookings",
    "senBookings"
  ];

  if (bookingStorageKeys.includes(event.key)) {
    renderRentals();
  }
});


const customerServiceToggle = document.getElementById(
  "customerServiceToggle"
);

const customerServiceMenu = document.getElementById(
  "customerServiceMenu"
);


if (
  customerServiceToggle &&
  customerServiceMenu
) {
  customerServiceToggle.addEventListener("click", () => {
    customerServiceMenu.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    const clickedInsideWidget = event.target.closest(
      ".customer-service-widget"
    );

    if (!clickedInsideWidget) {
      customerServiceMenu.classList.remove("open");
    }
  });
}