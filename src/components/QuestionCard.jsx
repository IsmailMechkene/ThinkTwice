import { useI18n } from '../i18n/I18nContext'
import { chapterLabel } from '../lib/content'
import Icon from './Icon'
import RichText, { CodeBlock } from './RichText'
import { Badge, Card, cx } from './ui'

export function QuestionMeta({ question }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone={question.difficulty}>{t(`difficulty.${question.difficulty}`)}</Badge>
      <Badge tone={question.tier}>{t(`tier.${question.tier}`)}</Badge>
      <span className="text-xs text-slate-500 dark:text-slate-400">{chapterLabel(question)}</span>
    </div>
  )
}

// arranged: [{ letter (displayed), orig (letter in JSON), text }]
// chosen: original letter picked by the user, or null.
export default function QuestionCard({ question, arranged, chosen, reveal, onChoose }) {
  return (
    <Card className="p-5 sm:p-7">
      <QuestionMeta question={question} />
      <h2 className="mt-4 text-lg leading-relaxed font-semibold sm:text-xl">
        <RichText text={question.question} />
      </h2>
      <CodeBlock code={question.code} />

      <ul className="mt-5 space-y-2.5">
        {arranged.map((c) => {
          const isAnswer = c.orig === question.answer
          const isChosen = c.orig === chosen
          const state = !reveal ? (isChosen ? 'picked' : 'idle') : isAnswer ? 'right' : isChosen ? 'wrong' : 'dim'
          return (
            <li key={c.letter}>
              <button
                type="button"
                disabled={chosen != null}
                onClick={() => onChoose(c.orig)}
                className={cx(
                  'flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition sm:p-4',
                  state === 'idle' &&
                    'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40',
                  state === 'picked' && 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50',
                  state === 'right' && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
                  state === 'wrong' && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40',
                  state === 'dim' && 'border-slate-200 opacity-60 dark:border-slate-800',
                )}
              >
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold',
                    state === 'right'
                      ? 'bg-emerald-600 text-white'
                      : state === 'wrong'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
                  )}
                >
                  {state === 'right' ? <Icon name="check" className="h-4 w-4" /> : state === 'wrong' ? <Icon name="x" className="h-4 w-4" /> : c.letter}
                </span>
                <span className="pt-0.5 leading-relaxed">
                  <RichText text={c.text} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function Explanation({ question, arranged, chosen }) {
  const { t } = useI18n()
  const correctDisplay = arranged.find((c) => c.orig === question.answer)?.letter
  const right = chosen === question.answer
  return (
    <Card className={cx('border-l-4', right ? 'border-l-emerald-500' : 'border-l-rose-500')}>
      {chosen != null && (
        <p className={cx('font-bold', right ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
          {right ? t('explain.correct') : t('explain.notQuite', { letter: correctDisplay })}
        </p>
      )}
      <p className="mt-2 leading-relaxed">
        <span className="font-semibold">{t('explain.why', { letter: correctDisplay })}</span>
        <RichText text={question.explanation} />
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
        {arranged
          .filter((c) => c.orig !== question.answer)
          .map((c) => (
            <li key={c.letter} className={cx(c.orig === chosen && 'font-medium text-rose-700 dark:text-rose-300')}>
              <span className="font-semibold">{c.letter} ✗ </span>
              <RichText text={question.why?.[c.orig]} />
            </li>
          ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        📖 {question.ref} · {t('explain.source')}{question.sourceLabel}
      </p>
    </Card>
  )
}
