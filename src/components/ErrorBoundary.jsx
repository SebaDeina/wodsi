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

    const msg = this.state.error?.message || String(this.state.error)
    const stack = this.state.error?.stack || ''

    return (
      <div style={{
        minHeight: '100vh', background: W.c.bg, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32, fontFamily: W.font.mono,
      }}>
        <div style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ fontSize: 11, color: W.c.red, letterSpacing: 1, marginBottom: 12 }}>
            RENDER ERROR
          </div>
          <div style={{
            background: W.c.card, borderRadius: 12, padding: 24,
            border: `1px solid ${W.c.red}40`,
          }}>
            <div style={{ fontSize: 14, color: W.c.text, fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
              {msg}
            </div>
            <pre style={{
              fontSize: 11, color: W.c.dim, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              lineHeight: 1.6, margin: 0, maxHeight: 300, overflow: 'auto',
            }}>
              {stack.split('\n').slice(1, 8).join('\n')}
            </pre>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: W.c.mute }}>
            Revisá la consola del navegador (F12) para más detalles.
          </div>
        </div>
      </div>
    )
  }
}
