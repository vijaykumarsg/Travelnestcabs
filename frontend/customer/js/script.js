/* ================= API CONFIG ================= */

const API_BASE_URL =
  location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://travelnest-backend-p13p.onrender.com";

const OWNER_PHONE = "919535489504";

/* ================= GLOBAL VARIABLES ================= */

let selectedTrip = "";
let selectedCar = "";
let selectedPrice = 0;

/* ================= MOBILE HAMBURGER ================= */

const hamburger = document.querySelector(".hamburger");
const nav = document.querySelector(".main-nav");
const overlay = document.querySelector(".menu-overlay");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    nav.classList.toggle("active");
    overlay.classList.toggle("active");
  });
}

if (overlay) {
  overlay.addEventListener("click", closeMenu);
}

document.querySelectorAll(".main-nav a").forEach(link => {
  link.addEventListener("click", closeMenu);
});

function closeMenu() {
  hamburger?.classList.remove("open");
  nav?.classList.remove("active");
  overlay?.classList.remove("active");
}

/* ================= BOOKING REDIRECT ================= */

function redirectBooking(trip, car, fare) {
  const url = `/customer/pages/booking.html?trip=${encodeURIComponent(
    trip
  )}&car=${encodeURIComponent(car)}&fare=${encodeURIComponent(fare)}`;
  window.location.href = url;
}

/* ================= BOOKING FORM → BACKEND ================= */

document
  .getElementById("bookingForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      pickup: document.getElementById("pickup").value,
      drop: document.getElementById("drop").value,
      trip_type: document.getElementById("trip_type").value,
      car: document.getElementById("car").value,
      price: parseFloat(document.getElementById("price").value),
      travel_date: document.getElementById("travel_date").value,
      travel_time: document.getElementById("travel_time").value
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (!res.ok) throw result;

      alert("✅ Booking successful!");
    } catch (err) {
      alert(err.message || "❌ Booking failed");
    }
  });

/* ================= WHATSAPP BOOKING ================= */

function openBooking(trip, car, price) {
  selectedTrip = trip;
  selectedCar = car;
  selectedPrice = price;
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}

function sendBooking() {
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const pickup = document.getElementById("pickupLoc").value.trim();
  const drop = document.getElementById("dropLoc").value.trim();
  const date = document.getElementById("travelDate").value;
  const time = document.getElementById("travelTime").value;

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  const msg = `🚖 Cab Booking Request
Trip: ${selectedTrip}
Car: ${selectedCar}
Fare: ₹${selectedPrice}
👤 Name: ${name}
📞 Phone: ${phone}
📍 Pickup: ${pickup}
🏁 Drop: ${drop}
📅 Date: ${date}
⏰ Time: ${time}`;

  window.open(
    "https://wa.me/" + OWNER_PHONE + "?text=" + encodeURIComponent(msg),
    "_blank"
  );
}

/* ================= ADMIN WHATSAPP LINK ================= */

async function sendWhatsApp(bookingId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}`);
    const data = await res.json();

    if (data.whatsapp_link) {
      window.open(data.whatsapp_link, "_blank");
    } else {
      alert("WhatsApp link not available");
    }
  } catch (err) {
    alert("Failed to open WhatsApp");
  }
}

/* ================= ADMIN LOGIN (NO JWT) ================= */

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    localStorage.setItem("admin_logged_in", "true");

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
  } else {
    document.getElementById("loginError").innerText =
      "Invalid username or password";
  }
}

/* ================= LOGIN CHECK ON LOAD ================= */

if (localStorage.getItem("admin_logged_in") === "true") {
  document.getElementById("loginPage")?.style.setProperty("display", "none");
  document.getElementById("dashboard")?.style.setProperty("display", "block");
} else {
  document.getElementById("loginPage")?.style.setProperty("display", "flex");
  document.getElementById("dashboard")?.style.setProperty("display", "none");
}

/* ================= LOGOUT ================= */

function logout() {
  localStorage.removeItem("admin_logged_in");
  location.reload();
}
