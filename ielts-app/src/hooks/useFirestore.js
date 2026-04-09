import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  getUserCollection, addToUserCollection,
  deleteFromUserCollection, getUserDoc, setUserDoc
} from '../firebase/firestore'

export function useFirestore(collectionName) {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const docs = await getUserCollection(user.uid, collectionName)
      setData(docs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [user, collectionName])

  useEffect(() => { refresh() }, [refresh])

  const add = async (item) => {
    if (!user) return
    await addToUserCollection(user.uid, collectionName, item)
    await refresh()
  }

  const remove = async (id) => {
    if (!user) return
    await deleteFromUserCollection(user.uid, collectionName, id)
    await refresh()
  }

  const getSettings = async () => {
    if (!user) return null
    return getUserDoc(user.uid, 'settings')
  }

  const updateSettings = async (fields) => {
    if (!user) return
    await setUserDoc(user.uid, 'settings', fields)
  }

  return { data, loading, refresh, add, remove, getSettings, updateSettings }
}
