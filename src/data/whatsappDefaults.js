/**
 * Reglas automáticas de WhatsApp — solo disparadores que el worker ejecuta hoy.
 * Pensadas para coaches: nombre claro, cuándo se envía en lenguaje simple.
 */

export const IMPLEMENTED_TRIGGER_KEYS = new Set([
  'on_signup',
  'plan_due_day',
  'overdue_days',
  'overdue_pause',
  'inactive_session',
])

/** Reglas por defecto (máx. 4 esenciales; el resto el coach las activa si quiere). */
export const BOX_WHATSAPP_RULES = [
  {
    category: 'box',
    slug: 'welcome',
    name: 'Bienvenida',
    icon: '👋',
    triggerKey: 'on_signup',
    triggerLabel: 'Alta de atleta',
    sendTime: null,
    template:
      '¡Hola {{nombre}}! Bienvenido al box. Ya tenés la app lista; cualquier duda escribime por acá.',
    active: true,
    order: 0,
  },
  {
    category: 'box',
    slug: 'due_today',
    name: 'Recordatorio de cuota',
    icon: '💳',
    triggerKey: 'plan_due_day',
    triggerLabel: 'Cuota del mes',
    sendTime: '09:30',
    template:
      'Hola {{nombre}}, hoy corresponde la cuota ({{monto}}). Vence el {{vencimiento}}. Transferí al alias {{alias}}. ¡Gracias!',
    active: true,
    order: 1,
  },
  {
    category: 'box',
    slug: 'overdue_3',
    name: 'Cuota vencida',
    icon: '⏰',
    triggerKey: 'overdue_days',
    triggerLabel: '3 días sin pagar',
    sendTime: '09:30',
    triggerDays: 3,
    template:
      'Hola {{nombre}}, vi que la cuota sigue pendiente. ¿Necesitás ayuda para regularizar? Escribime cuando puedas.',
    active: false,
    order: 2,
  },
  {
    category: 'box',
    slug: 'inactive_5',
    name: 'Te extrañamos',
    icon: '🏋️',
    triggerKey: 'inactive_session',
    triggerLabel: '5 días sin venir',
    sendTime: '09:30',
    triggerDays: 5,
    template:
      'Hola {{nombre}}, hace unos días que no te vemos en el box. ¿Todo bien?',
    active: false,
    order: 3,
  },
]

/** Reglas “app del atleta” — aún no automatizadas; no se muestran en la lista principal. */
export const FUTURE_WHATSAPP_RULES = [
  {
    category: 'athlete',
    slug: 'pr_new',
    name: 'Nuevo PR',
    triggerKey: 'athlete_pr',
    triggerLabel: 'Próximamente',
    sendTime: null,
    template: '🔥 {{nombre}}, nuevo PR en {{movimiento}}: {{peso}}.',
    active: false,
    order: 10,
  },
]

export const DEFAULT_WHATSAPP_RULES = [...BOX_WHATSAPP_RULES]

export const RULE_CATEGORIES = {
  box: {
    es: { title: 'Mensajes automáticos', desc: 'Elegí qué avisos querés mandar y editá el texto.' },
    en: { title: 'Automatic messages', desc: 'Choose which notices to send and edit the text.' },
  },
}

export const SIMPLE_TEMPLATE_VARS = [
  { key: 'nombre', es: 'Nombre', en: 'Name' },
  { key: 'monto', es: 'Monto', en: 'Amount' },
  { key: 'alias', es: 'Alias', en: 'Alias' },
]

export function templateVarsForCategory() {
  return SIMPLE_TEMPLATE_VARS
}

/** Texto humano de cuándo se dispara la regla. */
export function ruleWhenText(rule, lang = 'es') {
  const t = rule?.triggerKey
  const time = rule?.sendTime || '09:30'
  const days = rule?.triggerDays ?? 3

  const texts = {
    on_signup: {
      es: 'Cuando un atleta nuevo se da de alta en tu roster',
      en: 'When a new athlete joins your roster',
    },
    plan_due_day: {
      es: `Todos los días a las ${time} (atletas con plan al día)`,
      en: `Every day at ${time} (athletes with an active plan)`,
    },
    overdue_days: {
      es: `A las ${time}, si llevan ${days} días con cuota vencida`,
      en: `At ${time}, if payment is ${days} days overdue`,
    },
    overdue_pause: {
      es: `A las ${time}, si llevan ${days} días vencidos (mensaje fuerte)`,
      en: `At ${time}, if ${days} days overdue (firm message)`,
    },
    inactive_session: {
      es: `A las ${time}, si no entrenan hace ${days} días`,
      en: `At ${time}, if no session in ${days} days`,
    },
  }

  return texts[t]?.[lang] || rule?.triggerLabel || ''
}

export function isImplementedRule(rule) {
  return rule && IMPLEMENTED_TRIGGER_KEYS.has(rule.triggerKey)
}

export function varChipLabel(v, lang) {
  return lang === 'es' ? v.es : v.en
}

/** Compat: triggers personalizados deshabilitados en UI simple. */
export const TRIGGER_OPTIONS_BOX = []
export const TRIGGER_OPTIONS_ATHLETE = []
export const TRIGGER_OPTIONS = []

export function triggersForCategory() {
  return []
}
