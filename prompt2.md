Tiếp tục dự án IELTS Study App đang refactor sang React + Vite + Firebase.
Đọc source gốc tại: https://github.com/TranChucThien/ielts-study-app

Prompt 1 đã hoàn thành: Auth, Layout, Router, Firestore helpers.

Nhiệm vụ: Migrate 2 tính năng Dashboard và Vocabulary.

## Dashboard (src/pages/DashboardPage.jsx)
Các tính năng cần migrate từ app.js:
- Quote of the day (random từ mảng quotes có sẵn)
- Stat cards: Target band, Streak, Flashcard count, Vocabulary count
- Word of the day (random từ vocabulary collection của user)
- Quick Flashcard review (lấy từ flashcards collection)
- Heatmap 90 ngày (đọc từ sessions collection)
- Today checklist: Vocab / Listening / Reading / Writing / Speaking
  → Lưu vào Firestore: users/{userId}/settings document, field: dailyCheck

## Vocabulary (src/pages/VocabularyPage.jsx)
Tính năng cần migrate:
- Hiển thị danh sách từ vựng (đọc từ Firestore)
- Thêm từ mới (form: word, type, meaning, phonetic, example, synonym, topic)
- Tìm kiếm theo từ
- Filter theo topic
- Xoá từ
- Nút "Import mẫu": import bộ từ mẫu từ data.json vào Firestore
  (chỉ import 1 lần, check field vocabImported trong settings)

## Firestore collections liên quan
- users/{userId}/vocabulary/{wordId}
  { word, type, meaning, phonetic, example, synonym, topic, createdAt }
- users/{userId}/settings
  { targetBand, dailyCheck, streak, lastStudyDate, vocabImported }

## Custom hook cần tạo
src/hooks/useVocabulary.js
  - getAll(filters)
  - add(word)
  - remove(id)
  - importSample()

## Yêu cầu UI
- Giữ nguyên 100% giao diện từ style.css gốc
- Dùng Lucide React icons (thay class icon-*)
- Không thay đổi tên class CSS để tái sử dụng style.css gốc

## Lưu ý
- Mọi thao tác Firestore đều cần userId từ useAuth()
- Loading state khi fetch data
- Error handling cơ bản (toast hoặc console.error)