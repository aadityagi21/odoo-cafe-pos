import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDI8jeVVenLdwfPGNh8T6cJXd6KoUmUdXk",
  authDomain: "odoo-cafe-pos.firebaseapp.com",
  projectId: "odoo-cafe-pos",
  storageBucket: "odoo-cafe-pos.appspot.com",
  messagingSenderId: "153793842911",
  appId: "1:153793842911:web:26730b0c7687fa5791a36a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= STATE ================= */
let menuItems = [];
let cart = [];
let unsubscribeOrder = null;

/* ================= DOM ================= */
const el = {
  menu: document.getElementById("menuContainer"),
  search: document.getElementById("searchInput"),
  cafeName: document.getElementById("cafeName"),

  cartPanel: document.getElementById("cartPanel"),
  trackPanel: document.getElementById("orderTrackPanel"),

  cartCount: document.getElementById("cartCount"),
  cartItems: document.getElementById("cartItems"),
  cartTotal: document.getElementById("cartTotal"),

  trackContent: document.getElementById("trackContent")
};

/* ================= CAFÉ ================= */
const cafeId = localStorage.getItem("selectedCafeId");
const cafeName = localStorage.getItem("selectedCafeName");

if (el.cafeName) el.cafeName.textContent = cafeName || "Cafe";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  loadMenu();
});

/* ================= UI BIND ================= */
function bindUI() {
  document.getElementById("openCart")?.addEventListener("click", () => {
    el.cartPanel.classList.remove("hidden");
  });

  document.getElementById("closeCart")?.addEventListener("click", () => {
    el.cartPanel.classList.add("hidden");
  });

  document.getElementById("clearCart")?.addEventListener("click", () => {
    cart = [];
    updateCart();
  });

  document.getElementById("placeOrder")?.addEventListener("click", placeOrder);

  /* ================= ORDERS BUTTON FIX ================= */
  document.getElementById("openOrders")?.addEventListener("click", openOrders);

  document.getElementById("closeTrack")?.addEventListener("click", () => {
    el.trackPanel.classList.add("hidden");
    if (unsubscribeOrder) unsubscribeOrder();
    unsubscribeOrder = null;
  });

  el.search?.addEventListener("input", handleSearch);
}

/* ================= LOAD MENU ================= */
async function loadMenu() {
  const snap = await getDocs(collection(db, "menu"));

  menuItems = snap.docs
    .map(d => d.data())
    .filter(i => i.cafeId === cafeId);

  renderMenu(menuItems);
}

/* ================= RENDER MENU ================= */
function renderMenu(items) {
  el.menu.innerHTML = "";

  const grouped = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([cat, list]) => {
    el.menu.appendChild(makeCategory(cat));
    list.forEach(i => el.menu.appendChild(makeItem(i)));
  });
}

const makeCategory = (name) => {
  const d = document.createElement("div");
  d.className = "category";
  d.textContent = name;
  return d;
};

const makeItem = (item) => {
  const d = document.createElement("div");
  d.className = "item";

  d.innerHTML = `
    <div class="item-left">
      <h3>${item.name}</h3>
      <p>${item.description || ""}</p>
    </div>
    <div>
      <div class="price">₹${item.price}</div>
      <button class="add-btn">Add</button>
    </div>
  `;

  d.querySelector(".add-btn").onclick = () => addToCart(item);

  return d;
};

/* ================= SEARCH ================= */
function handleSearch(e) {
  const val = e.target.value.toLowerCase();

  renderMenu(
    menuItems.filter(i => i.name.toLowerCase().includes(val))
  );
}

/* ================= CART ================= */
function addToCart(item) {
  const found = cart.find(i => i.name === item.name);

  if (found) found.qty++;
  else cart.push({ name: item.name, price: item.price, qty: 1 });

  updateCart();
}

function updateCart() {
  let qty = 0;
  let total = 0;

  el.cartItems.innerHTML = "";

  cart.forEach((item, index) => {
    qty += item.qty;
    total += item.qty * item.price;

    const d = document.createElement("div");
    d.className = "cart-item";

    d.innerHTML = `
      <div>
        <b>${item.name}</b>
        <div>₹${item.price}</div>
      </div>
      <div class="qty">
        <button class="minus">-</button>
        <span>${item.qty}</span>
        <button class="plus">+</button>
      </div>
    `;

    d.querySelector(".minus").onclick = () => {
      item.qty--;
      if (item.qty <= 0) cart.splice(index, 1);
      updateCart();
    };

    d.querySelector(".plus").onclick = () => {
      item.qty++;
      updateCart();
    };

    el.cartItems.appendChild(d);
  });

  el.cartCount.textContent = qty;
  el.cartTotal.textContent = `Total: ₹${total}`;
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  if (!cart.length) return alert("Cart is empty!");

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const ref = await addDoc(collection(db, "orders"), {
    cafeId,
    cafeName,
    items: cart,
    total,
    status: "pending",
    createdAt: serverTimestamp()
  });

  cart = [];
  updateCart();
  el.cartPanel.classList.add("hidden");

  openTracking(ref.id);
}

/* ================= ORDERS BUTTON ================= */
async function openOrders() {
  el.trackPanel.classList.remove("hidden");

  el.trackContent.innerHTML = `<p>Loading orders...</p>`;

  const snap = await getDocs(collection(db, "orders"));

  const orders = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(o => o.cafeId === cafeId)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (!orders.length) {
    el.trackContent.innerHTML = `<p>No orders found</p>`;
    return;
  }

  el.trackContent.innerHTML = `<h3>📦 Your Orders</h3><div id="orderList"></div>`;

  const list = document.getElementById("orderList");

  orders.forEach(order => {
    const d = document.createElement("div");

    d.style.padding = "10px";
    d.style.margin = "8px 0";
    d.style.border = "1px solid #1f2937";
    d.style.borderRadius = "10px";
    d.style.cursor = "pointer";

    d.innerHTML = `
      <b>₹${order.total}</b><br/>
      <small>Status: ${order.status}</small>
    `;

    d.onclick = () => openTracking(order.id);

    list.appendChild(d);
  });
}

/* ================= TRACKING ================= */
function openTracking(orderId) {
  el.trackPanel.classList.remove("hidden");

  if (unsubscribeOrder) unsubscribeOrder();

  const ref = doc(db, "orders", orderId);

  unsubscribeOrder = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;

    const d = snap.data();

    el.trackContent.innerHTML = `
      <h3>☕ ${d.cafeName}</h3>
      <p><b>Status:</b> ${d.status}</p>
      <p><b>Total:</b> ₹${d.total}</p>
    `;
  });
}