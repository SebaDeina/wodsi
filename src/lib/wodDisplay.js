import { wodPreviewLines, wodSectionsFromDoc } from './wodSections'
import { assigneeLabel as programAssigneeLabel } from './programAssign'

const TYPE_COLORS = {
  Mixed: 'lime',
  Strength: 'lime',
  AMRAP: 'orange',
  EMOM: 'blue',
  'For Time': 'orange',
  Tabata: 'violet',
  Chipper: 'orange',
  HERO: 'red',
  Other: 'lineDim',
}

export function wodTypeColor(type) {
  return TYPE_COLORS[type] || 'lineDim'
}

export function wodTypeLabel(type) {
  if (!type) return 'WOD'
  if (type === 'For Time') return 'FOR TIME'
  if (type === 'Strength') return 'STRENGTH'
  return type.toUpperCase()
}

export function wodBlockFromDoc(wod, lang = 'es', { groups = [], athletes = [] } = {}) {
  const sectionCount = wodSectionsFromDoc(wod, lang).length
  const preview = wodPreviewLines(wod, 3, lang).join('\n')
  const assignee = programAssigneeLabel(wod, { groups, athletes, lang })
  return {
    id: wod.id,
    type: wodTypeLabel(wod.type),
    name: wod.title || (lang === 'es' ? 'Trabajo del día' : "Today's session"),
    dur: wod.duration ? String(wod.duration) : '—',
    color: wodTypeColor(wod.type),
    description: wod.description,
    preview,
    sectionCount,
    assignee,
    assigneeType: wod.assigneeType || 'box',
    sections: wod.sections,
    notes: wod.notes,
    raw: wod,
  }
}
