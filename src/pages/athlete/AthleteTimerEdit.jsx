import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { AthleteShell } from '../../components/AthleteShell'
import { Btn } from '../../components/Btn'
import { SvgIcon } from '../../components/SvgIcon'
import { TimerPrefsFields } from '../../components/TimerPrefsFields'
import { useAthleteTimerPrefs } from '../../hooks/useAthleteTimerPrefs'
import { TIMER_MODES, timerModeColor, timerModeName, timerModePath } from '../../lib/timerModes'
import { TIMER_CATALOG, catalogLabel } from '../../lib/timerCatalog'
import { clearTimerWod, formatTimerDisplay } from '../../lib/timerSession'
import { prefsSummary } from '../../lib/athleteTimerPrefs'

export default function AthleteTimerEdit() {
  const { mode } = useParams()
  const { lang } = useLang()
  const navigate = useNavigate()
  const { prefs, updatePrefs } = useAthleteTimerPrefs()

  if (!mode || !TIMER_MODES.includes(mode)) {
    return <Navigate to="/athlete/timers" replace />
  }

  const meta = TIMER_CATALOG[mode]
  const color = timerModeColor(mode)

  function startTimer() {
    clearTimerWod()
    navigate(timerModePath(mode))
  }

  return (
    <AthleteShell lang={lang} showTabs={false}>
      <button
        type="button"
        onClick={() => navigate('/athlete/timers')}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 22,
          color: W.c.dim,
          cursor: 'pointer',
          padding: '0 0 12px',
          lineHeight: 1,
        }}
        aria-label={lang === 'es' ? 'Volver' : 'Back'}
      >
        <SvgIcon name="chevronLeft" size={24} />
      </button>

      <div style={{
        padding: '8px 0 20px',
        borderBottom: `1px solid ${W.c.lineDim}`,
        marginBottom: 20,
      }}>
        <div style={{ fontFamily: W.font.display, fontWeight: 700, fontSize: 36, color: W.c[color], letterSpacing: -1 }}>
          {catalogLabel(mode, lang)}
        </div>
        <div style={{ fontSize: 13, color: W.c.dim, marginTop: 6 }}>{meta.tagline[lang]}</div>
        <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.lime, marginTop: 10 }}>
          {prefsSummary(mode, prefs, lang, formatTimerDisplay)}
        </div>
      </div>

      <div style={{
        padding: 18,
        borderRadius: 16,
        background: W.c.card,
        border: `1px solid ${W.c.lineDim}`,
        marginBottom: 24,
      }}>
        <div style={{ fontFamily: W.font.mono, fontSize: 10, letterSpacing: 1.2, color: W.c.mute, marginBottom: 14 }}>
          {lang === 'es' ? 'CONFIGURACIÓN' : 'SETTINGS'}
        </div>
        <p style={{ fontSize: 12, color: W.c.dim, margin: '0 0 16px', lineHeight: 1.45 }}>
          {meta.editHint[lang]}
        </p>
        <TimerPrefsFields
          mode={mode}
          prefs={prefs[mode]}
          onChange={patch => updatePrefs(mode, patch)}
          lang={lang}
        />
      </div>

      <Btn
        primary
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '18px',
          fontSize: 17,
          boxShadow: `0 12px 32px ${W.c[color]}40`,
        }}
        onClick={startTimer}
      >
        <SvgIcon name="play" size={18} />
        {lang === 'es' ? `Iniciar ${timerModeName(mode, lang)}` : `Start ${timerModeName(mode, lang)}`}
      </Btn>
    </AthleteShell>
  )
}
