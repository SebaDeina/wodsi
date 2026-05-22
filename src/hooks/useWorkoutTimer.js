import { useState, useEffect, useCallback, useRef } from 'react'

function useIntervalRunner(running, onTick) {
  const intervalRef = useRef(null)
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return undefined
    }
    intervalRef.current = setInterval(() => onTickRef.current(), 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])
}

/** Countdown simple (AMRAP). */
export function useCountdownTimer(initialSeconds) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    setRemaining(initialSeconds)
    setRunning(false)
  }, [initialSeconds])

  useIntervalRunner(running, () => {
    setRemaining(r => {
      if (r <= 1) {
        setRunning(false)
        return 0
      }
      return r - 1
    })
  })

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const toggle = useCallback(() => setRunning(r => !r), [])
  const reset = useCallback(() => {
    setRunning(false)
    setRemaining(initialSeconds)
  }, [initialSeconds])

  const progress = initialSeconds > 0 ? 1 - remaining / initialSeconds : 0
  const done = remaining === 0

  return {
    remaining,
    displayValue: remaining,
    running,
    start,
    pause,
    toggle,
    reset,
    progress,
    done,
    endCueSeconds: () => (running && remaining > 0 ? remaining : null),
  }
}

/** Cronómetro ascendente (For Time). */
export function useStopwatchTimer(capSeconds = null) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)

  useIntervalRunner(running, () => setElapsed(e => e + 1))

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const toggle = useCallback(() => setRunning(r => !r), [])
  const reset = useCallback(() => {
    setRunning(false)
    setElapsed(0)
  }, [])

  const progress = capSeconds ? Math.min(1, elapsed / capSeconds) : 0
  const overCap = capSeconds != null && elapsed >= capSeconds
  const remaining = capSeconds != null ? Math.max(0, capSeconds - elapsed) : null

  return {
    elapsed,
    displayValue: elapsed,
    remaining,
    running,
    start,
    pause,
    toggle,
    reset,
    progress,
    overCap,
    done: capSeconds != null && elapsed >= capSeconds,
    capSeconds,
    endCueSeconds: () => (running && capSeconds != null && remaining > 0 ? remaining : null),
  }
}

/** EMOM: minutos con cuenta regresiva de 60s por ronda. */
export function useEmomTimer(rounds, minuteSeconds = 60) {
  const [phase, setPhase] = useState({
    round: 1,
    remaining: minuteSeconds,
    running: false,
  })

  useEffect(() => {
    setPhase({ round: 1, remaining: minuteSeconds, running: false })
  }, [rounds, minuteSeconds])

  const tick = useCallback(() => {
    setPhase(prev => {
      if (prev.remaining > 1) {
        return { ...prev, remaining: prev.remaining - 1 }
      }
      if (prev.round >= rounds) {
        return { ...prev, remaining: 0, running: false }
      }
      return {
        ...prev,
        round: prev.round + 1,
        remaining: minuteSeconds,
      }
    })
  }, [rounds, minuteSeconds])

  useIntervalRunner(phase.running, tick)

  const start = useCallback(() => setPhase(p => ({ ...p, running: true })), [])
  const pause = useCallback(() => setPhase(p => ({ ...p, running: false })), [])
  const toggle = useCallback(() => setPhase(p => ({ ...p, running: !p.running })), [])
  const reset = useCallback(() => {
    setPhase({ round: 1, remaining: minuteSeconds, running: false })
  }, [minuteSeconds])

  const { round, remaining, running } = phase
  const progress = rounds > 0 ? (round - 1 + (1 - remaining / minuteSeconds)) / rounds : 0
  const done = round >= rounds && remaining === 0

  return {
    round,
    rounds,
    remaining,
    displayValue: remaining,
    running,
    start,
    pause,
    toggle,
    reset,
    progress,
    done,
    endCueSeconds: () => (running && remaining > 0 ? remaining : null),
    endCueMode: 'minute',
  }
}

/** Tabata 20/10 por defecto. */
export function useTabataTimer(rounds = 8, workSeconds = 20, restSeconds = 10) {
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState('work')
  const [remaining, setRemaining] = useState(workSeconds)
  const [running, setRunning] = useState(false)
  const stateRef = useRef({ round: 1, phase: 'work', remaining: workSeconds })

  useEffect(() => {
    stateRef.current = { round: 1, phase: 'work', remaining: workSeconds }
    setRound(1)
    setPhase('work')
    setRemaining(workSeconds)
    setRunning(false)
  }, [rounds, workSeconds, restSeconds])

  useEffect(() => {
    stateRef.current.round = round
    stateRef.current.phase = phase
    stateRef.current.remaining = remaining
  }, [round, phase, remaining])

  useIntervalRunner(running, () => {
    const s = stateRef.current
    if (s.remaining > 1) {
      setRemaining(s.remaining - 1)
      return
    }
    if (s.phase === 'work') {
      setPhase('rest')
      setRemaining(restSeconds)
      return
    }
    if (s.round >= rounds) {
      setRunning(false)
      setRemaining(0)
      return
    }
    const nextRound = s.round + 1
    setRound(nextRound)
    setPhase('work')
    setRemaining(workSeconds)
  })

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const toggle = useCallback(() => setRunning(r => !r), [])
  const reset = useCallback(() => {
    setRunning(false)
    setRound(1)
    setPhase('work')
    setRemaining(workSeconds)
    stateRef.current = { round: 1, phase: 'work', remaining: workSeconds }
  }, [workSeconds])

  const totalPhases = rounds * 2
  const progress = totalPhases > 0
    ? ((round - 1) * 2 + (phase === 'rest' ? 1 : 0) + (1 - remaining / (phase === 'work' ? workSeconds : restSeconds))) / totalPhases
    : 0

  return {
    round,
    rounds,
    phase,
    remaining,
    displayValue: remaining,
    running,
    start,
    pause,
    toggle,
    reset,
    progress,
    done: round >= rounds && phase === 'rest' && remaining === 0,
    endCueSeconds: () => (running && remaining > 0 ? remaining : null),
  }
}
