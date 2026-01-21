

/* ================= CONFIG ================= */

const API_BASE_URL = "https://travelnest-backend-p13p.onrender.com";


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

  if (!selectedTrip || !selectedCar) {
    alert("Please select a cab first");
    return;
  }

  const bookingPayload = {
    name,
    phone,
    pickup,
    drop,
    trip_type: selectedTrip,
    car: selectedCar,
    price: parseFloat(selectedPrice) || 0,
    travel_date: date,
    travel_time: time
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload)
    });

    const data = await res.json();
    if (!res.ok) {
        alert("SERVER RESPONSE:\n" + JSON.stringify(data, null, 2));
        throw data;
}


    alert("✅ Booking submitted successfully!");

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
      "https://wa.me/" + OWNER_PHONE +
      "?text=" + encodeURIComponent(whatsappMsg),
      "_blank"
    );

  }catch (err) {
  alert("❌ ERROR FROM SERVER:\n" + JSON.stringify(err, null, 2));
  console.log("FULL ERROR:", err);
}
}
