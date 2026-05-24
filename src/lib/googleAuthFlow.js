import { saveInviteToSession } from './invite'
import { athleteAppPath } from './athleteRoutes'

export function coachAppPath(profile) {
  return profile?.coachOnboardingCompleted === false ? '/coach/onboarding' : '/coach'
}

export function readNextParam(params) {
  const raw = params?.get?.('next')
  if (!raw) return null
  try {
    const path = decodeURIComponent(raw)
    if (path.startsWith('/') && !path.startsWith('//')) return path
  } catch {
    /* ignore */
  }
  return null
}

export function buildGoogleAuthIntent({
  mode = 'login',
  next = null,
  invite = null,
  registerRole = null,
  coachId = null,
  coachName = null,
}) {
  return {
    mode,
    next: next || null,
    invite: invite || null,
    registerRole: registerRole || null,
    coachId: coachId || null,
    coachName: coachName || null,
  }
}

/** Tras popup o redirect de Google: navegar o ir a completar registro. */
export function routeAfterGoogleAuth({ needsRegistration, profile, intent }, { navigate, params, invite }) {
  if (needsRegistration) {
    const coachFromIntent = intent?.invite?.coachId || intent?.coachId
    const nameFromIntent = intent?.invite?.coachName || intent?.coachName
    if (coachFromIntent) {
      saveInviteToSession(coachFromIntent, nameFromIntent || '')
    }
    const q = new URLSearchParams({ google: '1' })
    if (coachFromIntent) {
      q.set('role', 'athlete')
      q.set('coach', coachFromIntent)
      if (nameFromIntent) q.set('from', nameFromIntent)
    } else if (intent?.registerRole === 'coach' || params?.get('role') === 'coach') {
      q.set('role', 'coach')
    } else if (invite?.isAthleteInvite) {
      q.set('role', 'athlete')
      q.set('coach', invite.coachId)
      if (invite.coachName) q.set('from', invite.coachName)
    }
    navigate(`/register?${q.toString()}`)
    return
  }

  const next = readNextParam(params) || intent?.next
  if (next) {
    navigate(next, { replace: true })
    return
  }
  navigate(profile?.role === 'athlete' ? athleteAppPath(profile) : coachAppPath(profile), { replace: true })
}

/** Tras email/password o sesión ya activa en /login. */
export function redirectAfterLogin(profile, { navigate, params }) {
  if (!profile?.role) return false
  const next = readNextParam(params)
  if (next) {
    navigate(next, { replace: true })
    return true
  }
  navigate(profile.role === 'athlete' ? athleteAppPath(profile) : coachAppPath(profile), { replace: true })
  return true
}
