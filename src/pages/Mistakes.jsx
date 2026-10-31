import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import Icon from '../components/Icon'
import { Explanation } from '../components/QuestionCard'
import RichText, { CodeBlock } from '../components/RichText'
import { Badge, Button, Card, Chip, cx, EmptyState, PageHeader, Stat } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
import { chapterOf, questionById, subjectById, subjects } from '../lib/content'
import { formatDay } from '../lib/date'
import { STREAK_TO_MASTER } from '../lib/mistakes'
import { arrangeChoices } from '../lib/quiz'

// Filled dots = correct answers already given (on different days) towards leaving the bank.
function StreakDots({ streak, title }) {
  return (
    <span className="flex items-center gap-1" title={title} aria-label={`${streak}/${STREAK_TO_MASTER}`}>
      {Array.from({ length: STREAK_TO_MASTER }, (_, i) => (
        <span key={i} className={cx('h-2.5 w-2.5 rounded-full', i < streak ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700')} />
      ))}
    </span>
  )
}

function MistakeRow({ question, entry }) {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const arranged = arrangeChoices(question, false)
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:px-5 dark:hover:bg-slate-800/50"
      >
        <span className="min-w-0 flex-1">
          <span className={cx('block text-sm font-medium leading-relaxed', !open && 'line-clamp-2')}>
            <RichText text={question.question} />
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <Badge tone={question.difficulty}>{t(`difficulty.${question.difficulty}`)}</Badge>
            {question.tier === 'bonus' && <Badge tone="bonus">{t('tier.bonus')}</Badge>}
            <span>{t('mistakes.missed', { times: entry.timesWrong })}</span>
            <span>{t('mistakes.last', { date: formatDay(entry.lastWrongAt, locale) })}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3 pt-0.5">
          <StreakDots streak={entry.streak} title={t('mistakes.streakTitle')} />
          <Icon name="arrow" className={cx('h-4 w-4 text-slate-400 transition', open ? '-rotate-90' : 'rotate-90')} />
        </span>
      </button>
      {open && (
        <div className="animate-fade-up space-y-3 px-4 pb-4 sm:px-5">
          <CodeBlock code={question.code} />
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="rounded-lg bg-rose-50 p-2.5 dark:bg-rose-950/40">
              <span className="font-semibold text-rose-700 dark:text-rose-300">{t('mistakes.youAnswered')}</span>
              <RichText text={question.choices[entry.wrongAnswer]} />
            </p>
            <p className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/40">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">{t('mistakes.correct')}</span>
              <RichText text={question.choices[question.answer]} />
            </p>
          </div>
          <Explanation question={question} arranged={arranged} chosen={null} />
        </div>
      )}
    </li>
  )
}

export default function Mistakes() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { t } = useI18n()
  const [subjectId, setSubjectId] = useState(null)
  const filter = useMemo(() => (subjectId ? { subjectIds: [subjectId] } : undefined), [subjectId])
  const { entries } = useMistakes(filter)
  const { entries: all } = useMistakes()

  const perSubject = useMemo(() => {
    const out = {}
    for (const id of Object.keys(progress.mistakes)) {
      const sid = questionById[id]?.subjectId
      if (sid) out[sid] = (out[sid] || 0) + 1
    }
    return out
  }, [progress.mistakes])

  // Group by chapter, biggest groups first; inside, most-missed first.
  const groups = useMemo(() => {
    const map = new Map()
    for (const m of entries) {
      const key = `${m.question.subjectId}/${m.question.chapterKey}`
      if (!map.has(key)) map.set(key, { key, subject: subjectById[m.question.subjectId], chapter: chapterOf(m.question), items: [] })
      map.get(key).items.push(m)
    }
    for (const g of map.values()) g.items.sort((a, b) => b.entry.timesWrong - a.entry.timesWrong)
    return [...map.values()].sort((a, b) => b.items.length - a.items.length)
  }, [entries])

  const halfway = entries.filter((m) => m.entry.streak > 0).length
  const repeat = entries.filter((m) => m.entry.timesWrong > 1).length
  const revise = (f) => navigate('/quiz/play', { state: { mode: 'revise', filter: f } })

  return (
    <div>
      <PageHeader
        icon="🧩"
        title={t('mistakes.title')}
        subtitle={t('mistakes.subtitle', { n: STREAK_TO_MASTER })}
        actions={
          entries.length > 0 && (
            <Button onClick={() => revise(filter || {})}>
              {t('mistakes.revise', { count: entries.length })} <Icon name="arrow" className="h-4 w-4" />
            </Button>
          )
        }
      />

      {all.length === 0 ? (
        <EmptyState title={t('mistakes.empty')} action={<Button to="/quiz">{t('mistakes.takeQuiz')}</Button>}>
          {t('mistakes.emptyHint')}
        </EmptyState>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat icon="🧩" tone="rose" label={t('mistakes.statTotal')} value={entries.length} />
            <Stat icon="🌗" tone="emerald" label={t('mistakes.statHalf')} value={halfway} hint={t('mistakes.statHalfHint')} />
            <Stat icon="🔁" tone="amber" label={t('mistakes.statRepeat')} value={repeat} hint={t('mistakes.statRepeatHint')} />
          </div>

          {subjects.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <Chip active={!subjectId} onClick={() => setSubjectId(null)}>
                {t('mistakes.all', { count: all.length })}
              </Chip>
              {subjects
                .filter((s) => perSubject[s.id])
                .map((s) => (
                  <Chip key={s.id} color={s.color} active={subjectId === s.id} onClick={() => setSubjectId(s.id)}>
                    {s.icon} {s.name} ({perSubject[s.id]})
                  </Chip>
                ))}
            </div>
          )}

          <div className="space-y-5">
            {groups.map((g) => (
              <Card key={g.key} className="overflow-hidden p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 dark:border-slate-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: g.subject.color }} aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {g.subject.icon} {g.subject.name}
                      </p>
                      <h3 className="truncate font-bold">
                        {g.chapter?.title} <span className="font-normal text-slate-400">({g.items.length})</span>
                      </h3>
                    </div>
                  </div>
                  <Button variant="secondary" className="py-1.5" onClick={() => revise({ chapterKeys: [g.key] })}>
                    {t('mistakes.reviseChapter')}
                  </Button>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {g.items.map((m) => (
                    <MistakeRow key={m.id} question={m.question} entry={m.entry} />
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
