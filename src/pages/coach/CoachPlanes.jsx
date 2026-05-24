import { useLang } from '../../context/LangContext'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { CoachHeader } from './CoachHeader'
import { CoachSubscriptionPanel } from '../../components/CoachSubscriptionPanel'
import { useIsMobile } from '../../hooks/useBreakpoint'

export default function CoachPlanes() {
  const { lang } = useLang()
  const isMobile = useIsMobile(1024)

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={lang === 'es' ? 'Planes' : 'Plans'}
        subtitle={lang === 'es'
          ? 'Suscripción mensual a Wodsi · Mercado Pago'
          : 'Monthly Wodsi subscription · Mercado Pago'}
      />

      <div style={{
        flex: 1, overflowY: 'auto', minHeight: 0,
        padding: isMobile ? '20px 16px 100px' : '32px 40px 64px',
        maxWidth: 880,
      }}>
        <div style={{
          background: W.c.card, borderRadius: 16, padding: isMobile ? 20 : 28,
          border: `1px solid ${W.c.lineDim}`,
        }}>
          <CoachSubscriptionPanel lang={lang} />
        </div>
      </div>
    </DesktopChrome>
  )
}
