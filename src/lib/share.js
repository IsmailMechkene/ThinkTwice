// Everything a page shows is described by its URL, so a copied link opens the
// exact same thing for someone else. This module turns that state into compact
// query strings and back.
import { DIFFICULTIES, LETTERS, matchesFilter, questions, subjectById } from './content'
import { pickQuestions } from './quiz'

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

// ---------- question lists inside a filter: i=<chars per question> ----------
// Each question is written as its position among the questions matching the
// filter (base 36, 2 chars for up to 1296 questions), so an exact list stays short.

function pool(filter) {
  return questions.filter((q) => matchesFilter(q, filter || {}))
}
const widthFor = (n) => Math.max(1, Math.ceil(Math.log(Math.max(2, n)) / Math.log(36)))

function writeIndices(params, filter, ids) {
  const list = pool(filter)
  const pos = new Map(list.map((q, i) => [q.id, i]))
  if (!ids.every((id) => pos.has(id))) return false
  const w = widthFor(list.length)
  params.set('i', ids.map((id) => pos.get(id).toString(36).padStart(w, '0')).join(''))
  return true
}

function readIndices(params, filter) {
  const raw = params.get('i')
  if (!raw) return null
  const list = pool(filter)
  const w = widthFor(list.length)
  if (raw.length % w) return null
  const ids = []
  for (let k = 0; k < raw.length; k += w) {
    const q = list[parseInt(raw.slice(k, k + w), 36)]
    if (!q) return null
    ids.push(q.id)
  }
  return ids
}

// Display order of the 4 choices = one of 24 permutations, written as one char.
function permutations(rest) {
  if (rest.length <= 1) return [rest]
  return rest.flatMap((x) => permutations(rest.filter((y) => y !== x)).map((p) => [x, ...p]))
}
const PERMS = permutations(LETTERS)
const permChar = (order) => Math.max(0, PERMS.findIndex((p) => p.join('') === (order || LETTERS).join(''))).toString(36)
const permFrom = (ch) => PERMS[parseInt(ch, 36)] || LETTERS

// ---------- quiz sessions ----------
// quiz/exam, random pick:     /quiz/play?subject=…&n=10&s=<seed>[&m=exam&min=25]
//   The seed re-picks the same questions, so the link stays tiny.
// quiz/exam, weak-first pick: /quiz/play?subject=…&i=<positions>
//   That pick depends on your own stats, so the chosen questions are written instead.
// revise:                     /quiz/play?m=revise&subject=…  (the viewer's own mistakes)

function writeQuestions(params, spec, ids) {
  writeFilter(params, spec?.filter)
  if (spec?.seed) {
    params.set('n', spec.count ? String(spec.count) : 'all')
    params.set('s', spec.seed)
  } else if (!writeIndices(params, spec?.filter, ids)) {
    writeFilter(params, {})
    writeIds(params, ids)
  }
}

function readQuestions(params, filter) {
  const seed = params.get('s')
  if (seed) {
    const n = params.get('n')
    const count = n === 'all' ? 0 : Math.max(1, Number(n) || 10)
    return { seed, count, ids: pickQuestions(filter, { count, seed }).map((q) => q.id) }
  }
  const ids = readIndices(params, filter) || readIds(params)
  return ids ? { ids } : null
}

export function quizPath(spec) {
  const params = new URLSearchParams()
  if (spec.mode !== 'quiz') params.set('m', spec.mode)
  if (spec.mode === 'revise') writeFilter(params, spec.filter)
  else writeQuestions(params, spec, spec.questionIds)
  if (spec.mode === 'exam' && spec.examMinutes) params.set('min', String(spec.examMinutes))
  return `/quiz/play?${params}`
}

export function quizSpecFromParams(params) {
  const mode = params.get('m') || params.get('mode') || 'quiz'
  const filter = filterFromParams(params)
  if (mode === 'revise') return { mode, filter }
  if (mode !== 'quiz' && mode !== 'exam') return null
  const picked = readQuestions(params, filter)
  if (!picked) return null
  const min = Number(params.get('min'))
  return {
    mode,
    filter,
    seed: picked.seed,
    count: picked.count,
    questionIds: picked.ids,
    examMinutes: mode === 'exam' && min > 0 ? Math.min(240, min) : null,
  }
}

// ---------- results: /results?<questions as in the quiz link>&t=<seconds>&a=<answers>[&o=<orders>] ----------
// a: one char per question, the chosen original letter or "-" if skipped.
// o: one char per question for the shuffled choice order (revise mode only).

export function resultPath(result, spec) {
  const params = new URLSearchParams()
  if (result.mode !== 'quiz') params.set('m', result.mode)
  params.set('t', String(result.durationSec || 0))
  writeQuestions(params, spec, result.answers.map((a) => a.qid))
  params.set('a', result.answers.map((a) => a.chosen || '-').join(''))
  const orders = result.answers.map((a) => permChar(a.order)).join('')
  if (/[^0]/.test(orders)) params.set('o', orders)
  return `/results?${params}`
}

export function resultFromParams(params, questionById) {
  const ids = readQuestions(params, filterFromParams(params))?.ids
  const chosen = params.get('a') || ''
  if (!ids || chosen.length !== ids.length) return null
  const orders = params.get('o') || ''
  const answers = ids.map((qid, i) => {
    const c = LETTERS.includes(chosen[i]) ? chosen[i] : null
    const q = questionById[qid]
    const order = orders.length === ids.length ? permFrom(orders[i]) : LETTERS
    return { qid, chosen: c, correct: !!q && c === q.answer, skipped: c == null, order }
  })
  const m = params.get('m') || params.get('mode')
  const mode = ['quiz', 'exam', 'revise'].includes(m) ? m : 'quiz'
  return { mode, answers, durationSec: Math.max(0, Number(params.get('t')) || 0) }
}

// ---------- explicit id lists: p=<prefix>.<prefix>&q=<prefixIndex>-<suffix>.… ----------
// Fallback when the questions are not all inside the filter.

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
