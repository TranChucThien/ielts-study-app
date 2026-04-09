Tiếp tục dự án IELTS Study App đang refactor sang React + Vite + Firebase.
Đọc source gốc tại: https://github.com/TranChucThien/ielts-study-app

Prompt 1 + 2 đã hoàn thành: Auth, Layout, Router, Dashboard, Vocabulary.

Nhiệm vụ: Migrate 2 tính năng Flashcards và Dictation.

## Flashcards (src/pages/FlashcardsPage.jsx)
Tính năng cần migrate:
- Danh sách flashcard, filter theo deck
- Thêm card (front, back, example, deck)
- Chế độ học (lật card, prev/next, progress bar)
- Xoá card
- Progress: đếm số card đã học hôm nay

## Firestore
- users/{userId}/flashcards/{cardId}
  { front, back, example, deck, phonetic, createdAt, lastReviewed }

## Custom hook
src/hooks/useFlashcards.js
  - getAll(deckFilter)
  - add(card)
  - remove(id)
  - markReviewed(id)

## Dictation (src/pages/DictationPage.jsx)
Tính năng cần migrate:
- Setup: chọn mode (word/sentence), tốc độ, số câu, chủ đề
- Lấy nội dung dictation từ vocabulary collection của user
  (mode word → đọc tên từ, mode sentence → đọc example)
- Web Speech API (SpeechSynthesis) để đọc text
- User gõ lại, so sánh kết quả (trim, lowercase, ignore punctuation)
- Hiện feedback đúng/sai từng ký tự
- Kết quả cuối: đúng/sai/phần trăm
- Lưu lịch sử vào Firestore

## Firestore
- users/{userId}/dictationHistory/{id}
  { date, mode, total, correct, wrong, accuracy, topic }

## Custom hook
src/hooks/useDictation.js
  - getHistory()
  - saveResult(result)

## Yêu cầu UI
- Giữ nguyên giao diện gốc
- Dùng Lucide React icons
- Flashcard flip animation giữ nguyên CSS transition từ style.css gốc

## Lưu ý
- SpeechSynthesis chạy client-side, không cần Firebase
- Ưu tiên giọng tiếng Anh (lang: 'en-US') cho SpeechSynthesis
- Loading state khi fetch vocabulary để dùng trong dictation