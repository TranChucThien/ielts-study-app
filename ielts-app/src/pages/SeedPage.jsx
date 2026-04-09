import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { addToUserCollection, setUserDoc, batchWrite, db, doc } from '../firebase/firestore'
import { SAMPLE_VOCAB } from '../utils/sampleData'
import { Loader2 } from 'lucide-react'

const d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
const t = (n) => Date.now() - n * 86400000

export default function SeedPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])

  const addLog = (msg) => setLog(prev => [...prev, msg])

  const seed = async () => {
    if (!user) return
    setRunning(true)
    setLog([])

    try {
      // ===== VOCABULARY (25 từ) =====
      addLog('📚 Tạo 25 từ vựng...')
      for (let i = 0; i < SAMPLE_VOCAB.length; i++) {
        const v = SAMPLE_VOCAB[i]
        await addToUserCollection(user.uid, 'vocabulary', {
          ...v, createdAt: t(Math.floor(i / 2)),
        })
      }
      addLog('✅ Vocabulary: 25 từ')

      // ===== FLASHCARDS (30 thẻ) =====
      addLog('🃏 Tạo 30 flashcards...')
      const fcData = [
        ...SAMPLE_VOCAB.map((v, i) => ({
          front: v.word, back: v.meaning, example: v.example,
          deck: ['general', 'listening', 'reading', 'writing', 'speaking'][i % 5],
          score: Math.floor(Math.random() * 6) - 2,
          lastReviewed: i < 15 ? t(i % 4) : null,
          createdAt: t(Math.floor(i / 2)),
        })),
        { front: 'take into account', back: 'xem xét, tính đến', example: 'We must take into account all factors.', deck: 'writing', score: 1, lastReviewed: t(1), createdAt: t(3) },
        { front: 'pros and cons', back: 'ưu và nhược điểm', example: 'Let\'s weigh the pros and cons.', deck: 'speaking', score: 0, lastReviewed: null, createdAt: t(5) },
        { front: 'a wide range of', back: 'nhiều loại, đa dạng', example: 'The store offers a wide range of products.', deck: 'writing', score: 2, lastReviewed: t(0), createdAt: t(1) },
        { front: 'give rise to', back: 'gây ra, dẫn đến', example: 'Pollution gives rise to health problems.', deck: 'writing', score: -1, lastReviewed: null, createdAt: t(7) },
        { front: 'in terms of', back: 'về mặt, xét về', example: 'In terms of quality, this is the best.', deck: 'general', score: 3, lastReviewed: t(0), createdAt: t(2) },
      ]
      for (const fc of fcData) {
        await addToUserCollection(user.uid, 'flashcards', fc)
      }
      addLog('✅ Flashcards: 30 thẻ')

      // ===== NOTES (12 ghi chú) =====
      addLog('📝 Tạo 12 notes...')
      const notes = [
        { skill: 'listening', title: 'Section 4 tips', content: 'Đọc trước câu hỏi trong 30s break.\nChú ý signal words: however, on the other hand.\nViết tắt khi nghe, hoàn thiện sau.', tag: 'tip', createdAt: t(1) },
        { skill: 'listening', title: 'Map labelling strategy', content: 'Xác định hướng Bắc trước.\nNghe từ chỉ vị trí: opposite, adjacent, next to.\nĐánh dấu ngay khi nghe được.', tag: 'tip', createdAt: t(5) },
        { skill: 'writing', title: 'Task 2 template', content: 'Introduction: Paraphrase + thesis statement\nBody 1: Main idea + example\nBody 2: Counter argument + refutation\nConclusion: Restate + recommendation', tag: 'template', createdAt: t(2) },
        { skill: 'writing', title: 'Task 1 - Line graph phrases', content: 'increased dramatically / rose sharply\nremained stable / leveled off\nfluctuated between X and Y\nreached a peak of / hit a low of', tag: 'vocab', createdAt: t(8) },
        { skill: 'writing', title: 'Lỗi hay mắc - Subject-verb agreement', content: 'The number of students HAS increased. (không phải have)\nA number of students HAVE enrolled. (không phải has)\nEach of the students IS required...', tag: 'mistake', createdAt: t(3) },
        { skill: 'reading', title: 'True/False/NG strategy', content: 'NOT GIVEN ≠ FALSE.\nNếu passage không đề cập → NG.\nNếu passage nói ngược lại → FALSE.\nĐọc kỹ qualifier: some, all, always, never.', tag: 'mistake', createdAt: t(0) },
        { skill: 'reading', title: 'Matching headings tips', content: 'Đọc heading trước, gạch chân keyword.\nĐọc câu đầu + câu cuối mỗi paragraph.\nLoại trừ heading đã dùng.\nCẩn thận heading quá general.', tag: 'tip', createdAt: t(4) },
        { skill: 'speaking', title: 'Part 2 - Describe a place', content: 'Where: Da Lat city\nWhen: Last summer\nWhat: Pine forests, flower gardens, Xuan Huong lake\nWhy memorable: Cool weather, peaceful atmosphere', tag: 'tip', createdAt: t(3) },
        { skill: 'speaking', title: 'Filler phrases', content: 'Well, to be honest...\nThat\'s an interesting question...\nI\'d say that...\nFrom my perspective...\nIf I\'m not mistaken...', tag: 'template', createdAt: t(6) },
        { skill: 'vocabulary', title: 'Collocations hay gặp', content: 'make progress, take measures, raise awareness\npay attention, draw conclusions, pose a threat\nconduct research, gain experience, meet requirements', tag: 'vocab', createdAt: t(1) },
        { skill: 'vocabulary', title: 'Linking words for Writing', content: 'Addition: Furthermore, Moreover, In addition\nContrast: However, Nevertheless, On the other hand\nCause: Due to, Owing to, As a result of\nConclusion: In conclusion, To sum up, All things considered', tag: 'template', createdAt: t(9) },
        { skill: 'listening', title: 'Number dictation mistakes', content: 'Hay nhầm: 13/30, 14/40, 15/50, 16/60\nChú ý stress: thirTEEN vs THIRty\nViết số ra giấy ngay khi nghe.', tag: 'mistake', createdAt: t(2) },
      ]
      for (const n of notes) {
        await addToUserCollection(user.uid, 'notes', n)
      }
      addLog('✅ Notes: 12 ghi chú')

      // ===== SCORES (8 lần thi) =====
      addLog('📊 Tạo 8 lần thi điểm...')
      const scores = [
        { date: d(56), listening: 4.0, reading: 3.5, writing: 4.0, speaking: 4.0, overall: 4.0, createdAt: t(56) },
        { date: d(42), listening: 4.5, reading: 4.0, writing: 4.0, speaking: 4.5, overall: 4.5, createdAt: t(42) },
        { date: d(35), listening: 4.5, reading: 4.5, writing: 4.5, speaking: 4.5, overall: 4.5, createdAt: t(35) },
        { date: d(28), listening: 5.0, reading: 4.5, writing: 4.5, speaking: 5.0, overall: 5.0, createdAt: t(28) },
        { date: d(21), listening: 5.0, reading: 5.0, writing: 4.5, speaking: 5.0, overall: 5.0, createdAt: t(21) },
        { date: d(14), listening: 5.5, reading: 5.0, writing: 5.0, speaking: 5.0, overall: 5.0, createdAt: t(14) },
        { date: d(7), listening: 5.5, reading: 5.5, writing: 5.0, speaking: 5.5, overall: 5.5, createdAt: t(7) },
        { date: d(1), listening: 6.0, reading: 5.5, writing: 5.5, speaking: 5.5, overall: 5.5, createdAt: t(1) },
      ]
      for (const s of scores) {
        await addToUserCollection(user.uid, 'scores', s)
      }
      addLog('✅ Scores: 8 lần thi')

      // ===== SESSIONS (20 buổi học, trải 30 ngày) =====
      addLog('📅 Tạo 20 buổi học...')
      const sessions = [
        { date: d(0), title: 'Vocab + Reading practice', content: 'Học 10 từ mới topic Environment.\nLàm 1 passage True/False/NG - đúng 10/13.', skills: ['reading', 'vocabulary'], mood: 'great', createdAt: t(0) },
        { date: d(1), title: 'Listening Cambridge 18 Test 1', content: 'Section 1-2: 18/20\nSection 3-4: 12/20\nTổng: 30/40. Cần cải thiện section 4.', skills: ['listening'], mood: 'good', createdAt: t(1) },
        { date: d(2), title: 'Writing Task 2 practice', content: 'Topic: Technology in education\nViết xong trong 38 phút. Grammar cần check kỹ hơn.\nĐã dùng được 3 từ mới: innovative, cognitive, proficiency.', skills: ['writing', 'vocabulary'], mood: 'ok', createdAt: t(2) },
        { date: d(3), title: 'Speaking mock test', content: 'Part 1: Hometown, hobbies - khá trôi chảy\nPart 2: Describe a book - bị stuck 10s\nPart 3: Reading habits - cần thêm examples', skills: ['speaking'], mood: 'ok', createdAt: t(3) },
        { date: d(4), title: 'Flashcard review + Dictation', content: 'Ôn 25 flashcards, nhớ 20/25.\nDictation 15 từ, đúng 12.', skills: ['vocabulary'], mood: 'good', createdAt: t(4) },
        { date: d(5), title: 'Reading - Matching headings', content: 'Cambridge 17 Test 3 Passage 2.\nĐúng 5/7 headings. Sai 2 câu do chọn heading quá general.', skills: ['reading'], mood: 'ok', createdAt: t(5) },
        { date: d(6), title: 'Full Listening test', content: 'Cambridge 18 Test 2.\nS1: 10/10, S2: 8/10, S3: 7/10, S4: 5/10\nTổng: 30/40 = Band 6.0', skills: ['listening'], mood: 'good', createdAt: t(6) },
        { date: d(7), title: 'Writing Task 1 - Bar chart', content: 'Mô tả bar chart về energy consumption.\nViết 168 words trong 18 phút.\nCần dùng thêm comparison phrases.', skills: ['writing'], mood: 'good', createdAt: t(7) },
        { date: d(8), title: 'Vocab marathon', content: 'Học 15 từ mới topics: Health + Society.\nTạo flashcards cho tất cả.\nLàm dictation 20 từ, đúng 16.', skills: ['vocabulary'], mood: 'great', createdAt: t(8) },
        { date: d(10), title: 'Reading + Speaking combo', content: 'Reading: Summary completion - 8/10\nSpeaking: Practice Part 2 với timer 2 phút.', skills: ['reading', 'speaking'], mood: 'good', createdAt: t(10) },
        { date: d(12), title: 'Listening Section 3-4 focus', content: 'Chỉ làm Section 3-4 từ 3 tests.\nĐiểm trung bình: 13/20. Cải thiện so với tuần trước.', skills: ['listening'], mood: 'ok', createdAt: t(12) },
        { date: d(14), title: 'Mock test day', content: 'Full test: L=5.5, R=5.0, W=5.0, S=5.0\nOverall: 5.0. Tiến bộ so với lần trước!', skills: ['listening', 'reading', 'writing', 'speaking'], mood: 'great', createdAt: t(14) },
        { date: d(16), title: 'Writing Task 2 - Opinion essay', content: 'Topic: Should governments invest more in public transport?\nThesis: Strongly agree.\nViết 280 words trong 37 phút.', skills: ['writing'], mood: 'good', createdAt: t(16) },
        { date: d(18), title: 'Vocab review + New words', content: 'Ôn 30 từ cũ, nhớ 26.\nHọc 8 từ mới topic Technology.', skills: ['vocabulary'], mood: 'good', createdAt: t(18) },
        { date: d(20), title: 'Reading speed practice', content: 'Đọc 2 passages trong 35 phút (target: 40 phút).\nĐúng 22/26 câu. Tốc độ cải thiện!', skills: ['reading'], mood: 'great', createdAt: t(20) },
        { date: d(22), title: 'Speaking Part 3 deep dive', content: 'Topic: Environment & Technology.\nPractice 20 phút với voice recorder.\nCần giảm "um" và "like".', skills: ['speaking'], mood: 'ok', createdAt: t(22) },
        { date: d(24), title: 'Dictation intensive', content: 'Mode: Sentences, 20 câu.\nĐúng 14/20 = 70%. Hay sai articles (a/the).', skills: ['listening', 'vocabulary'], mood: 'ok', createdAt: t(24) },
        { date: d(26), title: 'Writing Task 1 - Process diagram', content: 'Mô tả quy trình sản xuất chocolate.\nKhó hơn bar chart nhiều. Cần học thêm passive voice.', skills: ['writing'], mood: 'bad', createdAt: t(26) },
        { date: d(28), title: 'Full practice test #2', content: 'L=5.0, R=4.5, W=4.5, S=5.0\nOverall: 5.0. Baseline test.', skills: ['listening', 'reading', 'writing', 'speaking'], mood: 'ok', createdAt: t(28) },
        { date: d(30), title: 'Getting started!', content: 'Bắt đầu lộ trình ôn IELTS.\nTarget: 6.5 trong 3 tháng.\nĐã setup app và tạo study plan.', skills: ['vocabulary'], mood: 'great', createdAt: t(30) },
      ]
      for (const s of sessions) {
        await addToUserCollection(user.uid, 'sessions', s)
      }
      addLog('✅ Sessions: 20 buổi học')

      // ===== TIMER HISTORY (15 phiên) =====
      addLog('⏱️ Tạo 15 timer sessions...')
      const timerHistory = [
        { label: 'Writing Task 2', duration: 2340, completed: true, completedAt: t(0) },
        { label: 'Writing Task 1', duration: 1180, completed: true, completedAt: t(1) },
        { label: 'Speaking Part 2', duration: 120, completed: true, completedAt: t(1) },
        { label: 'Listening', duration: 1800, completed: true, completedAt: t(2) },
        { label: 'Reading', duration: 3500, completed: true, completedAt: t(3) },
        { label: 'Writing Task 2', duration: 2200, completed: true, completedAt: t(4) },
        { label: 'Speaking Part 1', duration: 300, completed: true, completedAt: t(5) },
        { label: 'Speaking Part 3', duration: 280, completed: true, completedAt: t(5) },
        { label: '25 phút', duration: 1500, completed: true, completedAt: t(6) },
        { label: 'Writing Task 1', duration: 1100, completed: true, completedAt: t(7) },
        { label: 'Listening', duration: 1750, completed: true, completedAt: t(8) },
        { label: 'Reading', duration: 3200, completed: false, completedAt: t(10) },
        { label: 'Writing Task 2', duration: 2400, completed: true, completedAt: t(12) },
        { label: 'Speaking Part 2', duration: 120, completed: true, completedAt: t(14) },
        { label: '25 phút', duration: 1500, completed: true, completedAt: t(16) },
      ]
      for (const h of timerHistory) {
        await addToUserCollection(user.uid, 'timerHistory', h)
      }
      addLog('✅ Timer History: 15 phiên')

      // ===== DICTATION HISTORY (10 lần) =====
      addLog('👂 Tạo 10 dictation results...')
      const dictHistory = [
        { mode: 'word', topic: 'all', total: 10, correct: 8, wrong: 2, accuracy: 80, date: t(0) },
        { mode: 'word', topic: 'environment', total: 10, correct: 7, wrong: 3, accuracy: 70, date: t(1) },
        { mode: 'sentence', topic: 'all', total: 5, correct: 3, wrong: 2, accuracy: 60, date: t(2) },
        { mode: 'word', topic: 'education', total: 10, correct: 9, wrong: 1, accuracy: 90, date: t(3) },
        { mode: 'word', topic: 'all', total: 20, correct: 15, wrong: 5, accuracy: 75, date: t(5) },
        { mode: 'sentence', topic: 'health', total: 5, correct: 4, wrong: 1, accuracy: 80, date: t(7) },
        { mode: 'word', topic: 'technology', total: 10, correct: 6, wrong: 4, accuracy: 60, date: t(10) },
        { mode: 'word', topic: 'all', total: 10, correct: 5, wrong: 5, accuracy: 50, date: t(14) },
        { mode: 'sentence', topic: 'all', total: 10, correct: 6, wrong: 4, accuracy: 60, date: t(20) },
        { mode: 'word', topic: 'society', total: 10, correct: 4, wrong: 6, accuracy: 40, date: t(28) },
      ]
      for (const h of dictHistory) {
        await addToUserCollection(user.uid, 'dictationHistory', h)
      }
      addLog('✅ Dictation History: 10 lần')

      // ===== SETTINGS =====
      addLog('⚙️ Cập nhật settings...')
      await setUserDoc(user.uid, 'settings', {
        targetBand: '6.5',
        vocabImported: true,
        dailyCheck: {
          [d(0)]: { vocab: true, listen: true, read: true, write: false, speak: false },
          [d(1)]: { vocab: true, listen: true, read: false, write: true, speak: false },
          [d(2)]: { vocab: true, listen: false, read: false, write: true, speak: false },
        },
      })
      addLog('✅ Settings updated')

      addLog('')
      addLog('🎉 HOÀN THÀNH! Tổng cộng:')
      addLog('   • 25 từ vựng')
      addLog('   • 30 flashcards (5 decks)')
      addLog('   • 12 ghi chú (5 skills)')
      addLog('   • 8 lần thi điểm')
      addLog('   • 20 buổi học (30 ngày)')
      addLog('   • 15 timer sessions')
      addLog('   • 10 dictation results')
      addLog('')
      addLog('→ Quay về Dashboard để xem!')

    } catch (err) {
      addLog('❌ Lỗi: ' + err.message)
      console.error(err)
    }

    setRunning(false)
  }

  return (
    <section className="page active">
      <h2>🌱 Seed Sample Data</h2>
      <div className="card">
        <p>Tạo dữ liệu mẫu phong phú cho tài khoản <strong>{user?.email}</strong></p>
        <p style={{ color: 'var(--yellow)', fontSize: '0.8rem' }}>⚠️ Sẽ thêm data mới, không xoá data cũ. Chạy nhiều lần sẽ bị trùng.</p>
        <button
          className="btn-accent btn-lg"
          style={{ width: '100%', marginTop: '0.8rem' }}
          onClick={seed}
          disabled={running}
        >
          {running ? 'Đang tạo...' : '🚀 Tạo data mẫu'}
        </button>
      </div>

      {log.length > 0 && (
        <div className="card" style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.8 }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </section>
  )
}
