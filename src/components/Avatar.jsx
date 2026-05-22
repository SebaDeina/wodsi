import { W } from '../tokens'

export function Avatar({ name = 'JD', size = 32, tone }) {
  const seed = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 4
  const tones = ['lime', 'orange', 'blue', 'violet']
  const c = W.c[tone || tones[seed]]
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: c, color: W.c.bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: W.font.display, fontWeight: 700, fontSize: size * 0.4,
      letterSpacing: -0.5, flexShrink: 0,
    }}>{name.slice(0, 2).toUpperCase()}</span>
  )
}
