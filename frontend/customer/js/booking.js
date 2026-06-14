

/* ================= CONFIG ================= */

const API_BASE_URL = "https://travelnestcabs-2.onrender.com";


const OWNER_PHONE = "919535489504";

/* ================= READ URL PARAMS ================= */

const params = new URLSearchParams(window.location.search);
let selectedTrip  = params.get("trip") || "";
let selectedCar   = params.get("car") || "";
let selectedPrice = params.get("fare") || "";

if (selectedCar) {
  document.getElementById("selectedInfo").innerText =
    `Selected: ${selectedCar} (${selectedTrip}) – ₹${selectedPrice}`;
}

/* ================= SEND BOOKING ================= */

async function sendBooking() {

  const name   = document.getElementById("custName").value.trim();
  const phone  = document.getElementById("custPhone").value.trim();
  const pickup = document.getElementById("pickupLoc").value.trim();
  const drop   = document.getElementById("dropLoc").value.trim();
  const date   = document.getElementById("travelDate").value;
  const time   = document.getElementById("travelTime").value;

  if (!name || !phone || !pickup || !drop) {
    alert("Please fill all required details");
    return;
  }

  const whatsappMsg = `🚖 New Cab Booking

Trip: ${selectedTrip}
Car: ${selectedCar}
Fare: ₹${selectedPrice}

👤 ${name}
📞 ${phone}
📍 ${pickup}
🏁 ${drop}
📅 ${date}
⏰ ${time}`;

  window.open(
    "https://wa.me/919535489504?text=" + encodeURIComponent(whatsappMsg),
    "_blank"
  );
}