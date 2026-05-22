import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { t } from '../i18n'
import { W } from '../tokens'
import { WodsiLogo } from '../components/WodsiLogo'
import { Btn } from '../components/Btn'
import { Tag } from '../components/Tag'
import { Avatar } from '../components/Avatar'
import { ImgSlot } from '../components/ImgSlot'

export default function Landing() {
  const { lang } = useLang()
  const navigate  = useNavigate()

  const goLogin = () => navigate('/login')
  const goSignupCoach = () => navigate('/register?role=coach')

  return (
    <div style={{ width: '100%', background: W.c.bg, color: W.c.text, fontFamily: W.font.sans, overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '24px 64px',
        borderBottom: `1px solid ${W.c.lineDim}`, position: 'sticky', top: 0, zIndex: 100,
        background: `${W.c.bg}ee`, backdropFilter: 'blur(12px)',
      }}>
        <WodsiLogo size={22} />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', fontSize: 14, color: W.c.dim }}>
          <span style={{ cursor: 'pointer' }}>{t('nav_coaches', lang)}</span>
          <span style={{ cursor: 'pointer' }}>{t('nav_pricing', lang)}</span>
          <span style={{ cursor: 'pointer' }}>Blog</span>
          <span style={{ cursor: 'pointer' }} onClick={goLogin}>{t('nav_login', lang)}</span>
          <Btn primary sm onClick={goSignupCoach}>{t('nav_demo', lang)} →</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 64px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', right: -200, top: -150, width: 700, height: 700,
          background: `radial-gradient(circle, ${W.c.lime}25 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          fontFamily: W.font.mono, fontSize: 12, letterSpacing: 2,
          color: W.c.lime, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ width: 24, height: 1, background: W.c.lime }} />
          {t('hero_kicker', lang)}
        </div>
        <h1 style={{
          fontSize: 'clamp(64px, 9vw, 132px)', lineHeight: 0.92, letterSpacing: -5,
          fontWeight: 700, margin: '0 0 28px', maxWidth: 1100, fontFamily: W.font.display,
        }}>
          {t('hero_title1', lang)},<br />
          {t('hero_title2', lang)},<br />
          <span style={{ color: W.c.lime, fontStyle: 'italic', fontWeight: 500 }}>{t('hero_title3', lang)}</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.5, color: W.c.dim, maxWidth: 620, margin: '0 0 40px' }}>
          {t('hero_sub', lang)}
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn primary onClick={goSignupCoach}>{t('hero_cta1', lang)} →</Btn>
          <Btn ghost>▷ &nbsp;{t('hero_cta2', lang)}</Btn>
          <span style={{ marginLeft: 16, fontSize: 12, color: W.c.mute, fontFamily: W.font.mono }}>
            SIN TARJETA · CANCELÁS CUANDO QUIERAS
          </span>
        </div>

        {/* Hero product card */}
        <div style={{
          marginTop: 64, position: 'relative',
          background: W.c.bg2, borderRadius: 16, padding: 24,
          boxShadow: `0 40px 100px ${W.c.lime}15, 0 0 0 1px ${W.c.line}`,
        }}>
          <div style={{
            display: 'flex', gap: 16, paddingBottom: 16, borderBottom: `1px solid ${W.c.lineDim}`,
            fontFamily: W.font.mono, fontSize: 11, letterSpacing: 0.5, color: W.c.mute, textTransform: 'uppercase',
          }}>
            <span style={{ color: W.c.lime }}>● {t('dashboard', lang)}</span>
            <span>{t('planning', lang)}</span>
            <span>{t('athletes_nav', lang)}</span>
            <span>{t('billing', lang)}</span>
            <div style={{ flex: 1 }} />
            <span>SEMANA 18 · MAY 2026</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 20 }}>
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
                <div key={d} style={{
                  background: rest ? 'transparent' : W.c.card,
                  border: rest ? `1px dashed ${W.c.lineDim}` : 'none',
                  borderRadius: 10, padding: 12, minHeight: 120, position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.8 }}>{d}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: W.font.display, marginTop: 4, color: rest ? W.c.mute : W.c.text }}>{4 + i}</div>
                  {wods[0] && <div style={{ marginTop: 8, fontSize: 11, color: rest ? W.c.mute : W.c.lime, fontFamily: W.font.mono, fontWeight: 600, letterSpacing: 0.3 }}>{wods[0]}</div>}
                  {wods[1] && <div style={{ fontSize: 11, color: W.c.dim, marginTop: 2 }}>{wods[1]}</div>}
                  {!rest && i < 5 && (
                    <div style={{ position: 'absolute', bottom: 8, left: 12, right: 12, height: 3, background: W.c.lineDim, borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${30 + i * 15}%`, background: i === 0 ? W.c.lime : W.c.orange, borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section style={{
        padding: '40px 64px', borderTop: `1px solid ${W.c.lineDim}`, borderBottom: `1px solid ${W.c.lineDim}`,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32,
      }}>
        {[['1.240','metric1'],['38.500','metric2'],['82k','metric3'],['4.9★','metric4']].map(([n, k]) => (
          <div key={k}>
            <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -2, fontFamily: W.font.display, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 12, color: W.c.mute, fontFamily: W.font.mono, marginTop: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>{t(k, lang)}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: '120px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 56 }}>
          <div>
            <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.lime, letterSpacing: 2, marginBottom: 16 }}>FEATURES</div>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.95, letterSpacing: -2.5, fontWeight: 700, margin: 0, maxWidth: 800, fontFamily: W.font.display }}>
              {t('feat_title', lang)}
            </h2>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 16, color: W.c.dim, maxWidth: 320, textAlign: 'right' }}>{t('feat_sub', lang)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ background: W.c.bg2, borderRadius: 16, padding: 32, minHeight: 380, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <Tag tone="lime">01 · {t('planning', lang).toUpperCase()}</Tag>
            <h3 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, margin: '20px 0 12px', fontFamily: W.font.display }}>{t('f1_t', lang)}</h3>
            <p style={{ fontSize: 15, color: W.c.dim, lineHeight: 1.55, maxWidth: 420, margin: 0 }}>{t('f1_d', lang)}</p>
            <div style={{ marginTop: 32, display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{
                  flex: 1, background: W.c.card, padding: 10, borderRadius: 8, minHeight: 90,
                  borderTop: `3px solid ${i === 2 ? W.c.lime : i === 4 ? W.c.orange : W.c.lineDim}`,
                }}>
                  <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.mute }}>L M X J V</div>
                  <div style={{ fontSize: 11, color: W.c.text, marginTop: 8, fontWeight: 600 }}>
                    {['Squat','EMOM','Murph','Tabata','Engine'][i - 1]}
                  </div>
                  <div style={{ fontSize: 10, color: W.c.mute, marginTop: 2, fontFamily: W.font.mono }}>{[45,38,52,16,28][i-1]}min</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: W.c.bg2, borderRadius: 16, padding: 32, minHeight: 380, position: 'relative', overflow: 'hidden' }}>
            <Tag tone="orange">02 · {t('billing', lang).toUpperCase()}</Tag>
            <h3 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, margin: '20px 0 12px', fontFamily: W.font.display }}>{t('f2_t', lang)}</h3>
            <p style={{ fontSize: 15, color: W.c.dim, lineHeight: 1.55, margin: 0 }}>{t('f2_d', lang)}</p>
            <div style={{ marginTop: 28, fontFamily: W.font.mono }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: W.c.orange, letterSpacing: -1.5, fontFamily: W.font.display }}>$ 4.380.000</div>
              <div style={{ fontSize: 11, color: W.c.mute, letterSpacing: 0.5 }}>MRR · {lang === 'es' ? 'CRECIENDO' : 'GROWING'} +12% MoM</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, marginTop: 16 }}>
                {[20,28,24,38,30,42,46,52,48,60,64,72].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: i > 8 ? W.c.orange : W.c.cardHi, borderRadius: 2 }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: W.c.bg2, borderRadius: 16, padding: 32, minHeight: 340, position: 'relative', overflow: 'hidden' }}>
            <Tag tone="blue">03 · TIMERS</Tag>
            <h3 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, margin: '20px 0 12px', fontFamily: W.font.display }}>{t('f3_t', lang)}</h3>
            <p style={{ fontSize: 15, color: W.c.dim, lineHeight: 1.55, margin: 0 }}>{t('f3_d', lang)}</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['EMOM','AMRAP','For Time','Tabata'].map(name => (
                <div key={name} style={{
                  padding: '14px 18px', background: W.c.card, borderRadius: 10,
                  fontFamily: W.font.mono, fontSize: 13, fontWeight: 600,
                  color: name === 'AMRAP' ? W.c.lime : W.c.text,
                  boxShadow: name === 'AMRAP' ? `inset 0 0 0 1px ${W.c.lime}` : 'none',
                }}>
                  {name === 'AMRAP' && '● '}{name}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: W.c.bg2, borderRadius: 16, padding: 32, minHeight: 340, position: 'relative', overflow: 'hidden' }}>
            <Tag tone="violet">04 · {t('history', lang).toUpperCase()}</Tag>
            <h3 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, margin: '20px 0 12px', fontFamily: W.font.display }}>{t('f4_t', lang)}</h3>
            <p style={{ fontSize: 15, color: W.c.dim, lineHeight: 1.55, margin: 0, maxWidth: 460 }}>{t('f4_d', lang)}</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 24, fontFamily: W.font.mono }}>
              {[['Back Squat','142 kg','+8'],['Snatch','92 kg','+4'],['Fran','3:14','−12s']].map(([n, v, d]) => (
                <div key={n}>
                  <div style={{ fontSize: 10, color: W.c.mute, letterSpacing: 0.5 }}>{n.toUpperCase()}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: W.font.display, letterSpacing: -1 }}>{v}</div>
                  <div style={{ fontSize: 11, color: W.c.lime }}>▲ {d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ padding: '100px 64px', background: W.c.bg2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: W.font.display, fontSize: 120, lineHeight: 0.8, color: W.c.lime, fontWeight: 700, marginBottom: -20 }}>"</div>
            <p style={{ fontSize: 36, lineHeight: 1.25, letterSpacing: -0.8, fontWeight: 500, margin: 0, fontFamily: W.font.display }}>
              {lang === 'es'
                ? 'Pasé de planillas y WhatsApp a tener todo el box ordenado en una tarde. Mis atletas entran y saben qué hacer.'
                : 'Went from spreadsheets and WhatsApp to a fully organized box in one afternoon. My athletes log in and know what to do.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32 }}>
              <Avatar name="JC" size={48} tone="orange" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Joaquín Casal</div>
                <div style={{ fontSize: 12, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.4 }}>HEAD COACH · CROSSFIT BERAZATEGUI</div>
              </div>
            </div>
          </div>
          <ImgSlot label="coach in box · 4:5" h={500} tone="orange" />
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '120px 64px' }}>
        <h2 style={{ fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.95, letterSpacing: -2.5, fontWeight: 700, margin: '0 0 56px', maxWidth: 900, fontFamily: W.font.display }}>
          {t('pricing_t', lang)}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'plan_starter', price: '12.000', limit: '20', desc: lang === 'es' ? 'Coach solo' : 'Solo coach' },
            { name: 'plan_box', price: '28.000', limit: '80', desc: lang === 'es' ? 'Box mediano' : 'Mid-size box', featured: true },
            { name: 'plan_chain', price: '—', limit: '∞', desc: lang === 'es' ? 'Cadena / Custom' : 'Chain / Custom' },
          ].map((p) => (
            <div key={p.name} style={{
              background: p.featured ? W.c.lime : W.c.bg2,
              color: p.featured ? W.c.bg : W.c.text,
              borderRadius: 16, padding: 32, position: 'relative',
              boxShadow: p.featured ? `0 24px 80px ${W.c.lime}30` : 'none',
            }}>
              {p.featured && (
                <div style={{
                  position: 'absolute', top: 24, right: 24,
                  fontFamily: W.font.mono, fontSize: 10, fontWeight: 700,
                  background: W.c.bg, color: W.c.lime, padding: '4px 8px', borderRadius: 3, letterSpacing: 0.5,
                }}>POPULAR</div>
              )}
              <div style={{ fontFamily: W.font.mono, fontSize: 12, letterSpacing: 1, opacity: 0.8 }}>{t(p.name, lang).toUpperCase()}</div>
              <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -3, marginTop: 16, fontFamily: W.font.display, lineHeight: 1 }}>
                {p.price === '—' ? p.price : <>${p.price}</>}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, fontFamily: W.font.mono, letterSpacing: 0.5, marginTop: 4 }}>ARS {t('per_month', lang).toUpperCase()}</div>
              <div style={{ fontSize: 14, marginTop: 24, opacity: 0.85 }}>
                {p.desc} · {lang === 'es' ? 'hasta' : 'up to'} <strong>{p.limit}</strong> {t('athletes', lang)}
              </div>
              <div style={{ borderTop: `1px solid ${p.featured ? '#0002' : W.c.lineDim}`, margin: '24px 0', paddingTop: 24, fontSize: 13, lineHeight: 1.9 }}>
                {[
                  lang === 'es' ? 'Planificación ilimitada' : 'Unlimited planning',
                  lang === 'es' ? 'Cobros Stripe + MP' : 'Stripe + MP billing',
                  lang === 'es' ? 'Timers integrados' : 'Built-in timers',
                  p.featured ? (lang === 'es' ? 'Reportes avanzados' : 'Advanced reports') : null,
                  p.name === 'plan_chain' ? (lang === 'es' ? 'Múltiples sedes' : 'Multi-location') : null,
                  p.name === 'plan_chain' ? 'SSO + API' : null,
                ].filter(Boolean).map(x => (
                  <div key={x} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: p.featured ? W.c.bg : W.c.lime, fontWeight: 700 }}>✓</span>{x}
                  </div>
                ))}
              </div>
              <button onClick={goSignupCoach} style={{
                width: '100%', padding: '14px', borderRadius: 999, border: 'none',
                background: p.featured ? W.c.bg : W.c.cardHi,
                color: p.featured ? W.c.lime : W.c.text,
                fontFamily: W.font.sans, fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}>{t('cta_pick', lang)} →</button>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '140px 64px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at center, ${W.c.lime}18 0%, transparent 60%)` }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(64px, 8vw, 120px)', fontWeight: 700, letterSpacing: -5, lineHeight: 0.92, fontFamily: W.font.display, margin: 0 }}>
            {lang === 'es' ? 'Tu box, ' : 'Your box, '}<br />
            <span style={{ color: W.c.lime, fontStyle: 'italic', fontWeight: 500 }}>
              {lang === 'es' ? 'sin caos.' : 'no chaos.'}
            </span>
          </h2>
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 12 }}>
            <Btn primary onClick={goSignupCoach}>{t('hero_cta1', lang)} →</Btn>
            <Btn ghost>{t('hero_cta2', lang)}</Btn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 64px', borderTop: `1px solid ${W.c.lineDim}`,
        display: 'flex', alignItems: 'center', gap: 32, fontSize: 12, color: W.c.mute, fontFamily: W.font.mono,
        flexWrap: 'wrap',
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
