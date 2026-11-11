import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import Icon from '../components/Icon'
import ResumeBanner from '../components/ResumeBanner'
import SubjectCard from '../components/SubjectCard'
import { Button, Card, EmptyState } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress, useSubjectStats } from '../hooks/useProgress'
import { profileName, useI18n } from '../i18n/I18nContext'
import { flashcards, questions, subjects } from '../lib/content'
import { dayKey, streakFrom } from '../lib/date'
import { chapterAccuracy, percent } from '../lib/scoring'
import { isDue } from '../lib/srs'

function PlanItem({ dot, text, to, state }) {
  return (
    <li>
      <Link
        to={to}
        state={state}
        className="group flex items-baseline gap-3.5 border-b border-neutral-200 py-3 transition hover:border-accent-500 dark:border-neutral-800 dark:hover:border-accent-400"
      >
        <span aria-hidden className={`h-2.5 w-2.5 shrink-0 self-center rounded-[3px] ${dot}`} />
        <span className="min-w-0 flex-1">{text}</span>
        <Icon name="arrow" className="h-4 w-4 shrink-0 self-center text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-accent-600 dark:group-hover:text-accent-400" />
      </Link>
    </li>
  )
}

export default function Home() {
  const { progress, currentProfile } = useProgress()
  const { t } = useI18n()
  const subjectStats = useSubjectStats()
  const { count: mistakes } = useMistakes()
  const [query, setQuery] = useState('')

  const today = progress.daily[dayKey()]
  const dueCards = useMemo(() => {
    const d = dayKey()
    return flashcards.filter((f) => isDue(progress.flashcards[f.id], d)).length
  }, [progress.flashcards])

  const streak = useMemo(
    () => streakFrom(Object.entries(progress.daily).filter(([, d]) => d.answered || d.cards).map(([k]) => k)),
    [progress.daily],
  )
  const unseen = useMemo(() => questions.filter((q) => !progress.questions[q.id]?.attempts).length, [progress.questions])
  const weakest = useMemo(() => chapterAccuracy(subjects, progress.questions, 3).find((w) => w.pct < 80), [progress.questions])

  const totals = Object.values(progress.questions).reduce(
    (acc, s) => ({ attempts: acc.attempts + s.attempts, correct: acc.correct + s.correct }),
    { attempts: 0, correct: 0 },
  )

  // The most useful next actions, in priority order.
  const plan = []
  if (mistakes) plan.push({ dot: 'bg-rose-500', text: t('home.planMistakes', { count: mistakes }), to: '/quiz/play', state: { mode: 'revise' } })
  if (dueCards) plan.push({ dot: 'bg-teal-500', text: t('home.planCards', { count: dueCards }), to: '/flashcards' })
  if (weakest)
    plan.push({
      dot: 'bg-amber-500',
      text: t('home.planWeakest', { chapter: weakest.chapter.title }),
      to: `/quiz?subject=${encodeURIComponent(weakest.subject.id)}&chapter=${encodeURIComponent(weakest.chapter.key)}`,
    })
  if (unseen) plan.push({ dot: 'bg-accent-500', text: t('home.planNew', { count: unseen }), to: '/quiz' })

  // The three tools, in the order they feed each other.
  const tools = [
    { to: '/quiz', color: 'var(--accent)', ink: 'text-accent-700 dark:text-accent-300', title: t('home.toolQuiz'), desc: t('home.toolQuizDesc'), meta: t('home.toolQuizMeta', { count: questions.length, unseen }) },
    { to: '/mistakes', color: '#f43f5e', ink: 'text-rose-700 dark:text-rose-300', title: t('home.toolBank'), desc: t('home.toolBankDesc'), meta: t('home.toolBankMeta', { count: mistakes }) },
    { to: '/flashcards', color: '#14b8a6', ink: 'text-teal-700 dark:text-teal-300', title: t('home.toolCards'), desc: t('home.toolCardsDesc'), meta: t('home.toolCardsMeta', { count: dueCards }) },
  ]

  const visible = subjects.filter((s) => {
    const q = query.trim().toLowerCase()
    return !q || `${s.name} ${s.description} ${s.chapters.map((c) => c.title).join(' ')}`.toLowerCase().includes(q)
  })

  return (
    <div>
      <ResumeBanner />
      <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow text-accent-700 dark:text-accent-300">{t('home.hi', { name: profileName(currentProfile, t) })}</p>
          <h1 className="mt-3 text-4xl leading-[1.08] font-normal sm:text-5xl">{t('home.title')}</h1>
          <p className="mt-4 max-w-lg leading-relaxed text-neutral-600 dark:text-neutral-400">{t('home.lead')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button to="/quiz">
              {t('home.startQuiz')} <Icon name="arrow" className="h-4 w-4" />
            </Button>
            <Button to="/flashcards" variant="secondary">
              {t('home.reviewCards', { count: dueCards })}
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-neutral-900 pb-2 dark:border-neutral-200">
            <h2 className="text-xl font-medium">{t('home.todayPlan')}</h2>
            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400" title={t('home.streakHint', { count: streak })}>
              {streak > 0 && <span aria-hidden className="mr-1.5 inline-block h-2 w-2 bg-marker align-middle" />}
              {t('home.streakBadge', { count: streak })}
            </span>
          </div>
          {plan.length ? (
            <ol>
              {plan.slice(0, 4).map((p) => (
                <PlanItem key={p.text} {...p} />
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">{t('home.planDone')}</p>
          )}
          <p className="mt-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {t('home.todayLine', { answered: today?.answered || 0, pct: today?.answered ? percent(today.correct, today.answered) : 0 })}
            {totals.attempts > 0 && ` · ${t('home.accuracy')} ${percent(totals.correct, totals.attempts)}%`}
          </p>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-4">
          <h2 className="text-2xl font-medium">{t('home.how')}</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{t('home.howHint')}</p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {tools.map((tool, i) => (
            <li key={tool.to}>
              <Link
                to={tool.to}
                className={`group flex h-full flex-col rounded-md border border-t-[3px] border-neutral-200 bg-white p-5 transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600`}
                style={{ borderTopColor: tool.color }}
              >
                <span className={`font-mono text-xs font-medium ${tool.ink}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className="mt-2 flex items-center gap-2 font-display text-2xl decoration-1 underline-offset-4 group-hover:underline">
                  {tool.title}
                  <Icon name="arrow" className="h-4 w-4 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-neutral-100" />
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{tool.desc}</span>
                <span className={`mt-auto pt-4 font-mono text-xs font-medium ${tool.ink}`}>{tool.meta}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-medium">
            {t('home.subjects')} <span className="font-mono text-sm text-neutral-500">{subjects.length}</span>
          </h2>
          {subjects.length > 3 && (
            <label className="relative w-full sm:w-72">
              <span className="sr-only">{t('home.searchLabel')}</span>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="w-full rounded-md border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm focus:border-accent-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-200"
              />
            </label>
          )}
        </div>

        {subjects.length === 0 ? (
          <EmptyState title={t('home.noSubjects')}>{t('home.noSubjectsHint')}</EmptyState>
        ) : visible.length === 0 ? (
          <Card className="text-center text-neutral-500">{t('home.noMatch', { query })}</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) => (
              <SubjectCard key={s.id} subject={s} stats={subjectStats[s.id]} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
