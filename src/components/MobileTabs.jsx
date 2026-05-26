import { useNavigate, useLocation } from 'react-router-dom'
import { W } from '../tokens'
import { t } from '../i18n'
import { SvgIcon } from './SvgIcon'

const TABS = [
  { k: 'home', icon: 'home', path: '/athlete' },
  { k: 'week', icon: 'week', path: '/athlete/week' },
  { k: 'timers', icon: 'timer', path: '/athlete/timers' },
  { k: 'history', icon: 'history', path: '/athlete/history' },
  { k: 'profile', icon: 'profile', path: '/settings' },
]

export function MobileTabs({ lang }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      style={{
        flexShrink: 0,
        borderTop: `1px solid ${W.c.lineDim}`,
        background: W.c.bg,
        paddingTop: 10,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 40,
      }}
    >
      {TABS.map(({ k, icon, path }) => {
        const isActive = pathname === path
          || (path === '/athlete/timers' && pathname.startsWith('/athlete/timers'))
          || (path !== '/athlete' && path !== '/athlete/timers' && pathname.startsWith(path))
        return (
          <button
            key={k}
            type="button"
            onClick={() => navigate(path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              minWidth: 56,
            }}
          >
            <span style={{ color: isActive ? W.c.lime : W.c.mute, lineHeight: 0 }}>
              <SvgIcon name={icon} size={22} strokeWidth={isActive ? 2.4 : 2} />
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: W.font.mono,
              letterSpacing: 0.5,
              color: isActive ? W.c.text : W.c.mute,
              fontWeight: isActive ? 600 : 500,
            }}>
              {t(k, lang).toUpperCase()}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
