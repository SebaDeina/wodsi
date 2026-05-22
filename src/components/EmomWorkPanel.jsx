import { W } from '../tokens'
import { emomLineForMinute, emomLinesNumbered, stripEmomLinePrefix } from '../lib/emomDisplay'

export function EmomWorkPanel({ lines, round, lang }) {
  const clean = (lines || []).map(l => (l || '').trim()).filter(Boolean)
  if (!clean.length) return null

  const numbered = emomLinesNumbered(clean)
  const perMinute = numbered.length > 0
  const currentLines = perMinute ? emomLineForMinute(clean, round) : clean

  return (
    <div style={{ padding: '0 20px 10px' }}>
      <div style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: W.c.card,
        border: `1px solid ${W.c.lineDim}`,
        borderLeft: `3px solid ${W.c.blue}`,
      }}>
        <div style={{
          fontFamily: W.font.mono,
          fontSize: 10,
          letterSpacing: 1.2,
          color: W.c.blue,
          marginBottom: 8,
        }}>
          {perMinute
            ? `${lang === 'es' ? 'MINUTO' : 'MINUTE'} ${round}`
            : (lang === 'es' ? 'CADA MINUTO' : 'EVERY MINUTE')}
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {currentLines.map((line, i) => (
            <li key={i} style={{ fontSize: 14, color: W.c.text, lineHeight: 1.45 }}>
              {stripEmomLinePrefix(line)}
            </li>
          ))}
        </ul>
      </div>

      {perMinute && numbered.length > 1 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{
            fontFamily: W.font.mono,
            fontSize: 10,
            color: W.c.mute,
            cursor: 'pointer',
            letterSpacing: 0.8,
          }}>
            {lang === 'es' ? `Ver los ${numbered.length} minutos` : `View all ${numbered.length} minutes`}
          </summary>
          <ul style={{
            margin: '8px 0 0',
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 140,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>
            {numbered.map((line, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  color: i + 1 === round ? W.c.lime : W.c.dim,
                  lineHeight: 1.4,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: i + 1 === round ? `${W.c.blue}18` : 'transparent',
                }}
              >
                <span style={{ fontFamily: W.font.mono, fontSize: 10, marginRight: 6 }}>
                  {i + 1}.
                </span>
                {stripEmomLinePrefix(line)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
