import { createContext, useContext, useMemo, useState } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('tm_language') || 'ta')
  const toggle = () => {
    const next = language === 'ta' ? 'en' : 'ta'
    setLanguage(next)
    localStorage.setItem('tm_language', next)
  }
  const local = (value) => typeof value === 'object' && value ? (value[language] || value.en || value.ta || '') : value || ''
  const value = useMemo(() => ({ language, setLanguage, toggle, local }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
