(() => {
  "use strict";
  window.SenDriverPayments = function ({db, state, $, showAlert, hideAlert, renderAssignments}) {
    const money = value => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(Number(value || 0));
    const requests = new Map();
    let busy = false, payment = null;
    const selected = () => state.assignments.find(item => item.id === state.selectedAssignmentId);
    const booking = () => state.bookings.get(selected()?.booking_id);
    async function invoke(body) {
      const {data, error} = await db.functions.invoke("driver-payment", {body});
      if (error) {
        let payload;
        try { payload = await error.context?.json(); } catch { /* Use the transport error. */ }
        if (payload?.error) throw new Error(payload.error);
        throw new Error(error.message || "Payment service unavailable");
      }
      if (!data?.success) throw new Error(data?.error || "The request was not confirmed");
      return data;
    }
    function render() {
      const b = booking(), due = window.SenAdmin.balanceDue(b);
      $("driver-balance").textContent = b ? money(due) : "Unavailable";
      $("driver-paid").textContent = b ? money(window.SenAdmin.amountPaid(b)) : "Unavailable";
      $("record-driver-payment").disabled = busy || !b || due <= 0 || ["CANCELLED", "REFUNDED"].includes(b.payment_status) || ["CANCELLED", "CANCELED"].includes(b.status);
      $("record-driver-payment").textContent = due > 0 ? `Mark ${money(due)} Paid` : "Paid in Full";
      $("send-driver-receipt").disabled = busy || !payment;
      $("driver-payment-method").disabled = busy;
    }
    async function open() {
      const id = state.selectedAssignmentId;
      payment = null; render();
      try {
        const result = await invoke({action: "latest", assignment_id: id});
        if (state.selectedAssignmentId !== id) return;
        if (result.booking) {
          state.bookings.set(result.booking.id, {...booking(), ...result.booking});
          renderAssignments();
        }
        payment = result.payment; render();
      } catch (error) {
        if (state.selectedAssignmentId === id) showAlert($("modal-alert"), error.message);
      }
    }
    async function record() {
      if (busy || !booking()) return;
      const id = state.selectedAssignmentId, due = window.SenAdmin.balanceDue(booking());
      const method = $("driver-payment-method").value;
      if (!(due > 0) || !window.confirm(`Confirm you received ${money(due)} by ${method}. This records payment; it does not charge the customer.`)) return;
      if (!requests.has(id)) requests.set(id, crypto.randomUUID());
      busy = true; render(); hideAlert($("modal-alert"));
      try {
        const result = await invoke({action: "record", assignment_id: id, request_id: requests.get(id), method, expected_balance: due});
        state.bookings.set(result.booking.id, result.booking);
        requests.delete(id); renderAssignments();
        if (state.selectedAssignmentId === id) {
          payment = result.payment;
          showAlert($("modal-alert"), "Payment recorded. Tap Send Receipt to email the customer.", "success");
        }
      } catch (error) {
        showAlert($("modal-alert"), `${error.message}. Refresh to verify the balance before recording again.`);
      } finally { busy = false; render(); }
    }
    async function receipt() {
      if (busy || !payment) return;
      busy = true; render(); hideAlert($("modal-alert"));
      try {
        const result = await invoke({action: "receipt", assignment_id: state.selectedAssignmentId, payment_id: payment.id});
        showAlert($("modal-alert"), result.warning || `Receipt ${result.already_sent ? "already sent" : "sent"} to ${result.recipient}.`, "success");
      } catch (error) { showAlert($("modal-alert"), `${error.message}. Payment stays recorded; retry only Send Receipt.`); }
      finally { busy = false; render(); }
    }
    $("record-driver-payment").addEventListener("click", record);
    $("send-driver-receipt").addEventListener("click", receipt);
    return {open};
  };
})();
