import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { useAuth } from '../../context/AuthContext'
import { auth } from '../../firebase'
import { ADMIN_EMAIL, isAdminEmail } from '../../lib/adminAccess'
import { WodsiLogo } from '../../components/WodsiLogo'
import { GoogleSignInButton } from '../../components/GoogleSignInButton'

const adminBg = '#0a0a0c'
const adminCard = '#141418'
const adminLine = '#2a2a32'
const adminAccent = '#c8ff00'

export default function AdminLogin() {
  const { loginGoogle, loading: authLoading, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation()
  const denied = location.state?.denied

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authLoading || !user?.email) return
    if (isAdminEmail(user.email)) {
      const next = params.get('next')
      navigate(next && next.startsWith('/admin') ? next : '/admin', { replace: true })
    }
  }, [authLoading, user, navigate, params])

  useEffect(() => {
    if (denied) setError('Tu cuenta no tiene acceso de administrador.')
  }, [denied])

  async function handleGoogleLogin() {
    setError('')
    setBusy(true)
    try {
      await loginGoogle({ mode: 'admin', next: '/admin' })
      const session = auth.currentUser
      if (!isAdminEmail(session?.email)) {
        await signOut(auth)
        setError(`Solo ${ADMIN_EMAIL} puede entrar al panel admin.`)
        return
      }
      const next = params.get('next')
      navigate(next && next.startsWith('/admin') ? next : '/admin', { replace: true })
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Inicio con Google cancelado. Intentá de nuevo.')
      } else {
        setError('No se pudo iniciar sesión con Google.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: adminBg, color: '#f4f4f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <WodsiLogo size={36} />
          <p style={{
            marginTop: 16, fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            letterSpacing: 2, textTransform: 'uppercase', color: adminAccent,
          }}>
            Panel de administración
          </p>
        </div>

        <div style={{
          background: adminCard, border: `1px solid ${adminLine}`, borderRadius: 12, padding: 28,
        }}>
          <GoogleSignInButton
            onClick={handleGoogleLogin}
            disabled={busy || authLoading}
            style={{ background: '#0f0f12', border: `1px solid ${adminLine}` }}
          >
            Ingresar con Google
          </GoogleSignInButton>

          {error && (
            <p style={{ marginTop: 16, fontSize: 13, color: '#f87171' }}>{error}</p>
          )}

          <p style={{ margin: '16px 0 0', fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>
            Cualquier otra cuenta se cierra automáticamente.
          </p>
        </div>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#71717a' }}>
          Acceso restringido al creador de Wodsi
        </p>
      </div>
    </div>
  )
}

