import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserCollection, addToUserCollection, deleteFromUserCollection } from '../firebase/firestore'
import { useToast } from '../components/Toast'
import { CalendarRange, Headphones, BookOpenText, PenLine, Mic, BookOpen, Trash2 } from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
const SKILL_MAP = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S', vocabulary: 'V' }
const MOOD_LABELS = { great: 'Rất tốt', good: 'Tốt', ok: 'Bình thường', bad: 'Chưa tốt' }

export default function CalendarPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [sessions, setSessions] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', skills: [], mood: '' })

  const refresh = useCallback(async () => {
    if (!user) return
    const docs = await getUserCollection(user.uid, 'sessions')
    setSessions(docs)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const dateSkills = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      if (!map[s.date]) map[s.date] = new Set()
      ;(s.skills || []).forEach(sk => map[s.date].add(sk))
    })
    return map
  }, [sessions])

  const calCells = useMemo(() => {
    const lastDay = new Date(year, month + 1, 0).getDate()
    let startDow = new Date(year, month, 1).getDay()
    startDow = startDow === 0 ? 6 : startDow - 1
    const cells = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push(dateStr)
    }
    return cells
  }, [year, month])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const goToday = () => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()); setSelected(today()) }

  const toggleSkill = (sk) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(sk) ? f.skills.filter(s => s !== sk) : [...f.skills, sk]
    }))
  }

  const handleAdd = async () => {
    if (!form.title.trim() && !form.content.trim()) return
    await addToUserCollection(user.uid, 'sessions', {
      date: selected, title: form.title.trim(), content: form.content.trim(),
      skills: form.skills, mood: form.mood, createdAt: Date.now(),
    })
    setForm({ title: '', content: '', skills: [], mood: '' })
    await refresh()
    toast('Đã lưu buổi học!')
  }

  const handleDelete = async (id) => {
    if (!confirm('Xoá buổi học này?')) return
    await deleteFromUserCollection(user.uid, 'sessions', id)
    await refresh()
  }

  const daySessions = selected ? sessions.filter(s => s.date === selected).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : []

  return (
    <section className="page active">
      <h2><CalendarRange size={20} /> Study Calendar</h2>
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span>{MONTH_NAMES[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
        <button className="btn-secondary" style={{ marginLeft: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={goToday}>Hôm nay</button>
      </div>
      <div className="cal-weekdays">
        {['T2','T3','T4','T5','T6','T7','CN'].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="cal-grid">
        {calCells.map((dateStr, i) => {
          if (!dateStr) return <div key={`e${i}`} className="cal-cell empty" />
          const day = parseInt(dateStr.split('-')[2])
          const isToday = dateStr === today()
          const isSelected = dateStr === selected
          const skills = dateSkills[dateStr]
          return (
            <div key={dateStr}
              className={`cal-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${skills ? ' has-session' : ''}`}
              onClick={() => setSelected(dateStr)}
            >
              <span className="cal-day-num">{day}</span>
              {skills && skills.size > 0 && (
                <div className="cal-flags">
                  {['listening','reading','writing','speaking','vocabulary'].map(sk =>
                    skills.has(sk) ? <span key={sk} className={`cal-flag cal-flag-${SKILL_MAP[sk]}`}>{SKILL_MAP[sk]}</span> : null
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <div id="cal-day-panel" style={{ display: 'block' }}>
          <div className="cal-day-header">
            <h3>{new Date(selected + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}</h3>
            <button className="cal-nav" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="card cal-session-form">
            <input type="text" placeholder="Tiêu đề buổi học" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea placeholder="Ghi chú buổi học..." rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            <div className="ses-skills">
              {[
                { key: 'listening', icon: Headphones, label: 'L' },
                { key: 'reading', icon: BookOpenText, label: 'R' },
                { key: 'writing', icon: PenLine, label: 'W' },
                { key: 'speaking', icon: Mic, label: 'S' },
                { key: 'vocabulary', icon: BookOpen, label: 'V' },
              ].map(({ key, icon: Icon, label }) => (
                <label key={key} className="ses-skill-tag">
                  <input type="checkbox" checked={form.skills.includes(key)} onChange={() => toggleSkill(key)} />
                  <Icon size={12} /> {label}
                </label>
              ))}
            </div>
            <select value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })}>
              <option value="">-- Cảm nhận --</option>
              {Object.entries(MOOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button className="btn-primary" onClick={handleAdd}>Lưu buổi học</button>
          </div>

          <div>
            {!daySessions.length ? (
              <div className="empty-state">Chưa có ghi chú buổi học</div>
            ) : daySessions.map(s => (
              <div key={s.id} className="ses-entry">
                <h4>{s.title}</h4>
                <p>{s.content}</p>
                <div className="ses-entry-meta">
                  <div className="ses-tags">
                    {(s.skills || []).map(sk => <span key={sk} className={`ses-tag-pill ses-tag-${sk}`}>{SKILL_MAP[sk]}</span>)}
                    {s.mood && <span className="ses-mood">{MOOD_LABELS[s.mood] || s.mood}</span>}
                  </div>
                  <div className="ses-entry-actions">
                    <button onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
