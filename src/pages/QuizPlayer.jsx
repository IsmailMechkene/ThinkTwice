import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import Icon from '../components/Icon'
import QuestionCard, { Explanation } from '../components/QuestionCard'
import { Button, EmptyState, ProgressBar } from '../components/ui'
import { useProgress } from '../hooks/useProgress'
import { LETTERS, matchesFilter, questionById } from '../lib/content'
import { arrangeChoices } from '../lib/quiz'
import { shuffle } from '../lib/random'
import { summarize } from '../lib/scoring'

const EVENT_TEXT = {
  added: 'Saved to your mistake bank.',
  reset: 'Missed again — back to 0/2 in your mistake bank.',
  progress: 'Mistake bank: 1/2. Get it right again on another day to clear it.',
  'same-day': 'Already counted today. Come back another day to clear it.',
  mastered: 'Cleared from your mistake bank! 🎉',
}

export const RESULT_KEY = 'thinktwice:lastResult'

// Builds the fixed list of questions for this session (frozen at mount).
function useSession(state, progress) {
  return useState(() => {
    if (!state) return null
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
    return { mode: state.mode, items, deadline: state.examMinutes ? Date.now() + state.examMinutes * 60_000 : null, startedAt: Date.now() }
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
  const { progress, answerQuestion, recordSession } = useProgress()
  const session = useSession(state, progress)

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([]) // { qid, chosen, correct, order }
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
      // Unanswered questions (timer ran out) count as wrong in the score but are not added to the mistake bank.
      const all = session.items.map(
        (it, i) => finalAnswers[i] || { qid: it.question.id, chosen: null, correct: false, order: it.arranged.map((c) => c.orig) },
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
        sessionStorage.setItem(RESULT_KEY, JSON.stringify(result))
      } catch {
        /* ignore */
      }
      navigate('/results', { replace: true, state: { result } })
    },
    [session, recordSession, navigate],
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

  const next = useCallback(() => {
    if (!answered) return
    if (index + 1 >= session.items.length) finish(answers)
    else {
      setIndex(index + 1)
      setEvent(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [answered, index, session, finish, answers])

  // Exam countdown.
  useEffect(() => {
    if (!session?.deadline) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [session])
  useEffect(() => {
    if (session?.deadline && now >= session.deadline) finish(answers)
  }, [now, session, finish, answers])

  // Keyboard: A-D or 1-4 to answer, Enter / → for next.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toUpperCase()
      const pos = LETTERS.indexOf(k) >= 0 ? LETTERS.indexOf(k) : ['1', '2', '3', '4'].indexOf(k)
      if (pos >= 0 && current && !answered) choose(current.arranged[pos].orig)
      else if ((e.key === 'Enter' || e.key === 'ArrowRight') && answered) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, answered, choose, next])

  const score = useMemo(() => answers.filter((a) => a?.correct).length, [answers])

  if (!state) return <Navigate to="/quiz" replace />
  if (!session.items.length) {
    return (
      <EmptyState
        title={session.mode === 'revise' ? 'No mistakes to revise 🎉' : 'No questions to play'}
        action={<Button to="/quiz">Set up a quiz</Button>}
      >
        {session.mode === 'revise' ? 'Your mistake bank is empty for this selection.' : 'Try widening your filters.'}
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
        <ProgressBar value={index + (answered ? 1 : 0)} max={session.items.length} label="Quiz progress" />
        {session.mode === 'revise' && <span className="shrink-0 text-xs font-semibold text-rose-600 dark:text-rose-400">Revision</span>}
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
          onClick={() => confirm('Stop this quiz? Answers so far are kept in your stats.') && finish(answers)}
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Stop
        </button>
      </div>

      <QuestionCard
        key={index}
        question={current.question}
        arranged={current.arranged}
        chosen={answered?.chosen ?? null}
        reveal={!!answered && !exam}
        onChoose={choose}
      />

      {answered && !exam && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <Explanation question={current.question} arranged={current.arranged} chosen={answered.chosen} />
          {event && EVENT_TEXT[event] && <p className="text-center text-sm text-slate-600 dark:text-slate-400">{EVENT_TEXT[event]}</p>}
        </div>
      )}

      <div className="sticky bottom-20 mt-5 flex justify-end sm:static">
        <Button onClick={next} disabled={!answered} className="shadow-lg">
          {isLast ? 'See results' : 'Next'} <Icon name="arrow" className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block">Keys: A–D or 1–4 to answer · Enter for next</p>
    </div>
  )
}
