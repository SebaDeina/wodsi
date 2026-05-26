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
  custom: W.c.lime,
}

const KIND_LABEL = {
  rounds: { es: 'Vueltas', en: 'Rounds' },
  strength: { es: 'Fuerza', en: 'Strength' },
  emom: { es: 'EMOM', en: 'EMOM' },
  amrap: { es: 'AMRAP', en: 'AMRAP' },
  fortime: { es: 'For Time', en: 'For Time' },
  tabata: { es: 'Tabata', en: 'Tabata' },
  custom: { es: 'Bloque', en: 'Block' },
}

function kindLabel(kind, lang) {
  const label = KIND_LABEL[kind] || KIND_LABEL.custom
  return lang === 'es' ? label.es : label.en
}

function cleanLine(line) {
  return String(line || '').trim()
}

function SectionBlock({ section, lang, compact, index }) {
  const accent = KIND_ACCENT[section.kind] || W.c.lineDim
  const title = section.header || sectionDefaultHeader(section, lang)
  const lines = section.lines.map(cleanLine).filter(Boolean)
  const badgeTextColor = W.c.bg

  return (
    <div style={{
      marginBottom: compact ? 10 : 16,
      padding: compact ? 12 : 16,
      borderRadius: compact ? 16 : 22,
      background: `linear-gradient(180deg, ${W.c.cardHi}, ${W.c.card})`,
      border: `1px solid ${W.c.lineDim}`,
      boxShadow: compact ? 'none' : '0 14px 34px rgba(0,0,0,0.18)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: lines.length ? 12 : 0,
      }}>
        <span style={{
          width: compact ? 30 : 36,
          height: compact ? 30 : 36,
          borderRadius: 10,
          background: accent,
          color: badgeTextColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: W.font.mono,
          fontSize: compact ? 11 : 12,
          fontWeight: 900,
          flexShrink: 0,
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: W.font.mono,
            fontSize: compact ? 9 : 10,
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: accent,
            marginBottom: 3,
          }}>
            {kindLabel(section.kind, lang)}
            {section.rounds ? ` · ${section.rounds} ${lang === 'es' ? 'vueltas' : 'rounds'}` : ''}
          </div>
          <div style={{
            color: W.c.text,
            fontFamily: W.font.display,
            fontSize: compact ? 17 : 22,
            fontWeight: 800,
            letterSpacing: -0.8,
            lineHeight: 1.05,
            overflowWrap: 'anywhere',
          }}>
            {title}
          </div>
        </div>
      </div>
      {lines.length > 0 && (
        <div style={{
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 6 : 8,
        }}>
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr)',
                alignItems: 'start',
                padding: compact ? '8px 10px' : '10px 12px',
                borderRadius: compact ? 12 : 14,
                background: W.c.bg2,
                border: `1px solid ${W.c.lineDim}`,
              }}
            >
              <span style={{
                fontSize: compact ? 13 : 15,
                color: W.c.text,
                lineHeight: 1.45,
                overflowWrap: 'anywhere',
              }}>
                {line}
              </span>
            </div>
          ))}
        </div>
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
      {visible.map((s, index) => (
        <SectionBlock key={s.id} section={s} lang={lang} compact={compact} index={index} />
      ))}
      {maxSections && sections.length > maxSections && (
        <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono }}>
          +{sections.length - maxSections} {lang === 'es' ? 'bloques más' : 'more blocks'}
        </div>
      )}
    </div>
  )
}
