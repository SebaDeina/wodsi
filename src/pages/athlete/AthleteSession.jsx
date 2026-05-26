import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { PhoneFrame } from '../../components/PhoneFrame'
import { Tag } from '../../components/Tag'
import { Btn } from '../../components/Btn'
import { Avatar } from '../../components/Avatar'
import { EmptyCard } from '../../components/EmptyCard'
import { SvgIcon } from '../../components/SvgIcon'
import { useAthleteCoach } from '../../hooks/useAthleteCoach'
import { WodSectionsView } from '../../components/WodSectionsView'
import { wodTypeLabel } from '../../lib/wodDisplay'
import { parseDateKey } from '../../lib/dates'
import { initials } from '../../lib/format'
import { saveTimerWod } from '../../lib/timerSession'
import { resolveWodTimerMode, timerModeName, timerModePath } from '../../lib/timerModes'
import { useAthleteSessionLogs } from '../../hooks/useAthleteSessionLogs'

const pageWrap = {
  height: '100dvh',
  maxHeight: '100dvh',
  background: W.c.bg,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  overflow: 'hidden',
}

function scrollPaneStyle(hasFooter, tallFooter = false) {
  const h = tallFooter ? 200 : 100
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: hasFooter ? `calc(${h}px + env(safe-area-inset-bottom, 0px))` : 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    touchAction: 'pan-y',
    padding: '12px 20px 24px',
  }
}

const sessionFooter = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  padding: '12px 20px max(12px, env(safe-area-inset-bottom, 12px))',
  borderTop: `1px solid ${W.c.lineDim}`,
  background: W.c.bg,
  zIndex: 2,
}

const shellInner = {
  flex: 1,
  minHeight: 0,
  position: 'relative',
  width: '100%',
}

const backBtn = {
  fontSize: 22,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  color: W.c.text,
  padding: '4px 8px 4px 0',
  lineHeight: 1,
  touchAction: 'manipulation',
}

function sessionDateLine(wod, lang) {
  if (!wod?.date) return ''
  const d = parseDateKey(wod.date)
  const locale = lang === 'es' ? 'es-AR' : 'en-US'
  const wd = d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase().replace('.', '')
  const day = d.getDate()
  const mon = d.toLocaleDateString(locale, { month: 'short' }).toUpperCase().replace('.', '')
  const dur = wod.duration ? ` · ${wod.duration} min` : ''
  return `${wd} ${day} ${mon}${dur}`
}

export default function AthleteSession() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const wod = location.state?.wod
  const { coach } = useAthleteCoach(profile?.coachId)

  const sessionTimerMode = wod ? resolveWodTimerMode(wod) : null
  const sessionTimerLabel = sessionTimerMode ? timerModeName(sessionTimerMode, lang) : ''
  const sessionDate = wod?.date
  const { isCompleted, toggleCompleted, loading: logLoading } = useAthleteSessionLogs(
    sessionDate ? { fromKey: sessionDate, toKey: sessionDate } : {},
  )
  const sessionDone = sessionDate ? isCompleted(sessionDate) : false

  function startTimer() {
    if (!wod || !sessionTimerMode) return
    saveTimerWod(wod)
    navigate(timerModePath(sessionTimerMode), { state: { wod } })
  }

  if (!wod) {
    return (
      <div style={pageWrap}>
        <PhoneFrame fill>
          <div style={shellInner}>
            <div style={{ ...scrollPaneStyle(false), padding: '16px 20px 24px' }}>
              <button type="button" style={backBtn} onClick={() => navigate('/athlete')} aria-label={lang === 'es' ? 'Volver' : 'Back'}>
                <SvgIcon name="chevronLeft" size={24} />
              </button>
              <div style={{ marginTop: 24 }}>
                <EmptyCard
                  title={lang === 'es' ? 'Sin WOD seleccionado' : 'No WOD selected'}
                  hint={lang === 'es' ? 'Elegí una clase desde Inicio o Semana.' : 'Pick a class from Home or Week.'}
                />
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    )
  }

  const coachName = coach?.name || (lang === 'es' ? 'Tu coach' : 'Your coach')
  const coachInitials = initials(coach?.name, '')

  return (
    <div style={pageWrap}>
      <PhoneFrame fill>
        <div style={shellInner}>
          <div style={scrollPaneStyle(true, Boolean(sessionTimerMode))}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <button type="button" style={backBtn} onClick={() => navigate(-1)} aria-label={lang === 'es' ? 'Volver' : 'Back'}>
                <SvgIcon name="chevronLeft" size={24} />
              </button>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: W.font.mono, fontSize: 11, color: W.c.mute }}>{sessionDateLine(wod, lang)}</span>
            </div>

            <Tag tone="lime">
              {wodTypeLabel(wod.type)}
              {wod.duration ? ` · ${wod.duration} min` : ''}
            </Tag>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, margin: '14px 0 12px', fontFamily: W.font.display }}>
              {wod.title || (lang === 'es' ? 'Trabajo del día' : "Today's session")}
            </h1>

            <WodSectionsView wod={wod} lang={lang} />

            {wod.notes ? (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: W.c.bg2, borderLeft: `3px solid ${W.c.orange}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Avatar name={coachInitials} size={20} tone="orange" />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{coachName}</span>
                </div>
                <div style={{ fontSize: 13, color: W.c.dim, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{wod.notes}</div>
              </div>
            ) : (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: W.c.card, fontSize: 13, color: W.c.mute }}>
                {lang === 'es' ? 'Sin notas del coach para esta sesión.' : 'No coach notes for this session.'}
              </div>
            )}
          </div>

          <div style={sessionFooter}>
            {sessionTimerMode && (
              <>
                <Btn primary style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: 16 }} onClick={startTimer}>
                  <SvgIcon name="play" size={17} />
                  {lang === 'es' ? `Iniciar ${sessionTimerLabel}` : `Start ${sessionTimerLabel}`}
                </Btn>
                <p style={{ fontSize: 11, color: W.c.mute, textAlign: 'center', margin: '10px 0 12px', fontFamily: W.font.mono }}>
                  {lang === 'es'
                    ? `Timer del coach · ${sessionTimerLabel}`
                    : `Coach timer · ${sessionTimerLabel}`}
                </p>
              </>
            )}
            <Btn
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: 15,
                background: sessionDone ? `${W.c.lime}22` : W.c.cardHi,
                color: sessionDone ? W.c.lime : W.c.text,
                border: `1px solid ${sessionDone ? W.c.lime : W.c.lineDim}`,
              }}
              disabled={logLoading || !sessionDate}
              onClick={() => toggleCompleted(sessionDate, wod)}
            >
              {sessionDone
                ? (
                  <>
                    <SvgIcon name="check" size={17} />
                    {lang === 'es' ? 'Entrenamiento completado' : 'Workout completed'}
                  </>
                )
                : (lang === 'es' ? 'Marcar entrenamiento completado' : 'Mark workout complete')}
            </Btn>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
