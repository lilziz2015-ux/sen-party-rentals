/* Shared admin navigation and booking payment calculations. */
(() => {
  "use strict";

  function nonNegativeAmount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  }

  function amountPaid(booking, payments = []) {
    if (!booking) return 0;
    const completed = new Set(["COMPLETED", "PAID", "SUCCESS", "SUCCEEDED"]);
    const recorded = payments
      .filter(payment => payment.booking_id === booking?.id &&
        completed.has(String(payment.status || "").toUpperCase()))
      .reduce((total, payment) => total + nonNegativeAmount(payment.amount), 0);

    // The booking summary can include cash/check payments entered manually.
    // These figures overlap the payment ledger; adding them double-counts receipts.
    return Math.max(recorded, nonNegativeAmount(booking?.amount_paid));
  }

  function balanceDue(booking, payments = []) {
    if (booking?.balance_due !== null && booking?.balance_due !== undefined &&
        booking.balance_due !== "" && Number.isFinite(Number(booking.balance_due))) {
      return nonNegativeAmount(booking.balance_due);
    }
    return Math.max(0, nonNegativeAmount(booking?.final_total ?? booking?.subtotal) -
      amountPaid(booking, payments));
  }

  function totalCollected(bookings, payments = []) {
    const bookingIds = new Set(bookings.map(booking => booking.id));
    const linked = bookings.reduce((total, booking) => total + amountPaid(booking, payments), 0);
    const unlinked = payments.filter(payment => !bookingIds.has(payment.booking_id) &&
      ["COMPLETED", "PAID", "SUCCESS", "SUCCEEDED"].includes(String(payment.status || "").toUpperCase()))
      .reduce((total, payment) => total + nonNegativeAmount(payment.amount), 0);
    return linked + unlinked;
  }

  function destination(value) {
    try {
      const url = new URL(value || "./admin.html", location.href);
      if (url.origin !== location.origin || url.username || url.password ||
          !/^\/admin(?:-[a-z]+)?\.html$/.test(url.pathname) ||
          url.pathname === "/admin-login.html" ||
          ["access_token", "refresh_token", "token", "code"].some(key => url.searchParams.has(key))) {
        return "./admin.html";
      }
      return url.pathname + url.search + url.hash;
    } catch {
      return "./admin.html";
    }
  }

  function loginUrl() {
    const next = destination(location.pathname + location.search + location.hash);
    return "./admin-login.html?next=" + encodeURIComponent(next);
  }

  function watchEdits(root, status) {
    const snapshot = () => JSON.stringify(Array.from(root.querySelectorAll("input, select, textarea"))
      .map(field => [field.id, field.value]));
    let saved = null;
    const isDirty = () => saved !== null && saved !== snapshot();
    function update() {
      status.textContent = isDirty() ? "Unsaved changes" : "All changes saved";
    }
    root.addEventListener("input", update);
    root.addEventListener("change", update);
    window.addEventListener("beforeunload", event => {
      if (!isDirty()) return;
      event.preventDefault();
      event.returnValue = "";
    });
    return Object.freeze({
      isDirty,
      markSaved() { saved = snapshot(); update(); },
      confirmDiscard() { return !isDirty() || window.confirm("Discard your unsaved booking changes?"); }
    });
  }

  window.SenAdmin = Object.freeze({ amountPaid, balanceDue, totalCollected, destination, loginUrl, watchEdits });
})();
