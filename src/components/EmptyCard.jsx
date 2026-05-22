import { W } from '../tokens'

export function EmptyCard({ title, hint, style }) {
  return (
    <div style={{
      background: W.c.card,
      borderRadius: 14,
      padding: 20,
      textAlign: 'center',
      border: `1px dashed ${W.c.lineDim}`,
      ...style,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: W.c.text }}>{title}</div>
      {hint && (
        <div style={{ fontSize: 12, color: W.c.mute, marginTop: 6, lineHeight: 1.45 }}>{hint}</div>
      )}
    </div>
  )
}
