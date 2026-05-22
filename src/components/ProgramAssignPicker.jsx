import { W } from '../tokens'
import { segmentButtonStyle } from '../lib/segmentControl'
import { ASSIGNEE_BOX, ASSIGNEE_GROUP, ASSIGNEE_ATHLETE } from '../lib/programAssign'

const label = {
  fontSize: 11,
  fontFamily: W.font.mono,
  color: W.c.mute,
  letterSpacing: 0.8,
  marginBottom: 6,
  display: 'block',
}

export function ProgramAssignPicker({
  lang,
  assigneeType,
  groupId,
  athleteId,
  onChange,
  groups,
  athletes,
}) {
  const inp = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${W.c.lineDim}`,
    background: W.c.card,
    color: W.c.text,
    fontFamily: W.font.sans,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const tabs = [
    { type: ASSIGNEE_BOX, es: 'Todo el box', en: 'Whole gym' },
    { type: ASSIGNEE_GROUP, es: 'Un grupo', en: 'A group' },
    { type: ASSIGNEE_ATHLETE, es: 'Un atleta', en: 'One athlete' },
  ]

  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      background: W.c.bg2,
      border: `1px solid ${W.c.lineDim}`,
    }}>
      <label style={label}>{lang === 'es' ? '¿PARA QUIÉN ES ESTA PLANIFICACIÓN?' : 'WHO IS THIS PROGRAMMING FOR?'}</label>
      <p style={{ fontSize: 12, color: W.c.dim, margin: '0 0 12px', lineHeight: 1.45 }}>
        {lang === 'es'
          ? 'Elegí si la ven todos tus atletas, solo un grupo con el mismo objetivo, o una persona.'
          : 'Choose if all athletes see it, only a goal-based group, or one person.'}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {tabs.map(tab => (
          <button
            key={tab.type}
            type="button"
            onClick={() => onChange({ assigneeType: tab.type, groupId: '', athleteId: '' })}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: W.font.sans,
              ...segmentButtonStyle(assigneeType === tab.type),
            }}
          >
            {lang === 'es' ? tab.es : tab.en}
          </button>
        ))}
      </div>

      {assigneeType === ASSIGNEE_GROUP && (
        <div>
          <label style={label}>{lang === 'es' ? 'GRUPO' : 'GROUP'}</label>
          {groups.length === 0 ? (
            <p style={{ fontSize: 12, color: W.c.orange, margin: 0 }}>
              {lang === 'es'
                ? 'Creá un grupo en Planificación → Grupos antes de asignar.'
                : 'Create a group under Programming → Groups first.'}
            </p>
          ) : (
            <select
              value={groupId}
              onChange={e => onChange({ groupId: e.target.value })}
              required
              style={{ ...inp, cursor: 'pointer' }}
            >
              <option value="">{lang === 'es' ? 'Seleccionar grupo…' : 'Select group…'}</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({(g.memberIds || []).length} {lang === 'es' ? 'atletas' : 'athletes'})
                </option>
              ))}
            </select>
          )}
          {groupId && (() => {
            const g = groups.find(x => x.id === groupId)
            if (!g?.goal) return null
            return (
              <p style={{ fontSize: 11, color: W.c.mute, marginTop: 8, lineHeight: 1.4 }}>
                <span style={{ color: W.c.lime }}>{lang === 'es' ? 'Objetivo: ' : 'Goal: '}</span>
                {g.goal}
              </p>
            )
          })()}
        </div>
      )}

      {assigneeType === ASSIGNEE_ATHLETE && (
        <div>
          <label style={label}>{lang === 'es' ? 'ATLETA' : 'ATHLETE'}</label>
          {athletes.length === 0 ? (
            <p style={{ fontSize: 12, color: W.c.orange, margin: 0 }}>
              {lang === 'es' ? 'Invitá atletas primero desde la sección Atletas.' : 'Invite athletes from the Athletes section first.'}
            </p>
          ) : (
            <select
              value={athleteId}
              onChange={e => onChange({ athleteId: e.target.value })}
              required
              style={{ ...inp, cursor: 'pointer' }}
            >
              <option value="">{lang === 'es' ? 'Seleccionar atleta…' : 'Select athlete…'}</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.name || a.email}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}
