import { W } from '../../tokens'
import { useIsMobile } from '../../hooks/useBreakpoint'

export function CoachHeader({ title, subtitle, right }) {
  const isMobile = useIsMobile(1024)

  if (isMobile) {
    return (
      <header style={{
        padding: '14px 16px', borderBottom: `1px solid ${W.c.lineDim}`,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4, fontFamily: W.font.display }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: W.c.mute, marginTop: 2, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        )}
        {right && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            {right}
          </div>
        )}
      </header>
    )
  }

  return (
    <header style={{
      padding: '20px 32px', borderBottom: `1px solid ${W.c.lineDim}`,
      display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, fontFamily: W.font.display }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: W.c.mute, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>
    </header>
  )
}
