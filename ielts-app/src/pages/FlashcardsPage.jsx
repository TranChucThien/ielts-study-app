import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFlashcards } from '../hooks/useFlashcards'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { Layers, SkipBack, SkipForward, BookOpen, Volume2, Shuffle } from 'lucide-react'

const DECKS = ['all', 'environment', 'education', 'technology', 'health', 'society', 'work', 'other']
const DECK_LABELS = { all: 'Tất cả', environment: 'Environment', education: 'Education', technology: 'Technology', health: 'Health', society: 'Society', work: 'Work', other: 'Other' }

function speak(text) {
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'; u.rate = 0.9
  const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
  const pref = voices.find(v => /google|samantha|daniel|karen/i.test(v.name)) || voices[0]
  if (pref) u.voice = pref
  speechSynthesis.speak(u)
}

export default function FlashcardsPage() {
  const { cards, loading, markReviewed } = useFlashcards()
  const toast = useToast()
  const [deck, setDeck] = useState('all')
  const [studying, setStudying] = useState(false)
  const [studyIdx, setStudyIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffled, setShuffled] = useState(false)

  const filtered = useMemo(() => cards.filter(c => deck === 'all' || c.deck === deck), [cards, deck])
  const studyCards = useMemo(() => {
    const list = [...filtered]
    if (shuffled) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[list[i], list[j]] = [list[j], list[i]]
      }
    } else {
      list.sort((a, b) => a.lastReviewed - b.lastReviewed)
    }
    return list
  }, [filtered, shuffled])

  const startStudy = () => {
    if (!filtered.length) return toast('Thêm từ vựng trước!')
    setStudying(true); setStudyIdx(0); setFlipped(false)
  }

  const current = studyCards[studyIdx]

  const goNext = async () => {
    if (current) await markReviewed(current.id)
    if (studyIdx + 1 >= studyCards.length) { toast('🎉 Hoàn thành!'); setStudying(false); return }
    setStudyIdx(i => i + 1); setFlipped(false)
  }

  const goPrev = () => { if (studyIdx > 0) { setStudyIdx(i => i - 1); setFlipped(false) } }

  if (loading) return <section className="page active"><h2><Layers size={20} /> Flashcards</h2><CardSkeleton count={4} /></section>

  return (
    <section className="page active">
      <h2><Layers size={20} /> Flashcards</h2>
      <div className="fc-controls">
        <button className="btn-accent" onClick={startStudy}>▶ Học ngay</button>
        <button className="btn-secondary" onClick={() => setShuffled(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title={shuffled ? 'Ngẫu nhiên' : 'Theo thứ tự'}>
          <Shuffle size={14} />
        </button>
        <select className="deck-filter" value={deck} onChange={e => setDeck(e.target.value)}>
          {DECKS.map(d => <option key={d} value={d}>{DECK_LABELS[d]}</option>)}
        </select>
        <span>{filtered.length} thẻ</span>
      </div>

      {studying && current ? (
        <div>
          <div className={`flashcard${flipped ? ' flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
            <div className="fc-inner">
              <div className="fc-front">
                <span>{current.front}</span>
                {current.phonetic && <span className="fc-phonetic">{current.phonetic}</span>}
                <small className="fc-hint">Chạm để lật</small>
              </div>
              <div className="fc-back">
                <span>{current.back}</span>
                {current.example && <small>{current.example}</small>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
            <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); speak(current.front) }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Volume2 size={16} /> Phát âm
            </button>
          </div>

          <div id="fc-study-progress">{studyIdx + 1} / {studyCards.length}</div>

          <div className="fc-study-controls">
            <button className="btn-secondary" onClick={() => setStudying(false)}>✕ Thoát</button>
            <button className="btn-secondary" onClick={goPrev} disabled={studyIdx === 0}><SkipBack size={14} /> Trước</button>
            <button className="btn-primary" onClick={goNext}><SkipForward size={14} /> Tiếp</button>
          </div>
        </div>
      ) : (
        <div>
          {!filtered.length ? (
            <div className="empty-state">
              <Layers size={32} /><br />
              Chưa có từ vựng nào
              <br />
              <Link to="/vocab" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.8rem' }}>
                <BookOpen size={14} /> Thêm từ vựng
              </Link>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="fc-item">
              <div className="fc-item-front">
                {c.front}
                {c.phonetic && <span className="fc-item-phonetic">{c.phonetic}</span>}
              </div>
              <span className="fc-item-back">{c.back}</span>
              <button className="voc-speak-btn" onClick={() => speak(c.front)} title="Phát âm">
                <Volume2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
