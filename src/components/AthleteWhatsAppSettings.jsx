import { useState, useEffect, useMemo } from 'react'
import { W } from '../tokens'
import { Btn } from './Btn'
import {
  normalizeWhatsAppPhone,
  formatWhatsAppDisplay,
  hasWhatsAppPhone,
  digitsOnly,
} from '../lib/phone'

const inp = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  boxSizing: 'border-box',
  border: `1px solid ${W.c.lineDim}`,
  background: W.c.bg2,
  color: W.c.text,
  fontFamily: W.font.mono,
  fontSize: 14,
  outline: 'none',
}

function displayFromProfile(profile) {
  return profile?.whatsappDisplay || formatWhatsAppDisplay(profile?.whatsappPhone) || ''
}

function inputMatchesSaved(input, profile) {
  if (!hasWhatsAppPhone(profile)) return false
  const parsed = normalizeWhatsAppPhone(input)
  if (!parsed.ok) return false
  return parsed.e164 === digitsOnly(profile.whatsappPhone)
}

export function AthleteWhatsAppSettings({ profile, lang, onSave }) {
  const saved = hasWhatsAppPhone(profile)
  const [editing, setEditing] = useState(!saved)
  const [value, setValue] = useState(() => displayFromProfile(profile))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (!editing) {
      setValue(displayFromProfile(profile))
      setError('')
    }
  }, [profile?.whatsappPhone, profile?.whatsappDisplay, editing])

  const parsed = useMemo(() => normalizeWhatsAppPhone(value), [value])
  const unchanged = saved && inputMatchesSaved(value, profile)
  const canSave = parsed.ok && !unchanged && !saving

  function startEdit() {
    setValue(displayFromProfile(profile))
    setError('')
    setSavedFlash(false)
    setEditing(true)
  }

  function cancelEdit() {
    setValue(displayFromProfile(profile))
    setError('')
    setEditing(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!parsed.ok) {
      setError(
        lang === 'es'
          ? 'Ingresá un celular válido (ej. 11 6221-555123).'
          : 'Enter a valid mobile number (e.g. 11 6221-555123).',
      )
      return
    }
    if (!canSave) return
    setError('')
    setSaving(true)
    try {
      await onSave(parsed.e164, parsed.display)
      setEditing(false)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 3000)
    } catch {
      setError(lang === 'es' ? 'No se pudo guardar. Intentá de nuevo.' : 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const saveLabel = !saved
    ? (lang === 'es' ? 'Guardar número' : 'Save number')
    : (lang === 'es' ? 'Guardar cambios' : 'Save changes')

  return (
    <section
      style={{
        background: W.c.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: `1px solid ${saved ? '#25D36640' : W.c.lineDim}`,
      }}
      aria-labelledby="athlete-wa-heading"
    >
      <div
        id="athlete-wa-heading"
        style={{
          fontSize: 12,
          fontFamily: W.font.mono,
          color: saved ? '#25D366' : W.c.mute,
          letterSpacing: 0.8,
          marginBottom: 8,
        }}
      >
        {lang === 'es' ? 'TU WHATSAPP' : 'YOUR WHATSAPP'}
      </div>
      <p style={{ fontSize: 12, color: W.c.dim, lineHeight: 1.5, margin: '0 0 16px' }}>
        {lang === 'es'
          ? 'Tu coach envía avisos del box a este número. No vemos tus chats.'
          : 'Your coach sends gym notices to this number. We never read your chats.'}
      </p>

      {savedFlash && (
        <div
          role="status"
          style={{
            fontSize: 12,
            color: W.c.lime,
            fontFamily: W.font.mono,
            marginBottom: 12,
            padding: '8px 12px',
            borderRadius: 8,
            background: `${W.c.lime}14`,
          }}
        >
          {lang === 'es' ? 'Número actualizado.' : 'Number updated.'}
        </div>
      )}

      {!editing && saved ? (
        <div>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: W.c.bg2,
              border: `1px solid ${W.c.lineDim}`,
            }}
          >
            <div style={{ fontSize: 11, fontFamily: W.font.mono, color: W.c.mute, marginBottom: 6 }}>
              {lang === 'es' ? 'NÚMERO REGISTRADO' : 'REGISTERED NUMBER'}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, fontFamily: W.font.mono, letterSpacing: -0.3 }}>
              {displayFromProfile(profile)}
            </div>
          </div>
          <Btn ghost sm type="button" onClick={startEdit} style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
            {lang === 'es' ? 'Cambiar número' : 'Change number'}
          </Btn>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="athlete-wa-input" style={{ display: 'block', fontSize: 11, color: W.c.mute, marginBottom: 6 }}>
            {saved
              ? (lang === 'es' ? 'Nuevo número' : 'New number')
              : (lang === 'es' ? 'Tu celular' : 'Mobile number')}
          </label>
          <input
            id="athlete-wa-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value}
            onChange={e => { setValue(e.target.value); setError('') }}
            placeholder={lang === 'es' ? '11 6221-555123' : '11 6221-555123'}
            style={{
              ...inp,
              border: `1px solid ${error ? W.c.red : W.c.lineDim}`,
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'athlete-wa-error' : undefined}
          />
          {error && (
            <div id="athlete-wa-error" role="alert" style={{ fontSize: 11, color: W.c.red, marginTop: 8 }}>
              {error}
            </div>
          )}
          {!error && value && !parsed.ok && (
            <div style={{ fontSize: 11, color: W.c.orange, marginTop: 8 }}>
              {lang === 'es' ? 'Revisá el formato del número.' : 'Check the number format.'}
            </div>
          )}
          {!error && unchanged && saved && (
            <div style={{ fontSize: 11, color: W.c.mute, marginTop: 8 }}>
              {lang === 'es' ? 'Sin cambios respecto al número guardado.' : 'No changes from saved number.'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <Btn
              primary
              sm
              type="submit"
              disabled={!canSave}
              style={{ width: '100%', justifyContent: 'center', opacity: canSave ? 1 : 0.45 }}
            >
              {saving ? '…' : saveLabel}
            </Btn>
            {saved && (
              <Btn ghost sm type="button" onClick={cancelEdit} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </Btn>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
