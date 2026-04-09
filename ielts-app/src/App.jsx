import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import CommandPalette from './components/CommandPalette'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import VocabularyPage from './pages/VocabularyPage'
import FlashcardsPage from './pages/FlashcardsPage'
import NotesPage from './pages/NotesPage'
import ScoresPage from './pages/ScoresPage'
import TimerPage from './pages/TimerPage'
import WritingPage from './pages/WritingPage'
import TranslatePage from './pages/TranslatePage'
import DictationPage from './pages/DictationPage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import SeedPage from './pages/SeedPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vocab" element={<VocabularyPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/scores" element={<ScoresPage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/writing" element={<WritingPage />} />
        <Route path="/translate" element={<TranslatePage />} />
        <Route path="/dictation" element={<DictationPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/seed" element={<SeedPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/ielts-study-app">
      <AuthProvider>
        <ToastProvider>
          <CommandPalette />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
