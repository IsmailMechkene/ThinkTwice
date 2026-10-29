import { useI18n } from '../i18n/I18nContext'
import { allSourceLabels, DIFFICULTIES, subjects } from '../lib/content'
import { Chip, Toggle } from './ui'

export const EMPTY_FILTER = { subjectIds: [], chapterKeys: [], difficulties: [], sources: [], coreOnly: false }

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function Row({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

// Empty selection in a row means "all". `items` is the pool used to list sources.
export default function FilterPanel({ value, onChange, items, showDifficulty = false }) {
  const { t } = useI18n()
  const set = (patch) => onChange({ ...value, ...patch })
  const visibleSubjects = subjects.length === 1 ? subjects : subjects.filter((s) => value.subjectIds.includes(s.id))
  const sources = allSourceLabels(items)

  return (
    <div className="space-y-5">
      {subjects.length > 1 && (
        <Row label={t('filter.subjects')}>
          <Chip active={!value.subjectIds.length} onClick={() => set({ subjectIds: [], chapterKeys: [] })}>
            {t('filter.allSubjects')}
          </Chip>
          {subjects.map((s) => (
            <Chip
              key={s.id}
              color={s.color}
              active={value.subjectIds.includes(s.id)}
              onClick={() =>
                set({
                  subjectIds: toggleIn(value.subjectIds, s.id),
                  chapterKeys: value.chapterKeys.filter((k) => !k.startsWith(`${s.id}/`)),
                })
              }
            >
              {s.icon} {s.name}
            </Chip>
          ))}
        </Row>
      )}

      {visibleSubjects.length > 0 && (
        <Row label={t('filter.chapters')}>
          <Chip active={!value.chapterKeys.length} onClick={() => set({ chapterKeys: [] })}>
            {t('filter.allChapters')}
          </Chip>
          {visibleSubjects.flatMap((s) =>
            s.chapters.map((c) => {
              const key = `${s.id}/${c.key}`
              return (
                <Chip key={key} active={value.chapterKeys.includes(key)} onClick={() => set({ chapterKeys: toggleIn(value.chapterKeys, key) })}>
                  {visibleSubjects.length > 1 ? `${s.icon} ` : ''}
                  {c.title}
                </Chip>
              )
            }),
          )}
        </Row>
      )}

      {showDifficulty && (
        <Row label={t('filter.difficulty')}>
          <Chip active={!value.difficulties.length} onClick={() => set({ difficulties: [] })}>
            {t('filter.any')}
          </Chip>
          {DIFFICULTIES.map((d) => (
            <Chip key={d} active={value.difficulties.includes(d)} onClick={() => set({ difficulties: toggleIn(value.difficulties, d) })}>
              {t(`difficulty.${d}`)}
            </Chip>
          ))}
        </Row>
      )}

      {sources.length > 1 && (
        <Row label={t('filter.source')}>
          <Chip active={!value.sources.length} onClick={() => set({ sources: [] })}>
            {t('filter.allSources')}
          </Chip>
          {sources.map((src) => (
            <Chip key={src} active={value.sources.includes(src)} onClick={() => set({ sources: toggleIn(value.sources, src) })}>
              {src}
            </Chip>
          ))}
        </Row>
      )}

      <Toggle
        checked={value.coreOnly}
        onChange={(coreOnly) => set({ coreOnly })}
        label={t('filter.coreOnly')}
        hint={t('filter.coreOnlyHint')}
      />
    </div>
  )
}
