import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyCzUpqZhad-VHD6iqKiU2tzAt1SWP63eqE",
  authDomain: "mywebsite-33b9c.firebaseapp.com",
  projectId: "mywebsite-33b9c",
  storageBucket: "mywebsite-33b9c.appspot.com",
  messagingSenderId: "374864219588",
  appId: "1:374864219588:web:8967c1d62b30f3b511a891",
  measurementId: "G-VXBBY77QDC"
};

// Firebase başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;

// Navbar kullanıcı kontrolü
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  const authLink = document.getElementById('auth-link');
  if (user) {
    const emailPrefix = user.email.split('@')[0];
    authLink.innerHTML = `
      <a class="nav-link" href="#" id="logout-link">Çıkış Yap (${emailPrefix})</a>
    `;
    document.getElementById("logout-link").addEventListener("click", (e) => {
      e.preventDefault();
      signOut(auth).then(() => {
        window.location.href = "index.html";
      }).catch(error => {
        alert("Çıkış hatası: " + error.message);
      });
    });
  } else {
    authLink.innerHTML = `
      <div class="d-flex gap-2">
        <a class="nav-link" href="login.html">Giriş Yap</a>
        <a class="nav-link" href="register.html">Kayıt Ol</a>
      </div>
    `;
  }
});

// Yorum gönderme işlemi
const commentForm = document.getElementById("comment-form");
const commentList = document.getElementById("comment-list");

if (commentForm) {
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("comment").value.trim();

    if (!currentUser) {
      document.getElementById("error-message").innerHTML = `
        <div class="alert alert-danger">Yorum yapmak için önce giriş yapmalısınız. Giriş sayfasına yönlendiriliyorsunuz...</div>
      `;
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      return;
    }

    if (text) {
      const commentRef = ref(db, "comments");
      push(commentRef, {
        name: currentUser.email.split("@")[0],
        text,
        timestamp: Date.now()
      });
      commentForm.reset();
    }
  });

  // Yorumları ve yanıtları yükle
  const commentRef = ref(db, "comments");
onChildAdded(commentRef, (snapshot) => {
  const comment = snapshot.val();
  const commentId = snapshot.key;

  const div = document.createElement("div");
  div.className = "border p-3 mb-3 bg-light rounded";
  div.innerHTML = `
    <strong>${comment.name}</strong><br/>
    <small class="text-muted">${new Date(comment.timestamp).toLocaleString("tr-TR")}</small>
    <p class="mb-1">${comment.text}</p>

    <button class="btn btn-outline-secondary btn-sm reply-toggle" data-id="${commentId}">
  <i class="bi bi-chat-left-text"></i> Yanıtla
</button>


    <form class="reply-form mt-2 d-none" data-id="${commentId}">
      <textarea class="form-control mb-2 reply-text" placeholder="Yanıtınızı yazın..."></textarea>
      <button class="btn btn-outline-primary btn-sm reply-toggle" data-id="${commentId}">
  <i class="bi bi-reply"></i> Yanıtla
</button>

    </form>

    <div class="replies mt-2" id="replies-${commentId}"></div>
  `;
  commentList.prepend(div);

  const toggleBtn = div.querySelector(".reply-toggle");
  const replyForm = div.querySelector(".reply-form");
  toggleBtn.addEventListener("click", () => {
    replyForm.classList.toggle("d-none");
  });

  replyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Yanıt yazmak için giriş yapmalısınız!");
      window.location.href = "login.html";
      return;
    }

    const replyText = replyForm.querySelector(".reply-text").value.trim();
    if (replyText) {
      const repliesRef = ref(db,`comments/${commentId}/replies`);
      push(repliesRef, {
        name: currentUser.email.split("@")[0],
        text: replyText,
        timestamp: Date.now()
      });
      replyForm.reset();
      replyForm.classList.add("d-none");
    }
  });

  // ✅ Yeni: replies verisini hem geçmişten al hem yeni gelenleri ekle
  const repliesRef = ref(db, `comments/${commentId}/replies`);
  onChildAdded(repliesRef, (replySnap) => {
    const reply = replySnap.val();
    const replyDiv = document.createElement("div");
    replyDiv.className = "ms-3 mt-2 p-2 bg-white border rounded";
    replyDiv.innerHTML = `
      <strong>${reply.name}</strong><br/>
      <small class="text-muted">${new Date(reply.timestamp).toLocaleString("tr-TR")}</small>
      <p class="mb-0">${reply.text}</p>
    `;
    div.querySelector(`#replies-${commentId}`).appendChild(replyDiv);
  });
});

}