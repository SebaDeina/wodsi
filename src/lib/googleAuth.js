const STORAGE_KEY = 'wodsi_google_auth'

/** Popup en escritorio (ventana de Google). Redirect solo en móvil/tablet táctil. */
export function prefersGoogleRedirect() {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const narrowTouch =
    typeof window.matchMedia === 'function'
    && window.matchMedia('(max-width: 768px)').matches
    && navigator.maxTouchPoints > 0
  return mobileUa || narrowTouch
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
