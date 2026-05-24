export const COACH_PLANS = [
  {
    id: 'starter',
    minAthletes: 0,
    maxAthletes: 20,
    amountARS: 12000,
    reason: 'Wodsi — hasta 20 atletas',
  },
  {
    id: 'growth',
    minAthletes: 21,
    maxAthletes: 80,
    amountARS: 28000,
    reason: 'Wodsi — 21 a 80 atletas',
  },
]

export function planById(id) {
  return COACH_PLANS.find(p => p.id === id) || null
}

export function recommendedPlanForCount(count) {
  const n = Math.max(0, Number(count) || 0)
  if (n <= 20) return COACH_PLANS[0]
  if (n <= 80) return COACH_PLANS[1]
  return null
}

export function externalReference(coachId, tierId) {
  return `wodsi:${coachId}:${tierId}`
}

export function parseExternalReference(ref) {
  if (!ref || typeof ref !== 'string') return null
  const parts = ref.split(':')
  if (parts[0] !== 'wodsi' || parts.length < 3) return null
  return { coachId: parts[1], tierId: parts[2] }
}
