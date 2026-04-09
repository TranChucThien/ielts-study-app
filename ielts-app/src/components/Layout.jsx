import { NavLink, Outlet } from 'react-router-dom'
import PageTransition from './PageTransition'
import Translator from './Translator'
import {
  LayoutDashboard, BookOpen, Layers, NotebookPen, TrendingUp,
  Timer, Ear, CalendarRange, Settings, GraduationCap, PenLine, Languages
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vocab', icon: BookOpen, label: 'Vocabulary' },
  { to: '/flashcards', icon: Layers, label: 'Flashcards' },
  { to: '/notes', icon: NotebookPen, label: 'Notes' },
  { to: '/writing', icon: PenLine, label: 'Writing' },
  { to: '/translate', icon: Languages, label: 'Translate' },
  { to: '/dictation', icon: Ear, label: 'Dictation' },
  { to: '/calendar', icon: CalendarRange, label: 'Calendar' },
  { to: '/scores', icon: TrendingUp, label: 'Scores' },
  { to: '/timer', icon: Timer, label: 'Timer' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const bottomItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/vocab', icon: BookOpen, label: 'Vocab' },
  { to: '/flashcards', icon: Layers, label: 'Cards' },
  { to: '/dictation', icon: Ear, label: 'Dictation' },
  { to: '/settings', icon: Settings, label: 'More' },
]

export default function Layout() {
  return (
    <>
      <nav id="sidebar">
        <div className="logo"><GraduationCap size={20} /> IELTS Hub</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      <nav id="bottom-nav">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `bnav${isActive ? ' active' : ''}`}>
            <Icon size={22} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <Translator />
    </>
  )
}
