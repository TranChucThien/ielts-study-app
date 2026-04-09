import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getUserCollection, setUserDoc } from '../firebase/firestore'

export function useFlashcards() {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const docs = await getUserCollection(user.uid, 'vocabulary')
      setCards(docs.map(v => ({
        id: v.id,
        front: v.word,
        back: v.meaning,
        example: v.example || '',
        phonetic: v.phonetic || '',
        deck: v.topic || 'other',
        lastReviewed: v.lastReviewed || 0,
        createdAt: v.createdAt || 0,
      })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const markReviewed = async (id) => {
    if (!user) return
    await setUserDoc(user.uid, `vocabulary/${id}`, { lastReviewed: Date.now() })
    setCards(prev => prev.map(c => c.id === id ? { ...c, lastReviewed: Date.now() } : c))
  }

  return { cards, loading, refresh, markReviewed }
}
