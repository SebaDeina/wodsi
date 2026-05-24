export async function verifyCoach(auth, db, idToken) {
  if (!idToken) throw new Error('No autorizado')
  const decoded = await auth.verifyIdToken(idToken)
  const profile = await db.collection('users').doc(decoded.uid).get()
  if (!profile.exists || profile.data()?.role !== 'coach') {
    throw new Error('Solo coaches pueden gestionar esta suscripción')
  }
  return { uid: decoded.uid, email: decoded.email || profile.data()?.email }
}

export function readBearer(req) {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return null
  return h.slice(7).trim()
}
