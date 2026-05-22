import { useState, useEffect, useCallback, useMemo } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_HABITS } from '../data/defaultHabits'
import { toDateKey } from '../lib/dates'
import { getCached, setCached } from '../lib/queryCache'

function habitsDocId(athleteId, dateKey) {
  return `${athleteId}_${dateKey}`
}

function buildDefaultItems(lang) {
  return DEFAULT_HABITS.map(h => ({
    id: h.id,
    icon: h.icon,
    label: lang === 'es' ? h.labelEs : h.labelEn,
    done: false,
  }))
}

/** Firestore puede guardar solo id/label/done; siempre restauramos icono y etiqueta base. */
function normalizeHabitItems(raw, lang) {
  const defaults = buildDefaultItems(lang)
  if (!Array.isArray(raw) || raw.length === 0) return defaults
  return defaults.map(def => {
    const saved = raw.find(r => r?.id === def.id)
    if (!saved) return def
    return {
      ...def,
      label: saved.label || def.label,
      done: Boolean(saved.done),
    }
  })
}

export function useAthleteHabits(lang = 'es') {
  const { user } = useAuth()
  const dateKey = toDateKey(new Date())
  const cacheKey = user?.uid ? `habits:${user.uid}:${dateKey}` : null

  const [items, setItems] = useState(() => {
    const cached = cacheKey ? getCached(cacheKey) : null
    return normalizeHabitItems(cached, lang)
  })
  const [loading, setLoading] = useState(() => !(cacheKey && getCached(cacheKey)))

  const load = useCallback(async () => {
    if (!user?.uid) {
      setItems(buildDefaultItems(lang))
      setLoading(false)
      return
    }

    const cached = getCached(cacheKey)
    if (cached) {
      setItems(normalizeHabitItems(cached, lang))
      setLoading(false)
    } else {
      setLoading(true)
    }

    try {
      const ref = doc(db, 'habit_daily', habitsDocId(user.uid, dateKey))
      const snap = await getDoc(ref)
      const raw = snap.exists() && Array.isArray(snap.data().items)
        ? snap.data().items
        : null
      const next = normalizeHabitItems(raw, lang)
      setItems(next)
      setCached(cacheKey, next)
    } catch {
      if (!cached) setItems(buildDefaultItems(lang))
    } finally {
      setLoading(false)
    }
  }, [user?.uid, dateKey, lang, cacheKey])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    setItems(prev => normalizeHabitItems(prev, lang))
  }, [lang])

  const toggleHabit = useCallback(async (habitId) => {
    if (!user?.uid) return
    const next = items.map(h => (h.id === habitId ? { ...h, done: !h.done } : h))
    setItems(next)
    if (cacheKey) setCached(cacheKey, next)
    try {
      await setDoc(doc(db, 'habit_daily', habitsDocId(user.uid, dateKey)), {
        athleteId: user.uid,
        date: dateKey,
        items: next,
        updatedAt: new Date().toISOString(),
      })
    } catch {
      await load()
    }
  }, [user?.uid, dateKey, items, load, cacheKey])

  const completedCount = useMemo(() => items.filter(h => h.done).length, [items])
  const hasAnyDone = completedCount > 0

  return {
    items,
    completedCount,
    total: items.length,
    hasAnyDone,
    loading,
    toggleHabit,
    reload: load,
  }
}
