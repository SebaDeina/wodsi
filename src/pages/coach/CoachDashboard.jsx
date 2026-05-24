import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useCoachWods } from '../../hooks/useCoachWods'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { formatHeaderDate, getISOWeek, startOfWeek, addDays, toDateKey } from '../../lib/dates'
import { membershipStatusFromAthlete, isPaidForBillingMonth, billingMonthKey, formatBillingMonth } from '../../lib/membership'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { Avatar } from '../../components/Avatar'
import { CoachHeader } from './CoachHeader'
import { useCoachSubscription } from '../../hooks/useCoachSubscription'

function AthletePill({ athlete, tone, onClick }) {
  const initials = (athlete.name || athlete.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 0', cursor: 'pointer',
        borderTop: `1px solid ${W.c.lineDim}`,
      }}
    >
      <Avatar name={initials} size={28} tone={tone} />
      <span style={{ fontSize: 13, color: W.c.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {athlete.name || athlete.email}
      </span>
      <span style={{ fontSize: 11, fontFamily: W.font.mono, color: W.c.mute }}>→</span>
    </div>
  )
}

export default function CoachDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { lang } = useLang()
  const isMobile = useIsMobile(1024)
  const { athletes, loading: athletesLoading } = useCoachAthletes()
  const { wods, todayWods, loading: wodsLoading } = useCoachWods(startOfWeek(new Date()))
  const { isActive: subscriptionActive, billingConfigured, loading: subLoading } = useCoachSubscription()

  const today = new Date()
  const firstName = (profile?.name || '').split(' ')[0] || 'Coach'
  const greeting = lang === 'es' ? `Buen día, ${firstName}.` : `Good morning, ${firstName}.`
  const subtitle = `${formatHeaderDate(today, lang)} · ${lang === 'es' ? 'Semana' : 'Week'} ${getISOWeek(today)}`
  const currentMonth = billingMonthKey()

  const nextWeekStart = addDays(startOfWeek(today), 7)
  const nextWeekStartKey = toDateKey(nextWeekStart)
  const nextWeekEndKey = toDateKey(addDays(nextWeekStart, 6))

  const { athletesWithoutNextWeek, paidThisMonth, unpaid, onBilling } = useMemo(() => {
    // Cobertura plani semana próxima
    const nextWeekWods = wods.filter(w => w.date >= nextWeekStartKey && w.date <= nextWeekEndKey)
    const hasBoxWod = nextWeekWods.some(w => !w.assigneeType || w.assigneeType === 'box')
    const coveredIds = new Set()
    if (!hasBoxWod) {
      nextWeekWods.forEach(w => (w.audienceAthleteIds || []).forEach(id => coveredIds.add(id)))
    }
    const active = athletes.filter(a => (a.status || 'active') !== 'paused')
    const athletesWithoutNextWeek = hasBoxWod ? [] : active.filter(a => !coveredIds.has(a.id))

    // Cobros
    const onBilling = athletes.filter(a => a.planDueDay != null || a.paidUntil)
    const paidThisMonth = athletes.filter(a => {
      if (a.planDueDay != null) return isPaidForBillingMonth(a.paidForMonth, currentMonth)
      return (a.status || 'active') === 'active'
    })
    const unpaid = athletes.filter(a => membershipStatusFromAthlete(a) === 'overdue')
    return { athletesWithoutNextWeek, paidThisMonth, unpaid, onBilling }
  }, [athletes, wods, nextWeekStartKey, nextWeekEndKey, currentMonth])

  const MAX_LIST = 6
  const loading = athletesLoading || wodsLoading

  return (
    <DesktopChrome lang={lang}>
      {!subLoading && billingConfigured && !subscriptionActive && (
        <div style={{
          margin: isMobile ? '0 16px 12px' : '0 32px 16px',
          padding: '14px 18px', borderRadius: 12,
          background: W.c.limeSoft, border: `1px solid ${W.c.lime}50`,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
        }}>
          <p style={{ margin: 0, flex: 1, fontSize: 14, color: W.c.text, lineHeight: 1.45 }}>
            {lang === 'es'
              ? 'Activá tu suscripción mensual a Wodsi para seguir usando el panel (Mercado Pago).'
              : 'Activate your monthly Wodsi subscription to keep using the coach panel (Mercado Pago).'}
          </p>
          <Btn primary sm onClick={() => navigate('/coach/planes')}>
            {lang === 'es' ? 'Ver planes' : 'View plans'} →
          </Btn>
        </div>
      )}

      <CoachHeader
        title={greeting}
        subtitle={subtitle}
        right={<>
          <Btn ghost sm onClick={() => navigate('/coach/planner/new')}>
            + {lang === 'es' ? 'Nuevo WOD' : 'New WOD'}
          </Btn>
          <Btn primary sm onClick={() => navigate('/coach/athletes/new')}>
            + {lang === 'es' ? 'Atleta' : 'Athlete'}
          </Btn>
        </>}
      />

      <div style={{ flex: 1, padding: isMobile ? '16px 16px 100px' : '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
          {[
            {
              label: lang === 'es' ? 'Atletas' : 'Athletes',
              val: loading ? '…' : String(athletes.length),
              delta: lang === 'es' ? `${athletes.filter(a => (a.status || 'active') === 'active').length} activos` : `${athletes.filter(a => (a.status || 'active') === 'active').length} active`,
              tone: 'lime',
            },
            {
              label: lang === 'es' ? 'Sin plani próx. semana' : 'No plan next week',
              val: loading ? '…' : String(athletesWithoutNextWeek.length),
              delta: loading ? '…' : athletesWithoutNextWeek.length
                ? (lang === 'es' ? 'atletas sin WOD' : 'athletes without WOD')
                : (lang === 'es' ? 'Todos cubiertos' : 'All covered'),
              tone: athletesWithoutNextWeek.length ? 'orange' : 'lime',
              negative: athletesWithoutNextWeek.length > 0,
            },
            {
              label: lang === 'es' ? 'Pagaron' : 'Paid',
              val: loading ? '…' : String(onBilling.length ? paidThisMonth.filter(a => a.planDueDay != null).length : '—'),
              delta: loading ? '…' : onBilling.length
                ? formatBillingMonth(currentMonth, lang)
                : (lang === 'es' ? 'Sin cobros configurados' : 'No billing set up'),
              tone: 'lime',
            },
            {
              label: lang === 'es' ? 'Adeudán' : 'Overdue',
              val: loading ? '…' : String(unpaid.length),
              delta: unpaid.length
                ? (lang === 'es' ? 'pago pendiente' : 'payment pending')
                : (lang === 'es' ? 'Todos al día' : 'All up to date'),
              tone: unpaid.length ? 'orange' : 'lime',
              negative: unpaid.length > 0,
            },
          ].map(k => (
            <div key={k.label} style={{ background: W.c.card, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.5, textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.2, marginTop: 6, fontFamily: W.font.display, color: W.c.text }}>{k.val}</div>
              <div style={{ fontSize: 12, fontFamily: W.font.mono, color: k.negative ? W.c.orange : W.c[k.tone] || W.c.mute, marginTop: 2 }}>{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Main panels */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20 }}>

          {/* Sin plani semana próxima */}
          <div style={{ background: W.c.card, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontFamily: W.font.mono, fontSize: 11, letterSpacing: 0.8, color: athletesWithoutNextWeek.length ? W.c.orange : W.c.lime }}>
                {athletesWithoutNextWeek.length
                  ? `⚠ ${athletesWithoutNextWeek.length} ${lang === 'es' ? 'SIN WOD PRÓX. SEMANA' : 'NO WOD NEXT WEEK'}`
                  : `✓ ${lang === 'es' ? 'TODOS CUBIERTOS' : 'ALL COVERED'}`}
              </div>
              <div style={{ flex: 1 }} />
              <Btn ghost sm onClick={() => navigate('/coach/planner')}>
                {lang === 'es' ? 'Planner' : 'Planner'} →
              </Btn>
            </div>
            <div style={{ fontSize: 13, color: W.c.dim, marginBottom: 12, lineHeight: 1.4 }}>
              {lang === 'es'
                ? `Atletas activos sin WOD publicado para la semana del ${toDateKey(nextWeekStart).slice(8)} al ${nextWeekEndKey.slice(8)}.`
                : `Active athletes with no WOD published for next week (${nextWeekStartKey.slice(5)} – ${nextWeekEndKey.slice(5)}).`}
            </div>

            {loading ? (
              <div style={{ fontSize: 12, color: W.c.mute, fontFamily: W.font.mono }}>…</div>
            ) : athletesWithoutNextWeek.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 13, color: W.c.mute }}>
                {wods.filter(w => w.date >= nextWeekStartKey && w.date <= nextWeekEndKey).length === 0
                  ? (lang === 'es' ? 'No hay WODs publicados para la semana próxima.' : 'No WODs published for next week yet.')
                  : (lang === 'es' ? 'Todos los atletas tienen WOD la semana próxima.' : 'All athletes have WODs next week.')}
              </div>
            ) : (
              <>
                {athletesWithoutNextWeek.slice(0, MAX_LIST).map(a => (
                  <AthletePill key={a.id} athlete={a} tone="orange" onClick={() => navigate('/coach/planner')} />
                ))}
                {athletesWithoutNextWeek.length > MAX_LIST && (
                  <div
                    onClick={() => navigate('/coach/planner')}
                    style={{ marginTop: 10, fontSize: 12, color: W.c.lime, cursor: 'pointer', fontFamily: W.font.mono }}
                  >
                    + {athletesWithoutNextWeek.length - MAX_LIST} {lang === 'es' ? 'más' : 'more'}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cobros pendientes */}
          <div style={{ background: W.c.card, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontFamily: W.font.mono, fontSize: 11, letterSpacing: 0.8, color: unpaid.length ? W.c.orange : W.c.lime }}>
                {unpaid.length
                  ? `⚠ ${unpaid.length} ${lang === 'es' ? 'PAGO PENDIENTE' : 'PAYMENT PENDING'}`
                  : `✓ ${lang === 'es' ? 'TODOS AL DÍA' : 'ALL UP TO DATE'}`}
              </div>
              <div style={{ flex: 1 }} />
              <Btn ghost sm onClick={() => navigate('/coach/athletes')}>
                {lang === 'es' ? 'Ver todos' : 'View all'} →
              </Btn>
            </div>
            <div style={{ fontSize: 13, color: W.c.dim, marginBottom: 12, lineHeight: 1.4 }}>
              {lang === 'es'
                ? `Atletas que no pagaron ${formatBillingMonth(currentMonth, lang)}.`
                : `Athletes who haven't paid for ${formatBillingMonth(currentMonth, lang)}.`}
            </div>

            {loading ? (
              <div style={{ fontSize: 12, color: W.c.mute, fontFamily: W.font.mono }}>…</div>
            ) : unpaid.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 13, color: W.c.mute }}>
                {onBilling.length === 0
                  ? (lang === 'es' ? 'No hay cobros configurados aún.' : 'No billing configured yet.')
                  : (lang === 'es' ? 'Todos los atletas están al día.' : 'All athletes are up to date.')}
              </div>
            ) : (
              <>
                {unpaid.slice(0, MAX_LIST).map(a => (
                  <AthletePill key={a.id} athlete={a} tone="orange" onClick={() => navigate(`/coach/athletes/${a.id}`)} />
                ))}
                {unpaid.length > MAX_LIST && (
                  <div
                    onClick={() => navigate('/coach/athletes')}
                    style={{ marginTop: 10, fontSize: 12, color: W.c.lime, cursor: 'pointer', fontFamily: W.font.mono }}
                  >
                    + {unpaid.length - MAX_LIST} {lang === 'es' ? 'más' : 'more'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* WOD de hoy + Planificación */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: isMobile ? 16 : 20 }}>
          <div style={{ background: W.c.card, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: W.font.mono, fontSize: 11, color: todayWods.length ? W.c.lime : W.c.mute, letterSpacing: 0.8 }}>
                  {todayWods.length ? `● ${lang === 'es' ? 'HOY' : 'TODAY'}` : (lang === 'es' ? 'SIN WOD HOY' : 'NO WOD TODAY')}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, fontFamily: W.font.display, marginTop: 4, color: W.c.text }}>
                  {todayWods[0]
                    ? `${todayWods[0].title} · ${todayWods[0].type}`
                    : (lang === 'es' ? 'No hay sesión publicada hoy' : 'No session published today')}
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <Btn ghost sm onClick={() => navigate('/coach/planner')}>
                {lang === 'es' ? 'Planner' : 'Planner'} →
              </Btn>
            </div>
            {todayWods.length === 0 ? (
              <div style={{
                padding: '16px 20px', background: W.c.bg2, borderRadius: 10,
                border: `1px dashed ${W.c.lineDim}`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, color: W.c.dim, marginBottom: 12 }}>
                  {lang === 'es'
                    ? 'Publicá el WOD de hoy para que tus atletas lo vean.'
                    : "Publish today's WOD so your athletes can see it."}
                </div>
                <Btn primary sm onClick={() => navigate('/coach/planner/new')}>
                  + {lang === 'es' ? 'Crear WOD' : 'Create WOD'}
                </Btn>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {todayWods.map(w => (
                  <div
                    key={w.id}
                    onClick={() => navigate('/coach/planner')}
                    style={{
                      padding: '8px 14px', background: W.c.bg2, borderRadius: 8,
                      borderLeft: `3px solid ${W.c.lime}`, cursor: 'pointer',
                      fontSize: 13, color: W.c.text,
                    }}
                  >
                    {w.title || w.type}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
          <div style={{ background: W.c.card, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: W.c.text }}>
              {lang === 'es' ? 'Acciones rápidas' : 'Quick actions'}
            </div>
            {[
              [lang === 'es' ? 'Publicar WOD' : 'Publish WOD', '/coach/planner/new'],
              [lang === 'es' ? 'Invitar atleta' : 'Invite athlete', '/coach/athletes/new'],
              [lang === 'es' ? 'Ver planificación' : 'View programming', '/coach/planner'],
              [lang === 'es' ? 'Gestionar atletas' : 'Manage athletes', '/coach/athletes'],
              [lang === 'es' ? 'WhatsApp y cobros' : 'WhatsApp & billing', '/coach/whatsapp'],
            ].map(([txt, path], i) => (
              <div
                key={i}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                  borderTop: i ? `1px solid ${W.c.lineDim}` : 'none', cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: 3,
                  background: W.c.lime, flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: W.c.text, flex: 1 }}>{txt}</span>
                <span style={{ color: W.c.mute, fontSize: 12 }}>→</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DesktopChrome>
  )
}
