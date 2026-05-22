import { useMemo, useState } from 'react'
import { W } from '../tokens'
import { Avatar } from './Avatar'
import { hasWhatsAppPhone, formatWhatsAppDisplay } from '../lib/phone'

const WA = '#25D366'

/**
 * Lista solo atletas del roster del coach (no chats de WhatsApp).
 */
export function WhatsAppAthletePicker({
  athletes,
  loading,
  selectedId,
  onSelect,
  lang,
  searchPlaceholder,
  compact = false,
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return athletes
    return athletes.filter(a =>
      (a.name || '').toLowerCase().includes(term)
      || (a.email || '').toLowerCase().includes(term)
      || (a.whatsappDisplay || '').includes(term),
    )
  }, [athletes, q])

  const withPhone = athletes.filter(hasWhatsAppPhone).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${W.c.lineDim}` }}>
        <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.6, marginBottom: 8 }}>
          {lang === 'es' ? 'TUS ATLETAS' : 'YOUR ATHLETES'}
          {' · '}
          <span style={{ color: withPhone ? WA : W.c.orange }}>
            {withPhone}/{athletes.length} {lang === 'es' ? 'con WhatsApp' : 'with WhatsApp'}
          </span>
        </div>
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={searchPlaceholder || (lang === 'es' ? 'Buscar atleta…' : 'Search athlete…')}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
            border: `1px solid ${W.c.lineDim}`, background: W.c.bg2, color: W.c.text,
            fontFamily: W.font.sans, fontSize: 13, outline: 'none',
          }}
        />
        {!compact && (
          <p style={{ fontSize: 11, color: W.c.dim, margin: '10px 0 0', lineHeight: 1.45 }}>
            {lang === 'es'
              ? 'Solo atletas de tu roster con número cargado en la app.'
              : 'Only roster athletes who added their number in the app.'}
          </p>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {loading ? (
          <div style={{ padding: 16, fontFamily: W.font.mono, fontSize: 11, color: W.c.mute }}>
            {lang === 'es' ? 'CARGANDO…' : 'LOADING…'}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12, color: W.c.dim }}>
            {lang === 'es' ? 'Sin atletas.' : 'No athletes.'}
          </div>
        ) : filtered.map((a, i) => {
          const sel = a.id === selectedId
          const hasWa = hasWhatsAppPhone(a)
          const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', marginBottom: 4, borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${sel ? WA : 'transparent'}`,
                background: sel ? 'rgba(37, 211, 102, 0.12)' : (i % 2 ? 'transparent' : `${W.c.cardHi}60`),
                textAlign: 'left', color: W.c.text,
              }}
            >
              <Avatar name={initials} size={32} tone={hasWa ? 'lime' : 'mute'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.name || a.email || '—'}
                </div>
                <div style={{ fontFamily: W.font.mono, fontSize: 10, color: hasWa ? WA : W.c.orange, marginTop: 2 }}>
                  {hasWa
                    ? (a.whatsappDisplay || formatWhatsAppDisplay(a.whatsappPhone))
                    : (lang === 'es' ? 'Sin número en la app' : 'No number in app')}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
