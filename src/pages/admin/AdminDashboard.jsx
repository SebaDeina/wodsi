import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { auth } from '../../firebase'
import { useAdminStats } from '../../hooks/useAdminStats'
import { Btn } from '../../components/Btn'

const adminBg = '#0a0a0c'
const adminCard = '#141418'
const adminLine = '#2a2a32'
const adminAccent = '#c8ff00'
const adminMuted = '#71717a'

function formatARS(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
}

function StatCard({ label, value, hint, accent }) {
  return (
    <div style={{
      background: adminCard,
      border: `1px solid ${adminLine}`,
      borderRadius: 12,
      padding: '20px 22px',
      minHeight: 110,
    }}>
      <p style={{
        margin: 0, fontSize: 11, fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: 1.2, textTransform: 'uppercase', color: adminMuted,
      }}>
        {label}
      </p>
      <p style={{
        margin: '10px 0 0', fontSize: 32, fontWeight: 600, color: accent ? adminAccent : '#fafafa',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </p>
      {hint && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: adminMuted, lineHeight: 1.4 }}>{hint}</p>
      )}
    </div>
  )
}

function formatMinutes(m) {
  if (!m) return '—'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h}h ${rest}m` : `${h}h`
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { stats, loading, error, refresh } = useAdminStats()

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin/login', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: adminBg, color: '#f4f4f5' }}>
      <header style={{
        borderBottom: `1px solid ${adminLine}`,
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{
            margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            letterSpacing: 2, textTransform: 'uppercase', color: adminAccent,
          }}>
            Wodsi Admin
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: adminMuted }}>{user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={refresh} disabled={loading} style={{ background: adminCard, border: `1px solid ${adminLine}`, color: '#e4e4e7' }}>
            {loading ? 'Actualizando…' : 'Actualizar'}
          </Btn>
          <Btn onClick={handleLogout} style={{ background: 'transparent', border: `1px solid ${adminLine}`, color: adminMuted }}>
            Salir
          </Btn>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 48px' }}>
        {error && (
          <div style={{
            marginBottom: 24, padding: 16, borderRadius: 10,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
            fontSize: 14, color: '#fca5a5',
          }}>
            {error}
            <p style={{ margin: '8px 0 0', fontSize: 12, color: adminMuted }}>
              Verificá que tu email esté en Firestore → app_config/admins → emails[] y que desplegaste las reglas.
            </p>
          </div>
        )}

        {!stats && loading && (
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: adminMuted }}>Cargando métricas…</p>
        )}

        {stats && (
          <>
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 28,
            }}>
              <StatCard label="Coaches pagando" value={stats.payingCoaches} accent hint={`${stats.pendingSubscriptions} pendientes · ${stats.totalSubscriptions} total`} />
              <StatCard label="MRR estimado" value={formatARS(stats.mrr)} accent hint="Suma de suscripciones activas" />
              <StatCard label="Coaches registrados" value={stats.coaches} />
              <StatCard label="Atletas totales" value={stats.athletes} hint={`${stats.athletesLinked} vinculados a un box`} />
              <StatCard label="Usuarios totales" value={stats.totalUsers} />
              <StatCard label="Activos 7 días" value={stats.active7d} hint={`${stats.active30d} en 30 días`} />
              <StatCard label="Tiempo prom. activo" value={formatMinutes(stats.avgActiveMinutes)} hint="Minutos acumulados por usuario (pestaña visible)" />
              <StatCard label="Visitas totales" value={stats.totalPageViews.toLocaleString('es-AR')} accent hint={`${stats.views7d} últimos 7d · ${stats.views30d} últimos 30d`} />
              <StatCard label="Pagos aprobados" value={stats.approvedPayments} hint="Historial coach_subscription_payments" />
            </section>

            <section style={{
              background: adminCard,
              border: `1px solid ${adminLine}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${adminLine}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Top coaches por atletas</h2>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: adminMuted }}>
                  Actualizado {stats.fetchedAt.toLocaleString('es-AR')}
                </p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: adminMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      <th style={thStyle}>Coach / Box</th>
                      <th style={thStyle}>Atletas</th>
                      <th style={thStyle}>Suscripción</th>
                      <th style={thStyle}>Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topCoaches.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...tdStyle, color: adminMuted }}>Sin coaches todavía</td>
                      </tr>
                    )}
                    {stats.topCoaches.map(c => {
                      const sub = c.subscription
                      const status = sub?.status || '—'
                      const tier = sub?.tierId || '—'
                      return (
                        <tr key={c.id} style={{ borderTop: `1px solid ${adminLine}` }}>
                          <td style={tdStyle}>
                            <strong style={{ color: '#fafafa' }}>{c.name}</strong>
                            {c.boxName && c.boxName !== c.name && (
                              <span style={{ display: 'block', fontSize: 12, color: adminMuted }}>{c.boxName}</span>
                            )}
                          </td>
                          <td style={tdStyle}>{c.athletes}</td>
                          <td style={tdStyle}>
                            <span style={{
                              color: status === 'active' ? adminAccent : status === 'pending' ? '#fbbf24' : adminMuted,
                              fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
                            }}>
                              {status}
                            </span>
                          </td>
                          <td style={tdStyle}>{tier}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

const thStyle = { padding: '12px 22px', fontWeight: 500 }
const tdStyle = { padding: '14px 22px', verticalAlign: 'top' }
