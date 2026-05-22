import { useNavigate, useLocation } from 'react-router-dom'
import { W } from '../tokens'
import { t } from '../i18n'
import { WodsiLogo } from './WodsiLogo'
import { Avatar } from './Avatar'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { k: 'dashboard',    icon: '◧', path: '/coach' },
  { k: 'planning',     icon: '◫', path: '/coach/planner' },
  { k: 'groups_nav',   icon: '◉', path: '/coach/groups' },
  { k: 'athletes_nav', icon: '◐', path: '/coach/athletes' },
  { k: 'whatsapp',     icon: '◰', path: '/coach/whatsapp' },
  { k: 'billing',      icon: '◱', path: '/coach/billing' },
  { k: 'library',      icon: '◇', path: '/coach/library' },
  { k: 'settings',     icon: '◎', path: '/settings' },
]

export function DesktopChrome({ children, lang }) {
  const navigate      = useNavigate()
  const { pathname }  = useLocation()
  const { user, profile } = useAuth()

  const displayName = profile?.name || user?.displayName || user?.email || '—'
  const initials    = displayName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

  const sidebarWidth = 232

  return (
    <div style={{
      width: '100%', minHeight: '100dvh',
      background: W.c.bg, color: W.c.text,
      fontFamily: W.font.sans,
    }}>
      <aside style={{
        position: 'fixed', left: 0, top: 0, zIndex: 40,
        width: sidebarWidth, height: '100dvh',
        background: W.c.bg2, padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: 4,
        borderRight: `1px solid ${W.c.lineDim}`,
        boxSizing: 'border-box', overflowY: 'auto',
      }}>
        <div style={{ padding: '4px 8px 24px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <WodsiLogo size={20} />
        </div>
        {NAV_ITEMS.map((it) => {
          const isActive = pathname === it.path || (it.path !== '/coach' && pathname.startsWith(it.path))
          return (
            <div key={it.k}
              onClick={() => navigate(it.path)}
              style={{
                padding: '10px 12px', borderRadius: 8,
                background: isActive ? W.c.cardHi : 'transparent',
                color: isActive ? W.c.text : W.c.dim,
                display: 'flex', alignItems: 'center', gap: 12,
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
              }}>
              <span style={{ width: 18, fontSize: 16, color: isActive ? W.c.lime : W.c.mute }}>{it.icon}</span>
              <span>{t(it.k, lang)}</span>
            </div>
          )
        })}
        <div style={{ flex: 1 }} />
        <div
          onClick={() => navigate('/settings')}
          style={{ padding: 12, background: W.c.card, borderRadius: 10, fontSize: 12, color: W.c.dim, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={initials} size={28} tone="lime" />
            <div>
              <div style={{ color: W.c.text, fontWeight: 600, fontSize: 13 }}>{displayName}</div>
              <div style={{ fontSize: 11, color: W.c.mute }}>{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
      <main style={{
        marginLeft: sidebarWidth,
        width: `calc(100% - ${sidebarWidth}px)`,
        minHeight: '100dvh',
        height: '100dvh',
        maxHeight: '100dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        {children}
      </main>
    </div>
  )
}
