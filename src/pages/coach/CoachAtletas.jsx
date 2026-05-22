import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { hasWhatsAppPhone } from '../../lib/phone'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { Tag } from '../../components/Tag'
import { Avatar } from '../../components/Avatar'
import { CoachHeader } from './CoachHeader'

const STATUS_TONE = { active: 'lime', paused: 'mute', overdue: 'orange', new: 'blue' }
const TONES = ['lime', 'orange', 'blue', 'violet']

export default function CoachAtletas() {
  const { lang } = useLang()
  const navigate  = useNavigate()
  const { athletes, loading, counts } = useCoachAthletes()
  const { groupsForAthlete } = useCoachGroups()
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')

  async function setAthleteStatus(athleteId, status) {
    await updateDoc(doc(db, 'users', athleteId), { status })
  }

  const displayed = athletes.filter(a => {
    const matchFilter = filter === 'all' || (a.status || 'active') === filter
    const matchSearch = !search || (a.name || '').toLowerCase().includes(search.toLowerCase()) || (a.email || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={t('athletes_nav', lang)}
        subtitle={`${athletes.length} total · ${counts.active || 0} ${lang === 'es' ? 'activos' : 'active'} · ${counts.paused || 0} ${lang === 'es' ? 'pausados' : 'paused'} · ${counts.overdue || 0} ${lang === 'es' ? 'vencidos' : 'overdue'}`}
        right={<>
          <Btn primary sm onClick={() => navigate('/coach/athletes/new')}>
            + {lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
          </Btn>
        </>}
      />

      {/* Filter bar */}
      <div style={{ padding: '16px 32px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: `1px solid ${W.c.lineDim}`, flexShrink: 0 }}>
        <div style={{ flex: 1, maxWidth: 320, background: W.c.card, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: W.c.mute, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('search', lang)}
            style={{ background: 'none', border: 'none', outline: 'none', color: W.c.text, fontFamily: W.font.sans, fontSize: 13, flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all', W.c.lime], ['active', W.c.lime], ['paused', W.c.mute], ['overdue', W.c.orange], ['new', W.c.blue]].map(([k, c]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: filter === k ? W.c.cardHi : 'transparent',
              color: filter === k ? W.c.text : W.c.dim,
              fontFamily: W.font.sans, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', gap: 8, alignItems: 'center',
            }}>
              {k !== 'all' && <span style={{ width: 6, height: 6, borderRadius: 3, background: c }} />}
              {k === 'all' ? (lang === 'es' ? 'Todos' : 'All') : t(k, lang)}
              <span style={{ color: W.c.mute, fontFamily: W.font.mono, fontSize: 11 }}>
                {k === 'all' ? athletes.length : (counts[k] || 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, fontFamily: W.font.mono, fontSize: 12, color: W.c.mute, letterSpacing: 1 }}>
            {lang === 'es' ? 'CARGANDO…' : 'LOADING…'}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
              {lang === 'es' ? 'No hay atletas todavía' : 'No athletes yet'}
            </div>
            <div style={{ fontSize: 13, color: W.c.dim, marginBottom: 20 }}>
              {lang === 'es'
                ? 'Generá un link de invitación y mandalo por WhatsApp. Tus atletas entran con Google.'
                : 'Create an invite link and send it on WhatsApp. Athletes sign in with Google.'}
            </div>
            <Btn primary onClick={() => navigate('/coach/athletes/new')}>
              {lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
            </Btn>
          </div>
        ) : (
          <>
            {/* Table head */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr',
              padding: '12px 32px', fontFamily: W.font.mono, fontSize: 10, letterSpacing: 0.8, color: W.c.mute,
              borderBottom: `1px solid ${W.c.lineDim}`, textTransform: 'uppercase', position: 'sticky', top: 0, background: W.c.bg,
            }}>
              <span>{t('athlete', lang)}</span>
              <span>{lang === 'es' ? 'GRUPO' : 'GROUP'}</span>
              <span>{lang === 'es' ? 'ESTADO' : 'STATUS'}</span>
              <span>{lang === 'es' ? 'CORREO' : 'EMAIL'}</span>
              <span />
            </div>
            {displayed.map((a, i) => {
              const status = a.status || 'active'
              const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
              const athleteGroups = groupsForAthlete(a.id)
              const groupLabel = athleteGroups.map(g => g.name).join(', ') || '—'
              return (
                <div key={a.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr',
                  padding: '14px 32px', alignItems: 'center', fontSize: 13,
                  borderBottom: `1px solid ${W.c.lineDim}`,
                  background: i % 2 ? 'transparent' : `${W.c.cardHi}40`,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={initials} size={32} tone={TONES[i % TONES.length]} />
                    <span>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.name || '—'}
                        {hasWhatsAppPhone(a) ? (
                          <span title="WhatsApp en app" style={{ fontSize: 12, color: '#25D366' }}>◉</span>
                        ) : (
                          <span title={lang === 'es' ? 'Sin WhatsApp' : 'No WhatsApp'} style={{ fontSize: 10, color: W.c.orange, fontFamily: W.font.mono }}>WA?</span>
                        )}
                      </div>
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: athleteGroups.length ? W.c.lime : W.c.mute }}>{groupLabel}</span>
                  <span>
                    <select
                      value={status}
                      onChange={e => setAthleteStatus(a.id, e.target.value)}
                      style={{
                        padding: '6px 8px', borderRadius: 6, border: `1px solid ${W.c.lineDim}`,
                        background: W.c.bg2, color: W.c.text, fontFamily: W.font.mono, fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      {['active', 'paused', 'overdue', 'new'].map(s => (
                        <option key={s} value={s}>{t(s, lang).toUpperCase()}</option>
                      ))}
                    </select>
                  </span>
                  <span style={{ color: W.c.dim, fontSize: 12 }}>{a.email}</span>
                  <span style={{ textAlign: 'right' }}>
                    <Btn ghost sm onClick={() => navigate(`/coach/planner/new?assignee=athlete&athleteId=${a.id}`)}>
                      {lang === 'es' ? 'Planificar' : 'Program'}
                    </Btn>
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </DesktopChrome>
  )
}
