import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useCoachWods } from '../../hooks/useCoachWods'
import { useCoachGroups } from '../../hooks/useCoachGroups'
import { formatHeaderDate, getISOWeek, startOfWeek } from '../../lib/dates'
import { wodBlockFromDoc } from '../../lib/wodDisplay'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { Tag } from '../../components/Tag'
import { Avatar } from '../../components/Avatar'
import { CoachHeader } from './CoachHeader'

export default function CoachDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { lang } = useLang()
  const { athletes, loading: athletesLoading, counts, activeCount } = useCoachAthletes()
  const { todayWods, loading: wodsLoading } = useCoachWods(startOfWeek(new Date()))
  const { groups } = useCoachGroups()

  const today = new Date()
  const firstName = (profile?.name || '').split(' ')[0] || (lang === 'es' ? 'Coach' : 'Coach')
  const greeting = lang === 'es' ? `Buen día, ${firstName}.` : `Good morning, ${firstName}.`
  const subtitle = `${formatHeaderDate(today, lang)} · ${lang === 'es' ? 'Semana' : 'Week'} ${getISOWeek(today)}`

  const overdueCount = counts.overdue || 0
  const pausedCount = counts.paused || 0
  const primaryWod = todayWods[0]
  const wodBlocks = todayWods.map(w => wodBlockFromDoc(w, lang, { groups, athletes }))

  const loading = athletesLoading || wodsLoading

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={greeting}
        subtitle={subtitle}
        right={<>
          <Btn ghost sm onClick={() => navigate('/coach/planner/new')}>
            + {lang === 'es' ? 'Nuevo WOD' : 'New WOD'}
          </Btn>
          <Btn primary sm onClick={() => navigate('/coach/athletes/new')}>
            + {lang === 'es' ? 'Atleta' : 'Athlete'}
          </Btn>
        </>}
      />
      <div style={{ flex: 1, padding: 32, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              {
                label: lang === 'es' ? 'Atletas activos' : 'Active athletes',
                val: loading ? '…' : String(activeCount),
                delta: `${athletes.length} ${lang === 'es' ? 'vinculados' : 'linked'}`,
                tone: 'lime',
              },
              {
                label: 'MRR',
                val: '—',
                delta: lang === 'es' ? 'Próximamente' : 'Coming soon',
                tone: 'mute',
              },
              {
                label: lang === 'es' ? 'Cobros vencidos' : 'Overdue',
                val: loading ? '…' : String(overdueCount),
                delta: pausedCount ? `${pausedCount} ${lang === 'es' ? 'pausados' : 'paused'}` : (lang === 'es' ? 'Sin pausas' : 'No pauses'),
                tone: overdueCount ? 'orange' : 'lime',
                negative: overdueCount > 0,
              },
              {
                label: lang === 'es' ? 'WODs hoy' : "Today's WODs",
                val: loading ? '…' : String(todayWods.length),
                delta: lang === 'es' ? 'en el plan' : 'scheduled',
                tone: todayWods.length ? 'lime' : 'mute',
              },
            ].map(k => (
              <div key={k.label} style={{ background: W.c.card, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.5, textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.2, marginTop: 6, fontFamily: W.font.display }}>{k.val}</div>
                <div style={{ fontSize: 12, fontFamily: W.font.mono, color: k.negative ? W.c.orange : W.c[k.tone] || W.c.mute, marginTop: 2 }}>
                  {k.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Today's class */}
          <div style={{ background: W.c.card, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: W.font.mono, fontSize: 11, color: todayWods.length ? W.c.lime : W.c.mute, letterSpacing: 1 }}>
                  {todayWods.length
                    ? `● ${lang === 'es' ? 'HOY' : 'TODAY'}`
                    : (lang === 'es' ? 'SIN WOD' : 'NO WOD')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.6, fontFamily: W.font.display, marginTop: 4 }}>
                  {primaryWod
                    ? `${primaryWod.title} · ${primaryWod.type}`
                    : (lang === 'es' ? 'No hay sesión publicada hoy' : 'No session published today')}
                </div>
              </div>
              <div style={{ flex: 1 }} />
              {!athletesLoading && (
                <span style={{ fontFamily: W.font.mono, fontSize: 14 }}>
                  {activeCount} {lang === 'es' ? 'atletas activos' : 'active athletes'}
                </span>
              )}
            </div>

            {wodBlocks.length === 0 ? (
              <div style={{
                padding: 24, background: W.c.bg2, borderRadius: 10,
                border: `1px dashed ${W.c.lineDim}`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, color: W.c.dim, marginBottom: 14 }}>
                  {lang === 'es'
                    ? 'Publicá el WOD de hoy para que tus atletas lo vean en la app.'
                    : "Publish today's WOD so your athletes can see it in the app."}
                </div>
                <Btn primary sm onClick={() => navigate('/coach/planner/new')}>
                  + {lang === 'es' ? 'Crear WOD' : 'Create WOD'}
                </Btn>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: wodBlocks.length > 1 ? '1fr 1fr' : '1fr', gap: 16 }}>
                {wodBlocks.map(b => (
                  <div
                    key={b.id}
                    style={{ padding: 16, background: W.c.bg2, borderRadius: 10, borderLeft: `3px solid ${W.c[b.color]}`, cursor: 'pointer' }}
                    onClick={() => navigate('/coach/planner')}
                  >
                    <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.5 }}>
                      {b.type}{b.dur !== '—' ? ` · ${b.dur}min` : ''}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginTop: 6 }}>{b.name}</div>
                    {b.preview && (
                      <div style={{ fontSize: 12, color: W.c.dim, marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                        {b.preview}
                        {b.sectionCount > 3 ? '…' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
              {athletes.slice(0, 8).map((a, i) => {
                const initials = (a.name || a.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
                return <Avatar key={a.id} name={initials} size={28} />
              })}
              {athletes.length > 8 && (
                <span style={{
                  width: 28, height: 28, borderRadius: 14, background: W.c.lineDim, color: W.c.dim,
                  fontFamily: W.font.mono, fontSize: 11, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>+{athletes.length - 8}</span>
              )}
              {athletes.length === 0 && !athletesLoading && (
                <span style={{ fontSize: 12, color: W.c.mute }}>
                  {lang === 'es' ? 'Todavía no tenés atletas vinculados' : 'No linked athletes yet'}
                </span>
              )}
              <div style={{ flex: 1 }} />
              <Btn ghost sm onClick={() => navigate('/coach/athletes')}>
                {lang === 'es' ? 'Ver atletas' : 'See athletes'} →
              </Btn>
            </div>
          </div>

          {/* Week planner teaser */}
          <div style={{ background: W.c.card, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{lang === 'es' ? 'Planificación' : 'Programming'}</div>
              <span style={{ marginLeft: 12, fontFamily: W.font.mono, fontSize: 11, color: W.c.mute }}>
                {lang === 'es' ? 'SEMANA ACTUAL' : 'CURRENT WEEK'}
              </span>
              <div style={{ flex: 1 }} />
              <Btn ghost sm onClick={() => navigate('/coach/planner')}>
                {lang === 'es' ? 'Abrir planner' : 'Open planner'} →
              </Btn>
            </div>
            <p style={{ fontSize: 13, color: W.c.dim, margin: 0, lineHeight: 1.5 }}>
              {lang === 'es'
                ? 'Organizá la semana, duplicá bloques y publicá sesiones desde el calendario.'
                : 'Organize your week, duplicate blocks, and publish sessions from the calendar.'}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: W.c.card, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: W.c.mute, fontFamily: W.font.mono, letterSpacing: 0.5 }}>{lang === 'es' ? 'RESUMEN' : 'SUMMARY'}</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1.2, fontFamily: W.font.display, marginTop: 4 }}>
              {loading ? '…' : athletes.length}
            </div>
            <div style={{ fontSize: 12, color: W.c.dim, marginTop: 4 }}>
              {lang === 'es' ? 'atletas en tu roster' : 'athletes on your roster'}
            </div>
            <div style={{ height: 1, background: W.c.lineDim, margin: '14px 0' }} />
            <div style={{ fontFamily: W.font.mono, fontSize: 11, color: W.c.mute, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: W.c.lime }}>{activeCount} {lang === 'es' ? 'ACTIVOS' : 'ACTIVE'}</span>
              <span style={{ color: W.c.orange }}>{overdueCount} {lang === 'es' ? 'VENCIDOS' : 'OVERDUE'}</span>
            </div>
          </div>

          <div style={{ background: W.c.card, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{lang === 'es' ? 'Acciones rápidas' : 'Quick actions'}</div>
            {[
              [lang === 'es' ? 'Publicar WOD' : 'Publish WOD', false, 'lime', '/coach/planner/new'],
              [lang === 'es' ? 'Invitar atleta (link)' : 'Invite athlete (link)', false, 'lime', '/coach/athletes/new'],
              [lang === 'es' ? 'Ver planificación' : 'View programming', false, 'orange', '/coach/planner'],
              [lang === 'es' ? 'Reglas WhatsApp' : 'WhatsApp rules', false, 'orange', '/coach/whatsapp'],
              [lang === 'es' ? 'Gestionar atletas' : 'Manage athletes', false, 'orange', '/coach/athletes'],
            ].map(([txt, done, c, path], i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => navigate(path)}
                onKeyDown={e => e.key === 'Enter' && navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                  borderTop: i ? `1px solid ${W.c.lineDim}` : 'none', cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `1.5px solid ${W.c[c]}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }} />
                <span style={{ fontSize: 13, color: W.c.text, flex: 1 }}>{txt}</span>
                <span style={{ color: W.c.mute }}>→</span>
              </div>
            ))}
          </div>

          <div style={{ background: W.c.card, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center' }}>
              WhatsApp
              <span style={{ flex: 1 }} />
              <Tag tone="lime" sm>{lang === 'es' ? 'REGLAS' : 'RULES'}</Tag>
            </div>
            <p style={{ fontSize: 13, color: W.c.dim, margin: '0 0 14px', lineHeight: 1.5 }}>
              {lang === 'es'
                ? 'Automatizá cobros, bienvenidas e inactividad desde tu número.'
                : 'Automate billing, welcome and inactivity from your number.'}
            </p>
            <Btn ghost sm onClick={() => navigate('/coach/whatsapp')}>
              {lang === 'es' ? 'Configurar reglas' : 'Configure rules'} →
            </Btn>
          </div>
        </div>
      </div>
    </DesktopChrome>
  )
}
