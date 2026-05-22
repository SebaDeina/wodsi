import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export function useWhatsAppSession() {
  const { user } = useAuth()
  const coachId = user?.uid
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!coachId) {
      setSettings(null)
      setLoading(false)
      return
    }
    const unsub = onSnapshot(
      doc(db, 'whatsapp_settings', coachId),
      snap => {
        setSettings(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [coachId])

  const connectionStatus = settings?.connectionStatus || 'disconnected'
  const connected = Boolean(settings?.connected && connectionStatus === 'ready')
  const qrDataUrl = settings?.qrDataUrl || null
  const phone = settings?.phone || ''
  const stats = settings?.stats || { sent: 0, failed: 0 }

  return {
    settings,
    loading,
    connected,
    connectionStatus,
    qrDataUrl,
    phone,
    stats,
    sessionLabel: settings?.sessionLabel,
    sessionSince: settings?.sessionSince,
    lastError: settings?.lastError,
  }
}
