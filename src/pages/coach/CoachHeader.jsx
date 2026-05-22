import { W } from '../../tokens'

export function CoachHeader({ title, subtitle, right }) {
  // title puede ser string o nodo (ej. icono + texto)
  return (
    <header style={{
      padding: '20px 32px', borderBottom: `1px solid ${W.c.lineDim}`,
      display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, fontFamily: W.font.display }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: W.c.mute, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>
    </header>
  )
}
