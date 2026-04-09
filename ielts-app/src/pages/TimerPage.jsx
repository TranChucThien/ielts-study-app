import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserCollection, addToUserCollection } from '../firebase/firestore'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { PenLine, Mic, Headphones, BookOpenText, SlidersHorizontal, Pause, Play, Square, History } from 'lucide-react'

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const PRESETS = [
  { group: 'Writing', icon: PenLine, items: [
    { time: 1200, label: 'Writing Task 1', display: '20:00', name: 'Task 1' },
    { time: 2400, label: 'Writing Task 2', display: '40:00', name: 'Task 2' },
  ]},
  { group: 'Speaking', icon: Mic, items: [
    { time: 300, label: 'Speaking Part 1', display: '5:00', name: 'Part 1' },
    { time: 120, label: 'Speaking Part 2', display: '2:00', name: 'Part 2' },
    { time: 300, label: 'Speaking Part 3', display: '5:00', name: 'Part 3' },
  ]},
  { group: 'Full Test', icon: Headphones, items: [
    { time: 1800, label: 'Listening', display: '30:00', name: 'Listening' },
    { time: 3600, label: 'Reading', display: '60:00', name: 'Reading' },
  ]},
]

export default function TimerPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [total, setTotal] = useState(0)
  const [label, setLabel] = useState('')
  const [customMin, setCustomMin] = useState(25)
  const [history, setHistory] = useState([])
  const intervalRef = useRef(null)

  const loadHistory = useCallback(async () => {
    if (!user) return
    const docs = await getUserCollection(user.uid, 'timerHistory')
    setHistory(docs.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)))
  }, [user])

  useEffect(() => { loadHistory() }, [loadHistory])

  useEffect(() => {
    if (running && !paused) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            toast('Hết giờ!')
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, paused, toast])

  const saveSession = async (secs, tot, lbl, completed) => {
    if (!user || secs < 5) return
    await addToUserCollection(user.uid, 'timerHistory', {
      label: lbl, duration: tot - secs, completed, completedAt: Date.now(),
    })
    await loadHistory()
  }

  const startTimer = (secs, lbl) => {
    clearInterval(intervalRef.current)
    setSeconds(secs)
    setTotal(secs)
    setLabel(lbl)
    setRunning(true)
    setPaused(false)
  }

  const handleStop = async () => {
    clearInterval(intervalRef.current)
    await saveSession(seconds, total, label, seconds <= 0)
    setRunning(false)
  }

  // Save when timer reaches 0
  useEffect(() => {
    if (seconds === 0 && total > 0 && !running) {
      saveSession(0, total, label, true)
    }
  }, [seconds, running])

  const pct = total > 0 ? seconds / total : 0
  const offset = 565.48 * (1 - pct)

  return (
    <section className="page active">
      <h2>Timer</h2>

      {!running ? (
        <div className="timer-presets">
          {PRESETS.map(({ group, icon: Icon, items }) => (
            <div key={group}>
              <h3><Icon size={16} /> {group}</h3>
              <div className="preset-grid">
                {items.map(p => (
                  <button key={p.label} className="preset-btn" onClick={() => startTimer(p.time, p.label)}>
                    <span className="preset-time">{p.display}</span>
                    <span className="preset-name">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <h3><SlidersHorizontal size={16} /> Tuỳ chỉnh</h3>
          <div className="custom-timer">
            <input type="number" min={1} max={180} value={customMin} onChange={e => setCustomMin(+e.target.value)} />
            <span>phút</span>
            <button className="btn-primary" onClick={() => customMin > 0 && startTimer(customMin * 60, `${customMin} phút`)}>Bắt đầu</button>
          </div>
        </div>
      ) : (
        <div id="timer-display" style={{ display: 'block' }}>
          <div id="timer-label">{label}</div>
          <div id="timer-ring">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" className="ring-bg" />
              <circle cx="100" cy="100" r="90" className="ring-progress" style={{ strokeDashoffset: offset }} />
            </svg>
            <div id="timer-clock">{seconds > 0 ? fmtTime(seconds) : 'Hết giờ!'}</div>
          </div>
          <div className="timer-actions">
            <button className="btn-secondary btn-lg" onClick={() => setPaused(!paused)}>
              {paused ? <><Play size={16} /> Tiếp tục</> : <><Pause size={16} /> Tạm dừng</>}
            </button>
            <button className="btn-hard btn-lg" onClick={handleStop}><Square size={16} /> Dừng</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3><History size={16} /> Lịch sử</h3>
        <div>
          {!history.length ? (
            <div className="empty-state">Chưa có lịch sử</div>
          ) : history.slice(0, 10).map(h => (
            <div key={h.id} className="history-row">
              <span className="history-label">{h.label}</span>
              <span>{fmtTime(h.duration || 0)}</span>
              <span className="history-date">{h.completedAt && new Date(h.completedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
