#!/usr/bin/env node
// Validates every subject in src/data/. Run with: npm run validate
// Errors (exit code 1) block the build; warnings are quality hints.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DATA = join(ROOT, 'src', 'data')
const LETTERS = ['A', 'B', 'C', 'D']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const TIERS = ['core', 'bonus']
const KINDS = ['definition', 'formula', 'distinction', 'why']
const BANNED_CHOICES = [
  /all of the above/i,
  /none of the above/i,
  /toutes? les (réponses|propositions) (ci-dessus|précédentes)/i,
  /aucune des (réponses|propositions)/i,
]

const errors = []
const warnings = []
const err = (file, msg) => errors.push(`${file}: ${msg}`)
const warn = (file, msg) => warnings.push(`${file}: ${msg}`)
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    err(relative(ROOT, path), `invalid JSON — ${e.message}`)
    return null
  }
}

const allIds = new Map() // id -> file
const allQuestionTexts = new Map() // normalized text -> id
const report = []

if (!existsSync(DATA)) {
  console.error('src/data/ not found')
  process.exit(1)
}

for (const subject of readdirSync(DATA).sort()) {
  const dir = join(DATA, subject)
  if (!statSync(dir).isDirectory()) continue
  const metaPath = join(dir, 'meta.json')
  const relMeta = relative(ROOT, metaPath)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(subject)) err(relative(ROOT, dir), 'folder name must be lowercase-kebab-case (it is the subject id)')
  if (!existsSync(metaPath)) {
    err(relative(ROOT, dir), 'missing meta.json')
    continue
  }
  const meta = readJson(metaPath)
  if (!meta) continue
  for (const f of ['name', 'description', 'language']) if (!nonEmpty(meta[f])) err(relMeta, `"${f}" is required`)
  if (meta.contributors && !Array.isArray(meta.contributors)) err(relMeta, '"contributors" must be an array')
  const sources = meta.sources || {}
  if (typeof sources !== 'object' || !Object.keys(sources).length) err(relMeta, '"sources" must list at least one source')
  for (const [k, v] of Object.entries(sources)) if (!nonEmpty(v?.label)) err(relMeta, `source "${k}" needs a "label"`)

  const stats = { subject, chapters: 0, questions: 0, flashcards: 0, core: 0 }

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'meta.json').sort()) {
    const rel = relative(ROOT, join(dir, file))
    const ch = readJson(join(dir, file))
    if (!ch) continue
    stats.chapters++
    if (!nonEmpty(ch.title)) err(rel, '"title" is required')
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ch.id || '')) err(rel, '"id" (short chapter code used in item ids) must be lowercase-kebab-case')
    const prefix = `${subject}-${ch.id}-`
    const questions = ch.questions || []
    const flashcards = ch.flashcards || []
    if (!Array.isArray(questions) || !Array.isArray(flashcards)) {
      err(rel, '"questions" and "flashcards" must be arrays')
      continue
    }

    const checkCommon = (item, kind, i) => {
      const where = `${kind} #${i + 1}${item.id ? ` (${item.id})` : ''}`
      if (!nonEmpty(item.id)) err(rel, `${where}: missing "id"`)
      else {
        if (allIds.has(item.id)) err(rel, `${where}: duplicate id (also in ${allIds.get(item.id)})`)
        allIds.set(item.id, rel)
        if (!item.id.startsWith(prefix)) warn(rel, `${where}: id should start with "${prefix}" for readability`)
      }
      if (!TIERS.includes(item.tier)) err(rel, `${where}: "tier" must be one of ${TIERS.join(', ')}`)
      if (!nonEmpty(item.ref)) err(rel, `${where}: "ref" (chapter/section reference) is required`)
      if (!nonEmpty(item.source)) err(rel, `${where}: "source" is required`)
      else if (!sources[item.source]) err(rel, `${where}: source "${item.source}" is not declared in meta.json`)
      if (item.tier === 'core') stats.core++
      return where
    }

    const letterCount = { A: 0, B: 0, C: 0, D: 0 }
    const diffCount = { easy: 0, medium: 0, hard: 0 }
    questions.forEach((q, i) => {
      const where = checkCommon(q, 'question', i)
      stats.questions++
      if (!nonEmpty(q.question)) err(rel, `${where}: "question" text is required`)
      else {
        const key = norm(q.question + (q.code || ''))
        if (allQuestionTexts.has(key)) err(rel, `${where}: duplicate of question ${allQuestionTexts.get(key)}`)
        allQuestionTexts.set(key, q.id)
      }
      if (!DIFFICULTIES.includes(q.difficulty)) err(rel, `${where}: "difficulty" must be one of ${DIFFICULTIES.join(', ')}`)
      else diffCount[q.difficulty]++

      const choices = q.choices || {}
      const keys = Object.keys(choices)
      if (keys.length !== 4 || !LETTERS.every((l) => keys.includes(l))) {
        err(rel, `${where}: "choices" must have exactly the keys A, B, C, D`)
        return
      }
      if (!LETTERS.every((l) => nonEmpty(choices[l]))) err(rel, `${where}: every choice must be a non-empty string`)
      if (new Set(LETTERS.map((l) => norm(choices[l] || ''))).size !== 4) err(rel, `${where}: two choices are identical`)
      for (const l of LETTERS) if (BANNED_CHOICES.some((re) => re.test(choices[l] || ''))) err(rel, `${where}: choice ${l} is an "all/none of the above" option`)

      if (!LETTERS.includes(q.answer)) {
        err(rel, `${where}: "answer" must be one letter among A, B, C, D`)
        return
      }
      letterCount[q.answer]++
      if (!nonEmpty(q.explanation)) err(rel, `${where}: "explanation" (why the answer is right) is required`)
      for (const l of LETTERS.filter((x) => x !== q.answer)) {
        if (!nonEmpty(q.why?.[l])) err(rel, `${where}: "why.${l}" (why this wrong option is wrong) is required`)
      }

      // Form hint: the correct option should not stand out by its length.
      const lens = LETTERS.map((l) => (choices[l] || '').length)
      const others = LETTERS.filter((l) => l !== q.answer).map((l) => choices[l].length)
      const avg = others.reduce((a, b) => a + b, 0) / others.length
      if (choices[q.answer].length > 1.6 * avg && choices[q.answer].length - avg > 25)
        warn(rel, `${where}: correct option is much longer than the others (${lens.join('/')} chars)`)
    })

    flashcards.forEach((f, i) => {
      const where = checkCommon(f, 'flashcard', i)
      stats.flashcards++
      if (!nonEmpty(f.front)) err(rel, `${where}: "front" is required`)
      if (!nonEmpty(f.back)) err(rel, `${where}: "back" is required`)
      else if (f.back.length > 280) warn(rel, `${where}: back is ${f.back.length} chars — keep it to 1-2 short sentences`)
      if (f.kind && !KINDS.includes(f.kind)) err(rel, `${where}: "kind" must be one of ${KINDS.join(', ')}`)
    })

    if (questions.length >= 8) {
      const max = Math.max(...Object.values(letterCount))
      const min = Math.min(...Object.values(letterCount))
      if (max / questions.length > 0.4 || min / questions.length < 0.1)
        warn(rel, `correct letters are unbalanced: ${LETTERS.map((l) => `${l}=${letterCount[l]}`).join(' ')}`)
      for (const d of DIFFICULTIES) if (!diffCount[d]) warn(rel, `no "${d}" question in this chapter`)
    }
  }
  report.push(stats)
}

// UI translations: every language must define exactly the same keys as English.
const i18nDir = join(ROOT, 'src', 'i18n')
const { default: en } = await import(new URL(`file:///${join(i18nDir, 'en.js').replace(/\\/g, '/')}`))
for (const file of readdirSync(i18nDir).filter((f) => /^[a-z]{2}\.js$/.test(f) && f !== 'en.js')) {
  const { default: dict } = await import(new URL(`file:///${join(i18nDir, file).replace(/\\/g, '/')}`))
  const rel = `src/i18n/${file}`
  for (const k of Object.keys(en)) if (!(k in dict)) err(rel, `missing translation "${k}"`)
  for (const k of Object.keys(dict)) if (!(k in en)) err(rel, `unknown key "${k}" (not in en.js)`)
}

console.log('\nThinkTwice content check\n')
for (const s of report) {
  console.log(`  ${s.subject}: ${s.chapters} chapters, ${s.questions} questions, ${s.flashcards} flashcards (${s.core} core items)`)
}
if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} warning(s):`)
  for (const w of warnings) console.log(`   - ${w}`)
}
if (errors.length) {
  console.log(`\n✖  ${errors.length} error(s):`)
  for (const e of errors) console.log(`   - ${e}`)
  console.log('')
  process.exit(1)
}
console.log('\n✔  All content is valid.\n')
