import { W } from '../../tokens'
import { TIMER_CATALOG } from '../../lib/timerCatalog'
import { timerModeName } from '../../lib/timerModes'

function PreviewRing({ color, pct, children }) {
  const p = Math.min(100, Math.max(0, pct))
  const ringBg = `conic-gradient(${W.c[color]} 0% ${p}%, ${W.c.lineDim} ${p}% 100%)`

  return (
    <div style={{
      width: 118,
      aspectRatio: '1',
      borderRadius: '50%',
      background: ringBg,
      padding: 5,
      flexShrink: 0,
    }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: W.c.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        boxShadow: `inset 0 0 48px ${W.c[color]}20`,
        padding: 6,
        boxSizing: 'border-box',
      }}
      >
        {children}
      </div>
    </div>
  )
}

function MockStats({ items }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      gap: 6,
      padding: '0 4px',
    }}
    >
      {items.map(item => (
        <div key={item.label} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: W.font.mono, fontSize: 7, color: W.c.mute, letterSpacing: 0.6 }}>
            {item.label}
          </div>
          <div style={{
            fontFamily: W.font.mono,
            fontSize: 11,
            fontWeight: 700,
            color: item.accent ? W.c[item.accent] : W.c.text,
            marginTop: 2,
          }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function AmrapPreview({ lang }) {
  const es = lang === 'es'
  return (
    <>
      <PreviewRing color="lime" pct={58}>
        <div style={{ fontFamily: W.font.mono, fontSize: 8, color: W.c.lime, letterSpacing: 1 }}>
          {es ? '● EN MARCHA' : '● RUNNING'}
        </div>
        <div style={{ fontFamily: W.font.mono, fontSize: 26, fontWeight: 700, color: W.c.lime, letterSpacing: -2 }}>
          7:23
        </div>
        <div style={{ fontFamily: W.font.mono, fontSize: 7, color: W.c.mute }}>
          {es ? 'RESTANTE DE 20:00' : '20:00 LEFT'}
        </div>
      </PreviewRing>
      <MockStats items={[
        { label: es ? 'PROGRESO' : 'PROGRESS', value: '58%', accent: 'lime' },
        { label: es ? 'TOTAL' : 'TOTAL', value: '20:00' },
        { label: es ? 'ESTADO' : 'STATUS', value: 'ON', accent: 'lime' },
      ]}
      />
    </>
  )
}

function EmomPreview({ lang }) {
  const es = lang === 'es'
  const rounds = 8
  const active = 3

  return (
    <>
      <div style={{ width: '100%', maxWidth: 200 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 10 }}>
          {Array.from({ length: rounds }, (_, i) => {
            const n = i + 1
            const state = n < active ? 'done' : n === active ? 'active' : 'pending'
            const bg = state === 'done' ? W.c.blue : state === 'active' ? W.c.lime : W.c.lineDim
            const color = state === 'pending' ? W.c.mute : W.c.bg
            return (
              <div
                key={n}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: bg,
                  color,
                  fontFamily: W.font.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: state === 'pending' ? 0.5 : 1,
                }}
              >
                {n}
              </div>
            )
          })}
        </div>
        <PreviewRing color="blue" pct={35}>
          <div style={{ fontFamily: W.font.mono, fontSize: 8, color: W.c.blue, letterSpacing: 1 }}>
            {es ? 'MIN 3 / 8' : 'MIN 3 / 8'}
          </div>
          <div style={{ fontFamily: W.font.mono, fontSize: 26, fontWeight: 700, color: W.c.lime, letterSpacing: -2 }}>
            0:42
          </div>
        </PreviewRing>
        <div style={{
          marginTop: 10,
          padding: '8px 10px',
          borderRadius: 10,
          background: W.c.card,
          border: `1px solid ${W.c.lineDim}`,
          borderLeft: `3px solid ${W.c.lime}`,
          textAlign: 'center',
        }}
        >
          <div style={{ fontFamily: W.font.mono, fontSize: 7, color: W.c.lime, letterSpacing: 1, marginBottom: 4 }}>
            {es ? 'ESTE MINUTO' : 'THIS MINUTE'}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: W.c.text, lineHeight: 1.35 }}>
            10 Burpees · 12 Cal Ski
          </div>
        </div>
      </div>
    </>
  )
}

function ForTimePreview({ lang }) {
  const es = lang === 'es'
  return (
    <>
      <PreviewRing color="orange" pct={72}>
        <div style={{ fontFamily: W.font.mono, fontSize: 8, color: W.c.orange, letterSpacing: 1 }}>
          {es ? '● SUBIENDO' : '● RUNNING'}
        </div>
        <div style={{ fontFamily: W.font.mono, fontSize: 26, fontWeight: 700, color: W.c.orange, letterSpacing: -2 }}>
          8:42
        </div>
        <div style={{ fontFamily: W.font.mono, fontSize: 7, color: W.c.mute }}>
          {es ? 'CAP 15:00 · 6:18 REST.' : 'CAP 15:00 · 6:18 LEFT'}
        </div>
      </PreviewRing>
      <MockStats items={[
        { label: es ? 'TRANSCURRIDO' : 'ELAPSED', value: '8:42', accent: 'orange' },
        { label: 'CAP', value: '6:18', accent: 'lime' },
        { label: es ? 'ESTADO' : 'STATUS', value: 'ON' },
      ]}
      />
    </>
  )
}

function TabataPreview({ lang }) {
  const es = lang === 'es'
  const rounds = 8
  const current = 4

  return (
    <>
      <div style={{ width: '100%', maxWidth: 200 }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
          {Array.from({ length: rounds }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 2,
                background: i + 1 < current ? W.c.red : i + 1 === current ? W.c.lime : W.c.lineDim,
              }}
            />
          ))}
        </div>
        <PreviewRing color="red" pct={62}>
          <div style={{ fontFamily: W.font.mono, fontSize: 8, color: W.c.lime, letterSpacing: 1.5 }}>
            {es ? 'TRABAJO' : 'WORK'}
          </div>
          <div style={{ fontFamily: W.font.mono, fontSize: 26, fontWeight: 700, color: W.c.lime, letterSpacing: -2 }}>
            0:14
          </div>
          <div style={{ fontFamily: W.font.mono, fontSize: 7, color: W.c.mute }}>
            {es ? `RONDA ${current}/${rounds}` : `ROUND ${current}/${rounds}`}
          </div>
        </PreviewRing>
      </div>
      <MockStats items={[
        { label: es ? 'RONDA' : 'ROUND', value: `${current}/${rounds}`, accent: 'lime' },
        { label: es ? 'TRABAJO' : 'WORK', value: '20/10s', accent: 'red' },
        { label: es ? 'FASE' : 'PHASE', value: es ? 'TRABAJO' : 'WORK', accent: 'lime' },
      ]}
      />
    </>
  )
}

const PREVIEW_BODY = {
  amrap: AmrapPreview,
  emom: EmomPreview,
  fortime: ForTimePreview,
  tabata: TabataPreview,
}

/**
 * Vista previa estática del timer (como en la app del atleta).
 */
export function TimerPreviewMini({ mode, lang }) {
  const meta = TIMER_CATALOG[mode]
  const color = meta?.color || 'lime'
  const Body = PREVIEW_BODY[mode] || AmrapPreview
  const es = lang === 'es'

  return (
    <div className="landing-timer-preview" aria-live="polite">
      <div key={mode} className="landing-timer-preview-inner">
        <div className="landing-timer-preview-phone">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px 6px',
            borderBottom: `1px solid ${W.c.lineDim}`,
          }}
          >
            <span style={{ fontSize: 16, color: W.c.mute, lineHeight: 1 }}>×</span>
            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: W.font.mono,
                fontSize: 9,
                letterSpacing: 1.2,
                color: W.c[color],
                fontWeight: 700,
              }}
              >
                {timerModeName(mode, lang).toUpperCase()}
              </div>
              <div style={{
                fontSize: 10,
                color: W.c.dim,
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              >
                {es ? 'Metcon del día' : "Today's metcon"}
              </div>
            </div>
            <span style={{ width: 16 }} />
          </div>

          <div style={{
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            minHeight: 200,
          }}
          >
            <Body lang={lang} />
          </div>

          <div style={{
            display: 'flex',
            gap: 8,
            padding: '10px 12px 12px',
            borderTop: `1px solid ${W.c.lineDim}`,
          }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: W.c.card,
              border: `1px solid ${W.c.lineDim}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: W.c.text,
            }}
            >
              ↺
            </div>
            <div style={{
              flex: 1,
              height: 36,
              borderRadius: 18,
              background: W.c[color],
              color: W.c.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: W.font.display,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 0.3,
            }}
            >
              {es ? 'PAUSAR' : 'PAUSE'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
