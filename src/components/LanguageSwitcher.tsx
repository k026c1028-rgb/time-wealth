import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { SupportedLang } from '../i18n/init'
import { persistLang, supportedLangs } from '../i18n/init'

const labels: Record<SupportedLang, string> = {
  en: 'English',
  'zh-Hans': '中文（简体）',
  ja: '日本語',
  es: 'Español',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = (i18n.language || 'en') as SupportedLang

  const options = useMemo(() => supportedLangs.map((l) => ({ value: l, label: labels[l] })), [])

  return (
    <div className="flex items-center gap-2">
      <select
        className="input !w-auto !py-1.5"
        value={supportedLangs.includes(current) ? current : 'en'}
        onChange={(e) => {
          const lang = e.target.value as SupportedLang
          i18n.changeLanguage(lang)
          persistLang(lang)
        }}
        aria-label="Language"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

