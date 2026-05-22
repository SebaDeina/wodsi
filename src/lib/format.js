export function firstName(name, email) {
  const source = (name || '').trim() || (email || '').split('@')[0] || ''
  if (!source) return null
  return source.split(' ')[0]
}

export function initials(name, email) {
  const source = (name || '').trim() || email || '?'
  return source.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
}
