import { createContext, useState, useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { signInWithGoogle, signOut } from '../firebase/auth'
import { migrateFromLocalStorage } from '../utils/migrateFromLocalStorage'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const migratedRef = useRef(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u && !migratedRef.current) {
        migratedRef.current = true
        try {
          const migrated = await migrateFromLocalStorage(u.uid)
          if (migrated) console.log('LocalStorage data migrated to Firestore')
        } catch (e) { console.error('Migration failed:', e) }
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn: signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
