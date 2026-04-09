# IELTS Study Hub

Ứng dụng học IELTS cá nhân — React + Vite + Firebase.

## Tính năng

- **Dashboard**: Streak, heatmap, word of the day, quick flashcard, daily checklist
- **Vocabulary**: Quản lý từ vựng, filter theo topic, import mẫu
- **Flashcards**: Tạo thẻ, chế độ học lật thẻ
- **Notes**: Ghi chú theo skill (L/R/W/S/Vocab), tag, tìm kiếm
- **Scores**: Theo dõi điểm band, biểu đồ xu hướng
- **Timer**: Preset IELTS, custom timer, SVG ring animation
- **Dictation**: Luyện nghe chép, Web Speech API
- **Calendar**: Lịch học, ghi chú buổi học theo ngày
- **Settings**: Export/Import JSON, reset data

## Cài đặt

### 1. Clone repo

```bash
git clone <repo-url>
cd ielts-app
```

### 2. Tạo Firebase project

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới (hoặc dùng `ielts-study-app-tct`)
3. Bật **Authentication** → Sign-in method → **Google**
4. Tạo **Firestore Database** (production mode)
5. Deploy `firestore.rules` từ repo

### 3. Cấu hình environment

```bash
cp .env.example .env
```

Điền Firebase config từ Project Settings → General → Your apps → Web app:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=ielts-study-app-tct
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Chạy local

```bash
npm install
npm run dev
```

### 5. Deploy lên GitHub Pages

1. Vào repo GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Thêm các secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Vào **Settings** → **Pages** → Source: **GitHub Actions**
4. Push lên `main` → workflow tự động build và deploy

**Live**: `https://<username>.github.io/TCT/`

## Tech Stack

- Vite + React (JavaScript)
- Firebase Auth (Google login)
- Firebase Firestore
- React Router v6
- Lucide React icons

## Packages

```bash
npm install firebase react-router-dom lucide-react
```
