import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* 🔥 Firebase Config */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* 📦 DOM */
const nameInput = document.getElementById("nameInput");
const poolList = document.getElementById("poolList");
const playingList = document.getElementById("playingList");
const restList = document.getElementById("restList");

/* ➕ เพิ่มผู้เล่น */
window.addPlayer = async () => {
  const name = nameInput.value.trim();
  if (!name) return;

  await addDoc(collection(db, "players"), {
    name,
    status: "pool",
    gamesPlayed: 0,
    shuttleUsed: 0,
    currentShuttle: 0,
    lastPlayed: null
  });

  nameInput.value = "";
};

/* ⏱️ แปลงเวลาเป็น HH:MM:SS */
function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* 🎨 Render */
function renderPlayer(docSnap) {
  const p = docSnap.data();
  const id = docSnap.id;
  const div = document.createElement("div");
  div.className = "player-card";

  /* 🧍 Player Pool */
  if (p.status === "pool") {
    div.innerHTML = `
      <strong>${p.name}</strong>
      <button>ลงสนาม</button>
      <button class="danger">ลบ</button>
    `;

    div.children[1].onclick = () =>
      updateDoc(doc(db, "players", id), {
        status: "playing",
        gamesPlayed: p.gamesPlayed + 1,
        currentShuttle: 0
      });

    div.children[2].onclick = () =>
      deleteDoc(doc(db, "players", id));

    poolList.appendChild(div);
  }

  /* 🔥 Playing */
  if (p.status === "playing") {
    div.innerHTML = `
      <strong>${p.name}</strong>
      <div>🏸 ลูก: ${p.currentShuttle}</div>
      <button>➕ ลูก</button>
      <button>➖ ลูก</button>
      <button class="danger">พัก</button>
    `;

    div.children[2].onclick = () =>
      updateDoc(doc(db, "players", id), {
        currentShuttle: p.currentShuttle + 1,
        shuttleUsed: p.shuttleUsed + 1
      });

    div.children[3].onclick = () =>
      p.currentShuttle > 0 &&
      updateDoc(doc(db, "players", id), {
        currentShuttle: p.currentShuttle - 1
      });

    div.children[4].onclick = () =>
      updateDoc(doc(db, "players", id), {
        status: "rest",
        lastPlayed: serverTimestamp(),
        currentShuttle: 0
      });

    playingList.appendChild(div);
  }

  /* ⏱️ Rest */
  if (p.status === "rest") {
    const now = Date.now();
    const restMs = p.lastPlayed
      ? now - p.lastPlayed.toMillis()
      : 0;

    div.innerHTML = `
      <strong>${p.name}</strong>
      <div>พัก: ${formatDuration(restMs)}</div>
      <button>ลงสนาม</button>
    `;

    div.children[2].onclick = () =>
      updateDoc(doc(db, "players", id), {
        status: "playing",
        gamesPlayed: p.gamesPlayed + 1
      });

    restList.appendChild(div);
    div.dataset.rest = restMs;
  }
}

/* 🔄 Realtime Update */
onSnapshot(collection(db, "players"), snap => {
  poolList.innerHTML = "";
  playingList.innerHTML = "";
  restList.innerHTML = "";

  const restPlayers = [];

  snap.forEach(d => {
    if (d.data().status === "rest") restPlayers.push(d);
    else renderPlayer(d);
  });

  restPlayers
    .sort((a, b) =>
      (Date.now() - b.data().lastPlayed?.toMillis()) -
      (Date.now() - a.data().lastPlayed?.toMillis())
    )
    .forEach(renderPlayer);
});

/* ⏰ Auto Reset 05:00 */
async function autoResetAtFiveAM() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const lastReset = localStorage.getItem("lastResetDate");

  if (now.getHours() >= 5 && lastReset !== today) {
    const snap = await getDocs(collection(db, "players"));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, "players", d.id));
    }
    localStorage.setItem("lastResetDate", today);
    alert("🔄 Auto Reset เวลา 05:00");
  }
}

autoResetAtFiveAM();
