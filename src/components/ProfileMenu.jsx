import { useEffect, useRef, useState } from 'react'
import { useProgress } from '../hooks/useProgress'
import { profileName, useI18n } from '../i18n/I18nContext'
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
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState(null)
  const rootRef = useRef(null)
  const fileRef = useRef(null)
  const current = profileName(currentProfile, t)

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
      if (!confirm(t('profile.confirmImport', { name: current }))) return
      importProgress(data)
      setMessage({ ok: true, text: t('profile.imported') })
    } catch (err) {
      setMessage({ ok: false, text: err.message === 'not-thinktwice-export' ? t('profile.notExport') : t('profile.readError') })
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
        <span className="hidden max-w-24 truncate sm:inline">{current}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('profile.who')}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('profile.savedHint')}</p>
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
                  {profileName(p, t)}
                </button>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    aria-label={t('profile.delete', { name: profileName(p, t) })}
                    onClick={() => confirm(t('profile.confirmDelete', { name: profileName(p, t) })) && deleteProfile(p.id)}
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
              placeholder={t('profile.addPlaceholder')}
              aria-label={t('profile.newName')}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
            />
            <Button type="submit" className="px-3" disabled={!name.trim()}>
              {t('profile.add')}
            </Button>
          </form>

          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('profile.progressOf', { name: current })}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={exportProgress}>
                {t('profile.export')}
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                {t('profile.import')}
              </Button>
            </div>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
            <Button
              variant="danger"
              className="mt-2 w-full"
              onClick={() => confirm(t('profile.confirmReset', { name: current })) && resetProgress()}
            >
              {t('profile.reset')}
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
