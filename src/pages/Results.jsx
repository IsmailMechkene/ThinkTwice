import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import RichText, { CodeBlock } from '../components/RichText'
import { Explanation, QuestionMeta } from '../components/QuestionCard'
import Icon from '../components/Icon'
import { Button, Card, EmptyState, ProgressBar, scoreColor, SectionTitle } from '../components/ui'
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

// White ring drawn on the gradient banner.
function ScoreRing({ pct }) {
  const { t } = useI18n()
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label={t('results.score', { pct })}>
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" stroke="rgb(255 255 255 / 0.22)" />
      {pct > 0 && (
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          stroke="#fff"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      )}
      <text x="60" y="68" textAnchor="middle" fill="#fff" className="text-2xl font-extrabold">
        {pct}%
      </text>
    </svg>
  )
}

function Chip({ children }) {
  return <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">{children}</span>
}

// Compact row: question + both answers; the full explanation unfolds on demand.
function MistakeItem({ answer }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const question = questionById[answer.qid]
  const arranged = answer.order.map((orig, i) => ({ letter: LETTERS[i], orig, text: question.choices[orig] }))
  const chosen = arranged.find((c) => c.orig === answer.chosen)
  const right = arranged.find((c) => c.orig === question.answer)
  return (
    <li className="px-4 py-4 sm:px-5">
      <QuestionMeta question={question} />
      <p className="mt-2 font-medium leading-relaxed">
        <RichText text={question.question} />
      </p>
      <CodeBlock code={question.code} />
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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
      >
        {open ? t('results.hide') : t('results.show')}
        <Icon name="arrow" className={`h-3.5 w-3.5 transition ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>
      {open && (
        <div className="animate-fade-up mt-3">
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

  // Answered wrong vs never answered (skipped, or time ran out). Only answered mistakes go to the mistake bank.
  const wrong = answers.filter((a) => !a.correct && a.chosen != null)
  const skipped = answers.filter((a) => a.chosen == null)
  const minutes = Math.floor(result.durationSec / 60)

  return (
    <div className="mx-auto max-w-3xl">
      <section className="brand-fill animate-pop rounded-3xl p-6 text-white sm:p-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <ScoreRing pct={summary.pct} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/75">
              {t('results.title')} · {t(`mode.${result.mode}`)}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{t('results.correctOf', { correct: summary.correct, total: summary.total })}</h1>
            <p className="mt-2 text-white/85">{t(verdictKey(summary.pct))}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Chip>⏱ {t('results.time', { m: minutes, s: result.durationSec % 60 })}</Chip>
              {wrong.length > 0 && <Chip>🧩 {t('results.toBank', { count: wrong.length })}</Chip>}
              {skipped.length > 0 && <Chip>⏭ {t('results.skippedChip', { count: skipped.length })}</Chip>}
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {wrong.length > 0 && (
                <Button to="/quiz/play" state={{ mode: 'revise' }} variant="light">
                  {t('results.revise')} <Icon name="arrow" className="h-4 w-4" />
                </Button>
              )}
              <Button to="/quiz" variant="glass">
                {t('results.newQuiz')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SectionTitle>{t('results.byChapter')}</SectionTitle>
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
            <ProgressBar value={c.correct} max={c.total} color={scoreColor(percent(c.correct, c.total))} label={`${c.chapter} ${percent(c.correct, c.total)}%`} />
          </div>
        ))}
      </Card>

      <SectionTitle>{t('results.mistakes', { count: wrong.length })}</SectionTitle>
      {wrong.length === 0 ? (
        <Card className="text-center">{skipped.length ? t('results.noWrong') : t('results.perfect')}</Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {wrong.map((a) => (
              <MistakeItem key={a.qid} answer={a} />
            ))}
          </ul>
        </Card>
      )}

      {skipped.length > 0 && (
        <>
          <SectionTitle hint={t('results.skippedHint')}>{t('results.skipped', { count: skipped.length })}</SectionTitle>
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {skipped.map((a) => (
                <MistakeItem key={a.qid} answer={a} />
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
