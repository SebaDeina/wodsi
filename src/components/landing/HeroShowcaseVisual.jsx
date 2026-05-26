import { useState, useEffect } from 'react'
import { W } from '../../tokens'
import { t } from '../../i18n'

const TIMER_TOTAL = 20 * 60

export function HeroShowcaseVisual({ lang }) {
  const es = lang === 'es'
  const [secs, setSecs] = useState(TIMER_TOTAL - 7 * 60) // start 7 min elapsed

  useEffect(() => {
    const id = setInterval(() => setSecs(s => s > 0 ? s - 1 : TIMER_TOTAL), 1000)
    return () => clearInterval(id)
  }, [])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const pct = (((TIMER_TOTAL - secs) / TIMER_TOTAL) * 100).toFixed(2)

  const days = es
    ? [
        { d: 'LUN', n: 5, wod: 'AMRAP 20', sub: 'Engine' },
        { d: 'MAR', n: 6, wod: 'EMOM 18', sub: 'Snatch' },
        { d: 'MIÉ', n: 7, wod: 'For Time', sub: 'Murph' },
        { d: 'JUE', n: 8, wod: 'Strength', sub: 'Back squat' },
      ]
    : [
        { d: 'MON', n: 5, wod: 'AMRAP 20', sub: 'Engine' },
        { d: 'TUE', n: 6, wod: 'EMOM 18', sub: 'Snatch' },
        { d: 'WED', n: 7, wod: 'For Time', sub: 'Murph' },
        { d: 'THU', n: 8, wod: 'Strength', sub: 'Back squat' },
      ]

  return (
    <div className="landing-hero-showcase" aria-hidden>
      <div className="landing-hero-showcase-planner">
        <div className="landing-hero-showcase-planner-head">
          <span style={{ color: W.c.lime }}>● {t('planning', lang)}</span>
          <span>{es ? 'SEM 18' : 'WK 18'}</span>
          <div className="landing-showcase-live">
            <span className="landing-showcase-live-dot" />
            <span>34 online</span>
          </div>
        </div>
        <div className="landing-hero-showcase-mini-grid">
          {days.map(day => (
            <div key={day.d} className="landing-hero-showcase-day">
              <div className="landing-hero-showcase-day-label">{day.d}</div>
              <div className="landing-hero-showcase-day-num">{day.n}</div>
              <div className="landing-hero-showcase-day-wod">{day.wod}</div>
              <div className="landing-hero-showcase-day-sub">{day.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="landing-hero-showcase-phone">
        <div className="landing-hero-showcase-phone-notch" />
        <div className="landing-hero-showcase-phone-label">AMRAP</div>
        <div
          className="landing-hero-showcase-ring"
          style={{
            background: `conic-gradient(${W.c.lime} 0% ${pct}%, oklch(0.26 0.012 250) ${pct}% 100%)`,
          }}
        >
          <div className="landing-hero-showcase-ring-inner">
            <span className="landing-hero-showcase-ring-status">
              {es ? '● EN MARCHA' : '● RUNNING'}
            </span>
            <span className="landing-hero-showcase-ring-time">{mm}:{ss}</span>
          </div>
        </div>
        <div className="landing-hero-showcase-wa">
          <span>◉</span>
          <span>{es ? 'Aviso enviado' : 'Notice sent'}</span>
        </div>
      </div>
    </div>
  )
}
