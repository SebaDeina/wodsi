import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { AthleteShell } from '../../components/AthleteShell'
import { Avatar } from '../../components/Avatar'
import { EmptyCard } from '../../components/EmptyCard'
import { useAthleteCoach } from '../../hooks/useAthleteCoach'
import { useAthleteWods } from '../../hooks/useAthleteWods'
import { useAthleteHabits } from '../../hooks/useAthleteHabits'
import { useAthleteProgramGroup } from '../../hooks/useAthleteProgramGroup'
import { firstName, initials } from '../../lib/format'
import { hasWhatsAppPhone } from '../../lib/phone'
import { wodTypeLabel } from '../../lib/wodDisplay'
import { wodPreviewLines, wodSectionsFromDoc } from '../../lib/wodSections'

function todayHeader(lang) {
  const locale = lang === 'es' ? 'es-AR' : 'en-US'
  const d = new Date()
  const wd = d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase().replace('.', '')
  const day = d.getDate()
  const mon = d.toLocaleDateString(locale, { month: 'short' }).toUpperCase().replace('.', '')
  return `${wd} · ${day} ${mon}`
}

export default function AthleteHome() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const coachId = profile?.coachId
  const { coach } = useAthleteCoach(coachId)
  const { todayWod, loading: wodsLoading } = useAthleteWods(coachId)
  const { items: habits, completedCount, total, toggleHabit, loading: habitsLoading } = useAthleteHabits(lang)
  const { group: programGroup } = useAthleteProgramGroup(profile?.programGroupId)

  const displayName = firstName(profile?.name, user?.email) || user?.displayName?.split(' ')[0] || (lang === 'es' ? 'Atleta' : 'Athlete')
  const avatarInitials = initials(profile?.name || user?.displayName, user?.email)

  const greeting = lang === 'es' ? `¡Hola, ${displayName}!` : `Hey, ${displayName}!`
  const coachLine = coach?.boxName || coach?.name

  function startSession() {
    if (!todayWod) return
    navigate('/athlete/session', { state: { wod: todayWod } })
  }

  const needsWhatsApp = !hasWhatsAppPhone(profile)

  return (
    <AthleteShell lang={lang}>
          {needsWhatsApp && (
            <button
              type="button"
              onClick={() => navigate('/settings')}
              style={{
                width: '100%', marginBottom: 16, padding: '14px 16px', borderRadius: 12,
                border: `1px solid ${W.c.orange}50`, background: `${W.c.orange}14`,
                textAlign: 'left', cursor: 'pointer', color: W.c.text,
              }}
            >
              <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.orange, letterSpacing: 0.5 }}>
                {lang === 'es' ? 'WHATSAPP' : 'WHATSAPP'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                {lang === 'es' ? 'Cargá tu número para avisos del coach' : 'Add your number for coach notices'}
              </div>
              <div style={{ fontSize: 12, color: W.c.dim, marginTop: 4 }}>
                {lang === 'es' ? 'Perfil → Tu WhatsApp' : 'Profile → Your WhatsApp'}
              </div>
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 1 }}>{todayHeader(lang)}</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.8, fontFamily: W.font.display, marginTop: 2 }}>
                {greeting}
              </div>
              {coachLine && (
                <div style={{ fontSize: 11, fontFamily: W.font.mono, color: W.c.dim, marginTop: 4, letterSpacing: 0.4 }}>
                  {coachLine}
                  {programGroup?.name && (
                    <span style={{ color: W.c.lime }}> · {programGroup.name}</span>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <Avatar name={avatarInitials} size={40} tone="lime" />
          </div>

          {wodsLoading && !todayWod ? (
            <EmptyCard title={lang === 'es' ? 'Cargando clase…' : 'Loading class…'} />
          ) : todayWod ? (
            <div style={{
              background: W.c.lime, color: W.c.bg, borderRadius: 18,
              padding: 24, position: 'relative', overflow: 'hidden',
              boxShadow: `0 16px 40px ${W.c.lime}30`,
            }}>
              <div style={{ position: 'absolute', top: 16, right: 16, fontFamily: W.font.mono, fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>
                {wodTypeLabel(todayWod.type)}
                {todayWod.duration ? ` · ${todayWod.duration} min` : ''}
              </div>
              <div style={{ fontFamily: W.font.mono, fontSize: 11, letterSpacing: 1, opacity: 0.7 }}>{lang === 'es' ? 'CLASE DE HOY' : "TODAY'S CLASS"}</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1.2, marginTop: 8, fontFamily: W.font.display, lineHeight: 1.1 }}>
                {todayWod.title || (lang === 'es' ? 'Trabajo del día' : "Today's session")}
              </div>
              {wodSectionsFromDoc(todayWod, lang).length > 0 && (
                <div style={{ fontFamily: W.font.mono, fontSize: 10, marginTop: 8, opacity: 0.75 }}>
                  {wodSectionsFromDoc(todayWod, lang).length} {lang === 'es' ? 'bloques' : 'blocks'}
                </div>
              )}
              {wodPreviewLines(todayWod, 5, lang).length > 0 && (
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 10, opacity: 0.92, lineHeight: 1.45 }}>
                  {wodPreviewLines(todayWod, 5, lang).map((line, i) => (
                    <div key={i} style={{ marginTop: i === 0 ? 0 : 3 }}>{line}</div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={startSession}
                style={{
                  marginTop: 24, width: '100%', padding: '14px',
                  background: W.c.bg, color: W.c.lime, border: 'none',
                  borderRadius: 12, fontWeight: 700, fontSize: 15,
                  fontFamily: W.font.sans, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                ▶ {lang === 'es' ? 'Empezar sesión' : 'Start session'}
              </button>
            </div>
          ) : (
            <EmptyCard
              title={lang === 'es' ? 'Sin clase hoy' : 'No class today'}
              hint={lang === 'es'
                ? 'Tu coach aún no programó el WOD de hoy. Revisá la semana en la pestaña Semana.'
                : "Your coach hasn't posted today's WOD yet. Check the Week tab."}
              style={{ padding: 28 }}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <div style={{ background: W.c.card, borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.5 }}>{lang === 'es' ? 'RACHA' : 'STREAK'}</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, fontFamily: W.font.display, marginTop: 2, color: W.c.dim }}>
                —
              </div>
              <div style={{ fontSize: 11, color: W.c.mute, marginTop: 6, lineHeight: 1.35 }}>
                {lang === 'es' ? 'Próximamente con tus sesiones' : 'Coming with your sessions'}
              </div>
            </div>
            <div style={{ background: W.c.card, borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.5 }}>{lang === 'es' ? 'PRs' : 'PRs'}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.8, fontFamily: W.font.display, marginTop: 2, color: W.c.dim }}>
                {lang === 'es' ? 'Sin datos' : 'No data'}
              </div>
              <div style={{ fontSize: 11, color: W.c.mute, marginTop: 6 }}>
                {lang === 'es' ? 'Registrá marcas en Historial' : 'Log lifts in History'}
              </div>
            </div>
          </div>

          <div style={{ background: W.c.card, borderRadius: 14, padding: 16, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'es' ? 'Hábitos de hoy' : "Today's habits"}</div>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: W.font.mono, fontSize: 11, color: completedCount > 0 ? W.c.lime : W.c.mute }}>
                {habitsLoading ? '…' : `${completedCount} / ${total}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {habits.map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggleHabit(h.id)}
                  disabled={habitsLoading}
                  style={{
                    flex: 1, padding: '12px 4px', borderRadius: 10,
                    background: h.done ? W.c.limeSoft : W.c.bg2,
                    border: `1px solid ${h.done ? W.c.lime : 'transparent'}`,
                    textAlign: 'center', cursor: habitsLoading ? 'default' : 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 18, opacity: h.done ? 1 : 0.45 }}>{h.icon}</div>
                  <div style={{ fontSize: 9, color: h.done ? W.c.lime : W.c.mute, marginTop: 4, fontFamily: W.font.mono }}>{h.label}</div>
                </button>
              ))}
            </div>
            {completedCount === 0 && !habitsLoading && (
              <div style={{ fontSize: 11, color: W.c.mute, marginTop: 10, textAlign: 'center' }}>
                {lang === 'es' ? 'Tocá cada hábito cuando lo completes' : 'Tap each habit when you complete it'}
              </div>
            )}
          </div>
    </AthleteShell>
  )
}
