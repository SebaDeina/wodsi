import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  query, where, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_WHATSAPP_RULES } from '../data/whatsappDefaults'

async function seedMissingRules(coachId, existing) {
  const slugs = new Set(existing.map(r => r.slug))
  const missing = DEFAULT_WHATSAPP_RULES.filter(r => !slugs.has(r.slug))
  if (!missing.length) return existing

  const batch = writeBatch(db)
  const added = []
  for (const r of missing) {
    const ref = doc(collection(db, 'whatsapp_rules'))
    const data = { ...r, coachId, createdAt: serverTimestamp() }
    batch.set(ref, data)
    added.push({ id: ref.id, ...data })
  }
  await batch.commit()
  return [...existing, ...added].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function useWhatsAppAutomation() {
  const { user, profile } = useAuth()
  const coachId = user?.uid
  const profileRef = useRef(profile)
  useEffect(() => { profileRef.current = profile }, [profile])

  const [settings, setSettings] = useState(null)
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!coachId) return
    setLoading(true)
    setError(null)
    try {
      const settingsRef = doc(db, 'whatsapp_settings', coachId)
      const settingsSnap = await getDoc(settingsRef)
      if (settingsSnap.exists()) {
        setSettings({ id: settingsSnap.id, ...settingsSnap.data() })
      } else {
        const p = profileRef.current
        const initial = {
          connected: false,
          connectionStatus: 'disconnected',
          phone: '',
          qrDataUrl: null,
          businessName: p?.boxName || p?.name || '',
          planLabel: 'PLAN BOX',
          sessionLabel: null,
          sessionCommand: null,
          automationEnabled: true,
          stats: { sent: 0, failed: 0 },
          updatedAt: serverTimestamp(),
        }
        await setDoc(settingsRef, initial)
        setSettings({ id: coachId, ...initial })
      }

      const rulesQ = query(collection(db, 'whatsapp_rules'), where('coachId', '==', coachId))
      const rulesSnap = await getDocs(rulesQ)

      let loaded = []
      if (rulesSnap.empty) {
        const batch = writeBatch(db)
        for (const r of DEFAULT_WHATSAPP_RULES) {
          const ref = doc(collection(db, 'whatsapp_rules'))
          const data = { ...r, coachId, createdAt: serverTimestamp() }
          batch.set(ref, data)
          loaded.push({ id: ref.id, ...data })
        }
        await batch.commit()
        loaded.sort((a, b) => a.order - b.order)
      } else {
        loaded = rulesSnap.docs
          .map(d => ({ id: d.id, ...d.data(), category: d.data().category || 'box' }))
        loaded = await seedMissingRules(coachId, loaded)
      }
      setRules(loaded)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [coachId])

  useEffect(() => { load() }, [load])

  async function updateSettings(patch) {
    if (!coachId) return
    const ref = doc(db, 'whatsapp_settings', coachId)
    await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true })
    setSettings(s => ({ ...s, ...patch }))
  }

  async function requestWhatsAppSession(command) {
    await updateSettings({ sessionCommand: command })
  }

  async function updateRule(ruleId, patch) {
    const ref = doc(db, 'whatsapp_rules', ruleId)
    await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() })
    setRules(prev => prev.map(r => (r.id === ruleId ? { ...r, ...patch } : r)))
  }

  async function createRule(data) {
    if (!coachId) return null
    const ref = await addDoc(collection(db, 'whatsapp_rules'), {
      ...data,
      coachId,
      active: true,
      order: rules.length,
      createdAt: serverTimestamp(),
    })
    const created = { id: ref.id, ...data, coachId, active: true, order: rules.length }
    setRules(prev => [...prev, created])
    return created
  }

  const boxRules = rules.filter(r => (r.category || 'box') === 'box')
  const athleteRules = rules.filter(r => r.category === 'athlete')

  return {
    settings,
    rules,
    boxRules,
    athleteRules,
    loading,
    error,
    reload: load,
    updateSettings,
    requestWhatsAppSession,
    updateRule,
    createRule,
  }
}
