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

// Ganti nilai di bawah ini dengan Firebase Config asli Anda!
const firebaseConfig = {
 apiKey: "AIzaSyBJETCKPOLwFnVp8Q8Zev6tL_MJAsxAAJc",
  authDomain: "kelas6b-bfc03.firebaseapp.com",
  databaseURL: "https://kelas6b-bfc03-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kelas6b-bfc03",
  storageBucket: "kelas6b-bfc03.firebasestorage.app",
  messagingSenderId: "632145539568",
  appId: "1:632145539568:web:8a4b76f0dd5314cb97ed35"
};

// DAFTAR EMAIL ADMIN (Ganti dengan Gmail aktif Anda)
const ADMIN_EMAILS = [
  "thisisart655@gmail.com"
];

// Inisialisasi Firebase
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

// Monitoring Status Login
onAuthStateChanged(auth, (user) => {
  const profileContainer = document.getElementById("userProfile");
  const heroLoginBtn = document.getElementById("heroLoginBtn");

  if (user) {
    const userEmail = user.email ? user.email.toLowerCase().trim() : "";
    const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail);

    console.log("Status Login:", userEmail, "| Admin:", isAdmin);

    if (isAdmin) {
      document.body.classList.add("is-admin");
    } else {
      document.body.classList.remove("is-admin");
    }

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

window.toggleAdminForm = (type) => {
  const container = document.getElementById(`form-${type}-container`);
  if (container) container.classList.toggle('hidden');
};

// ==========================================
// 4. MANAGEMENT MATERI
// ==========================================

window.saveMateri = async () => {
  const title = document.getElementById('materi-title').value;
  const img = document.getElementById('materi-img').value;
  const desc = document.getElementById('materi-desc').value;

  if (!title || !desc) return alert("Harap isi Judul dan Deskripsi!");

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

async function loadMateri() {
  const listContainer = document.getElementById("materi-list");
  if (!listContainer) return;

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
  }
}

// ==========================================
// 5. MANAGEMENT LATIHAN (PILTIHAN GANDA)
// ==========================================

// Simpan Soal Pilihan Ganda Baru (Admin)
window.saveLatihan = async () => {
  const title = document.getElementById('latihan-title').value;
  const question = document.getElementById('latihan-question').value;
  const optA = document.getElementById('opt-a').value;
  const optB = document.getElementById('opt-b').value;
  const optC = document.getElementById('opt-c').value;
  const optD = document.getElementById('opt-d').value;
  const correctAnswer = document.getElementById('correct-answer').value;

  if (!title || !question || !optA || !optB || !optC || !optD) {
    return alert("Harap isi semua kolom pertanyaan dan pilihan jawaban!");
  }

  try {
    await addDoc(collection(db, "latihan"), {
      title,
      question,
      options: { A: optA, B: optB, C: optC, D: optD },
      correctAnswer,
      createdAt: new Date()
    });

    alert("Soal berhasil disimpan!");
    
    // Reset Form
    document.getElementById('latihan-title').value = '';
    document.getElementById('latihan-question').value = '';
    document.getElementById('opt-a').value = '';
    document.getElementById('opt-b').value = '';
    document.getElementById('opt-c').value = '';
    document.getElementById('opt-d').value = '';
    
    toggleAdminForm('latihan');
    loadLatihan();
  } catch (e) {
    alert("Gagal menyimpan latihan: " + e.message);
  }
};

// Load Soal dari Database ke Tampilan Siswa
async function loadLatihan() {
  const listContainer = document.getElementById("latihan-list");
  if (!listContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "latihan"));
    listContainer.innerHTML = "";

    if (querySnapshot.empty) {
      listContainer.innerHTML = "<p style='text-align:center;'>Belum ada latihan/kuis.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const opts = data.options || {};

      listContainer.innerHTML += `
        <div class="card glass" style="text-align: left;">
          <div class="card-body">
            <span style="font-size: 0.8rem; background: #ee5253; color: white; padding: 2px 8px; border-radius: 12px; font-weight: bold;">
              ${data.title}
            </span>
            <h3 style="margin-top: 10px;">${data.question}</h3>
            
            <!-- Pilihan Jawaban -->
            <div class="quiz-options" style="display: flex; flex-direction: column; gap: 8px; margin: 15px 0;">
              <button class="btn-option" onclick="checkAnswer('${id}', 'A', '${data.correctAnswer}')">A. ${opts.A || ''}</button>
              <button class="btn-option" onclick="checkAnswer('${id}', 'B', '${data.correctAnswer}')">B. ${opts.B || ''}</button>
              <button class="btn-option" onclick="checkAnswer('${id}', 'C', '${data.correctAnswer}')">C. ${opts.C || ''}</button>
              <button class="btn-option" onclick="checkAnswer('${id}', 'D', '${data.correctAnswer}')">D. ${opts.D || ''}</button>
            </div>

            <!-- Feedback Jawaban -->
            <div id="feedback-${id}" style="font-weight: bold; margin-top: 5px;"></div>

            <div class="card-footer" style="margin-top: 10px;">
              <div></div>
              <div class="admin-actions admin-only">
                <button class="btn-icon delete" onclick="deleteData('latihan', '${id}')" title="Hapus Latihan">
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
  }
}

// Fungsi Cek Jawaban Siswa
window.checkAnswer = (docId, selected, correct) => {
  const feedbackEl = document.getElementById(`feedback-${docId}`);
  if (!feedbackEl) return;

  if (selected === correct) {
    feedbackEl.innerHTML = `<span style="color: #10ac84;">🎉 Benar sekali! Jawaban Anda tepat.</span>`;
  } else {
    feedbackEl.innerHTML = `<span style="color: #ee5253;">❌ Masih kurang tepat. Coba lagi!</span>`;
  }
};

// ==========================================
// 6. HAPUS DATA (ADMIN)
// ==========================================

window.deleteData = async (colName, id) => {
  if (confirm("Yakin ingin menghapus data ini?")) {
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

// Jalankan saat pertama dimuat
loadMateri();
loadLatihan();
