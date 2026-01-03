// ================================
// 🔥 Firebase Import
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ================================
// 🔧 Firebase Config
// ================================
const firebaseConfig = {
  apiKey: "AIzaSyXXXX",
  authDomain: "running-badminton-game.firebaseapp.com",
  projectId: "running-badminton-game",
};

// ================================
// 🚀 Init Firebase
// ================================
console.log("APP.JS WORKING");

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("FIREBASE READY");

// ================================
// 📌 DOM
// ================================
const playerList = document.getElementById("playerList");
const playingBox = document.querySelector(".playing");
const restingBox = document.querySelector(".resting");

// ================================
// ➕ Add Player
// ================================
window.addPlayer = async function () {
  const input = document.getElementById("nameInput");
  const name = input.value.trim();

  if (!name) {
    alert("กรอกชื่อก่อน");
    return;
  }

  await addDoc(collection(db, "players"), {
    name,
    status: "idle", // idle | playing | rest
    games: 0,
    shuttles: 0,
    createdAt: Date.now()
  });

  input.value = "";
};

// ================================
// 🔄 Realtime Listener
// ================================
const q = query(
  collection(db, "players"),
  orderBy("createdAt", "asc")
);

onSnapshot(q, (snapshot) => {
  playerList.innerHTML = "";
  playingBox.innerHTML = "";
  restingBox.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const p = docSnap.data();
    const id = docSnap.id;

    const el = document.createElement("div");
    el.className = "player";
    el.innerHTML = `
      <b>${p.name}</b><br>
      🎮 ${p.games} เกม | 🏸 ${p.shuttles} ลูก<br>
      ${renderButtons(id, p.status)}
    `;

    if (p.status === "playing") {
      playingBox.appendChild(el);
    } else if (p.status === "rest") {
      restingBox.appendChild(el);
    } else {
      playerList.appendChild(el);
    }
  });
});

// ================================
// 🎛 Buttons
// ================================
function renderButtons(id, status) {
  if (status === "idle") {
    return `<button onclick="toPlaying('${id}')">ลงสนาม</button>`;
  }

  if (status === "playing") {
    return `
      <button onclick="finishGame('${id}')">จบเกม</button>
      <button onclick="addShuttle('${id}')">- ลูกแบด</button>
    `;
  }

  if (status === "rest") {
    return `<button onclick="toIdle('${id}')">กลับเข้าคิว</button>`;
  }
}

// ================================
// 🔁 Status Actions
// ================================
window.toPlaying = async function (id) {
  await updateDoc(doc(db, "players", id), {
    status: "playing"
  });
};

window.finishGame = async function (id) {
  await updateDoc(doc(db, "players", id), {
    status: "rest",
    games: increment(1)
  });
};

window.toIdle = async function (id) {
  await updateDoc(doc(db, "players", id), {
    status: "idle"
  });
};

window.addShuttle = async function (id) {
  await updateDoc(doc(db, "players", id), {
    shuttles: increment(1)
  });
};

// ================================
// ➕ Increment Helper
// ================================
import { increment } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
