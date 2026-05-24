import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'
import { saveGoogleAuthIntent, readGoogleAuthIntent, clearGoogleAuthIntent } from '../lib/googleAuth'
import { consumeGoogleRedirectResult } from '../lib/googleRedirectHandler'
import { fetchUserProfile } from '../lib/authProfile'

const AuthCtx = createContext(null)

async function fetchCoachPublic(coachId) {
  const pubSnap = await getDoc(doc(db, 'coaches_public', coachId))
  if (pubSnap.exists()) return pubSnap.data()
  const userSnap = await getDoc(doc(db, 'users', coachId))
  if (userSnap.exists() && userSnap.data().role === 'coach') {
    return { name: userSnap.data().name, boxName: userSnap.data().boxName || userSnap.data().name }
  }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [googleRedirectOutcome, setGoogleRedirectOutcome] = useState(null)
  const [googleRedirectError, setGoogleRedirectError] = useState(null)
  const [googleRedirectReady, setGoogleRedirectReady] = useState(false)

  async function syncCoachPublic(coachId, name, boxName) {
    if (!coachId || !name) return
    await setDoc(doc(db, 'coaches_public', coachId), {
      name,
      boxName: boxName || name,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function applyFirestoreProfile(fireUser) {
    const { data } = await fetchUserProfile(fireUser.uid)
    setProfile(data)
    if (data?.role === 'coach') {
      try {
        await syncCoachPublic(fireUser.uid, data.name, data.boxName)
      } catch {
        /* coaches_public opcional */
      }
    }
    return data
  }

  async function validateCoachId(coachId) {
    if (!coachId?.trim()) throw new Error('INVALID_COACH')
    const coach = await fetchCoachPublic(coachId.trim())
    if (!coach) throw new Error('INVALID_COACH')
    return coach
  }

  async function loginEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    setUser(cred.user)
    const { data, needsRegistration } = await fetchUserProfile(cred.user.uid)
    setProfile(data)
    return { user: cred.user, profile: data, needsRegistration }
  }

  async function registerEmail(email, password, name, role, coachId = null) {
    let linkedCoachId = null
    if (role === 'athlete') {
      await validateCoachId(coachId)
      linkedCoachId = coachId.trim()
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    const profileData = {
      name,
      email,
      role,
      lang: 'es',
      authProvider: 'email',
      status: 'active',
      coachId: role === 'athlete' ? linkedCoachId : null,
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), profileData)
    if (role === 'coach') await syncCoachPublic(cred.user.uid, name, name)
    setUser(cred.user)
    setProfile(profileData)
    return { user: cred.user, profile: profileData }
  }

  async function resolveGoogleCredential(cred) {
    setUser(cred.user)
    const { data, needsRegistration } = await fetchUserProfile(cred.user.uid)
    setProfile(data)
    return { user: cred.user, profile: data, needsRegistration }
  }

  async function loginGoogle(intent = {}) {
    saveGoogleAuthIntent(intent)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const outcome = await resolveGoogleCredential(cred)
      const savedIntent = readGoogleAuthIntent()
      return { ...outcome, intent: savedIntent || intent }
    } catch (err) {
      clearGoogleAuthIntent()
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        const e = new Error('POPUP_CLOSED')
        e.code = err.code
        throw e
      }
      throw err
    }
  }

  function clearGoogleRedirectState() {
    setGoogleRedirectOutcome(null)
    setGoogleRedirectError(null)
  }

  async function finishGoogleRegistration(role, name, coachId = null) {
    const fireUser = auth.currentUser
    if (!fireUser) throw new Error('No auth user')

    let linkedCoachId = null
    if (role === 'athlete') {
      await validateCoachId(coachId)
      linkedCoachId = coachId.trim()
    }

    const profileData = {
      name: name || fireUser.displayName || '',
      email: fireUser.email,
      role,
      lang: 'es',
      authProvider: 'google',
      status: 'active',
      coachId: role === 'athlete' ? linkedCoachId : null,
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', fireUser.uid), profileData)
    if (role === 'coach') await syncCoachPublic(fireUser.uid, profileData.name, profileData.name)
    setUser(fireUser)
    setProfile(profileData)
    return profileData
  }

  async function updateLang(lang) {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), { lang }, { merge: true })
    setProfile(p => ({ ...p, lang }))
  }

  async function updateWhatsAppPhone(whatsappPhone, whatsappDisplay) {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), {
      whatsappPhone,
      whatsappDisplay: whatsappDisplay || null,
      whatsappUpdatedAt: serverTimestamp(),
    }, { merge: true })
    setProfile(p => ({ ...p, whatsappDisplay: whatsappDisplay || null, whatsappPhone }))
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    ;(async () => {
      try {
        const cred = await consumeGoogleRedirectResult()
        if (cred && !cancelled) {
          setUser(cred.user)
          const intent = readGoogleAuthIntent()
          const outcome = await resolveGoogleCredential(cred)
          if (!cancelled) setGoogleRedirectOutcome({ ...outcome, intent })
        }
      } catch (err) {
        console.error('[auth] Google redirect pendiente:', err)
      }
      if (!cancelled) setGoogleRedirectReady(true)

      if (cancelled) return

      unsubscribe = onAuthStateChanged(auth, async (fireUser) => {
        if (cancelled) return
        setUser(fireUser)
        if (!fireUser) {
          setProfile(null)
          setLoading(false)
          return
        }
        try {
          await applyFirestoreProfile(fireUser)
        } catch (err) {
          console.error('[auth] Error cargando perfil:', err)
          setProfile(null)
        } finally {
          if (!cancelled) setLoading(false)
        }
      })
    })()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return (
    <AuthCtx.Provider value={{
      user, profile, loading,
      loginEmail, registerEmail, loginGoogle, finishGoogleRegistration,
      validateCoachId, fetchCoachPublic, syncCoachPublic,
      updateLang, updateWhatsAppPhone, logout,
      googleRedirectOutcome, googleRedirectError, googleRedirectReady,
      clearGoogleRedirectState,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() { return useContext(AuthCtx) }
