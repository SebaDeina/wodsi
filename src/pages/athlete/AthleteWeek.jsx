import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { AthleteShell } from '../../components/AthleteShell'
import { EmptyCard } from '../../components/EmptyCard'
import { SvgIcon } from '../../components/SvgIcon'
import { useAthleteWods } from '../../hooks/useAthleteWods'
import { useAthleteSessionLogs } from '../../hooks/useAthleteSessionLogs'
import { addDays, startOfWeek, getISOWeek, toDateKey, isToday } from '../../lib/dates'
import { wodTypeLabel, wodTypeColor } from '../../lib/wodDisplay'
import { wodSectionsFromDoc } from '../../lib/wodSections'

export default function AthleteWeek() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const coachId = profile?.coachId
  const [weekStart, setWeekStart] = useState(() => startOfWeek())
  const weekEnd = addDays(weekStart, 6)
  const { wodsByDate, weekWods, loading } = useAthleteWods(coachId, weekStart)
  const { isCompleted } = useAthleteSessionLogs({
    fromKey: toDateKey(weekStart),
    toKey: toDateKey(weekEnd),
  })

  const weekNum = getISOWeek(weekStart)
  const monthLabel = weekStart.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { month: 'long' }).toUpperCase()

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      const key = toDateKey(date)
      const wods = wodsByDate[key] || []
      const wod = wods.length === 1 ? wods[0] : wods.sort((a, b) => {
        const pa = a.assigneeType === 'athlete' ? 3 : a.assigneeType === 'group' ? 2 : 1
        const pb = b.assigneeType === 'athlete' ? 3 : b.assigneeType === 'group' ? 2 : 1
        return pb - pa
      })[0]
      const secs = wod ? wodSectionsFromDoc(wod, lang) : []
      const locale = lang === 'es' ? 'es-AR' : 'en-US'
      const d = date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase().replace('.', '').slice(0, 3)
      const sub = wod
        ? (secs.length > 1
          ? `${secs.length} ${lang === 'es' ? 'bloques' : 'blocks'}`
          : (secs[0]?.header || secs[0]?.lines?.[0] || wod.title))
        : null
      if (!wod) return null
      return {
        date,
        key,
        d,
        n: String(date.getDate()),
        wod: wodTypeLabel(wod.type),
        sub,
        color: wodTypeColor(wod.type),
        today: isToday(date),
        wodDoc: wod,
        done: isCompleted(key),
      }
    }).filter(Boolean)
  }, [weekStart, wodsByDate, lang, isCompleted])

  function shiftWeek(delta) {
    setWeekStart(prev => addDays(prev, delta * 7))
  }

  function openDay(day) {
    if (!day.wodDoc) return
    navigate('/athlete/session', { state: { wod: day.wodDoc } })
  }

  const prevWeek = addDays(weekStart, -7)
  const nextWeek = addDays(weekStart, 7)
  const currentWeekStart = startOfWeek()

  return (
    <AthleteShell lang={lang}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 1 }}>
                {lang === 'es' ? `SEMANA ${weekNum} · ${monthLabel}` : `WEEK ${weekNum} · ${monthLabel}`}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, fontFamily: W.font.display, marginTop: 2 }}>
                {lang === 'es' ? 'Tu semana' : 'Your week'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: W.c.card, borderRadius: 10 }}>
            {[
              { label: `W${getISOWeek(prevWeek)}`, icon: 'chevronLeft', onClick: () => shiftWeek(-1) },
              { label: `W${weekNum}`, onClick: () => setWeekStart(currentWeekStart), active: true },
              { label: `W${getISOWeek(nextWeek)}`, icon: 'chevronRight', onClick: () => shiftWeek(1) },
            ].map((w, i) => (
              <button
                key={i}
                type="button"
                onClick={w.onClick}
                style={{
                  flex: 1, textAlign: 'center', padding: '8px 0',
                  borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: W.font.mono,
                  background: w.active ? W.c.cardHi : 'transparent',
                  color: w.active ? W.c.lime : W.c.dim,
                  cursor: 'pointer', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                }}
              >
                {w.icon === 'chevronLeft' && <SvgIcon name="chevronLeft" size={14} />}
                {w.label}
                {w.icon === 'chevronRight' && <SvgIcon name="chevronRight" size={14} />}
              </button>
            ))}
          </div>

          {loading ? (
            <EmptyCard title={lang === 'es' ? 'Cargando planificación…' : 'Loading programming…'} />
          ) : weekWods.length === 0 ? (
            <EmptyCard
              title={lang === 'es' ? 'Semana sin WODs' : 'No WODs this week'}
              hint={lang === 'es'
                ? 'Cuando tu coach publique la planificación, la vas a ver acá día por día.'
                : 'When your coach publishes the week plan, you will see it here day by day.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {days.map((d, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDay(d)}
                  onKeyDown={e => { if (d.wodDoc && e.key === 'Enter') openDay(d) }}
                  style={{
                    padding: 14, borderRadius: 14,
                    background: d.today ? W.c.lime : W.c.card,
                    color: d.today ? W.c.bg : W.c.text,
                    display: 'flex', alignItems: 'center', gap: 14,
                    boxShadow: d.today ? `0 12px 32px ${W.c.lime}30` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 44, textAlign: 'center', borderRight: `1px solid ${d.today ? `${W.c.bg}40` : W.c.lineDim}`, paddingRight: 14 }}>
                    <div style={{ fontSize: 10, fontFamily: W.font.mono, letterSpacing: 0.5, opacity: 0.7 }}>{d.d}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: W.font.display, letterSpacing: -0.6 }}>{d.n}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: W.font.display, letterSpacing: -0.3 }}>{d.wod}</div>
                    {d.sub && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{d.sub}</div>}
                  </div>
                  {d.wodDoc && d.done && (
                    <span style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: d.today ? W.c.bg : W.c.lime,
                      color: d.today ? W.c.lime : W.c.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                    }}>
                      <SvgIcon name="check" size={16} />
                    </span>
                  )}
                  {d.wodDoc && !d.done && d.today && <span style={{ opacity: 0.6, lineHeight: 0 }}><SvgIcon name="play" size={18} /></span>}
                  {d.wodDoc && !d.done && !d.today && <span style={{ color: W.c.mute, lineHeight: 0 }}><SvgIcon name="chevronRight" size={18} /></span>}
                </div>
              ))}
            </div>
          )}

          {weekWods.length > 0 && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: W.c.card }}>
              <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, marginBottom: 6 }}>
                {lang === 'es' ? 'RESUMEN' : 'SUMMARY'}
              </div>
              <div style={{ fontSize: 13, color: W.c.dim }}>
                {lang === 'es'
                  ? `${weekWods.length} WOD${weekWods.length === 1 ? '' : 's'} esta semana`
                  : `${weekWods.length} WOD${weekWods.length === 1 ? '' : 's'} this week`}
              </div>
            </div>
          )}
    </AthleteShell>
  )
}
