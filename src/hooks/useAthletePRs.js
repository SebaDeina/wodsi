import { useState, useEffect, useCallback } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { todayDateKey } from '../lib/membership'

export const PR_TYPES = [
  { id: '1rm', labelEs: '1RM', labelEn: '1RM' },
  { id: '3rm', labelEs: '3RM', labelEn: '3RM' },
  { id: '5rm', labelEs: '5RM', labelEn: '5RM' },
  { id: 'max_reps', labelEs: 'Reps máx.', labelEn: 'Max reps' },
]

export const PR_UNITS = [
  { id: 'kg', labelEs: 'kg', labelEn: 'kg' },
  { id: 'lb', labelEs: 'lb', labelEn: 'lb' },
  { id: 'reps', labelEs: 'reps', labelEn: 'reps' },
  { id: 'sec', labelEs: 'seg', labelEn: 'sec' },
]

export function formatPRValue(pr, lang = 'es') {
  const unit = PR_UNITS.find(u => u.id === pr.unit)
  const u = unit ? (lang === 'es' ? unit.labelEs : unit.labelEn) : pr.unit
  const type = PR_TYPES.find(t => t.id === pr.prType)
  const t = type ? (lang === 'es' ? type.labelEs : type.labelEn) : ''
  return `${pr.value} ${u}${t ? ` · ${t}` : ''}`
}

export function useAthletePRs() {
  const { user, profile } = useAuth()
  const [prs, setPrs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.uid) {
      setPrs([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const q = query(collection(db, 'athlete_prs'), where('athleteId', '==', user.uid))
      const snap = await getDocs(q)
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.value || 0) - (a.value || 0))
      setPrs(list)
    } catch {
      setPrs([])
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { load() }, [load])

  const addPR = useCallback(async ({ movement, value, unit, prType, date }) => {
    if (!user?.uid || !movement?.trim() || value == null || Number.isNaN(Number(value))) {
      throw new Error('INVALID_PR')
    }
    const payload = {
      athleteId: user.uid,
      coachId: profile?.coachId || null,
      movement: movement.trim(),
      value: Number(value),
      unit: unit || 'kg',
      prType: prType || '1rm',
      date: date || todayDateKey(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }
    const ref = await addDoc(collection(db, 'athlete_prs'), payload)
    setPrs(prev => [{ id: ref.id, ...payload, updatedAt: new Date() }, ...prev])
    return ref.id
  }, [user?.uid, profile?.coachId])

  const removePR = useCallback(async (prId) => {
    await deleteDoc(doc(db, 'athlete_prs', prId))
    setPrs(prev => prev.filter(p => p.id !== prId))
  }, [])

  const updatePR = useCallback(async (prId, patch) => {
    await updateDoc(doc(db, 'athlete_prs', prId), {
      ...patch,
      updatedAt: serverTimestamp(),
    })
    await load()
  }, [load])

  return { prs, loading, reload: load, addPR, removePR, updatePR }
}
