import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. ISI KONFIGURASI FIREBASE ANDA DI SINI
const firebaseConfig = {
 apiKey: "AIzaSyBJETCKPOLwFnVp8Q8Zev6tL_MJAsxAAJc",
  authDomain: "kelas6b-bfc03.firebaseapp.com",
  databaseURL: "https://kelas6b-bfc03-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kelas6b-bfc03",
  storageBucket: "kelas6b-bfc03.firebasestorage.app",
  messagingSenderId: "632145539568",
  appId: "1:632145539568:web:8a4b76f0dd5314cb97ed35"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// DAFTAR EMAIL ADMIN (Ganti dengan email Google Anda yang bertindak sebagai Admin)
const ADMIN_EMAILS = ["emailanda@gmail.com"];

// --- 2. LOGIC AUTHENTICATION (GOOGLE SIGN IN) ---
window.loginGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Gagal Login: " + error.message);
  }
};

window.logout = () => {
  signOut(auth).then(() => alert("Berhasil Keluar!"));
};

// Deteksi status Login User
onAuthStateChanged(auth, (user) => {
  const profileContainer = document.getElementById("userProfile");
  const heroLoginBtn = document.getElementById("heroLoginBtn");

  if (user) {
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    // Set status admin di DOM body
    if (isAdmin) {
      document.body.classList.add("is-admin");
    } else {
      document.body.classList.remove("is-admin");
    }

    // Tampilan User Navbar
    profileContainer.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${user.photoURL}" style="width:35px; height:35px; border-radius:50%;">
        <span style="font-weight:bold;">${user.displayName.split(" ")[0]} ${isAdmin ? '(Admin)' : ''}</span>
        <button onclick="logout()" class="btn-danger" style="padding: 5px 12px; font-size: 0.8rem;">Keluar</button>
      </div>
    `;
    if(heroLoginBtn) heroLoginBtn.style.display = "none";
  } else {
    document.body.classList.remove("is-admin");
    profileContainer.innerHTML = `
      <button class="btn-google" onclick="loginGoogle()">
        <i class="fa-brands fa-google"></i> Masuk Google
      </button>
    `;
    if(heroLoginBtn) heroLoginBtn.style.display = "inline-block";
  }
});

// --- 3. NAVIGASI HALAMAN (SPA) ---
window.switchPage = (pageName) => {
  // Sembunyikan semua page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Nonaktifkan semua link nav
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

  // Tampilkan page terpilih
  document.getElementById(`page-${pageName}`).classList.add('active');
  
  // Highlighting navbar link
  const activeNav = Array.from(document.querySelectorAll('.nav-item'))
                         .find(a => a.getAttribute('onclick').includes(pageName));
  if(activeNav) activeNav.classList.add('active');
};

// --- 4. ADMIN & FIRESTORE CRUD LOGIC ---
window.toggleAdminForm = (type) => {
  const container = document.getElementById(`form-${type}-container`);
  container.classList.toggle('hidden');
};

// SIMPAN MATERI KE FIRESTORE
window.saveMateri = async () => {
  const title = document.getElementById('materi-title').value;
  const img = document.getElementById('materi-img').value;
  const desc = document.getElementById('materi-desc').value;

  if(!title || !desc) return alert("Harap isi judul dan deskripsi!");

  try {
    await addDoc(collection(db, "materi"), {
      title,
      img: img || "https://img.freepik.com/free-vector/cute-animals-holding-numbers-banner_1308-43306.jpg",
      desc,
      createdAt: new Date()
    });
    alert("Materi berhasil disimpan!");
    document.getElementById('materi-title').value = '';
    document.getElementById('materi-desc').value = '';
    toggleAdminForm('materi');
    loadMateri();
  } catch (e) {
    alert("Error: " + e.message);
  }
};

// LOAD MATERI DARI FIRESTORE
async function loadMateri() {
  const listContainer = document.getElementById("materi-list");
  listContainer.innerHTML = "";
  
  const querySnapshot = await getDocs(collection(db, "materi"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    listContainer.innerHTML += `
      <div class="card glass">
        <img src="${data.img}" alt="${data.title}">
        <div class="card-body">
          <h3>${data.title}</h3>
          <p>${data.desc}</p>
          <div class="card-footer">
            <button class="btn-small btn-primary">Baca Materi</button>
            <div class="admin-actions admin-only">
              <button class="btn-icon delete" onclick="deleteData('materi', '${docSnap.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

// SIMPAN LATIHAN KE FIRESTORE
window.saveLatihan = async () => {
  const title = document.getElementById('latihan-title').value;
  const question = document.getElementById('latihan-question').value;
  const link = document.getElementById('latihan-link').value;

  if(!title || !question) return alert("Harap isi semua kolom!");

  try {
    await addDoc(collection(db, "latihan"), {
      title,
      question,
      link: link || "#",
      createdAt: new Date()
    });
    alert("Latihan berhasil disimpan!");
    toggleAdminForm('latihan');
    loadLatihan();
  } catch (e) {
    alert("Error: " + e.message);
  }
};

// LOAD LATIHAN DARI FIRESTORE
async function loadLatihan() {
  const listContainer = document.getElementById("latihan-list");
  listContainer.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "latihan"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    listContainer.innerHTML += `
      <div class="card glass">
        <div class="card-body">
          <h3>${data.title}</h3>
          <p>${data.question}</p>
          <div class="card-footer">
            <a href="${data.link}" target="_blank"><button class="btn-small btn-success">Mulai Main 🎲</button></a>
            <div class="admin-actions admin-only">
              <button class="btn-icon delete" onclick="deleteData('latihan', '${docSnap.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

// HAPUS DATA (ADMIN)
window.deleteData = async (colName, id) => {
  if(confirm("Yakin ingin menghapus data ini?")) {
    await deleteDoc(doc(db, colName, id));
    if(colName === 'materi') loadMateri();
    else loadLatihan();
  }
};

// Load data saat halaman pertama kali dibuka
loadMateri();
loadLatihan();