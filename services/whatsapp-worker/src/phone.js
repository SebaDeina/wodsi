/** Dígitos para chatId de WhatsApp (AR móvil suele necesitar 549…). */

export function digitsOnly(input) {
  return String(input || '').replace(/\D/g, '')
}

export function chatIdFromPhone(phone) {
  let d = digitsOnly(phone)
  if (!d) return null

  if (d.startsWith('00')) d = d.slice(2)

  if (!d.startsWith('54')) {
    if (d.startsWith('0')) d = `54${d.slice(1)}`
    else if (d.length === 10 && d.startsWith('9')) d = `54${d}`
    else if (d.length >= 8 && d.length <= 11) d = `54${d}`
  }

  // 54 + área sin el 9 móvil (12 dígitos) → insertar 9 después del 54
  if (d.startsWith('54') && d.length === 12 && d[2] !== '9') {
    d = `549${d.slice(2)}`
  }

  if (d.length < 12 || d.length > 15) return null
  return `${d}@c.us`
}
