import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import './Landing.css'

const NAV_ITEMS = [
  { id: 'producto', es: 'Producto', en: 'Product' },
  { id: 'ejemplos', es: 'Ejemplos', en: 'Examples' },
  { id: 'beneficios', es: 'Beneficios', en: 'Benefits' },
  { id: 'planes', es: 'Planes', en: 'Plans' },
]

const BENEFITS = [
  {
    es: 'Planificación semanal',
    en: 'Weekly programming',
    copyEs: 'Cargá la semana una vez y publicala para todo el box, grupos o atletas puntuales.',
    copyEn: 'Load the week once and publish it to the whole gym, groups, or individual athletes.',
  },
  {
    es: 'Atletas ordenados',
    en: 'Organized athletes',
    copyEs: 'Cada atleta entra, ve su día, su historial y los relojes que necesita para entrenar.',
    copyEn: 'Each athlete logs in, sees the day, their history, and the timers they need to train.',
  },
  {
    es: 'WhatsApp sin copiar y pegar',
    en: 'WhatsApp without copy-paste',
    copyEs: 'Avisos de bienvenida, cuotas y programación desde un flujo pensado para el coach.',
    copyEn: 'Welcome, payment, and programming notices from a flow designed for the coach.',
  },
]

const WEEK = [
  ['Lun', 'Fuerza', 'Back squat + accesorios'],
  ['Mar', 'Engine', 'Row / C2B / burpees'],
  ['Mié', 'Oly', 'Power snatch + overhead'],
  ['Jue', 'Lower', 'Lunges + cossack squat'],
  ['Vie', 'Metcon', 'Ski / run / sled push'],
]

const ATHLETES = [
  ['Seba', 'Grupo RX', 'Al día'],
  ['Mica', 'Competencia', 'Vence 28/05'],
  ['Tomi', 'Principiantes', 'Sin WhatsApp'],
]

const AUTOMATIONS = [
  ['Bienvenida', 'Cuando entra un atleta nuevo', 'ACTIVA'],
  ['Cuota', 'Recordatorio 3 días antes', 'ACTIVA'],
  ['Planificación', 'Aviso cuando publicás la semana', 'LISTA'],
  ['Seguimiento', 'Si no completó entrenos', 'PAUSADA'],
]

function copy(lang, es, en) {
  return lang === 'es' ? es : en
}

function Brand() {
  return (
    <div className="landing-brand" aria-label="Wodsi">
      <span className="landing-brand-mark">W</span>
      <span>wodsi</span>
    </div>
  )
}

function WeekBoard({ lang }) {
  return (
    <div className="landing-week-board" aria-label={copy(lang, 'Vista semanal', 'Weekly view')}>
      <div className="landing-week-head">
        <span>{copy(lang, 'Semana del box', 'Gym week')}</span>
        <span>{copy(lang, 'Publicado', 'Published')}</span>
      </div>
      <div className="landing-week-list">
        {WEEK.map(([day, type, work]) => (
          <div className="landing-week-row" key={day}>
            <div className="landing-week-day">{day}</div>
            <div>
              <strong>{type}</strong>
              <p>{work}</p>
            </div>
            <span className="landing-week-dot" />
          </div>
        ))}
      </div>
    </div>
  )
}

function PhonePreview({ lang }) {
  return (
    <div className="landing-phone" aria-label={copy(lang, 'Vista atleta', 'Athlete view')}>
      <div className="landing-phone-bar" />
      <div className="landing-phone-kicker">{copy(lang, 'Hoy', 'Today')}</div>
      <h3>{copy(lang, 'Día 3', 'Day 3')}</h3>
      <div className="landing-phone-block">
        <span>3 vueltas</span>
        <p>400 mts run<br />12 power snatch<br />9 overhead<br />6 burpees</p>
      </div>
      <button type="button">AMRAP · EMOM · TABATA</button>
    </div>
  )
}

function AthleteWorkoutPreview({ lang }) {
  return (
    <div className="landing-athlete-app-preview" aria-label={copy(lang, 'App del atleta', 'Athlete app')}>
      <div className="landing-athlete-app-top">
        <div>
          <span>{copy(lang, 'Miércoles · Día 3', 'Wednesday · Day 3')}</span>
          <h3>{copy(lang, 'Trabajo del día', "Today's session")}</h3>
        </div>
        <strong>RX</strong>
      </div>

      <div className="landing-athlete-workout-block">
        <div className="landing-athlete-block-head">
          <span>01</span>
          <div>
            <em>{copy(lang, 'Vueltas', 'Rounds')}</em>
            <strong>4 rounds</strong>
          </div>
        </div>
        {['30" hollow rocks', '30" hollow holds', '30" crunches', '30" rest'].map(item => (
          <p key={item}>{item}</p>
        ))}
      </div>

      <div className="landing-athlete-workout-block">
        <div className="landing-athlete-block-head">
          <span>02</span>
          <div>
            <em>For Time</em>
            <strong>10-8-6-4-2</strong>
          </div>
        </div>
        {['Hang power clean', 'BMU', '30 doble unders por vuelta'].map(item => (
          <p key={item}>{item}</p>
        ))}
      </div>

      <button type="button" className="landing-athlete-start">
        {copy(lang, 'Empezar sesión', 'Start session')}
      </button>
    </div>
  )
}

function AthletePanelPreview({ lang }) {
  return (
    <div className="landing-athletes-preview">
      <div className="landing-preview-topline">
        <span>{copy(lang, 'Atletas', 'Athletes')}</span>
        <strong>38</strong>
      </div>
      <div className="landing-athlete-stats">
        <div><strong>31</strong><span>{copy(lang, 'activos', 'active')}</span></div>
        <div><strong>7</strong><span>{copy(lang, 'pendientes', 'pending')}</span></div>
        <div><strong>4</strong><span>{copy(lang, 'grupos', 'groups')}</span></div>
      </div>
      <div className="landing-athlete-list">
        {ATHLETES.map(([name, group, status]) => (
          <div className="landing-athlete-row" key={name}>
            <span className="landing-athlete-avatar">{name.slice(0, 1)}</span>
            <div>
              <strong>{name}</strong>
              <p>{group}</p>
            </div>
            <em>{status}</em>
          </div>
        ))}
      </div>
    </div>
  )
}

function WhatsAppPreview({ lang }) {
  return (
    <div className="landing-whatsapp-preview">
      <div className="landing-preview-topline">
        <span>WhatsApp</span>
        <strong>{copy(lang, 'Automático', 'Automatic')}</strong>
      </div>
      <div className="landing-wa-list">
        {AUTOMATIONS.map(([title, detail, status]) => (
          <div className="landing-wa-row" key={title}>
            <div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
            <span>{status}</span>
          </div>
        ))}
      </div>
      <div className="landing-wa-message">
        <span>{copy(lang, 'Mensaje listo', 'Message ready')}</span>
        <p>Hola {'{nombre}'}, ya está publicada la semana del box.</p>
      </div>
    </div>
  )
}

function PlanningComparison({ lang }) {
  return (
    <div className="landing-planning-preview">
      <div className="landing-preview-topline">
        <span>{copy(lang, 'Planificación semanal', 'Weekly programming')}</span>
        <strong>{copy(lang, 'Coach + atleta', 'Coach + athlete')}</strong>
      </div>
      <div className="landing-planning-columns">
        <div className="landing-coach-calendar">
          <span>{copy(lang, 'Coach', 'Coach')}</span>
          {WEEK.slice(0, 4).map(([day, type]) => (
            <div key={day}>
              <strong>{day}</strong>
              <p>{type}</p>
            </div>
          ))}
        </div>
        <div className="landing-athlete-day">
          <span>{copy(lang, 'Atleta', 'Athlete')}</span>
          <h4>Día 3</h4>
          <p>Power snatch<br />Overhead squat<br />Burpees over bar</p>
          <button type="button">For Time</button>
        </div>
      </div>
    </div>
  )
}

function CoachBuilderPreview({ lang }) {
  return (
    <div className="landing-coach-builder-preview" aria-label={copy(lang, 'Creación de WOD del coach', 'Coach WOD builder')}>
      <div className="landing-preview-topline">
        <span>{copy(lang, 'Coach planner', 'Coach planner')}</span>
        <strong>{copy(lang, 'Nuevo WOD', 'New WOD')}</strong>
      </div>
      <div className="landing-builder-grid">
        <div className="landing-builder-form">
          <label>{copy(lang, 'Título', 'Title')}</label>
          <div className="landing-builder-input">Día 3 · Oly + Metcon</div>

          <div className="landing-builder-mini-row">
            <div>
              <label>{copy(lang, 'Fecha', 'Date')}</label>
              <div className="landing-builder-input">Mié 29</div>
            </div>
            <div>
              <label>{copy(lang, 'Destino', 'Audience')}</label>
              <div className="landing-builder-input">Grupo RX</div>
            </div>
          </div>

          <label>{copy(lang, 'Bloques', 'Blocks')}</label>
          <div className="landing-builder-block">
            <span>01 · Fuerza</span>
            <p>3x4 Back Squats + 6/8 cal bike</p>
          </div>
          <div className="landing-builder-block">
            <span>02 · For Time</span>
            <p>10-8-6-4-2 Hang power clean + BMU</p>
          </div>
        </div>

        <div className="landing-builder-week">
          <span>{copy(lang, 'Semana publicada', 'Published week')}</span>
          {WEEK.map(([day, type]) => (
            <div key={day} className={day === 'Mié' ? 'is-active' : ''}>
              <strong>{day}</strong>
              <p>{type}</p>
            </div>
          ))}
          <button type="button">{copy(lang, 'Publicar semana', 'Publish week')}</button>
        </div>
      </div>
    </div>
  )
}

function FeatureTile({ title, text, index }) {
  return (
    <article className="landing-feature-tile">
      <span>{String(index).padStart(2, '0')}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function PriceCard({ name, price, detail, featured, onClick }) {
  return (
    <article className={`landing-price-card${featured ? ' is-featured' : ''}`}>
      {featured && <span className="landing-price-badge">POPULAR</span>}
      <h3>{name}</h3>
      <div className="landing-price-value">{price}</div>
      <p>{detail}</p>
      <button type="button" onClick={onClick}>Elegir plan</button>
    </article>
  )
}

export default function Landing() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function goLogin() {
    setMenuOpen(false)
    navigate('/login')
  }

  function goSignupCoach() {
    setMenuOpen(false)
    navigate('/register?role=coach')
  }

  function scrollTo(id) {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="landing-new">
      <header className={`landing-new-nav${scrolled ? ' is-scrolled' : ''}`}>
        <button type="button" className="landing-brand-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Brand />
        </button>

        <nav className="landing-new-links" aria-label="Landing">
          {NAV_ITEMS.map(item => (
            <button key={item.id} type="button" onClick={() => scrollTo(item.id)}>
              {copy(lang, item.es, item.en)}
            </button>
          ))}
        </nav>

        <div className="landing-new-actions">
          <button type="button" className="landing-link-button" onClick={goLogin}>
            {copy(lang, 'Ingresar', 'Log in')}
          </button>
          <button type="button" className="landing-primary-button" onClick={goSignupCoach}>
            {copy(lang, 'Probar Wodsi', 'Try Wodsi')}
          </button>
        </div>

        <button
          type="button"
          className="landing-menu-button"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          {menuOpen ? 'Cerrar' : 'Menú'}
        </button>
      </header>

      {menuOpen && (
        <div className="landing-mobile-menu">
          {NAV_ITEMS.map(item => (
            <button key={item.id} type="button" onClick={() => scrollTo(item.id)}>
              {copy(lang, item.es, item.en)}
            </button>
          ))}
          <button type="button" onClick={goLogin}>{copy(lang, 'Ingresar', 'Log in')}</button>
          <button type="button" className="landing-mobile-cta" onClick={goSignupCoach}>
            {copy(lang, 'Probar Wodsi', 'Try Wodsi')}
          </button>
        </div>
      )}

      <section className="landing-hero-clean">
        <div className="landing-hero-copy-clean">
          <p className="landing-eyebrow">{copy(lang, 'Para boxes y coaches', 'For gyms and coaches')}</p>
          <h1>
            {copy(
              lang,
              'Planificá tu box. Tus atletas lo ven al instante.',
              'Program your gym. Your athletes see it instantly.',
            )}
          </h1>
          <p className="landing-hero-lead">
            {copy(
              lang,
              'Wodsi ordena la semana, los atletas, los relojes y los avisos. Sin planillas eternas ni mensajes perdidos en WhatsApp.',
              'Wodsi organizes the week, athletes, timers, and notices. No endless spreadsheets or lost WhatsApp messages.',
            )}
          </p>
          <div className="landing-hero-buttons">
            <button type="button" className="landing-primary-button is-large" onClick={goSignupCoach}>
              {copy(lang, 'Empezar gratis', 'Start free')}
            </button>
            <button type="button" className="landing-secondary-button" onClick={() => scrollTo('producto')}>
              {copy(lang, 'Ver cómo funciona', 'See how it works')}
            </button>
          </div>
          <p className="landing-hero-note">
            {copy(lang, 'Pensado para entrenamiento funcional, cross training y boxes con programación semanal.', 'Built for functional training, cross training, and gyms with weekly programming.')}
          </p>
        </div>

        <div className="landing-hero-product">
          <WeekBoard lang={lang} />
          <PhonePreview lang={lang} />
        </div>
      </section>

      <section className="landing-strip" aria-label={copy(lang, 'Módulos', 'Modules')}>
        {[
          copy(lang, 'Planificación', 'Programming'),
          'WhatsApp',
          copy(lang, 'Atletas', 'Athletes'),
          copy(lang, 'Relojes', 'Timers'),
          copy(lang, 'Cobros', 'Payments'),
        ].map(item => <span key={item}>{item}</span>)}
      </section>

      <section id="producto" className="landing-section-clean landing-product-section">
        <div className="landing-section-intro">
          <p className="landing-eyebrow">{copy(lang, 'Producto', 'Product')}</p>
          <h2>{copy(lang, 'La semana del box en un solo lugar.', 'The gym week in one place.')}</h2>
          <p>
            {copy(
              lang,
              'Cargá entrenamientos por día, asigná a todo el box o a grupos, y dejá que cada atleta entre a ver lo que le toca.',
              'Load workouts by day, assign them to the whole gym or groups, and let each athlete see what they need.',
            )}
          </p>
        </div>

        <div className="landing-product-grid">
          <div className="landing-product-card is-dark">
            <h3>{copy(lang, 'Vista del coach', 'Coach view')}</h3>
            <p>{copy(lang, 'El coach arma la semana por días, grupos o atletas, y publica cuando está listo.', 'The coach builds the week by days, groups, or athletes, and publishes when ready.')}</p>
            <CoachBuilderPreview lang={lang} />
          </div>
          <div className="landing-product-card">
            <h3>{copy(lang, 'Vista del atleta', 'Athlete view')}</h3>
            <p>{copy(lang, 'El atleta entra y ve solo lo que tiene que hacer: el día, los bloques y el botón para empezar.', 'The athlete opens the app and sees only what they need: the day, blocks, and start button.')}</p>
            <AthleteWorkoutPreview lang={lang} />
          </div>
        </div>
      </section>

      <section id="ejemplos" className="landing-section-clean landing-examples-section">
        <div className="landing-section-intro">
          <p className="landing-eyebrow">{copy(lang, 'Ejemplos visibles', 'Visible examples')}</p>
          <h2>{copy(lang, 'Así se ve Wodsi en el día a día.', 'This is how Wodsi looks day to day.')}</h2>
          <p>
            {copy(
              lang,
              'Más que una promesa: pantallas simples para manejar atletas, avisos y semanas completas sin ruido.',
              'More than a promise: simple screens to manage athletes, notices, and complete weeks without noise.',
            )}
          </p>
        </div>

        <div className="landing-examples-grid">
          <article className="landing-example-card is-wide">
            <div>
              <p className="landing-example-kicker">{copy(lang, 'Panel de atletas', 'Athlete panel')}</p>
              <h3>{copy(lang, 'Roster, grupos y estado de cobro en una vista.', 'Roster, groups, and payment status in one view.')}</h3>
            </div>
            <AthletePanelPreview lang={lang} />
          </article>

          <article className="landing-example-card">
            <div>
              <p className="landing-example-kicker">WhatsApp</p>
              <h3>{copy(lang, 'Automatizaciones que acompañan sin perseguir.', 'Automations that help without chasing people.')}</h3>
            </div>
            <WhatsAppPreview lang={lang} />
          </article>

          <article className="landing-example-card">
            <div>
              <p className="landing-example-kicker">{copy(lang, 'Coach y atleta', 'Coach and athlete')}</p>
              <h3>{copy(lang, 'La misma semana, dos vistas distintas.', 'The same week, two different views.')}</h3>
            </div>
            <PlanningComparison lang={lang} />
          </article>
        </div>
      </section>

      <section id="beneficios" className="landing-section-clean">
        <div className="landing-section-intro">
          <p className="landing-eyebrow">{copy(lang, 'Beneficios', 'Benefits')}</p>
          <h2>{copy(lang, 'Menos administración. Más entrenamiento.', 'Less admin. More training.')}</h2>
        </div>
        <div className="landing-feature-grid-clean">
          {BENEFITS.map((item, index) => (
            <FeatureTile
              key={item.es}
              index={index + 1}
              title={copy(lang, item.es, item.en)}
              text={copy(lang, item.copyEs, item.copyEn)}
            />
          ))}
        </div>
      </section>

      <section className="landing-quote-section">
        <p>
          {copy(
            lang,
            '“Queríamos que el coach pueda preparar la semana y volver al box. Wodsi existe para sacar ruido, no para agregar otra herramienta difícil.”',
            '“We wanted coaches to prepare the week and get back on the floor. Wodsi exists to remove noise, not add another complicated tool.”',
          )}
        </p>
        <span>{copy(lang, 'Equipo Wodsi', 'Wodsi team')}</span>
      </section>

      <section id="planes" className="landing-section-clean">
        <div className="landing-section-intro">
          <p className="landing-eyebrow">{copy(lang, 'Planes', 'Plans')}</p>
          <h2>{copy(lang, 'Pagás según el tamaño de tu box.', 'Pay based on gym size.')}</h2>
          <p>{copy(lang, 'Simple para empezar, claro para crecer.', 'Simple to start, clear to grow.')}</p>
        </div>
        <div className="landing-price-grid">
          <PriceCard name="Starter" price="$12.000" detail={copy(lang, 'Hasta 20 atletas · ARS / mes', 'Up to 20 athletes · ARS / month')} onClick={goSignupCoach} />
          <PriceCard name="Box" price="$28.000" detail={copy(lang, 'Hasta 80 atletas · ARS / mes', 'Up to 80 athletes · ARS / month')} featured onClick={goSignupCoach} />
          <PriceCard name="Chain" price={copy(lang, 'A medida', 'Custom')} detail={copy(lang, 'Para cadenas, sedes o equipos grandes', 'For chains, locations, or larger teams')} onClick={goSignupCoach} />
        </div>
      </section>

      <section className="landing-final-clean">
        <h2>{copy(lang, 'Tu box, más simple.', 'Your gym, simpler.')}</h2>
        <p>{copy(lang, 'Probá Wodsi y armá tu primera semana de programación.', 'Try Wodsi and build your first programming week.')}</p>
        <button type="button" className="landing-primary-button is-large" onClick={goSignupCoach}>
          {copy(lang, 'Empezar ahora', 'Start now')}
        </button>
      </section>

      <footer className="landing-footer-clean">
        <Brand />
        <span>© 2026</span>
        <span>wodsi.com.ar</span>
      </footer>
    </main>
  )
}
