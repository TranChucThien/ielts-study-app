import { addToUserCollection, setUserDoc } from '../firebase/firestore'

const LS_KEYS = {
  notes: 'ielts-notes',
  flashcards: 'ielts-flashcards',
  vocabulary: 'ielts-vocabulary',
  scores: 'ielts-scores',
  sessions: 'ielts-sessions',
  settings: 'ielts-settings',
  streak: 'ielts-streak',
  history: 'ielts-history',
  checklist: 'ielts-checklist',
}

function getLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

export async function migrateFromLocalStorage(userId) {
  const hasData = Object.values(LS_KEYS).some(k => localStorage.getItem(k))
  if (!hasData) return false

  const collections = ['notes', 'flashcards', 'vocabulary', 'scores', 'sessions']
  for (const col of collections) {
    const items = getLS(LS_KEYS[col])
    if (!Array.isArray(items)) continue
    for (const item of items) {
      const { id, ...rest } = item
      // Normalize score fields
      if (col === 'scores') {
        rest.listening = rest.l ?? rest.listening ?? 0
        rest.reading = rest.r ?? rest.reading ?? 0
        rest.writing = rest.w ?? rest.writing ?? 0
        rest.speaking = rest.s ?? rest.speaking ?? 0
        rest.createdAt = rest.created || rest.createdAt || Date.now()
        delete rest.l; delete rest.r; delete rest.w; delete rest.s; delete rest.created
      }
      if (col === 'notes') {
        rest.createdAt = rest.date || rest.createdAt || Date.now()
        delete rest.date
      }
      if (col === 'sessions') {
        rest.createdAt = rest.created || rest.createdAt || Date.now()
        delete rest.created
      }
      if (col === 'vocabulary') {
        rest.createdAt = rest.created || rest.createdAt || Date.now()
        delete rest.created
      }
      await addToUserCollection(userId, col, rest)
    }
  }

  // Migrate settings
  const settings = getLS(LS_KEYS.settings) || {}
  const streak = getLS(LS_KEYS.streak) || {}
  await setUserDoc(userId, 'settings', {
    targetBand: settings.targetBand || '6.5',
    streak: streak.count || 0,
    lastStudyDate: streak.lastDate || '',
  })

  // Migrate timer history
  const timerHist = getLS('ielts-timer-history')
  if (Array.isArray(timerHist)) {
    for (const h of timerHist) {
      await addToUserCollection(userId, 'timerHistory', {
        label: h.label, duration: h.duration, completed: h.duration >= h.total,
        completedAt: h.date || Date.now(),
      })
    }
  }

  // Migrate dictation history
  const dictHist = getLS('ielts-dict-history')
  if (Array.isArray(dictHist)) {
    for (const h of dictHist) {
      await addToUserCollection(userId, 'dictationHistory', {
        mode: h.mode, topic: h.topic, total: h.total,
        correct: h.correct, wrong: h.total - h.correct,
        accuracy: h.pct, date: h.date || Date.now(),
      })
    }
  }

  // Clear localStorage
  Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k))
  localStorage.removeItem('ielts-timer-history')
  localStorage.removeItem('ielts-dict-history')
  localStorage.removeItem('ielts-github')
  localStorage.removeItem('ielts-github-sha')

  return true
}
