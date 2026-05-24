import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { W } from '../tokens'
import { Btn } from './Btn'
import { Tag } from './Tag'
import { useCoachSubscription } from '../hooks/useCoachSubscription'
import { useCoachSubscriptionPayments } from '../hooks/useCoachSubscriptionPayments'
import { mercadoPagoPlanUrl } from '../lib/mercadoPagoPlanLinks'
import {
  COACH_SUBSCRIPTION_PLANS,
  formatPlanPriceARS,
  planIncludesAthleteCount,
} from '../lib/coachSubscriptionPlans'

const STATUS_LABEL = {
  active: { es: 'Activa', en: 'Active', tone: 'lime' },
  authorized: { es: 'Activa', en: 'Active', tone: 'lime' },
  pending: { es: 'Pendiente', en: 'Pending', tone: 'orange' },
  paused: { es: 'Pausada', en: 'Paused', tone: 'mute' },
  cancelled: { es: 'Cancelada', en: 'Cancelled', tone: 'mute' },
  past_due: { es: 'Pago pendiente', en: 'Payment due', tone: 'orange' },
}

const PAYMENT_STATUS = {
  approved: { es: 'Aprobado', en: 'Approved', tone: 'lime' },
  pending: { es: 'Pendiente', en: 'Pending', tone: 'orange' },
  rejected: { es: 'Rechazado', en: 'Rejected', tone: 'red' },
}

function formatPaidAt(value, lang) {
  if (!value) return '—'
  const date = value?.toDate?.() ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-AR' : 'en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: W.font.mono, fontSize: 10, letterSpacing: 1.2,
      textTransform: 'uppercase', color: W.c.mute, marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

function CardLabel({ children }) {
  return (
    <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.6 }}>
      {children}
    </div>
  )
}

function EmptyRow({ text }) {
  return (
    <div style={{ padding: '20px 16px', fontSize: 13, color: W.c.dim, lineHeight: 1.5 }}>
      {text}
    </div>
  )
}

export function CoachSubscriptionPanel({ lang }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    subscription,
    athleteCount,
    recommendedPlan,
    activePlan,
    isActive,
    needsUpgrade,
    billingConfigured,
    usesMercadoPagoLinks,
    loading,
    checkoutLoading,
    error,
    startCheckout,
    syncFromMercadoPago,
  } = useCoachSubscription()
  const { payments, loading: paymentsLoading } = useCoachSubscriptionPayments()

  const [selectedTierId, setSelectedTierId] = useState(null)

  useEffect(() => {
    if (recommendedPlan && !selectedTierId) {
      setSelectedTierId(recommendedPlan.id)
    }
  }, [recommendedPlan, selectedTierId])

  useEffect(() => {
    const mp = searchParams.get('mp')
    if (mp !== 'return' && mp !== 'success') return
    syncFromMercadoPago().finally(() => {
      searchParams.delete('mp')
      setSearchParams(searchParams, { replace: true })
    })
  }, [searchParams, setSearchParams, syncFromMercadoPago])

  if (loading) {
    return (
      <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>
        {lang === 'es' ? 'Cargando plan…' : 'Loading plan…'}
      </div>
    )
  }

  if (!billingConfigured) {
    return (
      <div style={{ fontSize: 13, color: W.c.dim, lineHeight: 1.5 }}>
        {lang === 'es'
          ? 'Configurá VITE_MP_LINK_STARTER y VITE_MP_LINK_GROWTH con tus links de suscripción de Mercado Pago.'
          : 'Set VITE_MP_LINK_STARTER and VITE_MP_LINK_GROWTH with your Mercado Pago subscription links.'}
      </div>
    )
  }

  const statusKey = subscription?.status || 'none'
  const statusMeta = STATUS_LABEL[statusKey]
  const selectedPlan = COACH_SUBSCRIPTION_PLANS.find(p => p.id === selectedTierId) || recommendedPlan

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <section>
        <p style={{ fontSize: 14, color: W.c.dim, margin: '0 0 16px', lineHeight: 1.55 }}>
          {lang === 'es'
            ? 'Elegí el plan según tu roster y pagá con Mercado Pago. El débito se renueva cada mes.'
            : 'Pick a plan based on your roster and pay with Mercado Pago. Billing renews monthly.'}
        </p>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
          padding: '14px 16px', borderRadius: 12, background: W.c.bg2, border: `1px solid ${W.c.lineDim}`,
        }}>
          <div>
            <CardLabel>{lang === 'es' ? 'ATLETAS' : 'ATHLETES'}</CardLabel>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: W.font.display }}>{athleteCount}</div>
          </div>
          {recommendedPlan && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, color: W.c.dim }}>
                {lang === 'es' ? 'Recomendado:' : 'Recommended:'}{' '}
                <strong>{lang === 'es' ? recommendedPlan.name.es : recommendedPlan.name.en}</strong>
              </div>
              <div style={{ fontSize: 12, color: W.c.lime, marginTop: 4, fontFamily: W.font.mono }}>
                {formatPlanPriceARS(recommendedPlan.amountARS, lang)}
              </div>
            </div>
          )}
        </div>

        {isActive && activePlan && (
          <div style={{
            marginTop: 14, padding: 16, borderRadius: 12,
            border: `1px solid ${W.c.lime}40`, background: W.c.limeSoft,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {lang === 'es' ? activePlan.name.es : activePlan.name.en}
              </span>
              {statusMeta && <Tag tone={statusMeta.tone}>{lang === 'es' ? statusMeta.es : statusMeta.en}</Tag>}
            </div>
            <div style={{ fontSize: 13, color: W.c.dim, marginTop: 8 }}>
              {formatPlanPriceARS(activePlan.amountARS, lang)}
              {subscription?.nextPaymentDate && (
                <span style={{ marginLeft: 8, fontFamily: W.font.mono, fontSize: 11 }}>
                  · {lang === 'es' ? 'Próximo cobro' : 'Next charge'}: {subscription.nextPaymentDate}
                </span>
              )}
            </div>
            {needsUpgrade && recommendedPlan && (
              <p style={{ fontSize: 13, color: W.c.orange, margin: '12px 0 0', lineHeight: 1.45 }}>
                {lang === 'es'
                  ? `Tenés ${athleteCount} atletas. Actualizá al plan de ${recommendedPlan.amountARS.toLocaleString('es-AR')} ARS/mes.`
                  : `You have ${athleteCount} athletes. Upgrade to ${recommendedPlan.amountARS.toLocaleString('en-US')} ARS/month.`}
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>{lang === 'es' ? 'Elegir plan' : 'Choose plan'}</SectionTitle>
        {error && <div style={{ fontSize: 12, color: W.c.red, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {COACH_SUBSCRIPTION_PLANS.map(plan => {
            const isCurrent = isActive && subscription?.tierId === plan.id
            const isSelected = selectedTierId === plan.id
            const fits = planIncludesAthleteCount(plan, athleteCount)
            const label = lang === 'es' ? plan.name.es : plan.name.en
            const desc = lang === 'es' ? plan.description.es : plan.description.en

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedTierId(plan.id)}
                style={{
                  textAlign: 'left', padding: 18, borderRadius: 14, cursor: 'pointer',
                  border: `2px solid ${isSelected ? W.c.lime : isCurrent ? `${W.c.lime}80` : W.c.lineDim}`,
                  background: isSelected ? W.c.limeSoft : W.c.card,
                  color: W.c.text,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 17 }}>{label}</div>
                <div style={{ fontSize: 12, color: W.c.mute, marginTop: 4 }}>
                  {plan.minAthletes}–{plan.maxAthletes} {lang === 'es' ? 'atletas' : 'athletes'}
                </div>
                <div style={{ fontFamily: W.font.mono, fontSize: 18, fontWeight: 700, color: W.c.lime, marginTop: 12 }}>
                  {formatPlanPriceARS(plan.amountARS, lang)}
                </div>
                <div style={{ fontSize: 12, color: W.c.dim, marginTop: 10, lineHeight: 1.45 }}>{desc}</div>
                {isCurrent && (
                  <div style={{ fontSize: 11, color: W.c.lime, marginTop: 10, fontFamily: W.font.mono, fontWeight: 600 }}>
                    {lang === 'es' ? '✓ PLAN ACTUAL' : '✓ CURRENT PLAN'}
                  </div>
                )}
                {!fits && athleteCount > plan.maxAthletes && (
                  <div style={{ fontSize: 11, color: W.c.mute, marginTop: 8 }}>
                    {lang === 'es' ? 'Roster superior a este plan' : 'Roster exceeds this plan'}
                  </div>
                )}
                {mercadoPagoPlanUrl(plan.id) && (
                  <div style={{ fontSize: 10, color: W.c.mute, marginTop: 8, fontFamily: W.font.mono }}>
                    Mercado Pago
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {selectedPlan && (
          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <Btn
              primary
              disabled={
                checkoutLoading
                || !planIncludesAthleteCount(selectedPlan, athleteCount)
                || (isActive && !needsUpgrade && subscription?.tierId === selectedPlan.id)
              }
              onClick={() => startCheckout(selectedPlan.id)}
            >
              {checkoutLoading
                ? '…'
                : usesMercadoPagoLinks
                  ? (lang === 'es' ? 'Ir a Mercado Pago →' : 'Go to Mercado Pago →')
                  : (lang === 'es' ? 'Suscribirme' : 'Subscribe')}
            </Btn>
            {usesMercadoPagoLinks && (
              <span style={{ fontSize: 12, color: W.c.mute, maxWidth: 320, lineHeight: 1.45 }}>
                {lang === 'es'
                  ? 'Se abre tu link de suscripción de Mercado Pago. Completá el pago y volvé acá para ver el estado.'
                  : 'Opens your Mercado Pago subscription link. Complete payment and return here to see status.'}
              </span>
            )}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>{lang === 'es' ? 'Historial de pagos' : 'Payment history'}</SectionTitle>
        <div style={{
          borderRadius: 12, border: `1px solid ${W.c.lineDim}`, overflow: 'hidden', background: W.c.card,
        }}>
          {paymentsLoading ? (
            <EmptyRow text={lang === 'es' ? 'Cargando pagos…' : 'Loading payments…'} />
          ) : payments.length === 0 ? (
            <EmptyRow
              text={lang === 'es'
                ? 'Todavía no hay pagos registrados. Aparecen acá cuando Mercado Pago confirma un cobro.'
                : 'No payments yet. They appear here when Mercado Pago confirms a charge.'}
            />
          ) : (
            payments.map((p, i) => {
              const meta = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending
              const plan = COACH_SUBSCRIPTION_PLANS.find(x => x.id === p.tierId)
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
                    padding: '14px 16px',
                    borderTop: i > 0 ? `1px solid ${W.c.lineDim}` : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {plan
                        ? (lang === 'es' ? plan.name.es : plan.name.en)
                        : (lang === 'es' ? 'Suscripción Wodsi' : 'Wodsi subscription')}
                    </div>
                    <div style={{ fontSize: 12, color: W.c.mute, marginTop: 4, fontFamily: W.font.mono }}>
                      {formatPaidAt(p.paidAt, lang)}
                    </div>
                  </div>
                  <div style={{ fontFamily: W.font.mono, fontSize: 14, fontWeight: 700, color: W.c.lime }}>
                    {new Intl.NumberFormat(lang === 'es' ? 'es-AR' : 'en-US', {
                      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
                    }).format(p.amountARS || 0)}
                  </div>
                  <Tag tone={meta.tone} sm>{lang === 'es' ? meta.es : meta.en}</Tag>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
