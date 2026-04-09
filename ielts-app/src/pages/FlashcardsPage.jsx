import { useState, useMemo, useRef } from 'react'
import { useFlashcards } from '../hooks/useFlashcards'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { Layers, Trash2, SkipBack, SkipForward } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { setUserDoc } from '../firebase/firestore'

const DECKS = ['all', 'general', 'listening', 'reading', 'writing', 'speaking']

export default function FlashcardsPage() {
  const { user } = useAuth()
  const { cards, loading, add, remove, markReviewed } = useFlashcards()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [deck, setDeck] = useState('all')
  const [form, setForm] = useState({ front: '', back: '', example: '', deck: 'general' })
  const [studying, setStudying] = useState(false)
  const [studyIdx, setStudyIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const touchStartX = useRef(0)

  const filtered = useMemo(() => cards.filter(c => deck === 'all' || c.deck === deck), [cards, deck])
  const studyCards = useMemo(() => [...filtered].sort((a, b) => (a.score || 0) - (b.score || 0)), [filtered])

  const handleSave = async () => {
    if (!form.front.trim() || !form.back.trim()) return
    await add({ front: form.front.trim(), back: form.back.trim(), example: form.example.trim(), deck: form.deck })
    setForm({ front: '', back: '', example: '', deck: 'general' })
    setShowForm(false)
    toast('Đã lưu flashcard!')
  }

  const handleDelete = async (id) => {
    if (!confirm('Xoá thẻ này?')) return
    await remove(id)
  }

  const startStudy = () => {
    if (!filtered.length) return toast('Thêm flashcard trước!')
    setStudying(true); setStudyIdx(0); setFlipped(false)
  }

  const exitStudy = () => setStudying(false)

  const rateCard = async (rating) => {
    const card = studyCards[studyIdx]
    if (card) {
      const scoreChange = { hard: -1, ok: 0, easy: 2 }[rating]
      await setUserDoc(user.uid, `flashcards/${card.id}`, {
        score: (card.score || 0) + scoreChange,
        lastReviewed: Date.now(),
      })
    }
    if (studyIdx + 1 >= studyCards.length) { toast('🎉 Hoàn thành!'); exitStudy(); return }
    setStudyIdx(i => i + 1); setFlipped(false)
  }

  const prevCard = () => { if (studyIdx > 0) { setStudyIdx(i => i - 1); setFlipped(false) } }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 60) rateCard(diff > 0 ? 'easy' : 'hard')
  }

  if (loading) return <section className="page active"><h2>Flashcards</h2><CardSkeleton count={4} /></section>

  return (
    <section className="page active">
      <h2>Flashcards</h2>
      <div className="fc-controls">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Thêm</button>
        <button className="btn-accent" onClick={startStudy}>▶ Học ngay</button>
        <select className="deck-filter" value={deck} onChange={e => setDeck(e.target.value)}>
          {DECKS.map(d => <option key={d} value={d}>{d === 'all' ? 'Tất cả' : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
        <span>{filtered.length} thẻ</span>
      </div>

      {showForm && (
        <div className="card">
          <input type="text" placeholder="Mặt trước (từ / câu hỏi)" value={form.front} onChange={e => setForm({ ...form, front: e.target.value })} />
          <input type="text" placeholder="Mặt sau (nghĩa / đáp án)" value={form.back} onChange={e => setForm({ ...form, back: e.target.value })} />
          <input type="text" placeholder="Ví dụ (tuỳ chọn)" value={form.example} onChange={e => setForm({ ...form, example: e.target.value })} />
          <select value={form.deck} onChange={e => setForm({ ...form, deck: e.target.value })}>
            {DECKS.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave}>Lưu</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Huỷ</button>
          </div>
        </div>
      )}

      {studying && studyCards.length > 0 ? (
        <div>
          <div
            className={`flashcard${flipped ? ' flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="fc-inner">
              <div className="fc-front">
                <span>{studyCards[studyIdx]?.front}</span>
                <small className="fc-hint">Chạm để lật</small>
              </div>
              <div className="fc-back">
                <span>{studyCards[studyIdx]?.back}</span>
                {studyCards[studyIdx]?.example && <small>{studyCards[studyIdx].example}</small>}
              </div>
            </div>
          </div>

          <div className="swipe-hint">← Vuốt trái: Khó &nbsp;|&nbsp; Vuốt phải: Dễ →</div>

          <div id="fc-study-progress">{studyIdx + 1} / {studyCards.length}</div>

          {/* SRS Rating */}
          {flipped && (
            <div className="srs-actions">
              <button className="srs-btn hard" onClick={() => rateCard('hard')}>😓<span>Khó</span></button>
              <button className="srs-btn ok" onClick={() => rateCard('ok')}>🤔<span>Ổn</span></button>
              <button className="srs-btn easy" onClick={() => rateCard('easy')}>😎<span>Dễ</span></button>
            </div>
          )}

          <div className="fc-study-controls">
            <button className="btn-secondary" onClick={exitStudy}>✕ Thoát</button>
            <button className="btn-secondary" onClick={prevCard} disabled={studyIdx === 0}><SkipBack size={14} /> Trước</button>
            <button className="btn-primary" onClick={() => rateCard('ok')}><SkipForward size={14} /> Tiếp</button>
          </div>
        </div>
      ) : (
        <div>
          {!filtered.length ? (
            <div className="empty-state"><Layers size={32} /><br />Chưa có flashcard nào</div>
          ) : filtered.map(c => (
            <div key={c.id} className="fc-item">
              <div className="fc-item-front">{c.front}</div>
              <span className="fc-item-back">{c.back}</span>
              <div className="fc-item-actions">
                <button onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
