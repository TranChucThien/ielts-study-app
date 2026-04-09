Tiếp tục dự án IELTS Study App (React + Vite + Firebase).
Repo: https://github.com/TranChucThien/ielts-study-app
Thư mục: ielts-app/

Prompt 1-4 đã hoàn thành: Toàn bộ tính năng đã migrate sang React.
Vấn đề: Giao diện vẫn giống bản HTML thuần cũ, chưa tận dụng React.

## Nhiệm vụ: Viết lại toàn bộ CSS từ đầu

### Nguyên tắc
- XOÁ cả 2 file CSS cũ: src/styles/global.css và src/styles/enhanced.css
- Tạo 1 file DUY NHẤT: src/styles/app.css
- Import trong main.jsx: import './styles/app.css'
- KHÔNG thay đổi class names trong JSX (giữ nguyên tên class hiện tại)
- KHÔNG thay đổi file JSX nào, CHỈ viết CSS mới

### Design System mới

#### Color Palette (Dark theme nâng cấp)
- Background: #060b18 (đậm hơn, sạch hơn)
- Surface: #0f1729 (cards)
- Surface2: #162036 (inputs, hover states)
- Border: rgba(255,255,255,0.06) (subtle hơn, dùng rgba thay hex)
- Text: #f1f5f9
- Text muted: #64748b
- Accent: #6366f1 (indigo thay blue, hiện đại hơn)
- Accent hover: #818cf8
- Green: #10b981
- Red: #f43f5e (rose thay red)
- Yellow: #f59e0b

#### Typography
- Font: 'Inter', system-ui, -apple-system, sans-serif
- Import Inter từ Google Fonts trong index.html
- Base size: 15px
- Headings: font-weight 700, letter-spacing -0.02em
- Body: font-weight 400, line-height 1.6

#### Spacing
- Dùng hệ thống 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48
- Cards padding: 20px
- Cards gap: 12px
- Section gap: 24px

#### Border Radius
- Cards: 16px
- Buttons: 10px
- Inputs: 10px
- Pills/Tags: 999px (full round)
- Small elements: 8px

#### Shadows (thay border cứng)
- Cards: box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)
- Cards hover: box-shadow: 0 4px 12px rgba(0,0,0,0.4)
- Dropdowns: box-shadow: 0 12px 40px rgba(0,0,0,0.5)
- Buttons hover: box-shadow: 0 4px 15px rgba(99,102,241,0.3)

### Yêu cầu cụ thể từng section

#### 1. Sidebar (#sidebar)
- Width: 240px
- Background: transparent (không có border-right)
- Logo: gradient text, font-size 1.5rem
- Nav items: padding 10px 16px, border-radius 10px
- Active: background rgba(99,102,241,0.12), color accent, left border 3px accent
- Hover: background rgba(255,255,255,0.04)
- Thêm divider line mỏng giữa nav groups (nếu cần)

#### 2. Bottom Nav (#bottom-nav)
- Background: rgba(6,11,24,0.85) + backdrop-filter blur(20px)
- Border-top: 1px solid rgba(255,255,255,0.06)
- Active icon: color accent + dot indicator nhỏ bên dưới
- Padding bottom: safe-area-inset

#### 3. Cards (.card)
- Background: rgba(15,23,41,0.6) + backdrop-filter blur(8px)
- Border: 1px solid rgba(255,255,255,0.06)
- Hover: border-color rgba(255,255,255,0.12), subtle lift
- Transition: all 0.2s ease

#### 4. Buttons
- .btn-primary: gradient background (indigo → violet), hover lift + glow
- .btn-secondary: ghost style, border rgba(255,255,255,0.1), hover fill
- .btn-accent: gradient (violet → purple)
- .btn-hard/.btn-ok/.btn-easy: giữ màu nhưng thêm subtle border
- Tất cả buttons: font-weight 500, letter-spacing 0.01em

#### 5. Inputs
- Background: rgba(255,255,255,0.03)
- Border: 1px solid rgba(255,255,255,0.08)
- Focus: border-color accent, box-shadow 0 0 0 3px rgba(99,102,241,0.15)
- Placeholder: color rgba(255,255,255,0.25)

#### 6. Dashboard
- Greeting card: gradient border (dùng pseudo-element), glassmorphism
- Stat cards: gradient backgrounds giữ nguyên nhưng thêm subtle glow
- Heatmap cells: border-radius 4px, hover scale(1.3) + tooltip
- Quick actions: pill buttons với icon, scroll horizontal
- Checklist: custom checkbox (không dùng native), animation khi check

#### 7. Flashcards
- Card flip: thêm subtle shadow khi hover
- Front/Back: gradient backgrounds mượt hơn
- SRS buttons: larger touch targets, emoji + text
- Study progress: thin progress bar phía trên

#### 8. Vocabulary
- Cards: left border 3px color theo topic
- Speak button: circular, hover glow
- Mastery badge: subtle, pill shape
- Grid view: equal height cards

#### 9. Notes
- Tabs: underline style thay vì pill (active = bottom border accent)
- Note cards: left border color theo tag
- Tag pills: smaller, more subtle

#### 10. Timer
- Ring: stroke-width 8 (thicker), gradient stroke
- Clock text: font-variant-numeric tabular-nums, larger
- Preset buttons: hover lift + border glow

#### 11. Calendar
- Cells: aspect-ratio 1, cleaner look
- Today: ring outline thay vì fill
- Selected: accent fill
- Skill flags: tiny dots thay vì text labels

#### 12. Scores
- Chart bars: rounded top, thicker (14px width)
- Score entries: cleaner grid layout
- Overall score: large, accent color, font-weight 800

#### 13. Dictation
- Play button: larger (72px), pulse animation khi playing
- Mode buttons: icon prominent, text below
- Result card: celebration gradient background

#### 14. Settings
- User card: avatar larger (56px), cleaner layout
- Action buttons: full width, icon left aligned
- Danger zone: red border section cho Reset

#### 15. Toast
- Glassmorphism: backdrop-filter blur(16px)
- Subtle slide-up animation
- Max-width: 320px

#### 16. Command Palette
- Overlay: darker (rgba(0,0,0,0.6))
- Input: larger, no border
- Items: hover background subtle

#### 17. Skeleton
- Shimmer: smoother gradient, slower animation (2s)
- Border-radius match actual content

#### 18. Login Page
- Full viewport gradient background (animated subtle movement)
- Card: glassmorphism, larger padding
- Google button: white background + Google colors (thay gradient)
- Feature pills: subtle glass effect

### Animations & Transitions
- Page transition: opacity fade 0.2s (không dùng transform)
- Card hover: translateY(-1px) + shadow increase
- Button hover: translateY(-1px) + glow
- Checkbox: scale bounce khi check
- Toast: slide up + fade in

### Responsive
- Mobile (≤768px): sidebar hidden, bottom nav visible, single column
- Tablet (769-1024px): sidebar collapsed (icons only, 64px width)
- Desktop (>1024px): full sidebar 240px

### Performance
- Dùng CSS custom properties cho tất cả colors
- Minimize repaints: dùng transform + opacity cho animations
- will-change chỉ khi cần thiết
- Không dùng filter trên large elements

## Output
- CHỈ tạo 1 file: src/styles/app.css
- Cập nhật main.jsx: import './styles/app.css' (đã sửa rồi)
- Thêm Google Fonts Inter vào index.html
- KHÔNG sửa bất kỳ file JSX nào
