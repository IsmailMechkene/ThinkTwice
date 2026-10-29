import { useParams } from 'react-router'
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, ProgressRing } from '../components/ui'
import { useProgress, useSubjectStats } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
import { questionById, subjectById } from '../lib/content'
import { masteryOf, percent } from '../lib/scoring'

export default function Subject() {
  const { subjectId } = useParams()
  const subject = subjectById[subjectId]
  const { progress } = useProgress()
  const stats = useSubjectStats()[subjectId]
  const { t } = useI18n()

  if (!subject) {
    return <EmptyState title={t('subject.notFound')} action={<Button to="/">{t('common.backHome')}</Button>} />
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
            <Button to={quizLink()}>{t('subject.quizThis')}</Button>
            <Button to={quizLink(null, '&core=1&count=15')} variant="secondary">
              {t('subject.lastMinute')}
            </Button>
            <Button to={`/flashcards?subject=${encodeURIComponent(subject.id)}`} variant="secondary">
              {t('subject.flashcards')}
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
        <span>{t('subject.questions', { count: subject.questionCount })}</span>
        <span>{t('subject.flashcardsCount', { count: subject.flashcardCount })}</span>
        <span>{t('subject.language', { lang: subject.language?.toUpperCase() })}</span>
        {subject.contributors?.length > 0 && <span>{t('subject.contributors', { list: subject.contributors.join(', ') })}</span>}
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
            <Card key={c.key} className="flex flex-col gap-4 transition hover:shadow-md sm:flex-row sm:items-center">
              <ProgressRing
                value={masteryOf(c.questionIds, progress)}
                color={subject.color}
                size={60}
                label={`${t('subject.mastery')} ${masteryOf(c.questionIds, progress)}%`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500">{t('subject.chapter', { n: c.order ?? i + 1 })}</p>
                <h3 className="font-semibold">{c.title}</h3>
                {c.description && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{c.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{t('subject.chapterCounts', { q: c.questionIds.length, core, cards: c.flashcardIds.length })}</span>
                  {attempts > 0 && <Badge>{t('subject.accuracyBadge', { pct: percent(correct, attempts) })}</Badge>}
                  {mistakes > 0 && <Badge tone="hard">{t('subject.toReviseBadge', { count: mistakes })}</Badge>}
                </div>
                <ProgressBar className="mt-2 max-w-sm" value={done} max={c.questionIds.length} color={subject.color} label={t('subject.chapterCounts', { q: c.questionIds.length, core, cards: c.flashcardIds.length })} />
              </div>
              <div className="flex gap-2">
                <Button to={quizLink(c.key)} className="flex-1 sm:flex-none">
                  {t('subject.quiz')}
                </Button>
                <Button
                  to={`/flashcards?subject=${encodeURIComponent(subject.id)}&chapter=${encodeURIComponent(c.key)}`}
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                >
                  {t('subject.cards')}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mt-6 text-xs text-slate-500">{t('subject.overall', { done: stats.done, total: stats.total })}</p>
    </div>
  )
}
