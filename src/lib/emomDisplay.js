/** Líneas numeradas tipo "1) Burpees" → una por minuto. */
export function emomLinesNumbered(lines = []) {
  return (lines || [])
    .map(l => (l || '').trim())
    .filter(Boolean)
    .filter(l => /^\d+[\).]/.test(l))
}

export function emomLineForMinute(lines, minuteIndex) {
  const clean = (lines || []).map(l => (l || '').trim()).filter(Boolean)
  const numbered = emomLinesNumbered(clean)
  if (numbered.length === 0) return clean

  const min = Math.max(1, minuteIndex)
  // Minuto N → línea N en orden (1ª línea = min 1), sin saltar por el número en el texto.
  if (min <= numbered.length) {
    return [numbered[min - 1]]
  }
  return [numbered[(min - 1) % numbered.length]]
}

export function stripEmomLinePrefix(line) {
  return (line || '').replace(/^\d+[\).]\s*/, '').trim()
}

/** Texto del trabajo para un minuto (una línea). */
export function emomWorkText(lines, minuteIndex) {
  return emomLineForMinute(lines, minuteIndex)
    .map(stripEmomLinePrefix)
    .filter(Boolean)
    .join(' · ')
}

/** Título corto para el header del timer (sin mezclar movimientos). */
export function formatEmomTimerKind(section, rounds, lang = 'es') {
  const h = (section?.header || '').trim()
  if (h) {
    const slash = h.match(/(\d+)\s*\/\s*(\d+)/)
    if (slash) {
      return `EMOM · ${slash[2]}'`
    }
    const mins = h.match(/(\d+)\s*['']?\s*min/i) || h.match(/emom\s*(\d+)/i)
    if (mins) return `EMOM · ${mins[1]} min`
    if (h.length <= 28) return h.toUpperCase()
  }
  return `EMOM · ${rounds} ${lang === 'es' ? 'min' : 'min'}`
}

export function emomHeaderTitle(rounds, round, lang) {
  return `EMOM ${rounds} · ${lang === 'es' ? 'MIN' : 'MIN'} ${round} / ${rounds}`
}

export function emomElapsedSeconds(round, remaining, minuteSeconds = 60) {
  const prev = Math.max(0, round - 1) * minuteSeconds
  const inMin = Math.max(0, minuteSeconds - remaining)
  return prev + inMin
}
