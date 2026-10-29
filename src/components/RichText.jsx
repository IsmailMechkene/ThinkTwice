// Minimal formatting for content strings: `inline code`, **bold**, and line breaks.
export default function RichText({ text, className }) {
  if (!text) return null
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\n)/g)
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p === '\n') return <br key={i} />
        if (p.startsWith('`') && p.endsWith('`') && p.length > 1)
          return (
            <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-slate-800">
              {p.slice(1, -1)}
            </code>
          )
        if (p.startsWith('**') && p.endsWith('**') && p.length > 3) return <strong key={i}>{p.slice(2, -2)}</strong>
        return p
      })}
    </span>
  )
}

export function CodeBlock({ code }) {
  if (!code) return null
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-100 dark:bg-black/60">
      <code>{code}</code>
    </pre>
  )
}
