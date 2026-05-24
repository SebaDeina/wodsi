import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { parseInviteSearchParams } from '../lib/invite'
import { routeAfterGoogleAuth } from '../lib/googleAuthFlow'

const AUTH_PAGES = new Set(['/login', '/register'])

/** Redirección global tras login (Google redirect, sesión ya activa, etc.). */
export function AuthSessionRedirect() {
  const {
    user, profile, loading,
    googleRedirectOutcome, googleRedirectError, googleRedirectReady,
    clearGoogleRedirectState,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const invite = parseInviteSearchParams(params)

  useEffect(() => {
    if (!googleRedirectReady) return

    if (googleRedirectError) {
      clearGoogleRedirectState()
      if (AUTH_PAGES.has(location.pathname)) {
        navigate(`/login?error=google`, { replace: true })
      }
      return
    }

    if (!googleRedirectOutcome) return

    routeAfterGoogleAuth(googleRedirectOutcome, { navigate, params, invite })
    clearGoogleRedirectState()
  }, [
    googleRedirectReady, googleRedirectOutcome, googleRedirectError,
    navigate, params, invite, location.pathname, clearGoogleRedirectState,
  ])

  useEffect(() => {
    if (loading || !user) return
    if (!AUTH_PAGES.has(location.pathname)) return

    if (profile?.role) {
      routeAfterGoogleAuth(
        { profile, needsRegistration: false, intent: null },
        { navigate, params, invite },
      )
      return
    }

    const usedGoogle = user.providerData?.some(p => p.providerId === 'google.com')
    if (usedGoogle) {
      const q = new URLSearchParams({ google: '1' })
      if (invite.isAthleteInvite) {
        q.set('role', 'athlete')
        q.set('coach', invite.coachId)
        if (invite.coachName) q.set('from', invite.coachName)
      } else if (params.get('role') === 'coach') {
        q.set('role', 'coach')
      }
      navigate(`/register?${q.toString()}`, { replace: true })
    } else if (location.pathname === '/login') {
      navigate('/register', { replace: true })
    }
  }, [user, profile, loading, location.pathname, navigate, params, invite])

  return null
}
