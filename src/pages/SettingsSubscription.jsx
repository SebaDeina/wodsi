import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useIsMobile } from '../hooks/useBreakpoint'
import { W } from '../tokens'
import { DesktopChrome } from '../components/DesktopChrome'
import { CoachHeader } from './coach/CoachHeader'
import { Btn } from '../components/Btn'
import { CoachSubscriptionPanel } from '../components/CoachSubscriptionPanel'

export default function SettingsSubscription() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const isMobile = useIsMobile(1024)

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={lang === 'es' ? 'Mi suscripción' : 'My subscription'}
        subtitle={lang === 'es' ? 'Plan Wodsi · Mercado Pago' : 'Wodsi plan · Mercado Pago'}
        right={(
          <Btn ghost sm onClick={() => navigate('/settings?tab=cobros')}>
            ← {lang === 'es' ? 'Ajustes' : 'Settings'}
          </Btn>
        )}
      />
      <div style={{
        flex: 1, overflow: 'auto',
        padding: isMobile ? '20px 16px 100px' : '32px 40px 64px',
        maxWidth: 720,
      }}>
        <CoachSubscriptionPanel lang={lang} />
      </div>
    </DesktopChrome>
  )
}
