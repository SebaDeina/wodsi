import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { AthleteShell } from '../../components/AthleteShell'
import { Btn } from '../../components/Btn'
import { EmptyCard } from '../../components/EmptyCard'
import { useAthleteCoach } from '../../hooks/useAthleteCoach'
import { formatDateKey, membershipStatusFromDates } from '../../lib/membership'

export default function AthleteSubscription() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { coach, loading } = useAthleteCoach(profile?.coachId)

  const boxCoachLine = [coach?.boxName, coach?.name].filter(Boolean).join(' · ').toUpperCase()
  const mode = coach?.athletePaymentMode || 'both'
  const showAlias = mode === 'alias' || mode === 'both'
  const showCash = mode === 'cash' || mode === 'both'
  const passStatus = membershipStatusFromDates(profile?.paidUntil, profile?.status)

  return (
    <AthleteShell lang={lang}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 22, cursor: 'pointer' }} onClick={() => navigate(-1)}>‹</span>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
              {lang === 'es' ? 'Membresía' : 'Membership'}
            </span>
            <span style={{ width: 22 }} />
          </div>

          {loading ? (
            <EmptyCard title={lang === 'es' ? 'Cargando…' : 'Loading…'} />
          ) : (
            <>
              <div style={{
                background: W.c.card,
                color: W.c.text,
                borderRadius: 18,
                padding: 24,
                border: `1px solid ${W.c.lineDim}`,
              }}>
                {boxCoachLine && (
                  <div style={{ fontFamily: W.font.mono, fontSize: 11, letterSpacing: 0.8, color: W.c.dim }}>
                    {boxCoachLine}
                  </div>
                )}
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, marginTop: 12, fontFamily: W.font.display }}>
                  {coach?.membershipAmount || (lang === 'es' ? 'Consultá con tu coach' : 'Ask your coach')}
                </div>
                <p style={{ fontSize: 13, color: W.c.dim, marginTop: 10, lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Tu coach gestiona el cobro fuera de la app. Usá los datos de abajo para pagar.'
                    : 'Your coach handles payment outside the app. Use the details below.'}
                </p>
                {(profile?.lastPaidAt || profile?.paidUntil) && (
                  <div style={{
                    marginTop: 16, paddingTop: 14, borderTop: `1px solid ${W.c.lineDim}`,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12,
                  }}>
                    {profile?.lastPaidAt && (
                      <div>
                        <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.mute, letterSpacing: 0.5 }}>
                          {lang === 'es' ? 'ÚLTIMO PAGO' : 'LAST PAYMENT'}
                        </div>
                        <div style={{ fontWeight: 600, marginTop: 4 }}>{formatDateKey(profile.lastPaidAt, lang)}</div>
                      </div>
                    )}
                    {profile?.paidUntil && (
                      <div>
                        <div style={{ fontFamily: W.font.mono, fontSize: 9, color: passStatus === 'overdue' ? W.c.orange : W.c.lime, letterSpacing: 0.5 }}>
                          {lang === 'es' ? 'VENCE EL' : 'VALID UNTIL'}
                        </div>
                        <div style={{ fontWeight: 600, marginTop: 4, color: passStatus === 'overdue' ? W.c.orange : W.c.text }}>
                          {formatDateKey(profile.paidUntil, lang)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showAlias && coach?.paymentAlias && (
                <div style={{ background: W.c.card, borderRadius: 14, padding: 18, marginTop: 12 }}>
                  <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.lime, letterSpacing: 0.6 }}>
                    {lang === 'es' ? 'TRANSFERENCIA' : 'TRANSFER'}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, fontFamily: W.font.mono }}>
                    {coach.paymentAlias}
                  </div>
                  {coach.paymentHolder && (
                    <div style={{ fontSize: 12, color: W.c.dim, marginTop: 4 }}>{coach.paymentHolder}</div>
                  )}
                </div>
              )}

              {showCash && coach?.cashInstructions && (
                <div style={{ background: W.c.card, borderRadius: 14, padding: 18, marginTop: 12 }}>
                  <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.orange, letterSpacing: 0.6 }}>
                    {lang === 'es' ? 'EFECTIVO' : 'CASH'}
                  </div>
                  <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>{coach.cashInstructions}</p>
                </div>
              )}

              {coach?.paymentNotes && (
                <div style={{ fontSize: 12, color: W.c.mute, marginTop: 12, lineHeight: 1.45 }}>
                  {coach.paymentNotes}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{lang === 'es' ? 'Incluye con Wodsi' : 'Included with Wodsi'}</div>
                {[
                  lang === 'es' ? 'Planificación semanal de tu coach' : 'Weekly programming from your coach',
                  lang === 'es' ? 'WOD del día y vista semanal' : "Today's WOD and week view",
                  lang === 'es' ? 'Seguimiento de hábitos diarios' : 'Daily habit tracking',
                  lang === 'es' ? 'Avisos por WhatsApp del box' : 'Gym WhatsApp notices',
                ].map((txt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${W.c.lineDim}`, fontSize: 13 }}>
                    <span style={{ color: W.c.lime, fontWeight: 700 }}>✓</span>{txt}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <Btn ghost sm style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/athlete')}>
                  {lang === 'es' ? 'Volver al inicio' : 'Back to home'}
                </Btn>
              </div>
            </>
          )}
    </AthleteShell>
  )
}
