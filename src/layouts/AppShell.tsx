import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { ToastContainer } from '../components/ui/Toast'
import { useParlayStore } from '../stores/parlayStore'
import { useSoccerBetSlipStore } from '../stores/soccerBetSlipStore'
import { useThemeStore } from '../stores/themeStore'
import ParlaySlip from '../components/ParlaySlip'
import SoccerBetSlipFloat from '../components/soccer/SoccerBetSlipFloat'

const navItems = [
  { to: '/', label: '探索' },
  { to: '/soccer', label: '足球' },
  { to: '/clob', label: '足球撮合', badge: '新' },
  { to: '/events', label: '预测市场' },
  { to: '/copy', label: '跟单' },
  { to: '/portfolio', label: '资产' },
  { to: '/leaderboard', label: '排行榜' },
]

export default function AppShell() {
  const location = useLocation()
  const hasLegs = useParlayStore((s) => s.slip.length > 0)
  const soccerItemsCount = useSoccerBetSlipStore((s) => s.items.length)
  // 只有在非 SoccerMatchPage 时浮动条才显示，需要给 main 底部留白避免遮挡
  const hasSoccerFloat =
    soccerItemsCount > 0 && !location.pathname.startsWith('/soccer/match/')
  const { theme, toggleTheme } = useThemeStore()

  // 移动端底部浮动条累积高度：ParlayBar ~40px + SoccerBetSlipBar ~40px，基础 tab bar 56px
  const mainBottomPadClass =
    hasLegs && hasSoccerFloat
      ? 'pb-[136px]'
      : hasLegs || hasSoccerFloat
        ? 'pb-[96px]'
        : 'pb-20'

  return (
    <div className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col overflow-x-clip">
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
              {item.badge && (
                <span className="ml-1 text-[9px] font-bold bg-[#2DD4BF] text-[#0B0B0F] px-1 py-0.5 rounded leading-none">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)]">预测市场与体育交易</span>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
            title={theme === 'dark' ? '切换为浅色模式' : '切换为深色模式'}
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

      {/* Main content — extra bottom padding when floating slip bars are visible on mobile */}
      <main className={`flex-1 md:pb-0 ${mainBottomPadClass}`}>
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
      <SoccerBetSlipFloat />
      <ToastContainer />
    </div>
  )
}

function MobileIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#2DD4BF' : 'var(--text-secondary)'
  if (name === '探索') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" />
        <path d="M8 12l4.5-4.5M12.5 7.5L11 11l-3 1 1.5-4.5z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === '预测市场') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3L12.5 8H17L13.5 11.5L15 17L10 13.5L5 17L6.5 11.5L3 8H7.5L10 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === '资产') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="11" y="3" width="6" height="14" rx="1" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }
  if (name === '排行榜') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="10" width="4" height="7" rx="0.5" stroke={color} strokeWidth="1.5" />
        <rect x="8" y="4" width="4" height="13" rx="0.5" stroke={color} strokeWidth="1.5" />
        <rect x="13" y="7" width="4" height="10" rx="0.5" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }
  return null
}
