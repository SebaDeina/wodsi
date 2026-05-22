import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export function useWhatsAppOutbox() {
  const { user } = useAuth()
  const coachId = user?.uid
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!coachId) {
      setRecent([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const q = query(
        collection(db, 'whatsapp_outbox'),
        where('coachId', '==', coachId),
      )
      const snap = await getDocs(q)
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0
        const tb = b.createdAt?.toMillis?.() ?? 0
        return tb - ta
      })
      setRecent(items.slice(0, 20))
    } catch {
      setRecent([])
    } finally {
      setLoading(false)
    }
  }, [coachId])

  useEffect(() => { load() }, [load])

  async function queueMessage({ athleteId, athleteName, whatsappPhone, body, ruleId = null, source = 'manual' }) {
    if (!coachId) throw new Error('NO_COACH')
    const ref = await addDoc(collection(db, 'whatsapp_outbox'), {
      coachId,
      athleteId,
      athleteName: athleteName || '',
      whatsappPhone,
      body,
      ruleId,
      source,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    await load()
    return ref.id
  }

  return { recent, loading, reload: load, queueMessage }
}
