import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Explanation, QuestionMeta } from '../components/QuestionCard'
import RichText from '../components/RichText'
import { Button, Card, Chip, EmptyState, PageHeader } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress } from '../hooks/useProgress'
import { arrangeChoices } from '../lib/quiz'
import { formatDay } from '../lib/date'
import { STREAK_TO_MASTER } from '../lib/mistakes'
import { questionById, subjects } from '../lib/content'

function MistakeCard({ question, entry }) {
  const [open, setOpen] = useState(false)
  const arranged = arrangeChoices(question, false)
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <QuestionMeta question={question} />
        <span className="text-xs text-slate-500 dark:text-slate-400" title="Correct answers in a row, on different days">
          {entry.streak}/{STREAK_TO_MASTER} ✓ · missed {entry.timesWrong}× · last {formatDay(entry.lastWrongAt)}
        </span>
      </div>
      <p className="mt-3 font-medium">
        <RichText text={question.question} />
      </p>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg bg-rose-50 p-2.5 dark:bg-rose-950/40">
          <span className="font-semibold text-rose-700 dark:text-rose-300">You answered: </span>
          <RichText text={question.choices[entry.wrongAnswer]} />
        </p>
        <p className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/40">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">Correct: </span>
          <RichText text={question.choices[question.answer]} />
        </p>
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="mt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
        {open ? 'Hide explanation' : 'Show explanation'}
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
        title="Mistake bank"
        subtitle={`A question leaves the bank after ${STREAK_TO_MASTER} correct answers in a row, on different days. Miss it again and it starts over.`}
        actions={
          entries.length > 0 && (
            <Button onClick={() => navigate('/quiz/play', { state: { mode: 'revise', filter: filter || {} } })}>
              Revise {entries.length} mistake{entries.length === 1 ? '' : 's'}
            </Button>
          )
        }
      />

      {subjects.length > 1 && total > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <Chip active={!subjectId} onClick={() => setSubjectId(null)}>
            All ({total})
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
        <EmptyState title="No mistakes in the bank" action={<Button to="/quiz">Take a quiz</Button>}>
          Every question you get wrong lands here automatically, with the right answer and its explanation.
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
