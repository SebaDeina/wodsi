import { Component } from 'react'
import { W } from '../tokens'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', background: W.c.bg, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32, fontFamily: W.font.sans,
      }}>
        <div style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ fontSize: 11, color: W.c.red, letterSpacing: 1, marginBottom: 12, fontFamily: W.font.mono }}>
            ERROR
          </div>
          <div style={{
            background: W.c.card, borderRadius: 12, padding: 24,
            border: `1px solid ${W.c.red}40`,
          }}>
            <div style={{ fontSize: 20, color: W.c.text, fontWeight: 700, marginBottom: 10, lineHeight: 1.25 }}>
              No pudimos mostrar esta pantalla
            </div>
            <p style={{ fontSize: 14, color: W.c.dim, lineHeight: 1.5, margin: 0 }}>
              Actualizá la página. Si vuelve a pasar, contactá a soporte para que podamos revisar tu cuenta.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: W.c.lime,
                  color: W.c.bg,
                  fontFamily: W.font.sans,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Actualizar
              </button>
              <a
                href="mailto:soporte@wodsi.app?subject=Ayuda%20con%20Wodsi"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1px solid ${W.c.lineDim}`,
                  background: W.c.cardHi,
                  color: W.c.text,
                  fontFamily: W.font.sans,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Contactar soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
