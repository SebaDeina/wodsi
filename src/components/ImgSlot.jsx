import { W } from '../tokens'

export function ImgSlot({ label, h = 200, dark = true, tone = 'lime' }) {
  const stripe  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const stripe2 = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
  const accent  = W.c[tone] || W.c.lime
  return (
    <div style={{
      height: h, width: '100%',
      background: dark ? W.c.bg2 : '#eee',
      backgroundImage: `repeating-linear-gradient(135deg, ${stripe} 0 14px, ${stripe2} 14px 28px)`,
      backgroundBlendMode: 'overlay',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'flex-end', padding: 16,
      fontFamily: W.font.mono, fontSize: 10, letterSpacing: 0.5,
      color: dark ? W.c.mute : '#555', textTransform: 'uppercase',
      borderRadius: 2,
    }}>
      <span style={{ background: accent, color: W.c.bg, padding: '2px 6px', fontWeight: 600 }}>
        {label}
      </span>
    </div>
  )
}
