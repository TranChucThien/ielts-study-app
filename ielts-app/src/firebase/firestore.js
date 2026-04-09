import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc, query, where, orderBy, writeBatch
} from 'firebase/firestore'
import { db } from './config'

const userDoc = (userId, path) => {
  const segments = path.split('/').filter(Boolean)
  if (segments.length % 2 !== 0) segments.push('main')
  return doc(db, 'users', userId, ...segments)
}
const userCol = (userId, col) => collection(db, 'users', userId, col)

export const getUserDoc = async (userId, path) => {
  const snap = await getDoc(userDoc(userId, path))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const setUserDoc = (userId, path, data) =>
  setDoc(userDoc(userId, path), data, { merge: true })

export const updateUserDoc = (userId, path, data) =>
  updateDoc(userDoc(userId, path), data)

export const deleteUserDoc = (userId, path) =>
  deleteDoc(userDoc(userId, path))

export const getUserCollection = async (userId, col, ...queryConstraints) => {
  const q = queryConstraints.length
    ? query(userCol(userId, col), ...queryConstraints)
    : query(userCol(userId, col))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addToUserCollection = (userId, col, data) =>
  addDoc(userCol(userId, col), data)

export const deleteFromUserCollection = (userId, col, docId) =>
  deleteDoc(doc(db, 'users', userId, col, docId))

export const batchWrite = () => writeBatch(db)

export { where, orderBy, doc, db, collection, getDocs, setDoc, deleteDoc as deleteDocFn }
