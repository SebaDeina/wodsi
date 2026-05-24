import { getRedirectResult } from 'firebase/auth'
import { auth } from '../firebase'

let redirectResultPromise = null

/** Una sola lectura por carga; no cachear rechazos (evita error=google en cada visita). */
export function consumeGoogleRedirectResult() {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth).catch((err) => {
      redirectResultPromise = null
      throw err
    })
  }
  return redirectResultPromise
}
