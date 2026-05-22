import { W } from '../tokens'

export function Btn({ children, primary, ghost, sm, style, ...rest }) {
  const base = {
    fontFamily: W.font.sans, fontWeight: 600,
    fontSize: sm ? 13 : 15, letterSpacing: -0.1,
    padding: sm ? '8px 14px' : '14px 22px',
    borderRadius: 999, border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
    transition: 'transform .1s, background .15s',
  }
  const variant = primary
    ? { background: W.c.lime, color: W.c.bg }
    : ghost
    ? { background: 'transparent', color: W.c.text, boxShadow: `inset 0 0 0 1px ${W.c.line}` }
    : { background: W.c.cardHi, color: W.c.text }
  return <button style={{ ...base, ...variant, ...style }} {...rest}>{children}</button>
}
