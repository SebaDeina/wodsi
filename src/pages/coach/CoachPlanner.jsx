import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useCoachWods } from '../../hooks/useCoachWods'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { addDays, formatDayLabel, getISOWeek, isToday, startOfWeek, toDateKey } from '../../lib/dates'
import { wodBlockFromDoc } from '../../lib/wodDisplay'
import { segmentButtonStyle } from '../../lib/segmentControl'
import { DEFAULT_LIBRARY_BLOCKS } from '../../data/defaultLibraryBlocks'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { Avatar } from '../../components/Avatar'
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

function emptyGroupForm() {
  return { name: '', goal: '', memberIds: [] }
}

export default function CoachPlanner() {
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const isMobile = useIsMobile(1024)
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(
    searchParams.get('tab') === 'library' ? 'library'
    : searchParams.get('tab') === 'groups' ? 'groups'
    : 'week'
  )
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewFilter, setViewFilter] = useState('all')

  const { groups, createGroup, updateGroup, deleteGroup } = useCoachGroups()
  const { athletes } = useCoachAthletes()

  // Groups tab state
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [groupForm, setGroupForm] = useState(emptyGroupForm())
  const [groupBusy, setGroupBusy] = useState(false)
  const [groupError, setGroupError] = useState('')

  function startCreateGroup() {
    setEditingGroupId('new')
    setGroupForm(emptyGroupForm())
    setGroupError('')
  }

  function startEditGroup(group) {
    setEditingGroupId(group.id)
    setGroupForm({ name: group.name || '', goal: group.goal || '', memberIds: [...(group.memberIds || [])] })
    setGroupError('')
  }

  function toggleGroupMember(athleteId) {
    setGroupForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(athleteId)
        ? prev.memberIds.filter(id => id !== athleteId)
        : [...prev.memberIds, athleteId],
    }))
  }

  async function handleGroupSave(e) {
    e.preventDefault()
    if (!groupForm.name.trim()) {
      setGroupError(lang === 'es' ? 'El nombre del grupo es obligatorio.' : 'Group name is required.')
      return
    }
    setGroupBusy(true)
    setGroupError('')
    try {
      if (editingGroupId === 'new') {
        const id = await createGroup(groupForm)
        for (const athleteId of groupForm.memberIds) {
          await updateDoc(doc(db, 'users', athleteId), { programGroupId: id })
        }
      } else {
        await updateGroup(editingGroupId, groupForm)
        await Promise.all(
          athletes.map(a => {
            const inGroup = groupForm.memberIds.includes(a.id)
            if (a.programGroupId === editingGroupId && !inGroup) {
              return updateDoc(doc(db, 'users', a.id), { programGroupId: null })
            }
            if (inGroup && a.programGroupId !== editingGroupId) {
              return updateDoc(doc(db, 'users', a.id), { programGroupId: editingGroupId })
            }
            return Promise.resolve()
          }),
        )
      }
      setEditingGroupId(null)
      setGroupForm(emptyGroupForm())
    } catch {
      setGroupError(lang === 'es' ? 'No pudimos guardar el grupo.' : 'Could not save the group.')
    } finally {
      setGroupBusy(false)
    }
  }

  async function handleGroupDelete(groupId) {
    if (!window.confirm(lang === 'es' ? '¿Eliminar este grupo?' : 'Delete this group?')) return
    setGroupBusy(true)
    try {
      await deleteGroup(groupId)
      for (const a of athletes.filter(x => x.programGroupId === groupId)) {
        await updateDoc(doc(db, 'users', a.id), { programGroupId: null })
      }
      if (editingGroupId === groupId) {
        setEditingGroupId(null)
        setGroupForm(emptyGroupForm())
      }
    } catch {
      setGroupError(lang === 'es' ? 'No pudimos eliminar el grupo.' : 'Could not delete the group.')
    } finally {
      setGroupBusy(false)
    }
  }

  // Library tab state
  const [libBlocks, setLibBlocks] = useState([])
  const [libLoading, setLibLoading] = useState(false)
  const [libSearch, setLibSearch] = useState('')
  const [libFilter, setLibFilter] = useState('all')

  useEffect(() => {
    if (tab !== 'library' || !user?.uid || libBlocks.length > 0) return
    async function loadLib() {
      setLibLoading(true)
      try {
        const q = query(collection(db, 'library_blocks'), where('coachId', '==', user.uid))
        const snap = await getDocs(q)
        if (snap.empty) {
          setLibBlocks(DEFAULT_LIBRARY_BLOCKS.map((b, i) => ({ id: `default-${i}`, ...b, isDefault: true })))
        } else {
          setLibBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch {
        setLibBlocks(DEFAULT_LIBRARY_BLOCKS.map((b, i) => ({ id: `default-${i}`, ...b, isDefault: true })))
      } finally {
        setLibLoading(false)
      }
    }
    loadLib()
  }, [tab, user?.uid, libBlocks.length])

  const libTypes = ['all', ...new Set(libBlocks.map(b => b.type))]
  const libShown = libBlocks.filter(b => {
    const matchType = libFilter === 'all' || b.type === libFilter
    const q = libSearch.toLowerCase()
    return matchType && (!q || b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q))
  })

  async function persistLibDefaults() {
    if (!user?.uid) return
    await Promise.all(DEFAULT_LIBRARY_BLOCKS.map(b =>
      addDoc(collection(db, 'library_blocks'), { ...b, coachId: user.uid, createdAt: serverTimestamp() })
    ))
    const snap = await getDocs(query(collection(db, 'library_blocks'), where('coachId', '==', user.uid)))
    setLibBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

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
                    <div style={{ fontWeight: 700, fontSize: 15, color: W.c.text }}>{formatDayLabel(day, lang)}</div>
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

  const groupInp = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1px solid ${W.c.lineDim}`, background: W.c.card, color: W.c.text,
    fontFamily: W.font.sans, fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const groupLabel = { fontSize: 11, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 6, display: 'block' }

  const plannerTitle = tab === 'week'
    ? (lang === 'es' ? `Planificación · Semana ${getISOWeek(weekStart)}` : `Programming · Week ${getISOWeek(weekStart)}`)
    : tab === 'groups'
      ? (lang === 'es' ? 'Grupos de planificación' : 'Programming groups')
      : (lang === 'es' ? 'Librería de bloques' : 'Block library')

  const plannerSubtitle = tab === 'week'
    ? (lang === 'es'
        ? `${weekLabel} · ${filteredWeekWods.length} ${filteredWeekWods.length === 1 ? 'sesión visible' : 'sesiones visibles'}`
        : `${weekLabel} · ${filteredWeekWods.length} visible session${filteredWeekWods.length === 1 ? '' : 's'}`)
    : tab === 'groups'
      ? (lang === 'es' ? 'Atletas con el mismo objetivo comparten la planificación' : 'Athletes with the same goal share programming')
      : (lang === 'es' ? 'Bloques reutilizables para armar la semana' : 'Reusable blocks to build your week')

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={plannerTitle}
        subtitle={plannerSubtitle}
        right={tab === 'week' ? (
          <>
            <Btn ghost sm onClick={() => setWeekOffset(o => o - 1)}>‹</Btn>
            <Btn ghost sm onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
              {lang === 'es' ? 'Hoy' : 'Today'}
            </Btn>
            <Btn ghost sm onClick={() => setWeekOffset(o => o + 1)}>›</Btn>
            <Btn primary sm onClick={() => openNewWod(new Date(), filterSuffix)}>
              + {lang === 'es' ? 'Nueva planificación' : 'New programming'}
            </Btn>
          </>
        ) : tab === 'groups' ? (
          <Btn primary sm onClick={startCreateGroup} disabled={editingGroupId === 'new'}>
            + {lang === 'es' ? 'Nuevo grupo' : 'New group'}
          </Btn>
        ) : (
          <Btn primary sm onClick={() => navigate('/coach/planner/new')}>
            + {lang === 'es' ? 'Nuevo WOD' : 'New WOD'}
          </Btn>
        )}
      />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 32px 0', borderBottom: `1px solid ${W.c.lineDim}`, flexShrink: 0 }}>
        {[
          { key: 'week',    label: lang === 'es' ? 'Semana' : 'Week' },
          { key: 'groups',  label: lang === 'es' ? 'Grupos' : 'Groups' },
          { key: 'library', label: lang === 'es' ? 'Librería' : 'Library' },
        ].map(t2 => (
          <button
            key={t2.key}
            type="button"
            onClick={() => setTab(t2.key)}
            style={{
              padding: '8px 18px', border: 'none', cursor: 'pointer',
              background: 'transparent', fontFamily: W.font.sans, fontSize: 13, fontWeight: 600,
              color: tab === t2.key ? W.c.text : W.c.dim,
              borderBottom: `2px solid ${tab === t2.key ? W.c.lime : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {t2.label}
          </button>
        ))}
      </div>

      {/* ── Week tab ─────────────────────────────────────────── */}
      {tab === 'week' && (
        <>
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
                          <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.lime, letterSpacing: 0.5 }}>→ {b.assignee}</div>
                          <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.mute, letterSpacing: 0.6, marginTop: 2 }}>
                            {b.type}{b.dur !== '—' ? ` · ${b.dur}MIN` : ''}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3, lineHeight: 1.3, color: W.c.text }}>{b.name}</div>
                          {b.preview && (
                            <div style={{ fontSize: 10, color: W.c.dim, marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.35, maxHeight: 48, overflow: 'hidden' }}>
                              {b.preview}
                            </div>
                          )}
                        </div>
                      ))}
                      <div
                        role="button" tabIndex={0}
                        onClick={() => openNewWod(day, filterSuffix)}
                        onKeyDown={e => e.key === 'Enter' && openNewWod(day, filterSuffix)}
                        style={{
                          flex: blocks.length === 0 ? 1 : undefined,
                          padding: blocks.length === 0 ? undefined : '6px',
                          border: `1px dashed ${W.c.lineDim}`, borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: W.c.mute, fontSize: 11, fontFamily: W.font.mono, letterSpacing: 0.5,
                          minHeight: blocks.length === 0 ? 60 : undefined, cursor: 'pointer',
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
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 6, borderRadius: 8, fontSize: 13, cursor: 'pointer', ...segmentButtonStyle(viewFilter === 'all') }}
              >
                {lang === 'es' ? 'Todas las asignaciones' : 'All assignments'}
              </button>

              <div style={{ fontSize: 11, fontFamily: W.font.mono, color: W.c.mute, margin: '16px 0 8px', letterSpacing: 0.6 }}>
                {lang === 'es' ? 'GRUPOS' : 'GROUPS'}
              </div>
              {groups.length === 0 ? (
                <p style={{ fontSize: 12, color: W.c.dim, lineHeight: 1.45 }}>
                  <span style={{ cursor: 'pointer', color: W.c.lime }} onClick={() => setTab('groups')}>
                    {lang === 'es' ? 'Creá un grupo' : 'Create a group'}
                  </span>
                  {lang === 'es' ? ' para asignar planificación por objetivo.' : ' to assign programming by goal.'}
                </p>
              ) : groups.map(g => (
                <div key={g.id} style={{ marginBottom: 6 }}>
                  <button
                    type="button"
                    onClick={() => setViewFilter(`group:${g.id}`)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', ...segmentButtonStyle(viewFilter === `group:${g.id}`) }}
                  >
                    <div style={{ fontWeight: 600, color: W.c.text }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: W.c.mute, marginTop: 2 }}>{(g.memberIds || []).length} {lang === 'es' ? 'atletas' : 'athletes'}</div>
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
                        ...segmentButtonStyle(viewFilter === `athlete:${a.id}`),
                        ...(viewFilter !== `athlete:${a.id}` ? { background: 'transparent', border: '1px solid transparent', color: W.c.dim } : {}),
                      }}
                    >
                      {a.name || a.email}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Groups tab ───────────────────────────────────────── */}
      {tab === 'groups' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
            {groups.length === 0 && !editingGroupId ? (
              <div style={{ padding: 48, textAlign: 'center', border: `1px dashed ${W.c.lineDim}`, borderRadius: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: W.c.text }}>
                  {lang === 'es' ? 'Todavía no tenés grupos' : 'No groups yet'}
                </div>
                <p style={{ fontSize: 13, color: W.c.dim, maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Ej: "Competidores", "Principiantes", "Recuperación hombro".'
                    : 'E.g. "Competitors", "Beginners", "Shoulder rehab".'}
                </p>
                <Btn primary onClick={startCreateGroup}>+ {lang === 'es' ? 'Crear primer grupo' : 'Create first group'}</Btn>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
                {groups.map(g => (
                  <div key={g.id} style={{ padding: 18, borderRadius: 12, background: W.c.card, border: `1px solid ${editingGroupId === g.id ? W.c.lime : W.c.lineDim}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: W.c.text }}>{g.name}</div>
                        {g.goal && <div style={{ fontSize: 13, color: W.c.dim, marginTop: 6, lineHeight: 1.4 }}>{g.goal}</div>}
                        <div style={{ fontFamily: W.font.mono, fontSize: 11, color: W.c.mute, marginTop: 8 }}>
                          {(g.memberIds || []).length} {lang === 'es' ? 'atletas' : 'athletes'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <Btn ghost sm onClick={() => navigate(`/coach/planner/new?assignee=group&groupId=${g.id}`)}>
                          {lang === 'es' ? 'Planificar' : 'Program'}
                        </Btn>
                        <Btn ghost sm onClick={() => startEditGroup(g)}>{lang === 'es' ? 'Editar' : 'Edit'}</Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingGroupId && (
            <div style={{ width: 380, borderLeft: `1px solid ${W.c.lineDim}`, padding: 24, overflow: 'auto', flexShrink: 0, background: W.c.bg2 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: W.c.text }}>
                {editingGroupId === 'new' ? (lang === 'es' ? 'Nuevo grupo' : 'New group') : (lang === 'es' ? 'Editar grupo' : 'Edit group')}
              </div>
              <form onSubmit={handleGroupSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={groupLabel}>{lang === 'es' ? 'NOMBRE' : 'NAME'}</label>
                  <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={lang === 'es' ? 'Competidores' : 'Competitors'} required style={groupInp} />
                </div>
                <div>
                  <label style={groupLabel}>{lang === 'es' ? 'OBJETIVO' : 'GOAL'}</label>
                  <textarea value={groupForm.goal} onChange={e => setGroupForm(f => ({ ...f, goal: e.target.value }))}
                    rows={3} placeholder={lang === 'es' ? 'ej. Prep torneo, hipertrofia…' : 'e.g. Meet prep, hypertrophy…'}
                    style={{ ...groupInp, resize: 'vertical', lineHeight: 1.5 }} />
                </div>
                <div>
                  <label style={groupLabel}>{lang === 'es' ? 'ATLETAS EN EL GRUPO' : 'ATHLETES IN GROUP'}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflow: 'auto' }}>
                    {athletes.map((a, i) => {
                      const checked = groupForm.memberIds.includes(a.id)
                      const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
                      return (
                        <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, ...segmentButtonStyle(checked), cursor: 'pointer' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleGroupMember(a.id)} />
                          <Avatar name={initials} size={28} tone={['lime', 'orange', 'blue', 'violet'][i % 4]} />
                          <span style={{ fontSize: 13, fontWeight: checked ? 600 : 500 }}>{a.name || a.email}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                {groupError && <div style={{ fontSize: 12, color: W.c.red, fontFamily: W.font.mono }}>{groupError}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Btn primary disabled={groupBusy} type="submit">{groupBusy ? '…' : (lang === 'es' ? 'Guardar' : 'Save')}</Btn>
                  <Btn ghost type="button" onClick={() => { setEditingGroupId(null); setGroupForm(emptyGroupForm()) }}>
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </Btn>
                  {editingGroupId !== 'new' && (
                    <Btn ghost type="button" style={{ color: W.c.orange }} onClick={() => handleGroupDelete(editingGroupId)}>
                      {lang === 'es' ? 'Eliminar' : 'Delete'}
                    </Btn>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── Library tab ──────────────────────────────────────── */}
      {tab === 'library' && (
        <div style={{ padding: '20px 32px 32px', flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 220, maxWidth: 360, background: W.c.card, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: W.c.mute }}>⌕</span>
              <input value={libSearch} onChange={e => setLibSearch(e.target.value)}
                placeholder={lang === 'es' ? 'Buscar bloque…' : 'Search block…'}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: W.c.text, fontFamily: W.font.sans, fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {libTypes.map(tp => (
                <button key={tp} type="button" onClick={() => setLibFilter(tp)} style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: libFilter === tp ? W.c.cardHi : W.c.card,
                  color: libFilter === tp ? W.c.text : W.c.dim,
                  fontFamily: W.font.mono, fontSize: 11, fontWeight: 600,
                }}>
                  {tp === 'all' ? (lang === 'es' ? 'TODOS' : 'ALL') : tp}
                </button>
              ))}
            </div>
          </div>

          {libLoading ? (
            <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>{lang === 'es' ? 'CARGANDO…' : 'LOADING…'}</div>
          ) : (
            <>
              {libBlocks[0]?.isDefault && (
                <div style={{ background: W.c.card, borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <p style={{ flex: 1, margin: 0, fontSize: 13, color: W.c.dim, lineHeight: 1.5 }}>
                    {lang === 'es'
                      ? 'Estás viendo plantillas de ejemplo. Guardalas en tu cuenta para editarlas y sumar más.'
                      : 'You are viewing sample templates. Save them to your account to edit and add more.'}
                  </p>
                  <Btn primary sm onClick={persistLibDefaults}>{lang === 'es' ? 'Guardar en mi biblioteca' : 'Save to my library'}</Btn>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {libShown.map(block => (
                  <div key={block.id} style={{ background: W.c.card, borderRadius: 12, padding: 18, borderLeft: `4px solid ${W.c[block.color] || W.c.lime}` }}>
                    <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.6 }}>{block.type} · {block.duration} MIN</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>{block.name}</div>
                    {block.description && (
                      <pre style={{ fontSize: 12, color: W.c.dim, marginTop: 10, whiteSpace: 'pre-wrap', fontFamily: W.font.mono, lineHeight: 1.45, marginBottom: 0 }}>
                        {block.description}
                      </pre>
                    )}
                    <div style={{ marginTop: 14 }}>
                      <Btn ghost sm onClick={() => {
                        const today = new Date().toISOString().slice(0, 10)
                        navigate(`/coach/planner/new?date=${today}&title=${encodeURIComponent(block.name)}&type=${encodeURIComponent(block.type === 'STR' ? 'Strength' : block.type === 'METCON' ? 'AMRAP' : 'Other')}`)
                      }}>
                        {lang === 'es' ? 'Usar en WOD' : 'Use in WOD'} →
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
              {libShown.length === 0 && (
                <div style={{ textAlign: 'center', padding: 48, color: W.c.mute }}>
                  {lang === 'es' ? 'No hay bloques con ese filtro.' : 'No blocks match that filter.'}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </DesktopChrome>
  )
}
