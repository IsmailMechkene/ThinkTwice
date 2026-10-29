import { useMemo } from 'react'
import { matchesFilter, questionById } from '../lib/content'
import { useProgress } from './useProgress'

// Mistake-bank entries joined with their question. Entries whose question was
// removed from the content are ignored (but kept in storage, in case it comes back).
export function useMistakes(filter) {
  const { progress } = useProgress()
  return useMemo(() => {
    const entries = Object.entries(progress.mistakes)
      .map(([id, entry]) => ({ id, entry, question: questionById[id] }))
      .filter((m) => m.question && (!filter || matchesFilter(m.question, filter)))
      .sort((a, b) => b.entry.lastWrongAt.localeCompare(a.entry.lastWrongAt))
    return { entries, count: entries.length }
  }, [progress.mistakes, filter])
}
