import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './en'
import fr from './fr'

// UI translations. Course content stays in the language of each subject.
export const DICTIONARIES = { en, fr }
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', locale: 'en-GB' },
  { code: 'fr', label: 'Français', short: 'FR', locale: 'fr-FR' },
]

const KEY = 'thinktwice:lang'
const I18nContext = createContext(null)

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && DICTIONARIES[saved]) return saved
    return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
  } catch {
    return 'en'
  }
}

// Entries are strings with {placeholders}, or functions of the variables (for plurals).
export function translate(lang, key, vars) {
  const entry = DICTIONARIES[lang]?.[key] ?? en[key]
  if (entry == null) return key
  if (typeof entry === 'function') return entry(vars || {})
  return entry.replace(/\{(\w+)\}/g, (_, k) => (vars?.[k] ?? `{${k}}`))
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next) => {
    if (!DICTIONARIES[next]) return
    setLangState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(() => {
    const locale = LANGUAGES.find((l) => l.code === lang)?.locale
    return { lang, setLang, locale, t: (key, vars) => translate(lang, key, vars) }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// The built-in first profile is stored as "Me"; show it in the current language.
export function profileName(profile, t) {
  return profile?.id === 'me' && profile.name === 'Me' ? t('profile.defaultName') : profile?.name
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
