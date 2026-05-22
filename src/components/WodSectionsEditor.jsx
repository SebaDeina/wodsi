import { useState } from 'react'
import { W } from '../tokens'
import { segmentButtonStyle } from '../lib/segmentControl'
import {
  emptySection,
  parseWodText,
  normalizeSections,
  SECTION_KINDS,
} from '../lib/wodSections'

const label = {
  fontSize: 11,
  fontFamily: W.font.mono,
  color: W.c.mute,
  letterSpacing: 0.8,
  marginBottom: 6,
  display: 'block',
}

export function WodSectionsEditor({ sections, onChange, lang }) {
  const [mode, setMode] = useState('paste')
  const [pasteText, setPasteText] = useState('')

  const inp = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${W.c.lineDim}`,
    background: W.c.card,
    color: W.c.text,
    fontFamily: W.font.sans,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  function updateSection(id, patch) {
    onChange(sections.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  function removeSection(id) {
    const next = sections.filter(s => s.id !== id)
    onChange(next.length ? next : [emptySection()])
  }

  function addSection() {
    onChange([...sections, emptySection()])
  }

  function applyPaste() {
    const parsed = parseWodText(pasteText)
    onChange(parsed.length ? parsed : [emptySection()])
    setMode('blocks')
  }

  function linesToText(lines) {
    return (lines.length ? lines : ['']).join('\n')
  }

  function textToLines(text) {
    return text.split('\n')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { id: 'paste', es: 'Pegar planificación', en: 'Paste programming' },
          { id: 'blocks', es: 'Editar bloques', en: 'Edit blocks' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              fontFamily: W.font.mono,
              fontSize: 11,
              cursor: 'pointer',
              ...segmentButtonStyle(mode === tab.id),
            }}
          >
            {lang === 'es' ? tab.es : tab.en}
          </button>
        ))}
      </div>

      {mode === 'paste' ? (
        <div>
          <label style={label}>
            {lang === 'es' ? 'PEGÁ EL TRABAJO DEL DÍA (COMO LO ESCRIBÍS HOY)' : "PASTE TODAY'S WORKOUT"}
          </label>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={14}
            placeholder={lang === 'es'
              ? `3 vueltas\n12 back extension desde ghd\n20 tuck ups con disco\n\n3 vueltas\n8 db RDL\n\nEmom 15/18'\n1) Burpees pull ups\n2) cal ski`
              : `3 rounds\n12 back extensions\n\nEMOM 15'\n1) Burpees\n2) Ski cal`}
            style={{
              ...inp,
              resize: 'vertical',
              lineHeight: 1.55,
              fontFamily: W.font.mono,
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={applyPaste}
            style={{
              marginTop: 10,
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: W.c.lime,
              color: W.c.bg,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: W.font.sans,
            }}
          >
            {lang === 'es' ? 'Convertir a bloques' : 'Convert to blocks'}
          </button>
          <p style={{ fontSize: 11, color: W.c.mute, marginTop: 10, lineHeight: 1.45 }}>
            {lang === 'es'
              ? 'Separá cada bloque con una línea en blanco. Detectamos "3 vueltas", EMOM, AMRAP, etc.'
              : 'Separate blocks with a blank line. We detect "3 rounds", EMOM, AMRAP, etc.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {normalizeSections(sections).map((section, idx) => (
            <div
              key={section.id}
              style={{
                padding: 16,
                borderRadius: 12,
                background: W.c.card,
                border: `1px solid ${W.c.lineDim}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.lime }}>
                  {lang === 'es' ? 'BLOQUE' : 'BLOCK'} {idx + 1}
                </span>
                <span style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: W.c.mute,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: W.font.mono,
                  }}
                >
                  {lang === 'es' ? 'Eliminar' : 'Remove'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={label}>{lang === 'es' ? 'TÍTULO DEL BLOQUE' : 'BLOCK TITLE'}</label>
                  <input
                    placeholder={lang === 'es' ? 'ej. 3 vueltas, Emom 15/18\'' : "e.g. 3 rounds, EMOM 15'"}
                    value={section.header}
                    onChange={e => updateSection(section.id, { header: e.target.value })}
                    style={inp}
                  />
                </div>
                <div>
                  <label style={label}>{lang === 'es' ? 'TIPO' : 'TYPE'}</label>
                  <select
                    value={section.kind}
                    onChange={e => updateSection(section.id, { kind: e.target.value })}
                    style={{ ...inp, cursor: 'pointer' }}
                  >
                    {SECTION_KINDS.map(k => (
                      <option key={k.value} value={k.value}>
                        {lang === 'es' ? k.labelEs : k.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {section.kind === 'rounds' && (
                <div style={{ marginBottom: 10, maxWidth: 120 }}>
                  <label style={label}>{lang === 'es' ? 'VUELTAS' : 'ROUNDS'}</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={section.rounds ?? ''}
                    onChange={e => updateSection(section.id, {
                      rounds: e.target.value ? Number(e.target.value) : null,
                    })}
                    style={inp}
                  />
                </div>
              )}

              <div>
                <label style={label}>
                  {lang === 'es' ? 'EJERCICIOS (UNO POR LÍNEA)' : 'MOVEMENTS (ONE PER LINE)'}
                </label>
                <textarea
                  value={linesToText(section.lines)}
                  onChange={e => updateSection(section.id, { lines: textToLines(e.target.value) })}
                  rows={Math.max(3, section.lines.length + 1)}
                  style={{
                    ...inp,
                    resize: 'vertical',
                    lineHeight: 1.55,
                    fontFamily: W.font.mono,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            style={{
              padding: '12px',
              borderRadius: 10,
              border: `1px dashed ${W.c.lineDim}`,
              background: 'transparent',
              color: W.c.lime,
              fontFamily: W.font.mono,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + {lang === 'es' ? 'Agregar bloque' : 'Add block'}
          </button>
        </div>
      )}
    </div>
  )
}

/** Estado inicial al crear WOD. */
export function initialWodSections() {
  return [emptySection()]
}

export function loadSectionsFromDoc(data) {
  if (Array.isArray(data?.sections) && data.sections.length) {
    return normalizeSections(data.sections)
  }
  if (data?.description?.trim()) {
    return parseWodText(data.description)
  }
  return initialWodSections()
}
