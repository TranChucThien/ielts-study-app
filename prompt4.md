Tiếp tục dự án IELTS Study App đang refactor sang React + Vite + Firebase.
Đọc source gốc tại: https://github.com/TranChucThien/ielts-study-app

Prompt 1+2+3 đã hoàn thành. Đây là prompt cuối, migrate các tính năng còn lại.

## Notes (src/pages/NotesPage.jsx)
- Tabs: Listening / Reading / Writing / Speaking / Vocabulary
- Thêm note (title, content, tag, skill)
- Tìm kiếm note
- Xoá note
- Firestore: users/{userId}/notes/{noteId}
  { title, content, tag, skill, createdAt }

## Timer (src/pages/TimerPage.jsx)
- Preset buttons: Writing Task1/2, Speaking Part1/2/3, Listening, Reading
- Custom timer (nhập số phút)
- Countdown với SVG ring animation (giữ nguyên từ style.css)
- Pause / Stop
- Lưu lịch sử vào Firestore
- Firestore: users/{userId}/timerHistory/{id}
  { label, duration, completedAt, completed }

## Calendar (src/pages/CalendarPage.jsx)
- Hiển thị lịch tháng
- Click vào ngày → mở panel thêm buổi học
- Buổi học gồm: title, content, skills (checkbox), mood
- Hiển thị dot trên ngày có buổi học
- Firestore: users/{userId}/sessions/{sessionId}
  { date, title, content, skills, mood, createdAt }

## Scores (src/pages/ScoresPage.jsx)
- Form nhập điểm: date, L, R, W, S
- Tính overall tự động: (L+R+W+S)/4 làm tròn 0.5
- Chart xu hướng điểm (dùng SVG thuần, không cần chart library)
- Lịch sử các lần test
- Firestore: users/{userId}/scores/{scoreId}
  { date, listening, reading, writing, speaking, overall, createdAt }

## Settings (src/pages/SettingsPage.jsx)
- Hiển thị thông tin user (avatar Google, tên, email)
- Nút Sign Out
- Export data: tải toàn bộ data của user về file .json
- Import data: upload file .json để restore lên Firestore
- Reset: xoá toàn bộ data của user trên Firestore
- XOÁ phần GitHub Sync (thay bằng Firebase rồi, không cần nữa)
- Quick links đến các trang: Scores, Notes, Timer, Dictation, Calendar

## Sau khi hoàn thành tất cả 4 tính năng trên, thực hiện thêm:

### Data migration helper
src/utils/migrateFromLocalStorage.js
- Đọc toàn bộ data từ localStorage (format cũ)
- Upload lên Firestore theo đúng collections
- Dùng khi user login lần đầu, nếu phát hiện có data cũ trong localStorage
- Sau khi migrate xong thì xoá localStorage

### Hoàn thiện DashboardPage
- Streak tính dựa trên sessions collection (ngày liên tiếp có session)
- Heatmap đọc từ sessions collection
- Vocab count đọc từ vocabulary collection  
- Flashcard count đọc từ flashcards collection

### README.md
Viết hướng dẫn đầy đủ:
1. Clone repo
2. Tạo Firebase project, bật Auth (Google) và Firestore
3. Copy .env.example → .env, điền Firebase config
4. npm install && npm run dev
5. Deploy lên GitHub Pages (dùng GitHub Actions, build command: npm run build, output dir: dist)

### firestore.rules (final)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}