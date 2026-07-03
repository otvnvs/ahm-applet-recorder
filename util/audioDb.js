let dbInstance = null

export function initAudioDb() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance)

    const request = indexedDB.open('A_DB', 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('b')) {
        db.createObjectStore('b')
      }
    }

    request.onsuccess = (event) => {
      dbInstance = event.target.result
      resolve(dbInstance)
    }

    request.onerror = (event) => reject(event.target.error)
  })
}

export async function saveAudioTrack(id, arrayBuffer) {
  const db = await initAudioDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('b', 'readwrite')
    const store = transaction.objectStore('b')
    const request = store.put(arrayBuffer, id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAudioTrack(id) {
  const db = await initAudioDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('b', 'readonly')
    const store = transaction.objectStore('b')
    const request = store.get(id)

    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteAudioTrack(id) {
  const db = await initAudioDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('b', 'readwrite')
    const store = transaction.objectStore('b')
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

