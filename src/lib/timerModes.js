/** @typedef {'amrap' | 'emom' | 'fortime' | 'tabata'} TimerMode */

export const TIMER_MODES = /** @type {const} */ (['amrap', 'emom', 'fortime', 'tabata'])

const TYPE_TO_MODE = {
  AMRAP: 'amrap',
  EMOM: 'emom',
  'For Time': 'fortime',
  Tabata: 'tabata',
  Chipper: 'fortime',
  HERO: 'fortime',
  Strength: 'fortime',
  Other: 'amrap',
}

const SECTION_PRIORITY = ['tabata', 'emom', 'amrap', 'fortime']

/**
 * Timer que debe usar el atleta en una sesión del coach.
 * @param {object} [wod]
 * @returns {TimerMode}
 */
export function resolveWodTimerMode(wod) {
  if (wod?.timerMode && TIMER_MODES.includes(wod.timerMode)) return wod.timerMode

  const fromType = TYPE_TO_MODE[wod?.type]
  if (fromType) return fromType

  const sections = wod?.sections || []
  for (const kind of SECTION_PRIORITY) {
    if (sections.some(s => s.kind === kind)) {
      return kind === 'fortime' ? 'fortime' : kind
    }
  }
  return 'amrap'
}

export function timerModePath(mode) {
  return `/timers/${mode}`
}

export function timerModeName(mode, lang = 'es') {
  const names = {
    amrap: 'AMRAP',
    emom: 'EMOM',
    fortime: lang === 'es' ? 'FOR TIME' : 'FOR TIME',
    tabata: 'TABATA',
  }
  return names[mode] || mode.toUpperCase()
}

export function timerModeColor(mode) {
  return { amrap: 'lime', emom: 'blue', fortime: 'orange', tabata: 'red' }[mode] || 'lime'
}

/** Opciones para el coach al publicar un WOD. */
export function coachTimerModeOptions(lang) {
  const auto = lang === 'es' ? 'Auto (según tipo y bloques)' : 'Auto (from type & blocks)'
  return [
    { value: '', label: auto },
    { value: 'amrap', label: 'AMRAP' },
    { value: 'emom', label: 'EMOM' },
    { value: 'fortime', label: 'For Time' },
    { value: 'tabata', label: 'Tabata' },
  ]
}
