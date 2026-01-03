import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* 🔥 Firebase config */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const playerList = document.getElementById("playerList");
const playList = document.getElementById("playList");
const restList = document.getElementById("restList");

/* ================= ADD PLAYER ================= */
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

/* ================= TIME FORMAT ================= */
function formatTime(ms) {
  if (!ms) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ================= ACTIONS ================= */
async function setStatus(id, status, incGame = false) {
  await updateDoc(doc(db, "players", id), {
    status,
    startTime: Date.now(),
    games: incGame ? 1 : undefined
  });
}

async function addShuttle(id, delta) {
  await updateDoc(doc(db, "players", id), {
    shuttles: Math.max(0, delta)
  });
}

async function admitBack(id) {
  await updateDoc(doc(db, "players", id), {
    status: "waiting",
    startTime: null
  });
}

/* ================= RENDER ================= */
function renderPlayer(p, id) {
  const elapsed = p.startTime ? formatTime(Date.now() - p.startTime) : "-";

  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <strong>${p.name}</strong><br>
    ⏱️ ${elapsed}<br>
    🎮 ${p.games} เกม | 🏸 ${p.shuttles} ลูก
    <div class="btns"></div>
  `;

  const btns = div.querySelector(".btns");

  if (p.status === "waiting") {
    btns.innerHTML = `
      <button onclick="setPlay('${id}')">ลงสนาม</button>
    `;
  }

  if (p.status === "playing") {
    btns.innerHTML = `
      <button onclick="toRest('${id}')">พัก</button>
      <button onclick="shuttlePlus('${id}', ${p.shuttles + 1})">➕ ลูก</button>
      <button onclick="shuttlePlus('${id}', ${p.shuttles - 1})">➖ ลูก</button>
      <button onclick="admit('${id}')">Admit</button>
      <button onclick="summary('${p.name}',${p.games},${p.shuttles})">สรุป</button>
    `;
  }

  if (p.status === "resting") {
    btns.innerHTML = `
      <button onclick="setPlay('${id}', true)">ลงสนาม</button>
      <button onclick="admit('${id}')">Admit</button>
    `;
  }

  return div;
}

/* ================= GLOBAL FUNCTIONS ================= */
window.setPlay = async (id, inc = false) => {
  await updateDoc(doc(db, "players", id), {
    status: "playing",
    startTime: Date.now(),
    games: inc ? increment(1) : undefined
  });
};

window.toRest = async id => {
  await updateDoc(doc(db, "players", id), {
    status: "resting",
    startTime: Date.now()
  });
};

window.shuttlePlus = async (id, value) => {
  await updateDoc(doc(db, "players", id), {
    shuttles: Math.max(0, value)
  });
};

window.admit = admitBack;

window.summary = (name, games, shuttles) => {
  alert(`📊 ${name}\n\n🎮 เล่น: ${games} เกม\n🏸 ใช้ลูก: ${shuttles} ลูก`);
};

/* ================= REALTIME UPDATE ================= */
setInterval(() => {
  document.querySelectorAll(".card").forEach(() => {});
}, 1000);

/* ================= SNAPSHOT ================= */
onSnapshot(collection(db, "players"), snap => {
  playerList.innerHTML = "";
  playList.innerHTML = "";
  restList.innerHTML = "";

  snap.forEach(docu => {
    const p = docu.data();
    const card = renderPlayer(p, docu.id);

    if (p.status === "waiting") playerList.appendChild(card);
    if (p.status === "playing") playList.appendChild(card);
    if (p.status === "resting") restList.appendChild(card);
  });
});
