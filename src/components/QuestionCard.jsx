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
      <span className="text-xs text-stone-500 dark:text-stone-400">{chapterLabel(question)}</span>
    </div>
  )
}

// arranged: [{ letter (displayed), orig (letter in JSON), text }]
// chosen: original letter picked by the user, or null.
export default function QuestionCard({ question, arranged, chosen, reveal, onChoose }) {
  return (
    <Card className="p-5 sm:p-7">
      <QuestionMeta question={question} />
      <h2 className="mt-4 text-xl leading-snug font-medium sm:text-2xl">
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
                  'flex w-full items-start gap-3 rounded-sm border p-3.5 text-left transition sm:p-4',
                  state === 'idle' &&
                    'border-stone-300 hover:border-stone-900 dark:border-stone-700 dark:hover:border-stone-300',
                  state === 'picked' && 'border-stone-900 bg-stone-50 dark:border-stone-200 dark:bg-stone-800',
                  state === 'right' && 'border-emerald-700 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40',
                  state === 'wrong' && 'border-rose-700 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/40',
                  state === 'dim' && 'border-stone-200 opacity-60 dark:border-stone-800',
                )}
              >
                <span
                  className={cx(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-[2px] font-mono text-xs',
                    state === 'right'
                      ? 'bg-emerald-700 text-white'
                      : state === 'wrong'
                        ? 'bg-rose-700 text-white'
                        : 'border border-stone-400 text-stone-700 dark:border-stone-600 dark:text-stone-200',
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
    <Card className={cx('border-l-[3px]', right ? 'border-l-emerald-700' : 'border-l-rose-700')}>
      {chosen != null && (
        <p className={cx('font-bold', right ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
          {right ? t('explain.correct') : t('explain.notQuite', { letter: correctDisplay })}
        </p>
      )}
      <p className="mt-2 leading-relaxed">
        <span className="font-semibold">{t('explain.why', { letter: correctDisplay })}</span>
        <RichText text={question.explanation} />
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-stone-700 dark:text-stone-300">
        {arranged
          .filter((c) => c.orig !== question.answer)
          .map((c) => (
            <li key={c.letter} className={cx(c.orig === chosen && 'font-medium text-rose-700 dark:text-rose-300')}>
              <span className="font-mono text-xs">{c.letter} ✗ </span>
              <RichText text={question.why?.[c.orig]} />
            </li>
          ))}
      </ul>
      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
        {question.ref} · {t('explain.source')}{question.sourceLabel}
      </p>
    </Card>
  )
}
