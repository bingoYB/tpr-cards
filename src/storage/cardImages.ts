/** Uploaded images stay as Blobs in IndexedDB; deck metadata stores only their IDs. */
let database: Promise<IDBDatabase> | undefined

function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open('tpr-card-images', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('images')
      request.onsuccess = () => {
        const db = request.result
        db.onversionchange = () => { db.close(); database = undefined }
        resolve(db)
      }
      request.onerror = () => { database = undefined; reject(request.error) }
      request.onblocked = () => { database = undefined; reject(new Error('图片数据库被其他页面占用，请关闭其他页面后重试')) }
    })
  }
  return database
}

export async function readCardImage(id: string): Promise<Blob | undefined> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('images', 'readonly')
    const request = transaction.objectStore('images').get(id)
    transaction.oncomplete = () => resolve(request.result instanceof Blob ? request.result : undefined)
    transaction.onabort = () => reject(transaction.error)
    transaction.onerror = () => reject(transaction.error)
  })
}

/** Wait for commit, so callers never save references to an unsuccessful write. */
export async function writeCardImages(images: Map<string, Blob>): Promise<void> {
  if (!images.size) return
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('images', 'readwrite')
    const store = transaction.objectStore('images')
    for (const [id, blob] of images) store.put(blob, id)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error)
    transaction.onerror = () => reject(transaction.error)
  })
}

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif'
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024

export async function validateCardImage(blob: Blob): Promise<void> {
  if (!IMAGE_ACCEPT.split(',').includes(blob.type)) throw new Error('请选择 PNG、JPG、WebP、GIF 或 AVIF 图片')
  if (!blob.size || blob.size > MAX_IMAGE_BYTES) throw new Error('单张图片不能超过 20 MB')
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
  } catch {
    throw new Error('图片无法读取，请换一张图片')
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function imageDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Keep images shared by duplicated cards, and reclaim only unreferenced saved Blobs. */
export async function pruneCardImages(references: () => Set<string>): Promise<void> {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('images', 'readwrite')
    const cursor = transaction.objectStore('images').openKeyCursor()
    cursor.onsuccess = () => {
      const entry = cursor.result
      if (!entry) return
      if (!references().has(String(entry.key))) transaction.objectStore('images').delete(entry.key)
      entry.continue()
    }
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error)
    transaction.onerror = () => reject(transaction.error)
  })
}
