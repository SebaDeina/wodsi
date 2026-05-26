import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { PhoneFrame } from '../../components/PhoneFrame'
import { SvgIcon } from '../../components/SvgIcon'
import {
  loadTimerWod,
  saveTimerWod,
  timerConfigsFromWod,
  timerLabelFromWod,
  formatTimerDisplay,
} from '../../lib/timerSession'

export default function TimerPicker() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const wod = location.state?.wod || loadTimerWod()
  const configs = timerConfigsFromWod(wod, lang)

  useEffect(() => {
    if (location.state?.wod) saveTimerWod(location.state.wod)
  }, [location.state?.wod])

  const MODES = [
    {
      name: 'AMRAP',
      desc: lang === 'es' ? 'Cuenta regresiva' : 'Countdown',
      color: 'lime',
      big: true,
      fmt: formatTimerDisplay(configs.amrap.totalSeconds),
      path: '/timers/amrap',
    },
    {
      name: 'EMOM',
      desc: `${configs.emom.rounds} ${lang === 'es' ? 'min' : 'min'}`,
      color: 'blue',
      fmt: `${configs.emom.rounds}×60s`,
      path: '/timers/emom',
    },
    {
      name: 'FOR TIME',
      desc: lang === 'es' ? 'Cronómetro' : 'Stopwatch',
      color: 'orange',
      fmt: configs.fortime.capSeconds ? `CAP ${formatTimerDisplay(configs.fortime.capSeconds)}` : 'CAP —',
      path: '/timers/fortime',
    },
    {
      name: 'TABATA',
      desc: `${configs.tabata.rounds} rds`,
      color: 'red',
      fmt: formatTimerDisplay(configs.tabata.rounds * (configs.tabata.workSeconds + configs.tabata.restSeconds)),
      path: '/timers/tabata',
    },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: W.c.bg, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <PhoneFrame>
        <div style={{ flex: 1, padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ color: W.c.dim, cursor: 'pointer', background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
              aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
            >
              <SvgIcon name="close" size={22} />
            </button>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, margin: '0 0 6px', fontFamily: W.font.display }}>
            {lang === 'es' ? 'Timer' : 'Timer'}
          </h1>
          <p style={{ fontSize: 13, color: W.c.lime, margin: '0 0 4px', fontWeight: 600 }}>
            {timerLabelFromWod(wod, lang)}
          </p>
          <p style={{ fontSize: 13, color: W.c.dim, margin: '0 0 20px' }}>
            {wod
              ? (lang === 'es' ? 'Tiempos sugeridos según tu sesión de hoy.' : "Suggested times from today's session.")
              : (lang === 'es' ? 'Elegí un modo. Volvé desde la sesión para vincular el WOD.' : 'Pick a mode. Open from session to link your WOD.')}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
            {MODES.map((c, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => navigate(c.path, { state: { wod } })}
                onKeyDown={e => e.key === 'Enter' && navigate(c.path, { state: { wod } })}
                style={{
                  gridColumn: c.big ? 'span 2' : 'auto',
                  padding: 18, borderRadius: 16, background: W.c.card,
                  borderLeft: `3px solid ${W.c[c.color]}`,
                  minHeight: c.big ? 100 : 120,
                  display: 'flex', flexDirection: 'column', cursor: 'pointer',
                }}
              >
                <div style={{ fontFamily: W.font.display, fontWeight: 700, fontSize: c.big ? 28 : 20, letterSpacing: -0.8, color: W.c[c.color] }}>{c.name}</div>
                <div style={{ fontSize: 12, color: W.c.dim, marginTop: 4 }}>{c.desc}</div>
                <div style={{ flex: 1 }} />
                <div style={{ fontFamily: W.font.mono, fontSize: 11, color: W.c.mute, marginTop: 8 }}>{c.fmt}</div>
              </div>
            ))}
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
