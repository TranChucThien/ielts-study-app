import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import { getUserCollection, addToUserCollection, deleteFromUserCollection, getUserDoc, setUserDoc, db } from '../firebase/firestore'
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore'
import {
  Settings, Compass, TrendingUp, NotebookPen, Timer, Ear, CalendarRange,
  Database, Download, Upload, Trash2, LogOut, PenLine, Languages
} from 'lucide-react'

const COLLECTIONS = ['vocabulary', 'flashcards', 'notes', 'scores', 'sessions', 'timerHistory', 'dictationHistory', 'writing', 'translateHistory']

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleExport = async () => {
    const data = {}
    for (const col of COLLECTIONS) {
      data[col] = await getUserCollection(user.uid, col)
    }
    data.settings = await getUserDoc(user.uid, 'settings')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ielts-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    toast('Đã export!')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      if (!confirm('Ghi đè dữ liệu hiện tại?')) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        for (const col of COLLECTIONS) {
          if (!data[col]) continue
          for (const item of data[col]) {
            const { id, ...rest } = item
            await addToUserCollection(user.uid, col, rest)
          }
        }
        if (data.settings) await setUserDoc(user.uid, 'settings', data.settings)
        toast('Import OK!')
      } catch { toast('File không hợp lệ!') }
    }
    input.click()
  }

  const handleReset = async () => {
    if (!confirm('XOÁ HẾT dữ liệu?')) return
    for (const col of COLLECTIONS) {
      const docs = await getUserCollection(user.uid, col)
      const batch = writeBatch(db)
      docs.forEach(d => batch.delete(doc(db, 'users', user.uid, col, d.id)))
      if (docs.length) await batch.commit()
    }
    toast('Đã xoá!')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <section className="page active">
      <h2><Settings size={20} /> Settings</h2>

      {user && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={user.photoURL} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} referrerPolicy="no-referrer" />
          <div>
            <div style={{ fontWeight: 600 }}>{user.displayName}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{user.email}</div>
          </div>
          <button className="btn-hard" style={{ marginLeft: 'auto' }} onClick={handleSignOut}><LogOut size={14} /> Sign Out</button>
        </div>
      )}

      <div className="card">
        <h3><Compass size={16} /> Xem thêm</h3>
        {[
          { to: '/writing', icon: PenLine, label: 'Writing' },
          { to: '/translate', icon: Languages, label: 'Translate' },
          { to: '/scores', icon: TrendingUp, label: 'Band Score Tracker' },
          { to: '/notes', icon: NotebookPen, label: 'Notes' },
          { to: '/timer', icon: Timer, label: 'Timer' },
          { to: '/dictation', icon: Ear, label: 'Dictation' },
          { to: '/calendar', icon: CalendarRange, label: 'Calendar' },
        ].map(({ to, icon: Icon, label }, i) => (
          <button key={to} className="btn-secondary" style={{ width: '100%', marginTop: i === 0 ? 0 : '0.5rem' }} onClick={() => navigate(to)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="card">
        <h3><Database size={16} /> Dữ liệu</h3>
        <div className="form-actions" style={{ flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleExport}><Download size={14} /> Export</button>
          <button className="btn-secondary" onClick={handleImport}><Upload size={14} /> Import</button>
          <button className="btn-hard" onClick={handleReset}><Trash2 size={14} /> Xoá hết</button>
        </div>
      </div>
    </section>
  )
}
