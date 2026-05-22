/** @typedef {'amrap' | 'emom' | 'fortime' | 'tabata'} TimerMode */

/**
 * @typedef {Object} AmrapPrefs
 * @property {number} totalMinutes
 *
 * @typedef {Object} EmomPrefs
 * @property {number} rounds
 * @property {number} minuteSeconds
 *
 * @typedef {Object} ForTimePrefs
 * @property {number|null} capMinutes
 *
 * @typedef {Object} TabataPrefs
 * @property {number} rounds
 * @property {number} workSeconds
 * @property {number} restSeconds
 *
 * @typedef {Record<TimerMode, AmrapPrefs | EmomPrefs | ForTimePrefs | TabataPrefs>} AthleteTimerPrefs
 */

export const DEFAULT_ATHLETE_TIMER_PREFS = {
  beepsEnabled: true,
  amrap: { totalMinutes: 20 },
  emom: { rounds: 12, minuteSeconds: 60 },
  fortime: { capMinutes: 20 },
  tabata: { rounds: 8, workSeconds: 20, restSeconds: 10 },
}

function storageKey(uid) {
  return `wodsi_athlete_timer_prefs_${uid || 'guest'}`
}

export function loadAthleteTimerPrefs(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) return { ...DEFAULT_ATHLETE_TIMER_PREFS }
    const parsed = JSON.parse(raw)
    return {
      beepsEnabled: parsed.beepsEnabled !== false,
      amrap: { ...DEFAULT_ATHLETE_TIMER_PREFS.amrap, ...parsed.amrap },
      emom: { ...DEFAULT_ATHLETE_TIMER_PREFS.emom, ...parsed.emom },
      fortime: { ...DEFAULT_ATHLETE_TIMER_PREFS.fortime, ...parsed.fortime },
      tabata: { ...DEFAULT_ATHLETE_TIMER_PREFS.tabata, ...parsed.tabata },
    }
  } catch {
    return { ...DEFAULT_ATHLETE_TIMER_PREFS }
  }
}

export function saveAthleteTimerPrefs(uid, prefs) {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(prefs))
  } catch { /* ignore */ }
}

export function prefsSummary(mode, prefs, lang, formatTimerDisplay) {
  const p = prefs[mode]
  switch (mode) {
    case 'amrap':
      return formatTimerDisplay(p.totalMinutes * 60)
    case 'emom':
      return `${p.rounds}×${p.minuteSeconds}s`
    case 'fortime':
      return p.capMinutes
        ? `CAP ${formatTimerDisplay(p.capMinutes * 60)}`
        : (lang === 'es' ? 'Sin cap' : 'No cap')
    case 'tabata':
      return `${p.rounds}× ${p.workSeconds}/${p.restSeconds}s`
    default:
      return ''
  }
}
