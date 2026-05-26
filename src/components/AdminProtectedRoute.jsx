import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase'
import { isAdminEmail } from '../lib/adminAccess'
import { W } from '../tokens'

function AuthSpinner() {
  return (
    <div
      style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute, letterSpacing: 1 }}>
        CARGANDO…
      </div>
    </div>
  )
}

export function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const sessionUser = user || auth.currentUser

  if (loading) return <AuthSpinner />

  if (!sessionUser) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/admin/login?next=${next}`} replace />
  }

  if (!isAdminEmail(sessionUser.email)) {
    return <Navigate to="/admin/login" replace state={{ denied: true }} />
  }

  return children
}
