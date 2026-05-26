import { useCallback, useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

function tsToDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  return null
}

function daysAgo(n) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function sumDailyViews(dailyDocs, days) {
  const cutoff = daysAgo(days - 1)
  let total = 0
  for (const snap of dailyDocs) {
    const data = snap.data()
    const dateStr = data.date || snap.id
    const date = new Date(`${dateStr}T00:00:00`)
    if (Number.isNaN(date.getTime()) || date < cutoff) continue
    total += data.pageViews || 0
  }
  return total
}

export function useAdminStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersSnap, subsSnap, paymentsSnap, summarySnap, dailySnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'coach_subscriptions')),
        getDocs(collection(db, 'coach_subscription_payments')),
        getDoc(doc(db, 'app_analytics', 'summary')),
        getDocs(collection(db, 'app_analytics_daily')),
      ])

      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const coaches = users.filter(u => u.role === 'coach')
      const athletes = users.filter(u => u.role === 'athlete')
      const now = Date.now()
      const dayMs = 86_400_000

      const active7d = users.filter(u => {
        const seen = tsToDate(u.lastSeenAt)
        return seen && now - seen.getTime() <= 7 * dayMs
      })
      const active30d = users.filter(u => {
        const seen = tsToDate(u.lastSeenAt)
        return seen && now - seen.getTime() <= 30 * dayMs
      })

      const withMinutes = users.filter(u => (u.activeMinutesTotal || 0) > 0)
      const avgActiveMinutes = withMinutes.length
        ? Math.round(withMinutes.reduce((s, u) => s + (u.activeMinutesTotal || 0), 0) / withMinutes.length)
        : 0

      const subs = subsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const paying = subs.filter(s => s.status === 'active')
      const pendingSubs = subs.filter(s => s.status === 'pending')
      const mrr = paying.reduce((s, sub) => s + (sub.amountARS || 0), 0)

      const payments = paymentsSnap.docs.map(d => d.data())
      const approvedPayments = payments.filter(p => p.status === 'approved' || p.status === 'active')

      const totalPageViews = summarySnap.exists() ? (summarySnap.data().totalPageViews || 0) : 0
      const views7d = sumDailyViews(dailySnap.docs, 7)
      const views30d = sumDailyViews(dailySnap.docs, 30)

      const athletesByCoach = {}
      for (const a of athletes) {
        const cid = a.coachId
        if (!cid) continue
        athletesByCoach[cid] = (athletesByCoach[cid] || 0) + 1
      }

      const topCoaches = coaches
        .map(c => ({
          id: c.id,
          name: c.name || c.email,
          boxName: c.boxName,
          athletes: athletesByCoach[c.id] || 0,
          subscription: subs.find(s => s.id === c.id || s.coachId === c.id),
        }))
        .sort((a, b) => b.athletes - a.athletes)
        .slice(0, 8)

      setStats({
        totalUsers: users.length,
        coaches: coaches.length,
        athletes: athletes.length,
        athletesLinked: athletes.filter(a => a.coachId).length,
        active7d: active7d.length,
        active30d: active30d.length,
        avgActiveMinutes,
        payingCoaches: paying.length,
        pendingSubscriptions: pendingSubs.length,
        totalSubscriptions: subs.length,
        mrr,
        approvedPayments: approvedPayments.length,
        totalPageViews,
        views7d,
        views30d,
        topCoaches,
        fetchedAt: new Date(),
      })
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refresh: load }
}
