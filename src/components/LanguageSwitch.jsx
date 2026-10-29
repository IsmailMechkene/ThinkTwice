import { LANGUAGES, useI18n } from '../i18n/I18nContext'

export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className="flex rounded-xl border border-slate-200 p-0.5 text-xs font-bold dark:border-slate-700"
    >
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          title={l.label}
          className={`rounded-lg px-2 py-1.5 transition ${
            lang === l.code
              ? 'bg-indigo-600 text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}
