import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase'
import { W } from '../tokens'

function AuthSpinner() {
  return (
    <div style={{ minHeight: '100vh', background: W.c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute, letterSpacing: 1 }}>LOADING…</div>
    </div>
  )
}

// role: 'coach' | 'athlete' | null (any authenticated user)
export function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const sessionUser = user || auth.currentUser

  if (loading) return <AuthSpinner />

  if (!sessionUser) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (!profile?.role) {
    return <AuthSpinner />
  }

  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'athlete' ? '/athlete' : '/coach'} replace />
  }

  return children
}
