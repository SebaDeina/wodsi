import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { PhoneFrame } from '../../components/PhoneFrame'
import { SvgIcon } from '../../components/SvgIcon'
import { formatTimerDisplay } from '../../lib/timerSession'

const pageWrap = {
  height: '100dvh',
  maxHeight: '100dvh',
  background: W.c.bg,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  overflow: 'hidden',
}

export function TimerFrame({
  kind,
  sub,
  color,
  ringPct = 0,
  top,
  mid,
  bottom,
  stats,
  running,
  onToggle,
  onReset,
  primaryLabel,
  backTo,
}) {
  const { lang } = useLang()
  const navigate = useNavigate()
  const ringBg = `conic-gradient(${W.c[color]} 0% ${Math.min(100, ringPct * 100)}%, ${W.c.lineDim} ${Math.min(100, ringPct * 100)}% 100%)`

  function goBack() {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <div style={pageWrap}>
      <PhoneFrame fill>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 20px 4px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={goBack}
              style={{ fontSize: 22, color: W.c.dim, cursor: 'pointer', background: 'none', border: 'none', padding: 4, lineHeight: 1 }}
              aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
            >
              <SvgIcon name="close" size={22} />
            </button>
            <div style={{ flex: 1, textAlign: 'center', padding: '0 8px', minWidth: 0 }}>
              <div style={{
                fontFamily: W.font.mono,
                fontSize: 11,
                letterSpacing: 1.5,
                color: W.c[color],
                fontWeight: 600,
              }}>
                {kind}
              </div>
              {sub ? (
                <div style={{
                  fontSize: 12,
                  color: W.c.dim,
                  marginTop: 4,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {sub}
                </div>
              ) : null}
            </div>
            <span style={{ width: 30 }} />
          </div>

          {top}

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '4px 0' }}>
            <div style={{ width: 'min(280px, 78vw)', aspectRatio: '1', borderRadius: '50%', background: ringBg, padding: 11 }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: W.c.bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                boxShadow: `inset 0 0 80px ${W.c[color]}18`,
                overflow: 'hidden',
                padding: '8px 12px',
                boxSizing: 'border-box',
              }}>
                {mid}
              </div>
            </div>
          </div>

          {stats && (
            <div style={{ padding: '0 20px 8px', flexShrink: 0 }}>
              {stats}
            </div>
          )}

          {bottom}

          <div style={{
            padding: '12px 20px max(16px, env(safe-area-inset-bottom, 16px))',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexShrink: 0,
            borderTop: `1px solid ${W.c.lineDim}`,
          }}>
            <button
              type="button"
              onClick={onReset}
              title={lang === 'es' ? 'Reiniciar' : 'Reset'}
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
                background: W.c[color],
                border: 'none',
                color: W.c.bg,
                fontFamily: W.font.display,
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: `0 12px 32px ${W.c[color]}40`,
                letterSpacing: 0.3,
              }}
            >
              {primaryLabel || (running
                ? (lang === 'es' ? 'PAUSAR' : 'PAUSE')
                : (lang === 'es' ? 'INICIAR' : 'START'))}
            </button>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}

export function TimerClock({
  value,
  color = 'text',
  size = 88,
  status,
  statusColor = 'lime',
  prestart = false,
  caption,
}) {
  const isCountdownDigit = prestart && typeof value === 'number'
  const display = isCountdownDigit
    ? String(value)
    : (typeof value === 'number' ? formatTimerDisplay(value) : value)

  const fontSize = isCountdownDigit
    ? (value >= 10 ? 56 : 72)
    : size

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '100%',
      minHeight: 0,
      flex: '1 1 auto',
      overflow: 'hidden',
    }}>
      {status && (
        <div style={{
          fontFamily: W.font.mono,
          fontSize: 10,
          letterSpacing: 1.2,
          color: W.c[statusColor],
          textAlign: 'center',
          flexShrink: 0,
          marginBottom: 2,
        }}>
          {status}
        </div>
      )}
      <div style={{
        fontFamily: W.font.mono,
        fontWeight: 700,
        fontSize,
        lineHeight: 1,
        letterSpacing: isCountdownDigit ? -2 : -3,
        color: W.c[color],
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {display}
      </div>
      {caption && (
        <div style={{
          fontFamily: W.font.mono,
          fontSize: 10,
          letterSpacing: 1,
          color: W.c.mute,
          marginTop: 6,
          textAlign: 'center',
          flexShrink: 0,
        }}>
          {caption}
        </div>
      )}
    </div>
  )
}

/** Fila de métricas bajo el reloj (mock). */
export function TimerStatRow({ items }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      gap: 8,
    }}>
      {items.map(({ label, value, accent }) => (
        <div
          key={label}
          style={{
            padding: '10px 8px',
            borderRadius: 12,
            background: W.c.card,
            border: `1px solid ${W.c.lineDim}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.mute, letterSpacing: 0.8, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{
            fontFamily: W.font.mono,
            fontSize: 13,
            fontWeight: 700,
            color: accent ? W.c[accent] : W.c.text,
          }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}
