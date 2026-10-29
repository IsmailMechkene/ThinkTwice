# ThinkTwice

A study site for revising exams with friends. It has three parts:

- **Quizzes that make you think.** Every question has 4 choices and 1 correct answer. Questions ask you to apply concepts, compare them, spot traps or compute something. Each one comes with an explanation of why the right answer is right *and* why each wrong option is wrong.
- **Flashcards with spaced repetition (Leitner).** Cards you miss come back sooner.
- **A mistake bank.** Every wrong answer is saved. A question leaves the bank only after you answer it correctly **2 times in a row, on different days**.

There is no backend and no login. Progress is saved in your browser, separately for each person (profile), and you can export or import it as a JSON file. The site is free to host on GitHub Pages or Netlify.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # check all content files
npm run build      # validate + production build in dist/
```

Requires Node 20.19+ or 22.12+.

## Project structure

```
courses/                     raw course material (PDFs, slides, notes), one folder per course
src/
  data/<subject>/            one folder per subject (auto-discovered)
    meta.json                name, description, icon, color, language, contributors, sources
    01-<chapter>.json        one file per chapter: questions + flashcards
  lib/                       content loading, spaced repetition, mistake bank, scoring, storage
  context/                   ProgressContext (per-profile progress in localStorage)
  hooks/                     useProgress, useMistakes, useTheme
  components/                UI pieces (question card, flashcard, filters…)
  pages/                     Home, Subject, QuizSetup, QuizPlayer, Results, Flashcards, Mistakes, Stats
scripts/
  validate.mjs               npm run validate
  new-subject.mjs            npm run new-subject "Name"
```

**No subject is hardcoded anywhere.** At build time, `import.meta.glob` finds every `src/data/*/meta.json`, along with the chapter files next to it. Add a folder with valid JSON and the subject appears on the site, with no code changes.

---

## Adding a new course (the workflow)

1. **Drop the files.** Put the course material in `courses/<Course name>/`: PDFs, slides, scans, your notes and a friend's notes.
2. **Scaffold the subject.**
   ```bash
   npm run new-subject "Réseaux informatiques"
   ```
   This creates `src/data/reseaux-informatiques/` with a `meta.json` and an example chapter. The subject starts as a **draft** (`"draft": true`): it is visible with `npm run dev` and hidden on the published site.
3. **Ask Claude Code to generate the content.** For example:
   > Read everything in `courses/Réseaux informatiques/`. Fill `src/data/reseaux-informatiques/meta.json` (sources = one entry per file, with its author). Then generate one chapter JSON per chapter, following the format and quality rules in README.md. Write in the language of the course. Revision-first: core concepts, typical exercises and traps; mark nice-to-know items as "bonus". Then run `npm run validate` and fix every error.
4. **Check.** Run `npm run validate` and fix any errors. Read the warnings too: they flag correct answers that are too long and unbalanced A/B/C/D answers.
5. **Publish.** Remove `"draft": true` from `meta.json`, then commit and push. The site redeploys automatically (see *Deploying*).

### How a friend can contribute

- **With Git:** clone the repo, create a branch, add or edit JSON files in `src/data/…`, run `npm run validate`, and open a pull request.
- **Without Git:** send the JSON file (or the course PDF) to whoever maintains the repo, who drops it in `src/data/<subject>/` and runs the validator.
- Add your name to `contributors` in `meta.json`, and declare your notes as a source so every item shows where it comes from.

---

## Content format

### `meta.json`

```json
{
  "name": "Calcul parallèle",
  "description": "One-sentence description shown on the subject card.",
  "icon": "⚡",
  "color": "#4f46e5",
  "language": "fr",
  "contributors": ["Alice", "Sami"],
  "draft": false,
  "sources": {
    "cours-prof": { "label": "Cours du prof", "file": "courses/…/cours.pdf", "author": "M. Dupont" },
    "notes-sami": { "label": "Notes de Sami", "file": "courses/…/notes.pdf", "author": "Sami" }
  }
}
```

The **folder name is the subject id**. It must be lowercase-kebab-case and must never change after people have progress on it.

### Chapter file (`src/data/<subject>/NN-<name>.json`)

```json
{
  "id": "perf",
  "title": "Sources de parallélisme & performances",
  "order": 1,
  "description": "Short summary of the chapter.",
  "questions": [ … ],
  "flashcards": [ … ]
}
```

`id` is a short chapter code used in item ids. `order` sets the display order.

### Question

```json
{
  "id": "calcul-parallele-perf-004",
  "difficulty": "easy",
  "tier": "core",
  "question": "Un programme met 120 s en séquentiel et 20 s sur 8 processeurs. Que valent S₈ et E₈ ?",
  "code": "optional code snippet, shown in a code block",
  "choices": {
    "A": "S₈ = 6 et E₈ ≈ 1,33",
    "B": "S₈ ≈ 0,17 et E₈ = 0,75",
    "C": "S₈ = 6 et E₈ = 0,75",
    "D": "S₈ = 8 et E₈ = 1"
  },
  "answer": "C",
  "explanation": "Why the correct answer is right (1–2 sentences).",
  "why": {
    "A": "Why A is wrong.",
    "B": "Why B is wrong.",
    "D": "Why D is wrong."
  },
  "ref": "Résumé parallélisme §7.1",
  "source": "cours-prof"
}
```

| Field | Rule |
|---|---|
| `id` | Unique and **permanent**: `<subject>-<chapterId>-NNN`. Never renumber or reuse an id; progress and the mistake bank are keyed on it. To delete a question, delete it; don't recycle its id. |
| `difficulty` | `easy`, `medium` or `hard`, with a mix in each chapter. |
| `tier` | `core` (must-know) or `bonus` (nice to know). "Core only" mode uses this for last-minute revision. When unsure, use `bonus`. |
| `choices` / `answer` | Exactly A, B, C, D, with one correct letter. Spread correct letters evenly across a chapter. |
| `explanation` / `why` | Why the answer is right, plus one line per wrong option. Keep them short. |
| `ref` / `source` | The chapter or section in the course, and a key from `meta.sources`. |

Text fields support `` `inline code` ``, `**bold**` and `\n` line breaks.

### Flashcard

```json
{
  "id": "calcul-parallele-perf-f004",
  "kind": "formula",
  "tier": "core",
  "front": "Accélération Sp(n) : formule et 3 cas ?",
  "back": "Sp = T₁/Tp. Sp < 1 : ralentissement. 1 < Sp ≤ p : normal. Sp > p : super-linéaire.",
  "ref": "§7.1",
  "source": "resume-parallelisme"
}
```

`kind` is one of `definition`, `formula`, `distinction` or `why`. Keep the back to one or two short sentences.

### Quality rules (for humans and for Claude)

1. Each question makes you **think**: apply a concept to a new case, compare two close notions, spot the flaw, predict a result, choose a method or find the exception. No pure trivia.
2. Distractors are **plausible**: common misconceptions, near-miss definitions, confusions between related concepts. Never use joke answers, "all of the above" or "none of the above".
3. All options have a similar length and style, so the form never gives the answer away.
4. **Only content that is in the course.** Don't invent facts. If something is unclear, skip it.
5. **Revision-first:** focus on what the teacher stresses and on typical exercises and traps. Skip anecdotes, dates and footnotes. Prefer fewer, high-value questions.
6. No duplicates. If two contributors wrote the same question, keep the better one.
7. Each question must stand on its own: never write "same program as before", because questions are shuffled.

### What `npm run validate` checks

- **Errors** (these block the build): missing `meta.json` or required fields; invalid JSON; duplicate ids (across all subjects); duplicate question text; not exactly A/B/C/D; identical choices; `answer` not in A–D; missing explanation or missing `why` for a wrong option; invalid difficulty/tier/kind; `source` not declared in `meta.json`; "all/none of the above" options.
- **Warnings:** unbalanced correct letters in a chapter; a correct option much longer than the others; a chapter with no easy, medium or hard question; ids that don't follow the naming pattern; flashcard backs that are too long.

`npm run build` runs the validator first, so broken content can't be deployed.

---

## Deploying for free

Routing uses `HashRouter` (URLs look like `/#/quiz`) and Vite's `base` is `'./'` (relative paths). The same build works at a domain root or in a sub-folder, with no server configuration.

### Cloudflare Pages (what we use)

**Connected to GitHub (auto-deploys on every push):**

1. Push the repo to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick the repo.
3. Build settings:
   - Framework preset: **Vite** (or None)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Click **Save and Deploy**. The site is live at `https://<project>.pages.dev`.

Every push to `main` redeploys the site, and other branches get their own preview URL (useful for checking a friend's new chapter before merging). The Node version is pinned by `.nvmrc`. No redirect rules are needed, thanks to the `HashRouter`.

**From your computer, without Git:**

```bash
npm run build
npx wrangler pages deploy dist --project-name thinktwice
```

If the content is invalid, `npm run build` fails, so the deploy stops and the live site stays as it was. The error is in the build log.

### Other free hosts

The same `dist/` folder also works on Vercel (build `npm run build`, output `dist`) and on GitHub Pages. If you ever need an absolute base path, build with `BASE_PATH=/<repo>/ npm run build`.

### Netlify

- **Connected to Git:** go to New site → Import from Git. `netlify.toml` already sets `npm run build` and the `dist` folder.
- **Without Git:** run `npm run build` and drag the `dist/` folder onto app.netlify.com/drop.

---

## Interface language (English / French)

The interface is available in English and French (the **EN | FR** switch in the header). It is detected from the browser on the first visit, then remembered. Course content is not translated; it stays in the language of each subject.

- Translations live in `src/i18n/en.js` and `src/i18n/fr.js`. Each entry is a string with `{placeholders}`, or a function for plurals.
- To add a language, copy `en.js` to `<code>.js`, translate it, and add it to `DICTIONARIES` and `LANGUAGES` in `src/i18n/I18nContext.jsx`.
- `npm run validate` fails if a language file is missing a key, or has a key that `en.js` doesn't have.

## Progress, profiles and privacy

- Progress is stored in each browser's `localStorage` under `thinktwice:progress:<profile>`. Nothing is sent anywhere.
- Several people can share a device: use the profile menu (top right) to add or switch people.
- To move to another device or browser, use **Export** in the profile menu, then **Import** on the other side.
- Questions and flashcards are keyed by their permanent ids, so adding, reordering or editing content keeps everyone's progress. If a question is deleted, its progress is ignored but not lost: it comes back if the question returns.
