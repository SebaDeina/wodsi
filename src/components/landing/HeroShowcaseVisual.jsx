import { W } from '../../tokens'
import { t } from '../../i18n'

/** Visual del hero (derecha en desktop): planificación + timer, sin depender de assets externos. */
export function HeroShowcaseVisual({ lang }) {
  const es = lang === 'es'
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
        <div className="landing-hero-showcase-ring">
          <div className="landing-hero-showcase-ring-inner">
            <span className="landing-hero-showcase-ring-status">
              {es ? '● EN MARCHA' : '● RUNNING'}
            </span>
            <span className="landing-hero-showcase-ring-time">12:00</span>
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
