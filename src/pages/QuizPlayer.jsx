import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import Icon from '../components/Icon'
import QuestionCard, { Explanation } from '../components/QuestionCard'
import QuestionGrid from '../components/QuestionGrid'
import { Button, Card, EmptyState, ProgressBar } from '../components/ui'
import { useProgress } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
import { LETTERS, matchesFilter, questionById } from '../lib/content'
import { arrangeChoices } from '../lib/quiz'
import { shuffle } from '../lib/random'
import { clearActiveQuiz, loadActiveQuiz, saveActiveQuiz } from '../lib/activeQuiz'
import { summarize } from '../lib/scoring'

export const RESULT_KEY = 'thinktwice:lastResult'

// Builds the fixed list of questions for this session (frozen at mount).
// Without navigation state (reload, "Resume" button), the saved quiz in progress is restored.
function useSession(state, progress, profileId) {
  return useState(() => {
    if (!state) return loadActiveQuiz(profileId)
    clearActiveQuiz(profileId)
    let ids = state.questionIds
    if (state.mode === 'revise') {
      ids = shuffle(
        Object.keys(progress.mistakes).filter((id) => questionById[id] && matchesFilter(questionById[id], state.filter || {})),
      )
    }
    const items = (ids || [])
      .map((id) => questionById[id])
      .filter(Boolean)
      .map((q) => ({ question: q, arranged: arrangeChoices(q, state.mode === 'revise') }))
    return {
      session: { mode: state.mode, items, deadline: state.examMinutes ? Date.now() + state.examMinutes * 60_000 : null, startedAt: Date.now() },
      index: 0,
      answers: [],
      visited: [],
    }
  })[0]
}

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Each navigation to /quiz/play starts a fresh session, even from /quiz/play itself.
export default function QuizPlayerPage() {
  const location = useLocation()
  return <QuizPlayer key={location.key} />
}

function QuizPlayer() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { progress, answerQuestion, recordSession, currentProfile } = useProgress()
  const { t } = useI18n()
  const profileId = currentProfile.id
  const restored = useSession(state, progress, profileId)
  const session = restored?.session

  const [index, setIndex] = useState(restored?.index ?? 0)
  const [answers, setAnswers] = useState(restored?.answers ?? []) // { qid, chosen, correct, order }
  const [visited, setVisited] = useState(restored?.visited ?? []) // questions already shown (unanswered + left = skipped)
  const [showGrid, setShowGrid] = useState(true)
  const [event, setEvent] = useState(null)
  const [now, setNow] = useState(Date.now())
  const finishedRef = useRef(false)

  const exam = session?.mode === 'exam'
  const current = session?.items[index]
  const answered = answers[index]

  const finish = useCallback(
    (finalAnswers) => {
      if (finishedRef.current) return
      finishedRef.current = true
      clearActiveQuiz(profileId)
      // Unanswered questions (skipped, or timer ran out) count as wrong in the score but are not added to the mistake bank.
      const all = session.items.map(
        (it, i) => finalAnswers[i] || { qid: it.question.id, chosen: null, correct: false, skipped: true, order: it.arranged.map((c) => c.orig) },
      )
      const summary = summarize(all.map((a) => ({ ...a, question: questionById[a.qid] })))
      const result = { mode: session.mode, answers: all, durationSec: Math.round((Date.now() - session.startedAt) / 1000) }
      recordSession({
        mode: session.mode,
        total: summary.total,
        correct: summary.correct,
        subjects: [...new Set(session.items.map((it) => it.question.subjectId))],
      })
      try {
        localStorage.setItem(RESULT_KEY, JSON.stringify(result))
      } catch {
        /* ignore */
      }
      navigate('/results', { replace: true, state: { result } })
    },
    [session, recordSession, navigate, profileId],
  )

  const choose = useCallback(
    (orig) => {
      if (!current || answered) return
      const correct = orig === current.question.answer
      const ev = answerQuestion(current.question, orig, correct)
      setEvent(exam ? null : ev)
      setAnswers((prev) => {
        const next = [...prev]
        next[index] = { qid: current.question.id, chosen: orig, correct, order: current.arranged.map((c) => c.orig) }
        return next
      })
    },
    [current, answered, answerQuestion, exam, index],
  )

  const goTo = useCallback(
    (i) => {
      if (i < 0 || i >= session.items.length || i === index) return
      setIndex(i)
      setEvent(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [index, session],
  )

  const unansweredCount = session ? session.items.length - answers.filter(Boolean).length : 0

  const requestFinish = useCallback(() => {
    if (unansweredCount > 0 && !confirm(t('player.confirmFinish', { count: unansweredCount }))) return
    finish(answers)
  }, [unansweredCount, finish, answers, t])

  // Next = skip when the question has no answer. On the last question it finishes.
  const next = useCallback(() => {
    if (index + 1 >= session.items.length) requestFinish()
    else goTo(index + 1)
  }, [index, session, requestFinish, goTo])

  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  // Remember every question shown, to tell "skipped" from "not seen yet".
  useEffect(() => {
    setVisited((v) => {
      if (v[index]) return v
      const nextV = [...v]
      nextV[index] = true
      return nextV
    })
  }, [index])

  // Exam countdown.
  useEffect(() => {
    if (!session?.deadline) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [session])
  useEffect(() => {
    if (session?.deadline && now >= session.deadline) finish(answers)
  }, [now, session, finish, answers])

  // Keyboard: A-D or 1-4 to answer, → (or Enter once answered) for next, ← for previous.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toUpperCase()
      const pos = LETTERS.indexOf(k) >= 0 ? LETTERS.indexOf(k) : ['1', '2', '3', '4'].indexOf(k)
      if (pos >= 0 && current && !answered) choose(current.arranged[pos].orig)
      else if (e.key === 'ArrowRight' || (e.key === 'Enter' && answered)) {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, answered, choose, next, prev])

  const score = useMemo(() => answers.filter((a) => a?.correct).length, [answers])

  // Save the quiz in progress after every answer / question change.
  useEffect(() => {
    if (session?.items.length && !finishedRef.current) saveActiveQuiz(profileId, session, index, answers, visited)
  }, [session, index, answers, visited, profileId])

  if (!session) return <Navigate to="/quiz" replace />
  if (!session.items.length) {
    return (
      <EmptyState
        title={session.mode === 'revise' ? t('player.noMistakes') : t('player.noQuestions')}
        action={<Button to="/quiz">{t('player.setup')}</Button>}
      >
        {session.mode === 'revise' ? t('player.noMistakesHint') : t('player.widen')}
      </EmptyState>
    )
  }

  const remaining = session.deadline ? session.deadline - now : null
  const isLast = index + 1 === session.items.length

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-semibold tabular-nums">
          {index + 1}/{session.items.length}
        </span>
        <ProgressBar value={session.items.length - unansweredCount} max={session.items.length} label={t('player.progress')} />
        {session.mode === 'revise' && <span className="shrink-0 text-xs font-semibold text-rose-600 dark:text-rose-400">{t('player.revision')}</span>}
        {remaining != null ? (
          <span
            className={`flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums ${remaining < 60_000 ? 'text-rose-600' : ''}`}
            aria-live="off"
          >
            <Icon name="timer" className="h-4 w-4" /> {formatTime(remaining)}
          </span>
        ) : (
          <span className="shrink-0 text-sm text-slate-500 tabular-nums">{score} ✓</span>
        )}
        <button
          type="button"
          onClick={() => confirm(t('player.confirmStop')) && finish(answers)}
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {t('player.stop')}
        </button>
      </div>

      <Card className="mb-5 p-4">
        <button
          type="button"
          onClick={() => setShowGrid((g) => !g)}
          aria-expanded={showGrid}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          <span>
            {t('grid.title')}{' '}
            <span className="font-normal text-slate-500 dark:text-slate-400">
              · {t('grid.answeredOf', { done: session.items.length - unansweredCount, total: session.items.length })}
            </span>
          </span>
          <Icon name="arrow" className={`h-4 w-4 text-slate-400 transition ${showGrid ? '-rotate-90' : 'rotate-90'}`} />
        </button>
        {showGrid && (
          <div className="mt-3">
            <QuestionGrid total={session.items.length} answers={answers} visited={visited} index={index} exam={exam} onJump={goTo} />
          </div>
        )}
      </Card>

      <div key={index} className="animate-fade-up">
        <QuestionCard
          question={current.question}
          arranged={current.arranged}
          chosen={answered?.chosen ?? null}
          reveal={!!answered && !exam}
          onChoose={choose}
        />
      </div>

      {answered && exam && <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">{t('player.locked')}</p>}

      {answered && !exam && (
        <div className="animate-pop mt-4 space-y-3" aria-live="polite">
          <Explanation question={current.question} arranged={current.arranged} chosen={answered.chosen} />
          {event && (
            <p
              className={`mx-auto w-fit rounded-full px-3 py-1.5 text-center text-sm font-medium ${
                event === 'mastered' || event === 'progress'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : event === 'same-day'
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {t(`event.${event}`)}
            </p>
          )}
        </div>
      )}

      <div className="sticky bottom-20 mt-5 flex items-center justify-between gap-2 md:static">
        <Button variant="secondary" onClick={prev} disabled={index === 0} className="shadow-lg md:shadow-none">
          <Icon name="arrow" className="h-4 w-4 rotate-180" /> {t('player.prev')}
        </Button>
        <Button onClick={next} variant={answered || isLast ? 'primary' : 'secondary'} className="shadow-lg">
          {isLast ? t('player.seeResults') : answered ? t('player.next') : t('player.skip')} <Icon name="arrow" className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block">{t('player.keys')}</p>
    </div>
  )
}
