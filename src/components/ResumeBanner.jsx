import { useState } from 'react'
import { useProgress } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
import { activeQuizSummary, clearActiveQuiz } from '../lib/activeQuiz'
import { Button, ProgressBar } from './ui'

// Shown when a quiz was left unfinished (tab closed, reload, phone locked…).
export default function ResumeBanner() {
  const { currentProfile } = useProgress()
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(false)
  const active = dismissed ? null : activeQuizSummary(currentProfile.id)
  if (!active) return null

  return (
    <div className="animate-pop mb-6 flex flex-col gap-3 rounded-sm border border-l-[3px] border-stone-300 border-l-marker bg-white p-4 sm:flex-row sm:items-center dark:border-stone-800 dark:border-l-marker dark:bg-stone-900">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {t('resume.title')} · <span className="font-normal">{t(`mode.${active.mode}`)}</span>
        </p>
        <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{t('resume.text', { answered: active.answered, total: active.total })}</p>
        <ProgressBar className="mt-2 max-w-xs" value={active.answered} max={active.total} label={t('player.progress')} />
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            if (!confirm(t('resume.confirmDiscard'))) return
            clearActiveQuiz(currentProfile.id)
            setDismissed(true)
          }}
        >
          {t('resume.discard')}
        </Button>
        <Button to="/quiz/play">{t('resume.continue')}</Button>
      </div>
    </div>
  )
}
