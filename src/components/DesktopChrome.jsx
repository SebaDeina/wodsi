import { useNavigate, useLocation } from 'react-router-dom'
import { W } from '../tokens'
import { t } from '../i18n'
import { WodsiLogo } from './WodsiLogo'
import { Avatar } from './Avatar'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useBreakpoint'

const NAV_ITEMS = [
  { k: 'dashboard',    icon: '◧', path: '/coach' },
  { k: 'planning',     icon: '◫', path: '/coach/planner' },
  { k: 'athletes_nav', icon: '◐', path: '/coach/athletes' },
  { k: 'whatsapp',     icon: '◰', path: '/coach/whatsapp' },
  { k: 'settings',     icon: '◎', path: '/settings' },
]

// 5 tabs más usados en mobile
const MOBILE_TABS = [
  { k: 'dashboard',    icon: '◧', path: '/coach' },
  { k: 'planning',     icon: '◫', path: '/coach/planner' },
  { k: 'athletes_nav', icon: '◐', path: '/coach/athletes' },
  { k: 'whatsapp',     icon: '◰', path: '/coach/whatsapp' },
  { k: 'settings',     icon: '◎', path: '/settings' },
]

const SIDEBAR_W = 232

function isActivePath(itemPath, pathname) {
  if (itemPath === '/coach') return pathname === '/coach'
  return pathname.startsWith(itemPath)
}

export function DesktopChrome({ children, lang }) {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const { user, profile } = useAuth()
  const isMobile     = useIsMobile(1024)

  const displayName = profile?.name || user?.displayName || user?.email || '—'
  const av = displayName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

  const activeItem = NAV_ITEMS.find(it => isActivePath(it.path, pathname))

  /* ── Mobile layout ──────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100dvh', background: W.c.bg, color: W.c.text,
        fontFamily: W.font.sans, overflowX: 'hidden',
      }}>
        {/* Top bar */}
        <header style={{
          flexShrink: 0, height: 52,
          background: W.c.bg2, borderBottom: `1px solid ${W.c.lineDim}`,
          display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12,
          position: 'sticky', top: 0, zIndex: 40,
          boxSizing: 'border-box',
        }}>
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <WodsiLogo size={16} />
          </div>
          <span style={{
            flex: 1, fontSize: 15, fontWeight: 600,
            color: W.c.text, letterSpacing: -0.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {activeItem ? t(activeItem.k, lang) : ''}
          </span>
          <div onClick={() => navigate('/settings')} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <Avatar name={av} size={30} tone="lime" />
          </div>
        </header>

        {/* Scrollable content */}
        <main style={{
          flex: 1, minHeight: 0,
          overflowY: 'auto', overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          display: 'flex', flexDirection: 'column',
        }}>
          {children}
        </main>

        {/* Bottom navigation */}
        <nav style={{
          flexShrink: 0,
          background: W.c.bg2,
          borderTop: `1px solid ${W.c.lineDim}`,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          paddingTop: 8,
          paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
        }}>
          {MOBILE_TABS.map(({ k, icon, path }) => {
            const active = isActivePath(path, pathname)
            return (
              <button key={k} type="button" onClick={() => navigate(path)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 6px', minWidth: 52, minHeight: 44,
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 20, color: active ? W.c.lime : W.c.mute, lineHeight: 1 }}>
                  {icon}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: W.font.mono, letterSpacing: 0.4,
                  color: active ? W.c.text : W.c.mute,
                  fontWeight: active ? 600 : 500,
                  textTransform: 'uppercase',
                }}>
                  {t(k, lang).slice(0, 9)}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  /* ── Desktop layout ─────────────────────────────────────── */
  return (
    <div style={{
      width: '100%', minHeight: '100dvh',
      background: W.c.bg, color: W.c.text, fontFamily: W.font.sans,
    }}>
      <aside style={{
        position: 'fixed', left: 0, top: 0, zIndex: 40,
        width: SIDEBAR_W, height: '100dvh',
        background: W.c.bg2, padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: 4,
        borderRight: `1px solid ${W.c.lineDim}`,
        boxSizing: 'border-box', overflowY: 'auto',
      }}>
        <div style={{ padding: '4px 8px 24px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <WodsiLogo size={20} />
        </div>
        {NAV_ITEMS.map(it => {
          const active = isActivePath(it.path, pathname)
          return (
            <div key={it.k} onClick={() => navigate(it.path)} style={{
              padding: '10px 12px', borderRadius: 8,
              background: active ? W.c.cardHi : 'transparent',
              color: active ? W.c.text : W.c.dim,
              display: 'flex', alignItems: 'center', gap: 12,
              fontSize: 14, fontWeight: active ? 600 : 500,
              cursor: 'pointer',
            }}>
              <span style={{ width: 18, fontSize: 16, color: active ? W.c.lime : W.c.mute }}>
                {it.icon}
              </span>
              <span>{t(it.k, lang)}</span>
            </div>
          )
        })}
        <div style={{ flex: 1 }} />
        <div onClick={() => navigate('/settings')} style={{
          padding: 12, background: W.c.card, borderRadius: 10, cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={av} size={28} tone="lime" />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: W.c.text, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: W.c.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main style={{
        marginLeft: SIDEBAR_W,
        width: `calc(100% - ${SIDEBAR_W}px)`,
        height: '100dvh', maxHeight: '100dvh',
        overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        {children}
      </main>
    </div>
  )
}
