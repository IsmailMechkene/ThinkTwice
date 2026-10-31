import { Link } from 'react-router'

const cx = (...c) => c.filter(Boolean).join(' ')

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-900',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950',
  good: 'bg-emerald-600 text-white hover:bg-emerald-500',
  // For use on the brand gradient
  light: 'bg-white text-indigo-700 shadow-sm hover:bg-indigo-50',
  glass: 'bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25',
  bad: 'bg-rose-600 text-white hover:bg-rose-500',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed'

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
        'rounded-full border px-3 py-1.5 text-sm font-medium transition',
        active
          ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500',
      )}
    >
      {color && <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

const BADGE_TONES = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  easy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  hard: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  core: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  bonus: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export function Badge({ tone = 'neutral', children, className }) {
  return (
    <span className={cx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', BADGE_TONES[tone], className)}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, max = 100, color = '#4f46e5', className, label }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, icon }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <span
            aria-hidden
            className="brand-fill grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-3xl text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ children, hint, action }) {
  return (
    <div className="mt-10 mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold">{children}</h2>
        {hint && <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

// Two-or-more option switch (e.g. "Due today | All cards").
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition',
            value === o.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
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
  return pct >= 75 ? '#059669' : pct >= 50 ? '#d97706' : '#e11d48'
}

export function EmptyState({ title, children, action }) {
  return (
    <Card className="py-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-slate-600 dark:text-slate-400">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}

const STAT_TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300',
}

export function Stat({ label, value, hint, icon, tone = 'indigo' }) {
  return (
    <Card className="flex items-start gap-3 p-4">
      {icon && <span className={cx('hidden h-10 w-10 sm:grid shrink-0 place-items-center rounded-xl text-lg', STAT_TONES[tone])} aria-hidden>{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    </Card>
  )
}

// Circular progress (0–100). Text stays in neutral ink; the ring carries the colour.
export function ProgressRing({ value, size = 56, stroke = 6, color = '#4f46e5', label, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value || 0))
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-slate-800" />
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )}
      </svg>
      <span className="absolute text-xs font-bold tabular-nums">{children ?? `${Math.round(pct)}%`}</span>
    </span>
  )
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500 dark:bg-slate-700" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </span>
    </label>
  )
}

export { cx }
