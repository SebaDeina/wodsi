import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { parseInviteSearchParams, saveInviteToSession } from '../lib/invite'
import { W } from '../tokens'
import { WodsiLogo } from '../components/WodsiLogo'
import { Btn } from '../components/Btn'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AuthDivider } from '../components/AuthDivider'

export default function Login() {
  const { loginEmail, loginGoogle } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const invite = parseInviteSearchParams(params)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (invite.isAthleteInvite) {
      saveInviteToSession(invite.coachId, invite.coachName)
    }
  }, [invite.coachId, invite.coachName, invite.isAthleteInvite])

  function registerLink() {
    if (invite.isAthleteInvite) {
      const q = new URLSearchParams({ role: 'athlete', coach: invite.coachId })
      if (invite.coachName) q.set('from', invite.coachName)
      return `/register?${q.toString()}`
    }
    return '/register'
  }

  function formatError(err) {
    if (err.code === 'auth/popup-closed-by-user') {
      return lang === 'es' ? 'Cerraste la ventana de Google. Intentá de nuevo.' : 'You closed the Google window. Try again.'
    }
    if (err.code === 'auth/invalid-credential') {
      return lang === 'es' ? 'Email o contraseña incorrectos.' : 'Invalid email or password.'
    }
    return err.message
  }

  function afterAuthRedirect(profile) {
    const next = params.get('next')
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      navigate(next, { replace: true })
      return
    }
    navigate(profile?.role === 'athlete' ? '/athlete' : '/coach', { replace: true })
  }

  async function handleEmail(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { profile } = await loginEmail(email, password)
      afterAuthRedirect(profile)
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
      const { profile, needsRegistration } = await loginGoogle()
      if (needsRegistration) {
        const q = new URLSearchParams({ google: '1' })
        if (invite.isAthleteInvite) {
          q.set('role', 'athlete')
          q.set('coach', invite.coachId)
          if (invite.coachName) q.set('from', invite.coachName)
        }
        navigate(`/register?${q.toString()}`)
        return
      }
      afterAuthRedirect(profile)
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
