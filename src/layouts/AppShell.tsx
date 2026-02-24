import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { ToastContainer } from '../components/ui/Toast'
import { useParlayStore } from '../stores/parlayStore'
import { useThemeStore } from '../stores/themeStore'
import ParlaySlip from '../components/ParlaySlip'

const navItems = [
  { to: '/', label: 'Explore' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

export default function AppShell() {
  const location = useLocation()
  const hasLegs = useParlayStore((s) => s.slip.length > 0)
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col overflow-x-hidden">
      {/* Desktop top nav */}
      <header className="hidden md:flex items-center h-14 px-6 border-b border-[var(--border)] bg-[var(--bg-base)] sticky top-0 z-30">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-7 h-7 rounded-full bg-[#2DD4BF] flex items-center justify-center">
            <span className="text-[#0B0B0F] text-xs font-bold">TF</span>
          </div>
          <span className="font-semibold text-base">TurboFlow</span>
        </div>
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'text-[#2DD4BF] bg-[#2DD4BF]/10'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)]">Prediction Market Prototype</span>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile top bar with theme toggle */}
      <div className="md:hidden flex items-center justify-between h-11 px-4 border-b border-[var(--border)] bg-[var(--bg-base)] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#2DD4BF] flex items-center justify-center">
            <span className="text-[#0B0B0F] text-[10px] font-bold">TF</span>
          </div>
          <span className="font-semibold text-sm">TurboFlow</span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Main content — extra bottom padding when ParlayBar visible on mobile */}
      <main className={`flex-1 md:pb-0 ${hasLegs ? 'pb-[96px]' : 'pb-20'}`}>
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-base)] border-t border-[var(--border)] flex">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs font-medium transition-colors ${
                isActive ? 'text-[#2DD4BF]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <MobileIcon name={item.label} active={isActive} />
              <span className="mt-1">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <ParlaySlip />
      <ToastContainer />
    </div>
  )
}

function MobileIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#2DD4BF' : 'var(--text-secondary)'
  if (name === 'Explore') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" />
        <path d="M8 12l4.5-4.5M12.5 7.5L11 11l-3 1 1.5-4.5z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'Portfolio') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="11" y="3" width="6" height="14" rx="1" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }
  // Leaderboard
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="10" width="4" height="7" rx="0.5" stroke={color} strokeWidth="1.5" />
      <rect x="8" y="4" width="4" height="13" rx="0.5" stroke={color} strokeWidth="1.5" />
      <rect x="13" y="7" width="4" height="10" rx="0.5" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}
