import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useCoachBilling } from '../../hooks/useCoachBilling'
import { useWhatsAppAutomation } from '../../hooks/useWhatsAppAutomation'
import { W } from '../../tokens'
import { Btn } from '../../components/Btn'
import { WodsiLogo } from '../../components/WodsiLogo'
import { useIsMobile } from '../../hooks/useBreakpoint'

const STEPS = ['planes', 'whatsapp', 'mensajes', 'atletas', 'listo']

const MODES = [
  { id: 'alias', es: 'Transferencia', en: 'Transfer' },
  { id: 'cash', es: 'Efectivo', en: 'Cash' },
  { id: 'both', es: 'Transferencia y efectivo', en: 'Transfer and cash' },
]

function stepLabel(step, lang) {
  const labels = {
    planes: { es: 'Planes', en: 'Plans' },
    whatsapp: { es: 'WhatsApp', en: 'WhatsApp' },
    mensajes: { es: 'Automáticos', en: 'Automatic' },
    atletas: { es: 'Atletas', en: 'Athletes' },
    listo: { es: 'Listo', en: 'Done' },
  }
  return labels[step]?.[lang] || step
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block',
      marginBottom: 6,
      fontFamily: W.font.mono,
      fontSize: 10,
      color: W.c.mute,
      letterSpacing: 0.7,
    }}>
      {children}
    </label>
  )
}

function InfoRow({ title, body }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${W.c.lineDim}` }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: W.c.lime, marginTop: 6, flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: W.c.text }}>{title}</div>
        <div style={{ fontSize: 13, color: W.c.dim, lineHeight: 1.45, marginTop: 3 }}>{body}</div>
      </div>
    </div>
  )
}

export default function CoachOnboarding() {
  const { profile, updateProfileFields } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const isMobile = useIsMobile(820)
  const { billing, saveBilling, saving: savingBilling } = useCoachBilling()
  const { requestWhatsAppSession, boxRules, loading: rulesLoading, updateRule } = useWhatsAppAutomation()

  const [stepIndex, setStepIndex] = useState(0)
  const [billingForm, setBillingForm] = useState(() => billing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const step = STEPS[stepIndex]
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100)

  useEffect(() => {
    setBillingForm(billing)
  }, [billing])

  const inp = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 9,
    border: `1px solid ${W.c.lineDim}`,
    background: W.c.bg2,
    color: W.c.text,
    fontFamily: W.font.sans,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const card = {
    background: W.c.card,
    border: `1px solid ${W.c.lineDim}`,
    borderRadius: 14,
    padding: 22,
    color: W.c.text,
  }

  async function next() {
    setError('')
    if (step === 'planes') {
      try {
        await saveBilling(billingForm)
      } catch {
        setError(lang === 'es' ? 'No pudimos guardar los planes. Intentá de nuevo.' : 'We could not save plans. Try again.')
        return
      }
    }
    setStepIndex(i => Math.min(i + 1, STEPS.length - 1))
  }

  function back() {
    setError('')
    setStepIndex(i => Math.max(i - 1, 0))
  }

  async function connectWhatsApp() {
    setError('')
    try {
      await requestWhatsAppSession('connect')
      navigate('/coach/whatsapp')
    } catch {
      setError(lang === 'es' ? 'No pudimos iniciar la conexión. Podés hacerlo luego desde WhatsApp.' : 'We could not start connection. You can do it later from WhatsApp.')
    }
  }

  async function toggleRule(rule) {
    try {
      await updateRule(rule.id, { active: !rule.active })
    } catch {
      setError(lang === 'es' ? 'No pudimos actualizar el mensaje automático.' : 'We could not update the automatic message.')
    }
  }

  async function finish() {
    setBusy(true)
    setError('')
    try {
      await updateProfileFields({ coachOnboardingCompleted: true })
      navigate('/coach', { replace: true })
    } catch {
      setError(lang === 'es' ? 'No pudimos cerrar el onboarding. Intentá de nuevo.' : 'We could not finish onboarding. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: W.c.bg,
      color: W.c.text,
      fontFamily: W.font.sans,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        padding: '18px 24px',
        borderBottom: `1px solid ${W.c.lineDim}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <WodsiLogo size={22} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: W.c.text }}>
            {lang === 'es' ? 'Configurá tu box' : 'Set up your gym'}
          </div>
          <div style={{ fontSize: 13, color: W.c.dim, marginTop: 2 }}>
            {profile?.boxName || profile?.name || (lang === 'es' ? 'Tu cuenta de coach' : 'Your coach account')}
          </div>
        </div>
        <button
          type="button"
          onClick={finish}
          style={{ border: 'none', background: 'transparent', color: W.c.mute, cursor: 'pointer', fontWeight: 600 }}
        >
          {lang === 'es' ? 'Saltar por ahora' : 'Skip for now'}
        </button>
      </header>

      <main style={{
        width: '100%',
        maxWidth: 1060,
        margin: '0 auto',
        padding: '28px 20px 40px',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 0.65fr) minmax(0, 1.35fr)',
        ...(isMobile ? { gridTemplateColumns: '1fr', padding: '18px 14px 36px' } : {}),
        gap: 24,
      }}>
        <aside style={{ ...card, alignSelf: 'start' }}>
          <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.8 }}>
            {lang === 'es' ? 'PROGRESO' : 'PROGRESS'}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: W.c.bg2, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: W.c.lime }} />
          </div>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STEPS.map((s, i) => {
              const active = i === stepIndex
              const done = i < stepIndex
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStepIndex(i)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 9,
                    border: `1px solid ${active ? W.c.lime : W.c.lineDim}`,
                    background: active ? W.c.limeSoft : 'transparent',
                    color: active ? W.c.text : W.c.dim,
                    textAlign: 'left',
                    fontWeight: active ? 700 : 600,
                    cursor: 'pointer',
                  }}
                >
                  {done ? '✓ ' : ''}{stepLabel(s, lang)}
                </button>
              )
            })}
          </div>
        </aside>

        <section style={card}>
          {step === 'planes' && (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: W.c.text }}>
                {lang === 'es' ? 'Datos de planes y cobro' : 'Plans and payments'}
              </div>
              <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.5 }}>
                {lang === 'es'
                  ? 'Esto se usa en la pantalla del atleta y en los mensajes automáticos de cuota.'
                  : 'This is used in the athlete screen and automatic payment messages.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginTop: 18 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel>{lang === 'es' ? 'MODO DE COBRO' : 'PAYMENT MODE'}</FieldLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 8 }}>
                    {MODES.map(m => {
                      const active = billingForm.athletePaymentMode === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setBillingForm(f => ({ ...f, athletePaymentMode: m.id }))}
                          style={{
                            padding: '12px',
                            borderRadius: 10,
                            border: `1px solid ${active ? W.c.lime : W.c.lineDim}`,
                            background: active ? W.c.limeSoft : W.c.bg2,
                            color: W.c.text,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {lang === 'es' ? m.es : m.en}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <FieldLabel>{lang === 'es' ? 'PRECIO / MEMBRESÍA' : 'PRICE / MEMBERSHIP'}</FieldLabel>
                  <input
                    value={billingForm.membershipAmount || ''}
                    onChange={e => setBillingForm(f => ({ ...f, membershipAmount: e.target.value }))}
                    placeholder={lang === 'es' ? '$45.000 / mes' : '$45,000 / month'}
                    style={inp}
                  />
                </div>
                <div>
                  <FieldLabel>ALIAS / CVU</FieldLabel>
                  <input
                    value={billingForm.paymentAlias || ''}
                    onChange={e => setBillingForm(f => ({ ...f, paymentAlias: e.target.value }))}
                    placeholder="mi.box.mp"
                    style={inp}
                  />
                </div>
                <div>
                  <FieldLabel>{lang === 'es' ? 'TITULAR' : 'ACCOUNT NAME'}</FieldLabel>
                  <input
                    value={billingForm.paymentHolder || ''}
                    onChange={e => setBillingForm(f => ({ ...f, paymentHolder: e.target.value }))}
                    placeholder={profile?.name || ''}
                    style={inp}
                  />
                </div>
                <div>
                  <FieldLabel>{lang === 'es' ? 'EFECTIVO' : 'CASH'}</FieldLabel>
                  <input
                    value={billingForm.cashInstructions || ''}
                    onChange={e => setBillingForm(f => ({ ...f, cashInstructions: e.target.value }))}
                    placeholder={lang === 'es' ? 'En recepción' : 'At front desk'}
                    style={inp}
                  />
                </div>
              </div>
            </>
          )}

          {step === 'whatsapp' && (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: W.c.text }}>
                {lang === 'es' ? 'Conectá WhatsApp' : 'Connect WhatsApp'}
              </div>
              <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.5 }}>
                {lang === 'es'
                  ? 'Wodsi envía avisos desde tu número. No lee tus chats: solo prepara mensajes para atletas de tu roster.'
                  : 'Wodsi sends notices from your number. It does not read chats: it only prepares messages for your roster.'}
              </p>
              <div style={{ marginTop: 12 }}>
                <InfoRow
                  title={lang === 'es' ? '1. Tocá conectar' : '1. Tap connect'}
                  body={lang === 'es' ? 'Se abre la pantalla con el QR.' : 'The QR screen opens.'}
                />
                <InfoRow
                  title={lang === 'es' ? '2. Escaneá desde el celular' : '2. Scan from your phone'}
                  body={lang === 'es' ? 'WhatsApp > Dispositivos vinculados > Vincular dispositivo.' : 'WhatsApp > Linked devices > Link a device.'}
                />
                <InfoRow
                  title={lang === 'es' ? '3. Volvé cuando figure activo' : '3. Return when it is active'}
                  body={lang === 'es' ? 'Después podés enviar mensajes manuales y automáticos.' : 'Then you can send manual and automatic messages.'}
                />
              </div>
              <Btn primary style={{ marginTop: 18 }} onClick={connectWhatsApp}>
                {lang === 'es' ? 'Conectar WhatsApp' : 'Connect WhatsApp'}
              </Btn>
            </>
          )}

          {step === 'mensajes' && (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: W.c.text }}>
                {lang === 'es' ? 'Mensajes automáticos' : 'Automatic messages'}
              </div>
              <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.5 }}>
                {lang === 'es'
                  ? 'Podés activar o apagar cada regla. Las plantillas usan datos como nombre, monto, alias y vencimiento.'
                  : 'You can turn each rule on or off. Templates use name, amount, alias and due date.'}
              </p>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rulesLoading ? (
                  <div style={{ color: W.c.mute, fontSize: 13 }}>{lang === 'es' ? 'Cargando mensajes…' : 'Loading messages…'}</div>
                ) : boxRules.slice(0, 4).map(rule => (
                  <div key={rule.id} style={{ padding: 14, borderRadius: 10, background: W.c.bg2, border: `1px solid ${W.c.lineDim}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{rule.icon || '•'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: W.c.text }}>{rule.name}</div>
                      <div style={{ fontSize: 12, color: rule.active ? W.c.lime : W.c.mute, marginTop: 3, fontFamily: W.font.mono, letterSpacing: 0.3 }}>
                        {rule.active ? (lang === 'es' ? 'ACTIVA' : 'ON') : (lang === 'es' ? 'APAGADA' : 'OFF')}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={rule.active ? 'Apagar' : 'Activar'}
                      onClick={() => toggleRule(rule)}
                      style={{
                        flexShrink: 0,
                        width: 46,
                        height: 26,
                        borderRadius: 999,
                        border: 'none',
                        background: rule.active ? W.c.lime : W.c.cardHi,
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.18s ease',
                        padding: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: 3,
                        left: rule.active ? 'calc(100% - 23px)' : '3px',
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        background: rule.active ? W.c.bg : W.c.mute,
                        transition: 'left 0.18s ease',
                        display: 'block',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
              <Btn ghost style={{ marginTop: 16 }} onClick={() => navigate('/coach/whatsapp')}>
                {lang === 'es' ? 'Editar mensajes en detalle' : 'Edit messages in detail'}
              </Btn>
            </>
          )}

          {step === 'atletas' && (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: W.c.text }}>
                {lang === 'es' ? 'Sumá atletas' : 'Add athletes'}
              </div>
              <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.5 }}>
                {lang === 'es'
                  ? 'Tus atletas entran con un link. Cuando se registran, quedan vinculados a tu roster y podés asignarles planes.'
                  : 'Athletes join with a link. Once registered, they appear in your roster and you can assign programming.'}
              </p>
              <InfoRow
                title={lang === 'es' ? 'Invitación única' : 'Single invite'}
                body={lang === 'es' ? 'Copiá el link o abrí WhatsApp con el mensaje listo.' : 'Copy the link or open WhatsApp with a ready message.'}
              />
              <InfoRow
                title={lang === 'es' ? 'Grupos para planificar rápido' : 'Groups for faster programming'}
                body={lang === 'es' ? 'Creá grupos como Competidores, Principiantes o Turno mañana.' : 'Create groups like Competitors, Beginners or Morning class.'}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                <Btn primary onClick={() => navigate('/coach/athletes/new')}>
                  {lang === 'es' ? 'Abrir invitación' : 'Open invite'}
                </Btn>
                <Btn ghost onClick={() => navigate('/coach/groups')}>
                  {lang === 'es' ? 'Crear grupos' : 'Create groups'}
                </Btn>
              </div>
            </>
          )}

          {step === 'listo' && (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: W.c.text }}>
                {lang === 'es' ? 'Ya podés empezar' : 'You are ready'}
              </div>
              <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.5 }}>
                {lang === 'es'
                  ? 'Desde el inicio vas a tener accesos rápidos a planificación, atletas y WhatsApp.'
                  : 'From home you will have quick access to programming, athletes and WhatsApp.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 16 }}>
                {[
                  [lang === 'es' ? 'Planificar semana' : 'Program week', lang === 'es' ? 'Creá WODs por día, grupo o atleta.' : 'Create WODs by day, group or athlete.'],
                  [lang === 'es' ? 'Controlar pagos' : 'Track payments', lang === 'es' ? 'Marcá pagos del mes desde Atletas.' : 'Mark this month payments from Athletes.'],
                  [lang === 'es' ? 'Enviar avisos' : 'Send notices', lang === 'es' ? 'Usá mensajes manuales o automáticos.' : 'Use manual or automatic messages.'],
                  [lang === 'es' ? 'Ajustar luego' : 'Adjust later', lang === 'es' ? 'Todo queda disponible en Configuración.' : 'Everything remains available in Settings.'],
                ].map(([title, body]) => (
                  <div key={title} style={{ background: W.c.bg2, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 800, color: W.c.text }}>{title}</div>
                    <div style={{ fontSize: 12, color: W.c.dim, marginTop: 5, lineHeight: 1.4 }}>{body}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 9, background: `${W.c.red}10`, color: W.c.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
            <Btn ghost type="button" onClick={back} disabled={stepIndex === 0}>
              {lang === 'es' ? 'Atrás' : 'Back'}
            </Btn>
            {step === 'listo' ? (
              <Btn primary type="button" onClick={finish} disabled={busy}>
                {busy ? '…' : (lang === 'es' ? 'Entrar al dashboard' : 'Go to dashboard')}
              </Btn>
            ) : (
              <Btn primary type="button" onClick={next} disabled={savingBilling}>
                {savingBilling ? '…' : (lang === 'es' ? 'Continuar' : 'Continue')}
              </Btn>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
