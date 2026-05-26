import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { SvgIcon } from '../../components/SvgIcon'
import { useTabataTimer } from '../../hooks/useWorkoutTimer'
import { useTimerScreen } from '../../hooks/useTimerScreen'
import { useTimerConfig } from '../../hooks/useTimerConfig'
import { TimerFrame, TimerClock, TimerStatRow } from './TimerFrame'

export default function TimerTabata() {
  const { lang } = useLang()
  const { config: cfg, isSession } = useTimerConfig('tabata')
  const timer = useTabataTimer(cfg.rounds, cfg.workSeconds, cfg.restSeconds)
  const screen = useTimerScreen(timer)

  const { round, rounds, phase } = timer
  const phaseLabel = phase === 'work'
    ? (lang === 'es' ? 'TRABAJO' : 'WORK')
    : (lang === 'es' ? 'DESCANSO' : 'REST')

  return (
    <TimerFrame
      kind={cfg.kind}
      sub={cfg.sub}
      color="red"
      ringPct={screen.ringPct}
      running={screen.mainRunning}
      onToggle={screen.onToggle}
      onReset={screen.onReset}
      backTo={isSession ? undefined : '/athlete/timers/tabata'}
      top={
        !screen.showPrestart && screen.gate.isActive ? (
          <div style={{ padding: '4px 20px 0', display: 'flex', gap: 5 }}>
            {Array.from({ length: rounds }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 3,
                  background: i + 1 < round ? W.c.red : i + 1 === round ? W.c.lime : W.c.lineDim,
                }}
              />
            ))}
          </div>
        ) : null
      }
      stats={!screen.showPrestart && screen.gate.isActive ? (
        <TimerStatRow
          items={[
            { label: lang === 'es' ? 'RONDA' : 'ROUND', value: `${round}/${rounds}`, accent: 'lime' },
            { label: phase === 'work' ? (lang === 'es' ? 'TRABAJO' : 'WORK') : 'REST', value: `${cfg.workSeconds}/${cfg.restSeconds}s`, accent: 'red' },
            { label: lang === 'es' ? 'FASE' : 'PHASE', value: phaseLabel, accent: phase === 'work' ? 'lime' : undefined },
          ]}
        />
      ) : null}
      mid={
        screen.showPrestart ? (
          <TimerClock
            value={screen.mainValue}
            prestart
            status={lang === 'es' ? 'PREPARATE' : 'GET READY'}
            statusColor="blue"
            caption={lang === 'es' ? 'ARRANQUE EN…' : 'STARTING IN…'}
          />
        ) : (
          <>
            <div style={{
              fontFamily: W.font.mono,
              fontSize: 11,
              letterSpacing: 2,
              color: phase === 'work' ? W.c.lime : W.c.blue,
              fontWeight: 700,
              marginBottom: 2,
            }}>
              <SvgIcon name="dot" size={9} style={{ verticalAlign: -1 }} /> {phaseLabel}
            </div>
            <TimerClock
              value={screen.mainValue}
              color="lime"
              size={96}
              caption={`${cfg.workSeconds}s · ${cfg.restSeconds}s`}
            />
          </>
        )
      }
    />
  )
}
