import { NavLink, Outlet } from 'react-router'
import { useMistakes } from '../hooks/useMistakes'
import { useTheme } from '../hooks/useTheme'
import Icon from './Icon'
import ProfileMenu from './ProfileMenu'

const NAV = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/quiz', label: 'Quiz', icon: 'quiz' },
  { to: '/flashcards', label: 'Flashcards', icon: 'cards' },
  { to: '/mistakes', label: 'Mistakes', icon: 'mistakes' },
  { to: '/stats', label: 'Stats', icon: 'stats' },
]

function CountBadge({ n }) {
  if (!n) return null
  return (
    <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] leading-4 font-bold text-white tabular-nums">
      {n > 99 ? '99+' : n}
    </span>
  )
}

export default function Layout() {
  const { theme, toggle } = useTheme()
  const { count: mistakes } = useMistakes()

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <NavLink to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm text-white">T²</span>
            <span className="text-lg">ThinkTwice</span>
          </NavLink>
          <nav className="ml-4 hidden items-center gap-1 sm:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                {n.label}
                {n.to === '/mistakes' && <CountBadge n={mistakes} />}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <Outlet />
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon name={n.icon} />
            {n.label}
            {n.to === '/mistakes' && mistakes > 0 && (
              <span className="absolute top-1 right-[22%] h-2 w-2 rounded-full bg-rose-500" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
