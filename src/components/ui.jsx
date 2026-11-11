import { Link } from 'react-router'

const cx = (...c) => c.filter(Boolean).join(' ')

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cx(
        'rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

const VARIANTS = {
  primary:
    'bg-accent-600 text-white hover:bg-accent-700 disabled:bg-neutral-300 disabled:text-neutral-500 dark:bg-accent-500 dark:hover:bg-accent-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500',
  secondary:
    'border border-neutral-300 bg-white text-neutral-900 hover:border-accent-500 hover:text-accent-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-accent-400 dark:hover:text-accent-300',
  ghost: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
  danger: 'border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950',
  good: 'bg-emerald-600 text-white hover:bg-emerald-500',
  bad: 'bg-rose-600 text-white hover:bg-rose-500',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:cursor-not-allowed'

export function Button({ variant = 'primary', className, to, ...rest }) {
  const cls = cx(BASE, VARIANTS[variant], className)
  if (to) return <Link to={to} className={cls} {...rest} />
  return <button type="button" className={cls} {...rest} />
}

export function Chip({ active, onClick, children, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'rounded-md border px-3 py-1.5 text-sm transition',
        active
          ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500',
      )}
    >
      {color && <span className="mr-1.5 inline-block h-2 w-2 rounded-[1px]" style={{ background: color }} />}
      {children}
    </button>
  )
}

const BADGE_TONES = {
  neutral: 'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  easy: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  hard: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300',
  core: 'border-accent-200 bg-accent-50 text-accent-800 dark:border-accent-800 dark:bg-accent-950 dark:text-accent-300',
  bonus: 'border-dashed border-neutral-400 text-neutral-500 dark:border-neutral-600 dark:text-neutral-400',
}

export function Badge({ tone = 'neutral', children, className }) {
  return (
    <span className={cx('inline-flex items-center rounded-md border px-1.5 py-px font-mono text-[11px] tracking-wide uppercase', BADGE_TONES[tone], className)}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, max = 100, color = 'var(--accent)', className, label }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      className={cx('h-1.5 w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-medium sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ children, hint, action }) {
  return (
    <div className="mt-10 mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-xl font-medium">{children}</h2>
        {hint && <p className="text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

// Numbered step heading for multi-part forms ("1 What to revise").
export function StepTitle({ n, children }) {
  return (
    <p className="mb-3 flex items-baseline gap-2.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center self-center rounded-[3px] bg-accent-600 font-mono text-[11px] text-white dark:bg-accent-500">
        {n}
      </span>
      <span className="font-display text-lg">{children}</span>
    </p>
  )
}

// Two-or-more option switch (e.g. "Due today | All cards").
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-[2px] px-3 py-2 text-sm font-medium transition',
            value === o.value
              ? 'bg-accent-600 text-white dark:bg-accent-500'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Accuracy-to-status colour (always shown next to the number, never alone).
export function scoreColor(pct) {
  return pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#e11d48'
}

export function EmptyState({ title, children, action }) {
  return (
    <Card className="py-12 text-center">
      <p className="font-display text-2xl">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-neutral-600 dark:text-neutral-400">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}

const STAT_TONES = {
  accent: 'border-accent-500',
  emerald: 'border-emerald-500',
  rose: 'border-rose-500',
  amber: 'border-amber-500',
  violet: 'border-teal-500',
}

// A ruled figure; the rule carries the colour, the number stays in ink.
export function Stat({ label, value, hint, tone = 'accent' }) {
  return (
    <div className={cx('min-w-0 border-t-[3px] pt-2', STAT_TONES[tone] || STAT_TONES.accent)}>
      <p className="eyebrow truncate">{label}</p>
      <p className="mt-1.5 font-display text-4xl leading-none">{value}</p>
      {hint && <p className="mt-1.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>}
    </div>
  )
}

// Circular progress (0–100). Text stays in neutral ink; the ring carries the colour.
export function ProgressRing({ value, size = 56, stroke = 6, color = 'var(--accent)', label, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value || 0))
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-neutral-200 dark:stroke-neutral-800" />
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={`${(pct / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ stroke: color, transition: 'stroke-dasharray 0.6s ease' }}
          />
        )}
      </svg>
      <span className="absolute text-xs tabular-nums">{children ?? `${Math.round(pct)}%`}</span>
    </span>
  )
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-accent-600 dark:peer-checked:bg-accent-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-500 dark:bg-neutral-700" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>}
      </span>
    </label>
  )
}

export { cx }
