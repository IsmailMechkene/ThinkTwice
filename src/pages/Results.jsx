import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import RichText from '../components/RichText'
import { Explanation, QuestionMeta } from '../components/QuestionCard'
import { Button, Card, EmptyState, PageHeader, ProgressBar } from '../components/ui'
import { LETTERS, questionById } from '../lib/content'
import { percent, summarize, verdictKey } from '../lib/scoring'
import { useI18n } from '../i18n/I18nContext'
import { RESULT_KEY } from './QuizPlayer'

function loadResult(state) {
  if (state?.result) return state.result
  try {
    return JSON.parse(localStorage.getItem(RESULT_KEY))
  } catch {
    return null
  }
}

function ScoreRing({ pct }) {
  const { t } = useI18n()
  const r = 52
  const c = 2 * Math.PI * r
  const color = pct >= 70 ? '#059669' : pct >= 50 ? '#d97706' : '#e11d48'
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={t('results.score', { pct })}>
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-slate-800" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        strokeWidth="10"
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="68" textAnchor="middle" className="fill-current text-2xl font-bold">
        {pct}%
      </text>
    </svg>
  )
}

function MistakeItem({ answer }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const question = questionById[answer.qid]
  const arranged = answer.order.map((orig, i) => ({ letter: LETTERS[i], orig, text: question.choices[orig] }))
  const chosen = arranged.find((c) => c.orig === answer.chosen)
  const right = arranged.find((c) => c.orig === question.answer)
  return (
    <li>
      <Card>
        <QuestionMeta question={question} />
        <p className="mt-3 font-medium">
          <RichText text={question.question} />
        </p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p className="rounded-lg bg-rose-50 p-2.5 dark:bg-rose-950/40">
            <span className="font-semibold text-rose-700 dark:text-rose-300">{t('results.yourAnswer')}</span>
            {chosen ? <RichText text={`${chosen.letter}. ${chosen.text}`} /> : <em>{t('results.noAnswer')}</em>}
          </p>
          <p className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/40">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">{t('results.correct')}</span>
            <RichText text={`${right.letter}. ${right.text}`} />
          </p>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          {open ? t('results.hide') : t('results.show')}
        </button>
      </Card>
      {open && (
        <div className="mt-2">
          <Explanation question={question} arranged={arranged} chosen={answer.chosen} />
        </div>
      )}
    </li>
  )
}

export default function Results() {
  const { state } = useLocation()
  const { t } = useI18n()
  const result = useMemo(() => loadResult(state), [state])
  const answers = useMemo(() => (result?.answers || []).filter((a) => questionById[a.qid]), [result])
  const summary = useMemo(() => summarize(answers.map((a) => ({ ...a, question: questionById[a.qid] }))), [answers])

  if (!answers.length) {
    return <EmptyState title={t('results.none')} action={<Button to="/quiz">{t('results.startQuiz')}</Button>} />
  }

  const wrong = answers.filter((a) => !a.correct)
  const minutes = Math.floor(result.durationSec / 60)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('results.title')} subtitle={t(`mode.${result.mode}`)} />

      <Card className="flex flex-col items-center gap-6 sm:flex-row">
        <ScoreRing pct={summary.pct} />
        <div>
          <p className="text-2xl font-bold">{t('results.correctOf', { correct: summary.correct, total: summary.total })}</p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t(verdictKey(summary.pct))}</p>
          <p className="mt-1 text-sm text-slate-500">{t('results.time', { m: minutes, s: result.durationSec % 60 })}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {wrong.length > 0 && (
              <Button to="/quiz/play" state={{ mode: 'revise' }}>
                {t('results.revise')}
              </Button>
            )}
            <Button to="/quiz" variant="secondary">
              {t('results.newQuiz')}
            </Button>
          </div>
        </div>
      </Card>

      <h2 className="mt-8 mb-3 text-lg font-bold">{t('results.byChapter')}</h2>
      <Card className="space-y-4">
        {summary.chapters.map((c) => (
          <div key={c.key}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="text-slate-500">{c.subject} · </span>
                {c.chapter}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {c.correct}/{c.total} · {percent(c.correct, c.total)}%
              </span>
            </div>
            <ProgressBar value={c.correct} max={c.total} label={`${c.chapter} score`} />
          </div>
        ))}
      </Card>

      <h2 className="mt-8 mb-3 text-lg font-bold">{t('results.mistakes', { count: wrong.length })}</h2>
      {wrong.length === 0 ? (
        <Card className="text-center">{t('results.perfect')}</Card>
      ) : (
        <ul className="space-y-3">
          {wrong.map((a) => (
            <MistakeItem key={a.qid} answer={a} />
          ))}
        </ul>
      )}
    </div>
  )
}
