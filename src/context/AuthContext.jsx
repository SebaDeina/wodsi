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
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fireUser) => {
      try {
        setUser(fireUser)
        if (fireUser) {
          const snap = await getDoc(doc(db, 'users', fireUser.uid))
          const data = snap.exists() ? snap.data() : null
          setProfile(data)
          if (data?.role === 'coach') {
            try {
              await syncCoachPublic(fireUser.uid, data.name, data.boxName)
            } catch {
              /* no bloquear la app si falla coaches_public */
            }
          }
        } else {
          setProfile(null)
        }
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [])

  async function syncCoachPublic(coachId, name, boxName) {
    if (!coachId || !name) return
    await setDoc(doc(db, 'coaches_public', coachId), {
      name,
      boxName: boxName || name,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function validateCoachId(coachId) {
    if (!coachId?.trim()) {
      throw new Error('INVALID_COACH')
    }
    const coach = await fetchCoachPublic(coachId.trim())
    if (!coach) throw new Error('INVALID_COACH')
    return coach
  }

  async function loginEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    setProfile(snap.exists() ? snap.data() : null)
    return { user: cred.user, profile: snap.data() }
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
    if (role === 'coach') {
      await syncCoachPublic(cred.user.uid, name, name)
    }
    setProfile(profileData)
    return { user: cred.user, profile: profileData }
  }

  async function loginGoogle() {
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const ref = doc(db, 'users', cred.user.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        return { user: cred.user, profile: null, needsRegistration: true }
      }
      setProfile(snap.data())
      return { user: cred.user, profile: snap.data(), needsRegistration: false }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        const e = new Error('POPUP_CLOSED')
        e.code = 'auth/popup-closed-by-user'
        throw e
      }
      throw err
    }
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
    if (role === 'coach') {
      await syncCoachPublic(fireUser.uid, profileData.name, profileData.name)
    }
    setProfile(profileData)
    return profileData
  }

  async function updateLang(lang) {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    await setDoc(ref, { lang }, { merge: true })
    setProfile(p => ({ ...p, lang }))
  }

  async function updateWhatsAppPhone(whatsappPhone, whatsappDisplay) {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    await setDoc(ref, {
      whatsappPhone,
      whatsappDisplay: whatsappDisplay || null,
      whatsappUpdatedAt: serverTimestamp(),
    }, { merge: true })
    setProfile(p => ({
      ...p,
      whatsappPhone,
      whatsappDisplay: whatsappDisplay || null,
    }))
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthCtx.Provider value={{
      user, profile, loading,
      loginEmail, registerEmail, loginGoogle, finishGoogleRegistration,
      validateCoachId, fetchCoachPublic, syncCoachPublic,
      updateLang, updateWhatsAppPhone, logout,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() { return useContext(AuthCtx) }
