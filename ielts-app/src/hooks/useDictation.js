import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getUserCollection, addToUserCollection } from '../firebase/firestore'

export function useDictation() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const docs = await getUserCollection(user.uid, 'dictationHistory')
      setHistory(docs.sort((a, b) => (b.date || 0) - (a.date || 0)))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const saveResult = async (result) => {
    if (!user) return
    await addToUserCollection(user.uid, 'dictationHistory', { ...result, date: Date.now() })
    await refresh()
  }

  return { history, loading, saveResult, refresh }
}
