import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import Icon from '../components/Icon'
import ResumeBanner from '../components/ResumeBanner'
import SubjectCard from '../components/SubjectCard'
import { Button, Card, EmptyState, Stat } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress, useSubjectStats } from '../hooks/useProgress'
import { profileName, useI18n } from '../i18n/I18nContext'
import { flashcards, questions, subjects } from '../lib/content'
import { dayKey, streakFrom } from '../lib/date'
import { chapterAccuracy, percent } from '../lib/scoring'
import { isDue } from '../lib/srs'

function PlanItem({ n, text, to, state }) {
  return (
    <li>
      <Link
        to={to}
        state={state}
        className="group flex items-baseline gap-4 border-b border-stone-200 py-3 transition hover:border-stone-900 dark:border-stone-800 dark:hover:border-stone-300"
      >
        <span className="w-5 shrink-0 font-mono text-xs text-stone-400">{String(n).padStart(2, '0')}</span>
        <span className="min-w-0 flex-1">{text}</span>
        <Icon name="arrow" className="h-4 w-4 shrink-0 self-center text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-stone-900 dark:group-hover:text-stone-100" />
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
  if (mistakes) plan.push({ text: t('home.planMistakes', { count: mistakes }), to: '/quiz/play', state: { mode: 'revise' } })
  if (dueCards) plan.push({ text: t('home.planCards', { count: dueCards }), to: '/flashcards' })
  if (weakest)
    plan.push({
      text: t('home.planWeakest', { chapter: weakest.chapter.title }),
      to: `/quiz?subject=${encodeURIComponent(weakest.subject.id)}&chapter=${encodeURIComponent(weakest.chapter.key)}`,
    })
  if (unseen) plan.push({ text: t('home.planNew', { count: unseen }), to: '/quiz' })

  const visible = subjects.filter((s) => {
    const q = query.trim().toLowerCase()
    return !q || `${s.name} ${s.description} ${s.chapters.map((c) => c.title).join(' ')}`.toLowerCase().includes(q)
  })

  return (
    <div>
      <ResumeBanner />
      <section className="grid gap-10 border-b border-stone-300 pb-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16 dark:border-stone-800">
        <div>
          <p className="eyebrow">{t('home.hi', { name: profileName(currentProfile, t) })}</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-normal sm:text-6xl">{t('home.title')}</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600 dark:text-stone-400">{t('home.lead')}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button to="/quiz">
              {t('home.startQuiz')} <Icon name="arrow" className="h-4 w-4" />
            </Button>
            <Button to="/flashcards" variant="secondary">
              {t('home.reviewCards', { count: dueCards })}
            </Button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-stone-900 pb-2 dark:border-stone-200">
            <h2 className="text-xl font-medium">{t('home.todayPlan')}</h2>
            <span className="font-mono text-xs text-stone-600 dark:text-stone-400" title={t('home.streakHint', { count: streak })}>
              {streak > 0 && <span aria-hidden className="mr-1.5 inline-block h-2 w-2 bg-marker align-middle" />}
              {t('home.streakBadge', { count: streak })}
            </span>
          </div>
          {plan.length ? (
            <ol>
              {plan.slice(0, 4).map((p, i) => (
                <PlanItem key={p.text} n={i + 1} {...p} />
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">{t('home.planDone')}</p>
          )}
          <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">{t('home.streakHint', { count: streak })}</p>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        <Stat
          label={t('home.answeredToday')}
          value={today?.answered || 0}
          hint={today?.answered ? t('home.pctCorrect', { pct: percent(today.correct, today.answered) }) : t('home.nothingYet')}
        />
        <Stat
          label={t('home.accuracy')}
          value={totals.attempts ? `${percent(totals.correct, totals.attempts)}%` : '—'}
          hint={t('home.answers', { count: totals.attempts })}
        />
        <Stat label={t('home.mistakesToRevise')} value={mistakes} hint={t('home.mastered', { count: Object.keys(progress.mastered).length })} />
        <Stat label={t('home.cardsDue')} value={dueCards} hint={t('home.cardsTotal', { count: flashcards.length })} />
      </section>

      <section className="mt-14">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-medium">
            {t('home.subjects')} <span className="font-mono text-sm text-stone-500">{subjects.length}</span>
          </h2>
          {subjects.length > 3 && (
            <label className="relative w-full sm:w-72">
              <span className="sr-only">{t('home.searchLabel')}</span>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="w-full rounded-sm border border-stone-300 bg-white py-2 pr-3 pl-9 text-sm focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-300"
              />
            </label>
          )}
        </div>

        {subjects.length === 0 ? (
          <EmptyState title={t('home.noSubjects')}>{t('home.noSubjectsHint')}</EmptyState>
        ) : visible.length === 0 ? (
          <Card className="text-center text-stone-500">{t('home.noMatch', { query })}</Card>
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
