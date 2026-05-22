import { formatEmomTimerKind } from './emomDisplay'

const STORAGE_KEY = 'wodsi_timer_wod'

export function saveTimerWod(wod) {
  if (!wod) {
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(wod))
  } catch { /* ignore */ }
}

export function clearTimerWod() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function loadTimerWod() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function parseEmomRounds(header = '') {
  const slash = header.match(/(\d+)\s*\/\s*(\d+)/)
  if (slash) return parseInt(slash[2], 10)
  const mins = header.match(/(\d+)\s*['']?\s*min/i) || header.match(/emom\s*(\d+)/i)
  if (mins) return parseInt(mins[1], 10)
  return null
}

function sectionLines(section) {
  return (section?.lines || []).map(l => (l || '').trim()).filter(Boolean)
}

function parseTabataFromSection(section) {
  if (!section) return null
  const h = section.header || ''
  const roundsM = h.match(/(\d+)\s*(?:rds?|rounds?|vueltas)/i) || h.match(/tabata\s*(\d+)/i)
  const workRest = h.match(/(\d+)\s*[/:]\s*(\d+)/)
  return {
    rounds: roundsM ? parseInt(roundsM[1], 10) : null,
    workSeconds: workRest ? parseInt(workRest[1], 10) : null,
    restSeconds: workRest ? parseInt(workRest[2], 10) : null,
  }
}

export function timerLabelFromWod(wod, lang = 'es') {
  if (!wod) return lang === 'es' ? 'Timer libre' : 'Open timer'
  return wod.title || (lang === 'es' ? 'Trabajo del día' : "Today's session")
}

/** Configs derivados del WOD del coach (sesión). */
export function timerConfigsFromWod(wod, lang = 'es') {
  const durationMin = wod?.duration || 20
  const emomSection = wod?.sections?.find(s => s.kind === 'emom')
  const amrapSection = wod?.sections?.find(s => s.kind === 'amrap')
  const tabataSection = wod?.sections?.find(s => s.kind === 'tabata')
  const fortimeSection = wod?.sections?.find(s => s.kind === 'fortime')
  const emomRounds = parseEmomRounds(emomSection?.header) || durationMin || 12
  const tabataParsed = parseTabataFromSection(tabataSection)

  const sub = (section) => {
    if (!section) return ''
    const lines = section.lines?.slice(0, 2).join(' · ')
    return section.header ? `${section.header}${lines ? ` — ${lines}` : ''}` : lines
  }

  const emomLines = sectionLines(emomSection)

  return {
    amrap: {
      totalSeconds: durationMin * 60,
      kind: amrapSection?.header || `AMRAP ${durationMin}`,
      sub: sub(amrapSection) || (lang === 'es' ? 'Tantas rondas como puedas' : 'As many rounds as possible'),
    },
    emom: {
      rounds: emomRounds,
      minuteSeconds: 60,
      kind: formatEmomTimerKind(emomSection, emomRounds, lang),
      sub: wod?.title?.trim() || '',
      lines: emomLines,
    },
    fortime: {
      capSeconds: durationMin * 60,
      kind: fortimeSection?.header || (wod?.type === 'For Time' ? `FOR TIME · CAP ${durationMin}` : `FOR TIME · CAP ${durationMin}`),
      sub: sub(fortimeSection) || wod?.sections?.[0]?.lines?.[0] || wod?.title || '',
    },
    tabata: {
      rounds: tabataParsed?.rounds || 8,
      workSeconds: tabataParsed?.workSeconds || 20,
      restSeconds: tabataParsed?.restSeconds || 10,
      kind: tabataSection?.header || 'TABATA · 8 rds',
      sub: sub(tabataSection) || '20s trabajo · 10s descanso',
    },
  }
}

/**
 * Config final para un modo: sesión del coach (wod) o preferencias del atleta.
 * @param {'amrap'|'emom'|'fortime'|'tabata'} mode
 */
export function buildTimerConfig(mode, { wod = null, prefs, lang = 'es' }) {
  const fromWod = wod ? timerConfigsFromWod(wod, lang)[mode] : null
  const p = prefs?.[mode]

  switch (mode) {
    case 'amrap': {
      const totalSeconds = fromWod?.totalSeconds ?? (p?.totalMinutes || 20) * 60
      return {
        totalSeconds,
        kind: fromWod?.kind ?? `AMRAP ${Math.round(totalSeconds / 60)}`,
        sub: fromWod?.sub ?? (lang === 'es' ? 'Tantas rondas como puedas' : 'As many rounds as possible'),
      }
    }
    case 'emom': {
      const rounds = fromWod?.rounds ?? p?.rounds ?? 12
      const minuteSeconds = fromWod?.minuteSeconds ?? p?.minuteSeconds ?? 60
      return {
        rounds,
        minuteSeconds,
        kind: fromWod?.kind ?? `EMOM · ${rounds}`,
        sub: fromWod?.sub ?? '',
        lines: fromWod?.lines ?? [],
      }
    }
    case 'fortime': {
      const capMin = fromWod ? Math.round((fromWod.capSeconds || 0) / 60) : p?.capMinutes
      const capSeconds = fromWod?.capSeconds ?? (capMin ? capMin * 60 : null)
      return {
        capSeconds,
        kind: fromWod?.kind ?? (capSeconds ? `FOR TIME · CAP ${Math.round(capSeconds / 60)}` : 'FOR TIME'),
        sub: fromWod?.sub ?? '',
      }
    }
    case 'tabata': {
      const rounds = fromWod?.rounds ?? p?.rounds ?? 8
      const workSeconds = fromWod?.workSeconds ?? p?.workSeconds ?? 20
      const restSeconds = fromWod?.restSeconds ?? p?.restSeconds ?? 10
      return {
        rounds,
        workSeconds,
        restSeconds,
        kind: fromWod?.kind ?? `TABATA · ${rounds} rds`,
        sub: fromWod?.sub ?? `${workSeconds}s ${lang === 'es' ? 'trabajo' : 'work'} · ${restSeconds}s ${lang === 'es' ? 'descanso' : 'rest'}`,
      }
    }
    default:
      return {}
  }
}

export function formatTimerDisplay(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
