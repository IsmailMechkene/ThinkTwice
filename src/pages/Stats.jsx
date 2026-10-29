import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Stat } from '../components/ui'
import { useMistakes } from '../hooks/useMistakes'
import { useProgress } from '../hooks/useProgress'
import { subjects } from '../lib/content'
import { formatDay } from '../lib/date'
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
  const { count: mistakes } = useMistakes()

  const days = useMemo(
    () =>
      Object.entries(progress.daily)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([day, d]) => ({
          day: formatDay(day),
          answered: d.answered || 0,
          accuracy: d.answered ? percent(d.correct, d.answered) : null,
          mistakes: d.mistakes ?? 0,
          cards: d.cards || 0,
        })),
    [progress.daily],
  )
  const quizDays = days.filter((d) => d.answered > 0)

  const totals = Object.values(progress.questions).reduce(
    (acc, s) => ({ attempts: acc.attempts + s.attempts, correct: acc.correct + s.correct }),
    { attempts: 0, correct: 0 },
  )
  const cardsReviewed = Object.values(progress.flashcards).reduce((n, s) => n + (s.reviews || 0), 0)
  const weakest = chapterAccuracy(subjects, progress.questions, 3).slice(0, 6)

  if (!totals.attempts && !cardsReviewed) {
    return (
      <div>
        <PageHeader title="Stats" />
        <EmptyState title="No activity yet" action={<Button to="/quiz">Take a first quiz</Button>}>
          Your accuracy, weakest chapters and progress over time will show up here.
        </EmptyState>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Stats" subtitle="Where you stand, and where to focus next." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Answers" value={totals.attempts} />
        <Stat label="Accuracy" value={totals.attempts ? `${percent(totals.correct, totals.attempts)}%` : '—'} />
        <Stat label="In mistake bank" value={mistakes} />
        <Stat label="Mastered" value={Object.keys(progress.mastered).length} hint="Left the mistake bank" />
        <Stat label="Cards reviewed" value={cardsReviewed} />
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold">Weakest chapters</h2>
      {weakest.length === 0 ? (
        <Card className="text-sm text-slate-500">Answer at least 3 questions in a chapter to see it ranked here.</Card>
      ) : (
        <Card className="space-y-4">
          {weakest.map((w) => (
            <div key={w.key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
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
                <ProgressBar value={w.pct} color={w.pct < 50 ? '#e11d48' : w.pct < 75 ? '#d97706' : '#059669'} label={`${w.chapter.title} accuracy`} />
              </div>
              <Button
                variant="secondary"
                className="shrink-0 py-1.5"
                to={`/quiz?subject=${encodeURIComponent(w.subject.id)}&chapter=${encodeURIComponent(w.chapter.key)}`}
              >
                Practice
              </Button>
            </div>
          ))}
        </Card>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold">Progress over time</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Accuracy per day" subtitle="% of questions answered correctly (last 30 active days)">
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

        <ChartCard title="Questions answered per day">
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

        <ChartCard title="Mistake bank size" subtitle="Questions still to fix at the end of each day — going down is good">
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
          <h3 className="font-semibold">Daily log</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">The same data as the charts, as a table.</p>
          <div className="mt-3 max-h-56 overflow-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-white text-left text-xs text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="py-1 font-semibold">Day</th>
                  <th className="py-1 text-right font-semibold">Answered</th>
                  <th className="py-1 text-right font-semibold">Accuracy</th>
                  <th className="py-1 text-right font-semibold">Cards</th>
                  <th className="py-1 text-right font-semibold">Mistakes</th>
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
          <h2 className="mt-8 mb-3 text-lg font-bold">Recent sessions</h2>
          <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
            {[...progress.sessions]
              .reverse()
              .slice(0, 8)
              .map((s) => (
                <div key={s.at} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span>
                    {formatDay(s.day)} <Badge className="ml-2">{s.mode}</Badge>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {s.correct}/{s.total} · {percent(s.correct, s.total)}%
                  </span>
                </div>
              ))}
          </Card>
        </>
      )}
    </div>
  )
}
