import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useMistakes } from '../hooks/useMistakes'
import { useTheme } from '../hooks/useTheme'
import { useI18n } from '../i18n/I18nContext'
import { storageAvailable } from '../lib/storage'
import Icon from './Icon'
import LanguageSwitch from './LanguageSwitch'
import ProfileMenu from './ProfileMenu'

const NAV = [
  { to: '/', key: 'nav.home', icon: 'home', end: true },
  { to: '/quiz', key: 'nav.quiz', icon: 'quiz' },
  { to: '/flashcards', key: 'nav.flashcards', icon: 'cards' },
  { to: '/mistakes', key: 'nav.mistakes', icon: 'mistakes' },
  { to: '/stats', key: 'nav.stats', icon: 'stats' },
]

function CountBadge({ n }) {
  if (!n) return null
  return (
    <span className="ml-1.5 rounded-sm bg-rose-600 px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">
      {n > 99 ? '99+' : n}
    </span>
  )
}

export default function Layout() {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { count: mistakes } = useMistakes()
  const [canSave] = useState(storageAvailable)

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-stone-300 bg-[var(--paper)] dark:border-stone-800">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <NavLink to="/" className="font-serif text-xl leading-none tracking-tight">
            Think<em className="text-accent-700 dark:text-accent-300">Twice</em>
          </NavLink>
          <nav className="ml-6 hidden h-full items-stretch gap-5 md:flex" aria-label={t('nav.main')}>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `-mb-px flex items-center border-b-2 text-sm transition ${
                    isActive
                      ? 'border-stone-900 font-medium text-stone-900 dark:border-stone-100 dark:text-stone-100'
                      : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                  }`
                }
              >
                {t(n.key)}
                {n.to === '/mistakes' && <CountBadge n={mistakes} />}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitch />
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
              className="rounded-md p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      {!canSave && (
        <p role="alert" className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {t('storage.unavailable')}
        </p>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <Outlet key={pathname} />
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-300 bg-[var(--paper)] pb-[env(safe-area-inset-bottom)] md:hidden dark:border-stone-800"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'
              }`
            }
          >
            <Icon name={n.icon} />
            {t(n.key)}
            {n.to === '/mistakes' && mistakes > 0 && (
              <span className="absolute top-1 right-[22%] h-2 w-2 rounded-full bg-rose-500" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
