import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { buildTimerConfig, loadTimerWod, saveTimerWod } from '../lib/timerSession'
import { useAthleteTimerPrefs } from './useAthleteTimerPrefs'

/** @param {'amrap'|'emom'|'fortime'|'tabata'} mode */
export function useTimerConfig(mode) {
  const { lang } = useLang()
  const location = useLocation()
  const { prefs } = useAthleteTimerPrefs()

  const wod = useMemo(() => {
    if (location.state?.wod) {
      saveTimerWod(location.state.wod)
      return location.state.wod
    }
    return loadTimerWod()
  }, [location.state?.wod])

  const config = useMemo(
    () => buildTimerConfig(mode, { wod, prefs, lang }),
    [mode, wod, prefs, lang],
  )

  return { config, wod, isSession: Boolean(wod) }
}
