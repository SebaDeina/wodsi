const PRESTART_SECONDS = 10
const END_WARNING_SECONDS = 10

/** Ganancia global (más alto = más volumen en el gym). */
const MASTER_VOLUME = 2.4

let audioCtx = null
let masterGain = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = MASTER_VOLUME
    masterGain.connect(audioCtx.destination)
  }
  return audioCtx
}

function getMaster() {
  const ctx = getCtx()
  if (!ctx) return null
  if (!masterGain) {
    masterGain = ctx.createGain()
    masterGain.gain.value = MASTER_VOLUME
    masterGain.connect(ctx.destination)
  }
  return masterGain
}

/** Llamar en el primer tap del usuario (requerido en iOS). */
export async function unlockTimerAudio() {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch { /* ignore */ }
  }
}

function playTone({ frequency, duration, gain = 0.5, type = 'square' }) {
  const ctx = getCtx()
  const master = getMaster()
  if (!ctx || !master || ctx.state !== 'running') return

  const t0 = ctx.currentTime
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, t0)
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  osc.connect(amp)
  amp.connect(master)
  osc.start(t0)
  osc.stop(t0 + duration + 0.06)
}

export function playShortBeep() {
  playTone({ frequency: 920, duration: 0.14, gain: 0.95, type: 'square' })
}

export function playMidBeep() {
  playTone({ frequency: 740, duration: 0.12, gain: 0.82, type: 'square' })
}

/** Beeeeep largo al llegar a 1 (pre-arranque o fin de tiempo). */
export function playLongBeep() {
  playTone({ frequency: 480, duration: 1.15, gain: 1, type: 'square' })
}

/**
 * @param {number} secondsLeft segundos que quedan (entero visible)
 * @param {'prestart' | 'end' | 'minute'} mode — minute = fin de cada minuto EMOM
 */
export function playCueForSecond(secondsLeft, mode) {
  if (secondsLeft <= 0) return

  if (mode === 'prestart') {
    if (secondsLeft === 1) playLongBeep()
    else if (secondsLeft <= 3) playShortBeep()
    return
  }

  if (mode === 'minute') {
    if (secondsLeft === 10) playMidBeep()
    else if (secondsLeft <= 3 && secondsLeft >= 1) playShortBeep()
    return
  }

  if (secondsLeft <= END_WARNING_SECONDS) {
    if (secondsLeft === 1) playLongBeep()
    else if (secondsLeft <= 3) playShortBeep()
    else playMidBeep()
  }
}

export { PRESTART_SECONDS, END_WARNING_SECONDS }
