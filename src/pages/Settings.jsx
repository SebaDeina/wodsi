import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { W } from '../tokens'
import { Btn } from '../components/Btn'
import { DesktopChrome } from '../components/DesktopChrome'
import { CoachHeader } from './coach/CoachHeader'
import { Avatar } from '../components/Avatar'
import { AthleteShell } from '../components/AthleteShell'
import { CoachBillingSettings } from '../components/CoachBillingSettings'
import { AthleteWhatsAppSettings } from '../components/AthleteWhatsAppSettings'
import { useIsMobile } from '../hooks/useBreakpoint'

export default function Settings() {
  const { user, profile, updateLang, updateWhatsAppPhone, logout } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const isMobile = useIsMobile(1024)

  const isCoach = profile?.role === 'coach'

  function handleLang(l) {
    setLang(l)
    updateLang(l)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const cardStyle = {
    background: W.c.card,
    borderRadius: 12,
    padding: isMobile ? 18 : 24,
    border: `1px solid ${W.c.lineDim}`,
  }

  const content = (
    <div style={{
      width: '100%',
      maxWidth: isCoach ? 1120 : 560,
      padding: isMobile ? '16px 16px 96px' : 32,
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: isCoach && !isMobile ? 'minmax(280px, 0.85fr) minmax(420px, 1.4fr)' : '1fr',
      gap: isMobile ? 16 : 24,
      alignItems: 'start',
    }}>
      {/* Profile card */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar name={profile?.name?.slice(0,2) || user?.email?.slice(0,2) || '?'} size={56} tone="lime" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, fontFamily: W.font.display }}>{profile?.name || user?.displayName || '—'}</div>
          <div style={{ fontSize: 13, color: W.c.mute, marginTop: 2 }}>{user?.email}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ fontFamily: W.font.mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: W.c.lime, background: W.c.limeSoft, padding: '2px 8px', borderRadius: 4 }}>
              {profile?.role?.toUpperCase() || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 16 }}>
          {lang === 'es' ? 'IDIOMA' : 'LANGUAGE'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ val: 'es', label: 'Español' }, { val: 'en', label: 'English' }].map(l => (
            <button key={l.val} onClick={() => handleLang(l.val)} style={{
              flex: 1, padding: '14px', borderRadius: 12, border: 'none',
              background: lang === l.val ? W.c.lime : W.c.cardHi,
              color: lang === l.val ? W.c.bg : W.c.text,
              fontFamily: W.font.sans, fontWeight: 600, fontSize: 15, cursor: 'pointer',
              boxShadow: lang === l.val ? `0 6px 20px ${W.c.lime}30` : 'none',
            }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {isCoach && (
        <div style={{
          ...cardStyle,
          gridColumn: !isMobile ? '2 / 3' : undefined,
          gridRow: !isMobile ? '1 / span 4' : undefined,
        }}>
          <CoachBillingSettings lang={lang} />
        </div>
      )}

      {/* Invite athletes */}
      {isCoach && (
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 10 }}>
            {lang === 'es' ? 'INVITAR ATLETAS' : 'INVITE ATHLETES'}
          </div>
          <div style={{ fontSize: 13, color: W.c.dim, marginBottom: 16, lineHeight: 1.5 }}>
            {lang === 'es'
              ? 'Usá el link de invitación para sumar atletas sin copiar códigos internos.'
              : 'Use the invite link to add athletes without copying internal codes.'}
          </div>
          <Btn ghost sm onClick={() => navigate('/coach/athletes/new')}>
            {lang === 'es' ? 'Abrir invitación' : 'Open invite'}
          </Btn>
        </div>
      )}

      {/* Logout */}
      <div style={cardStyle}>
        <Btn ghost onClick={handleLogout} style={{ color: W.c.red, boxShadow: `inset 0 0 0 1px ${W.c.red}40` }}>
          {lang === 'es' ? 'Cerrar sesión' : 'Sign out'}
        </Btn>
      </div>
    </div>
  )

  if (isCoach) {
    return (
      <DesktopChrome lang={lang}>
        <CoachHeader
          title={lang === 'es' ? 'Configuración' : 'Settings'}
          subtitle={lang === 'es' ? 'Cobros a atletas, cuenta e idioma' : 'Athlete billing, account and language'}
        />
        {content}
      </DesktopChrome>
    )
  }

  return (
    <AthleteShell lang={lang}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, fontFamily: W.font.display, marginBottom: 24 }}>
        {lang === 'es' ? 'Ajustes' : 'Settings'}
      </div>

      <div style={{ background: W.c.card, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <Avatar name={profile?.name?.slice(0, 2) || '?'} size={44} tone="lime" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{profile?.name || '—'}</div>
          <div style={{ fontSize: 12, color: W.c.mute, marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      <AthleteWhatsAppSettings
        profile={profile}
        lang={lang}
        onSave={updateWhatsAppPhone}
      />

      <div style={{ background: W.c.card, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 0.8, marginBottom: 14 }}>
          {lang === 'es' ? 'IDIOMA' : 'LANGUAGE'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ val: 'es', label: 'Español' }, { val: 'en', label: 'English' }].map(l => (
            <button key={l.val} type="button" onClick={() => handleLang(l.val)} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: lang === l.val ? W.c.lime : W.c.cardHi,
              color: lang === l.val ? W.c.bg : W.c.text,
              fontFamily: W.font.sans, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: W.c.card, borderRadius: 16, padding: 20 }}>
        <button type="button" onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: W.c.red, fontFamily: W.font.sans, fontWeight: 600, fontSize: 15, cursor: 'pointer', padding: 0 }}>
          {lang === 'es' ? 'Cerrar sesión' : 'Sign out'}
        </button>
      </div>
    </AthleteShell>
  )
}
