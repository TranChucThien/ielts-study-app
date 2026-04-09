import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { getUserCollection, addToUserCollection, deleteFromUserCollection } from '../firebase/firestore'

const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'

export async function translateText(text, from, to) {
  const url = `${TRANSLATE_URL}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  const data = await res.json()
  return data[0].map(s => s[0]).join('')
}

export function speakText(text, lang) {
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const langMap = { vi: 'vi-VN', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', en: 'en-US' }
  u.lang = langMap[lang] || 'en-US'
  u.rate = 0.9
  speechSynthesis.speak(u)
}

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
]

export function useTranslateHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])

  const refresh = useCallback(async () => {
    if (!user) return
    const docs = await getUserCollection(user.uid, 'translateHistory')
    setHistory(docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const save = async (from, to, input, result) => {
    if (!user || !input.trim()) return
    await addToUserCollection(user.uid, 'translateHistory', {
      from, to, input: input.trim(), result, createdAt: Date.now(),
    })
    await refresh()
  }

  const remove = async (id) => {
    if (!user) return
    await deleteFromUserCollection(user.uid, 'translateHistory', id)
    await refresh()
  }

  const clearAll = async () => {
    if (!user) return
    for (const h of history) {
      await deleteFromUserCollection(user.uid, 'translateHistory', h.id)
    }
    setHistory([])
  }

  return { history, save, remove, clearAll, refresh }
}
