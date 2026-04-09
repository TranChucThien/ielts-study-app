import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserCollection } from '../firebase/firestore'
import { useDictation } from '../hooks/useDictation'
import { useToast } from '../components/Toast'
import {
  Ear, TextCursor, Text, Snail, Play, FastForward,
  Volume2, Check, SkipForward, ArrowRight, RotateCcw, History
} from 'lucide-react'

export default function DictationPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { history, saveResult } = useDictation()
  const [vocab, setVocab] = useState([])
  const [mode, setMode] = useState('word')
  const [rate, setRate] = useState(1)
  const [count, setCount] = useState(10)
  const [topic, setTopic] = useState('all')
  const [phase, setPhase] = useState('setup') // setup | play | result
  const [items, setItems] = useState([])
  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [results, setResults] = useState([])
  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    getUserCollection(user.uid, 'vocabulary').then(setVocab)
  }, [user])

  const getItems = () => {
    let pool = vocab.filter(v => topic === 'all' || v.topic === topic)
    let list = mode === 'word'
      ? pool.map(v => v.word)
      : pool.filter(v => v.example).map(v => v.example)
    list = [...new Set(list)].filter(Boolean)
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return count > 0 ? list.slice(0, count) : list
  }

  const speak = (text) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = rate
    const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
    const pref = voices.find(v => /google|samantha|daniel|karen/i.test(v.name)) || voices[0]
    if (pref) u.voice = pref
    speechSynthesis.speak(u)
  }

  const startGame = () => {
    const pool = getItems()
    if (!pool.length) return toast(mode === 'word' ? 'Thêm từ vựng trước!' : 'Cần từ vựng có ví dụ!')
    setItems(pool); setIdx(0); setCorrect(0); setWrong(0); setResults([]); setAnswered(false); setFeedback(null); setInput('')
    setPhase('play')
    setTimeout(() => { speak(pool[0]); inputRef.current?.focus() }, 300)
  }

  const checkAnswer = () => {
    if (answered) return
    setAnswered(true)
    const answer = items[idx]
    const typed = input.trim()
    const isCorrect = typed.toLowerCase() === answer.toLowerCase()
    if (isCorrect) {
      setCorrect(c => c + 1)
      setFeedback({ type: 'correct' })
    } else {
      setWrong(w => w + 1)
      setFeedback({ type: 'wrong', answer, typed })
    }
    setResults(r => [...r, { answer, typed, ok: isCorrect }])
  }

  const skip = () => {
    setAnswered(true)
    const answer = items[idx]
    setWrong(w => w + 1)
    setFeedback({ type: 'wrong', answer, typed: '' })
    setResults(r => [...r, { answer, typed: '', ok: false }])
  }

  const next = () => {
    if (idx + 1 >= items.length) { showResult(); return }
    setIdx(i => i + 1); setAnswered(false); setFeedback(null); setInput('')
    setTimeout(() => { speak(items[idx + 1]); inputRef.current?.focus() }, 100)
  }

  const showResult = async () => {
    setPhase('result')
    const total = correct + wrong + (answered ? 0 : 0)
    const finalCorrect = results.filter(r => r.ok).length + (feedback?.type === 'correct' ? 0 : 0)
    const pct = total ? Math.round((correct / total) * 100) : 0
    await saveResult({ mode, topic, total, correct, wrong, accuracy: pct })
  }

  const totalDone = correct + wrong
  const totalItems = items.length
  const pct = totalItems ? Math.round((correct / Math.max(totalDone, 1)) * 100) : 0

  const diffHtml = (answer, typed) => {
    const aLow = answer.toLowerCase()
    const tLow = (typed || '').toLowerCase()
    return answer.split('').map((ch, i) => {
      const cls = i < tLow.length && tLow[i] === aLow[i] ? 'diff-char-ok' : 'diff-char-err'
      return <span key={i} className={cls}>{ch}</span>
    })
  }

  if (phase === 'result') {
    const finalResults = results
    const finalPct = finalResults.length ? Math.round((finalResults.filter(r => r.ok).length / finalResults.length) * 100) : 0
    return (
      <section className="page active">
        <h2><Ear size={20} /> Dictation</h2>
        <div className="card dict-result-card">
          <div className="dict-result-icon">🎉</div>
          <h3>Kết quả</h3>
          <div className="dict-result-score">
            <div className="dict-result-correct"><span>{finalResults.filter(r => r.ok).length}</span><small>Đúng</small></div>
            <div className="dict-result-wrong"><span>{finalResults.filter(r => !r.ok).length}</span><small>Sai</small></div>
            <div className="dict-result-pct"><span>{finalPct}%</span><small>Chính xác</small></div>
          </div>
          <div className="dict-result-list">
            {finalResults.map((r, i) => (
              <div key={i} className={`dict-r-item ${r.ok ? 'ok' : 'fail'}`}>
                <span className="dict-r-icon">{r.ok ? '✓' : '✗'}</span>
                <span className="dict-r-word">{r.answer}</span>
                {!r.ok && r.typed && <span className="dict-r-typed">→ {r.typed}</span>}
              </div>
            ))}
          </div>
          <div className="form-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn-accent" onClick={startGame}><RotateCcw size={14} /> Làm lại</button>
            <button className="btn-secondary" onClick={() => setPhase('setup')}>← Quay lại</button>
          </div>
        </div>
      </section>
    )
  }

  if (phase === 'play') {
    return (
      <section className="page active">
        <h2><Ear size={20} /> Dictation</h2>
        <div className="dict-progress-bar"><div className="dict-progress-fill" style={{ width: `${(idx / totalItems) * 100}%` }} /></div>
        <div className="dict-stats-row">
          <span>{idx + 1}/{totalItems}</span>
          <span><span style={{ color: 'var(--green)' }}>✓ {correct}</span> &nbsp; <span style={{ color: 'var(--red)' }}>✗ {wrong}</span></span>
        </div>
        <div className="card dict-card">
          <div className="dict-listen-area">
            <button className="dict-play-btn" onClick={() => speak(items[idx])}><Volume2 size={24} /></button>
            <span className="dict-play-hint">Nhấn để nghe</span>
          </div>
          <input ref={inputRef} type="text" id="dict-input" placeholder="Gõ lại những gì bạn nghe..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { answered ? next() : checkAnswer() } }}
            autoComplete="off" autoCapitalize="off" spellCheck={false}
          />
          <div className="dict-feedback" style={{ minHeight: '2.5rem' }}>
            {feedback?.type === 'correct' && <span className="correct">✓ Chính xác!</span>}
            {feedback?.type === 'wrong' && (
              <>
                {feedback.typed && <><span className="wrong">{feedback.typed}</span><br /></>}
                <span className="answer">{diffHtml(feedback.answer, feedback.typed)}</span>
              </>
            )}
          </div>
          <div className="dict-actions">
            {!answered ? (
              <>
                <button className="btn-primary" onClick={checkAnswer}><Check size={14} /> Kiểm tra</button>
                <button className="btn-secondary" onClick={skip}><SkipForward size={14} /> Bỏ qua</button>
              </>
            ) : (
              <button className="btn-primary" onClick={next}><ArrowRight size={14} /> Tiếp</button>
            )}
          </div>
        </div>
        <button className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => { speechSynthesis.cancel(); if (results.length) showResult(); else setPhase('setup') }}>✕ Thoát</button>
      </section>
    )
  }

  // Setup phase
  return (
    <section className="page active">
      <h2><Ear size={20} /> Dictation</h2>
      <div className="card">
        <h3>Chế độ luyện</h3>
        <div className="dict-mode-grid">
          <button className={`dict-mode-btn${mode === 'word' ? ' active' : ''}`} onClick={() => setMode('word')}>
            <TextCursor size={24} /><span>Từ vựng</span><small>Nghe từ → gõ lại</small>
          </button>
          <button className={`dict-mode-btn${mode === 'sentence' ? ' active' : ''}`} onClick={() => setMode('sentence')}>
            <Text size={24} /><span>Câu</span><small>Nghe câu → gõ lại</small>
          </button>
        </div>
      </div>
      <div className="card">
        <h3>Tốc độ đọc</h3>
        <div className="dict-speed-options">
          {[{ r: 0.7, icon: Snail, label: 'Chậm' }, { r: 1, icon: Play, label: 'Bình thường' }, { r: 1.3, icon: FastForward, label: 'Nhanh' }].map(({ r, icon: Icon, label }) => (
            <button key={r} className={`dict-speed-btn${rate === r ? ' active' : ''}`} onClick={() => setRate(r)}><Icon size={14} /> {label}</button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Số câu</h3>
        <div className="dict-speed-options">
          {[5, 10, 20, 0].map(c => (
            <button key={c} className={`dict-count-btn${count === c ? ' active' : ''}`} onClick={() => setCount(c)}>{c || 'Tất cả'}</button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Chủ đề</h3>
        <div className="dict-speed-options">
          {['all', 'environment', 'education', 'technology', 'health', 'society', 'work'].map(t => (
            <button key={t} className={`dict-topic-btn${topic === t ? ' active' : ''}`} onClick={() => setTopic(t)}>
              {t === 'all' ? 'Tất cả' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <button className="btn-accent btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} onClick={startGame}><Play size={16} /> Bắt đầu luyện</button>
      <div className="card" style={{ marginTop: '0.8rem' }}>
        <h3><History size={16} /> Lịch sử</h3>
        <div>
          {!history.length ? (
            <div className="empty-state"><Ear size={24} /><br />Chưa có lịch sử</div>
          ) : history.slice(0, 10).map(h => (
            <div key={h.id} className="history-row">
              <span className="history-label">{h.mode === 'word' ? 'Từ' : 'Câu'}{h.topic !== 'all' ? ` · ${h.topic}` : ''}</span>
              <span className="history-score"><span style={{ color: 'var(--green)' }}>{h.correct}</span>/{h.total}</span>
              <span className="history-pct">{h.accuracy}%</span>
              <span className="history-date">{h.date && new Date(h.date).toLocaleDateString('vi-VN')}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
