import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './config'

const provider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, provider)
export const signOut = () => firebaseSignOut(auth)
