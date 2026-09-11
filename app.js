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
// 1. KONFIGURASI FIREBASE & SETTING
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

// DAFTAR EMAIL ADMIN (Ganti dengan email Gmail Anda)
const ADMIN_EMAILS = [
  "THISISART655@gmail.com" // <-- MASUKKAN EMAIL ADMIN DI SINI (HURUF KECIL)
];

// MASUKKAN URL GOOGLE APPS SCRIPT DARI SPREADSHEET ANDA DI SINI
const GOOGLE_SHEET_URL = "URL_WEB_APP_GOOGLE_SCRIPT_ANDA";

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Variabel Penampung Kuis
let currentQuestions = [];
let userAnswers = {};
let activeQuizTitle = "";

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
// 4. MANAGEMENT MATERI (FIRESTORE CRUD)
// ==========================================

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
    listContainer.innerHTML = "<p style='text-align:center; color:red;'>Gagal memuat materi.</p>";
  }
}

// ==========================================
// 5. MANAGEMENT LATIHAN (PILIHAN GANDA & SKOR)
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

    // Clear Input Form
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

// Load Soal Pilihan Ganda dari Database
async function loadLatihan() {
  const listContainer = document.getElementById("latihan-list");
  if (!listContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "latihan"));
    listContainer.innerHTML = "";
    currentQuestions = [];
    userAnswers = {};

    if (querySnapshot.empty) {
      listContainer.innerHTML = "<p style='text-align:center;'>Belum ada latihan/kuis. Tambahkan soal baru sebagai Admin!</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      currentQuestions.push({ id, ...data });
      activeQuizTitle = data.title;

      const opts = data.options || {};
      listContainer.innerHTML += `
        <div class="card glass" style="text-align: left; margin-bottom: 15px; padding: 20px;">
          <div class="card-body">
            <span style="font-size: 0.8rem; background: #ee5253; color: white; padding: 3px 10px; border-radius: 12px; font-weight: bold;">
              ${data.title}
            </span>
            <h3 style="margin-top: 10px;">${data.question}</h3>
            
            <div class="quiz-options" style="display: flex; flex-direction: column; gap: 10px; margin: 15px 0;">
              ${['A', 'B', 'C', 'D'].map(opt => `
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; background: rgba(255,255,255,0.6); padding: 10px; border-radius: 8px;">
                  <input type="radio" name="q_${id}" value="${opt}" onchange="selectAnswer('${id}', '${opt}')">
                  <b>${opt}.</b> ${opts[opt] || ''}
                </label>
              `).join('')}
            </div>

            <div class="admin-actions admin-only" style="margin-top: 10px;">
              <button class="btn-icon delete" onclick="deleteData('latihan', '${id}')" title="Hapus Soal">
                <i class="fa-solid fa-trash"></i> Hapus Soal
              </button>
            </div>
          </div>
        </div>
      `;
    });

    // Tambahkan Tombol Submit Jawaban di bagian bawah daftar soal
    listContainer.innerHTML += `
      <div style="text-align:center; margin: 25px 0;">
        <button class="btn-primary" onclick="submitQuiz()" style="padding: 12px 30px; font-size: 1.1rem;">
          🚀 Kirim Jawaban & Lihat Skor
        </button>
        <div id="quiz-result" style="margin-top:15px; font-weight:bold;"></div>
      </div>
    `;

  } catch (err) {
    console.error("Error load latihan:", err);
    listContainer.innerHTML = "<p style='text-align:center; color:red;'>Gagal memuat latihan.</p>";
  }
}

// Rekam Pilihan Jawaban Siswa
window.selectAnswer = (qId, option) => {
  userAnswers[qId] = option;
};

// Hitung Skor & Simpan ke Google Sheets
window.submitQuiz = async () => {
  const user = auth.currentUser;
  if (!user) {
    return alert("Silakan Login dengan akun Google terlebih dahulu untuk mengirim jawaban kuis!");
  }

  if (Object.keys(userAnswers).length < currentQuestions.length) {
    if (!confirm("Masih ada soal yang belum Anda jawab. Yakin ingin mengumpulkan sekarang?")) return;
  }

  let correctCount = 0;
  currentQuestions.forEach(q => {
    if (userAnswers[q.id] === q.correctAnswer) {
      correctCount++;
    }
  });

  const finalScore = Math.round((correctCount / currentQuestions.length) * 100);
  const resultDiv = document.getElementById("quiz-result");
  resultDiv.innerHTML = `Mengirim nilai... ⏳`;

  const payload = {
    nama: user.displayName || "Siswa",
    email: user.email,
    judul: activeQuizTitle || "Latihan Pilihan Ganda",
    skor: finalScore
  };

  try {
    if (GOOGLE_SHEET_URL && GOOGLE_SHEET_URL !== "URL_WEB_APP_GOOGLE_SCRIPT_ANDA") {
      await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    resultDiv.innerHTML = `
      <div style="background:#d4edda; color:#155724; padding:15px; border-radius:10px; font-size:1.2rem; border:1px solid #c3e6cb;">
        🎉 Selamat <b>${payload.nama}</b>! Skor Anda: <b>${finalScore} / 100</b> (${correctCount} dari ${currentQuestions.length} Soal Benar)<br>
        <small>(Nilai telah berhasil disimpan)</small>
      </div>
    `;
  } catch (err) {
    console.error("Gagal kirim skor:", err);
    resultDiv.innerHTML = `<span style="color:red;">Gagal menyimpan nilai ke spreadsheet.</span>`;
  }
};

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
