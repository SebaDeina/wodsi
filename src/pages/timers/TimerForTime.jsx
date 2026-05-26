import { useLang } from '../../context/LangContext'
import { useStopwatchTimer } from '../../hooks/useWorkoutTimer'
import { useTimerScreen } from '../../hooks/useTimerScreen'
import { useTimerConfig } from '../../hooks/useTimerConfig'
import { formatTimerDisplay } from '../../lib/timerSession'
import { TimerFrame, TimerClock, TimerStatRow } from './TimerFrame'

export default function TimerForTime() {
  const { lang } = useLang()
  const { config: cfg, isSession } = useTimerConfig('fortime')
  const timer = useStopwatchTimer(cfg.capSeconds)
  const screen = useTimerScreen(timer)

  const { overCap, capSeconds } = timer
  const capLeft = capSeconds != null && screen.gate.isActive
    ? Math.max(0, capSeconds - timer.elapsed)
    : null

  const status = screen.showPrestart
    ? (lang === 'es' ? 'PREPARATE' : 'GET READY')
    : overCap
      ? (lang === 'es' ? 'SOBRE CAP' : 'OVER CAP')
      : screen.mainRunning
        ? (lang === 'es' ? 'SUBIENDO' : 'RUNNING')
        : (lang === 'es' ? 'LISTO' : 'READY')

  const caption = screen.showPrestart
    ? (lang === 'es' ? 'ARRANQUE EN…' : 'STARTING IN…')
    : capSeconds != null
      ? (lang === 'es'
        ? `CAP ${formatTimerDisplay(capSeconds)} · ${formatTimerDisplay(capLeft ?? 0)} RESTANTES`
        : `CAP ${formatTimerDisplay(capSeconds)} · ${formatTimerDisplay(capLeft ?? 0)} LEFT`)
      : (lang === 'es' ? 'SIN CAP' : 'NO CAP')

  return (
    <TimerFrame
      kind={cfg.kind}
      sub={cfg.sub}
      color="orange"
      ringPct={screen.ringPct}
      running={screen.mainRunning}
      onToggle={screen.onToggle}
      onReset={screen.onReset}
      backTo={isSession ? undefined : '/athlete/timers/fortime'}
      stats={!screen.showPrestart && screen.gate.isActive ? (
        <TimerStatRow
          items={[
            { label: lang === 'es' ? 'TRANSCURRIDO' : 'ELAPSED', value: formatTimerDisplay(timer.elapsed), accent: 'orange' },
            {
              label: 'CAP',
              value: capSeconds != null ? formatTimerDisplay(capLeft ?? 0) : '—',
              accent: overCap ? 'red' : 'lime',
            },
            {
              label: lang === 'es' ? 'ESTADO' : 'STATUS',
              value: overCap ? (lang === 'es' ? 'OVER' : 'OVER') : screen.mainRunning ? 'ON' : '—',
            },
          ]}
        />
      ) : null}
      mid={
        <TimerClock
          value={screen.showPrestart ? screen.mainValue : timer.elapsed}
          prestart={screen.showPrestart}
          status={status}
          statusColor={overCap ? 'red' : screen.showPrestart ? 'blue' : 'orange'}
          caption={caption}
          size={88}
        />
      }
    />
  )
}
