import { useLang } from '../../context/LangContext'
import { useCountdownTimer } from '../../hooks/useWorkoutTimer'
import { useTimerScreen } from '../../hooks/useTimerScreen'
import { useTimerConfig } from '../../hooks/useTimerConfig'
import { formatTimerDisplay } from '../../lib/timerSession'
import { TimerFrame, TimerClock, TimerStatRow } from './TimerFrame'

export default function TimerAmrap() {
  const { lang } = useLang()
  const { config: cfg, isSession } = useTimerConfig('amrap')
  const timer = useCountdownTimer(cfg.totalSeconds)
  const screen = useTimerScreen(timer)

  const done = timer.done && screen.gate.isActive
  const totalLabel = formatTimerDisplay(cfg.totalSeconds)
  const status = screen.showPrestart
    ? (lang === 'es' ? 'PREPARATE' : 'GET READY')
    : done
      ? (lang === 'es' ? 'TIEMPO' : 'TIME')
      : screen.mainRunning
        ? (lang === 'es' ? 'EN MARCHA' : 'RUNNING')
        : (lang === 'es' ? 'LISTO' : 'READY')

  const caption = screen.showPrestart
    ? (lang === 'es' ? 'ARRANQUE EN…' : 'STARTING IN…')
    : (lang === 'es' ? `RESTANTE DE ${totalLabel}` : `${totalLabel} LEFT`)

  const pct = Math.round(screen.ringPct * 100)

  return (
    <TimerFrame
      kind={cfg.kind}
      sub={cfg.sub}
      color="lime"
      ringPct={screen.ringPct}
      running={screen.mainRunning}
      onToggle={screen.onToggle}
      onReset={screen.onReset}
      backTo={isSession ? undefined : '/athlete/timers/amrap'}
      stats={!screen.showPrestart && screen.gate.isActive ? (
        <TimerStatRow
          items={[
            { label: lang === 'es' ? 'PROGRESO' : 'PROGRESS', value: `${pct}%`, accent: 'lime' },
            { label: lang === 'es' ? 'TOTAL' : 'TOTAL', value: totalLabel },
            {
              label: lang === 'es' ? 'ESTADO' : 'STATUS',
              value: done ? (lang === 'es' ? 'FIN' : 'DONE') : screen.mainRunning ? 'ON' : '—',
              accent: done ? 'orange' : screen.mainRunning ? 'lime' : undefined,
            },
          ]}
        />
      ) : null}
      mid={
        <TimerClock
          value={screen.mainValue}
          prestart={screen.showPrestart}
          status={status}
          statusColor={done ? 'orange' : screen.showPrestart ? 'blue' : 'lime'}
          caption={caption}
          size={88}
        />
      }
    />
  )
}
