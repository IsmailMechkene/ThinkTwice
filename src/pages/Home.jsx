import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import SubjectCard from '../components/SubjectCard'
import { Button, Card, EmptyState, Stat } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress, useSubjectStats } from '../hooks/useProgress'
import { flashcards, subjects } from '../lib/content'
import { dayKey } from '../lib/date'
import { percent } from '../lib/scoring'
import { isDue } from '../lib/srs'

export default function Home() {
  const { progress, currentProfile } = useProgress()
  const subjectStats = useSubjectStats()
  const { count: mistakes } = useMistakes()
  const [query, setQuery] = useState('')

  const today = progress.daily[dayKey()]
  const dueCards = useMemo(() => {
    const t = dayKey()
    return flashcards.filter((f) => isDue(progress.flashcards[f.id], t)).length
  }, [progress.flashcards])

  const totals = Object.values(progress.questions).reduce(
    (acc, s) => ({ attempts: acc.attempts + s.attempts, correct: acc.correct + s.correct }),
    { attempts: 0, correct: 0 },
  )

  const visible = subjects.filter((s) => {
    const q = query.trim().toLowerCase()
    return !q || `${s.name} ${s.description} ${s.chapters.map((c) => c.title).join(' ')}`.toLowerCase().includes(q)
  })

  return (
    <div>
      <section className="mb-8">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Hi {currentProfile.name} 👋</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Think twice, answer once.</h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
          Exam revision with quizzes that make you reason, flashcards that come back when you forget them, and a
          mistake bank that keeps every slip until you have truly fixed it.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button to="/quiz">
            Start a quiz <Icon name="arrow" className="h-4 w-4" />
          </Button>
          <Button to="/flashcards" variant="secondary">
            Review {dueCards} due card{dueCards === 1 ? '' : 's'}
          </Button>
          {mistakes > 0 && (
            <Button to="/quiz/play" state={{ mode: 'revise' }} variant="secondary">
              Revise {mistakes} mistake{mistakes === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </section>

      <section className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Answered today" value={today?.answered || 0} hint={today?.answered ? `${percent(today.correct, today.answered)}% correct` : 'Nothing yet'} />
        <Stat label="Overall accuracy" value={totals.attempts ? `${percent(totals.correct, totals.attempts)}%` : '—'} hint={`${totals.attempts} answers`} />
        <Stat label="Mistakes to revise" value={mistakes} hint={`${Object.keys(progress.mastered).length} mastered`} />
        <Stat label="Cards due" value={dueCards} hint={`${flashcards.length} flashcards in total`} />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Subjects <span className="font-normal text-slate-500">({subjects.length})</span>
          </h2>
          {subjects.length > 3 && (
            <label className="relative w-full sm:w-72">
              <span className="sr-only">Search subjects</span>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a subject or chapter…"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          )}
        </div>

        {subjects.length === 0 ? (
          <EmptyState title="No subjects yet">
            Run <code>npm run new-subject &quot;My course&quot;</code> and add chapter JSON files in <code>src/data/</code>.
          </EmptyState>
        ) : visible.length === 0 ? (
          <Card className="text-center text-slate-500">No subject matches “{query}”.</Card>
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
