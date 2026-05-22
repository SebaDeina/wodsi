import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { Btn } from '../../components/Btn'
import { CoachHeader } from './CoachHeader'

export default function CoachBilling() {
  const { lang } = useLang()
  const navigate = useNavigate()

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={t('billing', lang)}
        subtitle={lang === 'es' ? 'Cobros online — próximamente' : 'Online billing — coming soon'}
      />
      <div style={{ flex: 1, padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          maxWidth: 440,
          textAlign: 'center',
          padding: 40,
          borderRadius: 16,
          border: `1px dashed ${W.c.lineDim}`,
          background: W.c.card,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>◱</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', fontFamily: W.font.display }}>
            {lang === 'es' ? 'Sin datos de cobros aún' : 'No billing data yet'}
          </h2>
          <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.55, margin: '0 0 24px' }}>
            {lang === 'es'
              ? 'Cuando conectes Stripe o Mercado Pago, acá vas a ver MRR, movimientos y atletas con plan vencido.'
              : 'When you connect Stripe or Mercado Pago, you will see MRR, transactions, and overdue athletes here.'}
          </p>
          <Btn ghost onClick={() => navigate('/coach/athletes')}>
            {lang === 'es' ? 'Volver a atletas' : 'Back to athletes'}
          </Btn>
        </div>
      </div>
    </DesktopChrome>
  )
}
