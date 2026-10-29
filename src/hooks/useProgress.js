import { useContext, useMemo } from 'react'
import { ProgressContext } from '../context/ProgressContext'
import { subjects } from '../lib/content'
import { masteryOf, percent } from '../lib/scoring'

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}

// Per-subject progress: distinct questions done, accuracy, mistakes in the bank.
export function useSubjectStats() {
  const { progress } = useProgress()
  return useMemo(() => {
    const out = {}
    for (const s of subjects) {
      let done = 0
      let attempts = 0
      let correct = 0
      let mistakes = 0
      for (const c of s.chapters) {
        for (const id of c.questionIds) {
          const st = progress.questions[id]
          if (st?.attempts) {
            done++
            attempts += st.attempts
            correct += st.correct
          }
          if (progress.mistakes[id]) mistakes++
        }
      }
      const ids = s.chapters.flatMap((c) => c.questionIds)
      out[s.id] = {
        done,
        total: s.questionCount,
        attempts,
        accuracy: percent(correct, attempts),
        mistakes,
        mastery: masteryOf(ids, progress),
      }
    }
    return out
  }, [progress])
}
