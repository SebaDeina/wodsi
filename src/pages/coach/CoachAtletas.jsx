import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { hasWhatsAppPhone } from '../../lib/phone'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n'
import {
  defaultPaymentPatch,
  formatDateKey,
  membershipStatusFromDates,
  toDateInputValue,
} from '../../lib/membership'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { Avatar } from '../../components/Avatar'
import { CoachHeader } from './CoachHeader'

const TONES = ['lime', 'orange', 'blue', 'violet']

const GRID = '2fr 0.9fr 1fr 1fr 1fr 1.1fr 0.9fr'

const dateInp = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: 6,
  border: `1px solid ${W.c.lineDim}`,
  background: W.c.bg2,
  color: W.c.text,
  fontFamily: W.font.mono,
  fontSize: 11,
  boxSizing: 'border-box',
}

export default function CoachAtletas() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { athletes, loading, counts, reload } = useCoachAthletes()
  const { groupsForAthlete } = useCoachGroups()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)

  async function patchAthlete(athlete, patch) {
    setSavingId(athlete.id)
    try {
      const paidUntil = patch.paidUntil !== undefined ? patch.paidUntil : athlete.paidUntil
      const manualStatus = patch.status !== undefined ? patch.status : athlete.status
      const status = membershipStatusFromDates(paidUntil, manualStatus)
      await updateDoc(doc(db, 'users', athlete.id), { ...patch, status })
      await reload()
    } finally {
      setSavingId(null)
    }
  }

  async function setAthleteStatus(athlete, status) {
    await patchAthlete(athlete, { status })
  }

  async function registerPaymentToday(athlete) {
    await patchAthlete(athlete, defaultPaymentPatch())
  }

  const displayed = athletes.filter(a => {
    const effectiveStatus = membershipStatusFromDates(a.paidUntil, a.status)
    const matchFilter = filter === 'all' || effectiveStatus === filter || (a.status || 'active') === filter
    const matchSearch = !search
      || (a.name || '').toLowerCase().includes(search.toLowerCase())
      || (a.email || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={t('athletes_nav', lang)}
        subtitle={`${athletes.length} total · ${counts.active || 0} ${lang === 'es' ? 'activos' : 'active'} · ${counts.paused || 0} ${lang === 'es' ? 'pausados' : 'paused'} · ${counts.overdue || 0} ${lang === 'es' ? 'vencidos' : 'overdue'}`}
        right={(
          <Btn primary sm onClick={() => navigate('/coach/athletes/new')}>
            + {lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
          </Btn>
        )}
      />

      <div style={{ padding: '16px 32px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: `1px solid ${W.c.lineDim}`, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 320, background: W.c.card, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: W.c.mute, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search', lang)}
            style={{ background: 'none', border: 'none', outline: 'none', color: W.c.text, fontFamily: W.font.sans, fontSize: 13, flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[['all', W.c.lime], ['active', W.c.lime], ['paused', W.c.mute], ['overdue', W.c.orange], ['new', W.c.blue]].map(([k, c]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} style={{
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
          <div style={{ padding: 32, fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>{lang === 'es' ? 'CARGANDO…' : 'LOADING…'}</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
              {lang === 'es' ? 'No hay atletas todavía' : 'No athletes yet'}
            </div>
            <Btn primary onClick={() => navigate('/coach/athletes/new')}>
              {lang === 'es' ? 'Invitar atletas' : 'Invite athletes'}
            </Btn>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: GRID,
              padding: '12px 32px', fontFamily: W.font.mono, fontSize: 10, letterSpacing: 0.8, color: W.c.mute,
              borderBottom: `1px solid ${W.c.lineDim}`, textTransform: 'uppercase', position: 'sticky', top: 0, background: W.c.bg,
              minWidth: 920,
            }}>
              <span>{t('athlete', lang)}</span>
              <span>{lang === 'es' ? 'GRUPO' : 'GROUP'}</span>
              <span>{lang === 'es' ? 'ÚLT. PAGO' : 'LAST PAID'}</span>
              <span>{lang === 'es' ? 'VENCE' : 'EXPIRES'}</span>
              <span>{lang === 'es' ? 'ESTADO' : 'STATUS'}</span>
              <span>{lang === 'es' ? 'CORREO' : 'EMAIL'}</span>
              <span />
            </div>
            {displayed.map((a, i) => {
              const status = membershipStatusFromDates(a.paidUntil, a.status)
              const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
              const athleteGroups = groupsForAthlete(a.id)
              const groupLabel = athleteGroups.map(g => g.name).join(', ') || '—'
              const busy = savingId === a.id
              return (
                <div key={a.id} style={{
                  display: 'grid', gridTemplateColumns: GRID,
                  padding: '14px 32px', alignItems: 'center', fontSize: 13,
                  borderBottom: `1px solid ${W.c.lineDim}`,
                  background: i % 2 ? 'transparent' : `${W.c.cardHi}40`,
                  minWidth: 920,
                  opacity: busy ? 0.65 : 1,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={initials} size={32} tone={TONES[i % TONES.length]} />
                    <span>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.name || '—'}
                        {hasWhatsAppPhone(a) ? (
                          <span title="WhatsApp" style={{ fontSize: 12, color: '#25D366' }}>◉</span>
                        ) : (
                          <span title={lang === 'es' ? 'Sin WhatsApp' : 'No WhatsApp'} style={{ fontSize: 10, color: W.c.orange, fontFamily: W.font.mono }}>WA?</span>
                        )}
                      </div>
                      {a.paidUntil && status === 'overdue' && (
                        <div style={{ fontSize: 10, color: W.c.orange, fontFamily: W.font.mono, marginTop: 2 }}>
                          {lang === 'es' ? 'Venció' : 'Expired'} {formatDateKey(a.paidUntil, lang)}
                        </div>
                      )}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: athleteGroups.length ? W.c.lime : W.c.mute }}>{groupLabel}</span>
                  <span>
                    <input
                      type="date"
                      value={toDateInputValue(a.lastPaidAt)}
                      disabled={busy}
                      onChange={e => patchAthlete(a, { lastPaidAt: e.target.value || null })}
                      style={dateInp}
                      title={lang === 'es' ? 'Fecha del último pago' : 'Last payment date'}
                    />
                  </span>
                  <span>
                    <input
                      type="date"
                      value={toDateInputValue(a.paidUntil)}
                      disabled={busy}
                      onChange={e => patchAthlete(a, { paidUntil: e.target.value || null })}
                      style={dateInp}
                      title={lang === 'es' ? 'Vencimiento del pase' : 'Pass expiry date'}
                    />
                  </span>
                  <span>
                    <select
                      value={a.status || 'active'}
                      disabled={busy}
                      onChange={e => setAthleteStatus(a, e.target.value)}
                      style={{
                        padding: '6px 8px', borderRadius: 6, border: `1px solid ${W.c.lineDim}`,
                        background: W.c.bg2, color: status === 'overdue' ? W.c.orange : W.c.text,
                        fontFamily: W.font.mono, fontSize: 11, cursor: 'pointer', width: '100%',
                      }}
                    >
                      {['active', 'paused', 'overdue', 'new'].map(s => (
                        <option key={s} value={s}>{t(s, lang).toUpperCase()}</option>
                      ))}
                    </select>
                  </span>
                  <span style={{ color: W.c.dim, fontSize: 11, wordBreak: 'break-all' }}>{a.email}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <Btn ghost sm disabled={busy} onClick={() => registerPaymentToday(a)}>
                      {lang === 'es' ? 'Pago hoy' : 'Paid today'}
                    </Btn>
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
