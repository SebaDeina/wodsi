import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { W } from '../tokens'

// role: 'coach' | 'athlete' | null (any authenticated user)
export function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: W.c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute, letterSpacing: 1 }}>LOADING…</div>
      </div>
    )
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  // Sesión Firebase sin perfil en Firestore (registro incompleto)
  if (!profile) {
    const usedGoogle = user.providerData?.some(p => p.providerId === 'google.com')
    const target = usedGoogle
      ? `/register?google=1${role === 'coach' ? '&role=coach' : role === 'athlete' ? '&role=athlete' : ''}`
      : `/register${role === 'coach' ? '?role=coach' : role === 'athlete' ? '?role=athlete' : ''}`
    return <Navigate to={target} replace />
  }

  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'athlete' ? '/athlete' : '/coach'} replace />
  }

  return children
}
