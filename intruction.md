# IELTS Study Hub — Hướng dẫn Source Code

## Tổng quan

Ứng dụng web tĩnh (HTML/CSS/JS thuần) hỗ trợ học IELTS, chạy hoàn toàn trên trình duyệt. Dữ liệu lưu trong `localStorage` và đồng bộ lên GitHub qua API.

## Cấu trúc file

```
├── index.html    # Giao diện — tất cả các trang nằm trong 1 file duy nhất (SPA)
├── style.css     # Toàn bộ CSS
├── app.js        # Toàn bộ logic JavaScript
└── data.json     # Dữ liệu mẫu / dữ liệu đồng bộ lên GitHub
```

## Các trang (Sections)

| Trang | ID | Mô tả |
|---|---|---|
| Dashboard | `page-dashboard` | Tổng quan: streak, quote, heatmap 90 ngày, checklist hàng ngày, word of the day |
| Flashcards | `page-flashcards` | Tạo/sửa/xoá flashcard, chế độ học (lật thẻ, đánh giá khó/tạm/dễ), lọc theo deck |
| Notes | `page-notes` | Ghi chú theo 5 kỹ năng (L/R/W/S/Vocab), hỗ trợ tag và tìm kiếm |
| Timer | `page-timer` | Bấm giờ theo preset (Writing Task 1/2, Speaking Part 1/2/3, Full Test) hoặc tuỳ chỉnh |
| Calendar | `page-calendar` | Lịch học theo tháng, ghi chú buổi học theo ngày, đánh dấu skill + mood |
| Vocabulary | `page-vocab` | Quản lý từ vựng IELTS: từ, loại từ, phiên âm, nghĩa, ví dụ, đồng nghĩa, topic |
| Scores | `page-scores` | Theo dõi điểm band (L/R/W/S + Overall) |
| Settings | `page-settings` | Cấu hình GitHub Sync, export/import/reset dữ liệu |

## Lưu trữ dữ liệu

- Dùng `localStorage` với prefix `ielts-` (VD: `ielts-flashcards`, `ielts-vocabulary`)
- Các key dữ liệu: `notes`, `flashcards`, `streak`, `checklist`, `history`, `settings`, `scores`, `sessions`, `vocabulary`
- Object `store` cung cấp `get(key)`, `set(key, value)`, `getAll()`, `setAll(data)`

## GitHub Sync

- Đồng bộ toàn bộ dữ liệu lên 1 file JSON trên GitHub repo (mặc định `data.json`)
- Cần Personal Access Token (scope: `repo`)
- Auto-save sau 3 giây khi có thay đổi (`scheduleSync`)
- Pull/Push qua GitHub Contents API

## Điều hướng

- SPA — chuyển trang bằng cách toggle class `active` trên các `<section class="page">`
- Desktop: sidebar trái (`#sidebar`)
- Mobile: bottom navigation (`#bottom-nav`)

## Flashcard — Spaced Repetition đơn giản

- Mỗi thẻ có `score`: hard → -1, ok → 0, easy → +2
- Khi học, thẻ được sắp xếp theo score tăng dần (thẻ yếu nhất lên trước)
- Hỗ trợ swipe trái/phải trên mobile

## Vocabulary ↔ Flashcard

- Khi thêm từ vựng mới, tự động tạo 1 flashcard tương ứng
- Import mẫu 25 từ IELTS phổ biến qua nút "Import mẫu"

## data.json

File JSON chứa toàn bộ dữ liệu ứng dụng, dùng để:
- Đồng bộ lên GitHub (sync giữa các thiết bị)
- Export/Import backup

Cấu trúc:
```json
{
  "notes": [],
  "flashcards": [{ "id", "front", "back", "example", "deck", "score", "lastReview" }],
  "vocabulary": [{ "id", "word", "type", "meaning", "phonetic", "example", "synonyms", "topic", "created" }],
  "streak": { "count", "lastDate" },
  "checklist": [{ "date", "items": { "vocab": bool, "listen": bool, ... } }],
  "history": ["YYYY-MM-DD"],
  "settings": { "targetBand" },
  "scores": [{ "id", "date", "l", "r", "w", "s", "overall", "created" }],
  "sessions": [{ "id", "date", "title", "content", "skills", "mood", "created" }]
}
```

## Deploy

- Hosting trên GitHub Pages (workflow: `.github/workflows/jekyll-gh-pages.yml`)
- Không cần build step — chỉ cần serve file tĩnh