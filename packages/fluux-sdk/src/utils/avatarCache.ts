/**
 * Avatar cache using IndexedDB for efficient binary storage
 * Avatars are stored by their SHA-1 hash (from XEP-0084)
 * JID → hash mappings are also stored to enable restoration on app restart
 */

const DB_NAME = 'fluux-avatar-cache'
const DB_VERSION = 2
const STORE_NAME = 'avatars'
const HASH_STORE_NAME = 'avatar-hashes'

interface CachedAvatar {
  hash: string // SHA-1 hash (primary key)
  data: Blob // Image blob
  mimeType: string // e.g., "image/png"
  timestamp: number // When cached
}

export type AvatarEntityType = 'contact' | 'room'

export interface AvatarHashMapping {
  jid: string // JID (primary key)
  hash: string // SHA-1 hash
  type: AvatarEntityType // 'contact' or 'room'
}

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Check if IndexedDB is available in the current environment
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

/**
 * Get or initialize the IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  // Silently fail in environments without IndexedDB (e.g., tests)
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB not available'))
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      // Avatar blob store (v1)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'hash' })
      }
      // JID → hash mapping store (v2)
      if (!db.objectStoreNames.contains(HASH_STORE_NAME)) {
        const hashStore = db.createObjectStore(HASH_STORE_NAME, { keyPath: 'jid' })
        hashStore.createIndex('type', 'type', { unique: false })
      }
    }
  })

  return dbPromise
}

/**
 * Get a cached avatar by hash
 * @returns Blob URL if cached, null otherwise
 */
export async function getCachedAvatar(hash: string): Promise<string | null> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(hash)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result as CachedAvatar | undefined
        if (result) {
          // Create blob URL from cached data
          const url = URL.createObjectURL(result.data)
          resolve(url)
        } else {
          resolve(null)
        }
      }
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to get cached avatar:', error)
    }
    return null
  }
}

/**
 * Cache an avatar
 * @param hash - SHA-1 hash of the avatar
 * @param base64 - Base64-encoded image data
 * @param mimeType - MIME type (e.g., "image/png")
 * @returns Blob URL for immediate use
 */
export async function cacheAvatar(
  hash: string,
  base64: string,
  mimeType: string
): Promise<string> {
  // Convert base64 to blob
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })

  try {
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const avatar: CachedAvatar = {
        hash,
        data: blob,
        mimeType,
        timestamp: Date.now(),
      }
      const request = store.put(avatar)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to cache avatar:', error)
    }
  }

  // Return blob URL regardless of cache success
  return URL.createObjectURL(blob)
}

/**
 * Check if an avatar is cached (without creating a blob URL)
 */
export async function hasAvatar(hash: string): Promise<boolean> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count(IDBKeyRange.only(hash))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result > 0)
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to check avatar cache:', error)
    }
    return false
  }
}

/**
 * Clear avatars older than maxAgeDays
 */
export async function clearOldAvatars(maxAgeDays: number): Promise<void> {
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000
  const cutoff = Date.now() - maxAge

  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        const avatar = cursor.value as CachedAvatar
        if (avatar.timestamp < cutoff) {
          cursor.delete()
        }
        cursor.continue()
      }
    }
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to clear old avatars:', error)
    }
  }
}

/**
 * Clear all cached avatars
 */
export async function clearAllAvatars(): Promise<void> {
  try {
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to clear avatar cache:', error)
    }
  }
}

// =============================================================================
// Avatar Hash Mapping Functions (JID → hash)
// =============================================================================

/**
 * Save a JID → hash mapping for avatar restoration
 */
export async function saveAvatarHash(
  jid: string,
  hash: string,
  type: AvatarEntityType
): Promise<void> {
  try {
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(HASH_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(HASH_STORE_NAME)
      const mapping: AvatarHashMapping = { jid, hash, type }
      const request = store.put(mapping)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to save avatar hash mapping:', error)
    }
  }
}

/**
 * Get the avatar hash for a JID
 */
export async function getAvatarHash(jid: string): Promise<string | null> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HASH_STORE_NAME, 'readonly')
      const store = transaction.objectStore(HASH_STORE_NAME)
      const request = store.get(jid)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result as AvatarHashMapping | undefined
        resolve(result?.hash ?? null)
      }
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to get avatar hash:', error)
    }
    return null
  }
}

/**
 * Get all avatar hash mappings, optionally filtered by type
 */
export async function getAllAvatarHashes(
  type?: AvatarEntityType
): Promise<AvatarHashMapping[]> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HASH_STORE_NAME, 'readonly')
      const store = transaction.objectStore(HASH_STORE_NAME)

      let request: IDBRequest
      if (type) {
        const index = store.index('type')
        request = index.getAll(type)
      } else {
        request = store.getAll()
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result as AvatarHashMapping[])
      }
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to get avatar hash mappings:', error)
    }
    return []
  }
}

/**
 * Delete a JID → hash mapping
 */
export async function deleteAvatarHash(jid: string): Promise<void> {
  try {
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(HASH_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(HASH_STORE_NAME)
      const request = store.delete(jid)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to delete avatar hash mapping:', error)
    }
  }
}

/**
 * Clear all avatar hash mappings
 */
export async function clearAllAvatarHashes(): Promise<void> {
  try {
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(HASH_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(HASH_STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    // Only log if IndexedDB is available (skip in test environments)
    if (isIndexedDBAvailable()) {
      console.warn('Failed to clear avatar hash mappings:', error)
    }
  }
}
