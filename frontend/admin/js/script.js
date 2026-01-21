"use strict";

/* ================= API CONFIG ================= */

const API_BASE_URL = "https://travelnest-backend-p13p.onrender.com";

/* ================= GLOBAL STATE ================= */

const tableBody = document.getElementById("bookingTable");
let allBookings = [];

/* ================= UTIL ================= */

function formatDateTime(dt) {
  const d = new Date(dt);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

/* ================= LOGIN ================= */

function adminLogin() {
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    localStorage.setItem("admin_logged_in", "true");

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    loadBookings();
  } else {
    document.getElementById("loginError").innerText =
      "Invalid username or password";
  }
}

/* ================= LOGIN CHECK ================= */

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("admin_logged_in") === "true") {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadBookings();
  } else {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("dashboard").style.display = "none";
  }
});

/* ================= LOAD BOOKINGS ================= */

async function loadBookings() {
  try {
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    const basicAuth = btoa(username + ":" + password);

    const res = await fetch(`${API_BASE_URL}/api/admin/bookings`, {
      headers: {
        Authorization: "Basic " + basicAuth
      }
    });

    if (!res.ok) {
      tableBody.innerHTML =
        `<tr><td colspan="12">Invalid admin credentials</td></tr>`;
      return;
    }

    const data = await res.json();
    allBookings = data;
    renderBookings(data);

  } catch (err) {
    console.error(err);
    tableBody.innerHTML =
      `<tr><td colspan="12">Backend not reachable</td></tr>`;
  }
}

/* ================= RENDER TABLE ================= */

function renderBookings(bookings) {
  tableBody.innerHTML = "";

  if (!bookings.length) {
    tableBody.innerHTML =
      `<tr><td colspan="12">No records found</td></tr>`;
    return;
  }

  bookings.forEach(b => {
    const invoiceBtn = b.invoice_exists
      ? `<button onclick="openInvoice(${b.id})">View</button>`
      : "-";

    const whatsappBtn = b.invoice_exists
      ? `<button onclick="sendWhatsApp(${b.id})">Send</button>`
      : "-";

    tableBody.innerHTML += `
      <tr>
        <td>${b.id}</td>
        <td><strong>${b.booking_number}</strong></td>
        <td>${b.name}</td>
        <td>${b.phone}</td>
        <td>${b.pickup}</td>
        <td>${b.drop}</td>
        <td>${b.car}</td>
        <td>₹${b.price}</td>
        <td>${formatDateTime(b.created_at)}</td>
        <td>
          <select onchange="updateStatus(${b.id}, this.value)">
            <option value="PENDING" ${b.status === "PENDING" ? "selected" : ""}>Pending</option>
            <option value="CONFIRMED" ${b.status === "CONFIRMED" ? "selected" : ""}>Confirmed</option>
            <option value="COMPLETED" ${b.status === "COMPLETED" ? "selected" : ""}>Completed</option>
            <option value="CANCELLED" ${b.status === "CANCELLED" ? "selected" : ""}>Cancelled</option>
          </select>
        </td>
        <td>${invoiceBtn}</td>
        <td>${whatsappBtn}</td>
      </tr>
    `;
  });
}

/* ================= FILTER ================= */

function applyFilters() {
  const search = document.getElementById("searchBookingNo").value.toLowerCase();
  const date = document.getElementById("filterDate").value;

  let filtered = allBookings;

  if (search) {
    filtered = filtered.filter(b =>
      b.booking_number.toLowerCase().includes(search)
    );
  }

  if (date) {
    filtered = filtered.filter(b =>
      new Date(b.created_at).toISOString().split("T")[0] === date
    );
  }

  renderBookings(filtered);
}

/* ================= UPDATE STATUS ================= */

async function updateStatus(id, status) {
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value.trim();
  const basicAuth = btoa(username + ":" + password);

  await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + basicAuth
    },
    body: JSON.stringify({ status })
  });

  loadBookings();
}

/* ================= WHATSAPP ================= */

async function sendWhatsApp(id) {
  try {
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const basicAuth = btoa(username + ":" + password);

    const res = await fetch(
      `${API_BASE_URL}/api/invoice/resend-whatsapp/${id}`,
      {
        method: "POST",
        headers: { Authorization: "Basic " + basicAuth }
      }
    );

    const data = await res.json();

    if (res.ok && data.whatsapp_link) {
      window.open(data.whatsapp_link, "_blank");
    } else {
      alert(data.detail || "Invoice not generated");
    }
  } catch (err) {
    alert("WhatsApp failed");
  }
}

/* ================= INVOICE ================= */

async function openInvoice(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/invoice/file/${id}`);
    if (!res.ok) {
      alert("Invoice not available");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  } catch (err) {
    alert("Failed to open invoice");
  }
}

/* ================= EXPORT CSV ================= */

function exportToExcel() {
  if (!allBookings.length) return alert("No data");

  const headers = [
    "Booking No","Name","Phone","Pickup","Drop",
    "Car","Price","Booked At","Status"
  ];

  let csv = headers.join(",") + "\n";

  allBookings.forEach(b => {
    csv += [
      b.booking_number,
      b.name,
      b.phone,
      b.pickup,
      b.drop,
      b.car,
      b.price,
      formatDateTime(b.created_at),
      b.status
    ].join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "travel_nest_bookings.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= LOGOUT ================= */

function logout() {
  localStorage.removeItem("admin_logged_in");
  location.reload();
}
