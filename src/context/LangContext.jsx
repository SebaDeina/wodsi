import { createContext, useContext, useState, useEffect } from 'react'

export const LangCtx = createContext({ lang: 'es', setLang: () => {} })

// Standalone provider used before auth is ready (login/register pages)
export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('wodsi:lang') || 'es')
  useEffect(() => { localStorage.setItem('wodsi:lang', lang) }, [lang])
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>
}

export function useLang() { return useContext(LangCtx) }
