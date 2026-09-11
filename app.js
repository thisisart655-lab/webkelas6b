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

// ==========================================
// 1. KONFIGURASI FIREBASE & ADMIN
// ==========================================

// Ganti nilai di bawah ini dengan Project Settings dari Firebase Console Anda!
const firebaseConfig = {
   apiKey: "AIzaSyBJETCKPOLwFnVp8Q8Zev6tL_MJAsxAAJc",
  authDomain: "kelas6b-bfc03.firebaseapp.com",
  databaseURL: "https://kelas6b-bfc03-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kelas6b-bfc03",
  storageBucket: "kelas6b-bfc03.firebasestorage.app",
  messagingSenderId: "632145539568",
  appId: "1:632145539568:web:8a4b76f0dd5314cb97ed35"
};

// DAFTAR EMAIL ADMIN (Ganti dengan email Gmail Anda yang digunakan saat login)
const ADMIN_EMAILS = [
  "thisisart655@gmail.com" // <-- MASUKKAN EMAIL ANDA DI SINI (HURUF KECIL)
];

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ==========================================
// 2. LOGIC AUTHENTICATION (GOOGLE SIGN IN)
// ==========================================

window.loginGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Gagal Login: " + error.message);
  }
};

window.logout = () => {
  signOut(auth).then(() => {
    alert("Berhasil Keluar!");
    window.location.reload();
  });
};

// Monitoring Status Login User (Deteksi Admin)
onAuthStateChanged(auth, (user) => {
  const profileContainer = document.getElementById("userProfile");
  const heroLoginBtn = document.getElementById("heroLoginBtn");

  if (user) {
    const userEmail = user.email ? user.email.toLowerCase().trim() : "";
    const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail);

    // Debugger Log di Console F12 Browser
    console.log("=== STATUS LOGIN USER ===");
    console.log("Email Terdeteksi:", userEmail);
    console.log("Status Admin     :", isAdmin ? "YA (Admin)" : "TIDAK (Siswa)");

    // Jika Admin, tambahkan class 'is-admin' di body HTML
    if (isAdmin) {
      document.body.classList.add("is-admin");
    } else {
      document.body.classList.remove("is-admin");
    }

    // Tampilan Profil Navbar
    if (profileContainer) {
      profileContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${user.photoURL}" style="width:35px; height:35px; border-radius:50%;">
          <span style="font-weight:bold;">
            ${user.displayName ? user.displayName.split(" ")[0] : 'User'} 
            ${isAdmin ? '<b style="color: #ff4757;">(Admin)</b>' : ''}
          </span>
          <button onclick="logout()" class="btn-danger" style="padding: 5px 12px; font-size: 0.8rem;">Keluar</button>
        </div>
      `;
    }
    
    if (heroLoginBtn) heroLoginBtn.style.display = "none";

  } else {
    document.body.classList.remove("is-admin");
    
    if (profileContainer) {
      profileContainer.innerHTML = `
        <button class="btn-google" onclick="loginGoogle()">
          <i class="fa-brands fa-google"></i> Masuk Google
        </button>
      `;
    }
    if (heroLoginBtn) heroLoginBtn.style.display = "inline-block";
  }
});

// ==========================================
// 3. NAVIGASI HALAMAN (SINGLE PAGE APP)
// ==========================================

window.switchPage = (pageName) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) targetPage.classList.add('active');

  const activeNav = Array.from(document.querySelectorAll('.nav-item'))
                         .find(a => a.getAttribute('onclick') && a.getAttribute('onclick').includes(pageName));
  if (activeNav) activeNav.classList.add('active');
};

// Toggle Buka/Tutup Form Admin
window.toggleAdminForm = (type) => {
  const container = document.getElementById(`form-${type}-container`);
  if (container) container.classList.toggle('hidden');
};

// ==========================================
// 4. MANAGEMENT MATERI (FIRESTORE CRUD)
// ==========================================

// Simpan Materi Baru
window.saveMateri = async () => {
  const title = document.getElementById('materi-title').value;
  const img = document.getElementById('materi-img').value;
  const desc = document.getElementById('materi-desc').value;

  if (!title || !desc) return alert("Harap isi Judul dan Deskripsi Materi!");

  try {
    await addDoc(collection(db, "materi"), {
      title,
      img: img || "https://img.freepik.com/free-vector/cute-animals-holding-numbers-banner_1308-43306.jpg",
      desc,
      createdAt: new Date()
    });

    alert("Materi berhasil disimpan!");
    document.getElementById('materi-title').value = '';
    document.getElementById('materi-img').value = '';
    document.getElementById('materi-desc').value = '';
    toggleAdminForm('materi');
    loadMateri();
  } catch (e) {
    alert("Gagal menyimpan materi: " + e.message);
  }
};

// Load Materi dari Database
async function loadMateri() {
  const listContainer = document.getElementById("materi-list");
  if (!listContainer) return;
  listContainer.innerHTML = "<p style='text-align:center;'>Memuat materi...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "materi"));
    listContainer.innerHTML = "";

    if (querySnapshot.empty) {
      listContainer.innerHTML = "<p style='text-align:center;'>Belum ada materi pembelajaran.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      listContainer.innerHTML += `
        <div class="card glass">
          <img src="${data.img || 'https://img.freepik.com/free-vector/cute-animals-holding-numbers-banner_1308-43306.jpg'}" alt="${data.title}">
          <div class="card-body">
            <h3>${data.title}</h3>
            <p>${data.desc}</p>
            <div class="card-footer">
              <button class="btn-small btn-primary">Baca Materi</button>
              <div class="admin-actions admin-only">
                <button class="btn-icon delete" onclick="deleteData('materi', '${docSnap.id}')" title="Hapus Materi">
                  <i class="fa-solid fa-trash"></i> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error load materi:", err);
    listContainer.innerHTML = "<p style='text-align:center; color:red;'>Gagal memuat materi.</p>";
  }
}

// ==========================================
// 5. MANAGEMENT LATIHAN (FIRESTORE CRUD)
// ==========================================

// Simpan Soal Latihan Baru
window.saveLatihan = async () => {
  const title = document.getElementById('latihan-title').value;
  const question = document.getElementById('latihan-question').value;
  const link = document.getElementById('latihan-link').value;

  if (!title || !question) return alert("Harap isi Judul dan Pertanyaan Latihan!");

  try {
    await addDoc(collection(db, "latihan"), {
      title,
      question,
      link: link || "#",
      createdAt: new Date()
    });

    alert("Latihan berhasil disimpan!");
    document.getElementById('latihan-title').value = '';
    document.getElementById('latihan-question').value = '';
    document.getElementById('latihan-link').value = '';
    toggleAdminForm('latihan');
    loadLatihan();
  } catch (e) {
    alert("Gagal menyimpan latihan: " + e.message);
  }
};

// Load Latihan dari Database
async function loadLatihan() {
  const listContainer = document.getElementById("latihan-list");
  if (!listContainer) return;
  listContainer.innerHTML = "<p style='text-align:center;'>Memuat latihan...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "latihan"));
    listContainer.innerHTML = "";

    if (querySnapshot.empty) {
      listContainer.innerHTML = "<p style='text-align:center;'>Belum ada latihan/kuis.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      listContainer.innerHTML += `
        <div class="card glass">
          <div class="card-body">
            <h3>${data.title}</h3>
            <p>${data.question}</p>
            <div class="card-footer">
              <a href="${data.link || '#'}" target="_blank">
                <button class="btn-small btn-success">Mulai Main 🎲</button>
              </a>
              <div class="admin-actions admin-only">
                <button class="btn-icon delete" onclick="deleteData('latihan', '${docSnap.id}')" title="Hapus Latihan">
                  <i class="fa-solid fa-trash"></i> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error load latihan:", err);
    listContainer.innerHTML = "<p style='text-align:center; color:red;'>Gagal memuat latihan.</p>";
  }
}

// ==========================================
// 6. HAPUS DATA (ADMIN ONLY)
// ==========================================

window.deleteData = async (colName, id) => {
  if (confirm("Yakin ingin menghapus data ini secara permanen?")) {
    try {
      await deleteDoc(doc(db, colName, id));
      alert("Data berhasil dihapus!");
      if (colName === 'materi') loadMateri();
      else loadLatihan();
    } catch (e) {
      alert("Gagal menghapus data: " + e.message);
    }
  }
};

// Inisialisasi awal saat halaman selesai dimuat
loadMateri();
loadLatihan();
