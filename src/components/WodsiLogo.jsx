import { W } from '../tokens'

export function WodsiLogo({ size = 22, mono = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: W.font.display, fontWeight: 700, fontSize: size,
      letterSpacing: -0.5, color: mono ? 'currentColor' : W.c.text,
      textDecoration: 'none',
    }}>
      <span style={{
        display: 'inline-block', width: size * 0.85, height: size * 0.85,
        background: mono ? 'currentColor' : W.c.lime, color: W.c.bg,
        borderRadius: 4, position: 'relative',
        boxShadow: mono ? 'none' : `0 0 ${size}px ${W.c.lime}40`,
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: size * 0.7, fontFamily: W.font.display,
          letterSpacing: -1, lineHeight: 1,
        }}>W</span>
      </span>
      <span style={{ lineHeight: 1 }}>wodsi</span>
    </span>
  )
}
