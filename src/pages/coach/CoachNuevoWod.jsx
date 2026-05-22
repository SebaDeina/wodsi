import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { toDateKey } from '../../lib/dates'
import { normalizeSections, sectionsToPlainText } from '../../lib/wodSections'
import {
  ASSIGNEE_ATHLETE,
  ASSIGNEE_BOX,
  ASSIGNEE_GROUP,
  buildAssigneePayload,
  parseAssigneeFromParams,
} from '../../lib/programAssign'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { WodSectionsEditor, initialWodSections, loadSectionsFromDoc } from '../../components/WodSectionsEditor'
import { ProgramAssignPicker } from '../../components/ProgramAssignPicker'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { CoachHeader } from './CoachHeader'
import { Btn } from '../../components/Btn'
import { coachTimerModeOptions } from '../../lib/timerModes'

const WOD_TYPES = ['Mixed', 'Strength', 'AMRAP', 'EMOM', 'For Time', 'Tabata', 'Chipper', 'HERO', 'Other']

export default function CoachNuevoWod() {
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const editId = params.get('edit')
  const isEdit = Boolean(editId)
  const initialDate = params.get('date') || toDateKey(new Date())
  const initialAssignee = parseAssigneeFromParams(params)

  const { athletes } = useCoachAthletes()
  const { groups } = useCoachGroups()

  const [title,       setTitle]       = useState(params.get('title') || '')
  const [type,        setType]        = useState(params.get('type') || 'Mixed')
  const [date,        setDate]        = useState(initialDate)
  const [duration,    setDuration]    = useState('')
  const [timerMode,   setTimerMode]   = useState('')
  const [sections,    setSections]    = useState(initialWodSections)
  const [notes,       setNotes]       = useState('')
  const [assigneeType, setAssigneeType] = useState(initialAssignee.assigneeType)
  const [groupId,     setGroupId]     = useState(initialAssignee.groupId)
  const [athleteId,   setAthleteId]   = useState(initialAssignee.athleteId)
  const [busy,        setBusy]        = useState(false)
  const [loadingDoc,  setLoadingDoc]  = useState(isEdit)
  const [error,       setError]       = useState('')

  useEffect(() => {
    setDate(params.get('date') || toDateKey(new Date()))
  }, [params])

  useEffect(() => {
    if (!editId) return
    let cancelled = false
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'wods', editId))
        if (!snap.exists()) {
          if (!cancelled) setError(lang === 'es' ? 'WOD no encontrado' : 'WOD not found')
          return
        }
        const data = snap.data()
        if (data.coachId !== user?.uid) {
          if (!cancelled) setError(lang === 'es' ? 'Sin permiso' : 'Not allowed')
          return
        }
        if (!cancelled) {
          setTitle(data.title || '')
          setType(data.type || 'Mixed')
          setDate(data.date || initialDate)
          setDuration(data.duration != null ? String(data.duration) : '')
          setTimerMode(data.timerMode || '')
          setSections(loadSectionsFromDoc(data))
          setNotes(data.notes || '')
          setAssigneeType(data.assigneeType || ASSIGNEE_BOX)
          setGroupId(data.groupId || '')
          setAthleteId(data.athleteId || '')
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoadingDoc(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [editId, user?.uid, lang, initialDate])

  function validateAssignee() {
    if (assigneeType === ASSIGNEE_GROUP) {
      if (!groupId) return lang === 'es' ? 'Elegí un grupo.' : 'Select a group.'
      const g = groups.find(x => x.id === groupId)
      if (!g?.memberIds?.length) {
        return lang === 'es' ? 'El grupo no tiene atletas. Agregalos en Grupos.' : 'Group has no athletes. Add them in Groups.'
      }
    }
    if (assigneeType === ASSIGNEE_ATHLETE && !athleteId) {
      return lang === 'es' ? 'Elegí un atleta.' : 'Select an athlete.'
    }
    return null
  }

  function validateSections() {
    const normalized = normalizeSections(sections)
    const withLines = normalized.filter(s => s.lines.length > 0)
    if (!withLines.length) {
      return lang === 'es'
        ? 'Agregá al menos un bloque con ejercicios (pegá la planificación o editá los bloques).'
        : 'Add at least one block with movements (paste programming or edit blocks).'
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const assigneeError = validateAssignee()
    const sectionError = validateSections()
    if (assigneeError || sectionError) {
      setError(assigneeError || sectionError)
      return
    }
    setError('')
    setBusy(true)
    try {
      const normalized = normalizeSections(sections)
      const plain = sectionsToPlainText(normalized)
      const payload = {
        coachId:     user.uid,
        title:       title.trim() || (lang === 'es' ? 'Trabajo del día' : "Today's session"),
        type,
        date,
        duration:    duration ? Number(duration) : null,
        timerMode:   timerMode || null,
        sections:    normalized,
        description: plain,
        notes:       notes.trim(),
        updatedAt:   serverTimestamp(),
        ...buildAssigneePayload(assigneeType, groupId, athleteId, athletes, groups),
      }

      if (isEdit) {
        await updateDoc(doc(db, 'wods', editId), payload)
      } else {
        await addDoc(collection(db, 'wods'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      }
      navigate('/coach/planner')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1px solid ${W.c.lineDim}`, background: W.c.card,
    color: W.c.text, fontFamily: W.font.sans, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }

  const label = {
    fontSize: 11, fontFamily: W.font.mono, color: W.c.mute,
    letterSpacing: 0.8, marginBottom: 6, display: 'block',
  }

  if (loadingDoc) {
    return (
      <DesktopChrome lang={lang}>
        <div style={{ padding: 32, fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>
          {lang === 'es' ? 'CARGANDO…' : 'LOADING…'}
        </div>
      </DesktopChrome>
    )
  }

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={isEdit
          ? (lang === 'es' ? 'Editar planificación' : 'Edit programming')
          : (lang === 'es' ? 'Nueva planificación' : 'New programming')}
        subtitle={lang === 'es'
          ? 'Bloques de vueltas, fuerza, EMOM… como los escribís en el box'
          : 'Rounds, strength, EMOM blocks — how you write them at the gym'}
      />

      <div style={{ maxWidth: 720, padding: '32px 32px 64px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <ProgramAssignPicker
            lang={lang}
            assigneeType={assigneeType}
            groupId={groupId}
            athleteId={athleteId}
            groups={groups}
            athletes={athletes}
            onChange={({ assigneeType: t, groupId: g, athleteId: a }) => {
              if (t != null) setAssigneeType(t)
              if (g != null) setGroupId(g)
              if (a != null) setAthleteId(a)
            }}
          />

          <div>
            <label style={label}>{lang === 'es' ? 'TÍTULO (OPCIONAL)' : 'TITLE (OPTIONAL)'}</label>
            <input
              placeholder={lang === 'es' ? 'ej. Martes — Fuerza + metcon' : 'e.g. Tuesday — Strength + metcon'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={inp}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={label}>{lang === 'es' ? 'ETIQUETA' : 'LABEL'}</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {WOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>{lang === 'es' ? 'TIMER PARA ATLETAS' : 'ATHLETE TIMER'}</label>
              <select value={timerMode} onChange={e => setTimerMode(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {coachTimerModeOptions(lang).map(o => (
                  <option key={o.value || 'auto'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>{lang === 'es' ? 'FECHA' : 'DATE'}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inp} />
            </div>
            <div>
              <label style={label}>{lang === 'es' ? 'TIEMPO TOTAL (MIN)' : 'TOTAL TIME (MIN)'}</label>
              <input
                type="number" min={1} max={180} placeholder="—"
                value={duration} onChange={e => setDuration(e.target.value)} style={inp}
              />
            </div>
          </div>

          <div>
            <label style={label}>{lang === 'es' ? 'PLANIFICACIÓN DEL DÍA' : "DAY'S PROGRAMMING"}</label>
            <WodSectionsEditor sections={sections} onChange={setSections} lang={lang} />
          </div>

          <div>
            <label style={label}>{lang === 'es' ? 'NOTAS DE COACH (OPCIONAL)' : 'COACH NOTES (OPTIONAL)'}</label>
            <textarea
              placeholder={lang === 'es'
                ? 'Escalas, cargas sugeridas, puntos de performance…'
                : 'Scaling, suggested loads, performance cues…'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: W.c.red, fontFamily: W.font.mono }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <Btn ghost onClick={() => navigate(-1)} type="button">
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </Btn>
            <Btn primary disabled={busy} type="submit">
              {busy ? '…' : (isEdit
                ? (lang === 'es' ? 'Guardar cambios' : 'Save changes')
                : (lang === 'es' ? 'Publicar' : 'Publish'))}
            </Btn>
          </div>
        </form>
      </div>
    </DesktopChrome>
  )
}
