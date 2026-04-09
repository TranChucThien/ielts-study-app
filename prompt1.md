Tôi có ứng dụng IELTS Study App viết bằng HTML/CSS/JS thuần.
Source: https://github.com/TranChucThien/ielts-study-app

Hãy đọc index.html, style.css, app.js để hiểu cấu trúc hiện tại.

Nhiệm vụ: Setup nền tảng dự án mới, CHƯA migrate tính năng.

## Tech stack
- Vite + React (JavaScript, không TypeScript)
- Firebase Auth (Google login)
- Firebase Firestore
- React Router v6
- Lucide React (thay lucide-static)

## Firebase config
- Project ID: ielts-study-app-tct
- Tạo file src/firebase/config.js dùng biến môi trường VITE_FIREBASE_*

## Cấu trúc thư mục cần tạo
src/
  firebase/
    config.js        ← initializeApp, auth, db
    auth.js          ← signInWithGoogle, signOut
    firestore.js     ← helper: getDoc, setDoc, updateDoc, deleteDoc theo userId
  context/
    AuthContext.jsx  ← cung cấp user, loading, signIn, signOut toàn app
  hooks/
    useAuth.js       ← dùng AuthContext
    useFirestore.js  ← CRUD Firestore theo collection của user hiện tại
  components/
    Layout.jsx       ← sidebar desktop + bottom nav mobile (copy từ index.html)
    ProtectedRoute.jsx ← redirect về /login nếu chưa auth
  pages/
    LoginPage.jsx    ← Google login button, dark theme
    DashboardPage.jsx ← placeholder "Dashboard - coming soon"
  styles/
    global.css       ← copy toàn bộ style.css hiện tại, chỉnh import path
  App.jsx            ← React Router setup các routes
  main.jsx

## Routes
/ → DashboardPage (protected)
/login → LoginPage

## Yêu cầu UI
- Giữ nguyên dark theme từ style.css gốc
- Layout.jsx copy sidebar và bottom-nav từ index.html sang JSX
- LoginPage có nút "Đăng nhập bằng Google" căn giữa màn hình

## Output
- Toàn bộ file source
- .env.example với đủ VITE_FIREBASE_* keys
- vite.config.js với base: '/'
- firestore.rules cơ bản (chỉ authenticated user đọc/ghi data của mình)
- Hướng dẫn ngắn: npm install và các package cần thiết