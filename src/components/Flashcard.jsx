import { chapterLabel } from '../lib/content'
import Icon from './Icon'
import RichText from './RichText'
import { Badge } from './ui'

const KIND_LABEL = { definition: 'Definition', formula: 'Formula', distinction: 'Distinction', why: 'Why / How' }

export default function Flashcard({ card, flipped, onFlip }) {
  const face = 'flip-face flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:min-h-80 sm:p-8 dark:border-slate-800 dark:bg-slate-900'
  return (
    <div className="flip-card">
      <button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? 'Show question side' : 'Show answer side'}
        className={`flip-inner block w-full text-left ${flipped ? 'is-flipped' : ''}`}
      >
        <div className={face}>
          <div className="flex flex-wrap items-center gap-1.5">
            {card.kind && <Badge>{KIND_LABEL[card.kind] || card.kind}</Badge>}
            <Badge tone={card.tier}>{card.tier === 'core' ? 'Core' : 'Bonus'}</Badge>
          </div>
          <p className="my-auto py-6 text-center text-xl leading-relaxed font-semibold sm:text-2xl">
            <RichText text={card.front} />
          </p>
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Icon name="flip" className="h-4 w-4" /> Tap or press Space to flip
          </p>
        </div>
        <div className={`${face} flip-back border-indigo-200 dark:border-indigo-900`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Answer</p>
          <p className="my-auto py-6 text-center text-lg leading-relaxed sm:text-xl">
            <RichText text={card.back} />
          </p>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {chapterLabel(card)} · {card.ref} · {card.sourceLabel}
          </p>
        </div>
      </button>
    </div>
  )
}
