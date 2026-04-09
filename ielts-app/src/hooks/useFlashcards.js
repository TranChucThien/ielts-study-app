import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  getUserCollection, addToUserCollection,
  deleteFromUserCollection, setUserDoc, db, doc
} from '../firebase/firestore'

export function useFlashcards() {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const docs = await getUserCollection(user.uid, 'flashcards')
      setCards(docs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const add = async (card) => {
    if (!user) return
    await addToUserCollection(user.uid, 'flashcards', { ...card, createdAt: Date.now() })
    await refresh()
  }

  const remove = async (id) => {
    if (!user) return
    await deleteFromUserCollection(user.uid, 'flashcards', id)
    await refresh()
  }

  const markReviewed = async (id) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'flashcards', id)
    await setUserDoc(user.uid, `flashcards/${id}`, { lastReviewed: Date.now() })
  }

  return { cards, loading, refresh, add, remove, markReviewed }
}
