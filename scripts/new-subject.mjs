#!/usr/bin/env node
// Scaffolds a new subject: npm run new-subject "Réseaux informatiques"
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const name = process.argv.slice(2).join(' ').trim()
if (!name) {
  console.error('Usage: npm run new-subject "Subject name"')
  process.exit(1)
}

const id = name
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

if (!id) {
  console.error('The name must contain at least one letter or digit.')
  process.exit(1)
}

const dir = join(fileURLToPath(new URL('..', import.meta.url)), 'src', 'data', id)
if (existsSync(dir)) {
  console.error(`src/data/${id}/ already exists.`)
  process.exit(1)
}

const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed', '#dc2626', '#0d9488']
const color = COLORS[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length]

const meta = {
  name,
  description: 'Short description of the course (one sentence).',
  icon: '📘',
  color,
  language: 'fr',
  contributors: [],
  draft: true,
  sources: {
    'cours-prof': { label: 'Cours du prof', file: `courses/${name}/...`, author: '' },
    'notes-perso': { label: 'Mes notes', file: `courses/${name}/...`, author: '' },
  },
}

const chapter = {
  id: 'intro',
  title: 'Exemple de chapitre',
  order: 1,
  description: 'Replace this example with real content (or delete this file).',
  questions: [
    {
      id: `${id}-intro-001`,
      difficulty: 'medium',
      tier: 'core',
      question: 'Example question: apply a concept to a new situation.',
      choices: {
        A: 'Plausible wrong answer based on a common confusion',
        B: 'The correct answer, similar in length to the others',
        C: 'Near-miss definition that is subtly wrong',
        D: 'Answer that mixes up two related concepts',
      },
      answer: 'B',
      explanation: 'Why B is right, in one or two sentences.',
      why: {
        A: 'Why A is wrong.',
        C: 'Why C is wrong.',
        D: 'Why D is wrong.',
      },
      ref: 'Chapitre 1, §1',
      source: 'cours-prof',
    },
  ],
  flashcards: [
    {
      id: `${id}-intro-f001`,
      kind: 'definition',
      tier: 'core',
      front: 'Example: what is X, and why does it matter?',
      back: 'One or two short sentences.',
      ref: 'Chapitre 1, §1',
      source: 'notes-perso',
    },
  ],
}

mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')
writeFileSync(join(dir, '01-intro.json'), JSON.stringify(chapter, null, 2) + '\n')

console.log(`
Created src/data/${id}/
  meta.json      ← name, description, icon, color, sources (who wrote which file)
  01-intro.json  ← example chapter, replace with real content

The subject is a draft ("draft": true): visible with "npm run dev", hidden on the
published site. Remove that line from meta.json when it is ready.

Next: put the course files in courses/${name}/, ask Claude Code to generate the
chapter JSON files, then run "npm run validate".
`)
