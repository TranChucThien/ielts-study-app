import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality)
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadImage(userId, file, onProgress) {
  // Phase 1: compress (0-30%)
  if (onProgress) onProgress(10)
  const compressed = await compressImage(file)
  if (onProgress) onProgress(30)

  // Phase 2: upload (30-90%)
  const name = `${Date.now()}.jpg`
  const storageRef = ref(storage, `users/${userId}/writing/${name}`)
  
  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, compressed)
    task.on('state_changed',
      (snap) => {
        const uploadPct = Math.round((snap.bytesTransferred / snap.totalBytes) * 60)
        if (onProgress) onProgress(30 + uploadPct)
      },
      reject,
      resolve
    )
  })

  // Phase 3: get URL (90-100%)
  if (onProgress) onProgress(95)
  const url = await getDownloadURL(storageRef)
  if (onProgress) onProgress(100)
  return url
}

export async function deleteImage(url) {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (e) {
    console.warn('Delete image failed:', e)
  }
}
