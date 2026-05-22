/** Caché en memoria para datos de atleta (stale-while-revalidate). */

const store = new Map()

const DEFAULT_TTL_MS = 3 * 60 * 1000

/**
 * @param {string} key
 * @param {number} [maxAgeMs]
 */
export function getCached(key, maxAgeMs = DEFAULT_TTL_MS) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > maxAgeMs) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key, data) {
  store.set(key, { data, at: Date.now() })
}

export function invalidateCached(key) {
  store.delete(key)
}

export function invalidateCachedPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
