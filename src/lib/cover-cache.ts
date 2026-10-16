/**
 * IndexedDB cache for cover images.
 *
 * Covers are only reachable through short-lived signed URLs, so every hydrate
 * used to cost one signed-URL request plus one image request. Keeping the blob
 * next to its `coverVersion` lets us skip both while the version is unchanged.
 */

const DB_NAME = "sonetopia"
const DB_VERSION = 1
const STORE_NAME = "covers"

export type CachedCover = {
  audioId: string
  coverVersion: number
  blob: Blob
  mimeType: string | null
  cachedAt: number
}

let databasePromise: Promise<IDBDatabase | null> | null = null

function openDatabase(): Promise<IDBDatabase | null> {
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null)
      return
    }

    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      resolve(null)
      return
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "audioId" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })

  return databasePromise
}

/** Runs one store operation; resolves to null when IndexedDB is unavailable. */
function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return openDatabase().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null)
          return
        }
        try {
          const transaction = db.transaction(STORE_NAME, mode)
          const request = action(transaction.objectStore(STORE_NAME))
          let result: T | null = null
          request.onsuccess = () => {
            result = request.result ?? null
          }
          // resolve once the transaction committed, so cached writes are durable
          transaction.oncomplete = () => resolve(result)
          transaction.onerror = () => resolve(null)
          transaction.onabort = () => resolve(null)
        } catch {
          resolve(null)
        }
      })
  )
}

export function readCachedCover(audioId: string) {
  return run<CachedCover>("readonly", (store) => store.get(audioId) as IDBRequest<CachedCover>)
}

export function writeCachedCover(cover: CachedCover) {
  return run<IDBValidKey>("readwrite", (store) => store.put(cover) as IDBRequest<IDBValidKey>)
}

export function removeCachedCover(audioId: string) {
  return run<undefined>("readwrite", (store) => store.delete(audioId) as IDBRequest<undefined>)
}