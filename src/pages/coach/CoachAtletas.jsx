import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { hasWhatsAppPhone } from '../../lib/phone'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n'
import {
  billingMonthKey,
  clampPlanDueDay,
  formatBillingMonth,
  isPaidForBillingMonth,
  isPaymentPendingThisMonth,
  membershipStatusFromAthlete,
  paymentPatchForCurrentMonth,
  clearCurrentMonthPaymentPatch,
} from '../../lib/membership'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { Avatar } from '../../components/Avatar'
import { CoachHeader } from './CoachHeader'

const TONES = ['lime', 'orange', 'blue', 'violet']

const GRID = '2fr 0.9fr 0.65fr 1.1fr 0.85fr 1fr 0.55fr'

const dayInp = {
  width: 52,
  padding: '6px 8px',
  borderRadius: 6,
  border: `1px solid ${W.c.lineDim}`,
  background: W.c.bg2,
  color: W.c.text,
  fontFamily: W.font.mono,
  fontSize: 13,
  textAlign: 'center',
  boxSizing: 'border-box',
}

export default function CoachAtletas() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { athletes, loading, counts, reload } = useCoachAthletes()
  const { groupsForAthlete } = useCoachGroups()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [dueDayDrafts, setDueDayDrafts] = useState({})
  const currentMonth = billingMonthKey()

  async function patchAthlete(athlete, patch) {
    setSavingId(athlete.id)
    try {
      const next = { ...athlete, ...patch }
      const status = membershipStatusFromAthlete(next)
      await updateDoc(doc(db, 'users', athlete.id), { ...patch, status })
      await reload()
    } finally {
      setSavingId(null)
    }
  }

  async function togglePaidThisMonth(athlete) {
    const day = clampPlanDueDay(athlete.planDueDay ?? 1)
    if (isPaidForBillingMonth(athlete.paidForMonth, currentMonth)) {
      await patchAthlete(athlete, clearCurrentMonthPaymentPatch(day))
    } else {
      await patchAthlete(athlete, paymentPatchForCurrentMonth(day))
    }
  }

  function dueDayValueFor(athlete) {
    return dueDayDrafts[athlete.id] ?? String(clampPlanDueDay(athlete.planDueDay ?? 1))
  }

  function setDueDayDraft(athleteId, value) {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 2)
    setDueDayDrafts(prev => ({ ...prev, [athleteId]: digitsOnly }))
  }

  function clearDueDayDraft(athleteId) {
    setDueDayDrafts(prev => {
      const next = { ...prev }
      delete next[athleteId]
      return next
    })
  }

  async function commitDueDay(athlete) {
    const draft = dueDayDrafts[athlete.id]
    if (draft == null) return

    const currentDay = clampPlanDueDay(athlete.planDueDay ?? 1)
    const nextDay = clampPlanDueDay(draft)
    clearDueDayDraft(athlete.id)

    if (nextDay === currentDay) return
    await patchAthlete(athlete, { planDueDay: nextDay })
  }

  const displayed = athletes.filter(a => {
    const effectiveStatus = membershipStatusFromAthlete(a)
    const matchFilter = filter === 'all' || effectiveStatus === filter || (a.status || 'active') === filter
    const matchSearch = !search
      || (a.name || '').toLowerCase().includes(search.toLowerCase())
      || (a.email || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={t('athletes_nav', lang)}
        subtitle={`${athletes.length} total · ${counts.active || 0} ${lang === 'es' ? 'activos' : 'active'} · ${counts.paused || 0} ${lang === 'es' ? 'pausados' : 'paused'} · ${counts.overdue || 0} ${lang === 'es' ? 'vencidos' : 'overdue'}`}
        right={(
          <Btn primary sm onClick={() => navigate('/coach/athletes/new')}>
            + {lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
          </Btn>
        )}
      />

      <div style={{ padding: '12px 32px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: `1px solid ${W.c.lineDim}`, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 320, background: W.c.card, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: W.c.mute, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search', lang)}
            style={{ background: 'none', border: 'none', outline: 'none', color: W.c.text, fontFamily: W.font.sans, fontSize: 13, flex: 1 }}
          />
        </div>
        <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.5 }}>
          {formatBillingMonth(currentMonth, lang).toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[['all', W.c.lime], ['active', W.c.lime], ['paused', W.c.mute], ['overdue', W.c.orange], ['new', W.c.blue]].map(([k, c]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: filter === k ? W.c.cardHi : 'transparent',
              color: filter === k ? W.c.text : W.c.dim,
              fontFamily: W.font.sans, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', gap: 8, alignItems: 'center',
            }}>
              {k !== 'all' && <span style={{ width: 6, height: 6, borderRadius: 3, background: c }} />}
              {k === 'all' ? (lang === 'es' ? 'Todos' : 'All') : t(k, lang)}
              <span style={{ color: W.c.mute, fontFamily: W.font.mono, fontSize: 11 }}>
                {k === 'all' ? athletes.length : (counts[k] || 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>{lang === 'es' ? 'CARGANDO…' : 'LOADING…'}</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
              {lang === 'es' ? 'No hay atletas todavía' : 'No athletes yet'}
            </div>
            <Btn primary onClick={() => navigate('/coach/athletes/new')}>
              {lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
            </Btn>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: GRID,
              padding: '12px 32px', fontFamily: W.font.mono, fontSize: 10, letterSpacing: 0.8, color: W.c.mute,
              borderBottom: `1px solid ${W.c.lineDim}`, textTransform: 'uppercase', position: 'sticky', top: 0, background: W.c.bg,
              minWidth: 880,
            }}>
              <span>{t('athlete', lang)}</span>
              <span>{lang === 'es' ? 'GRUPO' : 'GROUP'}</span>
              <span>{lang === 'es' ? 'VENCE DÍA' : 'DUE DAY'}</span>
              <span>{lang === 'es' ? 'PAGO MES' : 'THIS MONTH'}</span>
              <span>{lang === 'es' ? 'ESTADO' : 'STATUS'}</span>
              <span>{lang === 'es' ? 'CORREO' : 'EMAIL'}</span>
              <span />
            </div>
            {displayed.map((a, i) => {
              const status = membershipStatusFromAthlete(a)
              const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
              const athleteGroups = groupsForAthlete(a.id)
              const groupLabel = athleteGroups.map(g => g.name).join(', ') || '—'
              const busy = savingId === a.id
              const paid = isPaidForBillingMonth(a.paidForMonth, currentMonth)
              const pending = isPaymentPendingThisMonth(a)
              const planDay = clampPlanDueDay(a.planDueDay ?? 1)

              return (
                <div key={a.id} style={{
                  display: 'grid', gridTemplateColumns: GRID,
                  padding: '14px 32px', alignItems: 'center', fontSize: 13,
                  borderBottom: `1px solid ${W.c.lineDim}`,
                  background: i % 2 ? 'transparent' : `${W.c.cardHi}40`,
                  minWidth: 880,
                  opacity: busy ? 0.65 : 1,
                }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/coach/athletes/${a.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      color: W.c.text, textAlign: 'left', font: 'inherit',
                    }}
                  >
                    <Avatar name={initials} size={32} tone={TONES[i % TONES.length]} />
                    <span>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.name || '—'}
                        {hasWhatsAppPhone(a) ? (
                          <span title="WhatsApp" style={{ fontSize: 12, color: '#25D366' }}>◉</span>
                        ) : (
                          <span title={lang === 'es' ? 'Sin WhatsApp' : 'No WhatsApp'} style={{ fontSize: 10, color: W.c.orange, fontFamily: W.font.mono }}>WA?</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: W.c.mute, fontFamily: W.font.mono, marginTop: 2 }}>
                        {lang === 'es' ? 'Ver ficha →' : 'View profile →'}
                      </div>
                    </span>
                  </button>
                  <span style={{ fontSize: 12, color: athleteGroups.length ? W.c.lime : W.c.mute }}>{groupLabel}</span>
                  <span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      inputMode="numeric"
                      value={dueDayValueFor(a)}
                      disabled={busy}
                      onClick={e => e.stopPropagation()}
                      onFocus={() => setDueDayDrafts(prev => ({ ...prev, [a.id]: String(planDay) }))}
                      onChange={e => setDueDayDraft(a.id, e.target.value)}
                      onBlur={() => commitDueDay(a)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                        if (e.key === 'Escape') {
                          clearDueDayDraft(a.id)
                          e.currentTarget.blur()
                        }
                      }}
                      style={dayInp}
                      title={lang === 'es' ? 'Editá el día y presioná Enter o salí del campo para guardar' : 'Edit the day and press Enter or leave the field to save'}
                    />
                  </span>
                  <span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={e => { e.stopPropagation(); togglePaidThisMonth(a) }}
                      style={{
                        appearance: 'none',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${paid ? `${W.c.lime}55` : pending ? `${W.c.orange}55` : `${W.c.red}55`}`,
                        cursor: busy ? 'wait' : 'pointer',
                        fontFamily: W.font.mono, fontSize: 11, fontWeight: 600, width: '100%',
                        backgroundColor: paid ? `${W.c.lime}22` : pending ? `${W.c.orange}18` : `${W.c.red}18`,
                        color: paid ? W.c.lime : pending ? W.c.orange : W.c.red,
                        boxShadow: `inset 0 0 0 1px ${W.c.bg2}`,
                      }}
                    >
                      {paid
                        ? (lang === 'es' ? '✓ Pagado' : '✓ Paid')
                        : pending
                          ? (lang === 'es' ? 'Pendiente' : 'Pending')
                          : (lang === 'es' ? 'Sin pago' : 'Unpaid')}
                    </button>
                  </span>
                  <span style={{ fontFamily: W.font.mono, fontSize: 11, color: status === 'overdue' ? W.c.orange : W.c.dim }}>
                    {t(status, lang).toUpperCase()}
                  </span>
                  <span style={{ color: W.c.dim, fontSize: 11, wordBreak: 'break-all' }}>{a.email}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Btn ghost sm disabled={busy} onClick={() => navigate(`/coach/athletes/${a.id}`)}>
                      →
                    </Btn>
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </DesktopChrome>
  )
}
