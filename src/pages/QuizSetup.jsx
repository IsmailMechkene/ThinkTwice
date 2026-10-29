import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import FilterPanel, { EMPTY_FILTER } from '../components/FilterPanel'
import { Button, Card, Chip, PageHeader, Toggle } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress } from '../hooks/useProgress'
import { matchesFilter, questions, subjectById } from '../lib/content'
import { pickQuestions } from '../lib/quiz'

const COUNTS = [5, 10, 20, 40]

function filterFromParams(params) {
  const subject = params.get('subject')
  const chapter = params.get('chapter')
  const valid = subject && subjectById[subject]
  return {
    ...EMPTY_FILTER,
    subjectIds: valid ? [subject] : [],
    chapterKeys: valid && chapter ? [`${subject}/${chapter}`] : [],
    coreOnly: params.get('core') === '1',
  }
}

export default function QuizSetup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { progress } = useProgress()
  const [filter, setFilter] = useState(() => filterFromParams(params))
  const [count, setCount] = useState(() => Number(params.get('count')) || 10)
  const [prioritize, setPrioritize] = useState(true)
  const [exam, setExam] = useState(false)
  const [minutes, setMinutes] = useState(15)
  const { count: mistakeCount } = useMistakes(filter.subjectIds.length ? { subjectIds: filter.subjectIds } : undefined)

  const available = useMemo(() => questions.filter((q) => matchesFilter(q, filter)).length, [filter])
  const effective = count === 0 ? available : Math.min(count, available)

  function start() {
    const picked = pickQuestions(filter, { count: count || undefined, prioritize, stats: progress.questions })
    navigate('/quiz/play', {
      state: { mode: exam ? 'exam' : 'quiz', questionIds: picked.map((q) => q.id), examMinutes: exam ? minutes : null },
    })
  }

  return (
    <div>
      <PageHeader
        title="Set up a quiz"
        subtitle="Pick what to revise. Select several subjects for a mixed exam."
        actions={
          mistakeCount > 0 && (
            <Button variant="secondary" onClick={() => navigate('/quiz/play', { state: { mode: 'revise', filter: { subjectIds: filter.subjectIds } } })}>
              Revise my {mistakeCount} mistake{mistakeCount === 1 ? '' : 's'}
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <FilterPanel value={filter} onChange={setFilter} items={questions} showDifficulty />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Questions</p>
              <div className="flex flex-wrap gap-2">
                {COUNTS.map((n) => (
                  <Chip key={n} active={count === n} onClick={() => setCount(n)}>
                    {n}
                  </Chip>
                ))}
                <Chip active={count === 0} onClick={() => setCount(0)}>
                  All
                </Chip>
              </div>
            </div>
            <Toggle checked={prioritize} onChange={setPrioritize} label="Prioritize weak spots" hint="Unseen and often-missed questions first." />
            <Toggle
              checked={exam}
              onChange={setExam}
              label="Timed exam mode"
              hint="A countdown, and answers are revealed only at the end."
            />
            {exam && (
              <label className="block text-sm">
                <span className="font-medium">Time limit (minutes)</span>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
                />
              </label>
            )}
          </Card>
          <Card>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-100">{effective}</span> question
              {effective === 1 ? '' : 's'} · {available} match your filters
            </p>
            <Button className="mt-4 w-full" disabled={!available} onClick={start}>
              Start {exam ? 'exam' : 'quiz'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
