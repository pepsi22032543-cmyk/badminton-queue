import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* 🔥 Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyD0QOhzwkYtMMdkJfe5-bo-PG8MzsVzicY",
  authDomain: "running-badminton-game.firebaseapp.com",
  projectId: "running-badminton-game",
  storageBucket: "running-badminton-game.firebasestorage.app",
  messagingSenderId: "377042482608",
  appId: "1:377042482608:web:eaa863b9b9219b71755275",
  measurementId: "G-BN1J1YZ27T"
};

/* init */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const playerList = document.getElementById("playerList");

/* ➕ เพิ่มผู้เล่น */
window.addPlayer = async function () {
  const input = document.getElementById("nameInput");
  const name = input.value.trim();
  if (!name) return;

  await addDoc(collection(db, "players"), {
    name,
    status: "rest",
    lastPlayed: serverTimestamp(),
    createdAt: serverTimestamp()
  });

  input.value = "";
};

/* ⏱ คำนวณเวลาพัก */
function getRestMinutes(lastPlayed) {
  if (!lastPlayed) return 0;
  const diff = Date.now() - lastPlayed.toDate().getTime();
  return Math.floor(diff / 60000);
}

/* 🔄 เปลี่ยนสถานะ */
async function toggleStatus(id, status) {
  const ref = doc(db, "players", id);

  if (status === "rest") {
    await updateDoc(ref, {
      status: "playing"
    });
  } else {
    await updateDoc(ref, {
      status: "rest",
      lastPlayed: serverTimestamp()
    });
  }
}

/* 📡 ดึงข้อมูล + เรียงเวลาพัก */
const q = query(collection(db, "players"), orderBy("lastPlayed", "asc"));

onSnapshot(q, (snapshot) => {
  playerList.innerHTML = "";

  const players = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // เรียง: พักนานสุดอยู่บน
  players.sort((a, b) => {
    const aRest = getRestMinutes(a.lastPlayed);
    const bRest = getRestMinutes(b.lastPlayed);
    return bRest - aRest;
  });

  players.forEach(player => {
    const restMin = getRestMinutes(player.lastPlayed);

    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <div>
        <div class="player-name">${player.name}</div>
        <div class="player-rest">
          ${player.status === "playing"
            ? "🔥 กำลังเล่น"
            : `⏱️ พัก ${restMin} นาที`}
        </div>
      </div>
      <button style="
        background:${player.status === "rest" ? "#22c55e" : "#f97316"};
        border:none;
        color:black;
        padding:8px 12px;
        border-radius:8px;
        cursor:pointer;
      ">
        ${player.status === "rest" ? "ลงสนาม" : "พัก"}
      </button>
    `;

    card.querySelector("button").onclick = () =>
      toggleStatus(player.id, player.status);

    playerList.appendChild(card);
  });
});
