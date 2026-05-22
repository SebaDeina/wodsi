import { W } from '../tokens'
import {
  wodSectionsFromDoc,
  sectionDefaultHeader,
} from '../lib/wodSections'

const KIND_ACCENT = {
  rounds: W.c.lime,
  strength: W.c.lime,
  emom: W.c.blue,
  amrap: W.c.orange,
  fortime: W.c.orange,
  tabata: W.c.violet,
  custom: W.c.lineDim,
}

function SectionBlock({ section, lang, compact }) {
  const accent = KIND_ACCENT[section.kind] || W.c.lineDim
  const title = section.header || sectionDefaultHeader(section, lang)

  return (
    <div style={{
      marginBottom: compact ? 10 : 14,
      padding: compact ? '10px 12px' : '14px 14px',
      borderRadius: compact ? 10 : 12,
      background: W.c.bg2,
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{
        fontFamily: W.font.mono,
        fontSize: compact ? 10 : 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        color: accent,
        marginBottom: section.lines.length ? 8 : 0,
      }}>
        {title}
      </div>
      {section.lines.length > 0 && (
        <ul style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 4 : 6,
        }}>
          {section.lines.map((line, i) => (
            <li
              key={i}
              style={{
                fontSize: compact ? 12 : 14,
                color: W.c.text,
                lineHeight: 1.45,
                paddingLeft: line.match(/^\d+[\).]/) ? 0 : 0,
              }}
            >
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function WodSectionsView({ wod, lang = 'es', compact = false, maxSections }) {
  const sections = wodSectionsFromDoc(wod, lang)
  const visible = maxSections ? sections.slice(0, maxSections) : sections

  if (!visible.length) {
    if (wod?.description?.trim()) {
      return (
        <div style={{
          fontSize: compact ? 12 : 14,
          color: W.c.dim,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
        }}>
          {wod.description}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {visible.map(s => (
        <SectionBlock key={s.id} section={s} lang={lang} compact={compact} />
      ))}
      {maxSections && sections.length > maxSections && (
        <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono }}>
          +{sections.length - maxSections} {lang === 'es' ? 'bloques más' : 'more blocks'}
        </div>
      )}
    </div>
  )
}
