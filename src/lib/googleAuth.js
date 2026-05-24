const STORAGE_KEY = 'wodsi_google_auth'

/** Siempre popup (móvil y PC): ventana de Google y vuelve a la misma pestaña. */
export function prefersGoogleRedirect() {
  return false
}

export function saveGoogleAuthIntent(intent) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent))
  } catch {
    /* ignore */
  }
}

export function peekGoogleAuthIntent() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function readGoogleAuthIntent() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearGoogleAuthIntent() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
