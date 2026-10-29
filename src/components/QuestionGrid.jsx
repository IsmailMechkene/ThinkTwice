import { useI18n } from '../i18n/I18nContext'
import { cx } from './ui'

// Status of question i. In exam mode right/wrong stay hidden until the end.
export function questionStatus(i, { answers, visited, index, exam }) {
  const a = answers[i]
  if (a) return exam ? 'answered' : a.correct ? 'correct' : 'wrong'
  if (visited[i] && i !== index) return 'skipped'
  return 'todo'
}

const STYLES = {
  correct: 'bg-emerald-500 text-white border-emerald-500',
  wrong: 'bg-rose-500 text-white border-rose-500',
  answered: 'bg-indigo-500 text-white border-indigo-500',
  skipped: 'bg-amber-50 text-amber-800 border-amber-400 border-dashed dark:bg-amber-950/40 dark:text-amber-300',
  todo: 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
}

function Legend({ status, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cx('h-3 w-3 rounded border', STYLES[status])} aria-hidden />
      {label}
    </span>
  )
}

export default function QuestionGrid({ total, answers, visited, index, exam, onJump }) {
  const { t } = useI18n()
  const statuses = Array.from({ length: total }, (_, i) => questionStatus(i, { answers, visited, index, exam }))
  const count = (s) => statuses.filter((x) => x === s).length

  return (
    <div>
      <ol className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
        {statuses.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onJump(i)}
              aria-current={i === index ? 'step' : undefined}
              aria-label={t('grid.goTo', { n: i + 1, status: t(`grid.${s}`) })}
              title={t(`grid.${s}`)}
              className={cx(
                'h-9 w-full rounded-lg border text-xs font-bold tabular-nums transition hover:scale-105',
                STYLES[s],
                i === index && 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-indigo-400 dark:ring-offset-slate-900',
              )}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        {exam ? (
          <Legend status="answered" label={`${t('grid.answered')} (${count('answered')})`} />
        ) : (
          <>
            <Legend status="correct" label={`${t('grid.correct')} (${count('correct')})`} />
            <Legend status="wrong" label={`${t('grid.wrong')} (${count('wrong')})`} />
          </>
        )}
        <Legend status="skipped" label={`${t('grid.skipped')} (${count('skipped')})`} />
        <Legend status="todo" label={`${t('grid.todo')} (${count('todo')})`} />
      </div>
    </div>
  )
}
