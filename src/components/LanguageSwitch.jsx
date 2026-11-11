import { LANGUAGES, useI18n } from '../i18n/I18nContext'

export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className="flex rounded-md border border-neutral-200 p-0.5 text-[11px] dark:border-neutral-700"
    >
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          title={l.label}
          className={`rounded-[2px] px-2 py-1 font-mono transition ${
            lang === l.code
              ? 'bg-accent-600 text-white dark:bg-accent-500'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}
