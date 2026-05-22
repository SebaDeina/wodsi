import { timerModeName } from './timerModes'

/** Textos y layout del picker / edición (mock relojes/). */
export const TIMER_CATALOG = {
  amrap: {
    color: 'lime',
    big: true,
    tagline: { es: 'Tantas rondas como puedas', en: 'As many rounds as possible' },
    editHint: { es: 'Duración total del AMRAP.', en: 'Total AMRAP duration.' },
  },
  emom: {
    color: 'blue',
    big: false,
    tagline: { es: 'Cada minuto en el minuto', en: 'Every minute on the minute' },
    editHint: { es: 'Cantidad de minutos e intervalo.', en: 'Number of minutes and interval length.' },
  },
  fortime: {
    color: 'orange',
    big: false,
    tagline: { es: 'Lo más rápido posible', en: 'As fast as possible' },
    editHint: { es: 'Tiempo máximo (cap). 0 = sin límite.', en: 'Time cap. 0 = no limit.' },
  },
  tabata: {
    color: 'red',
    big: false,
    tagline: { es: 'Trabajo y descanso por ronda', en: 'Work and rest per round' },
    editHint: { es: 'Rondas y segundos de trabajo / descanso.', en: 'Rounds and work / rest seconds.' },
  },
}

export function timerPickerTitle(lang) {
  return lang === 'es' ? 'ELEGÍ TIMER' : 'PICK TIMER'
}

export function timerPickerSubtitle(lang) {
  return lang === 'es'
    ? 'Tocá un reloj para configurarlo e iniciar.'
    : 'Tap a timer to configure and start.'
}

export function catalogLabel(mode, lang) {
  return timerModeName(mode, lang)
}
