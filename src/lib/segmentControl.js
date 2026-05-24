import { W } from '../tokens'

/** Botones tipo pestaña / segmento — activo legible en tema oscuro. */
export function segmentButtonStyle(active) {
  return active
    ? {
        border: `1px solid ${W.c.lime}`,
        background: W.c.cardHi,
        color: W.c.lime,
        fontWeight: 700,
      }
    : {
        border: `1px solid ${W.c.lineDim}`,
        background: W.c.card,
        color: W.c.text,
        fontWeight: 600,
      }
}
