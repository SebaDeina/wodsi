import { useRef, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useCoachBilling } from '../../hooks/useCoachBilling'
import { hasWhatsAppPhone } from '../../lib/phone'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n'
import {
  billingMonthKey,
  clampPlanDueDay,
  dueDateKeyForMonth,
  formatBillingMonth,
  formatDateKey,
  isPaidForBillingMonth,
  isPaymentPendingThisMonth,
  membershipStatusFromAthlete,
  paymentPatchForCurrentMonth,
  clearCurrentMonthPaymentPatch,
  planDueDayLabel,
} from '../../lib/membership'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { Avatar } from '../../components/Avatar'
import { Tag } from '../../components/Tag'
import { CoachHeader } from './CoachHeader'

function prevBillingMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}
function nextBillingMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

const TONES = ['lime', 'orange', 'blue', 'violet']

const GRID = '2fr 0.9fr 0.65fr 1.35fr 0.85fr 1fr 0.55fr'

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

const paymentPillBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 999,
  fontFamily: W.font.mono,
  fontSize: 10,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const paymentActionBtn = {
  appearance: 'none',
  padding: '6px 10px',
  borderRadius: 7,
  border: `1px solid ${W.c.lineDim}`,
  background: W.c.cardHi,
  color: W.c.text,
  cursor: 'pointer',
  fontFamily: W.font.sans,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

export default function CoachAtletas() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { athletes, loading, counts, reload, optimisticPatch } = useCoachAthletes()
  const { billing, loading: billingLoading } = useCoachBilling()
  const { groupsForAthlete } = useCoachGroups()
  const isMobile = useIsMobile(1024)
  const [tab, setTab] = useState(searchParams.get('tab') === 'billing' ? 'billing' : 'athletes')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [dueDayDrafts, setDueDayDrafts] = useState({})
  const skipDueDayCommitRef = useRef(null)
  const currentMonth = billingMonthKey()

  // Billing tab state
  const [billingMonth, setBillingMonth] = useState(currentMonth)
  const [billingFilter, setBillingFilter] = useState('all')
  const isCurrentBillingMonth = billingMonth === currentMonth
  const billingAmount = parseFloat(billing?.membershipAmount) || 0

  const billingRows = useMemo(() => {
    return athletes
      .filter(a => {
        const status = membershipStatusFromAthlete(a)
        if (billingFilter === 'paid') return isPaidForBillingMonth(a.paidForMonth, billingMonth)
        if (billingFilter === 'unpaid') return !isPaidForBillingMonth(a.paidForMonth, billingMonth) && status !== 'paused'
        if (billingFilter === 'paused') return (a.status || 'active') === 'paused'
        return true
      })
      .sort((a, b) => {
        const pA = isPaidForBillingMonth(a.paidForMonth, billingMonth)
        const pB = isPaidForBillingMonth(b.paidForMonth, billingMonth)
        if (pA !== pB) return pA ? 1 : -1
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [athletes, billingMonth, billingFilter])

  const billingStats = useMemo(() => {
    const onBilling = athletes.filter(a => a.planDueDay != null)
    const paid = onBilling.filter(a => isPaidForBillingMonth(a.paidForMonth, billingMonth))
    const unpaid = onBilling.filter(a => !isPaidForBillingMonth(a.paidForMonth, billingMonth) && (a.status || 'active') !== 'paused')
    return {
      onBilling: onBilling.length,
      paid: paid.length,
      unpaid: unpaid.length,
      collected: paid.length * billingAmount,
      pending: unpaid.length * billingAmount,
    }
  }, [athletes, billingMonth, billingAmount])

  async function toggleBillingPaid(athlete) {
    setSavingId(athlete.id)
    const day = clampPlanDueDay(athlete.planDueDay ?? 1)
    const paid = isPaidForBillingMonth(athlete.paidForMonth, billingMonth)
    const patch = paid ? clearCurrentMonthPaymentPatch(day) : paymentPatchForCurrentMonth(day)
    optimisticPatch(athlete.id, patch)
    try {
      const next = { ...athlete, ...patch }
      await updateDoc(doc(db, 'users', athlete.id), { ...patch, status: membershipStatusFromAthlete(next) })
    } catch {
      await reload()
    } finally {
      setSavingId(null)
    }
  }

  async function patchAthlete(athlete, patch) {
    setSavingId(athlete.id)
    const next = { ...athlete, ...patch }
    const status = membershipStatusFromAthlete(next)
    optimisticPatch(athlete.id, patch)
    try {
      await updateDoc(doc(db, 'users', athlete.id), { ...patch, status })
    } catch {
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
    if (skipDueDayCommitRef.current === athlete.id) {
      skipDueDayCommitRef.current = null
      return
    }

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

  const BILLING_FILTERS = [
    { key: 'all',    label: lang === 'es' ? 'Todos' : 'All' },
    { key: 'unpaid', label: lang === 'es' ? 'Sin pagar' : 'Unpaid' },
    { key: 'paid',   label: lang === 'es' ? 'Pagaron' : 'Paid' },
    { key: 'paused', label: lang === 'es' ? 'Pausados' : 'Paused' },
  ]

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={tab === 'athletes' ? t('athletes_nav', lang) : (lang === 'es' ? 'Cobros' : 'Billing')}
        subtitle={tab === 'athletes'
          ? `${athletes.length} total · ${counts.active || 0} ${lang === 'es' ? 'activos' : 'active'} · ${counts.paused || 0} ${lang === 'es' ? 'pausados' : 'paused'} · ${counts.overdue || 0} ${lang === 'es' ? 'vencidos' : 'overdue'}`
          : formatBillingMonth(billingMonth, lang)}
        right={(
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {tab === 'athletes' && (
              <Btn primary sm onClick={() => navigate('/coach/athletes/new')}>
                + {lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
              </Btn>
            )}
            {tab === 'billing' && (
              <Btn ghost sm onClick={() => navigate('/settings')}>
                {lang === 'es' ? 'Configurar cobros' : 'Configure billing'} →
              </Btn>
            )}
          </div>
        )}
      />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 32px 0', borderBottom: `1px solid ${W.c.lineDim}`, flexShrink: 0 }}>
        {[
          { key: 'athletes', label: lang === 'es' ? 'Atletas' : 'Athletes' },
          { key: 'billing',  label: lang === 'es' ? 'Cobros' : 'Billing' },
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

      {/* ── Athletes tab ────────────────────────────────────── */}
      {tab === 'athletes' && (
        <>
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
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: W.c.text }}>
                  {lang === 'es' ? 'No hay atletas todavía' : 'No athletes yet'}
                </div>
                <Btn primary onClick={() => navigate('/coach/athletes/new')}>
                  {lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
                </Btn>
              </div>
            ) : isMobile ? (
              /* Mobile: card list */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingBottom: 20 }}>
                {displayed.map((a, i) => {
                  const status = membershipStatusFromAthlete(a)
                  const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
                  const athleteGroups = groupsForAthlete(a.id)
                  const busy = savingId === a.id
                  const paid = isPaidForBillingMonth(a.paidForMonth, currentMonth)
                  const pending = isPaymentPendingThisMonth(a)

                  return (
                    <div key={a.id} style={{
                      padding: '14px 16px', background: i % 2 ? 'transparent' : `${W.c.cardHi}40`,
                      borderBottom: `1px solid ${W.c.lineDim}`, opacity: busy ? 0.65 : 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={initials} size={36} tone={TONES[i % TONES.length]} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {a.name || '—'}
                            {hasWhatsAppPhone(a)
                              ? <span style={{ fontSize: 11, color: '#25D366' }}>◉</span>
                              : <span style={{ fontSize: 9, color: W.c.orange, fontFamily: W.font.mono }}>WA?</span>}
                          </div>
                          <div style={{ fontSize: 11, color: W.c.mute, marginTop: 2 }}>{a.email}</div>
                          {athleteGroups.length > 0 && (
                            <div style={{ fontSize: 11, color: W.c.lime, marginTop: 2 }}>{athleteGroups.map(g => g.name).join(', ')}</div>
                          )}
                        </div>
                        <Btn ghost sm disabled={busy} onClick={() => navigate(`/coach/athletes/${a.id}`)}>→</Btn>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <span style={{
                          ...paymentPillBase,
                          background: paid ? `${W.c.lime}18` : pending ? `${W.c.orange}14` : `${W.c.red}14`,
                          color: paid ? W.c.lime : pending ? W.c.orange : W.c.red,
                          border: `1px solid ${paid ? `${W.c.lime}40` : pending ? `${W.c.orange}40` : `${W.c.red}40`}`,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: 3, background: 'currentColor' }} />
                          {paid ? (lang === 'es' ? 'Pagado' : 'Paid') : pending ? (lang === 'es' ? 'Pendiente' : 'Pending') : (lang === 'es' ? 'Vencido' : 'Overdue')}
                        </span>
                        <button
                          type="button" disabled={busy}
                          onClick={() => togglePaidThisMonth(a)}
                          style={{ ...paymentActionBtn, cursor: busy ? 'wait' : 'pointer', color: paid ? W.c.orange : W.c.text, fontSize: 11 }}
                        >
                          {paid ? (lang === 'es' ? 'Desmarcar' : 'Unmark') : (lang === 'es' ? 'Registrar pago' : 'Mark paid')}
                        </button>
                        <span style={{ fontFamily: W.font.mono, fontSize: 10, color: status === 'overdue' ? W.c.orange : W.c.dim, marginLeft: 'auto' }}>
                          {t(status, lang).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Desktop: table */
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
                          type="number" min={1} max={31} inputMode="numeric"
                          value={dueDayValueFor(a)} disabled={busy}
                          onClick={e => e.stopPropagation()}
                          onFocus={() => setDueDayDrafts(prev => ({ ...prev, [a.id]: String(planDay) }))}
                          onChange={e => setDueDayDraft(a.id, e.target.value)}
                          onBlur={() => commitDueDay(a)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.currentTarget.blur() }
                            if (e.key === 'Escape') {
                              skipDueDayCommitRef.current = a.id
                              clearDueDayDraft(a.id)
                              e.currentTarget.blur()
                            }
                          }}
                          style={dayInp}
                          title={lang === 'es' ? 'Editá el día y presioná Enter o salí del campo para guardar' : 'Edit the day and press Enter or leave the field to save'}
                        />
                      </span>
                      <span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            ...paymentPillBase,
                            background: paid ? `${W.c.lime}18` : pending ? `${W.c.orange}14` : `${W.c.red}14`,
                            color: paid ? W.c.lime : pending ? W.c.orange : W.c.red,
                            border: `1px solid ${paid ? `${W.c.lime}40` : pending ? `${W.c.orange}40` : `${W.c.red}40`}`,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'currentColor' }} />
                            {paid ? (lang === 'es' ? 'Pagado' : 'Paid') : pending ? (lang === 'es' ? 'Pendiente' : 'Pending') : (lang === 'es' ? 'Vencido' : 'Overdue')}
                          </span>
                          <button
                            type="button" disabled={busy}
                            onClick={e => { e.stopPropagation(); togglePaidThisMonth(a) }}
                            style={{ ...paymentActionBtn, cursor: busy ? 'wait' : 'pointer', color: paid ? W.c.orange : W.c.text }}
                          >
                            {paid ? (lang === 'es' ? 'Desmarcar pago' : 'Mark unpaid') : (lang === 'es' ? 'Registrar pago' : 'Mark paid')}
                          </button>
                        </div>
                      </span>
                      <span style={{ fontFamily: W.font.mono, fontSize: 11, color: status === 'overdue' ? W.c.orange : W.c.dim }}>
                        {t(status, lang).toUpperCase()}
                      </span>
                      <span style={{ color: W.c.dim, fontSize: 11, wordBreak: 'break-all' }}>{a.email}</span>
                      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Btn ghost sm disabled={busy} onClick={() => navigate(`/coach/athletes/${a.id}`)}>→</Btn>
                      </span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </>
      )}

      {/* ── Billing tab ─────────────────────────────────────── */}
      {tab === 'billing' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px 100px' : '24px 32px', display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setBillingMonth(prevBillingMonth(billingMonth))}
              style={{ background: W.c.card, border: `1px solid ${W.c.lineDim}`, color: W.c.text, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontFamily: W.font.sans }}
            >←</button>
            <div style={{ fontFamily: W.font.display, fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: W.c.text, minWidth: 160, textAlign: 'center' }}>
              {formatBillingMonth(billingMonth, lang)}
            </div>
            <button
              onClick={() => setBillingMonth(nextBillingMonth(billingMonth))}
              disabled={isCurrentBillingMonth}
              style={{
                background: W.c.card, border: `1px solid ${W.c.lineDim}`,
                color: isCurrentBillingMonth ? W.c.mute : W.c.text,
                borderRadius: 8, padding: '6px 14px', cursor: isCurrentBillingMonth ? 'default' : 'pointer',
                fontSize: 13, fontFamily: W.font.sans,
              }}
            >→</button>
            {!isCurrentBillingMonth && (
              <button
                onClick={() => setBillingMonth(currentMonth)}
                style={{ background: 'none', border: 'none', color: W.c.lime, cursor: 'pointer', fontSize: 12, fontFamily: W.font.mono, letterSpacing: 0.5 }}
              >
                {lang === 'es' ? 'MES ACTUAL' : 'CURRENT MONTH'}
              </button>
            )}
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
            {[
              {
                label: lang === 'es' ? 'En plan de cobro' : 'On billing plan',
                val: loading ? '…' : String(billingStats.onBilling),
                delta: `${athletes.length} ${lang === 'es' ? 'total' : 'total'}`,
                neg: false,
              },
              {
                label: lang === 'es' ? 'Pagaron' : 'Paid',
                val: loading ? '…' : String(billingStats.paid),
                delta: billingStats.onBilling ? `${Math.round(billingStats.paid / billingStats.onBilling * 100)}%` : '—',
                neg: false,
              },
              {
                label: lang === 'es' ? 'Recaudado' : 'Collected',
                val: loading ? '…' : billingAmount ? `$${billingStats.collected.toLocaleString('es-AR')}` : '—',
                delta: billingAmount ? `${billingStats.paid} × $${billingAmount.toLocaleString('es-AR')}` : (lang === 'es' ? 'Configurá el monto' : 'Set the amount'),
                neg: false,
              },
              {
                label: lang === 'es' ? 'Pendiente' : 'Pending',
                val: loading ? '…' : String(billingStats.unpaid),
                delta: billingAmount && billingStats.unpaid ? `$${billingStats.pending.toLocaleString('es-AR')} sin cobrar` : (lang === 'es' ? 'Todos al día' : 'All up to date'),
                neg: billingStats.unpaid > 0,
              },
            ].map(k => (
              <div key={k.label} style={{ background: W.c.card, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.5, textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, marginTop: 6, fontFamily: W.font.display, color: W.c.text }}>{k.val}</div>
                <div style={{ fontSize: 12, fontFamily: W.font.mono, color: k.neg ? W.c.orange : W.c.lime, marginTop: 2 }}>{k.delta}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {BILLING_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setBillingFilter(f.key)}
                style={{
                  padding: '6px 16px', borderRadius: 999, fontSize: 12,
                  fontFamily: W.font.mono, letterSpacing: 0.4,
                  background: billingFilter === f.key ? W.c.lime : W.c.card,
                  color: billingFilter === f.key ? W.c.bg : W.c.dim,
                  border: 'none', cursor: 'pointer', fontWeight: billingFilter === f.key ? 700 : 500,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Athlete billing list */}
          <div style={{ background: W.c.card, borderRadius: 12, overflow: 'hidden' }}>
            {!isMobile && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 110px 100px 120px',
                padding: '10px 20px', borderBottom: `1px solid ${W.c.lineDim}`,
                fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.8,
              }}>
                <span>{lang === 'es' ? 'ATLETA' : 'ATHLETE'}</span>
                <span>{lang === 'es' ? 'VENCIMIENTO' : 'DUE DATE'}</span>
                <span>{lang === 'es' ? 'MONTO' : 'AMOUNT'}</span>
                <span>{lang === 'es' ? 'ESTADO' : 'STATUS'}</span>
                <span />
              </div>
            )}
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: W.c.mute, fontFamily: W.font.mono }}>…</div>
            ) : billingRows.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: W.c.mute }}>
                {lang === 'es' ? 'No hay atletas en este filtro.' : 'No athletes match this filter.'}
              </div>
            ) : billingRows.map((a, i) => {
              const paid = isPaidForBillingMonth(a.paidForMonth, billingMonth)
              const status = membershipStatusFromAthlete(a)
              const paused = (a.status || 'active') === 'paused'
              const hasBilling = a.planDueDay != null
              const planDay = clampPlanDueDay(a.planDueDay ?? 1)
              const dueKey = dueDateKeyForMonth(billingMonth, planDay)
              const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
              const busy = savingId === a.id

              if (isMobile) {
                return (
                  <div key={a.id} style={{ padding: '14px 16px', borderTop: i ? `1px solid ${W.c.lineDim}` : 'none', background: paid ? `${W.c.lime}06` : 'transparent', opacity: busy ? 0.65 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={initials} size={32} tone={paid ? 'lime' : status === 'overdue' ? 'orange' : 'mute'} />
                      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/coach/athletes/${a.id}`)}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name || a.email}</div>
                        <div style={{ fontSize: 11, color: W.c.mute, marginTop: 2 }}>
                          {hasBilling ? (dueKey ? formatDateKey(dueKey, lang) : planDueDayLabel(planDay, lang)) : '—'}
                          {billingAmount ? ` · $${billingAmount.toLocaleString('es-AR')}` : ''}
                        </div>
                      </div>
                      {paused ? <Tag tone="mute" sm>{lang === 'es' ? 'Pausado' : 'Paused'}</Tag>
                        : !hasBilling ? <Tag tone="mute" sm>{lang === 'es' ? 'Sin cobro' : 'No billing'}</Tag>
                        : paid ? <Tag tone="lime" sm>{lang === 'es' ? 'Pagó' : 'Paid'}</Tag>
                        : <Tag tone="orange" sm>{lang === 'es' ? 'Debe' : 'Owes'}</Tag>}
                      {!paused && hasBilling && isCurrentBillingMonth && (
                        <Btn ghost sm disabled={busy} onClick={() => toggleBillingPaid(a)} style={paid ? { color: W.c.mute } : { color: W.c.lime, borderColor: W.c.lime }}>
                          {busy ? '…' : paid ? (lang === 'es' ? 'Desmarcar' : 'Unmark') : '✓'}
                        </Btn>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={a.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 140px 110px 100px 120px',
                    padding: '14px 20px', borderTop: i ? `1px solid ${W.c.lineDim}` : 'none',
                    alignItems: 'center', background: paid ? `${W.c.lime}06` : 'transparent',
                    opacity: busy ? 0.65 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate(`/coach/athletes/${a.id}`)}>
                    <Avatar name={initials} size={30} tone={paid ? 'lime' : status === 'overdue' ? 'orange' : 'mute'} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: W.c.text }}>{a.name || a.email}</div>
                      {a.email && a.name && <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono }}>{a.email}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: W.c.dim, fontFamily: W.font.mono }}>
                    {hasBilling ? (dueKey ? formatDateKey(dueKey, lang) : planDueDayLabel(planDay, lang)) : '—'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: W.c.text }}>
                    {billingAmount ? `$${billingAmount.toLocaleString('es-AR')}` : '—'}
                  </div>
                  <div>
                    {paused ? <Tag tone="mute" sm>{lang === 'es' ? 'Pausado' : 'Paused'}</Tag>
                      : !hasBilling ? <Tag tone="mute" sm>{lang === 'es' ? 'Sin cobro' : 'No billing'}</Tag>
                      : paid ? <Tag tone="lime" sm>{lang === 'es' ? 'Pagó' : 'Paid'}</Tag>
                      : <Tag tone="orange" sm>{lang === 'es' ? 'Debe' : 'Owes'}</Tag>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {!paused && hasBilling && isCurrentBillingMonth && (
                      <Btn ghost sm disabled={busy} onClick={() => toggleBillingPaid(a)} style={paid ? { color: W.c.mute } : { color: W.c.lime, borderColor: W.c.lime }}>
                        {busy ? '…' : paid ? (lang === 'es' ? 'Desmarcar' : 'Unmark') : (lang === 'es' ? '✓ Marcar pagado' : '✓ Mark paid')}
                      </Btn>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {!billingAmount && !billingLoading && (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: W.c.dim }}>
                {lang === 'es' ? 'No configuraste el monto de la cuota. ' : "You haven't configured the membership amount. "}
              </span>
              <span
                onClick={() => navigate('/settings')}
                style={{ fontSize: 13, color: W.c.lime, cursor: 'pointer', fontWeight: 600 }}
              >
                {lang === 'es' ? 'Configurar en Ajustes →' : 'Set up in Settings →'}
              </span>
            </div>
          )}
        </div>
      )}
    </DesktopChrome>
  )
}
