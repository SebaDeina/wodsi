import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useCoachWods } from '../../hooks/useCoachWods'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { addDays, formatDayLabel, getISOWeek, isToday, startOfWeek, toDateKey } from '../../lib/dates'
import { wodBlockFromDoc } from '../../lib/wodDisplay'
import { segmentButtonStyle } from '../../lib/segmentControl'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { CoachHeader } from './CoachHeader'
import { useIsMobile } from '../../hooks/useBreakpoint'

function matchesFilter(wod, filter) {
  if (!filter || filter === 'all') return true
  if (filter.startsWith('group:')) {
    return wod.assigneeType === 'group' && wod.groupId === filter.slice(6)
  }
  if (filter.startsWith('athlete:')) {
    return wod.assigneeType === 'athlete' && wod.athleteId === filter.slice(8)
  }
  return true
}

export default function CoachPlanner() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const isMobile = useIsMobile(1024)
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewFilter, setViewFilter] = useState('all')

  const { groups } = useCoachGroups()
  const { athletes } = useCoachAthletes()

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date())
    return addDays(base, weekOffset * 7)
  }, [weekOffset])

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])
  const { weekWods, loading, error } = useCoachWods(weekStart)

  const filteredWeekWods = useMemo(
    () => weekWods.filter(w => matchesFilter(w, viewFilter)),
    [weekWods, viewFilter],
  )

  const wodsByDate = useMemo(() => {
    const map = {}
    for (const w of filteredWeekWods) {
      if (!w.date) continue
      if (!map[w.date]) map[w.date] = []
      map[w.date].push(w)
    }
    return map
  }, [filteredWeekWods])

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const weekLabel = lang === 'es'
    ? `${weekStart.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString('es-AR', { month: 'long' })}`
    : `${weekStart.toLocaleDateString('en-US', { month: 'short' })} ${weekStart.getDate()}–${weekEnd.getDate()}`

  function openNewWod(date, extra = '') {
    const base = `/coach/planner/new?date=${toDateKey(date)}`
    navigate(extra ? `${base}&${extra}` : base)
  }

  const filterSuffix = viewFilter.startsWith('group:')
    ? `assignee=group&groupId=${viewFilter.slice(6)}`
    : viewFilter.startsWith('athlete:')
      ? `assignee=athlete&athleteId=${viewFilter.slice(8)}`
      : ''

  const filterLabel = useMemo(() => {
    if (viewFilter.startsWith('group:')) {
      return groups.find(g => g.id === viewFilter.slice(6))?.name || ''
    }
    if (viewFilter.startsWith('athlete:')) {
      const athlete = athletes.find(a => a.id === viewFilter.slice(8))
      return athlete?.name || athlete?.email || ''
    }
    return lang === 'es' ? 'Todos' : 'All'
  }, [athletes, groups, lang, viewFilter])

  const filterOptions = useMemo(() => {
    const groupOptions = groups.map(g => ({
      id: `group:${g.id}`,
      label: g.name,
      meta: `${(g.memberIds || []).length}`,
    }))
    const athleteOptions = athletes.slice(0, 8).map(a => ({
      id: `athlete:${a.id}`,
      label: a.name || a.email,
      meta: lang === 'es' ? '1:1' : '1:1',
    }))
    return [{ id: 'all', label: lang === 'es' ? 'Todos' : 'All', meta: String(filteredWeekWods.length) }, ...groupOptions, ...athleteOptions]
  }, [athletes, filteredWeekWods.length, groups, lang])

  if (isMobile) {
    return (
      <DesktopChrome lang={lang}>
        <CoachHeader
          title={lang === 'es' ? `Semana ${getISOWeek(weekStart)}` : `Week ${getISOWeek(weekStart)}`}
          subtitle={`${weekLabel} · ${filterLabel}`}
          right={<>
            <Btn ghost sm onClick={() => setWeekOffset(o => o - 1)}>‹</Btn>
            <Btn ghost sm onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
              {lang === 'es' ? 'Hoy' : 'Today'}
            </Btn>
            <Btn ghost sm onClick={() => setWeekOffset(o => o + 1)}>›</Btn>
            <Btn primary sm onClick={() => openNewWod(new Date(), filterSuffix)}>
              + {lang === 'es' ? 'Plan' : 'Plan'}
            </Btn>
          </>}
        />

        {error && (
          <div style={{ margin: '12px 16px 0', padding: 12, borderRadius: 10, background: `${W.c.red}10`, color: W.c.red, fontSize: 13 }}>
            {lang === 'es'
              ? 'No pudimos cargar la planificación. Actualizá la pantalla e intentá de nuevo.'
              : 'We could not load programming. Refresh and try again.'}
          </div>
        )}

        <div style={{
          flexShrink: 0,
          padding: '12px 16px',
          borderBottom: `1px solid ${W.c.lineDim}`,
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {filterOptions.map(option => {
            const active = viewFilter === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setViewFilter(option.id)}
                style={{
                  flex: '0 0 auto',
                  padding: '8px 11px',
                  borderRadius: 999,
                  border: `1px solid ${active ? W.c.lime : W.c.lineDim}`,
                  background: active ? W.c.limeSoft : W.c.card,
                  color: active ? W.c.text : W.c.dim,
                  fontFamily: W.font.sans,
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer',
                }}
              >
                {option.label}
                {option.meta && (
                  <span style={{ marginLeft: 6, color: active ? W.c.lime : W.c.mute, fontFamily: W.font.mono, fontSize: 10 }}>
                    {option.meta}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: W.c.mute }}>
              {lang === 'es' ? 'Cargando planificación…' : 'Loading programming…'}
            </div>
          ) : days.map(day => {
            const key = toDateKey(day)
            const blocks = (wodsByDate[key] || []).map(w => wodBlockFromDoc(w, lang, { groups, athletes }))
            const today = isToday(day)

            return (
              <section key={key} style={{
                background: W.c.card,
                border: `1px solid ${today ? `${W.c.lime}55` : W.c.lineDim}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${W.c.lineDim}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{formatDayLabel(day, lang)}</div>
                    {today && <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.lime, marginTop: 2 }}>{lang === 'es' ? 'HOY' : 'TODAY'}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => openNewWod(day, filterSuffix)}
                    style={{
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 10px',
                      background: W.c.lime,
                      color: W.c.bg,
                      fontFamily: W.font.sans,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    + {lang === 'es' ? 'Plan' : 'Plan'}
                  </button>
                </div>

                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {blocks.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openNewWod(day, filterSuffix)}
                      style={{
                        width: '100%',
                        minHeight: 54,
                        border: `1px dashed ${W.c.lineDim}`,
                        borderRadius: 9,
                        background: 'transparent',
                        color: W.c.mute,
                        fontFamily: W.font.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {lang === 'es' ? 'Agregar planificación' : 'Add programming'}
                    </button>
                  ) : blocks.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => navigate(`/coach/planner/new?date=${key}&edit=${b.id}`)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 12,
                        borderRadius: 9,
                        border: `1px solid ${W.c.lineDim}`,
                        borderLeft: `4px solid ${W.c[b.color]}`,
                        background: W.c.bg2,
                        color: W.c.text,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.lime, letterSpacing: 0.4 }}>
                        {b.assignee}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>{b.name}</div>
                        <div style={{ flexShrink: 0, fontFamily: W.font.mono, fontSize: 10, color: W.c.mute }}>
                          {b.type}{b.dur !== '—' ? ` · ${b.dur}M` : ''}
                        </div>
                      </div>
                      {b.preview && (
                        <div style={{ fontSize: 12, color: W.c.dim, marginTop: 6, whiteSpace: 'pre-line', lineHeight: 1.35, maxHeight: 50, overflow: 'hidden' }}>
                          {b.preview}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </DesktopChrome>
    )
  }

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={lang === 'es' ? `Planificación · Semana ${getISOWeek(weekStart)}` : `Programming · Week ${getISOWeek(weekStart)}`}
        subtitle={lang === 'es'
          ? `${weekLabel} · ${filteredWeekWods.length} ${filteredWeekWods.length === 1 ? 'sesión visible' : 'sesiones visibles'}`
          : `${weekLabel} · ${filteredWeekWods.length} visible session${filteredWeekWods.length === 1 ? '' : 's'}`}
        right={<>
          <Btn ghost sm onClick={() => navigate('/coach/groups')}>
            {lang === 'es' ? 'Grupos' : 'Groups'}
          </Btn>
          <Btn ghost sm onClick={() => setWeekOffset(o => o - 1)}>‹</Btn>
          <Btn ghost sm onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
            {lang === 'es' ? 'Hoy' : 'Today'}
          </Btn>
          <Btn ghost sm onClick={() => setWeekOffset(o => o + 1)}>›</Btn>
          <Btn primary sm onClick={() => openNewWod(new Date(), filterSuffix)}>
            + {lang === 'es' ? 'Nueva planificación' : 'New programming'}
          </Btn>
        </>}
      />

      {error && (
        <div style={{ padding: '12px 32px', fontSize: 13, color: W.c.red, fontFamily: W.font.mono }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderRight: `1px solid ${W.c.lineDim}`, overflow: 'auto' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', padding: 32, fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>
              {lang === 'es' ? 'CARGANDO…' : 'LOADING…'}
            </div>
          ) : days.map((day, i) => {
            const key = toDateKey(day)
            const blocks = (wodsByDate[key] || []).map(w => wodBlockFromDoc(w, lang, { groups, athletes }))
            const today = isToday(day)

            return (
              <div key={key} style={{ borderRight: i < 6 ? `1px solid ${W.c.lineDim}` : 'none', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                <div style={{
                  padding: '14px 12px 12px', fontFamily: W.font.mono, fontSize: 10, letterSpacing: 0.6,
                  color: today ? W.c.lime : W.c.mute, textTransform: 'uppercase',
                  borderBottom: `1px solid ${W.c.lineDim}`, display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>{formatDayLabel(day, lang)}</span>
                  {today && <span>● {lang === 'es' ? 'HOY' : 'TODAY'}</span>}
                </div>
                <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {blocks.map(b => (
                    <div
                      key={b.id}
                      style={{ padding: '10px', borderRadius: 8, background: W.c.card, borderLeft: `3px solid ${W.c[b.color]}`, cursor: 'pointer' }}
                      onClick={() => navigate(`/coach/planner/new?date=${key}&edit=${b.id}`)}
                      title={b.description}
                    >
                      <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.lime, letterSpacing: 0.5 }}>
                        → {b.assignee}
                      </div>
                      <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.mute, letterSpacing: 0.6, marginTop: 2 }}>
                        {b.type}{b.dur !== '—' ? ` · ${b.dur}MIN` : ''}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3, lineHeight: 1.3 }}>{b.name}</div>
                      {b.preview && (
                        <div style={{
                          fontSize: 10, color: W.c.dim, marginTop: 4,
                          whiteSpace: 'pre-line', lineHeight: 1.35,
                          maxHeight: 48, overflow: 'hidden',
                        }}>
                          {b.preview}
                        </div>
                      )}
                    </div>
                  ))}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openNewWod(day, filterSuffix)}
                    onKeyDown={e => e.key === 'Enter' && openNewWod(day, filterSuffix)}
                    style={{
                      flex: blocks.length === 0 ? 1 : undefined,
                      padding: blocks.length === 0 ? undefined : '6px',
                      border: `1px dashed ${W.c.lineDim}`, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: W.c.mute, fontSize: 11, fontFamily: W.font.mono,
                      letterSpacing: 0.5, minHeight: blocks.length === 0 ? 60 : undefined,
                      cursor: 'pointer',
                    }}
                  >
                    + {lang === 'es' ? 'plan' : 'plan'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ width: 280, padding: 18, overflow: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 10 }}>
            {lang === 'es' ? 'VER CALENDARIO' : 'VIEW CALENDAR'}
          </div>
          <button
            type="button"
            onClick={() => setViewFilter('all')}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 6,
              borderRadius: 8, fontSize: 13, cursor: 'pointer',
              color: W.c.text,
              ...segmentButtonStyle(viewFilter === 'all'),
            }}
          >
            {lang === 'es' ? 'Todas las asignaciones' : 'All assignments'}
          </button>

          <div style={{ fontSize: 11, fontFamily: W.font.mono, color: W.c.mute, margin: '16px 0 8px', letterSpacing: 0.6 }}>
            {lang === 'es' ? 'GRUPOS' : 'GROUPS'}
          </div>
          {groups.length === 0 ? (
            <p style={{ fontSize: 12, color: W.c.dim, lineHeight: 1.45 }}>
              <span style={{ cursor: 'pointer', color: W.c.lime }} onClick={() => navigate('/coach/groups')}>
                {lang === 'es' ? 'Creá un grupo' : 'Create a group'}
              </span>
              {lang === 'es' ? ' para asignar planificación por objetivo.' : ' to assign programming by goal.'}
            </p>
          ) : groups.map(g => (
            <div key={g.id} style={{ marginBottom: 6 }}>
              <button
                type="button"
                onClick={() => setViewFilter(`group:${g.id}`)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  color: W.c.text,
                  ...segmentButtonStyle(viewFilter === `group:${g.id}`),
                }}
              >
                <div style={{ fontWeight: 600 }}>{g.name}</div>
                <div style={{ fontSize: 10, color: W.c.mute, marginTop: 2 }}>
                  {(g.memberIds || []).length} {lang === 'es' ? 'atletas' : 'athletes'}
                </div>
              </button>
            </div>
          ))}

          {athletes.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontFamily: W.font.mono, color: W.c.mute, margin: '16px 0 8px', letterSpacing: 0.6 }}>
                {lang === 'es' ? 'ATLETAS' : 'ATHLETES'}
              </div>
              {athletes.slice(0, 12).map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setViewFilter(`athlete:${a.id}`)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: 4,
                    borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    color: viewFilter === `athlete:${a.id}` ? W.c.lime : W.c.dim,
                    ...segmentButtonStyle(viewFilter === `athlete:${a.id}`),
                    ...(viewFilter !== `athlete:${a.id}` ? { background: 'transparent', border: '1px solid transparent' } : {}),
                  }}
                >
                  {a.name || a.email}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </DesktopChrome>
  )
}
