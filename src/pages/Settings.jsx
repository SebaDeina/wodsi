import { useState } from 'react'
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

const SECTION_LABEL = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: 'inherit',
}

export default function Settings() {
  const { user, profile, updateLang, updateWhatsAppPhone, updateProfileFields, logout } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const isMobile = useIsMobile(1024)

  const isCoach = profile?.role === 'coach'

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [boxNameDraft, setBoxNameDraft] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  function startEditProfile() {
    setNameDraft(profile?.name || '')
    setBoxNameDraft(profile?.boxName || '')
    setEditingProfile(true)
  }

  async function saveProfile(e) {
    e.preventDefault()
    if (!nameDraft.trim()) return
    setSavingProfile(true)
    try {
      await updateProfileFields({ name: nameDraft.trim(), boxName: boxNameDraft.trim() || nameDraft.trim() })
      setEditingProfile(false)
    } finally {
      setSavingProfile(false)
    }
  }

  function handleLang(l) {
    setLang(l)
    updateLang(l)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
    border: `1px solid ${W.c.lineDim}`, background: W.c.bg2, color: W.c.text,
    fontFamily: W.font.sans, fontSize: 14, outline: 'none',
  }

  const sectionLabel = {
    fontFamily: W.font.mono, fontSize: 10, letterSpacing: 1,
    textTransform: 'uppercase', color: W.c.mute, marginBottom: 14,
  }

  const divider = {
    height: 1, background: W.c.lineDim, margin: '28px 0',
  }

  /* ── Athlete settings ─────────────────────────────── */
  if (!isCoach) {
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

        <AthleteWhatsAppSettings profile={profile} lang={lang} onSave={updateWhatsAppPhone} />

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

  /* ── Coach settings ───────────────────────────────── */
  const colLayout = !isMobile
    ? { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32, alignItems: 'start' }
    : { display: 'flex', flexDirection: 'column', gap: 0 }

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={lang === 'es' ? 'Configuración' : 'Settings'}
        subtitle={lang === 'es' ? 'Perfil, cobros y cuenta' : 'Profile, billing and account'}
      />

      <div style={{
        flex: 1, overflowY: 'auto',
        padding: isMobile ? '20px 16px 100px' : '32px 40px 64px',
        maxWidth: 1040,
      }}>
        <div style={colLayout}>

          {/* ── Left column ─────────────────────────────── */}
          <div style={isMobile ? {} : {}}>

            {/* Perfil */}
            <div style={{ marginBottom: isMobile ? 0 : 28 }}>
              <div style={sectionLabel}>{lang === 'es' ? 'PERFIL' : 'PROFILE'}</div>

              <div style={{ background: W.c.card, borderRadius: 14, padding: 20, border: `1px solid ${W.c.lineDim}` }}>
                {/* Avatar + info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: editingProfile ? 20 : 0 }}>
                  <Avatar name={(profile?.name || user?.email || '?').slice(0, 2).toUpperCase()} size={52} tone="lime" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, fontFamily: W.font.display, lineHeight: 1.2 }}>
                      {profile?.name || user?.displayName || '—'}
                    </div>
                    {profile?.boxName && profile.boxName !== profile.name && (
                      <div style={{ fontSize: 13, color: W.c.lime, marginTop: 3 }}>{profile.boxName}</div>
                    )}
                    <div style={{ fontSize: 12, color: W.c.mute, marginTop: 3 }}>{user?.email}</div>
                  </div>
                  {!editingProfile && (
                    <Btn ghost sm onClick={startEditProfile}>
                      {lang === 'es' ? 'Editar' : 'Edit'}
                    </Btn>
                  )}
                </div>

                {editingProfile && (
                  <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ ...sectionLabel, marginBottom: 6 }}>{lang === 'es' ? 'TU NOMBRE' : 'YOUR NAME'}</label>
                      <input
                        value={nameDraft}
                        onChange={e => setNameDraft(e.target.value)}
                        placeholder={lang === 'es' ? 'Ej: Marcos García' : 'E.g. John Smith'}
                        required
                        style={inp}
                      />
                    </div>
                    <div>
                      <label style={{ ...sectionLabel, marginBottom: 6 }}>{lang === 'es' ? 'NOMBRE DEL BOX / GYM' : 'BOX / GYM NAME'}</label>
                      <input
                        value={boxNameDraft}
                        onChange={e => setBoxNameDraft(e.target.value)}
                        placeholder={lang === 'es' ? 'Ej: CrossFit Palermo' : 'E.g. CrossFit Downtown'}
                        style={inp}
                      />
                      <div style={{ fontSize: 11, color: W.c.mute, marginTop: 6, fontFamily: W.font.mono }}>
                        {lang === 'es' ? 'Aparece en los links de invitación y mensajes de WhatsApp.' : 'Shown in invite links and WhatsApp messages.'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn primary sm type="submit" disabled={savingProfile}>
                        {savingProfile ? '…' : (lang === 'es' ? 'Guardar' : 'Save')}
                      </Btn>
                      <Btn ghost sm type="button" onClick={() => setEditingProfile(false)}>
                        {lang === 'es' ? 'Cancelar' : 'Cancel'}
                      </Btn>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {isMobile && <div style={divider} />}

            {/* Idioma */}
            {!isMobile && <div style={{ height: 20 }} />}
            <div style={{ marginBottom: isMobile ? 0 : 0 }}>
              <div style={sectionLabel}>{lang === 'es' ? 'IDIOMA' : 'LANGUAGE'}</div>
              <div style={{ background: W.c.card, borderRadius: 14, padding: 20, border: `1px solid ${W.c.lineDim}` }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ val: 'es', label: 'Español' }, { val: 'en', label: 'English' }].map(l => (
                    <button key={l.val} onClick={() => handleLang(l.val)} style={{
                      flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                      background: lang === l.val ? W.c.lime : W.c.cardHi,
                      color: lang === l.val ? W.c.bg : W.c.text,
                      fontFamily: W.font.sans, fontWeight: 600, fontSize: 15, cursor: 'pointer',
                      boxShadow: lang === l.val ? `0 4px 16px ${W.c.lime}30` : 'none',
                    }}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isMobile && <div style={divider} />}

            {/* Accesos rápidos */}
            {!isMobile && <div style={{ height: 20 }} />}
            <div>
              <div style={sectionLabel}>{lang === 'es' ? 'ACCESOS RÁPIDOS' : 'QUICK ACCESS'}</div>
              <div style={{ background: W.c.card, borderRadius: 14, border: `1px solid ${W.c.lineDim}`, overflow: 'hidden' }}>
                {[
                  {
                    label: lang === 'es' ? 'Invitar atletas' : 'Invite athletes',
                    sub: lang === 'es' ? 'Link y QR para tu box' : 'Link and QR for your gym',
                    path: '/coach/athletes/new',
                  },
                  {
                    label: lang === 'es' ? 'Mensajes WhatsApp' : 'WhatsApp messages',
                    sub: lang === 'es' ? 'Automatizaciones y reglas' : 'Automations and rules',
                    path: '/coach/whatsapp',
                  },
                  {
                    label: lang === 'es' ? 'Cobros del mes' : 'Monthly billing',
                    sub: lang === 'es' ? 'Quién pagó y quién no' : 'Who paid and who didn\'t',
                    path: '/coach/athletes?tab=billing',
                  },
                ].map((item, i, arr) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '14px 20px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      borderTop: i > 0 ? `1px solid ${W.c.lineDim}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: W.c.text }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: W.c.mute, marginTop: 2 }}>{item.sub}</div>
                    </div>
                    <span style={{ color: W.c.mute, fontSize: 16 }}>›</span>
                  </button>
                ))}
              </div>
            </div>

            {isMobile && <div style={divider} />}

            {/* Cuenta */}
            {!isMobile && <div style={{ height: 20 }} />}
            <div>
              <div style={sectionLabel}>{lang === 'es' ? 'CUENTA' : 'ACCOUNT'}</div>
              <div style={{ background: W.c.card, borderRadius: 14, padding: 20, border: `1px solid ${W.c.lineDim}` }}>
                <div style={{ fontSize: 13, color: W.c.mute, marginBottom: 16, lineHeight: 1.5 }}>
                  {user?.email}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    border: `1px solid ${W.c.red}50`, background: `${W.c.red}10`,
                    color: W.c.red, fontFamily: W.font.sans, fontWeight: 600,
                    fontSize: 14, cursor: 'pointer',
                  }}
                >
                  {lang === 'es' ? 'Cerrar sesión' : 'Sign out'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right column — Cobros ────────────────────── */}
          <div>
            {isMobile && <div style={divider} />}
            <div style={sectionLabel}>{lang === 'es' ? 'COBROS A ATLETAS' : 'ATHLETE BILLING'}</div>
            <div style={{ background: W.c.card, borderRadius: 14, padding: 24, border: `1px solid ${W.c.lineDim}` }}>
              <CoachBillingSettings lang={lang} />
            </div>
          </div>

        </div>
      </div>
    </DesktopChrome>
  )
}
