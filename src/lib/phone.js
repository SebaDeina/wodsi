/** Normaliza teléfonos móviles AR para WhatsApp (solo dígitos, prefijo 54). */

export function digitsOnly(input) {
  return String(input || '').replace(/\D/g, '')
}

/**
 * @returns {{ ok: true, e164: string, display: string } | { ok: false, error: string }}
 */
export function normalizeWhatsAppPhone(input) {
  let d = digitsOnly(input)
  if (!d) return { ok: false, error: 'EMPTY' }

  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('54')) {
    // ya incluye país
  } else if (d.startsWith('0')) {
    d = `54${d.slice(1)}`
  } else if (d.length === 10 && d.startsWith('9')) {
    d = `54${d}`
  } else if (d.length === 11 && d.startsWith('15')) {
    d = `54${d.slice(1)}`
  } else if (d.length >= 8 && d.length <= 11) {
    d = `54${d}`
  }

  // Móvil AR sin el 9 (12 dígitos) → 549…
  if (d.startsWith('54') && d.length === 12 && d[2] !== '9') {
    d = `549${d.slice(2)}`
  }

  if (!d.startsWith('54') || d.length < 12 || d.length > 13) {
    return { ok: false, error: 'INVALID' }
  }

  const display = formatWhatsAppDisplay(d)
  return { ok: true, e164: d, display }
}

export function formatWhatsAppDisplay(e164) {
  const d = digitsOnly(e164)
  if (!d.startsWith('54') || d.length < 12) return e164 || ''
  const rest = d.slice(2)
  const area = rest.length > 8 ? rest.slice(0, rest.length - 8) : rest.slice(0, 2)
  const local = rest.slice(area.length)
  return `+54 ${area} ${local.slice(0, 4)}-${local.slice(4)}`.replace(/-$/, '')
}

export function whatsappChatId(e164) {
  const d = digitsOnly(e164)
  return d ? `${d}@c.us` : null
}

export function hasWhatsAppPhone(profile) {
  return Boolean(profile?.whatsappPhone && digitsOnly(profile.whatsappPhone).length >= 12)
}
