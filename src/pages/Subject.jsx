import { useParams } from 'react-router'
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar } from '../components/ui'
import { useProgress, useSubjectStats } from '../hooks/useProgress'
import { questionById, subjectById } from '../lib/content'
import { percent } from '../lib/scoring'

export default function Subject() {
  const { subjectId } = useParams()
  const subject = subjectById[subjectId]
  const { progress } = useProgress()
  const stats = useSubjectStats()[subjectId]

  if (!subject) {
    return <EmptyState title="Subject not found" action={<Button to="/">Back home</Button>} />
  }

  const quizLink = (chapterKey, extra = '') =>
    `/quiz?subject=${encodeURIComponent(subject.id)}${chapterKey ? `&chapter=${encodeURIComponent(chapterKey)}` : ''}${extra}`

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span aria-hidden>{subject.icon}</span> {subject.name}
          </span>
        }
        subtitle={subject.description}
        actions={
          <>
            <Button to={quizLink()}>Quiz this subject</Button>
            <Button to={quizLink(null, '&core=1&count=15')} variant="secondary">
              Last-minute (core only)
            </Button>
            <Button to={`/flashcards?subject=${encodeURIComponent(subject.id)}`} variant="secondary">
              Flashcards
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
        <span>{subject.questionCount} questions</span>
        <span>{subject.flashcardCount} flashcards</span>
        <span>Language: {subject.language?.toUpperCase()}</span>
        {subject.contributors?.length > 0 && <span>Contributors: {subject.contributors.join(', ')}</span>}
      </div>

      <div className="space-y-3">
        {subject.chapters.map((c, i) => {
          let done = 0
          let attempts = 0
          let correct = 0
          let mistakes = 0
          let core = 0
          for (const id of c.questionIds) {
            const s = progress.questions[id]
            if (s?.attempts) {
              done++
              attempts += s.attempts
              correct += s.correct
            }
            if (progress.mistakes[id]) mistakes++
            if (questionById[id]?.tier === 'core') core++
          }
          return (
            <Card key={c.key} className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500">Chapter {c.order ?? i + 1}</p>
                <h3 className="font-semibold">{c.title}</h3>
                {c.description && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{c.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {c.questionIds.length} questions ({core} core) · {c.flashcardIds.length} cards
                  </span>
                  {attempts > 0 && <Badge>{percent(correct, attempts)}% accuracy</Badge>}
                  {mistakes > 0 && <Badge tone="hard">{mistakes} to revise</Badge>}
                </div>
                <ProgressBar className="mt-2 max-w-sm" value={done} max={c.questionIds.length} color={subject.color} label={`${c.title} progress`} />
              </div>
              <div className="flex gap-2">
                <Button to={quizLink(c.key)} className="flex-1 sm:flex-none">
                  Quiz
                </Button>
                <Button
                  to={`/flashcards?subject=${encodeURIComponent(subject.id)}&chapter=${encodeURIComponent(c.key)}`}
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                >
                  Cards
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mt-6 text-xs text-slate-500">Overall: {stats.done}/{stats.total} questions seen.</p>
    </div>
  )
}
