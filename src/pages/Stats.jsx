import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ActivityHeatmap from '../components/ActivityHeatmap'
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, ProgressRing, scoreColor, SectionTitle, Stat } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress, useSubjectStats } from '../hooks/useProgress'
import { useI18n } from '../i18n/I18nContext'
import { subjects } from '../lib/content'
import { addDays, formatDay, streakFrom } from '../lib/date'
import { chapterAccuracy, percent } from '../lib/scoring'

const axis = { stroke: 'var(--chart-grid)', tick: { fill: 'var(--chart-axis)', fontSize: 12 }, tickLine: false }

function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold tabular-nums">
        {payload[0].value}
        {unit}
      </p>
    </div>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <Card>
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-4 h-56">{children}</div>
    </Card>
  )
}

export default function Stats() {
  const { progress } = useProgress()
  const { t, locale } = useI18n()
  const { count: mistakes } = useMistakes()

  const days = useMemo(
    () =>
      Object.entries(progress.daily)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([day, d]) => ({
          day: formatDay(day, locale),
          answered: d.answered || 0,
          accuracy: d.answered ? percent(d.correct, d.answered) : null,
          mistakes: d.mistakes ?? 0,
          cards: d.cards || 0,
        })),
    [progress.daily, locale],
  )
  const quizDays = days.filter((d) => d.answered > 0)

  const totals = Object.values(progress.questions).reduce(
    (acc, s) => ({ attempts: acc.attempts + s.attempts, correct: acc.correct + s.correct }),
    { attempts: 0, correct: 0 },
  )
  const cardsReviewed = Object.values(progress.flashcards).reduce((n, s) => n + (s.reviews || 0), 0)
  const weakest = chapterAccuracy(subjects, progress.questions, 3).slice(0, 6)
  const subjectStats = useSubjectStats()

  const activeDays = Object.entries(progress.daily)
    .filter(([, d]) => d.answered || d.cards)
    .map(([k]) => k)
    .sort()
  const streak = streakFrom(activeDays)
  let best = 0
  for (let i = 0, run = 0; i < activeDays.length; i++) {
    run = i > 0 && addDays(activeDays[i - 1], 1) === activeDays[i] ? run + 1 : 1
    best = Math.max(best, run)
  }

  if (!totals.attempts && !cardsReviewed) {
    return (
      <div>
        <PageHeader icon="📊" title={t('stats.title')} />
        <EmptyState title={t('stats.noActivity')} action={<Button to="/quiz">{t('stats.firstQuiz')}</Button>}>
          {t('stats.noActivityHint')}
        </EmptyState>
      </div>
    )
  }

  return (
    <div>
      <PageHeader icon="📊" title={t('stats.title')} subtitle={t('stats.subtitle')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon="✍️" label={t('stats.answers')} value={totals.attempts} />
        <Stat icon="🎯" tone="emerald" label={t('stats.accuracy')} value={totals.attempts ? `${percent(totals.correct, totals.attempts)}%` : '—'} />
        <Stat icon="🧩" tone="rose" label={t('stats.inBank')} value={mistakes} />
        <Stat icon="🏆" tone="amber" label={t('stats.mastered')} value={Object.keys(progress.mastered).length} hint={t('stats.masteredHint')} />
        <Stat icon="🃏" tone="violet" label={t('stats.cardsReviewed')} value={cardsReviewed} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold">{t('stats.activity')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('stats.activityHint')}</p>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-xl font-extrabold tabular-nums">🔥 {streak}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('stats.currentStreak')}</p>
              </div>
              <div>
                <p className="text-xl font-extrabold tabular-nums">{best}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('stats.bestStreak')}</p>
              </div>
              <div>
                <p className="text-xl font-extrabold tabular-nums">{activeDays.length}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('stats.activeDays')}</p>
              </div>
            </div>
          </div>
          <ActivityHeatmap daily={progress.daily} />
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="font-bold">{t('stats.mastery')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('stats.masteryHint')}</p>
          <ul className="mt-4 space-y-4">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center gap-4">
                <ProgressRing value={subjectStats[s.id].mastery} color={s.color} size={52} label={`${s.name} ${subjectStats[s.id].mastery}%`} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {s.icon} {s.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('subjectCard.done', { done: subjectStats[s.id].done, total: subjectStats[s.id].total })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <SectionTitle>{t('stats.weakest')}</SectionTitle>
      {weakest.length === 0 ? (
        <Card className="text-sm text-slate-500">{t('stats.weakestEmpty')}</Card>
      ) : (
        <Card className="space-y-4">
          {weakest.map((w) => (
            <div key={w.key} className="flex items-center gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="text-slate-500">
                      {w.subject.icon} {w.subject.name} ·{' '}
                    </span>
                    {w.chapter.title}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {w.pct}% <span className="font-normal text-slate-500">({w.attempts})</span>
                  </span>
                </div>
                <ProgressBar value={w.pct} color={scoreColor(w.pct)} label={`${w.chapter.title} ${w.pct}%`} />
              </div>
              <Button
                variant="secondary"
                className="shrink-0 px-3 py-1.5 text-xs sm:text-sm"
                to={`/quiz?subject=${encodeURIComponent(w.subject.id)}&chapter=${encodeURIComponent(w.chapter.key)}`}
              >
                {t('stats.practice')}
              </Button>
            </div>
          ))}
        </Card>
      )}

      <SectionTitle>{t('stats.overTime')}</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('stats.accuracyPerDay')} subtitle={t('stats.accuracyPerDayHint')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={quizDays} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="day" {...axis} />
              <YAxis domain={[0, 100]} {...axis} axisLine={false} unit="%" />
              <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="var(--chart-series)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'var(--chart-series)', stroke: 'var(--chart-surface)', strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('stats.answeredPerDay')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quizDays} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="day" {...axis} />
              <YAxis allowDecimals={false} {...axis} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--chart-grid)', opacity: 0.5 }} />
              <Bar dataKey="answered" fill="var(--chart-series)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('stats.bankSize')} subtitle={t('stats.bankSizeHint')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={days} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="day" {...axis} />
              <YAxis allowDecimals={false} {...axis} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }} />
              <Line
                type="stepAfter"
                dataKey="mistakes"
                stroke="var(--chart-series)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'var(--chart-series)', stroke: 'var(--chart-surface)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <h3 className="font-semibold">{t('stats.dailyLog')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('stats.dailyLogHint')}</p>
          <div className="mt-3 max-h-56 overflow-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-white text-left text-xs text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="py-1 font-semibold">{t('stats.colDay')}</th>
                  <th className="py-1 text-right font-semibold">{t('stats.colAnswered')}</th>
                  <th className="py-1 text-right font-semibold">{t('stats.colAccuracy')}</th>
                  <th className="py-1 text-right font-semibold">{t('stats.colCards')}</th>
                  <th className="py-1 text-right font-semibold">{t('stats.colMistakes')}</th>
                </tr>
              </thead>
              <tbody>
                {[...days].reverse().map((d) => (
                  <tr key={d.day} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5">{d.day}</td>
                    <td className="py-1.5 text-right">{d.answered}</td>
                    <td className="py-1.5 text-right">{d.accuracy == null ? '—' : `${d.accuracy}%`}</td>
                    <td className="py-1.5 text-right">{d.cards}</td>
                    <td className="py-1.5 text-right">{d.mistakes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {progress.sessions.length > 0 && (
        <>
          <SectionTitle>{t('stats.recent')}</SectionTitle>
          <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
            {[...progress.sessions]
              .reverse()
              .slice(0, 8)
              .map((s) => (
                <div key={s.at} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span>
                    {formatDay(s.day, locale)} <Badge className="ml-2">{t(`mode.${s.mode}`)}</Badge>
                  </span>
                  <span className="flex items-center gap-3 tabular-nums">
                    <span className="text-slate-500 dark:text-slate-400">
                      {s.correct}/{s.total}
                    </span>
                    <span
                      className="w-14 rounded-full py-0.5 text-center text-xs font-bold text-white"
                      style={{ background: scoreColor(percent(s.correct, s.total)) }}
                    >
                      {percent(s.correct, s.total)}%
                    </span>
                  </span>
                </div>
              ))}
          </Card>
        </>
      )}
    </div>
  )
}
