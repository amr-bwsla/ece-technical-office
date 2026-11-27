const DB_NAME = 'tech-office-files'
const STORE = 'files'
export const FILE_REF = 'idb:'

let db: Promise<IDBDatabase> | null = null

function open() {
  db ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return db
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const store = (await open()).transaction(STORE, mode).objectStore(STORE)
  return new Promise<T>((resolve, reject) => {
    const req = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Stores the file in IndexedDB and returns a reference usable as an attachment url. */
export async function saveFile(file: Blob) {
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  await run('readwrite', (s) => s.put(file, key))
  return FILE_REF + key
}

export const loadFile = (ref: string) => run<Blob | undefined>('readonly', (s) => s.get(ref.slice(FILE_REF.length)))

export const clearFiles = () => run('readwrite', (s) => s.clear()).catch(() => undefined)
