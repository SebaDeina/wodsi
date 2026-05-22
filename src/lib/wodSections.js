/** @typedef {'rounds' | 'emom' | 'amrap' | 'fortime' | 'tabata' | 'strength' | 'custom'} WodSectionKind */

/**
 * @typedef {Object} WodSection
 * @property {string} id
 * @property {WodSectionKind} kind
 * @property {string} header
 * @property {number | null} [rounds]
 * @property {string[]} lines
 */

export function newSectionId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function emptySection() {
  return { id: newSectionId(), kind: 'rounds', header: '', rounds: 3, lines: [''] }
}

function detectHeader(line) {
  const t = line.trim()
  if (!t) return null

  const vueltas = t.match(/^(\d+)\s*vueltas/i)
  if (vueltas) {
    return { kind: 'rounds', header: t, rounds: parseInt(vueltas[1], 10) }
  }
  if (/^emom/i.test(t)) return { kind: 'emom', header: t, rounds: null }
  if (/^amrap/i.test(t)) return { kind: 'amrap', header: t, rounds: null }
  if (/^for\s+time/i.test(t)) return { kind: 'fortime', header: t, rounds: null }
  if (/^tabata/i.test(t)) return { kind: 'tabata', header: t, rounds: null }
  if (/^(strength|fuerza|accesorios)/i.test(t)) return { kind: 'strength', header: t, rounds: null }
  return null
}

/** Convierte texto pegado (como WhatsApp/Notas) en bloques. */
export function parseWodText(text) {
  const rawLines = (text || '').split(/\r?\n/)
  /** @type {WodSection[]} */
  const sections = []
  /** @type {WodSection | null} */
  let current = null

  function flush() {
    if (!current) return
    const lines = current.lines.map(l => l.trim()).filter(Boolean)
    if (current.header.trim() || lines.length) {
      sections.push({ ...current, lines })
    }
    current = null
  }

  function startFromHeader(headerLine) {
    flush()
    const det = detectHeader(headerLine)
    if (det) {
      current = {
        id: newSectionId(),
        kind: det.kind,
        header: det.header,
        rounds: det.rounds ?? null,
        lines: [],
      }
      return
    }
    current = {
      id: newSectionId(),
      kind: 'custom',
      header: headerLine.trim(),
      rounds: null,
      lines: [],
    }
  }

  for (const line of rawLines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }
    const asHeader = detectHeader(trimmed)
    if (asHeader) {
      startFromHeader(trimmed)
      continue
    }
    if (!current) {
      current = {
        id: newSectionId(),
        kind: 'custom',
        header: '',
        rounds: null,
        lines: [],
      }
    }
    current.lines.push(trimmed)
  }
  flush()
  return sections
}

export function normalizeSections(input) {
  if (!Array.isArray(input)) return []
  return input
    .map(s => ({
      id: s.id || newSectionId(),
      kind: s.kind || 'custom',
      header: (s.header || '').trim(),
      rounds: typeof s.rounds === 'number' ? s.rounds : null,
      lines: Array.isArray(s.lines) ? s.lines.map(l => String(l).trim()).filter(Boolean) : [],
    }))
    .filter(s => s.header || s.lines.length)
}

/** Texto plano para preview, búsqueda y WODs viejos. */
export function sectionsToPlainText(sections) {
  return normalizeSections(sections)
    .map(s => {
      const head = s.header || sectionDefaultHeader(s)
      const body = s.lines.join('\n')
      return body ? `${head}\n${body}` : head
    })
    .filter(Boolean)
    .join('\n\n')
}

export function sectionDefaultHeader(section, lang = 'es') {
  if (section.header) return section.header
  if (section.kind === 'rounds' && section.rounds) {
    return lang === 'es' ? `${section.rounds} vueltas` : `${section.rounds} rounds`
  }
  const labels = {
    emom: 'EMOM',
    amrap: 'AMRAP',
    fortime: 'FOR TIME',
    tabata: 'TABATA',
    strength: lang === 'es' ? 'FUERZA' : 'STRENGTH',
    custom: lang === 'es' ? 'BLOQUE' : 'BLOCK',
  }
  return labels[section.kind] || 'WOD'
}

export function wodSectionsFromDoc(wod, lang = 'es') {
  const fromArray = normalizeSections(wod?.sections)
  if (fromArray.length) return fromArray
  if (wod?.description?.trim()) return parseWodText(wod.description)
  return []
}

export function wodPreviewLines(wod, maxLines = 4, lang = 'es') {
  const sections = wodSectionsFromDoc(wod, lang)
  if (!sections.length) return wod?.description?.split('\n').filter(Boolean).slice(0, maxLines) || []
  const lines = []
  for (const s of sections) {
    if (lines.length >= maxLines) break
    lines.push(s.header || sectionDefaultHeader(s, lang))
    for (const l of s.lines) {
      if (lines.length >= maxLines) break
      lines.push(l)
    }
  }
  return lines
}

export const SECTION_KINDS = [
  { value: 'rounds', labelEs: 'Vueltas / series', labelEn: 'Rounds / sets' },
  { value: 'strength', labelEs: 'Fuerza / accesorios', labelEn: 'Strength / accessories' },
  { value: 'emom', labelEs: 'EMOM', labelEn: 'EMOM' },
  { value: 'amrap', labelEs: 'AMRAP', labelEn: 'AMRAP' },
  { value: 'fortime', labelEs: 'For Time', labelEn: 'For Time' },
  { value: 'tabata', labelEs: 'Tabata', labelEn: 'Tabata' },
  { value: 'custom', labelEs: 'Otro bloque', labelEn: 'Other block' },
]
