import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { t } from '../i18n'
import { W } from '../tokens'
import { WodsiLogo } from '../components/WodsiLogo'
import { Btn } from '../components/Btn'
import { Tag } from '../components/Tag'
import { Avatar } from '../components/Avatar'
import { ImgSlot } from '../components/ImgSlot'
import { Reveal } from '../components/landing/Reveal'
import { TimerPreviewMini } from '../components/landing/TimerPreviewMini'
import { HeroShowcaseVisual } from '../components/landing/HeroShowcaseVisual'
import './Landing.css'

const LANDING_TIMER_PILLS = [
  { id: 'amrap', label: 'AMRAP' },
  { id: 'emom', label: 'EMOM' },
  { id: 'fortime', label: 'For Time' },
  { id: 'tabata', label: 'Tabata' },
]

export default function Landing() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goLogin = () => { setMenuOpen(false); navigate('/login') }
  const goSignupCoach = () => { setMenuOpen(false); navigate('/register?role=coach') }

  const shell = {
    width: '100%',
    background: W.c.bg,
    color: W.c.text,
    fontFamily: W.font.sans,
    '--w-line-dim': W.c.lineDim,
  }

  return (
    <div className="landing" style={shell}>

      <header
        className={`landing-nav-wrap${navScrolled ? ' is-scrolled' : ''}`}
        style={{ '--w-line-dim': W.c.lineDim }}
      >
        <div className="landing-nav">
          <WodsiLogo size={22} />
          <div className="landing-nav-links" style={{ color: W.c.dim }}>
            <span className="landing-nav-link" role="presentation">{t('nav_coaches', lang)}</span>
            <span className="landing-nav-link" role="presentation">{t('nav_pricing', lang)}</span>
            <span className="landing-nav-link" role="presentation">Blog</span>
          </div>
          <div className="landing-nav-actions">
            <span style={{ cursor: 'pointer', fontSize: 14, color: W.c.dim }} onClick={goLogin}>
              {t('nav_login', lang)}
            </span>
            <Btn primary sm onClick={goSignupCoach}>{t('nav_demo', lang)} →</Btn>
          </div>
          <button
            type="button"
            className="landing-nav-toggle"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? '×' : '☰'}
          </button>
        </div>
        <div className={`landing-nav-drawer${menuOpen ? ' open' : ''}`} style={{ color: W.c.dim }}>
          <button type="button" onClick={() => setMenuOpen(false)}>{t('nav_coaches', lang)}</button>
          <button type="button" onClick={() => setMenuOpen(false)}>{t('nav_pricing', lang)}</button>
          <button type="button" onClick={() => setMenuOpen(false)}>Blog</button>
          <button type="button" onClick={goLogin}>{t('nav_login', lang)}</button>
          <Btn primary sm onClick={goSignupCoach} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
            {t('nav_demo', lang)} →
          </Btn>
        </div>
      </header>

      <section className="landing-section landing-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          className="landing-hero-glow"
          style={{
            position: 'absolute', right: -120, top: -80, width: 400, height: 400,
            background: `radial-gradient(circle, ${W.c.lime}25 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />

        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <Reveal delay={0}>
              <div className="landing-hero-kicker">
                <span className="landing-hero-kicker-line" />
                {t('hero_kicker', lang)}
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="landing-hero-title">
                {t('hero_title1', lang)},<br />
                {t('hero_title2', lang)},<br />
                <span className="landing-hero-title-accent">{t('hero_title3', lang)}</span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="landing-hero-sub">
                {t('hero_sub', lang)}
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="landing-hero-actions">
                <div className="landing-hero-ctas">
                  <Btn primary onClick={goSignupCoach}>{t('hero_cta1', lang)} →</Btn>
                  <Btn ghost>▷ &nbsp;{t('hero_cta2', lang)}</Btn>
                </div>
                <p className="landing-hero-cta-note">
                  {lang === 'es' ? 'SIN TARJETA · CANCELÁS CUANDO QUIERAS' : 'NO CARD · CANCEL ANYTIME'}
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="landing-hero-visual-wrap">
            <HeroShowcaseVisual lang={lang} />
          </Reveal>
        </div>

        <Reveal delay={280}>
        <div
          className="landing-hero-mockup landing-hero-mockup--wide"
          style={{
            marginTop: 40, position: 'relative',
            background: W.c.bg2, borderRadius: 16, padding: 16,
            boxShadow: `0 40px 100px ${W.c.lime}15, 0 0 0 1px ${W.c.line}`,
          }}
        >
          <div className="landing-hero-card-tabs" style={{
            display: 'flex', gap: 12, paddingBottom: 12, borderBottom: `1px solid ${W.c.lineDim}`,
            fontFamily: W.font.mono, fontSize: 10, letterSpacing: 0.5, color: W.c.mute, textTransform: 'uppercase',
          }}>
            <span style={{ color: W.c.lime }}>● {t('dashboard', lang)}</span>
            <span>{t('planning', lang)}</span>
            <span>{t('athletes_nav', lang)}</span>
            <span className="landing-hide-sm">WhatsApp</span>
            <div style={{ flex: 1, minWidth: 8 }} />
            <span>SEM 18</span>
          </div>
          <div className="landing-week-grid" style={{ marginTop: 16 }}>
            {['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map((d, i) => {
              const wods = [
                ['AMRAP 20', 'Strength · BS'],
                ['EMOM 18', 'OLY · Snatch'],
                ['For Time', 'Murph 30%'],
                ['Tabata', 'Gymnastics'],
                ['AMRAP 12', 'Engine 2k'],
                ['Partner', '"Fran" team'],
                ['REST', null],
              ][i]
              const rest = i === 6
              return (
                <div
                  key={d}
                  className={`landing-week-cell${rest ? ' is-rest' : ''}`}
                  style={{
                    background: rest ? 'transparent' : W.c.card,
                    border: rest ? `1px dashed ${W.c.lineDim}` : 'none',
                    borderRadius: 10, padding: 10, minHeight: 96, position: 'relative', overflow: 'hidden',
                    gridColumn: rest ? '1 / -1' : undefined,
                  }}
                >
                  <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.mute, letterSpacing: 0.8 }}>{d}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: W.font.display, marginTop: 4, color: rest ? W.c.mute : W.c.text }}>{4 + i}</div>
                  {wods[0] && <div style={{ marginTop: 6, fontSize: 10, color: rest ? W.c.mute : W.c.lime, fontFamily: W.font.mono, fontWeight: 600 }}>{wods[0]}</div>}
                  {wods[1] && <div style={{ fontSize: 10, color: W.c.dim, marginTop: 2 }}>{wods[1]}</div>}
                </div>
              )
            })}
          </div>
        </div>
        </Reveal>
      </section>

      <section className="landing-section landing-metrics" style={{ borderTop: `1px solid ${W.c.lineDim}`, borderBottom: `1px solid ${W.c.lineDim}` }}>
        {[['1.240','metric1'],['38.500','metric2'],['82k','metric3'],['4.9★','metric4']].map(([n, k], i) => (
          <Reveal key={k} delay={i * 70} className="landing-metric">
            <div className="landing-metrics-num" style={{ fontWeight: 700, letterSpacing: -2, fontFamily: W.font.display, lineHeight: 1, transition: 'color 0.3s ease' }}>{n}</div>
            <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono, marginTop: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>{t(k, lang)}</div>
          </Reveal>
        ))}
      </section>

      <section className="landing-section" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <Reveal className="landing-features-head" style={{ display: 'flex', marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.lime, letterSpacing: 2, marginBottom: 12 }}>FEATURES</div>
            <h2 style={{ fontSize: 'clamp(32px, 8vw, 72px)', lineHeight: 0.95, letterSpacing: -2, fontWeight: 700, margin: 0, maxWidth: 800, fontFamily: W.font.display }}>
              {t('feat_title', lang)}
            </h2>
          </div>
          <div className="landing-features-sub" style={{ fontSize: 15, color: W.c.dim }}>{t('feat_sub', lang)}</div>
        </Reveal>
        <div className="landing-features-grid">
          <FeatureCard1 lang={lang} />
          <FeatureCard2 lang={lang} />
          <FeatureCard3 lang={lang} />
          <FeatureCard4 lang={lang} />
        </div>
      </section>

      <section className="landing-section landing-testimonial" style={{ paddingTop: 64, paddingBottom: 64, background: W.c.bg2, position: 'relative', overflow: 'hidden' }}>
        <Reveal className="landing-testimonial-block">
        <div>
          <div style={{ fontFamily: W.font.display, fontSize: 80, lineHeight: 0.8, color: W.c.lime, fontWeight: 700, marginBottom: -12 }}>"</div>
          <p className="landing-testimonial-quote" style={{ lineHeight: 1.25, letterSpacing: -0.5, fontWeight: 500, margin: 0, fontFamily: W.font.display }}>
            {lang === 'es'
              ? 'Pasé de planillas y WhatsApp a tener todo el box ordenado en una tarde. Mis atletas entran y saben qué hacer.'
              : 'Went from spreadsheets and WhatsApp to a fully organized box in one afternoon. My athletes log in and know what to do.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24 }}>
            <Avatar name="JC" size={48} tone="orange" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Joaquín Casal</div>
              <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.4 }}>HEAD COACH · CROSSFIT BERAZATEGUI</div>
            </div>
          </div>
        </div>
        </Reveal>
        <Reveal delay={120}>
          <ImgSlot label="coach in box · 4:5" h={320} tone="orange" />
        </Reveal>
      </section>

      <section className="landing-section" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(32px, 8vw, 72px)', lineHeight: 0.95, letterSpacing: -2, fontWeight: 700, margin: '0 0 40px', maxWidth: 900, fontFamily: W.font.display }}>
            {t('pricing_t', lang)}
          </h2>
        </Reveal>
        <div className="landing-pricing-grid">
          {[
            { name: 'plan_starter', price: '12.000', limit: '20', desc: lang === 'es' ? 'Coach solo' : 'Solo coach' },
            { name: 'plan_box', price: '28.000', limit: '80', desc: lang === 'es' ? 'Box mediano' : 'Mid-size box', featured: true },
            { name: 'plan_chain', price: null, limit: '∞', desc: lang === 'es' ? 'Cadena / Personalizado' : 'Chain / Custom' },
          ].map((p, i) => (
            <PricingCard key={p.name} p={p} lang={lang} onCta={goSignupCoach} revealDelay={i * 90} />
          ))}
        </div>
      </section>

      <section className="landing-section landing-final-cta" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div
          className="landing-final-glow"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at center, ${W.c.lime}18 0%, transparent 60%)` }}
        />
        <Reveal style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(40px, 10vw, 120px)', fontWeight: 700, letterSpacing: -3, lineHeight: 0.92, fontFamily: W.font.display, margin: 0 }}>
            {lang === 'es' ? 'Tu box, ' : 'Your box, '}<br />
            <span style={{ color: W.c.lime, fontStyle: 'italic', fontWeight: 500 }}>
              {lang === 'es' ? 'sin caos.' : 'no chaos.'}
            </span>
          </h2>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Btn primary onClick={goSignupCoach}>{t('hero_cta1', lang)} →</Btn>
            <Btn ghost>{t('hero_cta2', lang)}</Btn>
          </div>
        </Reveal>
      </section>

      <footer className="landing-section landing-footer" style={{
        paddingTop: 32, paddingBottom: 32, borderTop: `1px solid ${W.c.lineDim}`,
        display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: W.c.mute, fontFamily: W.font.mono,
      }}>
        <WodsiLogo size={16} />
        <span>© 2026</span>
        <span style={{ flex: 1 }} />
        <span>BUENOS AIRES · MADRID · MIAMI</span>
        <span>hola@wodsi.app</span>
      </footer>
    </div>
  )
}

function cardShell(children, { delay = 0, gridColumn, hover = true } = {}) {
  return (
    <Reveal delay={delay} style={gridColumn ? { gridColumn } : undefined}>
      <div
        className={`landing-feature-card${hover ? '' : ' landing-feature-card--static'}`}
        style={{
          background: W.c.bg2,
          borderRadius: 16,
          padding: 24,
          minHeight: 280,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        {children}
      </div>
    </Reveal>
  )
}

function FeatureCard1({ lang }) {
  return cardShell(
    <>
      <Tag tone="lime">01 · {t('planning', lang).toUpperCase()}</Tag>
      <h3 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, letterSpacing: -1, margin: '16px 0 10px', fontFamily: W.font.display }}>{t('f1_t', lang)}</h3>
      <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.55, margin: 0 }}>{t('f1_d', lang)}</p>
      <div style={{ marginTop: 24, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="landing-feature-chip" style={{
            flex: '0 0 72px', background: W.c.card, padding: 8, borderRadius: 8, minHeight: 72,
            borderTop: `3px solid ${i === 2 ? W.c.lime : i === 4 ? W.c.orange : W.c.lineDim}`,
          }}>
            <div style={{ fontFamily: W.font.mono, fontSize: 8, color: W.c.mute }}>L M X</div>
            <div style={{ fontSize: 10, color: W.c.text, marginTop: 6, fontWeight: 600 }}>
              {['Squat','EMOM','Murph','Tabata','Engine'][i - 1]}
            </div>
          </div>
        ))}
      </div>
    </>,
    { delay: 0, gridColumn: '1 / -1' },
  )
}

function FeatureCard2({ lang }) {
  const WA = '#25D366'
  const rules = lang === 'es'
    ? ['Bienvenida al registrarse', 'Recordatorio de cuota', 'Cuota vencida (3 días)', 'Seguimiento inactivos']
    : ['Welcome on signup', 'Monthly fee reminder', 'Overdue (3 days)', 'Inactive follow-up']
  return cardShell(
    <>
      <Tag tone="lime">02 · WHATSAPP</Tag>
      <h3 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, letterSpacing: -1, margin: '16px 0 10px', fontFamily: W.font.display }}>{t('f2_t', lang)}</h3>
      <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.55, margin: 0 }}>{t('f2_d', lang)}</p>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.map((label, i) => (
          <div key={label} className="landing-wa-rule" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: W.c.card, borderRadius: 10, padding: '10px 12px',
            borderLeft: `3px solid ${i === 1 ? WA : W.c.lineDim}`,
          }}>
            <span style={{ fontSize: 16 }}>{i === 0 ? '👋' : i === 1 ? '💬' : i === 2 ? '⏰' : '📲'}</span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
            {i > 0 && i < 3 && (
              <span style={{ marginLeft: 'auto', fontFamily: W.font.mono, fontSize: 9, color: WA }}>AUTO</span>
            )}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 14, padding: '10px 12px', borderRadius: 10,
        background: `${WA}18`, fontSize: 11, color: W.c.dim, lineHeight: 1.45,
      }}>
        {lang === 'es'
          ? 'Conectás tu WhatsApp una vez; Wodsi encola y envía solo a atletas de tu roster.'
          : 'Connect WhatsApp once; Wodsi queues and sends only to athletes on your roster.'}
      </div>
    </>,
    { delay: 100 },
  )
}

function FeatureCard3({ lang }) {
  const [previewMode, setPreviewMode] = useState('amrap')

  return cardShell(
    <>
      <Tag tone="blue">03 · TIMERS</Tag>
      <h3 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, letterSpacing: -1, margin: '16px 0 10px', fontFamily: W.font.display }}>{t('f3_t', lang)}</h3>
      <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.55, margin: 0 }}>{t('f3_d', lang)}</p>
      <p style={{ fontSize: 12, color: W.c.mute, margin: '12px 0 0', lineHeight: 1.45 }}>
        {lang === 'es'
          ? 'Tocá cada modo para ver cómo se ve en el celular del atleta.'
          : 'Tap each mode to see how it looks on the athlete’s phone.'}
      </p>
      <div className="landing-timer-pills" role="tablist" aria-label={lang === 'es' ? 'Modos de timer' : 'Timer modes'}>
        {LANDING_TIMER_PILLS.map(pill => {
          const active = previewMode === pill.id
          return (
            <button
              key={pill.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`landing-timer-pill${active ? ' is-active' : ''}`}
              onClick={() => setPreviewMode(pill.id)}
            >
              {active ? `● ${pill.label}` : pill.label}
            </button>
          )
        })}
      </div>
      <TimerPreviewMini mode={previewMode} lang={lang} />
    </>,
    { delay: 200, hover: false },
  )
}

function FeatureCard4({ lang }) {
  return cardShell(
    <>
      <Tag tone="violet">04 · {t('history', lang).toUpperCase()}</Tag>
      <h3 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, letterSpacing: -1, margin: '16px 0 10px', fontFamily: W.font.display }}>{t('f4_t', lang)}</h3>
      <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.55, margin: 0 }}>{t('f4_d', lang)}</p>
      <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap', fontFamily: W.font.mono }}>
        {[['Back Squat','142 kg','+8'],['Snatch','92 kg','+4'],['Fran','3:14','−12s']].map(([n, v, d]) => (
          <div key={n}>
            <div style={{ fontSize: 9, color: W.c.mute }}>{n.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: W.font.display }}>{v}</div>
            <div style={{ fontSize: 10, color: W.c.lime }}>▲ {d}</div>
          </div>
        ))}
      </div>
    </>,
    { delay: 300 },
  )
}

function PricingCard({ p, lang, onCta, revealDelay = 0 }) {
  return (
    <Reveal delay={revealDelay}>
    <div
      className={`landing-pricing-card${p.featured ? ' is-featured' : ''}`}
      style={{
        background: p.featured ? W.c.lime : W.c.bg2,
        color: p.featured ? W.c.bg : W.c.text,
        borderRadius: 16, padding: 24, position: 'relative',
        boxShadow: p.featured ? `0 24px 80px ${W.c.lime}30` : 'none',
      }}
    >
      {p.featured && (
        <div style={{
          position: 'absolute', top: 20, right: 20,
          fontFamily: W.font.mono, fontSize: 10, fontWeight: 700,
          background: W.c.bg, color: W.c.lime, padding: '4px 8px', borderRadius: 3,
        }}>POPULAR</div>
      )}
      <div style={{ fontFamily: W.font.mono, fontSize: 11, letterSpacing: 1, opacity: 0.8 }}>{t(p.name, lang).toUpperCase()}</div>
      <div style={{ fontSize: 'clamp(48px, 12vw, 72px)', fontWeight: 700, letterSpacing: -2, marginTop: 12, fontFamily: W.font.display, lineHeight: 1 }}>
        {p.price !== null
          ? <>${p.price}</>
          : <span style={{ fontSize: 'clamp(22px, 5vw, 30px)', letterSpacing: -0.5 }}>
              {lang === 'es' ? 'A consultar' : 'On request'}
            </span>
        }
      </div>
      {p.price !== null && (
        <div style={{ fontSize: 11, opacity: 0.7, fontFamily: W.font.mono, marginTop: 4 }}>ARS {t('per_month', lang).toUpperCase()}</div>
      )}
      <div style={{ fontSize: 13, marginTop: 16, opacity: 0.85 }}>
        {p.desc} · {lang === 'es' ? 'hasta' : 'up to'} <strong>{p.limit}</strong> {t('athletes', lang)}
      </div>
      <button type="button" onClick={onCta} style={{
        width: '100%', padding: '14px', borderRadius: 999, border: 'none', marginTop: 20,
        background: p.featured ? W.c.bg : W.c.cardHi,
        color: p.featured ? W.c.lime : W.c.text,
        fontFamily: W.font.sans, fontWeight: 600, fontSize: 15, cursor: 'pointer',
      }}>{t('cta_pick', lang)} →</button>
    </div>
    </Reveal>
  )
}
