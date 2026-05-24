import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase'
import { parseInviteSearchParams } from '../lib/invite'
import { peekGoogleAuthIntent } from '../lib/googleAuth'
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
  const sessionUser = user || auth.currentUser
  const routedRef = useRef(false)

  useEffect(() => {
    if (!googleRedirectReady || loading) return

    if (googleRedirectError) {
      console.error('[auth] Google redirect:', googleRedirectError)
      clearGoogleRedirectState()
      return
    }

    if (!googleRedirectOutcome || !sessionUser) return
    if (routedRef.current) return

    routedRef.current = true
    routeAfterGoogleAuth(googleRedirectOutcome, { navigate, params, invite })
    clearGoogleRedirectState()
  }, [
    googleRedirectReady, googleRedirectOutcome, googleRedirectError,
    loading, sessionUser, user,
    navigate, params, invite, location.pathname, clearGoogleRedirectState,
  ])

  useEffect(() => {
    if (loading || !sessionUser) return
    if (!AUTH_PAGES.has(location.pathname)) return

    if (profile?.role) {
      if (routedRef.current) return
      routedRef.current = true
      routeAfterGoogleAuth(
        { profile, needsRegistration: false, intent: null },
        { navigate, params, invite },
      )
      return
    }

    if (!googleRedirectReady) return

    const usedGoogle = sessionUser.providerData?.some(p => p.providerId === 'google.com')
    if (!usedGoogle) {
      if (location.pathname === '/login') {
        navigate('/register', { replace: true })
      }
      return
    }

    // Coach en /register: lo resuelve Register.jsx (auto-crear perfil)
    const intent = peekGoogleAuthIntent()
    const coachRegister =
      location.pathname === '/register'
      && (params.get('role') === 'coach' || intent?.registerRole === 'coach')
    if (coachRegister) return

    const q = new URLSearchParams({ google: '1', role: 'coach' })
    if (invite.isAthleteInvite) {
      q.set('role', 'athlete')
      q.set('coach', invite.coachId)
      if (invite.coachName) q.set('from', invite.coachName)
    } else if (params.get('role') === 'athlete') {
      q.set('role', 'athlete')
    }
    if (params.get('google') === '1') return
    navigate(`/register?${q.toString()}`, { replace: true })
  }, [
    sessionUser, user, profile, loading, googleRedirectReady,
    location.pathname, navigate, params, invite,
  ])

  return null
}
