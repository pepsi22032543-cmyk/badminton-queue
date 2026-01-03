import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore, collection, addDoc,
  onSnapshot, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 🔥 ใส่ firebaseConfig ของคุณตรงนี้
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const restList = document.getElementById("restList");
const playList = document.getElementById("playList");

window.addPlayer = async () => {
  const name = nameInput.value.trim();
  if (!name) return;

  await addDoc(collection(db, "players"), {
    name,
    status: "rest",
    restStart: Date.now()
  });

  nameInput.value = "";
};

onSnapshot(collection(db, "players"), (snapshot) => {
  restList.innerHTML = "";
  playList.innerHTML = "";

  snapshot.forEach(docSnap => {
    const p = docSnap.data();
    const li = document.createElement("li");

    if (p.status === "rest") {
      const min = Math.floor((Date.now() - p.restStart) / 60000);
      li.innerHTML = `
        ${p.name} (พัก ${min} นาที)
        <button onclick="goPlay('${docSnap.id}')">ลงสนาม</button>
      `;
      restList.appendChild(li);
    } else {
      li.innerHTML = `
        ${p.name}
        <button onclick="goRest('${docSnap.id}')">ออกมาพัก</button>
      `;
      playList.appendChild(li);
    }
  });
});

window.goPlay = async (id) => {
  await updateDoc(doc(db, "players", id), {
    status: "play"
  });
};

window.goRest = async (id) => {
  await updateDoc(doc(db, "players", id), {
    status: "rest",
    restStart: Date.now()
  });
};

