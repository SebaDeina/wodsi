import { useState, useMemo } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useLang } from '../../context/LangContext'
import { useIsMobile } from '../../hooks/useBreakpoint'
import {
  buildAthleteInviteUrl,
  buildWhatsAppShareText,
} from '../../lib/invite'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { CoachHeader } from './CoachHeader'
import { Avatar } from '../../components/Avatar'
import { Tag } from '../../components/Tag'
import { Btn } from '../../components/Btn'

const TONES = ['lime', 'orange', 'blue', 'violet']
const WA = '#25D366'

export default function CoachNuevoAtleta() {
  const { user, profile, syncCoachPublic } = useAuth()
  const { lang } = useLang()
  const isMobile = useIsMobile(1024)
  const { athletes: fetched, loading } = useCoachAthletes()
  const [hiddenIds, setHiddenIds] = useState([])
  const athletes = fetched.filter(a => !hiddenIds.includes(a.id))
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedWa, setCopiedWa] = useState(false)
  const [removing, setRemoving] = useState(null)

  const coachId = user?.uid || ''
  const coachName = profile?.boxName || profile?.name || 'Wodsi'

  const inviteUrl = useMemo(
    () => (coachId ? buildAthleteInviteUrl(coachId, coachName) : ''),
    [coachId, coachName],
  )

  const qrUrl = inviteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=12&data=${encodeURIComponent(inviteUrl)}`
    : ''

  async function ensurePublicProfile() {
    if (coachId && profile?.name) {
      await syncCoachPublic(coachId, profile.name, profile.boxName || profile.name)
    }
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
    ensurePublicProfile()
  }

  function copyWhatsAppMessage() {
    const text = buildWhatsAppShareText(inviteUrl, coachName, lang)
    navigator.clipboard.writeText(text)
    setCopiedWa(true)
    setTimeout(() => setCopiedWa(false), 2500)
    ensurePublicProfile()
  }

  function openWhatsApp() {
    const text = buildWhatsAppShareText(inviteUrl, coachName, lang)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  async function handleRemove(athleteId) {
    if (!window.confirm(lang === 'es' ? '¿Desvinculás a este atleta?' : 'Remove this athlete?')) return
    setRemoving(athleteId)
    try {
      await updateDoc(doc(db, 'users', athleteId), { coachId: null })
      setHiddenIds(prev => [...prev, athleteId])
    } catch {
      alert(lang === 'es'
        ? 'No pudimos desvincular al atleta. Intentá de nuevo.'
        : 'We could not remove the athlete. Try again.')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
        subtitle={lang === 'es'
          ? 'Compartí un link — ellos entran con Google y quedan en tu roster'
          : 'Share a link — they sign in with Google and join your roster'}
      />

      <div style={{ maxWidth: 820, padding: isMobile ? '20px 16px 100px' : '32px 32px 64px', display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 28 }}>

        {/* Paso a paso */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
          {[
            [lang === 'es' ? '1. Copiá el link' : '1. Copy the link', lang === 'es' ? 'Un solo link por atleta' : 'One link for all athletes'],
            [lang === 'es' ? '2. Mandalo por WhatsApp' : '2. Send on WhatsApp', lang === 'es' ? 'Mensaje listo para pegar' : 'Pre-written message'],
            [lang === 'es' ? '3. Entran con Google' : '3. They use Google', lang === 'es' ? 'PRs y hábitos en la app' : 'PRs & habits in the app'],
          ].map(([t, d], i) => (
            <div key={i} style={{ background: W.c.card, borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div>
              <div style={{ fontSize: 12, color: W.c.dim, marginTop: 6, lineHeight: 1.4 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* Invitación principal */}
        <div style={{ background: W.c.card, borderRadius: 16, padding: isMobile ? 20 : 28, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: isMobile ? 20 : 28, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.lime, letterSpacing: 0.8, marginBottom: 10 }}>
              {lang === 'es' ? 'LINK DE INVITACIÓN' : 'INVITE LINK'}
            </div>
            <p style={{ fontSize: 14, color: W.c.dim, marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
              {lang === 'es'
                ? 'El atleta abre este link, elige Google y queda vinculado a tu roster.'
                : 'Athletes open this link, use Google, and join your roster.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: W.c.bg2, borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
              <span style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.text, flex: 1, wordBreak: 'break-all' }}>
                {inviteUrl || '…'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Btn primary sm onClick={copyInviteLink}>
                {copiedLink ? (lang === 'es' ? '✓ Link copiado' : '✓ Link copied') : (lang === 'es' ? 'Copiar link' : 'Copy link')}
              </Btn>
              <Btn ghost sm onClick={copyWhatsAppMessage}>
                {copiedWa ? (lang === 'es' ? '✓ Mensaje copiado' : '✓ Message copied') : (lang === 'es' ? 'Copiar mensaje WA' : 'Copy WA message')}
              </Btn>
              <Btn
                sm
                onClick={openWhatsApp}
                style={{ background: WA, color: '#fff' }}
              >
                {lang === 'es' ? 'Abrir WhatsApp' : 'Open WhatsApp'}
              </Btn>
            </div>
            <p style={{ fontSize: 11, color: W.c.mute, marginTop: 14, fontFamily: W.font.mono, lineHeight: 1.5 }}>
              {lang === 'es'
                ? 'TIP: También podés pegar el link en Instagram, email o QR impreso en el box.'
                : 'TIP: Paste the link on Instagram, email or a QR poster at your gym.'}
            </p>
          </div>
          {qrUrl && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={qrUrl}
                alt="QR invitación"
                width={200}
                height={200}
                style={{ borderRadius: 12, background: '#fff', padding: 8 }}
              />
              <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, marginTop: 8 }}>
                QR · {lang === 'es' ? 'ESCANEAR EN EL BOX' : 'SCAN AT GYM'}
              </div>
            </div>
          )}
        </div>

        {/* Lista atletas */}
        <div>
          <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 14 }}>
            {lang === 'es' ? 'ATLETAS VINCULADOS' : 'LINKED ATHLETES'} · {loading ? '…' : athletes.length}
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: W.c.mute, fontFamily: W.font.mono, padding: 16 }}>
              {lang === 'es' ? 'Cargando…' : 'Loading…'}
            </div>
          ) : athletes.length === 0 ? (
            <div style={{ background: W.c.card, borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                {lang === 'es' ? 'Todavía no hay atletas' : 'No athletes yet'}
              </div>
              <div style={{ fontSize: 13, color: W.c.dim, marginBottom: 16 }}>
                {lang === 'es'
                  ? 'Mandá el link de invitación por WhatsApp al grupo del box.'
                  : 'Send the invite link to your gym WhatsApp group.'}
              </div>
              <Btn primary sm onClick={copyInviteLink}>
                {lang === 'es' ? 'Copiar link de invitación' : 'Copy invite link'}
              </Btn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {athletes.map((a, i) => {
                const provider = a.authProvider === 'google' ? 'Google' : 'Email'
                return (
                  <div key={a.id} style={{
                    background: W.c.card, borderRadius: 12, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <Avatar name={(a.name || a.email || '?').slice(0, 2).toUpperCase()} size={40} tone={TONES[i % TONES.length]} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name || '—'}</div>
                      <div style={{ fontSize: 12, color: W.c.mute, marginTop: 2 }}>{a.email}</div>
                    </div>
                    <Tag tone="mute" sm>{provider}</Tag>
                    <Tag tone="lime" sm>{lang === 'es' ? 'ACTIVO' : 'ACTIVE'}</Tag>
                    <button
                      onClick={() => handleRemove(a.id)}
                      disabled={removing === a.id}
                      style={{
                        padding: '7px 12px', borderRadius: 7, border: `1px solid ${W.c.lineDim}`,
                        background: 'transparent', color: W.c.mute,
                        fontFamily: W.font.mono, fontSize: 10, cursor: 'pointer',
                      }}
                    >
                      {removing === a.id ? '…' : (lang === 'es' ? 'DESVINCULAR' : 'REMOVE')}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DesktopChrome>
  )
}
