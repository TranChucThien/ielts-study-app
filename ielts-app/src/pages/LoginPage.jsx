import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BookOpen, Layers, Timer, Ear, TrendingUp, CalendarRange, PenLine, Languages } from 'lucide-react'

const FEATURES = [
  { icon: BookOpen, label: 'Vocabulary' },
  { icon: Layers, label: 'Flashcards' },
  { icon: PenLine, label: 'Writing' },
  { icon: Ear, label: 'Dictation' },
  { icon: Languages, label: 'Translate' },
  { icon: Timer, label: 'Timer' },
  { icon: TrendingUp, label: 'Scores' },
  { icon: CalendarRange, label: 'Calendar' },
]

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()

  if (loading) return <div className="login-wrapper"><div className="skeleton" style={{ width: 200, height: 40, borderRadius: 12 }} /></div>
  if (user) return <Navigate to="/" replace />

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">IELTS Study Hub</div>
        <p className="login-subtitle">All-in-one IELTS — Từ vựng, Flashcards, Writing,<br />Dictation, Dịch, Timer & hơn thế nữa</p>
        <div className="login-features">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="login-feature">
              <Icon size={13} /> {label}
            </div>
          ))}
        </div>
        <button className="btn-google" onClick={signIn}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".7"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".5"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".8"/></svg>
          Đăng nhập bằng Google
        </button>
      </div>
    </div>
  )
}
