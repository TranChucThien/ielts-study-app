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

  const importFromFile = async (file) => {
    if (!user) return 0
    const text = await file.text()
    let items = []

    if (file.name.endsWith('.json')) {
      const parsed = JSON.parse(text)
      items = Array.isArray(parsed) ? parsed : []
    } else {
      // CSV: word,type,meaning,phonetic,example,synonyms,topic
      const lines = text.split('\n').filter(l => l.trim())
      const header = lines[0].toLowerCase()
      const hasHeader = header.includes('word') && header.includes('meaning')
      const dataLines = hasHeader ? lines.slice(1) : lines
      for (const line of dataLines) {
        const cols = line.split(',').map(c => c.trim())
        if (cols.length < 2) continue
        items.push({
          word: cols[0] || '',
          type: cols[1] || '',
          meaning: cols[2] || '',
          phonetic: cols[3] || '',
          example: cols[4] || '',
          synonyms: cols[5] ? cols[5].split(';').map(s => s.trim()).filter(Boolean) : [],
          topic: cols[6] || 'other',
        })
      }
    }

    const existing = new Set(vocab.map(v => v.word.toLowerCase()))
    let count = 0
    for (const item of items) {
      if (!item.word || !item.meaning) continue
      if (existing.has(item.word.toLowerCase())) continue
      await addToUserCollection(user.uid, 'vocabulary', {
        word: item.word.trim(),
        type: item.type || '',
        meaning: item.meaning.trim(),
        phonetic: item.phonetic || '',
        example: item.example || '',
        synonyms: item.synonyms || [],
        topic: item.topic || 'other',
        createdAt: Date.now(),
      })
      existing.add(item.word.toLowerCase())
      count++
    }
    if (count > 0) await refresh()
    return count
  }

  return { vocab, loading, refresh, add, remove, importSample, importFromFile }
}
