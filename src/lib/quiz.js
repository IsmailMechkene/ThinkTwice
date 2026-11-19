import { LETTERS, matchesFilter, questions as allQuestions } from './content'
import { seededRandom, shuffle } from './random'

// Picks `count` questions. With `prioritize`, unseen and weak questions come first.
// With a `seed`, the same filter + count + seed always gives the same questions (shareable links).
export function pickQuestions(filter, { count, prioritize, stats = {}, pool, seed } = {}) {
  const rand = seed ? seededRandom(seed) : Math.random
  const candidates = (pool || allQuestions).filter((q) => matchesFilter(q, filter))
  let ordered = shuffle(candidates, rand)
  if (prioritize) {
    const score = (q) => {
      const s = stats[q.id]
      if (!s || !s.attempts) return -1
      return s.correct / s.attempts
    }
    ordered = ordered.sort((a, b) => score(a) - score(b))
  }
  ordered = count ? ordered.slice(0, count) : ordered
  // Re-shuffle the selection so priority ordering doesn't group by chapter.
  return shuffle(ordered, rand)
}

// Returns the display order of choices. Each entry keeps the original letter so
// answers and explanations are always stored against the JSON letters.
export function arrangeChoices(question, shuffled) {
  const order = shuffled ? shuffle(LETTERS) : LETTERS
  return order.map((orig, i) => ({ letter: LETTERS[i], orig, text: question.choices[orig] }))
}
