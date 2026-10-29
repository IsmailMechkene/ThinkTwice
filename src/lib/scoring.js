import { chapterOf, subjectById } from './content'

export function percent(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0
}

// answers: [{ question, chosen, correct }]
export function summarize(answers) {
  const byChapter = new Map()
  for (const a of answers) {
    const key = `${a.question.subjectId}/${a.question.chapterKey}`
    if (!byChapter.has(key)) {
      byChapter.set(key, {
        key,
        subject: subjectById[a.question.subjectId]?.name,
        chapter: chapterOf(a.question)?.title,
        total: 0,
        correct: 0,
      })
    }
    const row = byChapter.get(key)
    row.total++
    if (a.correct) row.correct++
  }
  const correct = answers.filter((a) => a.correct).length
  return {
    total: answers.length,
    correct,
    pct: percent(correct, answers.length),
    chapters: [...byChapter.values()].sort((a, b) => percent(a.correct, a.total) - percent(b.correct, b.total)),
  }
}

// Returns an i18n key.
export function verdictKey(pct) {
  if (pct >= 90) return 'verdict.excellent'
  if (pct >= 70) return 'verdict.solid'
  if (pct >= 50) return 'verdict.half'
  return 'verdict.rough'
}

// Mastery: share of questions whose last answer was right and that are not in the mistake bank.
export function masteryOf(questionIds, progress) {
  if (!questionIds.length) return 0
  const ok = questionIds.filter((id) => progress.questions[id]?.lastCorrect && !progress.mistakes[id]).length
  return percent(ok, questionIds.length)
}

// Per-chapter accuracy from the saved question stats, weakest first.
export function chapterAccuracy(subjects, stats, minAttempts = 1) {
  const rows = []
  for (const s of subjects) {
    for (const c of s.chapters) {
      let attempts = 0
      let correct = 0
      for (const id of c.questionIds) {
        attempts += stats[id]?.attempts || 0
        correct += stats[id]?.correct || 0
      }
      if (attempts >= minAttempts) {
        rows.push({ key: `${s.id}/${c.key}`, subject: s, chapter: c, attempts, correct, pct: percent(correct, attempts) })
      }
    }
  }
  return rows.sort((a, b) => a.pct - b.pct)
}
