import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyD0QOhzwkYtMMdkJfe5-bo-PG8MzsVzicY",
  authDomain: "running-badminton-game.firebaseapp.com",
  projectId: "running-badminton-game"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const playingList = document.getElementById("playingList");
const waitingList = document.getElementById("waitingList");

let cachedPlayers = [];

/* ➕ เพิ่มผู้เล่น */
window.addPlayer = async () => {
  const input = document.getElementById("nameInput");
  const name = input.value.trim();
  if (!name) return;

  await addDoc(collection(db, "players"), {
    name,
    status: "rest",
    lastPlayed: serverTimestamp(),
    selected: false
  });

  input.value = "";
};

/* 🗑️ ลบผู้เล่นที่ติ๊ก */
window.deleteSelected = async () => {
  const selected = cachedPlayers.filter(p => p.selected);
  if (selected.length === 0) {
    alert("ยังไม่ได้เลือกผู้เล่น");
    return;
  }

  if (!confirm(`ลบ ${selected.length} คน ใช่หรือไม่?`)) return;

  for (const p of selected) {
    await deleteDoc(doc(db, "players", p.id));
  }
};

/* ⏱️ แปลงเวลา HH:MM:SS */
function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
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

/* ☑️ ติ๊กเลือก */
async function toggleSelect(id, current) {
  await updateDoc(doc(db, "players", id), {
    selected: !current
  });
}

/* 📡 ดึงข้อมูล */
onSnapshot(query(collection(db, "players")), snap => {
  cachedPlayers = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
});

/* 🔁 อัปเดตหน้าจอทุกวินาที */
setInterval(() => {
  playingList.innerHTML = "";
  waitingList.innerHTML = "";

  const now = Date.now();

  const playing = cachedPlayers.filter(p => p.status === "playing");
  const waiting = cachedPlayers.filter(p => p.status !== "playing");

  // เรียงรอคิว: พักนานสุดก่อน
  waiting.sort((a, b) => {
    const at = a.lastPlayed?.toDate()?.getTime() || 0;
    const bt = b.lastPlayed?.toDate()?.getTime() || 0;
    return at - bt;
  });

  const render = (p, container, isPlaying) => {
    const last = p.lastPlayed?.toDate()?.getTime() || now;
    const timeText = isPlaying
      ? "🔥 กำลังเล่น"
      : `⏱️ พัก ${formatDuration(now - last)}`;

    const div = document.createElement("div");
    div.className = "player-card";
    div.innerHTML = `
      <label>
        <input type="checkbox" ${p.selected ? "checked" : ""}>
        <strong>${p.name}</strong>
      </label>
      <div class="player-time">${timeText}</div>
      <button>${isPlaying ? "พัก" : "ลงสนาม"}</button>
    `;

    div.querySelector("input").onclick = () =>
      toggleSelect(p.id, p.selected);

    div.querySelector("button").onclick = () =>
      toggleStatus(p.id, p.status);

    container.appendChild(div);
  };

  playing.forEach(p => render(p, playingList, true));
  waiting.forEach(p => render(p, waitingList, false));

}, 1000);
