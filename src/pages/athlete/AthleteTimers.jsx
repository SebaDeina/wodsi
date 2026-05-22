import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { AthleteShell } from '../../components/AthleteShell'
import { useAthleteTimerPrefs } from '../../hooks/useAthleteTimerPrefs'
import { TIMER_MODES } from '../../lib/timerModes'
import { TIMER_CATALOG, timerPickerSubtitle, timerPickerTitle, catalogLabel } from '../../lib/timerCatalog'
import { prefsSummary } from '../../lib/athleteTimerPrefs'
import { formatTimerDisplay } from '../../lib/timerSession'

export default function AthleteTimers() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { prefs, setBeepsEnabled } = useAthleteTimerPrefs()

  return (
    <AthleteShell lang={lang}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: W.font.mono, fontSize: 10, letterSpacing: 2, color: W.c.mute, marginBottom: 8 }}>
          {timerPickerTitle(lang)}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1.2, margin: '0 0 8px', fontFamily: W.font.display, lineHeight: 1 }}>
          {lang === 'es' ? 'Relojes' : 'Timers'}
        </h1>
        <p style={{ fontSize: 13, color: W.c.dim, margin: 0, lineHeight: 1.5 }}>
          {timerPickerSubtitle(lang)}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {TIMER_MODES.map(mode => {
          const meta = TIMER_CATALOG[mode]
          const color = meta.color
          const summary = prefsSummary(mode, prefs, lang, formatTimerDisplay)
          return (
            <button
              key={mode}
              type="button"
              onClick={() => navigate(`/athlete/timers/${mode}`)}
              style={{
                gridColumn: meta.big ? 'span 2' : 'auto',
                textAlign: 'left',
                padding: meta.big ? '20px 18px' : '16px 14px',
                borderRadius: 16,
                background: W.c.card,
                border: `1px solid ${W.c.lineDim}`,
                borderLeft: `3px solid ${W.c[color]}`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                minHeight: meta.big ? 108 : 118,
                color: W.c.text,
                fontFamily: W.font.sans,
              }}
            >
              <div style={{ fontFamily: W.font.display, fontWeight: 700, fontSize: meta.big ? 28 : 20, color: W.c[color], letterSpacing: -0.5 }}>
                {catalogLabel(mode, lang)}
              </div>
              <div style={{ fontSize: 12, color: W.c.dim, marginTop: 6, lineHeight: 1.35 }}>
                {meta.tagline[lang]}
              </div>
              <div style={{ flex: 1, minHeight: 8 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>{summary}</span>
                <span style={{ fontFamily: W.font.mono, fontSize: 14, color: W.c[color] }}>→</span>
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setBeepsEnabled(!prefs.beepsEnabled)}
        style={{
          marginTop: 20,
          width: '100%',
          padding: '14px 16px',
          borderRadius: 14,
          border: `1px solid ${W.c.lineDim}`,
          background: W.c.bg2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: W.c.text,
          fontFamily: W.font.sans,
          fontSize: 13,
        }}
      >
        <span>
          🔔 {lang === 'es' ? 'Beeps de inicio y aviso de 10s' : 'Start & 10s warning beeps'}
        </span>
        <span style={{
          fontFamily: W.font.mono,
          fontSize: 11,
          fontWeight: 700,
          color: prefs.beepsEnabled ? W.c.lime : W.c.mute,
        }}>
          {prefs.beepsEnabled ? 'ON' : 'OFF'}
        </span>
      </button>
    </AthleteShell>
  )
}
