import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Explanation, QuestionMeta } from '../components/QuestionCard'
import RichText from '../components/RichText'
import { Button, Card, Chip, EmptyState, PageHeader } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
import { arrangeChoices } from '../lib/quiz'
import { formatDay } from '../lib/date'
import { STREAK_TO_MASTER } from '../lib/mistakes'
import { questionById, subjects } from '../lib/content'

function MistakeCard({ question, entry }) {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const arranged = arrangeChoices(question, false)
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <QuestionMeta question={question} />
        <span className="text-xs text-slate-500 dark:text-slate-400" title={t('mistakes.streakTitle')}>
          {t('mistakes.meta', { streak: entry.streak, need: STREAK_TO_MASTER, times: entry.timesWrong, date: formatDay(entry.lastWrongAt, locale) })}
        </span>
      </div>
      <p className="mt-3 font-medium">
        <RichText text={question.question} />
      </p>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg bg-rose-50 p-2.5 dark:bg-rose-950/40">
          <span className="font-semibold text-rose-700 dark:text-rose-300">{t('mistakes.youAnswered')}</span>
          <RichText text={question.choices[entry.wrongAnswer]} />
        </p>
        <p className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/40">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">{t('mistakes.correct')}</span>
          <RichText text={question.choices[question.answer]} />
        </p>
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="mt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
        {open ? t('results.hide') : t('results.show')}
      </button>
      {open && (
        <div className="mt-3">
          <Explanation question={question} arranged={arranged} chosen={null} />
        </div>
      )}
    </Card>
  )
}

export default function Mistakes() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { t } = useI18n()
  const [subjectId, setSubjectId] = useState(null)
  const filter = useMemo(() => (subjectId ? { subjectIds: [subjectId] } : undefined), [subjectId])
  const { entries } = useMistakes(filter)
  const { count: total } = useMistakes()

  const perSubject = useMemo(() => {
    const out = {}
    for (const id of Object.keys(progress.mistakes)) {
      const sid = questionById[id]?.subjectId
      if (sid) out[sid] = (out[sid] || 0) + 1
    }
    return out
  }, [progress.mistakes])

  return (
    <div>
      <PageHeader
        title={t('mistakes.title')}
        subtitle={t('mistakes.subtitle', { n: STREAK_TO_MASTER })}
        actions={
          entries.length > 0 && (
            <Button onClick={() => navigate('/quiz/play', { state: { mode: 'revise', filter: filter || {} } })}>
              {t('mistakes.revise', { count: entries.length })}
            </Button>
          )
        }
      />

      {subjects.length > 1 && total > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <Chip active={!subjectId} onClick={() => setSubjectId(null)}>
            {t('mistakes.all', { count: total })}
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

      {entries.length === 0 ? (
        <EmptyState title={t('mistakes.empty')} action={<Button to="/quiz">{t('mistakes.takeQuiz')}</Button>}>
          {t('mistakes.emptyHint')}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {entries.map((m) => (
            <MistakeCard key={m.id} question={m.question} entry={m.entry} />
          ))}
        </div>
      )}
    </div>
  )
}
