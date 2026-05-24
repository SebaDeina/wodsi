import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import {
  parseInviteSearchParams,
  saveInviteToSession,
  clearInviteSession,
  loadInviteFromSession,
} from '../lib/invite'
import { prefersGoogleRedirect } from '../lib/googleAuth'
import { buildGoogleAuthIntent, routeAfterGoogleAuth } from '../lib/googleAuthFlow'
import { W } from '../tokens'
import { WodsiLogo } from '../components/WodsiLogo'
import { Btn } from '../components/Btn'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AuthDivider } from '../components/AuthDivider'

export default function Register() {
  const { user, registerEmail, loginGoogle, finishGoogleRegistration } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isGoogle = params.get('google') === '1'
  const invite = parseInviteSearchParams(params)
  const sessionInvite = loadInviteFromSession()

  const [role, setRole] = useState(invite.isAthleteInvite ? 'athlete' : (params.get('role') || 'coach'))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [coachId, setCoachId] = useState(invite.coachId || sessionInvite?.coachId || '')
  const [coachLabel, setCoachLabel] = useState(invite.coachName || sessionInvite?.coachName || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const hasInvite = Boolean(coachId)
  const isAthleteFlow = role === 'athlete'
  const showRolePicker = !hasInvite && !isGoogle

  useEffect(() => {
    if (invite.isAthleteInvite) {
      saveInviteToSession(invite.coachId, invite.coachName)
      setRole('athlete')
      setCoachId(invite.coachId)
      if (invite.coachName) setCoachLabel(invite.coachName)
    }
  }, [invite.coachId, invite.coachName, invite.isAthleteInvite])

  useEffect(() => {
    if (!isGoogle || name.trim()) return
    const fromGoogle = user?.displayName?.trim()
    if (fromGoogle) setName(fromGoogle)
  }, [isGoogle, user?.displayName, name])

  useEffect(() => {
    if (!coachId || coachLabel) return
    async function loadCoach() {
      try {
        const snap = await getDoc(doc(db, 'coaches_public', coachId))
        if (snap.exists()) {
          const d = snap.data()
          setCoachLabel(d.boxName || d.name || '')
        }
      } catch { /* ignore */ }
    }
    loadCoach()
  }, [coachId, coachLabel])

  function authErrorMessage(err) {
    if (err.code === 'auth/popup-closed-by-user') {
      return lang === 'es' ? 'Cerraste la ventana de Google. Intentá de nuevo.' : 'You closed the Google window. Try again.'
    }
    if (err.message === 'INVALID_COACH') {
      return lang === 'es'
        ? 'El link de invitación no es válido. Pedile uno nuevo a tu coach.'
        : 'This invite link is invalid. Ask your coach for a new one.'
    }
    if (err.code === 'auth/email-already-in-use') {
      return lang === 'es' ? 'Ese correo ya está registrado.' : 'That email is already registered.'
    }
    return err.message
  }

  async function completeRegistration(selectedRole, selectedName, selectedCoachId) {
    if (isGoogle) {
      await finishGoogleRegistration(selectedRole, selectedName, selectedRole === 'athlete' ? selectedCoachId : null)
    } else {
      await registerEmail(email, password, selectedName, selectedRole, selectedRole === 'athlete' ? selectedCoachId : null)
    }
    clearInviteSession()
    navigate(selectedRole === 'athlete' ? '/athlete' : '/coach')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await completeRegistration(role, name, coachId)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setBusy(true)
    try {
      const intent = buildGoogleAuthIntent({
        mode: 'register',
        registerRole: role,
        coachId: isAthleteFlow ? coachId : null,
        coachName: coachLabel || null,
        invite: invite.isAthleteInvite
          ? { coachId: invite.coachId, coachName: invite.coachName }
          : null,
      })
      const result = await loginGoogle(intent)
      if (result?.redirecting) return
      routeAfterGoogleAuth(result, { navigate, params, invite })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      if (!prefersGoogleRedirect()) setBusy(false)
    }
  }

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 10, border: `1px solid ${W.c.lineDim}`,
    background: W.c.card, color: W.c.text, fontFamily: W.font.sans, fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
  }

  const primaryLabel = isGoogle
    ? (lang === 'es' ? 'Guardar y continuar' : 'Save and continue')
    : (lang === 'es' ? 'Crear cuenta' : 'Create account')

  return (
    <div style={{ minHeight: '100vh', background: W.c.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', top: 14, right: 16, display: 'flex', background: 'rgba(20,22,26,0.85)', backdropFilter: 'blur(12px)', padding: 4, borderRadius: 999, fontFamily: W.font.mono, fontSize: 11, letterSpacing: 0.6 }}>
        {['es', 'en'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{ border: 0, padding: '6px 12px', borderRadius: 999, background: lang === l ? W.c.lime : 'transparent', color: lang === l ? W.c.bg : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <WodsiLogo size={28} />
        </div>

        {hasInvite && isAthleteFlow && (
          <div style={{
            background: `${W.c.lime}18`, border: `1px solid ${W.c.lime}50`,
            borderRadius: 14, padding: '16px 18px', marginBottom: 16,
          }}>
            <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.lime, letterSpacing: 0.6 }}>
              {lang === 'es' ? 'INVITACIÓN DE TU COACH' : 'INVITE FROM YOUR COACH'}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>
              {coachLabel || (lang === 'es' ? 'Tu box' : 'Your gym')}
            </div>
          </div>
        )}

        <div style={{ background: W.c.bg2, borderRadius: 20, padding: 32, boxShadow: `0 0 0 1px ${W.c.lineDim}` }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: '0 0 6px', fontFamily: W.font.display, color: W.c.text }}>
            {isGoogle
              ? (lang === 'es' ? 'Completá tu perfil' : 'Finish your profile')
              : (lang === 'es' ? 'Crear cuenta' : 'Create account')}
          </h1>
          <p style={{ fontSize: 14, color: W.c.dim, margin: '0 0 24px' }}>
            {hasInvite && isAthleteFlow
              ? (lang === 'es' ? 'Completá tus datos o usá Google abajo.' : 'Fill in your details or use Google below.')
              : (lang === 'es' ? 'Elegí cómo querés registrarte.' : 'Choose how to sign up.')}
          </p>

          {showRolePicker && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {[
                { val: 'coach', icon: '🏋', label: lang === 'es' ? 'Soy coach' : "I'm a coach" },
                { val: 'athlete', icon: '⚡', label: lang === 'es' ? 'Soy atleta' : "I'm an athlete" },
              ].map(r => (
                <div key={r.val} onClick={() => setRole(r.val)} style={{
                  flex: 1, padding: 20, borderRadius: 14, cursor: 'pointer',
                  background: role === r.val ? W.c.lime : W.c.card,
                  color: role === r.val ? W.c.bg : W.c.text,
                  border: `1.5px solid ${role === r.val ? W.c.lime : W.c.lineDim}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{r.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.label}</div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              placeholder={lang === 'es' ? 'Nombre completo' : 'Full name'}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inp}
            />
            {!isGoogle && (
              <>
                <input
                  type="email"
                  placeholder={lang === 'es' ? 'Correo electrónico' : 'Email'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inp}
                />
                <input
                  type="password"
                  placeholder={lang === 'es' ? 'Contraseña (mín. 6 caracteres)' : 'Password (min. 6 chars)'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={inp}
                />
              </>
            )}
            {isAthleteFlow && !hasInvite && (
              <div>
                <input
                  placeholder={lang === 'es' ? 'Link o ID de tu coach' : 'Coach invite link or ID'}
                  value={coachId}
                  onChange={e => setCoachId(e.target.value.trim())}
                  required
                  style={inp}
                />
                <div style={{ fontSize: 11, color: W.c.mute, marginTop: 6, fontFamily: W.font.mono, lineHeight: 1.4 }}>
                  {lang === 'es'
                    ? 'Pedile el link de invitación (no solo el ID).'
                    : 'Ask for the invite link (not just the ID).'}
                </div>
              </div>
            )}
            {error && <div style={{ fontSize: 13, color: W.c.red, fontFamily: W.font.mono }}>{error}</div>}
            <Btn primary style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 4 }} disabled={busy}>
              {busy ? '…' : primaryLabel}
            </Btn>
          </form>

          {!isGoogle && (
            <>
              <AuthDivider lang={lang} />
              <GoogleSignInButton disabled={busy} onClick={handleGoogle}>
                {lang === 'es' ? 'Continuar con Google' : 'Continue with Google'}
              </GoogleSignInButton>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: W.c.dim }}>
          {lang === 'es' ? '¿Ya tenés cuenta?' : 'Already have an account?'}{' '}
          <Link
            to={hasInvite ? `/login?role=athlete&coach=${coachId}${coachLabel ? `&from=${encodeURIComponent(coachLabel)}` : ''}` : '/login'}
            style={{ color: W.c.lime, fontWeight: 600, textDecoration: 'none' }}
          >
            {lang === 'es' ? 'Ingresar' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}
