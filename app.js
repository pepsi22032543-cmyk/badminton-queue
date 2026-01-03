import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* 🔥 Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyD0QOhzwkYtMMdkJfe5-bo-PG8MzsVzicY",
  authDomain: "running-badminton-game.firebaseapp.com",
  projectId: "running-badminton-game"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const playingList = document.getElementById("playingList");
const waitingList = document.getElementById("waitingList");

/* ⏱️ แปลงเวลาเป็น HH:MM:SS */
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* 🔄 เปลี่ยนสถานะ */
async function toggleStatus(id, status) {
  const ref = doc(db, "players", id);

  if (status === "rest") {
    await updateDoc(ref, { status: "playing" });
  } else {
    await updateDoc(ref, {
      status: "rest",
      lastPlayed: serverTimestamp()
    });
  }
}

/* 📡 ดึงข้อมูล */
const q = query(collection(db, "players"));
let cachedPlayers = [];

onSnapshot(q, (snapshot) => {
  cachedPlayers = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
});

/* 🔁 อัปเดตจอทุก 1 วินาที */
setInterval(() => {
  playingList.innerHTML = "";
  waitingList.innerHTML = "";

  const now = Date.now();

  const playing = cachedPlayers.filter(p => p.status === "playing");
  const waiting = cachedPlayers.filter(p => p.status !== "playing");

  // เรียงคนรอคิว: พักนานสุดอยู่บน
  waiting.sort((a, b) => {
    const aTime = a.lastPlayed?.toDate()?.getTime() || 0;
    const bTime = b.lastPlayed?.toDate()?.getTime() || 0;
    return aTime - bTime;
  });

  playing.forEach(p => {
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `
      <div>
        <div class="player-name">${p.name}</div>
        <div class="player-time">🔥 กำลังเล่น</div>
      </div>
      <button>พัก</button>
    `;
    card.querySelector("button").onclick = () =>
      toggleStatus(p.id, p.status);

    playingList.appendChild(card);
  });

  waiting.forEach(p => {
    const last = p.lastPlayed?.toDate()?.getTime() || now;
    const duration = formatDuration(now - last);

    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `
      <div>
        <div class="player-name">${p.name}</div>
        <div class="player-time">⏱️ พัก ${duration}</div>
      </div>
      <button>ลงสนาม</button>
    `;
    card.querySelector("button").onclick = () =>
      toggleStatus(p.id, p.status);

    waitingList.appendChild(card);
  });
}, 1000);
