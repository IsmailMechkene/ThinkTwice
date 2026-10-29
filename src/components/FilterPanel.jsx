import { useMemo } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { allSourceLabels, DIFFICULTIES, subjects } from '../lib/content'
import Icon from './Icon'
import { Chip, cx, Toggle } from './ui'

export const EMPTY_FILTER = { subjectIds: [], chapterKeys: [], difficulties: [], sources: [], coreOnly: false }

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function Label({ children, hint }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{children}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function CountBadge({ n }) {
  return (
    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 tabular-nums dark:bg-slate-800 dark:text-slate-300">
      {n}
    </span>
  )
}

// Empty selection in a group means "all". `items` (questions or flashcards) gives the counts and sources.
export default function FilterPanel({ value, onChange, items, showDifficulty = false }) {
  const { t } = useI18n()
  const set = (patch) => onChange({ ...value, ...patch })
  const visibleSubjects = subjects.length === 1 ? subjects : subjects.filter((s) => value.subjectIds.includes(s.id))
  const sources = allSourceLabels(items)

  const counts = useMemo(() => {
    const bySubject = {}
    const byChapter = {}
    for (const it of items) {
      bySubject[it.subjectId] = (bySubject[it.subjectId] || 0) + 1
      const k = `${it.subjectId}/${it.chapterKey}`
      byChapter[k] = (byChapter[k] || 0) + 1
    }
    return { bySubject, byChapter }
  }, [items])

  const advancedCount = value.difficulties.length + value.sources.length

  return (
    <div className="space-y-6">
      {subjects.length > 1 && (
        <div>
          <Label hint={t('filter.noneMeansAll')}>{t('filter.subjects')}</Label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {subjects.map((s) => {
              const on = value.subjectIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    set({
                      subjectIds: toggleIn(value.subjectIds, s.id),
                      chapterKeys: value.chapterKeys.filter((k) => !k.startsWith(`${s.id}/`)),
                    })
                  }
                  className={cx(
                    'relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition',
                    on
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: `${s.color}1f` }} aria-hidden>
                    {s.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('subjectCard.chapters', { count: s.chapters.length })}</span>
                  </span>
                  <CountBadge n={counts.bySubject[s.id] || 0} />
                  {on && (
                    <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-white">
                      <Icon name="check" className="h-3 w-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {visibleSubjects.length > 0 && (
        <div>
          <Label hint={t('filter.noneMeansAll')}>{t('filter.chapters')}</Label>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {visibleSubjects.flatMap((s) =>
              s.chapters.map((c, i) => {
                const key = `${s.id}/${c.key}`
                const on = value.chapterKeys.includes(key)
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => set({ chapterKeys: toggleIn(value.chapterKeys, key) })}
                        className="h-4 w-4 shrink-0 rounded accent-indigo-600"
                      />
                      <span className="w-5 shrink-0 text-xs font-bold text-slate-400 tabular-nums">{c.order ?? i + 1}</span>
                      <span className="min-w-0 flex-1 text-sm font-medium">
                        {visibleSubjects.length > 1 && <span aria-hidden>{s.icon} </span>}
                        {c.title}
                      </span>
                      <CountBadge n={counts.byChapter[key] || 0} />
                    </label>
                  </li>
                )
              }),
            )}
          </ul>
        </div>
      )}

      <Toggle checked={value.coreOnly} onChange={(coreOnly) => set({ coreOnly })} label={t('filter.coreOnly')} hint={t('filter.coreOnlyHint')} />

      {(showDifficulty || sources.length > 1) && (
        <details className="group rounded-xl border border-slate-200 dark:border-slate-800" open={advancedCount > 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm font-semibold">
            <span>
              {t('filter.more')}
              {advancedCount > 0 && <span className="ml-2 rounded-full bg-indigo-600 px-1.5 text-xs text-white">{advancedCount}</span>}
            </span>
            <Icon name="arrow" className="h-4 w-4 rotate-90 text-slate-400 transition group-open:-rotate-90" />
          </summary>
          <div className="space-y-5 border-t border-slate-200 p-3.5 dark:border-slate-800">
            {showDifficulty && (
              <div>
                <Label>{t('filter.difficulty')}</Label>
                <div className="flex flex-wrap gap-2">
                  <Chip active={!value.difficulties.length} onClick={() => set({ difficulties: [] })}>
                    {t('filter.any')}
                  </Chip>
                  {DIFFICULTIES.map((d) => (
                    <Chip key={d} active={value.difficulties.includes(d)} onClick={() => set({ difficulties: toggleIn(value.difficulties, d) })}>
                      {t(`difficulty.${d}`)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {sources.length > 1 && (
              <div>
                <Label>{t('filter.source')}</Label>
                <div className="flex flex-wrap gap-2">
                  <Chip active={!value.sources.length} onClick={() => set({ sources: [] })}>
                    {t('filter.allSources')}
                  </Chip>
                  {sources.map((src) => (
                    <Chip key={src} active={value.sources.includes(src)} onClick={() => set({ sources: toggleIn(value.sources, src) })}>
                      {src}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
