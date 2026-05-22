import { useEffect, useCallback, useRef } from 'react'
import { unlockTimerAudio } from '../lib/timerSounds'
import { usePrestartGate } from './usePrestartGate'
import { useTimerCues } from './useTimerCues'

/** Prestart 10s + cues de fin; arranca el timer al terminar la cuenta. */
export function useTimerScreen(timer) {
  const gate = usePrestartGate()
  const endSeconds = timer.endCueSeconds?.() ?? null
  const cueMode = timer.endCueMode ?? 'end'
  const startedRef = useRef(false)

  useTimerCues(endSeconds, gate.isActive && timer.running, cueMode)

  useEffect(() => {
    if (!gate.isActive) {
      startedRef.current = false
      return
    }
    if (!startedRef.current && !timer.running && !timer.done) {
      startedRef.current = true
      timer.start()
    }
  }, [gate.isActive, timer.running, timer.done, timer.start])

  const onToggle = useCallback(async () => {
    await unlockTimerAudio()
    if (gate.isIdle || gate.isPrestart) {
      gate.requestStart()
      return
    }
    timer.toggle()
  }, [gate, timer])

  const onReset = useCallback(() => {
    gate.fullReset()
    timer.reset()
  }, [gate, timer])

  const showPrestart = gate.isPrestart
  const mainValue = showPrestart ? gate.prestartLeft : timer.displayValue
  const mainRunning = showPrestart ? gate.prestartRunning : timer.running

  return {
    gate,
    onToggle,
    onReset,
    showPrestart,
    mainValue,
    mainRunning,
    ringPct: showPrestart ? (10 - gate.prestartLeft) / 10 : timer.progress,
  }
}
