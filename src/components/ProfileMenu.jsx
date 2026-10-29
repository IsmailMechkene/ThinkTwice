import { useEffect, useRef, useState } from 'react'
import { useProgress } from '../hooks/useProgress'
import Icon from './Icon'
import { Button } from './ui'

export default function ProfileMenu() {
  const {
    profiles,
    currentProfile,
    switchProfile,
    addProfile,
    deleteProfile,
    exportProgress,
    importProgress,
    resetProgress,
  } = useProgress()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState(null)
  const rootRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  async function onImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!confirm(`Replace the progress of "${currentProfile.name}" with this file?`)) return
      importProgress(data)
      setMessage({ ok: true, text: 'Progress imported.' })
    } catch (err) {
      setMessage({ ok: false, text: err.message || 'Could not read this file.' })
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Icon name="user" />
        <span className="max-w-24 truncate">{currentProfile.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Who is studying?</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Progress is saved in this browser, separately for each person.
          </p>
          <ul className="mt-3 space-y-1">
            {profiles.map((p) => (
              <li key={p.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => switchProfile(p.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-left text-sm ${
                    p.id === currentProfile.id
                      ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.name}
                </button>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Delete profile ${p.name}`}
                    onClick={() => confirm(`Delete "${p.name}" and all their progress on this device?`) && deleteProfile(p.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              addProfile(name)
              setName('')
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add a person…"
              aria-label="New profile name"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
            />
            <Button type="submit" className="px-3" disabled={!name.trim()}>
              Add
            </Button>
          </form>

          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress of {currentProfile.name}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={exportProgress}>
                Export
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Import
              </Button>
            </div>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
            <Button
              variant="danger"
              className="mt-2 w-full"
              onClick={() => confirm(`Erase all progress of "${currentProfile.name}"? This cannot be undone.`) && resetProgress()}
            >
              Reset progress
            </Button>
            {message && (
              <p className={`mt-2 text-xs ${message.ok ? 'text-emerald-600' : 'text-rose-600'}`} role="status">
                {message.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
