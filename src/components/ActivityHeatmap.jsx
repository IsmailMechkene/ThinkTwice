import { useMemo } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { addDays, dayKey, formatDay } from '../lib/date'

const WEEKS = 26
const LEVELS = [0, 1, 10, 20, 30] // activity (answers + cards) needed for each shade

function level(n) {
  if (!n) return 0
  let l = 1
  for (let i = 1; i < LEVELS.length; i++) if (n >= LEVELS[i]) l = i
  return l
}

// GitHub-style calendar of the last WEEKS weeks (columns = weeks starting Monday).
// Cells are square and scale with the card width.
export default function ActivityHeatmap({ daily }) {
  const { t, locale } = useI18n()
  const today = dayKey()

  const { cells, months } = useMemo(() => {
    const mondayOffset = (new Date().getDay() + 6) % 7
    const start = addDays(today, -mondayOffset - (WEEKS - 1) * 7)
    const out = []
    const labels = []
    let lastMonth = null
    for (let w = 0; w < WEEKS; w++) {
      for (let i = 0; i < 7; i++) {
        const key = addDays(start, w * 7 + i)
        const a = daily[key]
        out.push({ key, n: (a?.answered || 0) + (a?.cards || 0), future: key > today })
      }
      const month = addDays(start, w * 7).slice(0, 7)
      if (month !== lastMonth) {
        const [y, m] = month.split('-').map(Number)
        if (w > 0 || WEEKS > 1) labels.push({ w, text: new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'short' }) })
        lastMonth = month
      }
    }
    return { cells: out, months: labels }
  }, [daily, today, locale])

  return (
    <div>
      <div className="flex gap-2">
        <div className="grid shrink-0 grid-rows-7 gap-[3px] pt-5 text-[10px] text-slate-400">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span key={i} className="flex items-center">
              {i % 2 === 0 ? new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }) : ''}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative mb-1 h-4 text-[10px] text-slate-500 dark:text-slate-400">
            {months.map((m) => (
              <span key={m.w} className="absolute" style={{ left: `${(m.w / WEEKS) * 100}%` }}>
                {m.text}
              </span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
            {cells.map((c) => (
              <span
                key={c.key}
                title={c.future ? '' : t('stats.dayTip', { date: formatDay(c.key, locale), count: c.n })}
                className={`aspect-square rounded-[3px] ${c.key === today ? 'ring-2 ring-slate-400 dark:ring-slate-500' : ''}`}
                style={{ background: c.future ? 'transparent' : `var(--heat-${level(c.n)})` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-400">
        {t('stats.less')}
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="h-3 w-3 rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
        ))}
        {t('stats.more')}
      </div>
    </div>
  )
}
