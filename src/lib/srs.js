// Leitner spaced repetition. Box 1 = review again today, box 5 = review in 14 days.
// "I knew it" moves a card up one box; "I didn't know" sends it back to box 1.
import { addDays, dayKey } from './date'

export const MAX_BOX = 5
export const BOX_INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 }

export function reviewCard(state, knew, today = dayKey()) {
  const box = knew ? Math.min(MAX_BOX, (state?.box || 0) + 1) : 1
  return {
    box,
    due: addDays(today, BOX_INTERVAL_DAYS[box]),
    reviews: (state?.reviews || 0) + 1,
    lapses: (state?.lapses || 0) + (knew ? 0 : 1),
    last: today,
  }
}

export function isDue(state, today = dayKey()) {
  return !state || state.due <= today
}

export function boxOf(state) {
  return state?.box || 0
}
