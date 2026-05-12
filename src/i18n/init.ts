import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import zhHans from './zh-Hans.json'
import ja from './ja.json'
import es from './es.json'
import ko from './ko.json'
import fr from './fr.json'
import de from './de.json'
import it from './it.json'
import pt from './pt.json'

export const supportedLangs = [
  'en',
  'zh-Hans',
  'ja',
  'es',
  'ko',
  'fr',
  'de',
  'it',
  'pt',
] as const

export type SupportedLang = (typeof supportedLangs)[number]

const STORAGE_KEY = 'time-wealth:lang'

function normalizeNavigatorLang(raw?: string | null): SupportedLang {
  const lang = (raw ?? '').toLowerCase()

  // Chinese variants → zh-Hans (MVP)
  if (lang.startsWith('zh')) return 'zh-Hans'

  // Exact matches
  const exact = supportedLangs.find((l) => l.toLowerCase() === lang)
  if (exact) return exact

  // Prefix matches (e.g. "fr-FR" -> "fr")
  const prefix = supportedLangs.find((l) => lang.startsWith(l.toLowerCase() + '-'))
  if (prefix) return prefix

  return 'en'
}

export function getInitialLang(): SupportedLang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && supportedLangs.includes(saved as SupportedLang)) return saved as SupportedLang
  return normalizeNavigatorLang(navigator.language)
}

export function persistLang(lang: SupportedLang) {
  localStorage.setItem(STORAGE_KEY, lang)
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-Hans': { translation: zhHans },
    ja: { translation: ja },
    es: { translation: es },
    ko: { translation: ko },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    pt: { translation: pt },
  },
  lng: getInitialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n

