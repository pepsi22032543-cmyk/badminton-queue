import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

console.log("APP.JS WORKING");

// 🔹 config ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyXXXX",
  authDomain: "running-badminton-game.firebaseapp.com",
  projectId: "running-badminton-game",
};

// 🔹 init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("FIREBASE READY", db);

// 🔹 expose function ให้ปุ่มเรียก
window.addPlayer = async function () {
  const input = document.getElementById("nameInput");
  const name = input.value.trim();

  if (!name) {
    alert("กรอกชื่อก่อน");
    return;
  }

  try {
    await addDoc(collection(db, "players"), {
      name: name,
      status: "idle",
      games: 0,
      shuttles: 0,
      createdAt: Date.now()
    });

    console.log("SAVED:", name);
    input.value = "";
  } catch (e) {
    console.error("ERROR:", e);
  }
};
