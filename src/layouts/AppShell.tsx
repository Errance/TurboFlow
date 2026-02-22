import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { ToastContainer } from '../components/ui/Toast'

const navItems = [
  { to: '/', label: 'Explore' },
  { to: '/strategies', label: 'Strategies' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

export default function AppShell() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex flex-col">
      {/* Desktop top nav */}
      <header className="hidden md:flex items-center h-14 px-6 border-b border-[#252536] bg-[#0B0B0F] sticky top-0 z-30">
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
                    : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto text-xs text-[#8A8A9A]">
          Prediction Market Prototype
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B0B0F] border-t border-[#252536] flex">
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
                isActive ? 'text-[#2DD4BF]' : 'text-[#8A8A9A]'
              }`}
            >
              <MobileIcon name={item.label} active={isActive} />
              <span className="mt-1">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <ToastContainer />
    </div>
  )
}

function MobileIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#2DD4BF' : '#8A8A9A'
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
  if (name === 'Strategies') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 5.5h12M4 10h12M4 14.5h7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14.5" cy="14.5" r="1.5" stroke={color} strokeWidth="1.5" />
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
