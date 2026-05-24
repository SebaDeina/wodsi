import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { useCoachBilling } from '../../hooks/useCoachBilling'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n'
import { hasWhatsAppPhone } from '../../lib/phone'
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
  todayDateKey,
} from '../../lib/membership'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { Avatar } from '../../components/Avatar'
import { Tag } from '../../components/Tag'
import { CoachHeader } from './CoachHeader'

const card = {
  background: W.c.bg2,
  borderRadius: 14,
  padding: 20,
  border: `1px solid ${W.c.lineDim}`,
  marginBottom: 14,
}

const label = {
  fontFamily: W.font.mono,
  fontSize: 10,
  letterSpacing: 0.8,
  color: W.c.mute,
  marginBottom: 8,
  display: 'block',
}

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

const STATUS_TONE = { active: 'lime', paused: 'mute', overdue: 'orange', new: 'blue' }

export default function CoachAthleteDetail() {
  const { athleteId } = useParams()
  const { lang } = useLang()
  const navigate = useNavigate()
  const { athletes, loading, reload } = useCoachAthletes()
  const { groupsForAthlete } = useCoachGroups()
  const { billing } = useCoachBilling()
  const [saving, setSaving] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')

  const athlete = useMemo(
    () => athletes.find(a => a.id === athleteId),
    [athletes, athleteId],
  )

  const status = athlete ? membershipStatusFromAthlete(athlete) : null
  const month = billingMonthKey()
  const planDay = clampPlanDueDay(athlete?.planDueDay ?? 1)
  const dueThisMonth = dueDateKeyForMonth(month, planDay)
  const paidThisMonth = athlete ? isPaidForBillingMonth(athlete.paidForMonth, month) : false
  const pending = athlete ? isPaymentPendingThisMonth(athlete) : false
  const athleteGroups = athlete ? groupsForAthlete(athlete.id) : []
  const initials = (athlete?.name || athlete?.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

  async function patch(patch) {
    if (!athlete) return
    setSaving(true)
    try {
      const next = { ...athlete, ...patch }
      const statusNext = membershipStatusFromAthlete(next)
      await updateDoc(doc(db, 'users', athlete.id), { ...patch, status: statusNext })
      await reload()
    } finally {
      setSaving(false)
    }
  }

  async function saveNote() {
    await patch({ statusNote: noteDraft.trim() || null })
  }

  if (loading) {
    return (
      <DesktopChrome lang={lang}>
        <div style={{ padding: 32, fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>
          {lang === 'es' ? 'CARGANDO…' : 'LOADING…'}
        </div>
      </DesktopChrome>
    )
  }

  if (!athlete) {
    return (
      <DesktopChrome lang={lang}>
        <CoachHeader
          title={lang === 'es' ? 'Atleta no encontrado' : 'Athlete not found'}
          subtitle=""
        />
        <div style={{ padding: 32 }}>
          <Btn ghost onClick={() => navigate('/coach/athletes')}>
            ← {lang === 'es' ? 'Volver a atletas' : 'Back to athletes'}
          </Btn>
        </div>
      </DesktopChrome>
    )
  }

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={athlete.name || athlete.email}
        subtitle={athlete.email}
        right={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn ghost sm onClick={() => navigate('/coach/athletes')}>
              ← {lang === 'es' ? 'Lista' : 'List'}
            </Btn>
            <Btn ghost sm onClick={() => navigate(`/coach/planner/new?assignee=athlete&athleteId=${athlete.id}`)}>
              {lang === 'es' ? 'Planificar' : 'Program'}
            </Btn>
          </div>
        )}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 32px 40px', maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Avatar name={initials} size={56} tone="lime" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Tag tone={STATUS_TONE[status] || 'mute'}>{t(status, lang).toUpperCase()}</Tag>
              {hasWhatsAppPhone(athlete) ? (
                <span style={{ fontSize: 12, color: '#25D366' }}>WhatsApp ✓</span>
              ) : (
                <span style={{ fontSize: 11, color: W.c.orange, fontFamily: W.font.mono }}>Sin WhatsApp</span>
              )}
            </div>
            {athleteGroups.length > 0 && (
              <div style={{ fontSize: 13, color: W.c.lime, marginTop: 8 }}>
                {athleteGroups.map(g => g.name).join(' · ')}
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <span style={label}>{lang === 'es' ? 'PLAN Y COBRO MENSUAL' : 'MONTHLY PLAN & BILLING'}</span>
          <p style={{ fontSize: 13, color: W.c.dim, margin: '0 0 16px', lineHeight: 1.5 }}>
            {lang === 'es'
              ? 'Definí el día en que vence cada mes. Después marcá si pagó el mes en curso.'
              : 'Set the day the plan renews each month. Then mark whether they paid for the current month.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <span style={{ ...label, marginBottom: 6 }}>{lang === 'es' ? 'DÍA DE VENCIMIENTO' : 'DUE DAY'}</span>
              <input
                type="number"
                min={1}
                max={31}
                value={planDay}
                disabled={saving}
                onChange={e => patch({ planDueDay: clampPlanDueDay(e.target.value) })}
                style={{ ...inp, fontFamily: W.font.mono }}
              />
              <div style={{ fontSize: 11, color: W.c.mute, marginTop: 6 }}>{planDueDayLabel(planDay, lang)}</div>
            </div>
            <div>
              <span style={{ ...label, marginBottom: 6 }}>{lang === 'es' ? 'MONTO (REFERENCIA)' : 'AMOUNT (REFERENCE)'}</span>
              <div style={{ ...inp, background: W.c.bg, color: W.c.dim }}>
                {billing?.membershipAmount || (lang === 'es' ? 'Configurá en Cobros' : 'Set in Billing')}
              </div>
            </div>
          </div>

          <div style={{
            padding: 16,
            borderRadius: 12,
            background: paidThisMonth ? `${W.c.lime}14` : pending ? `${W.c.orange}12` : W.c.card,
            border: `1px solid ${paidThisMonth ? W.c.lime : pending ? W.c.orange : W.c.lineDim}`,
          }}>
            <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.6 }}>
              {formatBillingMonth(month, lang).toUpperCase()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>
              {lang === 'es' ? 'Vence el' : 'Due on'}{' '}
              {dueThisMonth ? formatDateKey(dueThisMonth, lang) : '—'}
            </div>
            <div style={{ fontSize: 13, color: W.c.dim, marginTop: 6 }}>
              {paidThisMonth
                ? (lang === 'es' ? '✓ Pagó este mes' : '✓ Paid this month')
                : pending
                  ? (lang === 'es' ? 'Pendiente de pago (aún no venció)' : 'Payment pending (not due yet)')
                  : (lang === 'es' ? 'No pagó este mes · vencido' : 'Not paid this month · overdue')}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <Btn
                primary
                sm
                disabled={saving || paidThisMonth}
                onClick={() => patch(paymentPatchForCurrentMonth(planDay))}
              >
                {lang === 'es' ? 'Marcar pago del mes' : 'Mark paid this month'}
              </Btn>
              {paidThisMonth && (
                <Btn
                  ghost
                  sm
                  disabled={saving}
                  onClick={() => patch(clearCurrentMonthPaymentPatch(planDay))}
                >
                  {lang === 'es' ? 'Quitar pago del mes' : 'Clear this month'}
                </Btn>
              )}
            </div>
          </div>
        </div>

        <div style={card}>
          <span style={label}>{lang === 'es' ? 'ESTADO MANUAL' : 'MANUAL STATUS'}</span>
          <select
            value={athlete.status || 'active'}
            disabled={saving}
            onChange={e => patch({ status: e.target.value })}
            style={{ ...inp, cursor: 'pointer' }}
          >
            {['active', 'paused', 'overdue', 'new'].map(s => (
              <option key={s} value={s}>{t(s, lang)}</option>
            ))}
          </select>
        </div>

        <div style={card}>
          <span style={label}>{lang === 'es' ? 'NOTAS INTERNAS' : 'INTERNAL NOTES'}</span>
          <textarea
            value={noteDraft || athlete.statusNote || ''}
            onChange={e => setNoteDraft(e.target.value)}
            rows={3}
            placeholder={lang === 'es' ? 'Ej: paga en efectivo, descuento familiar…' : 'e.g. pays cash, family discount…'}
            style={{ ...inp, resize: 'vertical', minHeight: 80 }}
          />
          <Btn ghost sm style={{ marginTop: 10 }} disabled={saving} onClick={saveNote}>
            {lang === 'es' ? 'Guardar nota' : 'Save note'}
          </Btn>
        </div>

        <div style={card}>
          <span style={label}>{lang === 'es' ? 'DATOS' : 'DETAILS'}</span>
          <dl style={{ margin: 0, fontSize: 13, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <dt style={{ color: W.c.mute }}>{lang === 'es' ? 'Último pago registrado' : 'Last payment logged'}</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{athlete.lastPaidAt ? formatDateKey(athlete.lastPaidAt, lang) : '—'}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <dt style={{ color: W.c.mute }}>{lang === 'es' ? 'Mes abonado' : 'Paid for month'}</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>
                {athlete.paidForMonth ? formatBillingMonth(athlete.paidForMonth, lang) : '—'}
              </dd>
            </div>
            {athlete.whatsappDisplay && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <dt style={{ color: W.c.mute }}>WhatsApp</dt>
                <dd style={{ margin: 0, fontFamily: W.font.mono }}>{athlete.whatsappDisplay}</dd>
              </div>
            )}
            {athlete.createdAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <dt style={{ color: W.c.mute }}>{lang === 'es' ? 'Alta' : 'Joined'}</dt>
                <dd style={{ margin: 0 }}>
                  {athlete.createdAt?.toDate
                    ? formatDateKey(todayDateKey(athlete.createdAt.toDate()), lang)
                    : '—'}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </DesktopChrome>
  )
}
