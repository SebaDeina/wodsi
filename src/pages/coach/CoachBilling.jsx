import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useCoachBilling } from '../../hooks/useCoachBilling'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n'
import {
  billingMonthKey,
  clampPlanDueDay,
  dueDateKeyForMonth,
  formatBillingMonth,
  formatDateKey,
  isPaidForBillingMonth,
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

function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}
function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

const STATUS_COLOR = { active: W.c.lime, overdue: W.c.orange, paused: W.c.mute, new: W.c.blue }

export default function CoachBilling() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { athletes, loading: athletesLoading, reload, optimisticPatch } = useCoachAthletes()
  const { billing, loading: billingLoading } = useCoachBilling()
  const [selectedMonth, setSelectedMonth] = useState(billingMonthKey())
  const [savingId, setSavingId] = useState(null)
  const [filter, setFilter] = useState('all')

  const currentMonth = billingMonthKey()
  const isCurrentMonth = selectedMonth === currentMonth

  const amount = parseFloat(billing?.membershipAmount) || 0
  const alias = billing?.paymentAlias || ''

  const rows = useMemo(() => {
    return athletes
      .filter(a => {
        const status = membershipStatusFromAthlete(a)
        if (filter === 'paid') return isPaidForBillingMonth(a.paidForMonth, selectedMonth)
        if (filter === 'unpaid') return !isPaidForBillingMonth(a.paidForMonth, selectedMonth) && status !== 'paused'
        if (filter === 'paused') return (a.status || 'active') === 'paused'
        return true
      })
      .sort((a, b) => {
        const pA = isPaidForBillingMonth(a.paidForMonth, selectedMonth)
        const pB = isPaidForBillingMonth(b.paidForMonth, selectedMonth)
        if (pA !== pB) return pA ? 1 : -1
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [athletes, selectedMonth, filter])

  const stats = useMemo(() => {
    const onBilling = athletes.filter(a => a.planDueDay != null)
    const paid = onBilling.filter(a => isPaidForBillingMonth(a.paidForMonth, selectedMonth))
    const unpaid = onBilling.filter(a => !isPaidForBillingMonth(a.paidForMonth, selectedMonth) && (a.status || 'active') !== 'paused')
    const collected = paid.length * amount
    const pending = unpaid.length * amount
    return { onBilling: onBilling.length, paid: paid.length, unpaid: unpaid.length, collected, pending }
  }, [athletes, selectedMonth, amount])

  async function togglePaid(athlete) {
    setSavingId(athlete.id)
    const day = clampPlanDueDay(athlete.planDueDay ?? 1)
    const paid = isPaidForBillingMonth(athlete.paidForMonth, selectedMonth)
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

  const loading = athletesLoading || billingLoading

  const FILTERS = [
    { key: 'all', label: lang === 'es' ? 'Todos' : 'All' },
    { key: 'unpaid', label: lang === 'es' ? 'Sin pagar' : 'Unpaid' },
    { key: 'paid', label: lang === 'es' ? 'Pagaron' : 'Paid' },
    { key: 'paused', label: lang === 'es' ? 'Pausados' : 'Paused' },
  ]

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={t('billing', lang)}
        subtitle={formatBillingMonth(selectedMonth, lang)}
        right={
          <Btn ghost sm onClick={() => navigate('/settings')}>
            {lang === 'es' ? 'Configurar cobros' : 'Configure billing'} →
          </Btn>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Month navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
            style={{ background: W.c.card, border: `1px solid ${W.c.lineDim}`, color: W.c.text, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontFamily: W.font.sans }}
          >
            ←
          </button>
          <div style={{ fontFamily: W.font.display, fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: W.c.text, minWidth: 160, textAlign: 'center' }}>
            {formatBillingMonth(selectedMonth, lang)}
          </div>
          <button
            onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
            disabled={isCurrentMonth}
            style={{
              background: W.c.card, border: `1px solid ${W.c.lineDim}`,
              color: isCurrentMonth ? W.c.mute : W.c.text,
              borderRadius: 8, padding: '6px 14px', cursor: isCurrentMonth ? 'default' : 'pointer',
              fontSize: 13, fontFamily: W.font.sans,
            }}
          >
            →
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setSelectedMonth(currentMonth)}
              style={{ background: 'none', border: 'none', color: W.c.lime, cursor: 'pointer', fontSize: 12, fontFamily: W.font.mono, letterSpacing: 0.5 }}
            >
              {lang === 'es' ? 'MES ACTUAL' : 'CURRENT MONTH'}
            </button>
          )}
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            {
              label: lang === 'es' ? 'En plan de cobro' : 'On billing plan',
              val: loading ? '…' : String(stats.onBilling),
              delta: `${athletes.length} ${lang === 'es' ? 'total' : 'total'}`,
              tone: 'lime',
            },
            {
              label: lang === 'es' ? 'Pagaron' : 'Paid',
              val: loading ? '…' : String(stats.paid),
              delta: stats.onBilling ? `${Math.round(stats.paid / stats.onBilling * 100)}%` : '—',
              tone: 'lime',
            },
            {
              label: lang === 'es' ? 'Recaudado' : 'Collected',
              val: loading ? '…' : amount ? `$${stats.collected.toLocaleString('es-AR')}` : '—',
              delta: amount ? `${stats.paid} × $${amount.toLocaleString('es-AR')}` : (lang === 'es' ? 'Configurá el monto' : 'Set the amount'),
              tone: 'lime',
            },
            {
              label: lang === 'es' ? 'Pendiente' : 'Pending',
              val: loading ? '…' : (stats.unpaid > 0 ? String(stats.unpaid) : '0'),
              delta: amount && stats.unpaid ? `$${stats.pending.toLocaleString('es-AR')} sin cobrar` : (lang === 'es' ? 'Todos al día' : 'All up to date'),
              tone: stats.unpaid > 0 ? 'orange' : 'lime',
              negative: stats.unpaid > 0,
            },
          ].map(k => (
            <div key={k.label} style={{ background: W.c.card, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.5, textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, marginTop: 6, fontFamily: W.font.display, color: W.c.text }}>{k.val}</div>
              <div style={{ fontSize: 12, fontFamily: W.font.mono, color: k.negative ? W.c.orange : W.c[k.tone] || W.c.mute, marginTop: 2 }}>{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 12,
                fontFamily: W.font.mono, letterSpacing: 0.4,
                background: filter === f.key ? W.c.lime : W.c.card,
                color: filter === f.key ? W.c.bg : W.c.dim,
                border: 'none', cursor: 'pointer', fontWeight: filter === f.key ? 700 : 500,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Athlete list */}
        <div style={{ background: W.c.card, borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 110px 100px 120px',
            padding: '10px 20px',
            borderBottom: `1px solid ${W.c.lineDim}`,
            fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.8,
          }}>
            <span>{lang === 'es' ? 'ATLETA' : 'ATHLETE'}</span>
            <span>{lang === 'es' ? 'VENCIMIENTO' : 'DUE DATE'}</span>
            <span>{lang === 'es' ? 'MONTO' : 'AMOUNT'}</span>
            <span>{lang === 'es' ? 'ESTADO' : 'STATUS'}</span>
            <span />
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: W.c.mute, fontFamily: W.font.mono }}>…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: W.c.mute }}>
              {lang === 'es' ? 'No hay atletas en este filtro.' : 'No athletes match this filter.'}
            </div>
          ) : rows.map((a, i) => {
            const paid = isPaidForBillingMonth(a.paidForMonth, selectedMonth)
            const status = membershipStatusFromAthlete(a)
            const paused = (a.status || 'active') === 'paused'
            const hasBilling = a.planDueDay != null
            const planDay = clampPlanDueDay(a.planDueDay ?? 1)
            const dueKey = dueDateKeyForMonth(selectedMonth, planDay)
            const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div
                key={a.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 110px 100px 120px',
                  padding: '14px 20px',
                  borderTop: i ? `1px solid ${W.c.lineDim}` : 'none',
                  alignItems: 'center',
                  background: paid ? `${W.c.lime}06` : 'transparent',
                }}
              >
                {/* Name */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  onClick={() => navigate(`/coach/athletes/${a.id}`)}
                >
                  <Avatar name={initials} size={30} tone={paid ? 'lime' : status === 'overdue' ? 'orange' : 'mute'} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: W.c.text }}>{a.name || a.email}</div>
                    {a.email && a.name && (
                      <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono }}>{a.email}</div>
                    )}
                  </div>
                </div>

                {/* Due date */}
                <div style={{ fontSize: 12, color: W.c.dim, fontFamily: W.font.mono }}>
                  {hasBilling
                    ? (dueKey ? formatDateKey(dueKey, lang) : planDueDayLabel(planDay, lang))
                    : '—'}
                </div>

                {/* Amount */}
                <div style={{ fontSize: 13, fontWeight: 600, color: W.c.text }}>
                  {amount ? `$${amount.toLocaleString('es-AR')}` : '—'}
                </div>

                {/* Status */}
                <div>
                  {paused ? (
                    <Tag tone="mute" sm>{lang === 'es' ? 'Pausado' : 'Paused'}</Tag>
                  ) : !hasBilling ? (
                    <Tag tone="mute" sm>{lang === 'es' ? 'Sin cobro' : 'No billing'}</Tag>
                  ) : paid ? (
                    <Tag tone="lime" sm>{lang === 'es' ? 'Pagó' : 'Paid'}</Tag>
                  ) : (
                    <Tag tone="orange" sm>{lang === 'es' ? 'Debe' : 'Owes'}</Tag>
                  )}
                </div>

                {/* Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {!paused && hasBilling && isCurrentMonth && (
                    <Btn
                      ghost
                      sm
                      disabled={savingId === a.id}
                      onClick={() => togglePaid(a)}
                      style={paid ? { color: W.c.mute } : { color: W.c.lime, borderColor: W.c.lime }}
                    >
                      {savingId === a.id ? '…' : paid
                        ? (lang === 'es' ? 'Desmarcar' : 'Unmark')
                        : (lang === 'es' ? '✓ Marcar pagado' : '✓ Mark paid')}
                    </Btn>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        {alias && (
          <div style={{ fontSize: 12, color: W.c.mute, fontFamily: W.font.mono, textAlign: 'center', letterSpacing: 0.3 }}>
            {lang === 'es' ? `Alias de cobro: ${alias}` : `Payment alias: ${alias}`}
          </div>
        )}
        {!amount && !billingLoading && (
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
    </DesktopChrome>
  )
}
