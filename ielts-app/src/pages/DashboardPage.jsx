import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getUserCollection, getUserDoc, setUserDoc } from '../firebase/firestore'
import { QUOTES } from '../utils/sampleData'
import { StatSkeleton, CardSkeleton } from '../components/Skeleton'
import {
  Target, Flame, Layers, BookOpen, Lightbulb, Shuffle,
  CalendarRange, CheckCircle, Timer, Ear, NotebookPen
} from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function calcStreak(sessions) {
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()
  if (!dates.length) return 0
  let streak = 0
  let check = new Date()
  for (let i = 0; i < 400; i++) {
    const d = check.toISOString().slice(0, 10)
    if (dates.includes(d)) streak++
    else if (i > 0) break
    check.setDate(check.getDate() - 1)
  }
  return streak
}

function ProgressRing({ current, target }) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  return (
    <div className="progress-ring-wrap">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} className="progress-ring-bg" />
        <circle cx="26" cy="26" r={r} className="progress-ring-fill" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <span className="progress-ring-text">{current || '?'}</span>
    </div>
  )
}

const QUICK_ACTIONS = [
  { to: '/vocab', icon: BookOpen, label: 'Từ vựng' },
  { to: '/flashcards', icon: Layers, label: 'Flashcards' },
  { to: '/timer', icon: Timer, label: 'Timer' },
  { to: '/dictation', icon: Ear, label: 'Dictation' },
  { to: '/notes', icon: NotebookPen, label: 'Notes' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [vocab, setVocab] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [settings, setSettings] = useState({ targetBand: '6.5' })
  const [dailyCheck, setDailyCheck] = useState({})
  const [bandOpen, setBandOpen] = useState(false)
  const [wotd, setWotd] = useState(null)
  const [loading, setLoading] = useState(true)

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [ses, voc, fc, sett] = await Promise.all([
      getUserCollection(user.uid, 'sessions'),
      getUserCollection(user.uid, 'vocabulary'),
      getUserCollection(user.uid, 'flashcards'),
      getUserDoc(user.uid, 'settings'),
    ])
    setSessions(ses); setVocab(voc); setFlashcards(fc)
    if (sett) setSettings(sett)
    setDailyCheck(sett?.dailyCheck?.[today()] || {})
    if (voc.length) setWotd(voc[Math.floor(Math.random() * voc.length)])
    else if (fc.length) {
      const c = fc[Math.floor(Math.random() * fc.length)]
      setWotd({ word: c.front, meaning: c.back, example: c.example })
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const streak = useMemo(() => calcStreak(sessions), [sessions])
  const latestScore = useMemo(() => {
    const scores = sessions // we don't have scores here, use settings
    return null
  }, [])

  const heatmapDates = useMemo(() => {
    const set = new Set(sessions.map(s => s.date))
    const cells = []
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      cells.push({ date: d, active: set.has(d) })
    }
    return cells
  }, [sessions])

  const handleCheck = async (key, checked) => {
    const updated = { ...dailyCheck, [key]: checked }
    setDailyCheck(updated)
    await setUserDoc(user.uid, 'settings', { dailyCheck: { [today()]: updated } })
  }

  const handleBand = async (val) => {
    setSettings(s => ({ ...s, targetBand: val }))
    setBandOpen(false)
    await setUserDoc(user.uid, 'settings', { targetBand: val })
  }

  const pickWotd = () => {
    if (vocab.length) setWotd(vocab[Math.floor(Math.random() * vocab.length)])
  }

  if (loading) {
    return (
      <section className="page active">
        <div className="skeleton" style={{ width: '100%', height: 60, borderRadius: 16, marginBottom: '1rem' }} />
        <StatSkeleton />
        <CardSkeleton count={2} />
      </section>
    )
  }

  return (
    <section className="page active">
      {/* Greeting */}
      <div className="greeting-card">
        {user?.photoURL && <img src={user.photoURL} alt="" className="greeting-avatar" referrerPolicy="no-referrer" />}
        <div className="greeting-text">
          <h2>{getGreeting()}, {user?.displayName?.split(' ')[0] || 'bạn'}! 👋</h2>
          <div className="greeting-sub">{quote}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {QUICK_ACTIONS.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="quick-action"><Icon size={14} /> {label}</Link>
        ))}
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        <div className="card stat-card grad-cyan" onClick={(e) => { e.stopPropagation(); setBandOpen(!bandOpen) }} style={{ cursor: 'pointer', position: 'relative' }}>
          <ProgressRing current={settings.targetBand} target={9} />
          <div className="stat-info">
            <span className="stat-label">Mục tiêu</span>
            <span className="stat-value">{settings.targetBand || '6.5'}</span>
          </div>
          {bandOpen && (
            <div className="custom-select-options open" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6, zIndex: 50 }} onClick={e => e.stopPropagation()}>
              {['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0'].map(v => (
                <div key={v} className={`custom-select-option${settings.targetBand === v ? ' active' : ''}`} onClick={() => handleBand(v)}>{v}</div>
              ))}
            </div>
          )}
        </div>
        <div className="card stat-card grad-warm">
          <div className="stat-icon"><Flame size={28} /></div>
          <div className="stat-info">
            <span className="stat-label">Streak</span>
            <span className="stat-value count-up">{streak} ngày</span>
          </div>
        </div>
        <div className="card stat-card grad-indigo">
          <div className="stat-icon"><Layers size={28} /></div>
          <div className="stat-info">
            <span className="stat-label">Flashcards</span>
            <span className="stat-value count-up">{flashcards.length}</span>
          </div>
        </div>
        <div className="card stat-card grad-emerald">
          <div className="stat-icon"><BookOpen size={28} /></div>
          <div className="stat-info">
            <span className="stat-label">Vocabulary</span>
            <span className="stat-value count-up">{vocab.length}</span>
          </div>
        </div>
      </div>

      {/* Word of the Day */}
      {wotd && (
        <div className="card wotd-card">
          <div className="wotd-label"><Lightbulb size={14} /> Từ vựng hôm nay</div>
          <div className="wotd-word">{wotd.word}</div>
          {wotd.phonetic && <div className="wotd-phonetic">{wotd.phonetic}</div>}
          <div className="wotd-meaning">{wotd.meaning}</div>
          {wotd.example && <div className="wotd-example">{wotd.example}</div>}
          <button className="wotd-refresh" onClick={pickWotd}><Shuffle size={12} /> Từ khác</button>
        </div>
      )}

      {/* Heatmap */}
      <div className="card">
        <h3><CalendarRange size={16} /> 90 ngày gần nhất</h3>
        <div id="heatmap">
          {heatmapDates.map(c => (
            <div key={c.date} className={`hm-cell${c.active ? ' hm-3' : ''}`} title={c.date} />
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="card">
        <h3><CheckCircle size={16} /> Hôm nay</h3>
        <div id="checklist">
          {[
            { key: 'vocab', label: 'Học từ vựng' },
            { key: 'listen', label: 'Listening' },
            { key: 'read', label: 'Reading' },
            { key: 'write', label: 'Writing' },
            { key: 'speak', label: 'Speaking' },
          ].map(({ key, label }) => (
            <label key={key} className="check-item">
              <input type="checkbox" checked={!!dailyCheck[key]} onChange={e => handleCheck(key, e.target.checked)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  )
}
