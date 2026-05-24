import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { parseInviteSearchParams, saveInviteToSession } from '../lib/invite'
import { auth } from '../firebase'
import { buildGoogleAuthIntent, redirectAfterLogin, routeAfterGoogleAuth } from '../lib/googleAuthFlow'
import { W } from '../tokens'
import { WodsiLogo } from '../components/WodsiLogo'
import { Btn } from '../components/Btn'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AuthDivider } from '../components/AuthDivider'

export default function Login() {
  const { loginEmail, loginGoogle, loading: authLoading, user, profile } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const invite = parseInviteSearchParams(params)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [coachConflict, setCoachConflict] = useState(null)

  useEffect(() => {
    if (invite.isAthleteInvite) {
      saveInviteToSession(invite.coachId, invite.coachName)
    }
  }, [invite.coachId, invite.coachName, invite.isAthleteInvite])

  useEffect(() => {
    const err = params.get('error')
    if (err === 'google') {
      setError(lang === 'es' ? 'No se pudo completar el inicio con Google.' : 'Could not complete Google sign-in.')
    }
  }, [params, lang])

  // Auto-redirect cuando ya hay sesión activa — cubre el redirect flow de Google
  // que vuelve a /login sin haber navegado aún
  useEffect(() => {
    if (!authLoading && user && profile?.role && !coachConflict) {
      if (invite.isAthleteInvite && invite.coachId && profile.coachId && profile.coachId !== invite.coachId) return
      redirectAfterLogin(profile, { navigate, params })
    }
  }, [authLoading, user, profile, navigate, params, coachConflict, invite.isAthleteInvite, invite.coachId])

  function registerLink() {
    if (invite.isAthleteInvite) {
      const q = new URLSearchParams({ role: 'athlete', coach: invite.coachId })
      if (invite.coachName) q.set('from', invite.coachName)
      return `/register?${q.toString()}`
    }
    return '/register'
  }

  function formatError(err) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return lang === 'es' ? 'Inicio con Google cancelado. Intentá de nuevo.' : 'Google sign-in was cancelled. Try again.'
    }
    if (err.code === 'auth/account-exists-with-different-credential') {
      return lang === 'es' ? 'Ese correo ya está registrado con otro método.' : 'That email is already registered with another method.'
    }
    if (err.code === 'auth/invalid-credential') {
      return lang === 'es' ? 'Email o contraseña incorrectos.' : 'Invalid email or password.'
    }
    return lang === 'es'
      ? 'No pudimos iniciar sesión. Revisá los datos e intentá de nuevo.'
      : 'We could not sign you in. Check your details and try again.'
  }

  function detectCoachConflict(profile) {
    if (!invite.isAthleteInvite || !invite.coachId) return false
    if (!profile?.coachId) return false
    if (profile.coachId === invite.coachId) return false
    setCoachConflict({ currentCoachId: profile.coachId, newCoachName: invite.coachName, profile })
    return true
  }

  async function handleEmail(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await loginEmail(email, password)
      if (result.needsRegistration) {
        navigate('/register', { replace: true })
        return
      }
      if (detectCoachConflict(result.profile)) return
      redirectAfterLogin(result.profile, { navigate, params })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setBusy(true)
    try {
      const intent = buildGoogleAuthIntent({
        mode: 'login',
        next: params.get('next'),
        invite: invite.isAthleteInvite
          ? { coachId: invite.coachId, coachName: invite.coachName }
          : null,
      })
      const result = await loginGoogle(intent)
      if (result?.redirecting) return
      if (detectCoachConflict(result?.profile)) return
      routeAfterGoogleAuth(result, { navigate, params, invite })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setBusy(false)
    }
  }

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 10, border: `1px solid ${W.c.lineDim}`,
    background: W.c.card, color: W.c.text, fontFamily: W.font.sans, fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
  }

  const sessionUser = user || auth.currentUser
  if (authLoading || (sessionUser && !coachConflict)) {
    return (
      <div style={{ minHeight: '100vh', background: W.c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>
          {lang === 'es' ? 'Ingresando…' : 'Signing in…'}
        </div>
      </div>
    )
  }

  if (coachConflict) {
    return (
      <div style={{ minHeight: '100vh', background: W.c.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <WodsiLogo size={24} />
          </div>
          <div style={{ background: W.c.bg2, borderRadius: 20, padding: 32, boxShadow: `0 0 0 1px ${W.c.lineDim}` }}>
            <div style={{ fontFamily: W.font.mono, fontSize: 11, color: W.c.orange, letterSpacing: 1.2, marginBottom: 16 }}>
              ⚠ {lang === 'es' ? 'YA TENÉS UN COACH' : 'ALREADY LINKED'}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, margin: '0 0 12px', fontFamily: W.font.display, color: W.c.text }}>
              {lang === 'es' ? 'Tu cuenta ya está vinculada' : 'Your account is already linked'}
            </h1>
            <p style={{ fontSize: 14, color: W.c.dim, margin: '0 0 20px', lineHeight: 1.55 }}>
              {lang === 'es'
                ? `Estás registrado con otro coach. Este link de invitación corresponde a ${coachConflict.newCoachName ? `"${coachConflict.newCoachName}"` : 'otro box'}.`
                : `You are registered with another coach. This invite link is for ${coachConflict.newCoachName ? `"${coachConflict.newCoachName}"` : 'a different gym'}.`}
            </p>
            <div style={{ background: W.c.card, borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: W.c.dim, lineHeight: 1.5 }}>
              {lang === 'es'
                ? 'Si querés cambiarte a este box, pedile al nuevo coach que primero coordine con tu coach actual.'
                : 'To switch to this gym, ask your new coach to coordinate with your current coach first.'}
            </div>
            <Btn primary style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
              onClick={() => redirectAfterLogin(coachConflict.profile, { navigate, params: new URLSearchParams() })}>
              {lang === 'es' ? 'Ir a mi cuenta actual →' : 'Go to my current account →'}
            </Btn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: W.c.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', top: 14, right: 16, display: 'flex', gap: 0, background: 'rgba(20,22,26,0.85)', backdropFilter: 'blur(12px)', padding: 4, borderRadius: 999, fontFamily: W.font.mono, fontSize: 11, letterSpacing: 0.6 }}>
        {['es', 'en'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{ border: 0, padding: '6px 12px', borderRadius: 999, background: lang === l ? W.c.lime : 'transparent', color: lang === l ? W.c.bg : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <WodsiLogo size={28} />
        </div>

        {invite.isAthleteInvite && (
          <div style={{
            background: W.c.card, borderRadius: 14, padding: 16, marginBottom: 16,
            border: `1px solid ${W.c.lineDim}`,
          }}>
            <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.lime, letterSpacing: 0.5 }}>
              {lang === 'es' ? 'INVITACIÓN' : 'INVITE'} · {invite.coachName || 'BOX'}
            </div>
            <p style={{ fontSize: 13, color: W.c.dim, margin: '8px 0 0', lineHeight: 1.45 }}>
              {lang === 'es'
                ? 'Primera vez: andá a Registrarme. Si ya tenés cuenta, ingresá abajo.'
                : 'First time: go to Sign up. If you have an account, sign in below.'}
            </p>
          </div>
        )}

        <div style={{ background: W.c.bg2, borderRadius: 20, padding: 32, boxShadow: `0 0 0 1px ${W.c.lineDim}` }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: '0 0 6px', fontFamily: W.font.display, color: W.c.text }}>
            {lang === 'es' ? 'Bienvenido' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 14, color: W.c.dim, margin: '0 0 28px' }}>
            {invite.isAthleteInvite
              ? (lang === 'es' ? 'Ingresá para ver tus WODs y PRs.' : 'Sign in to see your WODs and PRs.')
              : (lang === 'es' ? 'Ingresá a tu cuenta.' : 'Sign in to your account.')}
          </p>

          <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email" placeholder={lang === 'es' ? 'Correo electrónico' : 'Email'} value={email}
              onChange={e => setEmail(e.target.value)} required style={inp}
            />
            <input
              type="password" placeholder={lang === 'es' ? 'Contraseña' : 'Password'} value={password}
              onChange={e => setPassword(e.target.value)} required style={inp}
            />
            {error && <div style={{ fontSize: 13, color: W.c.red, fontFamily: W.font.mono }}>{error}</div>}
            <Btn primary style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 4 }} disabled={busy}>
              {busy ? '…' : (lang === 'es' ? 'Ingresar' : 'Sign in')}
            </Btn>
          </form>

          <AuthDivider lang={lang} />

          <GoogleSignInButton disabled={busy} onClick={handleGoogle}>
            {lang === 'es' ? 'Continuar con Google' : 'Continue with Google'}
          </GoogleSignInButton>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: W.c.dim }}>
          {lang === 'es' ? '¿No tenés cuenta?' : "Don't have an account?"}{' '}
          <Link to={registerLink()} style={{ color: W.c.lime, fontWeight: 600, textDecoration: 'none' }}>
            {invite.isAthleteInvite
              ? (lang === 'es' ? 'Registrarme' : 'Sign up')
              : (lang === 'es' ? 'Registrarse' : 'Sign up')}
          </Link>
        </p>
      </div>
    </div>
  )
}
