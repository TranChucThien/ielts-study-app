import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getUserCollection, getUserDoc, setUserDoc } from '../firebase/firestore'
import { QUOTES } from '../utils/sampleData'
import { StatSkeleton, CardSkeleton } from '../components/Skeleton'
import {
  Target, Flame, Layers, BookOpen, Lightbulb, Shuffle,
  CalendarRange, CheckCircle, Timer, Ear, NotebookPen, PenLine, Languages
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
  { to: '/writing', icon: PenLine, label: 'Writing' },
  { to: '/dictation', icon: Ear, label: 'Dictation' },
  { to: '/translate', icon: Languages, label: 'Translate' },
  { to: '/notes', icon: NotebookPen, label: 'Notes' },
  { to: '/timer', icon: Timer, label: 'Timer' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [vocab, setVocab] = useState([])
  const [settings, setSettings] = useState({ targetBand: '6.5' })
  const [dailyCheck, setDailyCheck] = useState({})
  const [bandOpen, setBandOpen] = useState(false)
  const [wotd, setWotd] = useState(null)
  const [loading, setLoading] = useState(true)

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [ses, voc, sett] = await Promise.all([
      getUserCollection(user.uid, 'sessions'),
      getUserCollection(user.uid, 'vocabulary'),
      getUserDoc(user.uid, 'settings'),
    ])
    setSessions(ses); setVocab(voc)
    if (sett) setSettings(sett)
    setDailyCheck(sett?.dailyCheck?.[today()] || {})
    if (voc.length) setWotd(voc[Math.floor(Math.random() * voc.length)])
    setLoading(false)
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const streak = useMemo(() => calcStreak(sessions), [sessions])

  const weekDays = useMemo(() => {
    const sessionDates = new Set(sessions.map(s => s.date))
    const now = new Date()
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(now.getDate() - dow + i)
      const dateStr = d.toISOString().slice(0, 10)
      days.push({
        label: ['T2','T3','T4','T5','T6','T7','CN'][i],
        day: d.getDate(),
        date: dateStr,
        isToday: dateStr === today(),
        hasSession: sessionDates.has(dateStr),
      })
    }
    return days
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
        <div className="card stat-card grad-cyan" onClick={(e) => { e.stopPropagation(); setBandOpen(!bandOpen) }} style={{ cursor: 'pointer', zIndex: bandOpen ? 60 : 'auto' }}>
          <ProgressRing current={settings.targetBand} target={9} />
          <div className="stat-info" style={{ position: 'relative' }}>
            <span className="stat-label">Mục tiêu</span>
            <span className="stat-value">{settings.targetBand || '6.5'} ▾</span>
            {bandOpen && (
              <div className="custom-select-options open" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100 }} onClick={e => e.stopPropagation()}>
                {['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0'].map(v => (
                  <div key={v} className={`custom-select-option${settings.targetBand === v ? ' active' : ''}`} onClick={() => handleBand(v)}>{v}</div>
                ))}
              </div>
            )}
          </div>
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
            <span className="stat-label">Đã ôn tập</span>
            <span className="stat-value count-up">{vocab.filter(v => v.lastReviewed).length}/{vocab.length}</span>
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

      {/* Week Calendar + Streak */}
      <Link to="/calendar" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h3 style={{ margin: 0 }}><CalendarRange size={16} /> Tuần này</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Xem lịch ›</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
            {weekDays.map(d => (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text2)', textTransform: 'uppercase' }}>{d.label}</span>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: d.isToday ? 700 : 500,
                  background: d.isToday ? 'var(--accent)' : d.hasSession ? 'rgba(16,185,129,0.15)' : 'var(--surface2)',
                  color: d.isToday ? '#fff' : d.hasSession ? 'var(--green)' : 'var(--text2)',
                  border: d.isToday ? 'none' : d.hasSession ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                }}>{d.day}</div>
                {d.hasSession && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} />}
                {!d.hasSession && <div style={{ width: 5, height: 5 }} />}
              </div>
            ))}
          </div>
        </div>
      </Link>

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
