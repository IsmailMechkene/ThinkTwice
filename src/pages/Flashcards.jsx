import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import FilterPanel, { EMPTY_FILTER } from '../components/FilterPanel'
import Flashcard from '../components/Flashcard'
import { Button, Card, EmptyState, PageHeader, ProgressBar, SectionTitle, Segmented, StepTitle } from '../components/ui'
import { useProgress } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
import { flashcards, matchesFilter, subjectById } from '../lib/content'
import { dayKey } from '../lib/date'
import { shuffle } from '../lib/random'
import { BOX_INTERVAL_DAYS, boxOf, isDue, MAX_BOX } from '../lib/srs'

// A card missed during a session comes back a few cards later in the same session.
const RELEARN_GAP = 3
const SWIPE_THRESHOLD = 90

// Leitner shelf: one column per box, bar height = share of cards; darker = better known.
const BOX_SHADES = ['#d4d4d4', '#bfd5fe', '#93b8fd', '#6094fa', '#2557eb', '#1e358a']

function BoxSummary({ cards, states }) {
  const { t } = useI18n()
  const counts = Array.from({ length: MAX_BOX + 1 }, () => 0)
  for (const c of cards) counts[boxOf(states[c.id])]++
  const max = Math.max(1, ...counts)
  return (
    <div className="grid grid-cols-6 items-end gap-2 sm:gap-3">
      {counts.map((n, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <span className="text-sm font-bold tabular-nums">{n}</span>
          <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <div
              className="w-full rounded-lg transition-all duration-500"
              style={{ height: `${Math.max(n ? 6 : 0, (n / max) * 100)}%`, background: BOX_SHADES[i] }}
              title={`${i === 0 ? t('cards.new') : t('cards.box', { n: i })}: ${n}`}
            />
          </div>
          <span className="text-center text-[11px] leading-tight font-semibold text-neutral-600 dark:text-neutral-300">
            {i === 0 ? t('cards.new') : t('cards.box', { n: i })}
          </span>
          <span className="text-[10px] text-neutral-400">
            {i === 0 ? '—' : BOX_INTERVAL_DAYS[i] === 0 ? t('cards.today') : t('cards.inDays', { n: BOX_INTERVAL_DAYS[i] })}
          </span>
        </div>
      ))}
    </div>
  )
}

function Session({ deck, onExit }) {
  const { reviewFlashcard } = useProgress()
  const { t } = useI18n()
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

  // Swipe after flipping: right = knew it, left = didn't know.
  const [dx, setDx] = useState(0)
  const drag = useRef(null)
  const onPointerDown = (e) => {
    if (!flipped) return
    drag.current = { x: e.clientX, moved: false }
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const d = e.clientX - drag.current.x
    if (Math.abs(d) > 6) drag.current.moved = true
    setDx(d)
  }
  const onPointerUp = () => {
    if (!drag.current) return
    const d = dx
    setDx(0)
    setTimeout(() => (drag.current = null), 0)
    if (Math.abs(d) > SWIPE_THRESHOLD) answer(d > 0)
  }
  // A drag must not also count as a tap that flips the card back.
  const onClickCapture = (e) => {
    if (drag.current?.moved) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  if (!card) {
    return (
      <EmptyState title={t('session.complete')} action={<Button onClick={onExit}>{t('session.back')}</Button>}>
        {t('session.completeText', { knew: done.knew, missed: done.missed })}
      </EmptyState>
    )
  }

  const reviewed = done.knew + done.missed
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="shrink-0 text-sm font-semibold tabular-nums">{t('session.left', { count: queue.length })}</span>
        <ProgressBar value={done.knew} max={done.knew + queue.length} label={t('session.progress')} />
        <button type="button" onClick={onExit} className="shrink-0 rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          {t('session.end')}
        </button>
      </div>
      <div
        className="relative touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        style={{
          transform: dx ? `translateX(${dx}px) rotate(${dx / 25}deg)` : undefined,
          transition: dx ? 'none' : 'transform 0.25s ease',
        }}
      >
        <div key={`${card.id}-${reviewed}`} className="animate-pop">
          <Flashcard card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
        </div>
        {Math.abs(dx) > 20 && (
          <span
            aria-hidden
            className={`pointer-events-none absolute top-5 rounded-md border-2 px-3 py-1 text-sm font-semibold uppercase ${
              dx > 0 ? 'left-5 -rotate-6 border-emerald-500 text-emerald-600' : 'right-5 rotate-6 border-rose-500 text-rose-600'
            }`}
            style={{ opacity: Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD) }}
          >
            {dx > 0 ? t('session.knewIt') : t('session.didntKnow')}
          </span>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="bad" disabled={!flipped} onClick={() => answer(false)} className="py-3.5">
          {t('session.didntKnow')}
        </Button>
        <Button variant="good" disabled={!flipped} onClick={() => answer(true)} className="py-3.5">
          {t('session.knewIt')}
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-neutral-400">
        {flipped ? t('session.honest') : t('session.thinkFirst')}
        <span className="hidden sm:inline"> · {t('session.keys')}</span>
        <span className="sm:hidden"> · {t('session.swipe')}</span>
      </p>
    </div>
  )
}

export default function Flashcards() {
  const [params] = useSearchParams()
  const { progress } = useProgress()
  const { t } = useI18n()
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
      <PageHeader title={t('cards.title')} subtitle={t('cards.subtitle')} />

      <div className="grid gap-x-6 gap-y-8 lg:grid-cols-[1fr_340px]">
        <div>
          <StepTitle n={1}>{t('step.what')}</StepTitle>
          <Card className="p-5 sm:p-6">
            <FilterPanel value={filter} onChange={setFilter} items={flashcards} />
          </Card>
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <StepTitle n={2}>{t('step.session')}</StepTitle>
          <Card className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('cards.mode')}</p>
              <Segmented
                label={t('cards.mode')}
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'due', label: t('cards.due', { count: due.length }) },
                  { value: 'all', label: t('cards.all', { count: cards.length }) },
                ]}
              />
            </div>
            <div className="rounded-md bg-neutral-50 p-4 text-center dark:bg-neutral-800/60">
              <p className="text-4xl font-semibold tabular-nums">{selection.length}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('cards.inSession')}</p>
            </div>
            <Button className="w-full py-3" disabled={!selection.length} onClick={startDeck}>
              {selection.length ? t('cards.study', { count: selection.length }) : t('cards.nothingDue')}
            </Button>
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
              {t('cards.intervals', { a: BOX_INTERVAL_DAYS[2], b: BOX_INTERVAL_DAYS[3], c: BOX_INTERVAL_DAYS[4], d: BOX_INTERVAL_DAYS[5] })}
            </p>
          </Card>
        </div>
      </div>

      <SectionTitle hint={t('cards.boxesHint')}>{t('cards.boxesTitle')}</SectionTitle>
      <Card className="p-5 sm:p-6">
        <BoxSummary cards={cards} states={progress.flashcards} />
      </Card>
    </div>
  )
}
