import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
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
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= ELEMENTS ================= */
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const confirmPassword = document.getElementById("confirmPassword");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");

const passwordInput = document.getElementById("password");
const eye = document.getElementById("eye");

let isSignup = false;

/* ================= TAB SWITCH ================= */
loginTab.addEventListener("click", () => {
  isSignup = false;

  loginTab.classList.add("active");
  signupTab.classList.remove("active");

  confirmPassword.style.display = "none";
  submitBtn.textContent = "Login";
  message.textContent = "";
});

signupTab.addEventListener("click", () => {
  isSignup = true;

  signupTab.classList.add("active");
  loginTab.classList.remove("active");

  confirmPassword.style.display = "block";
  submitBtn.textContent = "Create Account";
  message.textContent = "";
});

/* ================= ROLE FUNCTION ================= */
async function getUserRole(email) {

  const q = query(
    collection(db, "users"),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  let userData = null;

  snapshot.forEach(doc => {
    userData = doc.data();
  });

  return userData;
}

/* ================= AUTH ================= */
document.getElementById("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = passwordInput.value;
  const confirm = confirmPassword.value;

  try {

    /* ================= SIGNUP ================= */
    if (isSignup) {

      if (password !== confirm) {
        message.style.color = "red";
        message.textContent = "Passwords do not match";
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);

      message.style.color = "#00ff99";
      message.textContent = "Account created successfully 🎉";

      setTimeout(() => {
        window.location.href = "cafe.html";
      }, 1000);

      return;
    }

    /* ================= LOGIN ================= */
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

const roleData = await getUserRole(email);

message.style.color = "#00ff99";
message.textContent = "Login successful 🎉";

setTimeout(() => {

  // 👑 OWNER
  if (roleData?.role === "owner") {
    window.location.href = "owner.html";
    return;
  }

  // 👨‍🍳 STAFF
  if (roleData?.role === "staff") {
    window.location.href = "staff.html";
    return;
  }

  // 🧑 NORMAL USER (NO ROLE FOUND)
  window.location.href = "cafe.html";

}, 500);

  } catch (error) {

    let msg = "Something went wrong";

    switch (error.code) {

      case "auth/email-already-in-use":
        msg = "Account already exists → Please login";
        break;

      case "auth/user-not-found":
        msg = "No account found → Please sign up";
        break;

      case "auth/wrong-password":
        msg = "Wrong password";
        break;

      case "auth/invalid-email":
        msg = "Invalid email";
        break;

      case "auth/weak-password":
        msg = "Password must be at least 6 characters";
        break;

      case "auth/invalid-credential":
        msg = "Invalid email or password";
        break;
    }

    message.style.color = "red";
    message.textContent = msg;
  }
});

/* ================= PASSWORD EYE ================= */
let showPassword = false;

eye.addEventListener("click", () => {
  showPassword = !showPassword;

  passwordInput.type = showPassword ? "text" : "password";
  eye.textContent = showPassword ? "🔓" : "🔒";
});