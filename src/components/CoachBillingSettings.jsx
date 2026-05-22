import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { W } from '../tokens'
import { Btn } from './Btn'
import { useCoachBilling } from '../hooks/useCoachBilling'

const MODES = [
  { id: 'alias', es: 'Solo alias / transferencia', en: 'Alias / transfer only' },
  { id: 'cash', es: 'Solo efectivo', en: 'Cash only' },
  { id: 'both', es: 'Alias y efectivo', en: 'Alias and cash' },
]

export function CoachBillingSettings({ lang, compact = false }) {
  const navigate = useNavigate()
  const { billing, loading, saving, error, saveBilling } = useCoachBilling()
  const [form, setForm] = useState(billing)

  useEffect(() => { setForm(billing) }, [billing])

  const inp = {
    width: '100%', padding: '11px 12px', borderRadius: 8, boxSizing: 'border-box',
    border: `1px solid ${W.c.lineDim}`, background: W.c.bg2, color: W.c.text,
    fontFamily: W.font.sans, fontSize: 13, outline: 'none',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await saveBilling(form)
  }

  if (loading) {
    return (
      <div style={{ padding: compact ? 0 : 24, fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>
        {lang === 'es' ? 'Cargando cobros…' : 'Loading billing…'}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 8 }}>
          {lang === 'es' ? 'COBRO A ATLETAS' : 'ATHLETE PAYMENTS'}
        </div>
        <p style={{ fontSize: 13, color: W.c.dim, margin: '0 0 14px', lineHeight: 1.5 }}>
          {lang === 'es'
            ? 'Estos datos se usan en WhatsApp ({{monto}}, {{alias}}) y en la pantalla de suscripción del atleta.'
            : 'Used in WhatsApp templates ({{monto}}, {{alias}}) and the athlete subscription screen.'}
        </p>
      </div>

      <div>
        <label style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, display: 'block', marginBottom: 8 }}>
          {lang === 'es' ? 'MODO DE COBRO' : 'PAYMENT MODE'}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setForm(f => ({ ...f, athletePaymentMode: m.id }))}
              style={{
                padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                border: `1px solid ${form.athletePaymentMode === m.id ? W.c.lime : W.c.lineDim}`,
                background: form.athletePaymentMode === m.id ? W.c.limeSoft : W.c.bg2,
                color: W.c.text, fontFamily: W.font.sans, fontSize: 13, fontWeight: form.athletePaymentMode === m.id ? 600 : 500,
              }}
            >
              {lang === 'es' ? m.es : m.en}
            </button>
          ))}
        </div>
      </div>

      {(form.athletePaymentMode === 'alias' || form.athletePaymentMode === 'both') && (
        <>
          <div>
            <label style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, display: 'block', marginBottom: 6 }}>
              {lang === 'es' ? 'ALIAS / CVU' : 'ALIAS / CVU'}
            </label>
            <input
              value={form.paymentAlias}
              onChange={e => setForm(f => ({ ...f, paymentAlias: e.target.value }))}
              placeholder="mi.box.mp"
              style={inp}
            />
          </div>
          <div>
            <label style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, display: 'block', marginBottom: 6 }}>
              {lang === 'es' ? 'TITULAR (opcional)' : 'ACCOUNT NAME (optional)'}
            </label>
            <input
              value={form.paymentHolder}
              onChange={e => setForm(f => ({ ...f, paymentHolder: e.target.value }))}
              style={inp}
            />
          </div>
        </>
      )}

      <div>
        <label style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, display: 'block', marginBottom: 6 }}>
          {lang === 'es' ? 'PRECIO / MEMBRESÍA' : 'PRICE / MEMBERSHIP'}
        </label>
        <input
          value={form.membershipAmount}
          onChange={e => setForm(f => ({ ...f, membershipAmount: e.target.value }))}
          placeholder={lang === 'es' ? '$45.000 / mes' : '$45,000 / month'}
          style={inp}
        />
      </div>

      {(form.athletePaymentMode === 'cash' || form.athletePaymentMode === 'both') && (
        <div>
          <label style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, display: 'block', marginBottom: 6 }}>
            {lang === 'es' ? 'INSTRUCCIONES EFECTIVO' : 'CASH INSTRUCTIONS'}
          </label>
          <textarea
            value={form.cashInstructions}
            onChange={e => setForm(f => ({ ...f, cashInstructions: e.target.value }))}
            rows={3}
            placeholder={lang === 'es' ? 'Efectivo en recepción, lun–vie 7–10h' : 'Cash at front desk, Mon–Fri 7–10am'}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.45 }}
          />
        </div>
      )}

      <div>
        <label style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, display: 'block', marginBottom: 6 }}>
          {lang === 'es' ? 'NOTA EXTRA' : 'EXTRA NOTE'}
        </label>
        <textarea
          value={form.paymentNotes}
          onChange={e => setForm(f => ({ ...f, paymentNotes: e.target.value }))}
          rows={2}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.45 }}
        />
      </div>

      {error && <div style={{ fontSize: 12, color: W.c.red }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn primary sm type="submit" disabled={saving}>
          {saving ? '…' : (lang === 'es' ? 'Guardar configuración' : 'Save settings')}
        </Btn>
        {compact && (
          <Btn ghost sm type="button" onClick={() => navigate('/settings')}>
            {lang === 'es' ? 'Abrir en Ajustes' : 'Open in Settings'}
          </Btn>
        )}
      </div>
    </form>
  )
}
