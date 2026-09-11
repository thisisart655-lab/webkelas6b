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
  updateDoc,
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. KONFIGURASI KUNCI (API KEY & SETTING)
// ==========================================

// 🔑 PASTE API KEY IMGBB ANDA DI SINI
const IMGBB_API_KEY = "a4effc02ebeca624eb55b122f22c8a25";

// 🔑 KONFIGURASI FIREBASE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyBJETCKPOLwFnVp8Q8Zev6tL_MJAsxAAJc",
  authDomain: "kelas6b-bfc03.firebaseapp.com",
  databaseURL: "https://kelas6b-bfc03-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kelas6b-bfc03",
  storageBucket: "kelas6b-bfc03.firebasestorage.app",
  messagingSenderId: "632145539568",
  appId: "1:632145539568:web:8a4b76f0dd5314cb97ed35"
};

// 📧 EMAIL ADMIN
const ADMIN_EMAILS = [
  "thisisart655@gmail.com"
];

// 📊 URL GOOGLE APPS SCRIPT
const GOOGLE_SHEET_URL = "URL_WEB_APP_GOOGLE_SCRIPT_ANDA";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentQuestions = [];
let userAnswers = {};
let activeQuizTitle = "";
let editMateriId = null;

// ==========================================
// 2. FUNGSI UPLOAD GAMBAR KE IMGBB (AUTOMATIC)
// ==========================================

async function uploadFileToImgBB(file) {
  if (!IMGBB_API_KEY || IMGBB_API_KEY === "a4effc02ebeca624eb55b122f22c8a25") {
    throw new Error("API Key ImgBB belum dimasukkan di app.js!");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  if (data.success) {
    return data.data.url; // Mengembalikan Direct Link URL Gambar
  } else {
    throw new Error("Gagal mengunggah ke ImgBB: " + (data.error ? data.error.message : "Error tidak diketahui"));
  }
}

// ==========================================
// 3. LOGIC AUTHENTICATION (LOGIN GOOGLE)
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

onAuthStateChanged(auth, (user) => {
  const profileContainer = document.getElementById("userProfile");
  const heroLoginBtn = document.getElementById("heroLoginBtn");

  if (user) {
    const userEmail = user.email ? user.email.toLowerCase().trim() : "";
    const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail);

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
// 4. NAVIGASI HALAMAN & UTILS
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
// 5. MANAGEMENT MATERI (MULTIPLE IMAGES + UPLOAD 1-KLIK)
// ==========================================

window.saveMateri = async () => {
  const title = document.getElementById('materi-title').value;
  const imgInput = document.getElementById('materi-img').value; // Link teks manual (opsional)
  const fileInput = document.getElementById('materi-file'); // Input file lokal (jika ada)
  const desc = document.getElementById('materi-desc').value;

  if (!title || !desc) return alert("Harap isi Judul dan Deskripsi Materi!");

  let images = [];

  try {
    // 1. Jika pengguna memilih file dari komputer/HP
    if (fileInput && fileInput.files.length > 0) {
      alert("Mengunggah gambar... Mohon tunggu sebentar ⏳");
      for (let i = 0; i < fileInput.files.length; i++) {
        const uploadedUrl = await uploadFileToImgBB(fileInput.files[i]);
        images.push(uploadedUrl);
      }
    } 
    // 2. Jika tidak ada file diupload, gunakan input URL manual dipisahkan koma
    else if (imgInput) {
      images = imgInput.split(',').map(url => url.trim());
    }

    // Gambar default jika tidak ada gambar sama sekali
    if (images.length === 0) {
      images = ["https://img.freepik.com/free-vector/cute-animals-holding-numbers-banner_1308-43306.jpg"];
    }

    if (editMateriId) {
      await updateDoc(doc(db, "materi", editMateriId), {
        title,
        images,
        desc,
        updatedAt: new Date()
      });
      alert("Materi berhasil diperbarui!");
      editMateriId = null;
    } else {
      await addDoc(collection(db, "materi"), {
        title,
        images,
        desc,
        createdAt: new Date()
      });
      alert("Materi baru dan gambar berhasil disimpan!");
    }

    // Reset Form
    document.getElementById('materi-title').value = '';
    if (document.getElementById('materi-img')) document.getElementById('materi-img').value = '';
    if (fileInput) fileInput.value = '';
    document.getElementById('materi-desc').value = '';
    
    toggleAdminForm('materi');
    loadMateri();
  } catch (e) {
    alert("Gagal menyimpan materi: " + e.message);
  }
};

window.editMateri = (id, title, imgListStr, desc) => {
  editMateriId = id;
  document.getElementById('materi-title').value = title;
  if (document.getElementById('materi-img')) document.getElementById('materi-img').value = imgListStr;
  document.getElementById('materi-desc').value = desc;
  
  const container = document.getElementById('form-materi-container');
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
  }
  window.scrollTo({ top: container.offsetTop - 80, behavior: 'smooth' });
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
      const id = docSnap.id;
      
      const imgList = data.images && data.images.length > 0 
        ? data.images 
        : [data.img || "https://img.freepik.com/free-vector/cute-animals-holding-numbers-banner_1308-43306.jpg"];

      const dataString = JSON.stringify({
        title: data.title,
        desc: data.desc,
        images: imgList
      }).replace(/"/g, '&quot;');

      listContainer.innerHTML += `
        <div class="card glass">
          <div class="image-slider-container">
            ${imgList.length > 1 ? `<button class="slide-btn left" onclick="scrollSlider('${id}', -1)">❮</button>` : ''}
            <div class="image-slider" id="slider-${id}">
              ${imgList.map(url => `<img src="${url}" alt="${data.title}" onclick="openMateriModal('${dataString}')" style="cursor:pointer;">`).join('')}
            </div>
            ${imgList.length > 1 ? `<button class="slide-btn right" onclick="scrollSlider('${id}', 1)">❯</button>` : ''}
          </div>

          <div class="card-body">
            <h3>${data.title}</h3>
            <p>${data.desc.substring(0, 90)}...</p>
            <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
              <button class="btn-primary" onclick="openMateriModal('${dataString}')" style="padding:6px 12px; font-size:0.85rem;">📖 Buka Materi</button>
              <div class="admin-actions admin-only" style="display:flex; gap:5px;">
                <button class="btn-icon edit" onclick="editMateri('${id}', '${data.title.replace(/'/g, "\\'")}', '${imgList.join(', ')}', '${data.desc.replace(/'/g, "\\'")}')" style="background:#f1c40f; color:white; border:none; padding:5px 8px; border-radius:5px; cursor:pointer;">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteData('materi', '${id}')" style="background:#e74c3c; color:white; border:none; padding:5px 8px; border-radius:5px; cursor:pointer;">
                  <i class="fa-solid fa-trash"></i>
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

window.scrollSlider = (id, direction) => {
  const container = document.getElementById(`slider-${id}`);
  if (container) container.scrollBy({ left: direction * 280, behavior: 'smooth' });
};

window.openMateriModal = (jsonString) => {
  const data = JSON.parse(jsonString);
  document.getElementById('modal-title').innerText = data.title;
  document.getElementById('modal-desc').innerText = data.desc;

  const modalCarousel = document.getElementById('modal-carousel');
  modalCarousel.innerHTML = `
    <div class="image-slider-container">
      ${data.images.length > 1 ? `<button class="slide-btn left" onclick="scrollSlider('modal', -1)">❮</button>` : ''}
      <div class="image-slider" id="slider-modal">
        ${data.images.map(url => `<img src="${url}" style="width:100%; max-height:380px; object-fit:contain;">`).join('')}
      </div>
      ${data.images.length > 1 ? `<button class="slide-btn right" onclick="scrollSlider('modal', 1)">❯</button>` : ''}
    </div>
  `;

  document.getElementById('materi-modal').classList.remove('hidden');
};

window.closeMateriModal = () => {
  document.getElementById('materi-modal').classList.add('hidden');
};

// ==========================================
// 6. MANAGEMENT LATIHAN & SKOR
// ==========================================

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

async function loadLatihan() {
  const listContainer = document.getElementById("latihan-list");
  if (!listContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "latihan"));
    listContainer.innerHTML = "";
    currentQuestions = [];
    userAnswers = {};

    if (querySnapshot.empty) {
      listContainer.innerHTML = "<p style='text-align:center;'>Belum ada latihan/kuis.</p>";
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
              <button class="btn-icon delete" onclick="deleteData('latihan', '${id}')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">
                <i class="fa-solid fa-trash"></i> Hapus Soal
              </button>
            </div>
          </div>
        </div>
      `;
    });

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
  }
}

window.selectAnswer = (qId, option) => {
  userAnswers[qId] = option;
};

window.submitQuiz = async () => {
  const user = auth.currentUser;
  if (!user) {
    return alert("Silakan Login terlebih dahulu untuk mengirim kuis!");
  }

  if (Object.keys(userAnswers).length < currentQuestions.length) {
    if (!confirm("Masih ada soal yang belum Anda jawab. Yakin ingin mengumpulkan?")) return;
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
        🎉 Selamat <b>${payload.nama}</b>! Skor Anda: <b>${finalScore} / 100</b><br>
        <small>(Nilai telah berhasil dikirim)</small>
      </div>
    `;
  } catch (err) {
    console.error("Gagal kirim skor:", err);
  }
};

// ==========================================
// 7. DELETE DATA
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

// Load Data Awal
loadMateri();
loadLatihan();
