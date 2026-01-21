"use strict";

/* ================= API CONFIG ================= */

const API_BASE_URL =
  location.hostname === "localhost"
    ? "http://127.0.0.1:9000"
    : "https://travelnest-backend-p13p.onrender.com";

/* ================= DRIVER SESSION ================= */

const DRIVER_ID = localStorage.getItem("driver_id");

/* ================= ADMIN: LOAD DRIVERS ================= */

async function loadDrivers() {
  const table = document.getElementById("driverTable");
  if (!table) return; // not admin page

  try {
    const res = await fetch(`${API_BASE_URL}/api/driver/admin/drivers`);
    const drivers = await res.json();

    table.innerHTML = "";

    drivers.forEach(d => {
      table.innerHTML += `
        <tr>
          <td>${d.name}</td>
          <td>${d.phone}</td>
          <td>${d.licence_no}</td>
          <td>${d.vehicle_no}</td>
          <td>${d.status}</td>
          <td class="action">
            <button class="btn approve"
              onclick="approveDriver(${d.id})">Approve</button>
            <button class="btn reject"
              onclick="rejectDriver(${d.id})">Reject</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("Driver admin load failed", err);
  }
}

async function approveDriver(id) {
  await fetch(`${API_BASE_URL}/api/driver/admin/driver/${id}/approve`, {
    method: "PUT"
  });
  loadDrivers();
}

async function rejectDriver(id) {
  await fetch(`${API_BASE_URL}/api/driver/admin/driver/${id}/reject`, {
    method: "PUT"
  });
  loadDrivers();
}

/* ================= DRIVER PROFILE ================= */

async function loadProfile() {
  if (!DRIVER_ID) return;

  const nameEl = document.getElementById("driverName");
  const statusEl = document.getElementById("driverStatus");
  if (!nameEl || !statusEl) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/driver/profile/${DRIVER_ID}`);
    const data = await res.json();

    nameEl.innerText = data.name;
    statusEl.innerText = data.status;

    statusEl.className =
      "status " + (data.status === "APPROVED" ? "approved" : "pending");
  } catch (err) {
    console.error("Profile load failed", err);
  }
}

/* ================= DRIVER WALLET ================= */

async function loadWallet() {
  if (!DRIVER_ID) return;

  const walletEl = document.getElementById("walletBalance");
  if (!walletEl) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/wallet/${DRIVER_ID}`);
    const data = await res.json();
    walletEl.innerText = `₹${data.balance}`;
  } catch (err) {
    console.error("Wallet load failed", err);
  }
}

/* ================= DRIVER TRIPS ================= */

async function loadTrips() {
  if (!DRIVER_ID) return;

  const container = document.getElementById("tripList");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/driver/trips/${DRIVER_ID}`);
    const trips = await res.json();

    container.innerHTML = "";

    if (!trips.length) {
      container.innerHTML = `<div class="card">No trips assigned</div>`;
      return;
    }

    trips.forEach(t => {
      container.innerHTML += `
        <div class="card">
          <p><b>Booking ID:</b> ${t.booking_number}</p>
          <p><b>Pickup:</b> ${t.pickup}</p>
          <p><b>Drop:</b> ${t.drop}</p>
          <p><b>Fare:</b> ₹${t.fare}</p>
          <p><b>Status:</b> ${t.status}</p>
          <button class="btn">Start Trip</button>
        </div>
      `;
    });
  } catch (err) {
    console.error("Trips load failed", err);
  }
}

/* ================= LOGOUT ================= */

function logout() {
  localStorage.removeItem("driver_id");
  window.location.href = "/frontend/driver/pages/driver_login.html";
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  loadDrivers();   // admin page only
  loadProfile();   // driver dashboard
  loadWallet();
  loadTrips();
});
