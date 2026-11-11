import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import FilterPanel, { EMPTY_FILTER } from '../components/FilterPanel'
import Icon from '../components/Icon'
import ResumeBanner from '../components/ResumeBanner'
import { Button, Card, Chip, PageHeader, SectionTitle, StepTitle, Toggle } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
import { matchesFilter, questions, subjectById } from '../lib/content'
import { pickQuestions } from '../lib/quiz'

const COUNTS = [5, 10, 20, 40]
// Rough pace used for the time estimate.
const MINUTES_PER_QUESTION = 1.25

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

const PRESET_TONES = {
  '01': { edge: 'var(--accent)', ink: 'text-accent-700 dark:text-accent-300' },
  '02': { edge: '#f59e0b', ink: 'text-amber-700 dark:text-amber-300' },
  '03': { edge: '#14b8a6', ink: 'text-teal-700 dark:text-teal-300' },
  '04': { edge: '#f43f5e', ink: 'text-rose-700 dark:text-rose-300' },
}

function Preset({ n, title, desc, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex flex-col rounded-md border border-l-[3px] border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600 ${PRESET_TONES[n].ink}`}
      style={{ borderLeftColor: PRESET_TONES[n].edge }}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium">{n}</span>
        <Icon name="arrow" className="h-4 w-4 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-neutral-100" />
      </span>
      <span className="mt-3 font-display text-xl leading-tight text-neutral-900 dark:text-neutral-100">{title}</span>
      <span className="mt-1 block text-sm text-neutral-500 dark:text-neutral-400">{desc}</span>
    </button>
  )
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
  const scope = useMemo(() => (filter.subjectIds.length ? { subjectIds: filter.subjectIds } : undefined), [filter.subjectIds])
  const { count: mistakeCount } = useMistakes(scope)

  const available = useMemo(() => questions.filter((q) => matchesFilter(q, filter)).length, [filter])
  const effective = count === 0 ? available : Math.min(count, available)
  const estimate = Math.max(1, Math.round(effective * MINUTES_PER_QUESTION))

  function launch(f, { n, examMinutes = null, weak = prioritize } = {}) {
    const picked = pickQuestions(f, { count: n || undefined, prioritize: weak, stats: progress.questions })
    navigate('/quiz/play', { state: { mode: examMinutes ? 'exam' : 'quiz', questionIds: picked.map((q) => q.id), examMinutes } })
  }

  // Presets keep the subject selection, nothing else.
  const scoped = { ...EMPTY_FILTER, subjectIds: filter.subjectIds }

  return (
    <div>
      <PageHeader title={t('setup.title')} subtitle={t('setup.subtitle')} />
      <ResumeBanner />

      <h2 className="mb-3 text-xl font-medium">{t('setup.presets')}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Preset n="01" title={t('preset.quick')} desc={t('preset.quickDesc')} onClick={() => launch(scoped, { n: 10, weak: true })} />
        <Preset
          n="02"
          title={t('preset.lastMinute')}
          desc={t('preset.lastMinuteDesc')}
          onClick={() => launch({ ...scoped, coreOnly: true }, { n: 15, weak: true })}
        />
        <Preset
          n="03"
          title={t('preset.exam')}
          desc={t('preset.examDesc')}
          onClick={() => launch(scoped, { n: 20, examMinutes: 25, weak: false })}
        />
        <Preset
          n="04"
          title={t('preset.mistakes')}
          desc={mistakeCount ? t('setup.reviseMistakes', { count: mistakeCount }) : t('player.noMistakesHint')}
          disabled={!mistakeCount}
          onClick={() => navigate('/quiz/play', { state: { mode: 'revise', filter: scope || {} } })}
        />
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{t('setup.presetsHint')}</p>

      <SectionTitle hint={t('setup.customHint')}>{t('setup.custom')}</SectionTitle>
      <div className="mt-5 grid gap-x-6 gap-y-8 lg:grid-cols-[1fr_340px]">
        <div>
          <StepTitle n={1}>{t('step.what')}</StepTitle>
          <Card className="p-5 sm:p-6">
            <FilterPanel value={filter} onChange={setFilter} items={questions} showDifficulty />
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <StepTitle n={2}>{t('step.how')}</StepTitle>
          <Card className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('setup.questions')}</p>
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
            <Toggle checked={exam} onChange={setExam} label={t('setup.exam')} hint={t('setup.examHint')} />
            {exam && (
              <label className="block text-sm">
                <span className="font-medium">{t('setup.timeLimit')}</span>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 dark:border-neutral-700"
                />
              </label>
            )}

            <div className="rounded-md bg-neutral-50 p-4 dark:bg-neutral-800/60">
              <p className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{effective}</span>
                <span className="text-neutral-600 dark:text-neutral-300">{t('setup.match', { count: effective })}</span>
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-neutral-500 dark:text-neutral-400">
                <span>{t('setup.available', { count: available })}</span>
                <span className="flex items-center gap-1">
                  <Icon name="timer" className="h-3.5 w-3.5" />
                  {t('setup.estimate', { min: exam ? minutes : estimate })}
                </span>
              </p>
            </div>
            <Button className="w-full py-3" disabled={!available} onClick={() => launch(filter, { n: count, examMinutes: exam ? minutes : null })}>
              {exam ? t('setup.startExam') : t('setup.start')} <Icon name="arrow" className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
