import { PhoneFrame } from './PhoneFrame'
import { MobileTabs } from './MobileTabs'
import { W } from '../tokens'

const wrapStyle = {
  height: '100dvh',
  maxHeight: '100dvh',
  background: W.c.bg,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  overflow: 'hidden',
}

export function AthleteShell({ children, lang, showTabs = true }) {
  return (
    <div style={wrapStyle}>
      <PhoneFrame fill>
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}>
          <main style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px 20px 8px',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}>
            {children}
          </main>
          {showTabs && <MobileTabs lang={lang} />}
        </div>
      </PhoneFrame>
    </div>
  )
}
