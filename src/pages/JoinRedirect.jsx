import { Navigate, useParams, useSearchParams } from 'react-router-dom'

/** /join/:coachId → registro de atleta con coach precargado */
export default function JoinRedirect() {
  const { coachId } = useParams()
  const [params] = useSearchParams()
  const from = params.get('from') || params.get('box') || ''
  const q = new URLSearchParams({ role: 'athlete', coach: coachId || '' })
  if (from) q.set('from', from)
  return <Navigate to={`/register?${q.toString()}`} replace />
}
