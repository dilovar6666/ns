type Cached = { key: string; data: unknown; savedAt: number }
type Queued = { id: string; path: string; role: string; body: string; error?: string }

const DB_NAME = 'cosmohealthx-demo-v1'
const emit = () => window.dispatchEvent(new Event('cosmo-sync'))
let connected = navigator.onLine
export const connectionStatus = () => connected
export function setConnectionStatus(value: boolean) {
  if (connected === value) return
  connected = value
  window.dispatchEvent(new CustomEvent('cosmo-connectivity', { detail: value }))
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('cache', { keyPath: 'key' })
      db.createObjectStore('queue', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact<T>(storeName: 'cache' | 'queue', mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const request = action(transaction.objectStore(storeName))
    let result: T
    request.onsuccess = () => { result = request.result }
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => { db.close(); resolve(result) }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
    transaction.onabort = () => { db.close(); reject(transaction.error) }
  })
}

export async function cacheResponse(key: string, data: unknown) {
  await transact('cache', 'readwrite', store => store.put({ key, data, savedAt: Date.now() } satisfies Cached))
}

export async function cachedResponse<T>(key: string): Promise<T | undefined> {
  const row = await transact<Cached | undefined>('cache', 'readonly', store => store.get(key))
  return row?.data as T | undefined
}

export async function enqueue(path: string, role: string, body: string, id: string) {
  await transact('queue', 'readwrite', store => store.put({ id, path, role, body } satisfies Queued))
  emit()
}

export async function queueStatus() {
  const rows = await transact<Queued[]>('queue', 'readonly', store => store.getAll())
  return { pending: rows.length, errors: rows.filter(row => row.error).length }
}

let syncing = false
export async function syncQueue() {
  if (syncing || !navigator.onLine) return
  syncing = true
  try {
    const rows = await transact<Queued[]>('queue', 'readonly', store => store.getAll())
    for (const row of rows) {
      try {
        const response = await fetch('/api' + row.path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Demo-Role': row.role, 'Idempotency-Key': row.id }, body: row.body })
        setConnectionStatus(true)
        if (!response.ok) {
          const detail = await response.json().then(value => String(value.detail || response.status)).catch(() => String(response.status))
          await transact('queue', 'readwrite', store => store.put({ ...row, error: detail }))
          continue
        }
        await transact('queue', 'readwrite', store => store.delete(row.id))
      } catch { setConnectionStatus(false); break }
    }
  } finally { syncing = false; emit() }
}
