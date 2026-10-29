// Auto-discovers every subject in src/data/<subject>/ — no hardcoded list anywhere.
// A subject = a folder with meta.json; every other .json in the folder is a chapter.

const metaFiles = import.meta.glob('../data/*/meta.json', { eager: true, import: 'default' })
const chapterFiles = import.meta.glob(['../data/*/*.json', '!../data/*/meta.json'], {
  eager: true,
  import: 'default',
})

export const LETTERS = ['A', 'B', 'C', 'D']
export const DIFFICULTIES = ['easy', 'medium', 'hard']
export const TIERS = ['core', 'bonus']

function folderOf(path) {
  return path.split('/').at(-2)
}

function fileOf(path) {
  return path.split('/').at(-1).replace(/\.json$/, '')
}

function build() {
  const subjects = []
  const questions = []
  const flashcards = []

  for (const [path, meta] of Object.entries(metaFiles)) {
    if (meta.draft && !import.meta.env.DEV) continue
    const subjectId = folderOf(path)
    const sources = meta.sources || {}
    const chapters = Object.entries(chapterFiles)
      .filter(([p]) => folderOf(p) === subjectId)
      .map(([p, ch]) => ({ ...ch, key: fileOf(p) }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.key.localeCompare(b.key))

    const subject = {
      ...meta,
      id: subjectId,
      color: meta.color || '#4f46e5',
      icon: meta.icon || '📘',
      sources,
      chapters: [],
    }

    for (const ch of chapters) {
      const chapter = {
        key: ch.key,
        subjectId,
        title: ch.title || ch.key,
        description: ch.description || '',
        order: ch.order,
        questionIds: [],
        flashcardIds: [],
      }
      const tag = (item) => ({
        ...item,
        subjectId,
        chapterKey: ch.key,
        tier: item.tier || 'core',
        sourceLabel: sources[item.source]?.label || item.source || 'Unknown source',
      })
      for (const q of ch.questions || []) {
        questions.push(tag(q))
        chapter.questionIds.push(q.id)
      }
      for (const f of ch.flashcards || []) {
        flashcards.push(tag(f))
        chapter.flashcardIds.push(f.id)
      }
      subject.chapters.push(chapter)
    }
    subject.questionCount = subject.chapters.reduce((n, c) => n + c.questionIds.length, 0)
    subject.flashcardCount = subject.chapters.reduce((n, c) => n + c.flashcardIds.length, 0)
    subjects.push(subject)
  }

  subjects.sort((a, b) => a.name.localeCompare(b.name))
  return { subjects, questions, flashcards }
}

export const { subjects, questions, flashcards } = build()

export const subjectById = Object.fromEntries(subjects.map((s) => [s.id, s]))
export const questionById = Object.fromEntries(questions.map((q) => [q.id, q]))
export const flashcardById = Object.fromEntries(flashcards.map((f) => [f.id, f]))

export function chapterOf(item) {
  return subjectById[item.subjectId]?.chapters.find((c) => c.key === item.chapterKey)
}

export function chapterLabel(item) {
  const subject = subjectById[item.subjectId]
  const chapter = chapterOf(item)
  return `${subject?.name ?? item.subjectId} · ${chapter?.title ?? item.chapterKey}`
}

// Shared filter shape used by quiz setup, flashcards and mistakes.
// chapterKeys entries look like "<subjectId>/<chapterKey>".
export function matchesFilter(item, { subjectIds, chapterKeys, coreOnly, sources, difficulties } = {}) {
  if (subjectIds?.length && !subjectIds.includes(item.subjectId)) return false
  if (chapterKeys?.length && !chapterKeys.includes(`${item.subjectId}/${item.chapterKey}`)) return false
  if (coreOnly && item.tier !== 'core') return false
  if (sources?.length && !sources.includes(item.sourceLabel)) return false
  if (difficulties?.length && item.difficulty && !difficulties.includes(item.difficulty)) return false
  return true
}

export function allSourceLabels(items) {
  return [...new Set(items.map((i) => i.sourceLabel))].sort()
}
