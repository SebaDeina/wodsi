/** URL de invitación para que un atleta se registre vinculado a un coach. */
export function buildAthleteInviteUrl(coachId, coachName, origin) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '')
  const url = new URL('/register', base)
  url.searchParams.set('role', 'athlete')
  url.searchParams.set('coach', coachId)
  if (coachName) url.searchParams.set('from', coachName)
  return url.toString()
}

export function parseInviteSearchParams(searchParams) {
  const role = searchParams.get('role')
  const coachId = searchParams.get('coach') || searchParams.get('coachId') || ''
  const coachName = searchParams.get('from') || searchParams.get('box') || ''
  const isAthleteInvite = role === 'athlete' && coachId.length > 0
  return { role, coachId, coachName, isAthleteInvite }
}

export function buildWhatsAppShareText(inviteUrl, coachName, lang) {
  const box = coachName || (lang === 'es' ? 'tu box' : 'your gym')
  if (lang === 'es') {
    return (
      `¡Hola! Te sumo a Wodsi con ${box}.\n\n` +
      `1. Abrí este link\n2. Elegí *Continuar con Google* (recomendado) o email\n3. Listo — vas a ver tus WODs, hábitos y PRs\n\n` +
      inviteUrl
    )
  }
  return (
    `Hi! Join me on Wodsi at ${box}.\n\n` +
    `1. Open this link\n2. Use *Continue with Google* (recommended) or email\n3. Done — your WODs, habits and PRs sync\n\n` +
    inviteUrl
  )
}

export function inviteStorageKey() {
  return 'wodsi_invite'
}

export function saveInviteToSession(coachId, coachName) {
  if (!coachId) return
  sessionStorage.setItem(inviteStorageKey(), JSON.stringify({ coachId, coachName }))
}

export function loadInviteFromSession() {
  try {
    const raw = sessionStorage.getItem(inviteStorageKey())
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearInviteSession() {
  sessionStorage.removeItem(inviteStorageKey())
}
