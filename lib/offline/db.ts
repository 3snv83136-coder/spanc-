const DB_NAME = 'spanc-offline'
const DB_VERSION = 1
const DRAFTS_STORE = 'drafts'
const QUEUE_STORE = 'syncQueue'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB indisponible'))
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error ?? new Error('Ouverture IndexedDB échouée'))
    })
  }
  return dbPromise
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    db => new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode)
      const store = transaction.objectStore(storeName)
      const request = fn(store)
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error ?? new Error('Erreur IndexedDB'))
    }),
  )
}

export async function dbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  try {
    return await tx<T | undefined>(storeName, 'readonly', store => store.get(key))
  } catch {
    return undefined
  }
}

export async function dbPut<T extends { id: string }>(storeName: string, value: T): Promise<void> {
  await tx(storeName, 'readwrite', store => store.put(value))
}

export async function dbDelete(storeName: string, key: string): Promise<void> {
  await tx(storeName, 'readwrite', store => store.delete(key))
}

export async function dbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    return await tx<T[]>(storeName, 'readonly', store => store.getAll())
  } catch {
    return []
  }
}

export { DRAFTS_STORE, QUEUE_STORE }
