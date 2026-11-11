import { Link } from 'react-router'
import { useI18n } from '../i18n/I18nContext'
import { ProgressBar } from './ui'

export default function SubjectCard({ subject, stats }) {
  const { t } = useI18n()
  return (
    <Link
      to={`/subject/${subject.id}`}
      className="group flex flex-col rounded-md border border-neutral-200 bg-white p-5 transition hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-400"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow flex items-center gap-2">
          <span aria-hidden className="inline-block h-2 w-2" style={{ background: subject.color }} />
          {t('subjectCard.chapters', { count: subject.chapters.length })}
        </p>
        <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400" title={t('subject.mastery')}>
          {t('subject.mastery')} {stats.mastery}%
        </p>
      </div>
      <h3 className="mt-2 text-2xl leading-tight font-medium decoration-1 underline-offset-4 group-hover:underline">{subject.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{subject.description}</p>
      <div className="mt-auto pt-6">
        <ProgressBar value={stats.done} max={stats.total} label={t('subjectCard.done', { done: stats.done, total: stats.total })} />
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="tabular-nums">{t('subjectCard.done', { done: stats.done, total: stats.total })}</span>
          <span>
            <span className="text-neutral-900 tabular-nums dark:text-neutral-100">{stats.attempts ? `${stats.accuracy}%` : '—'}</span>{' '}
            {t('subjectCard.accuracy')}
          </span>
          <span>
            <span className={`tabular-nums ${stats.mistakes ? 'text-rose-700 dark:text-rose-400' : 'text-neutral-900 dark:text-neutral-100'}`}>{stats.mistakes}</span>{' '}
            {t('subjectCard.toRevise')}
          </span>
        </div>
      </div>
    </Link>
  )
}
