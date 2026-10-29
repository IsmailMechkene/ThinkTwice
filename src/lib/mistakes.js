// Mistake bank rules:
// - a wrong answer adds the question (or resets its streak to 0);
// - a correct answer on a new day increments the streak;
// - streak 2 (two correct answers in a row, on different days) => the question leaves the bank.
import { dayKey } from './date'

export const STREAK_TO_MASTER = 2

export function applyAnswer(bank, qid, { correct, chosen }, today = dayKey()) {
  const entry = bank[qid]
  if (!correct) {
    return {
      bank: {
        ...bank,
        [qid]: {
          wrongAnswer: chosen,
          addedAt: entry?.addedAt || today,
          lastWrongAt: today,
          timesWrong: (entry?.timesWrong || 0) + 1,
          streak: 0,
          lastCorrectDay: null,
        },
      },
      event: entry ? 'reset' : 'added',
    }
  }
  if (!entry) return { bank, event: null }
  if (entry.lastCorrectDay === today) return { bank, event: 'same-day' }
  const streak = entry.streak + 1
  if (streak >= STREAK_TO_MASTER) {
    const { [qid]: _removed, ...rest } = bank
    return { bank: rest, event: 'mastered' }
  }
  return { bank: { ...bank, [qid]: { ...entry, streak, lastCorrectDay: today } }, event: 'progress' }
}
