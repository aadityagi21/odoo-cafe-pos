import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDI8jeVVenLdwfPGNh8T6cJXd6KoUmUdX",
  authDomain: "odoo-cafe-pos.firebaseapp.com",
  projectId: "odoo-cafe-pos",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= STATE ================= */
const ordersContainer = document.getElementById("ordersContainer");
const staffCafeId = localStorage.getItem("selectedCafeId") || "default";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
});

/* ================= LOAD ORDERS ================= */
function loadOrders() {
  const q = query(
    collection(db, "orders"),
    where("cafeId", "==", staffCafeId)
  );

  onSnapshot(q, (snapshot) => {
    ordersContainer.innerHTML = "";

    const orders = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    if (!orders.length) {
      ordersContainer.innerHTML = "<p>No orders yet</p>";
      return;
    }

    // pending first
    orders.sort((a, b) => {
      if (a.status === "pending") return -1;
      if (b.status === "pending") return 1;
      return 0;
    });

    orders.forEach(createOrderCard);
  });
}

/* ================= CREATE ORDER CARD ================= */
function createOrderCard(order) {
  const card = document.createElement("div");
  card.className = "order-card";

  const title = document.createElement("h3");
  title.textContent = `☕ ${order.cafeName || "Order"}`;

  const status = document.createElement("p");
  status.innerHTML = `<b>Status:</b> ${order.status}`;

  const total = document.createElement("p");
  total.innerHTML = `<b>Total:</b> ₹${order.total}`;

  const actions = document.createElement("div");
  actions.className = "actions";

  const btn = document.createElement("button");

  if (order.status === "pending") {
    btn.textContent = "Accept";
    btn.onclick = () => updateStatus(order.id, "accepted");
  }

  else if (order.status === "accepted") {
    btn.textContent = "Start Preparing";
    btn.onclick = () => updateStatus(order.id, "preparing");
  }

  else if (order.status === "preparing") {
    btn.textContent = "Mark Ready";
    btn.onclick = () => updateStatus(order.id, "ready");
  }

  else {
    btn.textContent = "Completed ✔";
    btn.disabled = true;
  }

  actions.appendChild(btn);

  card.appendChild(title);
  card.appendChild(status);
  card.appendChild(total);
  card.appendChild(actions);

  ordersContainer.appendChild(card);
}

/* ================= UPDATE STATUS ================= */
async function updateStatus(orderId, status) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status: status
    });
  } catch (err) {
    console.error("Status update error:", err);
  }
}

/* ================= OPTIONAL: MENU ADD ================= */
document.getElementById("addItemBtn")?.addEventListener("click", async () => {
  const name = document.getElementById("itemName")?.value;
  const price = Number(document.getElementById("itemPrice")?.value);
  const category = document.getElementById("itemCategory")?.value;

  if (!name || !price || !category) {
    alert("Fill all fields");
    return;
  }

  try {
    await addDoc(collection(db, "menu"), {
      name,
      price,
      category,
      cafeId: staffCafeId
    });

    alert("Item added!");
  } catch (err) {
    console.error(err);
  }
});

/* ================= OPTIONAL: STAFF ADD ================= */
document.getElementById("addStaffBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("staffEmail")?.value;
  const role = document.getElementById("staffRole")?.value;

  if (!email || !role) {
    alert("Fill all fields");
    return;
  }

  try {
    await addDoc(collection(db, "users"), {
      email,
      role,
      cafeId: staffCafeId
    });

    alert("Staff added!");
  } catch (err) {
    console.error(err);
  }
});