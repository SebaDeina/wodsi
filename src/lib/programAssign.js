export const ASSIGNEE_BOX = 'box'
export const ASSIGNEE_GROUP = 'group'
export const ASSIGNEE_ATHLETE = 'athlete'

export function wodVisibleToAthlete(wod, athleteId) {
  if (!wod || !athleteId) return false
  const type = wod.assigneeType || ASSIGNEE_BOX
  if (type === ASSIGNEE_BOX) return true
  const audience = wod.audienceAthleteIds || []
  return audience.includes(athleteId)
}

export function assigneePriority(wod) {
  const type = wod?.assigneeType || ASSIGNEE_BOX
  if (type === ASSIGNEE_ATHLETE) return 3
  if (type === ASSIGNEE_GROUP) return 2
  return 1
}

/** Un WOD principal por día (el más específico para ese atleta). */
export function pickPrimaryWod(wods, athleteId) {
  const visible = (wods || []).filter(w => wodVisibleToAthlete(w, athleteId))
  if (!visible.length) return null
  return [...visible].sort((a, b) => assigneePriority(b) - assigneePriority(a))[0]
}

export function filterWodsForAthlete(wods, athleteId) {
  return (wods || []).filter(w => wodVisibleToAthlete(w, athleteId))
}

export function resolveAudienceAthleteIds(assigneeType, groupId, athleteId, athletes, groups) {
  if (assigneeType === ASSIGNEE_ATHLETE && athleteId) return [athleteId]
  if (assigneeType === ASSIGNEE_GROUP && groupId) {
    const group = (groups || []).find(g => g.id === groupId)
    return group?.memberIds || []
  }
  if (assigneeType === ASSIGNEE_BOX) {
    return (athletes || [])
      .filter(a => (a.status || 'active') !== 'paused')
      .map(a => a.id)
  }
  return []
}

export function buildAssigneePayload(assigneeType, groupId, athleteId, athletes, groups) {
  const audienceAthleteIds = resolveAudienceAthleteIds(
    assigneeType,
    groupId,
    athleteId,
    athletes,
    groups,
  )
  return {
    assigneeType,
    groupId: assigneeType === ASSIGNEE_GROUP ? (groupId || null) : null,
    athleteId: assigneeType === ASSIGNEE_ATHLETE ? (athleteId || null) : null,
    audienceAthleteIds,
  }
}

export function assigneeLabel(wod, { groups = [], athletes = [], lang = 'es' } = {}) {
  const type = wod?.assigneeType || ASSIGNEE_BOX
  if (type === ASSIGNEE_ATHLETE && wod.athleteId) {
    const a = athletes.find(x => x.id === wod.athleteId)
    return a?.name || (lang === 'es' ? 'Atleta' : 'Athlete')
  }
  if (type === ASSIGNEE_GROUP && wod.groupId) {
    const g = groups.find(x => x.id === wod.groupId)
    return g?.name || (lang === 'es' ? 'Grupo' : 'Group')
  }
  return lang === 'es' ? 'Todo el box' : 'Whole gym'
}

export function parseAssigneeFromParams(params) {
  const type = params.get('assignee') || ASSIGNEE_BOX
  return {
    assigneeType: [ASSIGNEE_BOX, ASSIGNEE_GROUP, ASSIGNEE_ATHLETE].includes(type) ? type : ASSIGNEE_BOX,
    groupId: params.get('groupId') || '',
    athleteId: params.get('athleteId') || '',
  }
}
