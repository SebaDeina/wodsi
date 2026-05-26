import { doc, runTransaction, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Incrementa contadores globales de visitas. */
export async function recordPageView() {
  const dayRef = doc(db, 'app_analytics_daily', todayKey())
  const summaryRef = doc(db, 'app_analytics', 'summary')

  try {
    await runTransaction(db, async (tx) => {
      const summarySnap = await tx.get(summaryRef)
      if (summarySnap.exists()) {
        tx.update(summaryRef, {
          totalPageViews: (summarySnap.data().totalPageViews || 0) + 1,
          updatedAt: serverTimestamp(),
        })
      } else {
        tx.set(summaryRef, {
          totalPageViews: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      const daySnap = await tx.get(dayRef)
      if (daySnap.exists()) {
        tx.update(dayRef, {
          pageViews: (daySnap.data().pageViews || 0) + 1,
          date: todayKey(),
          updatedAt: serverTimestamp(),
        })
      } else {
        tx.set(dayRef, {
          pageViews: 1,
          date: todayKey(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
    })
  } catch {
    /* analytics no debe bloquear la app */
  }
}

/** Actualiza presencia del usuario y acumula minutos activos en la pestaña. */
export async function recordUserActivity(userId, { addMinutes = 0 } = {}) {
  if (!userId) return
  const ref = doc(db, 'users', userId)
  try {
    if (addMinutes > 0) {
      const snap = await getDoc(ref)
      const prev = snap.exists() ? (snap.data().activeMinutesTotal || 0) : 0
      await updateDoc(ref, {
        lastSeenAt: serverTimestamp(),
        activeMinutesTotal: prev + addMinutes,
      })
    } else {
      await updateDoc(ref, { lastSeenAt: serverTimestamp() })
    }
  } catch {
    /* opcional */
  }
}
