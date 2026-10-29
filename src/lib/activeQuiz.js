// The quiz in progress is saved after every answer, per profile, so closing or
// reloading the tab never loses it. Only ids and choice orders are stored.
import { LETTERS, questionById } from './content'
import { load, remove, save } from './storage'

const key = (profileId) => `activeQuiz:${profileId}`

export function saveActiveQuiz(profileId, session, index, answers, visited = []) {
  save(key(profileId), {
    mode: session.mode,
    items: session.items.map((it) => ({ qid: it.question.id, order: it.arranged.map((c) => c.orig) })),
    deadline: session.deadline,
    startedAt: session.startedAt,
    index,
    answers,
    visited,
  })
}

export function clearActiveQuiz(profileId) {
  remove(key(profileId))
}

// Rebuilds a playable session; questions removed from the content are dropped.
export function loadActiveQuiz(profileId) {
  const s = load(key(profileId), null)
  if (!s || !Array.isArray(s.items) || !Array.isArray(s.answers)) return null
  const seen = Array.isArray(s.visited) ? s.visited : []
  const kept = s.items
    .map((it, i) => ({ it, a: s.answers[i] || null, v: !!seen[i] }))
    .filter(({ it }) => questionById[it.qid])
  if (!kept.length) return null
  const items = kept.map(({ it }) => {
    const question = questionById[it.qid]
    return { question, arranged: it.order.map((orig, i) => ({ letter: LETTERS[i], orig, text: question.choices[orig] })) }
  })
  const answers = kept.map(({ a }) => a)
  return {
    session: { mode: s.mode, items, deadline: s.deadline ?? null, startedAt: s.startedAt ?? Date.now() },
    // Back on the question you were looking at (you can now move freely, so don't jump to the first open one).
    index: Math.max(0, Math.min(Number.isInteger(s.index) ? s.index : 0, items.length - 1)),
    answers,
    visited: kept.map(({ v }) => v),
  }
}

// Short summary for the "resume" banner.
export function activeQuizSummary(profileId) {
  const restored = loadActiveQuiz(profileId)
  if (!restored) return null
  return {
    mode: restored.session.mode,
    answered: restored.answers.filter(Boolean).length,
    total: restored.session.items.length,
  }
}
