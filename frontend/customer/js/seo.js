document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".main-nav");

  if (!hamburger || !nav) return;

  hamburger.addEventListener("click", () => {
    nav.classList.toggle("active");
    hamburger.classList.toggle("active");

    hamburger.innerHTML = nav.classList.contains("active")
      ? "&times;"
      : "&#9776;";
  });
});

/* ===== AUTO-FILL PICKUP & DROP ===== */
const params = new URLSearchParams(window.location.search);
document.getElementById("pickup").value = params.get("pickup") || "";
document.getElementById("drop").value   = params.get("drop") || "";



document.getElementById("confirmBtn").addEventListener("click", async function () {

  const data = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    pickup: document.getElementById("pickup").value,
    drop: document.getElementById("drop").value,
    travel_date: document.getElementById("travel_date").value,
    car: document.getElementById("car").value
  };

  if (!data.name || !data.phone || !data.travel_date || !data.car) {
    alert("Please fill all details");
    return;
  }

  /* SAVE TO BACKEND (NON-BLOCKING) */
  try {
    await fetch("https://travelnest-backend-p13p.onrender.com/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.warn("Backend not reachable");
  }

  /* WHATSAPP MESSAGE */
  const message = `🚖 New Cab Booking

👤 Name: ${data.name}
📞 Phone: ${data.phone}
📍 Pickup: ${data.pickup}
🏁 Drop: ${data.drop}
📅 Date: ${data.travel_date}
🚘 Car: ${data.car}`;

  window.open(
    "https://wa.me/919535489504?text=" + encodeURIComponent(message),
    "_blank"
  );
});
