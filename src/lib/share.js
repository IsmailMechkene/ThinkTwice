// Everything a page shows is described by its URL, so a copied link opens the
// exact same thing for someone else. This module turns that state into compact
// query strings and back.
import { DIFFICULTIES, LETTERS, subjectById } from './content'

export const EMPTY_FILTER = { subjectIds: [], chapterKeys: [], difficulties: [], sources: [], coreOnly: false }

const list = (params, name) =>
  params
    .getAll(name)
    .flatMap((v) => v.split(','))
    .filter(Boolean)

// ---------- filters: ?subject=a,b&chapter=c&difficulty=easy&source=X&core=1 ----------

export function filterFromParams(params) {
  const subjectIds = [...new Set(list(params, 'subject'))].filter((id) => subjectById[id])
  // A chapter is "<subjectId>/<chapterKey>", or just "<chapterKey>" when exactly one subject is selected.
  const chapterKeys = list(params, 'chapter')
    .map((c) => (c.includes('/') ? c : subjectIds.length === 1 ? `${subjectIds[0]}/${c}` : null))
    .filter((k) => {
      if (!k) return false
      const [s, c] = k.split('/')
      return subjectById[s]?.chapters.some((ch) => ch.key === c)
    })
  return {
    subjectIds,
    chapterKeys: [...new Set(chapterKeys)],
    difficulties: list(params, 'difficulty').filter((d) => DIFFICULTIES.includes(d)),
    sources: params.getAll('source').filter(Boolean),
    coreOnly: params.get('core') === '1',
  }
}

// Writes the filter into `params` (a URLSearchParams), dropping empty fields.
export function writeFilter(params, f = {}) {
  for (const k of ['subject', 'chapter', 'difficulty', 'source', 'core']) params.delete(k)
  const subjectIds = f.subjectIds || []
  if (subjectIds.length) params.set('subject', subjectIds.join(','))
  const only = subjectIds.length === 1 ? `${subjectIds[0]}/` : null
  const chapters = (f.chapterKeys || []).map((k) => (only && k.startsWith(only) ? k.slice(only.length) : k))
  if (chapters.length) params.set('chapter', chapters.join(','))
  if (f.difficulties?.length) params.set('difficulty', f.difficulties.join(','))
  for (const s of f.sources || []) params.append('source', s)
  if (f.coreOnly) params.set('core', '1')
  return params
}

export function filterQuery(f) {
  return writeFilter(new URLSearchParams(), f).toString()
}

// ---------- id lists: ?p=<prefix>.<prefix>&q=<prefixIndex>-<suffix>.… ----------
// Item ids look like "<subject>-<chapter>-<number>", so the shared prefixes are
// stored once. A 40-question quiz fits in a short link.

export function writeIds(params, ids) {
  const prefixes = []
  const entries = ids.map((id) => {
    const cut = id.lastIndexOf('-')
    const prefix = cut > 0 ? id.slice(0, cut) : ''
    let i = prefixes.indexOf(prefix)
    if (i < 0) i = prefixes.push(prefix) - 1
    return `${i}-${id.slice(cut + 1)}`
  })
  params.set('p', prefixes.join('.'))
  params.set('q', entries.join('.'))
  return params
}

export function readIds(params) {
  const q = params.get('q')
  if (!q) return null
  const prefixes = (params.get('p') || '').split('.')
  return q.split('.').map((e) => {
    const dash = e.indexOf('-')
    const prefix = prefixes[Number(e.slice(0, dash))] ?? ''
    const suffix = e.slice(dash + 1)
    return prefix ? `${prefix}-${suffix}` : suffix
  })
}

// ---------- quiz sessions ----------
// quiz/exam: /quiz/play?mode=quiz&p=…&q=…[&min=25]  (the exact questions, in order)
// revise:    /quiz/play?mode=revise&subject=…        (the viewer's own mistakes for that scope)

export function quizPath({ mode, questionIds, examMinutes, filter }) {
  const params = new URLSearchParams({ mode })
  if (mode === 'revise') writeFilter(params, filter)
  else writeIds(params, questionIds)
  if (mode === 'exam' && examMinutes) params.set('min', String(examMinutes))
  return `/quiz/play?${params}`
}

export function quizSpecFromParams(params) {
  const mode = params.get('mode')
  if (mode === 'revise') return { mode, filter: filterFromParams(params) }
  if (mode !== 'quiz' && mode !== 'exam') return null
  const questionIds = readIds(params)
  if (!questionIds) return null
  const min = Number(params.get('min'))
  return { mode, questionIds, examMinutes: mode === 'exam' && min > 0 ? Math.min(240, min) : null }
}

// ---------- results: /results?mode=quiz&t=<seconds>&p=…&q=…&a=<letters>[&o=<orders>] ----------
// a: one char per question, the chosen original letter or "-" if skipped.
// o: 4 letters per question (display order of the choices), only when shuffled.

export function resultPath(result) {
  const params = new URLSearchParams({ mode: result.mode, t: String(result.durationSec || 0) })
  writeIds(params, result.answers.map((a) => a.qid))
  params.set('a', result.answers.map((a) => a.chosen || '-').join(''))
  const orders = result.answers.map((a) => (a.order || LETTERS).join(''))
  if (orders.some((o) => o !== LETTERS.join(''))) params.set('o', orders.join(''))
  return `/results?${params}`
}

export function resultFromParams(params, questionById) {
  const ids = readIds(params)
  const chosen = params.get('a') || ''
  if (!ids || chosen.length !== ids.length) return null
  const orders = params.get('o') || ''
  const answers = ids.map((qid, i) => {
    const c = LETTERS.includes(chosen[i]) ? chosen[i] : null
    const raw = orders.length === ids.length * 4 ? orders.slice(i * 4, i * 4 + 4).split('') : LETTERS
    const order = raw.length === 4 && LETTERS.every((l) => raw.includes(l)) ? raw : LETTERS
    const q = questionById[qid]
    return { qid, chosen: c, correct: !!q && c === q.answer, skipped: c == null, order }
  })
  const mode = ['quiz', 'exam', 'revise'].includes(params.get('mode')) ? params.get('mode') : 'quiz'
  return { mode, answers, durationSec: Math.max(0, Number(params.get('t')) || 0) }
}
