import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { W } from '../tokens'
import { Btn } from '../components/Btn'
import { normalizeWhatsAppPhone, formatWhatsAppDisplay, hasWhatsAppPhone } from '../lib/phone'
import { DesktopChrome } from '../components/DesktopChrome'
import { CoachHeader } from './coach/CoachHeader'
import { Avatar } from '../components/Avatar'
import { AthleteShell } from '../components/AthleteShell'
import { CoachBillingSettings } from '../components/CoachBillingSettings'

export default function Settings() {
  const { user, profile, updateLang, updateWhatsAppPhone, logout } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [waInput, setWaInput] = useState('')
  const [waSaving, setWaSaving] = useState(false)
  const [waError, setWaError] = useState('')

  const isCoach = profile?.role === 'coach'

  useEffect(() => {
    if (!isCoach && profile) {
      setWaInput(profile.whatsappDisplay || profile.whatsappPhone || '')
    }
  }, [isCoach, profile?.whatsappPhone, profile?.whatsappDisplay])

  function handleLang(l) {
    setLang(l)
    updateLang(l)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function copyId() {
    navigator.clipboard.writeText(user?.uid || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveWhatsApp(e) {
    e.preventDefault()
    setWaError('')
    const parsed = normalizeWhatsAppPhone(waInput)
    if (!parsed.ok) {
      setWaError(lang === 'es'
        ? 'Ingresá un celular válido (ej. 11 6221-555123 o +54 9 11 6221-555123).'
        : 'Enter a valid mobile number (e.g. 11 6221-555123).')
      return
    }
    setWaSaving(true)
    try {
      await updateWhatsAppPhone(parsed.e164, parsed.display)
    } catch {
      setWaError(lang === 'es' ? 'No se pudo guardar. Intentá de nuevo.' : 'Could not save. Try again.')
    } finally {
      setWaSaving(false)
    }
  }

  const waSaved = !isCoach && hasWhatsAppPhone(profile)

  const content = (
    <div style={{ maxWidth: 560, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile card */}
      <div style={{ background: W.c.card, borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar name={profile?.name?.slice(0,2) || user?.email?.slice(0,2) || '?'} size={56} tone="lime" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, fontFamily: W.font.display }}>{profile?.name || user?.displayName || '—'}</div>
          <div style={{ fontSize: 13, color: W.c.mute, marginTop: 2 }}>{user?.email}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ fontFamily: W.font.mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: W.c.lime, background: W.c.limeSoft, padding: '2px 8px', borderRadius: 4 }}>
              {profile?.role?.toUpperCase() || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div style={{ background: W.c.card, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 16 }}>
          {lang === 'es' ? 'IDIOMA' : 'LANGUAGE'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ val: 'es', label: 'Español' }, { val: 'en', label: 'English' }].map(l => (
            <button key={l.val} onClick={() => handleLang(l.val)} style={{
              flex: 1, padding: '14px', borderRadius: 12, border: 'none',
              background: lang === l.val ? W.c.lime : W.c.cardHi,
              color: lang === l.val ? W.c.bg : W.c.text,
              fontFamily: W.font.sans, fontWeight: 600, fontSize: 15, cursor: 'pointer',
              boxShadow: lang === l.val ? `0 6px 20px ${W.c.lime}30` : 'none',
            }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {isCoach && (
        <div style={{ background: W.c.card, borderRadius: 16, padding: 24 }}>
          <CoachBillingSettings lang={lang} />
        </div>
      )}

      {/* Coach ID (for coaches to share with athletes) */}
      {isCoach && (
        <div style={{ background: W.c.card, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 10 }}>
            {lang === 'es' ? 'TU ID DE COACH' : 'YOUR COACH ID'}
          </div>
          <div style={{ fontSize: 13, color: W.c.dim, marginBottom: 16, lineHeight: 1.5 }}>
            {lang === 'es' ? 'Compartí este ID con tus atletas para que puedan registrarse contigo.' : 'Share this ID with your athletes so they can register with you.'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: W.c.bg2, borderRadius: 10, padding: '12px 16px' }}>
            <span style={{ fontFamily: W.font.mono, fontSize: 13, color: W.c.text, flex: 1, wordBreak: 'break-all' }}>
              {user?.uid || '—'}
            </span>
            <button onClick={copyId} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: copied ? W.c.lime : W.c.cardHi,
              color: copied ? W.c.bg : W.c.text,
              fontFamily: W.font.mono, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              letterSpacing: 0.5, flexShrink: 0,
            }}>
              {copied ? '✓ COPIADO' : (lang === 'es' ? 'COPIAR' : 'COPY')}
            </button>
          </div>
        </div>
      )}

      {/* Logout */}
      <div style={{ background: W.c.card, borderRadius: 16, padding: 24 }}>
        <Btn ghost onClick={handleLogout} style={{ color: W.c.red, boxShadow: `inset 0 0 0 1px ${W.c.red}40` }}>
          {lang === 'es' ? 'Cerrar sesión' : 'Sign out'}
        </Btn>
      </div>
    </div>
  )

  if (isCoach) {
    return (
      <DesktopChrome lang={lang}>
        <CoachHeader
          title={lang === 'es' ? 'Configuración' : 'Settings'}
          subtitle={lang === 'es' ? 'Cobros a atletas, cuenta e idioma' : 'Athlete billing, account and language'}
        />
        {content}
      </DesktopChrome>
    )
  }

  return (
    <AthleteShell lang={lang}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, fontFamily: W.font.display, marginBottom: 24 }}>
        {lang === 'es' ? 'Ajustes' : 'Settings'}
      </div>

      <div style={{ background: W.c.card, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <Avatar name={profile?.name?.slice(0, 2) || '?'} size={44} tone="lime" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{profile?.name || '—'}</div>
          <div style={{ fontSize: 12, color: W.c.mute, marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      <form
        onSubmit={saveWhatsApp}
        style={{ background: W.c.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${waSaved ? '#25D36640' : W.c.lineDim}` }}
      >
        <div style={{ fontSize: 12, fontFamily: W.font.mono, color: waSaved ? '#25D366' : W.c.mute, letterSpacing: 0.8, marginBottom: 8 }}>
          {lang === 'es' ? 'TU WHATSAPP' : 'YOUR WHATSAPP'}
        </div>
        <p style={{ fontSize: 12, color: W.c.dim, lineHeight: 1.5, margin: '0 0 14px' }}>
          {lang === 'es'
            ? 'Tu coach te va a enviar avisos del box a este número. No compartimos tus chats con nadie.'
            : 'Your coach will send gym notices to this number. We never show your chats to anyone.'}
        </p>
        <input
          type="tel"
          value={waInput}
          onChange={e => { setWaInput(e.target.value); setWaError('') }}
          placeholder={lang === 'es' ? '11 6221-555123' : '11 6221-555123'}
          required
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
            border: `1px solid ${waError ? W.c.red : W.c.lineDim}`, background: W.c.bg2,
            color: W.c.text, fontFamily: W.font.mono, fontSize: 14, outline: 'none',
          }}
        />
        {waError && (
          <div style={{ fontSize: 11, color: W.c.red, marginTop: 8 }}>{waError}</div>
        )}
        {waSaved && !waError && (
          <div style={{ fontSize: 11, color: '#25D366', marginTop: 8, fontFamily: W.font.mono }}>
            ✓ {profile.whatsappDisplay || formatWhatsAppDisplay(profile.whatsappPhone)}
          </div>
        )}
        <Btn primary sm type="submit" disabled={waSaving} style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
          {waSaving ? '…' : (lang === 'es' ? 'Guardar número' : 'Save number')}
        </Btn>
      </form>

      <div style={{ background: W.c.card, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 14 }}>
          {lang === 'es' ? 'IDIOMA' : 'LANGUAGE'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ val: 'es', label: 'Español' }, { val: 'en', label: 'English' }].map(l => (
            <button key={l.val} type="button" onClick={() => handleLang(l.val)} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: lang === l.val ? W.c.lime : W.c.cardHi,
              color: lang === l.val ? W.c.bg : W.c.text,
              fontFamily: W.font.sans, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: W.c.card, borderRadius: 16, padding: 20 }}>
        <button type="button" onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: W.c.red, fontFamily: W.font.sans, fontWeight: 600, fontSize: 15, cursor: 'pointer', padding: 0 }}>
          {lang === 'es' ? 'Cerrar sesión' : 'Sign out'}
        </button>
      </div>
    </AthleteShell>
  )
}
