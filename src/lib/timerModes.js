/** @typedef {'amrap' | 'emom' | 'fortime' | 'tabata'} TimerMode */

export const TIMER_MODES = /** @type {const} */ (['amrap', 'emom', 'fortime', 'tabata'])

/**
 * Timer para el atleta: solo si el coach lo eligió en la planificación.
 * @param {object} [wod]
 * @returns {TimerMode | null}
 */
export function resolveWodTimerMode(wod) {
  const mode = wod?.timerMode
  if (mode && TIMER_MODES.includes(mode)) return mode
  return null
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
  const none = lang === 'es' ? 'Sin timer (solo planificación)' : 'No timer (programming only)'
  return [
    { value: '', label: none },
    { value: 'amrap', label: 'AMRAP' },
    { value: 'emom', label: 'EMOM' },
    { value: 'fortime', label: 'For Time' },
    { value: 'tabata', label: 'Tabata' },
  ]
}
