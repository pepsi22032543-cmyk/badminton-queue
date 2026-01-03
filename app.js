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

/* 🔥 Firebase */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* DOM */
const nameInput = document.getElementById("nameInput");
const poolList = document.getElementById("poolList");
const playingList = document.getElementById("playingList");
const restList = document.getElementById("restList");

/* เพิ่มผู้เล่น */
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

/* เวลา HH:MM:SS */
function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* Render */
function renderPlayer(d) {
  const p = d.data();
  const id = d.id;
  const div = document.createElement("div");
  div.className = "player-card";

  /* รายชื่อ */
  if (p.status === "pool") {
    div.innerHTML = `
      <strong>${p.name}</strong><br>
      <button>ลงสนาม</button>
      <button class="danger">ลบ</button>
    `;
    div.children[1].onclick = () =>
      updateDoc(doc(db, "players", id), {
        status: "playing",
        gamesPlayed: p.gamesPlayed + 1
      });
    div.children[2].onclick = () =>
      deleteDoc(doc(db, "players", id));
    poolList.appendChild(div);
  }

  /* ลงสนาม */
  if (p.status === "playing") {
    div.innerHTML = `
      <strong>${p.name}</strong><br>
      🏸 ลูก: ${p.currentShuttle}<br>
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

  /* พัก */
  if (p.status === "rest") {
    const restMs = p.lastPlayed
      ? Date.now() - p.lastPlayed.toMillis()
      : 0;
    div.innerHTML = `
      <strong>${p.name}</strong><br>
      ⏱️ พัก: ${formatDuration(restMs)}<br>
      <button>ลงสนาม</button>
    `;
    div.children[2].onclick = () =>
      updateDoc(doc(db, "players", id), {
        status: "playing",
        gamesPlayed: p.gamesPlayed + 1
      });
    div.dataset.rest = restMs;
    restList.appendChild(div);
  }
}

/* Realtime */
onSnapshot(collection(db, "players"), snap => {
  poolList.innerHTML = "";
  playingList.innerHTML = "";
  restList.innerHTML = "";

  const rest = [];
  snap.forEach(d => {
    if (d.data().status === "rest") rest.push(d);
    else renderPlayer(d);
  });

  rest.sort((a, b) =>
    (Date.now() - b.data().lastPlayed?.toMillis()) -
    (Date.now() - a.data().lastPlayed?.toMillis())
  ).forEach(renderPlayer);
});

/* Auto Reset 05:00 */
(async function autoReset() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (now.getHours() >= 5 && localStorage.getItem("reset") !== today) {
    const snap = await getDocs(collection(db, "players"));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, "players", d.id));
    }
    localStorage.setItem("reset", today);
  }
})();
