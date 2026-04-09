function compressImage(file, maxWidth = 900, quality = 0.5) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(null)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

export async function imageToBase64(file) {
  return await compressImage(file)
}
