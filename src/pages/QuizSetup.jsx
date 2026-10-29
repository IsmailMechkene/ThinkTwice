import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import FilterPanel, { EMPTY_FILTER } from '../components/FilterPanel'
import { Button, Card, Chip, PageHeader, Toggle } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
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
  const { t } = useI18n()
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
        title={t('setup.title')}
        subtitle={t('setup.subtitle')}
        actions={
          mistakeCount > 0 && (
            <Button variant="secondary" onClick={() => navigate('/quiz/play', { state: { mode: 'revise', filter: { subjectIds: filter.subjectIds } } })}>
              {t('setup.reviseMistakes', { count: mistakeCount })}
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('setup.questions')}</p>
              <div className="flex flex-wrap gap-2">
                {COUNTS.map((n) => (
                  <Chip key={n} active={count === n} onClick={() => setCount(n)}>
                    {n}
                  </Chip>
                ))}
                <Chip active={count === 0} onClick={() => setCount(0)}>
                  {t('setup.all')}
                </Chip>
              </div>
            </div>
            <Toggle checked={prioritize} onChange={setPrioritize} label={t('setup.prioritize')} hint={t('setup.prioritizeHint')} />
            <Toggle
              checked={exam}
              onChange={setExam}
              label={t('setup.exam')}
              hint={t('setup.examHint')}
            />
            {exam && (
              <label className="block text-sm">
                <span className="font-medium">{t('setup.timeLimit')}</span>
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
              <span className="text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-100">{effective}</span> {t('setup.match', { count: effective })} · {t('setup.available', { count: available })}
            </p>
            <Button className="mt-4 w-full" disabled={!available} onClick={start}>
              {exam ? t('setup.startExam') : t('setup.start')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
