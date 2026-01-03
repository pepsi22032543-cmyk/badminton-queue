console.log("APP.JS WORKING");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ===== Firebase ===== */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===== DOM ===== */
const nameInput = document.getElementById("nameInput");
const playerList = document.getElementById("playerList");
const playList = document.getElementById("playList");
const restList = document.getElementById("restList");

/* ===== ADD PLAYER ===== */
window.addPlayer = async () => {
  const name = nameInput.value.trim();
  if (!name) return;

  await addDoc(collection(db, "players"), {
    name,
    status: "waiting",
    startTime: null,
    games: 0,
    shuttles: 0
  });

  nameInput.value = "";
};

/* ===== TIME ===== */
function formatTime(ms) {
  if (!ms) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

/* ===== ACTIONS ===== */
window.play = async (id, games) => {
  await updateDoc(doc(db, "players", id), {
    status: "playing",
    startTime: Date.now(),
    games: games + 1
  });
};

window.rest = async id => {
  await updateDoc(doc(db, "players", id), {
    status: "resting",
    startTime: Date.now()
  });
};

window.admit = async id => {
  await updateDoc(doc(db, "players", id), {
    status: "waiting",
    startTime: null
  });
};

window.addShuttle = async (id, value) => {
  await updateDoc(doc(db, "players", id), {
    shuttles: Math.max(0, value)
  });
};

window.summary = (name, games, shuttles) => {
  alert(`📊 ${name}\n\n🎮 ${games} เกม\n🏸 ${shuttles} ลูก`);
};

/* ===== RENDER ===== */
function renderPlayer(p, id) {
  const div = document.createElement("div");
  div.className = "card";

  const time = p.startTime ? formatTime(Date.now() - p.startTime) : "-";

  div.innerHTML = `
    <strong>${p.name}</strong><br>
    ⏱️ ${time}<br>
    🎮 ${p.games} | 🏸 ${p.shuttles}
    <div class="btns"></div>
  `;

  const b = div.querySelector(".btns");

  if (p.status === "waiting") {
    b.innerHTML = `<button onclick="play('${id}', ${p.games})">ลงสนาม</button>`;
  }

  if (p.status === "playing") {
    b.innerHTML = `
      <button onclick="rest('${id}')">พัก</button>
      <button onclick="addShuttle('${id}', ${p.shuttles + 1})">➕ ลูก</button>
      <button onclick="addShuttle('${id}', ${p.shuttles - 1})">➖ ลูก</button>
      <button onclick="admit('${id}')">Admit</button>
      <button onclick="summary('${p.name}',${p.games},${p.shuttles})">สรุป</button>
    `;
  }

  if (p.status === "resting") {
    b.innerHTML = `
      <button onclick="play('${id}', ${p.games})">ลงสนาม</button>
      <button onclick="admit('${id}')">Admit</button>
    `;
  }

  return div;
}

/* ===== SNAPSHOT ===== */
onSnapshot(collection(db, "players"), snap => {
  playerList.innerHTML = "";
  playList.innerHTML = "";
  restList.innerHTML = "";

  snap.forEach(d => {
    const p = d.data();
    const card = renderPlayer(p, d.id);

    if (p.status === "waiting") playerList.appendChild(card);
    if (p.status === "playing") playList.appendChild(card);
    if (p.status === "resting") restList.appendChild(card);
  });
});
