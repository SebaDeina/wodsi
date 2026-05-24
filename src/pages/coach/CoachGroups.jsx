import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useLang } from '../../context/LangContext'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { W } from '../../tokens'
import { segmentButtonStyle } from '../../lib/segmentControl'
import { DesktopChrome } from '../../components/DesktopChrome'
import { CoachHeader } from './CoachHeader'
import { Btn } from '../../components/Btn'
import { Avatar } from '../../components/Avatar'

function emptyForm() {
  return { name: '', goal: '', memberIds: [] }
}

export default function CoachGroups() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { athletes, loading: athletesLoading } = useCoachAthletes()
  const { groups, loading, createGroup, updateGroup, deleteGroup } = useCoachGroups()

  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function startCreate() {
    setEditingId('new')
    setForm(emptyForm())
    setError('')
  }

  function startEdit(group) {
    setEditingId(group.id)
    setForm({
      name: group.name || '',
      goal: group.goal || '',
      memberIds: [...(group.memberIds || [])],
    })
    setError('')
  }

  function toggleMember(athleteId) {
    setForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(athleteId)
        ? prev.memberIds.filter(id => id !== athleteId)
        : [...prev.memberIds, athleteId],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(lang === 'es' ? 'El nombre del grupo es obligatorio.' : 'Group name is required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      if (editingId === 'new') {
        const id = await createGroup(form)
        for (const athleteId of form.memberIds) {
          await updateDoc(doc(db, 'users', athleteId), { programGroupId: id })
        }
      } else {
        await updateGroup(editingId, form)
        if (editingId !== 'new') {
          await Promise.all(
            athletes.map(a => {
              const inGroup = form.memberIds.includes(a.id)
              const shouldSet = inGroup ? editingId : null
              if (a.programGroupId === editingId && !inGroup) {
                return updateDoc(doc(db, 'users', a.id), { programGroupId: null })
              }
              if (inGroup && a.programGroupId !== editingId) {
                return updateDoc(doc(db, 'users', a.id), { programGroupId: shouldSet })
              }
              return Promise.resolve()
            }),
          )
        }
      }
      setEditingId(null)
      setForm(emptyForm())
    } catch {
      setError(lang === 'es'
        ? 'No pudimos guardar el grupo. Intentá de nuevo.'
        : 'We could not save the group. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(groupId) {
    if (!window.confirm(lang === 'es' ? '¿Eliminar este grupo?' : 'Delete this group?')) return
    setBusy(true)
    try {
      await deleteGroup(groupId)
      for (const a of athletes.filter(x => x.programGroupId === groupId)) {
        await updateDoc(doc(db, 'users', a.id), { programGroupId: null })
      }
      if (editingId === groupId) {
        setEditingId(null)
        setForm(emptyForm())
      }
    } catch {
      setError(lang === 'es'
        ? 'No pudimos eliminar el grupo. Intentá de nuevo.'
        : 'We could not delete the group. Try again.')
    } finally {
      setBusy(false)
    }
  }

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

  const label = {
    fontSize: 11,
    fontFamily: W.font.mono,
    color: W.c.mute,
    letterSpacing: 0.8,
    marginBottom: 6,
    display: 'block',
  }

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={lang === 'es' ? 'Grupos de planificación' : 'Programming groups'}
        subtitle={lang === 'es'
          ? 'Atletas con el mismo objetivo comparten la planificación del grupo'
          : 'Athletes with the same goal share the group programming'}
        right={(
          <Btn primary sm onClick={startCreate} disabled={editingId === 'new'}>
            + {lang === 'es' ? 'Nuevo grupo' : 'New group'}
          </Btn>
        )}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
          {loading ? (
            <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>…</div>
          ) : groups.length === 0 && !editingId ? (
            <div style={{
              padding: 48,
              textAlign: 'center',
              border: `1px dashed ${W.c.lineDim}`,
              borderRadius: 14,
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                {lang === 'es' ? 'Todavía no tenés grupos' : 'No groups yet'}
              </div>
              <p style={{ fontSize: 13, color: W.c.dim, maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>
                {lang === 'es'
                  ? 'Ej: "Competidores", "Principiantes", "Recuperación hombro". Después asignás la planificación al grupo.'
                  : 'E.g. "Competitors", "Beginners", "Shoulder rehab". Then assign programming to the group.'}
              </p>
              <Btn primary onClick={startCreate}>+ {lang === 'es' ? 'Crear primer grupo' : 'Create first group'}</Btn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
              {groups.map(g => (
                <div
                  key={g.id}
                  style={{
                    padding: 18,
                    borderRadius: 12,
                    background: W.c.card,
                    border: `1px solid ${editingId === g.id ? W.c.lime : W.c.lineDim}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{g.name}</div>
                      {g.goal && (
                        <div style={{ fontSize: 13, color: W.c.dim, marginTop: 6, lineHeight: 1.4 }}>{g.goal}</div>
                      )}
                      <div style={{ fontFamily: W.font.mono, fontSize: 11, color: W.c.mute, marginTop: 8 }}>
                        {(g.memberIds || []).length} {lang === 'es' ? 'atletas' : 'athletes'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Btn ghost sm onClick={() => navigate(`/coach/planner/new?assignee=group&groupId=${g.id}`)}>
                        {lang === 'es' ? 'Planificar' : 'Program'}
                      </Btn>
                      <Btn ghost sm onClick={() => startEdit(g)}>{lang === 'es' ? 'Editar' : 'Edit'}</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editingId && (
          <div style={{
            width: 380,
            borderLeft: `1px solid ${W.c.lineDim}`,
            padding: 24,
            overflow: 'auto',
            flexShrink: 0,
            background: W.c.bg2,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              {editingId === 'new'
                ? (lang === 'es' ? 'Nuevo grupo' : 'New group')
                : (lang === 'es' ? 'Editar grupo' : 'Edit group')}
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={label}>{lang === 'es' ? 'NOMBRE' : 'NAME'}</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={lang === 'es' ? 'Competidores' : 'Competitors'}
                  required
                  style={inp}
                />
              </div>
              <div>
                <label style={label}>{lang === 'es' ? 'OBJETIVO' : 'GOAL'}</label>
                <textarea
                  value={form.goal}
                  onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                  rows={3}
                  placeholder={lang === 'es' ? 'ej. Prep torneo, hipertrofia, volver del injury…' : 'e.g. Meet prep, hypertrophy, return from injury…'}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>
              <div>
                <label style={label}>{lang === 'es' ? 'ATLETAS EN EL GRUPO' : 'ATHLETES IN GROUP'}</label>
                {athletesLoading ? (
                  <div style={{ fontSize: 12, color: W.c.mute }}>…</div>
                ) : athletes.length === 0 ? (
                  <p style={{ fontSize: 12, color: W.c.dim }}>{lang === 'es' ? 'Sin atletas vinculados.' : 'No linked athletes.'}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflow: 'auto' }}>
                    {athletes.map((a, i) => {
                      const checked = form.memberIds.includes(a.id)
                      const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
                      return (
                        <label
                          key={a.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 8,
                            ...segmentButtonStyle(checked),
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMember(a.id)}
                          />
                          <Avatar name={initials} size={28} tone={['lime', 'orange', 'blue', 'violet'][i % 4]} />
                          <span style={{ fontSize: 13, fontWeight: checked ? 600 : 500 }}>{a.name || a.email}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
              {error && <div style={{ fontSize: 12, color: W.c.red, fontFamily: W.font.mono }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn primary disabled={busy} type="submit">
                  {busy ? '…' : (lang === 'es' ? 'Guardar' : 'Save')}
                </Btn>
                <Btn ghost type="button" onClick={() => { setEditingId(null); setForm(emptyForm()) }}>
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </Btn>
                {editingId !== 'new' && (
                  <Btn ghost type="button" style={{ color: W.c.orange }} onClick={() => handleDelete(editingId)}>
                    {lang === 'es' ? 'Eliminar' : 'Delete'}
                  </Btn>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </DesktopChrome>
  )
}
