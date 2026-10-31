import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import Icon from '../components/Icon'
import ResumeBanner from '../components/ResumeBanner'
import SubjectCard from '../components/SubjectCard'
import { Card, EmptyState, Stat } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress, useSubjectStats } from '../hooks/useProgress'
import { profileName, useI18n } from '../i18n/I18nContext'
import { flashcards, questions, subjects } from '../lib/content'
import { dayKey, streakFrom } from '../lib/date'
import { chapterAccuracy, percent } from '../lib/scoring'
import { isDue } from '../lib/srs'

function PlanItem({ icon, text, to, state, tone }) {
  return (
    <li>
      <Link
        to={to}
        state={state}
        className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 p-3 transition hover:border-indigo-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-700 dark:hover:bg-slate-900"
      >
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base ${tone}`}>{icon}</span>
        <span className="min-w-0 flex-1 text-sm font-medium">{text}</span>
        <Icon name="arrow" className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
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
  if (mistakes) plan.push({ icon: '🎯', tone: 'bg-rose-50 dark:bg-rose-950', text: t('home.planMistakes', { count: mistakes }), to: '/quiz/play', state: { mode: 'revise' } })
  if (dueCards) plan.push({ icon: '🃏', tone: 'bg-violet-50 dark:bg-violet-950', text: t('home.planCards', { count: dueCards }), to: '/flashcards' })
  if (weakest)
    plan.push({
      icon: '📉',
      tone: 'bg-amber-50 dark:bg-amber-950',
      text: t('home.planWeakest', { chapter: weakest.chapter.title }),
      to: `/quiz?subject=${encodeURIComponent(weakest.subject.id)}&chapter=${encodeURIComponent(weakest.chapter.key)}`,
    })
  if (unseen) plan.push({ icon: '✨', tone: 'bg-indigo-50 dark:bg-indigo-950', text: t('home.planNew', { count: unseen }), to: '/quiz' })

  const visible = subjects.filter((s) => {
    const q = query.trim().toLowerCase()
    return !q || `${s.name} ${s.description} ${s.chapters.map((c) => c.title).join(' ')}`.toLowerCase().includes(q)
  })

  return (
    <div>
      <ResumeBanner />
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="brand-fill rounded-3xl p-6 text-white sm:p-8">
          <p className="text-sm font-semibold text-white/80">{t('home.hi', { name: profileName(currentProfile, t) })}</p>
          <h1 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{t('home.title')}</h1>
          <p className="mt-3 max-w-xl text-white/85">{t('home.lead')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              {t('home.startQuiz')} <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              to="/flashcards"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25"
            >
              {t('home.reviewCards', { count: dueCards })}
            </Link>
          </div>
        </div>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">{t('home.todayPlan')}</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300" title={t('home.streakHint', { count: streak })}>
              🔥 {t('home.streakBadge', { count: streak })}
            </span>
          </div>
          {plan.length ? (
            <ul className="mt-4 space-y-2">
              {plan.slice(0, 4).map((p) => (
                <PlanItem key={p.text} {...p} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{t('home.planDone')}</p>
          )}
          <p className="mt-auto pt-4 text-xs text-slate-500 dark:text-slate-400">{t('home.streakHint', { count: streak })}</p>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon="✍️"
          label={t('home.answeredToday')}
          value={today?.answered || 0}
          hint={today?.answered ? t('home.pctCorrect', { pct: percent(today.correct, today.answered) }) : t('home.nothingYet')}
        />
        <Stat
          icon="🎯"
          tone="emerald"
          label={t('home.accuracy')}
          value={totals.attempts ? `${percent(totals.correct, totals.attempts)}%` : '—'}
          hint={t('home.answers', { count: totals.attempts })}
        />
        <Stat
          icon="🧩"
          tone="rose"
          label={t('home.mistakesToRevise')}
          value={mistakes}
          hint={t('home.mastered', { count: Object.keys(progress.mastered).length })}
        />
        <Stat icon="🃏" tone="violet" label={t('home.cardsDue')} value={dueCards} hint={t('home.cardsTotal', { count: flashcards.length })} />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            {t('home.subjects')} <span className="font-normal text-slate-500">({subjects.length})</span>
          </h2>
          {subjects.length > 3 && (
            <label className="relative w-full sm:w-72">
              <span className="sr-only">{t('home.searchLabel')}</span>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          )}
        </div>

        {subjects.length === 0 ? (
          <EmptyState title={t('home.noSubjects')}>{t('home.noSubjectsHint')}</EmptyState>
        ) : visible.length === 0 ? (
          <Card className="text-center text-slate-500">{t('home.noMatch', { query })}</Card>
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
