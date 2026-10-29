import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import FilterPanel, { EMPTY_FILTER } from '../components/FilterPanel'
import Flashcard from '../components/Flashcard'
import { Button, Card, Chip, EmptyState, PageHeader, ProgressBar } from '../components/ui'
import { useProgress } from '../hooks/useProgress'
import { flashcards, matchesFilter, subjectById } from '../lib/content'
import { dayKey } from '../lib/date'
import { shuffle } from '../lib/random'
import { BOX_INTERVAL_DAYS, boxOf, isDue, MAX_BOX } from '../lib/srs'

// A card missed during a session comes back a few cards later in the same session.
const RELEARN_GAP = 3

function BoxSummary({ cards, states }) {
  const counts = Array.from({ length: MAX_BOX + 1 }, () => 0)
  for (const c of cards) counts[boxOf(states[c.id])]++
  const labels = ['New', ...Array.from({ length: MAX_BOX }, (_, i) => `Box ${i + 1}`)]
  return (
    <div className="grid grid-cols-6 gap-1.5 text-center">
      {counts.map((n, i) => (
        <div key={i} className="rounded-lg bg-slate-100 px-1 py-2 dark:bg-slate-800">
          <p className="text-lg font-bold tabular-nums">{n}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{labels[i]}</p>
        </div>
      ))}
    </div>
  )
}

function Session({ deck, onExit }) {
  const { reviewFlashcard } = useProgress()
  const [queue, setQueue] = useState(deck)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState({ knew: 0, missed: 0 })
  const card = queue[0]

  const answer = useCallback(
    (knew) => {
      if (!card) return
      reviewFlashcard(card.id, knew)
      setDone((d) => ({ knew: d.knew + (knew ? 1 : 0), missed: d.missed + (knew ? 0 : 1) }))
      setFlipped(false)
      setQueue((q) => {
        const rest = q.slice(1)
        if (knew) return rest
        const at = Math.min(RELEARN_GAP, rest.length)
        return [...rest.slice(0, at), card, ...rest.slice(at)]
      })
    },
    [card, reviewFlashcard],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === ' ') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && (e.key === 'ArrowRight' || e.key === '2')) answer(true)
      else if (flipped && (e.key === 'ArrowLeft' || e.key === '1')) answer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipped, answer])

  if (!card) {
    return (
      <EmptyState title="Session complete 🎉" action={<Button onClick={onExit}>Back to decks</Button>}>
        {done.knew} known · {done.missed} missed. Missed cards are back in box 1 and will show up again today.
      </EmptyState>
    )
  }

  const reviewed = done.knew + done.missed
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="shrink-0 text-sm font-semibold tabular-nums">{queue.length} left</span>
        <ProgressBar value={done.knew} max={done.knew + queue.length} label="Session progress" />
        <button type="button" onClick={onExit} className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          End
        </button>
      </div>
      <Flashcard key={`${card.id}-${reviewed}`} card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="bad" disabled={!flipped} onClick={() => answer(false)} className="py-3.5">
          I didn't know it
        </Button>
        <Button variant="good" disabled={!flipped} onClick={() => answer(true)} className="py-3.5">
          I knew it
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        {flipped ? 'Be honest — missed cards come back sooner.' : 'Think of the answer first, then flip.'}
        <span className="hidden sm:inline"> · Keys: Space flip · ← didn't know · → knew it</span>
      </p>
    </div>
  )
}

export default function Flashcards() {
  const [params] = useSearchParams()
  const { progress } = useProgress()
  const [filter, setFilter] = useState(() => {
    const s = params.get('subject')
    const c = params.get('chapter')
    const valid = s && subjectById[s]
    return { ...EMPTY_FILTER, subjectIds: valid ? [s] : [], chapterKeys: valid && c ? [`${s}/${c}`] : [] }
  })
  const [deck, setDeck] = useState(null)
  const [mode, setMode] = useState('due')

  const today = dayKey()
  const cards = useMemo(() => flashcards.filter((f) => matchesFilter(f, filter)), [filter])
  const due = useMemo(() => cards.filter((f) => isDue(progress.flashcards[f.id], today)), [cards, progress.flashcards, today])
  const selection = mode === 'due' ? due : cards

  if (deck) return <Session deck={deck} onExit={() => setDeck(null)} />

  // Due cards: lowest box first so the weakest cards are seen first.
  const startDeck = () =>
    setDeck(mode === 'due' ? shuffle(selection).sort((a, b) => boxOf(progress.flashcards[a.id]) - boxOf(progress.flashcards[b.id])) : shuffle(selection))

  return (
    <div>
      <PageHeader title="Flashcards" subtitle="Leitner spaced repetition: cards you know come back less often, cards you miss come back sooner." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <FilterPanel value={filter} onChange={setFilter} items={flashcards} />
        </Card>
        <div className="space-y-4">
          <Card className="space-y-4">
            <BoxSummary cards={cards} states={progress.flashcards} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Box 1 returns today, then {BOX_INTERVAL_DAYS[2]}, {BOX_INTERVAL_DAYS[3]}, {BOX_INTERVAL_DAYS[4]} and {BOX_INTERVAL_DAYS[5]} days.
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip active={mode === 'due'} onClick={() => setMode('due')}>
                Due today ({due.length})
              </Chip>
              <Chip active={mode === 'all'} onClick={() => setMode('all')}>
                All cards ({cards.length})
              </Chip>
            </div>
            <Button className="w-full" disabled={!selection.length} onClick={startDeck}>
              {selection.length ? `Study ${selection.length} card${selection.length === 1 ? '' : 's'}` : 'Nothing due — come back later'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
