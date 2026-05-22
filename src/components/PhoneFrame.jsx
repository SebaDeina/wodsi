import { W } from '../tokens'

/**
 * @param {boolean} [fill] — ocupa todo el viewport (app atleta); scroll va en el main interno.
 */
export function PhoneFrame({ children, fill = false }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: fill ? '100%' : 390,
      height: '100%',
      minHeight: fill ? 0 : 640,
      maxHeight: fill ? 'none' : 844,
      flex: fill ? 1 : undefined,
      background: W.c.bg,
      color: W.c.text,
      fontFamily: W.font.sans,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </div>
  )
}
