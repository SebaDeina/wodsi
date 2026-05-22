import { W } from '../tokens'

export function AuthDivider({ lang }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: W.c.lineDim }} />
      <span style={{ fontSize: 12, color: W.c.mute, fontFamily: W.font.mono }}>{lang === 'es' ? 'O' : 'OR'}</span>
      <div style={{ flex: 1, height: 1, background: W.c.lineDim }} />
    </div>
  )
}
