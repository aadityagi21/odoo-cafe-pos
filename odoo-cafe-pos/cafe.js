import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* FIREBASE CONFIG */

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
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

    }

});

/* ELEMENTS */

const cafesContainer = document.getElementById("cafesContainer");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");

let allCafes = [];

/* LOAD CAFES */

async function loadCafes() {

    cafesContainer.innerHTML = "<p>Loading cafes...</p>";

    try {

        const snapshot = await getDocs(collection(db, "cafes"));

        allCafes = [];

        snapshot.forEach((doc) => {

            allCafes.push({
                id: doc.id,
                ...doc.data()
            });

        });

        renderCafes(allCafes);

    } catch (error) {

        console.error(error);

        cafesContainer.innerHTML =
            "<p>Failed to load cafes.</p>";
    }
}

/* RENDER CAFES */

function renderCafes(cafes) {

    cafesContainer.innerHTML = "";

    cafes.forEach((cafe) => {

        const card = document.createElement("div");

        card.className = "cafe-card";

        card.innerHTML = `
            <div class="cafe-name">☕ ${cafe.name}</div>

            <div class="cafe-info">
                📍 ${cafe.city}
            </div>

            <div class="cafe-info">
                ⭐ ${cafe.rating}
            </div>

            <div class="status">
                ${cafe.open ? "🟢 Open" : "🔴 Closed"}
            </div>

            <button class="enter-btn">
                Enter Cafe
            </button>
        `;

card.querySelector(".enter-btn")
    .addEventListener("click", () => {

        localStorage.setItem(
            "selectedCafeId",
            cafe.id
        );

        localStorage.setItem(
            "selectedCafeName",
            cafe.name
        );

        message.textContent =
            `Selected: ${cafe.name}`;

        window.location.href = "menu.html";

    }); 

        cafesContainer.appendChild(card);

    });
}

/* SEARCH */

searchInput.addEventListener("input", () => {

    const search =
        searchInput.value.toLowerCase();

    const filtered = allCafes.filter(cafe =>
        cafe.name.toLowerCase().includes(search)
    );

    renderCafes(filtered);
});

/* START */

loadCafes();