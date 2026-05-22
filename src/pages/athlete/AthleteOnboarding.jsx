import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { PhoneFrame } from '../../components/PhoneFrame'
import { Btn } from '../../components/Btn'

export default function AthleteOnboarding() {
  const { lang } = useLang()
  return (
    <div style={{ minHeight: '100dvh', background: W.c.bg, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <PhoneFrame>
        <div style={{ padding: '20px 20px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 2 ? W.c.lime : W.c.lineDim }} />
            ))}
          </div>
          <div style={{ fontFamily: W.font.mono, fontSize: 11, color: W.c.lime, letterSpacing: 2, marginBottom: 16 }}>
            STEP 2 / 4 · {lang === 'es' ? 'TU OBJETIVO' : 'YOUR GOAL'}
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.8, lineHeight: 1.02, margin: '0 0 12px', fontFamily: W.font.display }}>
            {lang === 'es' ? '¿Qué venís a buscar?' : 'What are you here for?'}
          </h1>
          <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.5, margin: '0 0 28px' }}>
            {lang === 'es' ? 'Tu coach va a ajustar el plan en base a esto. Podés cambiarlo después.' : 'Your coach will tailor the plan around this. You can change it later.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {[
              ['🏋', lang === 'es' ? 'Más fuerza' : 'Get stronger', 'lime', true],
              ['🔥', lang === 'es' ? 'Bajar grasa' : 'Lose fat', 'orange', false],
              ['⏱', lang === 'es' ? 'Mejorar engine' : 'Improve engine', 'blue', false],
              ['🥇', lang === 'es' ? 'Competir (Open / Local)' : 'Compete (Open / Local)', 'violet', false],
            ].map(([ic, label, c, sel], i) => (
              <div key={i} style={{
                padding: 18, background: sel ? W.c[c] : W.c.card, color: sel ? W.c.bg : W.c.text,
                borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: sel ? `0 8px 24px ${W.c[c]}40` : 'none', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 22 }}>{ic}</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
                <span style={{ flex: 1 }} />
                <span style={{
                  width: 22, height: 22, borderRadius: 11,
                  border: `2px solid ${sel ? W.c.bg : W.c.lineDim}`,
                  background: sel ? W.c.bg : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <span style={{ width: 8, height: 8, borderRadius: 4, background: W.c[c] }} />}
                </span>
              </div>
            ))}
          </div>
          <div style={{ paddingBottom: 32, paddingTop: 16 }}>
            <Btn primary style={{ width: '100%', justifyContent: 'center', padding: '18px' }}>
              {lang === 'es' ? 'Continuar' : 'Continue'} →
            </Btn>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.4 }}>
              {lang === 'es' ? 'PASO 2 DE 4 · OBJETIVO' : 'STEP 2 OF 4 · GOAL'}
            </div>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
