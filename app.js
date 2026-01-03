import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* 🔹 Firebase Config */
const firebaseConfig = {
  apiKey: "AIzaSyD0QOhzwkYtMMdkJfe5-bo-PG8MzsVzicY",
  authDomain: "running-badminton-game.firebaseapp.com",
  projectId: "running-badminton-game",
  storageBucket: "running-badminton-game.firebasestorage.app",
  messagingSenderId: "377042482608",
  appId: "1:377042482608:web:eaa863b9b9219b71755275"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* 🔹 DOM */
const poolList = document.getElementById("playerList");
const playingList = document.getElementById("playList");
const restList = document.getElementById("restList");

/* 🔹 เพิ่มผู้เล่น */
window.addPlayer = async () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return;

  await addDoc(collection(db, "players"), {
    name,
    status: "pool",
    games: 0,
    shuttles: 0,
    lastPlayed: null,
    createdAt: serverTimestamp()
  });

  document.getElementById("nameInput").value = "";
};

/* 🔹 Render ผู้เล่น */
function renderPlayer(docSnap) {
  const p = docSnap.data();
  const id = docSnap.id;

  const div = document.createElement("div");
  div.className = "player-card";

  /* ⏱ เวลา */
  let timeText = "";
  if (p.lastPlayed) {
    const diff = Math.floor((Date.now() - p.lastPlayed.toMillis()) / 1000);
    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    timeText = `${h}:${m}:${s}`;
  }

  /* 🟢 รายชื่อผู้เล่น */
  if (p.status === "pool") {
    div.innerHTML = `
      <strong>${p.name}</strong>
      <button onclick="startPlay('${id}')">ลงสนาม</button>
      <button onclick="removePlayer('${id}')">ลบ</button>
    `;
    poolList.appendChild(div);
  }

  /* 🔥 กำลังลงสนาม */
  if (p.status === "playing") {
    div.innerHTML = `
      <strong>${p.name}</strong><br>
      เกม: ${p.games} | ลูก: ${p.shuttles}
      <div class="btn-row">
        <button onclick="addShuttle('${id}')">+1 ลูก</button>
        <button onclick="restPlayer('${id}')">พัก</button>
      </div>
    `;
    playingList.appendChild(div);
  }

  /* ⏱️ รอคิว */
  if (p.status === "rest") {
    div.innerHTML = `
      <strong>${p.name}</strong><br>
      พักแล้ว: ${timeText}
      <button onclick="startPlay('${id}')">ลงสนาม</button>
    `;
    restList.appendChild(div);
  }
}

/* 🔹 Firestore Listener (แก้ bug ชื่อหายแล้ว) */
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

/* 🔹 Actions */
window.startPlay = async (id) => {
  await updateDoc(doc(db, "players", id), {
    status: "playing",
    games: (await getCount(id, "games")) + 1
  });
};

window.restPlayer = async (id) => {
  await updateDoc(doc(db, "players", id), {
    status: "rest",
    lastPlayed: serverTimestamp()
  });
};

window.addShuttle = async (id) => {
  await updateDoc(doc(db, "players", id), {
    shuttles: (await getCount(id, "shuttles")) + 1
  });
};

window.removePlayer = async (id) => {
  await deleteDoc(doc(db, "players", id));
};

/* 🔹 Helper */
async function getCount(id, field) {
  const snap = await import(
    "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js"
  ).then(m => m.getDoc(doc(db, "players", id)));
  return snap.data()[field] || 0;
}

/* 🔹 Auto Reset 05:00 */
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 5 && now.getMinutes() === 0) {
    const snap = await import(
      "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js"
    ).then(m => m.getDocs(collection(db, "players")));
    snap.forEach(d => deleteDoc(d.ref));
  }
}, 60000);
