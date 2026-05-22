import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export function useCoachGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!user?.uid) {
      setGroups([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const q = query(collection(db, 'program_groups'), where('coachId', '==', user.uid))
      const snap = await getDocs(q)
      setGroups(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { reload() }, [reload])

  async function createGroup({ name, goal, memberIds = [] }) {
    const ref = await addDoc(collection(db, 'program_groups'), {
      coachId: user.uid,
      name: name.trim(),
      goal: (goal || '').trim(),
      memberIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await reload()
    return ref.id
  }

  async function updateGroup(groupId, { name, goal, memberIds }) {
    await updateDoc(doc(db, 'program_groups', groupId), {
      name: name.trim(),
      goal: (goal || '').trim(),
      memberIds,
      updatedAt: serverTimestamp(),
    })
    await reload()
  }

  async function deleteGroup(groupId) {
    await deleteDoc(doc(db, 'program_groups', groupId))
    await reload()
  }

  function groupById(id) {
    return groups.find(g => g.id === id) || null
  }

  function groupsForAthlete(athleteId) {
    return groups.filter(g => (g.memberIds || []).includes(athleteId))
  }

  return {
    groups,
    loading,
    error,
    reload,
    createGroup,
    updateGroup,
    deleteGroup,
    groupById,
    groupsForAthlete,
  }
}
