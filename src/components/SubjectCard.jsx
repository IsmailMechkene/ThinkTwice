import { Link } from 'react-router'
import { useI18n } from '../i18n/I18nContext'
import { ProgressBar, ProgressRing } from './ui'

export default function SubjectCard({ subject, stats }) {
  const { t } = useI18n()
  return (
    <Link
      to={`/subject/${subject.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: subject.color }} />
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `${subject.color}1f` }} aria-hidden>
          {subject.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{subject.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{subject.description}</p>
        </div>
        <ProgressRing value={stats.mastery} color={subject.color} label={`${t('subject.mastery')} ${stats.mastery}%`} size={52} />
      </div>
      <div className="mt-auto pt-5">
        <div className="mb-1.5 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t('subjectCard.done', { done: stats.done, total: stats.total })}</span>
          <span>{t('subjectCard.chapters', { count: subject.chapters.length })}</span>
        </div>
        <ProgressBar value={stats.done} max={stats.total} color={subject.color} label={t('subjectCard.done', { done: stats.done, total: stats.total })} />
        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <span className="font-semibold tabular-nums">{stats.attempts ? `${stats.accuracy}%` : '—'}</span>{' '}
            <span className="text-slate-500 dark:text-slate-400">{t('subjectCard.accuracy')}</span>
          </span>
          <span>
            <span className={`font-semibold tabular-nums ${stats.mistakes ? 'text-rose-600 dark:text-rose-400' : ''}`}>{stats.mistakes}</span>{' '}
            <span className="text-slate-500 dark:text-slate-400">{t('subjectCard.toRevise')}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
