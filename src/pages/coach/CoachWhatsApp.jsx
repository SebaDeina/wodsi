import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useWhatsAppAutomation } from '../../hooks/useWhatsAppAutomation'
import { useWhatsAppSession } from '../../hooks/useWhatsAppSession'
import { useCoachBilling } from '../../hooks/useCoachBilling'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useWhatsAppOutbox } from '../../hooks/useWhatsAppOutbox'
import { WhatsAppAthletePicker } from '../../components/WhatsAppAthletePicker'
import { hasWhatsAppPhone, formatWhatsAppDisplay } from '../../lib/phone'
import { renderWhatsAppTemplate, athleteTemplateVars } from '../../lib/whatsappTemplate'
import {
  RULE_CATEGORIES,
  SIMPLE_TEMPLATE_VARS,
  isImplementedRule,
  ruleWhenText,
  varChipLabel,
  dedupeRulesInMemory,
} from '../../data/whatsappDefaults'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { CoachHeader } from './CoachHeader'
import { Btn } from '../../components/Btn'
import { Tag } from '../../components/Tag'

const WA = '#25D366'
const SUPPORT_EMAIL = 'soporte@wodsi.app'

const PAGE_TABS = [
  { id: 'inicio', es: 'Inicio', en: 'Home' },
  { id: 'enviar', es: 'Enviar', en: 'Send' },
  { id: 'reglas', es: 'Automáticos', en: 'Automatic' },
  { id: 'conexion', es: 'Conexión', en: 'Connect' },
]

function WaTabs({ pageTab, setPageTab, lang }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '0 32px',
      borderBottom: `1px solid ${W.c.lineDim}`, flexShrink: 0,
    }}>
      {PAGE_TABS.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setPageTab(tab.id)}
          style={{
            padding: '12px 18px', border: 'none', cursor: 'pointer',
            background: 'transparent',
            borderBottom: pageTab === tab.id ? `2px solid ${W.c.lime}` : '2px solid transparent',
            color: pageTab === tab.id ? W.c.text : W.c.mute,
            fontFamily: W.font.sans, fontSize: 14, fontWeight: pageTab === tab.id ? 600 : 500,
            marginBottom: -1,
          }}
        >
          {lang === 'es' ? tab.es : tab.en}
        </button>
      ))}
    </div>
  )
}

function StatChip({ label, value, tone }) {
  return (
    <div style={{
      flex: 1, minWidth: 100, background: W.c.card, borderRadius: 10,
      padding: '12px 14px', border: `1px solid ${W.c.lineDim}`,
    }}>
      <div style={{ fontFamily: W.font.mono, fontSize: 9, color: W.c.mute, letterSpacing: 0.5 }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 700, fontFamily: W.font.display, marginTop: 4,
        color: tone === 'lime' ? W.c.lime : tone === 'red' ? W.c.red : tone === 'orange' ? W.c.orange : W.c.text,
      }}>
        {value}
      </div>
    </div>
  )
}

function supportHref(context, lang) {
  const subject = encodeURIComponent(lang === 'es' ? `Ayuda con ${context}` : `Help with ${context}`)
  const body = encodeURIComponent(lang === 'es'
    ? `Hola, necesito ayuda con ${context}.`
    : `Hi, I need help with ${context}.`)
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
}

function SupportButton({ context, lang, style }) {
  return (
    <a
      href={supportHref(context, lang)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        borderRadius: 8,
        border: `1px solid ${W.c.lineDim}`,
        background: W.c.cardHi,
        color: W.c.text,
        fontFamily: W.font.sans,
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        ...style,
      }}
    >
      {lang === 'es' ? 'Contactar soporte' : 'Contact support'}
    </a>
  )
}

function friendlyConnectionMessage(lang) {
  return lang === 'es'
    ? 'No pudimos conectar WhatsApp. Probá de nuevo en unos segundos. Si el problema sigue, contactá a soporte.'
    : 'We could not connect WhatsApp. Try again in a few seconds. If it continues, contact support.'
}

function friendlySendStatus(status, lang) {
  if (status === 'sent') return lang === 'es' ? 'Enviado' : 'Sent'
  if (status === 'failed') return lang === 'es' ? 'No enviado' : 'Not sent'
  if (status === 'queued') return lang === 'es' ? 'En espera' : 'Queued'
  if (status === 'sending') return lang === 'es' ? 'Enviando' : 'Sending'
  return lang === 'es' ? 'Pendiente' : 'Pending'
}

export default function CoachWhatsApp() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { settings, boxRules, athleteRules, loading, error, requestWhatsAppSession, updateRule } = useWhatsAppAutomation()
  const {
    connected,
    connectionStatus,
    qrDataUrl,
    phone: sessionPhone,
    stats: sessionStats,
    lastError,
  } = useWhatsAppSession()
  const { billing } = useCoachBilling()
  const { athletes, loading: athletesLoading } = useCoachAthletes()
  const { recent, queueMessage, reload: reloadOutbox } = useWhatsAppOutbox()

  const [pageTab, setPageTab] = useState('inicio')
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [sendBody, setSendBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendOk, setSendOk] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const catMeta = RULE_CATEGORIES.box[lang]
  const implementedRules = useMemo(() => (
    dedupeRulesInMemory([...boxRules, ...athleteRules])
      .filter(isImplementedRule)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  ), [boxRules, athleteRules])

  const selected = useMemo(
    () => implementedRules.find(r => r.id === selectedId) || implementedRules[0],
    [implementedRules, selectedId],
  )

  useEffect(() => {
    const first = implementedRules[0]
    if (first && (!selectedId || !implementedRules.some(r => r.id === selectedId))) {
      setSelectedId(first.id)
      setDraft(first.template || '')
    }
  }, [implementedRules, selectedId])

  useEffect(() => {
    if (!selectedAthlete || !selected) return
    setSendBody(renderWhatsAppTemplate(
      draft !== '' ? draft : (selected.template || ''),
      athleteTemplateVars(selectedAthlete, {}, billing),
    ))
  }, [selected?.id, draft, selectedAthlete?.id, billing])

  useEffect(() => {
    if (!connected && pageTab === 'enviar') setPageTab('conexion')
  }, [connected, pageTab])

  function selectRule(rule) {
    setSelectedId(rule.id)
    setDraft(rule.template || '')
    if (selectedAthlete) {
      setSendBody(renderWhatsAppTemplate(rule.template || '', athleteTemplateVars(selectedAthlete, {}, billing)))
    }
  }

  function selectAthlete(athlete) {
    setSelectedAthlete(athlete)
    setSendError('')
    setSendOk(false)
    const tpl = draft || selected?.template || ''
    setSendBody(renderWhatsAppTemplate(tpl, athleteTemplateVars(athlete, {}, billing)))
  }

  async function handleSendToAthlete() {
    if (!selectedAthlete || !hasWhatsAppPhone(selectedAthlete)) {
      setSendError(lang === 'es' ? 'Este atleta no cargó su WhatsApp en la app.' : 'This athlete has not added WhatsApp in the app.')
      return
    }
    const body = (sendBody || '').trim()
    if (!body) {
      setSendError(lang === 'es' ? 'Escribí un mensaje.' : 'Write a message.')
      return
    }
    if (!connected) {
      setSendError(lang === 'es' ? 'Conectá tu WhatsApp en la pestaña Conexión.' : 'Connect WhatsApp in the Connect tab.')
      return
    }
    setSending(true)
    setSendError('')
    setSendOk(false)
    try {
      await queueMessage({
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        whatsappPhone: selectedAthlete.whatsappPhone,
        body,
        ruleId: selected?.id || null,
        source: 'manual',
      })
      setSendOk(true)
    } catch {
      setSendError(lang === 'es'
        ? 'No pudimos preparar el envío. Revisá la conexión de WhatsApp o contactá a soporte.'
        : 'We could not prepare the send. Check WhatsApp connection or contact support.')
    } finally {
      setSending(false)
    }
  }

  async function saveTemplate() {
    if (!selected?.id) return
    setSaving(true)
    try {
      await updateRule(selected.id, { template: draft || selected.template })
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(rule) {
    await updateRule(rule.id, { active: !rule.active })
  }

  async function handleConnect() {
    setConnecting(true)
    try {
      await requestWhatsAppSession(connected ? 'disconnect' : 'connect')
    } finally {
      setConnecting(false)
    }
  }

  const businessName = settings?.businessName || profile?.boxName || profile?.name || '—'
  const phone = sessionPhone || (lang === 'es' ? 'Sin vincular' : 'Not linked')
  const withWaCount = athletes.filter(a => hasWhatsAppPhone(a)).length
  const activeRulesCount = implementedRules.filter(r => r.active).length
  const sent = sessionStats?.sent ?? 0
  const failed = sessionStats?.failed ?? 0
  const missingBilling = !billing?.paymentAlias && !billing?.membershipAmount

  const inp = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${W.c.lineDim}`, background: W.c.bg2,
    color: W.c.text, fontFamily: W.font.sans, fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  }

  const card = {
    background: W.c.card,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${W.c.lineDim}`,
    color: W.c.text,
  }

  const connectionCard = (
    <div style={{ ...card, border: `1px solid ${connected ? `${WA}40` : W.c.lineDim}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: W.font.mono, fontSize: 10, color: connected ? WA : W.c.orange, letterSpacing: 0.5 }}>
            {connected
              ? (lang === 'es' ? 'WHATSAPP CONECTADO' : 'WHATSAPP CONNECTED')
              : (lang === 'es' ? 'SIN CONEXIÓN' : 'NOT CONNECTED')}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6, fontFamily: W.font.display }}>{businessName}</div>
          {connected && (
            <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.dim, marginTop: 4 }}>{phone}</div>
          )}
        </div>
        {connected && <Tag tone="lime" sm>{lang === 'es' ? 'Activo' : 'Active'}</Tag>}
      </div>

      {connectionStatus === 'qr' && qrDataUrl && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <img src={qrDataUrl} alt="QR WhatsApp" style={{ width: '100%', maxWidth: 240, borderRadius: 8 }} />
          <p style={{ fontSize: 12, color: W.c.dim, marginTop: 10, lineHeight: 1.45 }}>
            {lang === 'es' ? 'WhatsApp → Dispositivos vinculados → Vincular' : 'WhatsApp → Linked devices → Link'}
          </p>
        </div>
      )}
      {connectionStatus === 'connecting' && !qrDataUrl && (
        <p style={{ fontSize: 12, color: W.c.orange, marginTop: 12 }}>
          {lang === 'es' ? 'Preparando el QR. Esto puede tardar unos segundos.' : 'Preparing the QR. This can take a few seconds.'}
        </p>
      )}
      {!connected && lastError && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: `${W.c.red}10`, border: `1px solid ${W.c.red}35` }}>
          <p style={{ fontSize: 13, color: W.c.text, margin: 0, lineHeight: 1.45 }}>
            {friendlyConnectionMessage(lang)}
          </p>
          <SupportButton context="WhatsApp" lang={lang} style={{ marginTop: 10 }} />
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <Btn ghost sm disabled={connecting} onClick={handleConnect}>
          {connecting ? '…' : (connected
            ? (lang === 'es' ? 'Desconectar' : 'Disconnect')
            : (lang === 'es' ? 'Conectar WhatsApp' : 'Connect WhatsApp'))}
        </Btn>
      </div>
    </div>
  )

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 5, background: connected ? WA : W.c.mute,
              boxShadow: connected ? `0 0 12px ${WA}80` : 'none',
            }} />
            WhatsApp
          </span>
        }
        subtitle={lang === 'es'
          ? 'Avisos automáticos desde tu número · sin ver chats'
          : 'Automated notices from your number · no chat inbox'}
      />

      {error && (
        <div style={{ padding: '10px 32px', color: W.c.red, fontSize: 13 }}>
          {lang === 'es'
            ? 'No pudimos cargar la configuración de WhatsApp. Actualizá la página o contactá a soporte.'
            : 'We could not load WhatsApp settings. Refresh the page or contact support.'}
        </div>
      )}

      <WaTabs pageTab={pageTab} setPageTab={setPageTab} lang={lang} />

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '24px 32px 32px' }}>

        {/* ——— INICIO ——— */}
        {pageTab === 'inicio' && (
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {connectionCard}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatChip label={lang === 'es' ? 'ENVIADOS' : 'SENT'} value={sent} tone="lime" />
              <StatChip label={lang === 'es' ? 'FALLIDOS' : 'FAILED'} value={failed} tone={failed > 0 ? 'red' : 'mute'} />
              <StatChip
                label={lang === 'es' ? 'ATLETAS CON WA' : 'ATHLETES W/ WA'}
                value={`${withWaCount}/${athletes.length}`}
                tone="orange"
              />
            </div>

            {failed > 0 && (
              <div style={{ ...card, borderColor: `${W.c.red}40`, background: `${W.c.red}08` }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: W.c.red }}>
                  {lang === 'es' ? 'Hubo envíos fallidos' : 'Some sends failed'}
                </div>
                <p style={{ fontSize: 13, color: W.c.dim, margin: '8px 0 0', lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Revisá que WhatsApp siga conectado y que el atleta tenga bien cargado su número. Si vuelve a fallar, pedí ayuda a soporte.'
                    : 'Check WhatsApp is still connected and the athlete phone number is correct. If it fails again, contact support.'}
                </p>
                <SupportButton context="envíos de WhatsApp" lang={lang} style={{ marginTop: 12 }} />
              </div>
            )}

            {missingBilling && (
              <div style={{ ...card, borderStyle: 'dashed' }}>
                <p style={{ fontSize: 13, color: W.c.dim, margin: 0, lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Para usar {{alias}} y {{monto}} en los mensajes, configurá cobros en Ajustes.'
                    : 'To use {{alias}} and {{monto}} in messages, set up billing in Settings.'}
                </p>
                <Btn ghost sm style={{ marginTop: 12 }} onClick={() => navigate('/settings')}>
                  {lang === 'es' ? 'Ir a Configuración' : 'Go to Settings'}
                </Btn>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                onClick={() => setPageTab(connected ? 'enviar' : 'conexion')}
                style={{
                  ...card, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${WA}50`, background: `${WA}10`,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{lang === 'es' ? 'Enviar a un atleta' : 'Message an athlete'}</div>
                <p style={{ fontSize: 12, color: W.c.dim, margin: '6px 0 0', lineHeight: 1.45 }}>
                  {lang === 'es' ? 'Mensaje puntual a quien elijas del roster.' : 'One-off message to someone on your roster.'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPageTab('reglas')}
                style={{ ...card, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{lang === 'es' ? 'Mensajes automáticos' : 'Automatic messages'}</div>
                <p style={{ fontSize: 12, color: W.c.dim, margin: '6px 0 0', lineHeight: 1.45 }}>
                  {activeRulesCount} {lang === 'es' ? 'activos · bienvenida, cuota…' : 'on · welcome, billing…'}
                </p>
              </button>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                {lang === 'es' ? 'Últimos envíos' : 'Recent sends'}
              </div>
              {recent.length === 0 ? (
                <p style={{ fontSize: 13, color: W.c.dim, margin: 0 }}>
                  {lang === 'es' ? 'Todavía no hay envíos.' : 'No sends yet.'}
                </p>
              ) : recent.slice(0, 6).map(item => (
                <div key={item.id} style={{ marginBottom: 10 }}>
                  <div style={{
                    display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13, color: W.c.dim,
                    }}>
                    <Tag tone={item.status === 'sent' ? 'lime' : item.status === 'failed' ? 'red' : 'mute'} sm>
                      {friendlySendStatus(item.status, lang)}
                    </Tag>
                    <span style={{ fontWeight: 500, color: W.c.text }}>{item.athleteName || '—'}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(item.body || '').slice(0, 60)}
                    </span>
                  </div>
                  {item.status === 'failed' && item.error && (
                    <div style={{ fontSize: 11, color: W.c.red, marginTop: 4, marginLeft: 2 }}>
                      {lang === 'es'
                        ? 'No se pudo enviar. Revisá el número del atleta o contactá a soporte.'
                        : 'Could not send. Check the athlete phone number or contact support.'}
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={reloadOutbox} style={{ border: 'none', background: 'none', color: W.c.lime, fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}>
                {lang === 'es' ? 'Actualizar' : 'Refresh'}
              </button>
            </div>
          </div>
        )}

        {/* ——— ENVIAR ——— */}
        {pageTab === 'enviar' && (
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            {!connected && (
              <div style={{ ...card, marginBottom: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: W.c.dim, margin: '0 0 12px' }}>
                  {lang === 'es' ? 'Primero conectá tu WhatsApp.' : 'Connect WhatsApp first.'}
                </p>
                <Btn primary sm onClick={() => setPageTab('conexion')}>
                  {lang === 'es' ? 'Ir a Conexión' : 'Go to Connect'}
                </Btn>
              </div>
            )}
            <div style={{
              display: 'flex', gap: 0, minHeight: 480,
              opacity: connected ? 1 : 0.45, pointerEvents: connected ? 'auto' : 'none',
            }}>
            <div style={{
              width: 300, flexShrink: 0, borderRadius: 12, overflow: 'hidden',
              border: `1px solid ${W.c.lineDim}`, background: W.c.card,
            }}>
              <WhatsAppAthletePicker
                athletes={athletes}
                loading={athletesLoading}
                selectedId={selectedAthlete?.id}
                onSelect={selectAthlete}
                lang={lang}
                compact
              />
            </div>
            <div style={{ flex: 1, marginLeft: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={card}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {selectedAthlete?.name || (lang === 'es' ? 'Elegí un atleta' : 'Pick an athlete')}
                </div>
                {selectedAthlete && (
                  <div style={{ fontFamily: W.font.mono, fontSize: 11, color: hasWhatsAppPhone(selectedAthlete) ? WA : W.c.orange, marginBottom: 14 }}>
                    {hasWhatsAppPhone(selectedAthlete)
                      ? (selectedAthlete.whatsappDisplay || formatWhatsAppDisplay(selectedAthlete.whatsappPhone))
                      : (lang === 'es' ? 'Sin número en la app' : 'No number in app')}
                  </div>
                )}

                {implementedRules.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: W.c.dim, display: 'block', marginBottom: 6 }}>
                      {lang === 'es' ? 'Usar texto de una regla' : 'Use text from a rule'}
                    </label>
                    <select
                      value={selected?.id || ''}
                      onChange={e => {
                        const rule = implementedRules.find(r => r.id === e.target.value)
                        if (rule) selectRule(rule)
                      }}
                      style={{ ...inp, cursor: 'pointer' }}
                    >
                      {implementedRules.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <textarea
                  value={sendBody}
                  onChange={e => { setSendBody(e.target.value); setSendError('') }}
                  rows={8}
                  disabled={!selectedAthlete}
                  placeholder={lang === 'es' ? 'Escribí el mensaje…' : 'Write your message…'}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.5, fontFamily: W.font.mono, fontSize: 13 }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {SIMPLE_TEMPLATE_VARS.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      disabled={!selectedAthlete}
                      onClick={() => setSendBody(b => `${b}{{${v.key}}}`)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: `1px solid ${W.c.lineDim}`,
                        background: W.c.bg2, color: W.c.lime, fontSize: 11,
                        cursor: selectedAthlete ? 'pointer' : 'default',
                        opacity: selectedAthlete ? 1 : 0.4,
                      }}
                    >
                      + {varChipLabel(v, lang)}
                    </button>
                  ))}
                </div>
                {sendError && <div style={{ fontSize: 12, color: W.c.red, marginTop: 10 }}>{sendError}</div>}
                {sendOk && (
                  <div style={{ fontSize: 12, color: WA, marginTop: 10, fontFamily: W.font.mono }}>
                    {lang === 'es' ? 'En cola — se envía en segundos desde tu WhatsApp.' : 'Queued — sends in seconds from your WhatsApp.'}
                  </div>
                )}
                <Btn
                  primary
                  style={{ marginTop: 16 }}
                  disabled={sending || !selectedAthlete || !hasWhatsAppPhone(selectedAthlete)}
                  onClick={handleSendToAthlete}
                >
                  {sending ? '…' : (lang === 'es' ? 'Enviar mensaje' : 'Send message')}
                </Btn>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* ——— REGLAS ——— */}
        {pageTab === 'reglas' && (
          <div style={{ display: 'flex', gap: 16, minHeight: 520, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 14, color: W.c.dim, margin: '0 0 8px', lineHeight: 1.5 }}>{catMeta.desc}</p>
              {!billing?.paymentAlias && (
                <div style={{ ...card, borderStyle: 'dashed', padding: 14, marginBottom: 4 }}>
                  <p style={{ fontSize: 13, color: W.c.dim, margin: 0, lineHeight: 1.45 }}>
                    {lang === 'es'
                      ? 'Para mensajes de cuota, cargá alias y monto en Configuración.'
                      : 'For payment messages, set alias and amount in Settings.'}
                  </p>
                  <Btn ghost sm style={{ marginTop: 10 }} onClick={() => navigate('/settings')}>
                    {lang === 'es' ? 'Configuración →' : 'Settings →'}
                  </Btn>
                </div>
              )}
              {loading ? (
                <p style={{ color: W.c.mute, fontSize: 13 }}>…</p>
              ) : implementedRules.map(rule => {
                const isSel = selected?.id === rule.id
                return (
                  <div
                    key={rule.id}
                    onClick={() => selectRule(rule)}
                    style={{
                      ...card,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      border: `1px solid ${isSel ? WA : W.c.lineDim}`,
                      background: isSel ? `${WA}12` : W.c.card,
                      opacity: rule.active ? 1 : 0.65,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 26, lineHeight: 1 }}>{rule.icon || '💬'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{rule.name}</div>
                        <div style={{ fontSize: 13, color: W.c.dim, marginTop: 6, lineHeight: 1.45 }}>
                          {ruleWhenText(rule, lang)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); toggleActive(rule) }}
                        aria-pressed={rule.active}
                        style={{
                          padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                          background: rule.active ? WA : W.c.lineDim,
                          color: rule.active ? W.c.bg : W.c.mute,
                          fontWeight: 700, fontSize: 12,
                        }}
                      >
                        {rule.active
                          ? (lang === 'es' ? 'Activa' : 'On')
                          : (lang === 'es' ? 'Apagada' : 'Off')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {selected && (
              <div style={{ width: 360, flexShrink: 0, ...card, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{selected.name}</div>
                <p style={{ fontSize: 13, color: W.c.dim, margin: '8px 0 0', lineHeight: 1.45 }}>
                  {ruleWhenText(selected, lang)}
                </p>
                <label style={{ fontSize: 12, color: W.c.mute, marginTop: 18, display: 'block' }}>
                  {lang === 'es' ? 'Mensaje que se envía' : 'Message to send'}
                </label>
                <textarea
                  value={draft || selected.template || ''}
                  onChange={e => setDraft(e.target.value)}
                  rows={7}
                  style={{ ...inp, marginTop: 8, resize: 'vertical', lineHeight: 1.5, fontSize: 14 }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {SIMPLE_TEMPLATE_VARS.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setDraft(d => `${d}{{${v.key}}}`)}
                      style={{
                        padding: '5px 12px', borderRadius: 6, border: `1px solid ${W.c.lineDim}`,
                        background: W.c.bg2, color: W.c.lime, fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      + {varChipLabel(v, lang)}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: W.c.mute, marginTop: 10, lineHeight: 1.45 }}>
                  {lang === 'es'
                    ? 'Nombre, monto y alias se completan solos con los datos del atleta y tu configuración.'
                    : 'Name, amount and alias are filled from athlete data and your settings.'}
                </p>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Btn primary sm disabled={saving} onClick={saveTemplate}>
                    {saving ? '…' : (lang === 'es' ? 'Guardar mensaje' : 'Save message')}
                  </Btn>
                  <Btn ghost sm onClick={() => {
                    setPageTab('enviar')
                    if (selectedAthlete) {
                      setSendBody(renderWhatsAppTemplate(draft || selected.template || '', athleteTemplateVars(selectedAthlete, {}, billing)))
                    } else {
                      setSendBody(draft || selected.template || '')
                    }
                  }}>
                    {lang === 'es' ? 'Probar con un atleta →' : 'Try with an athlete →'}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ——— CONEXIÓN ——— */}
        {pageTab === 'conexion' && (
          <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {connectionCard}
            <div style={card}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                {lang === 'es' ? 'Pasos' : 'Steps'}
              </div>
              {[
                lang === 'es' ? 'Tocá Conectar WhatsApp.' : 'Tap Connect WhatsApp.',
                lang === 'es' ? 'Escaneá el QR desde WhatsApp en tu celular.' : 'Scan the QR from WhatsApp on your phone.',
                lang === 'es' ? 'Cuando figure Activo, los mensajes salen desde tu número.' : 'When it says Active, messages are sent from your number.',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13, color: W.c.dim, lineHeight: 1.45 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 11, background: W.c.cardHi,
                    fontFamily: W.font.mono, fontSize: 11, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
            <details style={{ ...card, fontSize: 12, color: W.c.mute, lineHeight: 1.5 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: W.c.dim }}>
                {lang === 'es' ? '¿Necesitás ayuda?' : 'Need help?'}
              </summary>
              <p style={{ marginTop: 12 }}>
                {lang === 'es'
                  ? 'Si el QR no aparece o los mensajes no salen, contactá a soporte y te ayudamos a revisar la conexión.'
                  : 'If the QR does not appear or messages are not sent, contact support and we will help you check the connection.'}
              </p>
              <SupportButton context="conexión de WhatsApp" lang={lang} />
            </details>
          </div>
        )}
      </div>

    </DesktopChrome>
  )
}
