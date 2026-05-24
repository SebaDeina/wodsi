import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { AthleteShell } from '../../components/AthleteShell'
import { EmptyCard } from '../../components/EmptyCard'
import { Btn } from '../../components/Btn'
import { useAthleteWods } from '../../hooks/useAthleteWods'
import { useAthleteSessionLogs } from '../../hooks/useAthleteSessionLogs'
import {
  formatPRValue,
  PR_TYPES,
  PR_UNITS,
  useAthletePRs,
} from '../../hooks/useAthletePRs'
import { addDays, startOfWeek, toDateKey, getISOWeek } from '../../lib/dates'
import { wodTypeLabel } from '../../lib/wodDisplay'
import { todayDateKey } from '../../lib/membership'

const inp = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1px solid ${W.c.lineDim}`,
  background: W.c.card,
  color: W.c.text,
  fontFamily: W.font.sans,
  fontSize: 14,
  boxSizing: 'border-box',
}

export default function AthleteHistory() {
  const { lang } = useLang()
  const { profile } = useAuth()
  const coachId = profile?.coachId
  const [weekStart, setWeekStart] = useState(() => startOfWeek())
  const [showPrForm, setShowPrForm] = useState(false)
  const [prMovement, setPrMovement] = useState('')
  const [prValue, setPrValue] = useState('')
  const [prUnit, setPrUnit] = useState('kg')
  const [prType, setPrType] = useState('1rm')
  const [prBusy, setPrBusy] = useState(false)
  const [prError, setPrError] = useState('')

  const weekEnd = addDays(weekStart, 6)
  const fromKey = toDateKey(weekStart)
  const toKey = toDateKey(weekEnd)

  const { wodsByDate, weekWods, loading: wodsLoading } = useAthleteWods(coachId, weekStart)
  const { isCompleted, toggleCompleted, completedCount, loading: logsLoading } = useAthleteSessionLogs({
    fromKey,
    toKey,
  })
  const { prs, loading: prsLoading, addPR, removePR } = useAthletePRs()

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      const key = toDateKey(date)
      const wods = wodsByDate[key] || []
      const wod = wods[0] || null
      const locale = lang === 'es' ? 'es-AR' : 'en-US'
      return {
        key,
        wod,
        label: date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' }).replace('.', ''),
        hasWod: Boolean(wod),
        done: isCompleted(key),
      }
    })
  }, [weekStart, wodsByDate, isCompleted, lang])

  const scheduledCount = days.filter(d => d.hasWod).length
  const doneScheduled = days.filter(d => d.hasWod && d.done).length
  const adherencePct = scheduledCount
    ? Math.round((doneScheduled / scheduledCount) * 100)
    : null

  async function submitPR(e) {
    e.preventDefault()
    setPrError('')
    setPrBusy(true)
    try {
      await addPR({
        movement: prMovement,
        value: prValue,
        unit: prUnit,
        prType,
        date: todayDateKey(),
      })
      setPrMovement('')
      setPrValue('')
      setShowPrForm(false)
    } catch {
      setPrError(lang === 'es' ? 'Revisá movimiento y peso.' : 'Check movement and value.')
    } finally {
      setPrBusy(false)
    }
  }

  return (
    <AthleteShell lang={lang}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 1 }}>
          {lang === 'es' ? 'TU HISTORIAL' : 'YOUR HISTORY'}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, fontFamily: W.font.display, marginTop: 2 }}>
          {lang === 'es' ? 'Tu progreso' : 'Your progress'}
        </div>
      </div>

      <div style={{ background: W.c.card, borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.6 }}>
            {lang === 'es' ? `SEMANA ${getISOWeek(weekStart)}` : `WEEK ${getISOWeek(weekStart)}`}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} style={weekBtn}>◀</button>
            <button type="button" onClick={() => setWeekStart(startOfWeek())} style={weekBtn}>·</button>
            <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} style={weekBtn}>▶</button>
          </div>
        </div>

        {wodsLoading || logsLoading ? (
          <div style={{ fontFamily: W.font.mono, fontSize: 11, color: W.c.mute }}>…</div>
        ) : scheduledCount === 0 ? (
          <p style={{ fontSize: 13, color: W.c.dim, margin: 0 }}>
            {lang === 'es' ? 'Sin WODs esta semana.' : 'No WODs this week.'}
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {days.map(day => (
                <div
                  key={day.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: W.c.bg2,
                    opacity: day.hasWod ? 1 : 0.45,
                  }}
                >
                  <button
                    type="button"
                    disabled={!day.hasWod}
                    onClick={() => day.hasWod && toggleCompleted(day.key, day.wod)}
                    aria-label={lang === 'es' ? 'Completado' : 'Completed'}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `2px solid ${day.done ? W.c.lime : W.c.lineDim}`,
                      background: day.done ? W.c.lime : 'transparent',
                      color: day.done ? W.c.bg : W.c.mute,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: day.hasWod ? 'pointer' : 'default',
                      flexShrink: 0,
                    }}
                  >
                    {day.done ? '✓' : ''}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{day.label}</div>
                    <div style={{ fontSize: 12, color: W.c.dim, marginTop: 2 }}>
                      {day.hasWod
                        ? (day.wod?.title || wodTypeLabel(day.wod?.type))
                        : (lang === 'es' ? 'Descanso' : 'Rest')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {adherencePct != null && (
              <div style={{ marginTop: 14, fontSize: 13, color: W.c.dim }}>
                {lang === 'es'
                  ? `${doneScheduled}/${scheduledCount} entrenamientos · ${adherencePct}% adherencia`
                  : `${doneScheduled}/${scheduledCount} sessions · ${adherencePct}% adherence`}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{lang === 'es' ? 'Mis PRs' : 'My PRs'}</div>
          <Btn ghost sm onClick={() => setShowPrForm(v => !v)}>
            {showPrForm ? (lang === 'es' ? 'Cerrar' : 'Close') : `+ ${lang === 'es' ? 'Nuevo PR' : 'New PR'}`}
          </Btn>
        </div>

        {showPrForm && (
          <form onSubmit={submitPR} style={{ background: W.c.card, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <input
              placeholder={lang === 'es' ? 'Ej: Back squat, Snatch…' : 'e.g. Back squat, Snatch…'}
              value={prMovement}
              onChange={e => setPrMovement(e.target.value)}
              required
              style={{ ...inp, marginBottom: 10 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder={lang === 'es' ? 'Peso / valor' : 'Weight / value'}
                value={prValue}
                onChange={e => setPrValue(e.target.value)}
                required
                style={inp}
              />
              <select value={prUnit} onChange={e => setPrUnit(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {PR_UNITS.map(u => (
                  <option key={u.id} value={u.id}>{lang === 'es' ? u.labelEs : u.labelEn}</option>
                ))}
              </select>
              <select value={prType} onChange={e => setPrType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {PR_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{lang === 'es' ? t.labelEs : t.labelEn}</option>
                ))}
              </select>
            </div>
            {prError && <div style={{ fontSize: 12, color: W.c.red, marginBottom: 8 }}>{prError}</div>}
            <Btn primary style={{ width: '100%', justifyContent: 'center' }} disabled={prBusy}>
              {prBusy ? '…' : (lang === 'es' ? 'Guardar PR' : 'Save PR')}
            </Btn>
          </form>
        )}

        {prsLoading ? (
          <EmptyCard title={lang === 'es' ? 'Cargando…' : 'Loading…'} />
        ) : prs.length === 0 ? (
          <EmptyCard
            title={lang === 'es' ? 'Sin PRs todavía' : 'No PRs yet'}
            hint={lang === 'es'
              ? 'Registrá tus pesos máximos o mejores marcas acá.'
              : 'Log your max lifts and personal bests here.'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prs.map(pr => (
              <div
                key={pr.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: W.c.card,
                  border: `1px solid ${W.c.lineDim}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{pr.movement}</div>
                  <div style={{ fontFamily: W.font.mono, fontSize: 13, color: W.c.lime, marginTop: 4 }}>
                    {formatPRValue(pr, lang)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePR(pr.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: W.c.mute,
                    fontSize: 18,
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  aria-label={lang === 'es' ? 'Eliminar' : 'Delete'}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {weekWods.length > 0 && completedCount > 0 && (
        <p style={{ fontSize: 12, color: W.c.mute, fontFamily: W.font.mono, textAlign: 'center' }}>
          {lang === 'es'
            ? `${completedCount} día${completedCount === 1 ? '' : 's'} marcado${completedCount === 1 ? '' : 's'} en el rango cargado`
            : `${completedCount} day${completedCount === 1 ? '' : 's'} checked in loaded range`}
        </p>
      )}
    </AthleteShell>
  )
}

const weekBtn = {
  border: 'none',
  background: W.c.bg2,
  color: W.c.text,
  borderRadius: 6,
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12,
}
