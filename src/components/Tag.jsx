import { W } from '../tokens'

export function Tag({ tone = 'lime', children, sm }) {
  const color = W.c[tone] || W.c.lime
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: W.font.mono, fontSize: sm ? 9 : 10,
      fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
      color, padding: sm ? '2px 6px' : '3px 8px',
      borderRadius: 3, background: `${color}1a`,
      boxShadow: `inset 0 0 0 1px ${color}40`,
    }}>{children}</span>
  )
}
