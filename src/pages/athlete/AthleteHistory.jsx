import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { AthleteShell } from '../../components/AthleteShell'
import { EmptyCard } from '../../components/EmptyCard'

export default function AthleteHistory() {
  const { lang } = useLang()

  return (
    <AthleteShell lang={lang}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontFamily: W.font.mono, color: W.c.mute, letterSpacing: 1 }}>{lang === 'es' ? 'TU HISTORIAL' : 'YOUR HISTORY'}</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, fontFamily: W.font.display, marginTop: 2 }}>
              {lang === 'es' ? 'Tu progreso' : 'Your progress'}
            </div>
          </div>

          <EmptyCard
            title={lang === 'es' ? 'Sin adherencia aún' : 'No adherence yet'}
            hint={lang === 'es'
              ? 'Cuando completes sesiones desde la app, vas a ver tu porcentaje de asistencia acá.'
              : 'When you complete sessions from the app, your attendance rate will show here.'}
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{lang === 'es' ? 'PRs recientes' : 'Recent PRs'}</div>
            <EmptyCard
              title={lang === 'es' ? 'Sin PRs registrados' : 'No PRs logged'}
              hint={lang === 'es'
                ? 'Tu coach puede cargar benchmarks; por ahora no hay marcas personales en tu cuenta.'
                : 'Your coach may add benchmarks; there are no personal records on your account yet.'}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <EmptyCard
              title={lang === 'es' ? 'Gráficos próximamente' : 'Charts coming soon'}
              hint={lang === 'es'
                ? 'Evolución de levantamientos y tiempos cuando empieces a registrar resultados.'
                : 'Lift and time trends once you start logging results.'}
            />
          </div>
    </AthleteShell>
  )
}
