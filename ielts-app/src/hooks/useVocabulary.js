import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  getUserCollection, addToUserCollection,
  deleteFromUserCollection, getUserDoc, setUserDoc, batchWrite, db, doc
} from '../firebase/firestore'
import { SAMPLE_VOCAB } from '../utils/sampleData'

export function useVocabulary() {
  const { user } = useAuth()
  const [vocab, setVocab] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const docs = await getUserCollection(user.uid, 'vocabulary')
      setVocab(docs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const add = async (word) => {
    if (!user) return
    await addToUserCollection(user.uid, 'vocabulary', { ...word, createdAt: Date.now() })
    await refresh()
  }

  const remove = async (id) => {
    if (!user) return
    await deleteFromUserCollection(user.uid, 'vocabulary', id)
    await refresh()
  }

  const importSample = async () => {
    if (!user) return
    const settings = await getUserDoc(user.uid, 'settings')
    if (settings?.vocabImported) return 0
    const existing = new Set(vocab.map(v => v.word.toLowerCase()))
    const batch = batchWrite()
    let count = 0
    for (const s of SAMPLE_VOCAB) {
      if (existing.has(s.word.toLowerCase())) continue
      const ref = doc(db, 'users', user.uid, 'vocabulary', `sample_${count}`)
      batch.set(ref, { ...s, createdAt: Date.now() })
      count++
    }
    if (count > 0) await batch.commit()
    await setUserDoc(user.uid, 'settings', { vocabImported: true })
    await refresh()
    return count
  }

  return { vocab, loading, refresh, add, remove, importSample }
}
