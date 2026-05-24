import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return { data: null, needsRegistration: true }
  return { data: snap.data(), needsRegistration: false }
}
