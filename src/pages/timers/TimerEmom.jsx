import { useEmomTimer } from '../../hooks/useWorkoutTimer'
import { useTimerScreen } from '../../hooks/useTimerScreen'
import { useTimerConfig } from '../../hooks/useTimerConfig'
import { EmomTimerView } from '../../components/timers/EmomTimerView'

export default function TimerEmom() {
  const { config: cfg, wod, isSession } = useTimerConfig('emom')
  const timer = useEmomTimer(cfg.rounds, cfg.minuteSeconds)
  const screen = useTimerScreen(timer)

  return (
    <EmomTimerView
      rounds={cfg.rounds}
      round={timer.round}
      remaining={timer.remaining}
      ringPct={screen.ringPct}
      minuteSeconds={cfg.minuteSeconds}
      lines={cfg.lines}
      wodTitle={cfg.sub || wod?.title}
      done={timer.done && screen.gate.isActive}
      showPrestart={screen.showPrestart}
      prestartLeft={screen.showPrestart ? screen.mainValue : 0}
      mainRunning={screen.mainRunning}
      onToggle={screen.onToggle}
      onReset={screen.onReset}
      backTo={isSession ? undefined : '/athlete/timers/emom'}
    />
  )
}
