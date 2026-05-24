import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { normalizeWhatsAppPhone } from '../../lib/phone'
import { renderWhatsAppTemplate, athleteTemplateVars } from '../../lib/whatsappTemplate'
import { queueWelcomeWhatsApp } from '../../lib/queueWelcomeWhatsApp'
import { W } from '../../tokens'
import { Btn } from '../../components/Btn'
import { WodsiLogo } from '../../components/WodsiLogo'

export default function AthleteOnboarding() {
  const { user, profile, updateWhatsAppPhone } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [welcomeRule, setWelcomeRule] = useState(null)

  useEffect(() => {
    if (profile?.whatsappPhone) {
      navigate('/athlete', { replace: true })
    }
  }, [profile?.whatsappPhone, navigate])

  useEffect(() => {
    const coachId = profile?.coachId
    if (!coachId) return
    async function loadWelcomeRule() {
      try {
        const q = query(
          collection(db, 'whatsapp_rules'),
          where('coachId', '==', coachId),
          where('triggerKey', '==', 'on_signup'),
          where('active', '==', true),
        )
        const snap = await getDocs(q)
        if (!snap.empty) setWelcomeRule({ id: snap.docs[0].id, ...snap.docs[0].data() })
      } catch { /* rule not available yet */ }
    }
    loadWelcomeRule()
  }, [profile?.coachId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = normalizeWhatsAppPhone(phone)
    if (!result.ok) {
      setError(
        result.error === 'EMPTY'
          ? (lang === 'es' ? 'Ingresá tu número.' : 'Enter your phone number.')
          : (lang === 'es' ? 'Número inválido. Ej: 11 1234-5678' : 'Invalid number. E.g. 11 1234-5678'),
      )
      return
    }
    setBusy(true)
    try {
      await updateWhatsAppPhone(result.e164, result.display)

      if (welcomeRule && profile?.coachId) {
        await queueWelcomeWhatsApp({
          athleteId: user.uid,
          coachId: profile.coachId,
          profile,
          phoneE164: result.e164,
          lang,
        })
      }

      navigate('/athlete', { replace: true })
    } catch {
      setError(lang === 'es'
        ? 'No pudimos guardar tu WhatsApp. Revisá el número e intentá de nuevo.'
        : 'We could not save your WhatsApp. Check the number and try again.')
      setBusy(false)
    }
  }

  const previewBody = welcomeRule
    ? (() => {
        try {
          return renderWhatsAppTemplate(
            welcomeRule.template,
            athleteTemplateVars({ ...profile, name: profile?.name || '...' }, {}, null, lang),
          )
        } catch { return '' }
      })()
    : null

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 10,
    border: `1px solid ${error ? W.c.red : W.c.lineDim}`,
    background: W.c.card, color: W.c.text,
    fontFamily: W.font.sans, fontSize: 16,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100dvh', background: W.c.bg, color: W.c.text,
      fontFamily: W.font.sans, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <WodsiLogo size={24} />
        </div>

        <div style={{
          background: W.c.bg2, borderRadius: 20, padding: 32,
          boxShadow: `0 0 0 1px ${W.c.lineDim}`,
        }}>
          <div style={{
            fontFamily: W.font.mono, fontSize: 11, color: W.c.lime,
            letterSpacing: 1.5, marginBottom: 16,
          }}>
            WHATSAPP
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 700, letterSpacing: -0.6,
            margin: '0 0 8px', fontFamily: W.font.display,
          }}>
            {lang === 'es' ? '¿Cuál es tu número?' : 'Your phone number?'}
          </h1>
          <p style={{ fontSize: 14, color: W.c.dim, margin: '0 0 24px', lineHeight: 1.5 }}>
            {lang === 'es'
              ? 'Tu coach te va a enviar WODs y avisos por WhatsApp.'
              : 'Your coach will send WODs and updates via WhatsApp.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="tel"
              placeholder={lang === 'es' ? 'Ej: 11 1234-5678' : 'E.g. 11 1234-5678'}
              value={phone}
              onChange={e => { setPhone(e.target.value); setError('') }}
              autoFocus
              style={inp}
            />
            {error && (
              <div style={{ fontSize: 13, color: W.c.red, fontFamily: W.font.mono }}>{error}</div>
            )}

            {previewBody && (
              <div style={{
                background: W.c.card, borderRadius: 12, padding: '12px 14px',
                border: `1px solid ${W.c.lineDim}`,
              }}>
                <div style={{
                  fontFamily: W.font.mono, fontSize: 10, color: W.c.lime,
                  letterSpacing: 0.8, marginBottom: 8,
                }}>
                  {lang === 'es' ? 'MENSAJE DE BIENVENIDA' : 'WELCOME MESSAGE'}
                </div>
                <div style={{ fontSize: 13, color: W.c.dim, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {previewBody}
                </div>
              </div>
            )}

            <Btn
              primary
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 4 }}
              disabled={busy}
            >
              {busy ? '…' : (lang === 'es' ? 'Guardar y continuar' : 'Save and continue')}
            </Btn>
          </form>

          <button
            type="button"
            onClick={() => navigate('/athlete', { replace: true })}
            style={{
              width: '100%', marginTop: 12, padding: '12px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: W.c.mute, fontFamily: W.font.sans,
            }}
          >
            {lang === 'es' ? 'Omitir por ahora' : 'Skip for now'}
          </button>
        </div>
      </div>
    </div>
  )
}
