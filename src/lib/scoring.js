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

export function verdict(pct) {
  if (pct >= 90) return 'Excellent — exam-ready on this set.'
  if (pct >= 70) return 'Solid. Revise the mistakes below and you are there.'
  if (pct >= 50) return 'Halfway. Focus on the weakest chapters first.'
  return 'Rough round — that is what revision is for. Start with the mistakes.'
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
