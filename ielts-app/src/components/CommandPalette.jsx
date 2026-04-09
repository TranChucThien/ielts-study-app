import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Layers, NotebookPen, TrendingUp,
  Timer, Ear, CalendarRange, Settings, Search
} from 'lucide-react'

const COMMANDS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vocab', label: 'Vocabulary', icon: BookOpen },
  { path: '/flashcards', label: 'Flashcards', icon: Layers },
  { path: '/notes', label: 'Notes', icon: NotebookPen },
  { path: '/scores', label: 'Scores', icon: TrendingUp },
  { path: '/timer', label: 'Timer', icon: Timer },
  { path: '/dictation', label: 'Dictation', icon: Ear },
  { path: '/calendar', label: 'Calendar', icon: CalendarRange },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        setQuery('')
        setActive(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  if (!open) return null

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )

  const go = (path) => { navigate(path); setOpen(false) }

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && filtered[active]) go(filtered[active].path)
  }

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '0.6rem' }}>
          <Search size={16} style={{ color: 'var(--text2)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Tìm trang..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={handleKey}
            style={{ border: 'none', borderBottom: 'none', padding: '1rem 0' }}
          />
        </div>
        <div style={{ borderTop: '1px solid var(--border)' }} />
        <div className="cmd-list">
          {filtered.map((c, i) => (
            <div key={c.path} className={`cmd-item${i === active ? ' active' : ''}`} onClick={() => go(c.path)}>
              <c.icon size={18} />
              {c.label}
              <span className="cmd-item-shortcut">⏎</span>
            </div>
          ))}
          {!filtered.length && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text2)', fontSize: '0.85rem' }}>Không tìm thấy</div>}
        </div>
      </div>
    </div>
  )
}
