import { useLang } from '../context/LangContext'
import { W } from '../tokens'

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div style={{
      position: 'fixed', top: 14, right: 16, zIndex: 1000,
      display: 'flex', gap: 0, background: 'rgba(20,22,26,0.85)',
      backdropFilter: 'blur(12px)', padding: 4,
      borderRadius: 999, boxShadow: '0 4px 14px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)',
      fontFamily: W.font.mono, fontSize: 11, letterSpacing: 0.6,
    }}>
      {['es', 'en'].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          border: 0, padding: '6px 12px', borderRadius: 999,
          background: lang === l ? W.c.lime : 'transparent',
          color: lang === l ? W.c.bg : 'rgba(255,255,255,0.5)',
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 'inherit', fontWeight: 600,
          letterSpacing: 'inherit',
        }}>{l.toUpperCase()}</button>
      ))}
    </div>
  )
}
