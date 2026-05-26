import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { PhoneFrame } from '../PhoneFrame'
import { SvgIcon } from '../SvgIcon'
import { formatTimerDisplay } from '../../lib/timerSession'
import { TimerClock } from '../../pages/timers/TimerFrame'
import {
  emomHeaderTitle,
  emomElapsedSeconds,
  emomWorkText,
} from '../../lib/emomDisplay'

const pageWrap = {
  height: '100dvh',
  maxHeight: '100dvh',
  background: W.c.bg,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  overflow: 'hidden',
}

function MinuteChip({ n, state }) {
  const bg = state === 'done' ? W.c.blue
    : state === 'active' ? W.c.lime
      : W.c.lineDim
  const color = state === 'active' ? W.c.bg : state === 'done' ? W.c.bg : W.c.mute

  return (
    <div style={{
      flex: '0 0 28px',
      width: 28,
      height: 28,
      borderRadius: 8,
      background: bg,
      color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: W.font.mono,
      fontSize: 11,
      fontWeight: 700,
      opacity: state === 'pending' ? 0.55 : 1,
      boxShadow: state === 'active' ? `0 0 12px ${W.c.lime}55` : 'none',
    }}>
      {n}
    </div>
  )
}

function MovementBlock({ label, text, lang, variant = 'current' }) {
  if (!text) return null
  const isCurrent = variant === 'current'

  return (
    <div style={{
      width: '100%',
      maxWidth: 300,
      padding: isCurrent ? '10px 14px' : '8px 14px',
      borderRadius: 12,
      background: isCurrent ? W.c.card : 'transparent',
      border: isCurrent ? `1px solid ${W.c.lineDim}` : 'none',
      borderLeft: isCurrent ? `3px solid ${W.c.lime}` : 'none',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: W.font.mono,
        fontSize: 10,
        letterSpacing: 1.2,
        color: isCurrent ? W.c.lime : W.c.mute,
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: isCurrent ? 14 : 12,
        color: isCurrent ? W.c.text : W.c.dim,
        lineHeight: 1.4,
        fontWeight: isCurrent ? 600 : 500,
      }}>
        {text}
      </div>
    </div>
  )
}

export function EmomTimerView({
  rounds,
  round,
  remaining,
  minuteSeconds,
  ringPct = 0,
  lines = [],
  wodTitle,
  done,
  showPrestart,
  prestartLeft,
  mainRunning,
  onToggle,
  onReset,
  backTo,
}) {
  const { lang } = useLang()
  const navigate = useNavigate()

  const completed = Math.max(0, round - 1 - (remaining === 0 && done ? 1 : 0))
  const left = Math.max(0, rounds - round + (remaining === 0 && !done ? 0 : 1))
  const currentWork = emomWorkText(lines, round)
  const nextWork = round < rounds && !done ? emomWorkText(lines, round + 1) : ''
  const elapsed = showPrestart ? 0 : emomElapsedSeconds(round, remaining, minuteSeconds)
  const headerTitle = showPrestart
    ? `EMOM · ${rounds} ${lang === 'es' ? 'min' : 'min'}`
    : emomHeaderTitle(rounds, round, lang)

  const ringBg = `conic-gradient(${W.c.blue} 0% ${Math.min(100, ringPct * 100)}%, ${W.c.lineDim} ${Math.min(100, ringPct * 100)}% 100%)`

  const clockValue = showPrestart ? prestartLeft : remaining
  const showTenSeconds = !showPrestart && !done && remaining === 10
  const status = showPrestart
    ? (lang === 'es' ? 'PREPARATE' : 'GET READY')
    : showTenSeconds
      ? (lang === 'es' ? 'DIEZ SEGUNDOS' : 'TEN SECONDS')
      : done
        ? (lang === 'es' ? 'TIEMPO' : 'TIME')
        : mainRunning
          ? (lang === 'es' ? 'THIS MINUTE' : 'THIS MINUTE')
          : (lang === 'es' ? 'LISTO' : 'READY')
  const clockCaption = showPrestart
    ? (lang === 'es' ? 'ARRANQUE EN…' : 'STARTING IN…')
    : showTenSeconds
      ? (lang === 'es' ? 'Diez segundos' : 'Ten seconds')
      : (lang === 'es' ? 'SEGUNDOS EN ESTE MINUTO' : 'SECONDS THIS MINUTE')

  function goBack() {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <div style={pageWrap}>
      <PhoneFrame fill>
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 8,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '8px 16px 10px',
            flexShrink: 0,
            gap: 8,
          }}>
            <button
              type="button"
              onClick={goBack}
              style={{
                fontSize: 22,
                color: W.c.dim,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 4,
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
            >
              <SvgIcon name="close" size={22} />
            </button>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <div style={{
                fontFamily: W.font.mono,
                fontSize: 12,
                letterSpacing: 1.2,
                color: W.c.blue,
                fontWeight: 700,
              }}>
                {headerTitle}
              </div>
              {wodTitle && !currentWork && (
                <div style={{
                  fontSize: 12,
                  color: W.c.dim,
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {wodTitle}
                </div>
              )}
            </div>
            <span style={{ width: 22, flexShrink: 0 }} />
          </div>

          {!showPrestart && (
            <div style={{
              padding: '0 16px 10px',
              overflowX: 'auto',
              flexShrink: 0,
              WebkitOverflowScrolling: 'touch',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: rounds }, (_, i) => {
                  const n = i + 1
                  let state = 'pending'
                  if (n < round || (n === round && remaining === 0 && done)) state = 'done'
                  else if (n === round && !done) state = 'active'
                  return <MinuteChip key={n} n={n} state={state} />
                })}
              </div>
            </div>
          )}

          {!showPrestart && (
            <div style={{
              padding: '0 16px 10px',
              fontFamily: W.font.mono,
              fontSize: 10,
              letterSpacing: 0.6,
              color: W.c.mute,
              flexShrink: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
            }}>
              <span>
                {lang === 'es' ? 'COMPLETADOS' : 'DONE'}{' '}
                <strong style={{ color: W.c.blue }}>{completed}</strong>
              </span>
              <span style={{ color: W.c.lineDim }}>·</span>
              <span>
                <SvgIcon name="dot" size={10} style={{ color: W.c.lime, verticalAlign: -1 }} />{' '}
                {lang === 'es' ? 'MIN' : 'MIN'} <strong style={{ color: W.c.lime }}>{round}</strong>
              </span>
              <span style={{ color: W.c.lineDim }}>·</span>
              <span>
                {lang === 'es' ? 'FALTAN' : 'LEFT'}{' '}
                <strong style={{ color: W.c.text }}>{left}</strong>
              </span>
            </div>
          )}

          {/* Centro: actual · círculo · próximo */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 20px',
            minHeight: 0,
            gap: 12,
          }}>
            <MovementBlock
              label={lang === 'es' ? 'MOVIMIENTO ACTUAL' : 'CURRENT'}
              text={currentWork || (showPrestart ? wodTitle : '')}
              lang={lang}
              variant="current"
            />

            <div style={{
              width: 'min(260px, 72vw)',
              aspectRatio: '1',
              borderRadius: '50%',
              background: ringBg,
              padding: 11,
              flexShrink: 0,
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: W.c.bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `inset 0 0 80px ${W.c.blue}18`,
                overflow: 'hidden',
                padding: '8px 12px',
                boxSizing: 'border-box',
              }}>
                <TimerClock
                  value={clockValue}
                  prestart={showPrestart}
                  status={status}
                  statusColor={done ? 'orange' : showPrestart ? 'blue' : showTenSeconds ? 'orange' : 'lime'}
                  caption={clockCaption}
                  size={88}
                />
              </div>
            </div>

            <MovementBlock
              label={lang === 'es' ? 'PRÓXIMO' : 'NEXT'}
              text={nextWork}
              lang={lang}
              variant="next"
            />
          </div>

          {!showPrestart && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              padding: '0 16px 12px',
              flexShrink: 0,
            }}>
              {[
                {
                  label: lang === 'es' ? 'TIEMPO TOTAL' : 'TOTAL TIME',
                  value: formatTimerDisplay(elapsed),
                  accent: 'blue',
                },
                { label: lang === 'es' ? 'REPS' : 'REPS', value: '—' },
                { label: lang === 'es' ? 'FALLOS' : 'MISS', value: '—' },
              ].map(({ label, value, accent }) => (
                <div
                  key={label}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 12,
                    background: W.c.card,
                    border: `1px solid ${W.c.lineDim}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontFamily: W.font.mono,
                    fontSize: 9,
                    color: W.c.mute,
                    letterSpacing: 0.8,
                    marginBottom: 4,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontFamily: W.font.mono,
                    fontSize: 14,
                    fontWeight: 700,
                    color: accent ? W.c[accent] : W.c.text,
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            padding: '12px 16px max(16px, env(safe-area-inset-bottom, 16px))',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexShrink: 0,
            borderTop: `1px solid ${W.c.lineDim}`,
          }}>
            <button
              type="button"
              onClick={onReset}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: W.c.card,
                border: `1px solid ${W.c.lineDim}`,
                color: W.c.text,
                fontSize: 20,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title={lang === 'es' ? 'Reiniciar' : 'Reset'}
            >
              <SvgIcon name="reset" size={22} />
            </button>
            <button
              type="button"
              onClick={onToggle}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 28,
                background: W.c.blue,
                border: 'none',
                color: W.c.bg,
                fontFamily: W.font.display,
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: `0 12px 32px ${W.c.blue}40`,
              }}
            >
              {mainRunning
                ? (lang === 'es' ? 'PAUSAR' : 'PAUSE')
                : (lang === 'es' ? 'INICIAR' : 'START')}
            </button>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
