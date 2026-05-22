import { W } from '../tokens'

const inp = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${W.c.lineDim}`,
  background: W.c.bg2,
  color: W.c.text,
  fontFamily: W.font.mono,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

const label = {
  fontSize: 10,
  fontFamily: W.font.mono,
  color: W.c.mute,
  letterSpacing: 0.8,
  marginBottom: 4,
  display: 'block',
}

function Field({ lbl, children }) {
  return (
    <div>
      <span style={label}>{lbl}</span>
      {children}
    </div>
  )
}

export function TimerPrefsFields({ mode, prefs, onChange, lang }) {
  const patch = (key, val) => onChange({ [key]: val })

  if (mode === 'amrap') {
    return (
      <Field lbl={lang === 'es' ? 'MINUTOS' : 'MINUTES'}>
        <input
          type="number"
          min={1}
          max={180}
          value={prefs.totalMinutes}
          onChange={e => patch('totalMinutes', Math.max(1, Number(e.target.value) || 1))}
          style={inp}
        />
      </Field>
    )
  }

  if (mode === 'emom') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field lbl={lang === 'es' ? 'RONDAS / MIN' : 'ROUNDS / MIN'}>
          <input
            type="number"
            min={1}
            max={60}
            value={prefs.rounds}
            onChange={e => patch('rounds', Math.max(1, Number(e.target.value) || 1))}
            style={inp}
          />
        </Field>
        <Field lbl={lang === 'es' ? 'SEG / INTERVALO' : 'SEC / INTERVAL'}>
          <input
            type="number"
            min={10}
            max={300}
            value={prefs.minuteSeconds}
            onChange={e => patch('minuteSeconds', Math.max(10, Number(e.target.value) || 60))}
            style={inp}
          />
        </Field>
      </div>
    )
  }

  if (mode === 'fortime') {
    return (
      <Field lbl={lang === 'es' ? 'CAP (MIN, 0 = sin límite)' : 'CAP (MIN, 0 = no limit)'}>
        <input
          type="number"
          min={0}
          max={180}
          value={prefs.capMinutes ?? 0}
          onChange={e => {
            const n = Number(e.target.value)
            patch('capMinutes', n > 0 ? n : null)
          }}
          style={inp}
        />
      </Field>
    )
  }

  if (mode === 'tabata') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Field lbl={lang === 'es' ? 'RONDAS' : 'ROUNDS'}>
          <input
            type="number"
            min={1}
            max={30}
            value={prefs.rounds}
            onChange={e => patch('rounds', Math.max(1, Number(e.target.value) || 1))}
            style={inp}
          />
        </Field>
        <Field lbl={lang === 'es' ? 'TRABAJO' : 'WORK'}>
          <input
            type="number"
            min={5}
            max={120}
            value={prefs.workSeconds}
            onChange={e => patch('workSeconds', Math.max(5, Number(e.target.value) || 20))}
            style={inp}
          />
        </Field>
        <Field lbl="REST">
          <input
            type="number"
            min={5}
            max={120}
            value={prefs.restSeconds}
            onChange={e => patch('restSeconds', Math.max(5, Number(e.target.value) || 10))}
            style={inp}
          />
        </Field>
      </div>
    )
  }

  return null
}
