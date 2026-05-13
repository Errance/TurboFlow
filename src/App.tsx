import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'

const CHUNK_RELOAD_KEY = 'turboFlowChunkReloaded'

function lazyWithReload<T extends ComponentType<unknown>>(loader: () => Promise<{ default: T }>) {
  return lazy(() =>
    loader()
      .then((module) => {
        window.sessionStorage.removeItem(CHUNK_RELOAD_KEY)
        return module
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        const isChunkLoadFailure = message.includes('Failed to fetch dynamically imported module') || message.includes('Importing a module script failed')
        if (isChunkLoadFailure && window.sessionStorage.getItem(CHUNK_RELOAD_KEY) !== '1') {
          window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
          window.location.reload()
        }
        throw error
      }),
  )
}

const EventsPage = lazyWithReload(() => import('./pages/EventsPage'))
const EventDetailPage = lazyWithReload(() => import('./pages/EventDetailPage'))
const PortfolioPage = lazyWithReload(() => import('./pages/PortfolioPage'))
const SportsGamePage = lazyWithReload(() => import('./pages/SportsGamePage'))
const ContractDetailPage = lazyWithReload(() => import('./pages/ContractDetailPage'))
const LeaderboardPage = lazyWithReload(() => import('./pages/LeaderboardPage'))
const EventContractPage = lazyWithReload(() => import('./pages/EventContractPage'))
const CopyTradingPage = lazyWithReload(() => import('./pages/CopyTradingPage'))
const CopyTraderDetailPage = lazyWithReload(() => import('./pages/CopyTraderDetailPage'))
const MyCopyPage = lazyWithReload(() => import('./pages/MyCopyPage'))
const SoccerPage = lazyWithReload(() => import('./pages/SoccerPage'))
const SoccerMatchPage = lazyWithReload(() => import('./pages/SoccerMatchPage'))
const SoccerFuturesPage = lazyWithReload(() => import('./pages/SoccerFuturesPage'))
const SoccerMyBetsPage = lazyWithReload(() => import('./pages/SoccerMyBetsPage'))
const SoccerDesignBoardPage = lazyWithReload(() => import('./pages/SoccerDesignBoardPage'))
const SoccerV47DeltaBoardPage = lazyWithReload(() => import('./pages/SoccerV47DeltaBoardPage'))
const ClobPage = lazyWithReload(() => import('./pages/ClobPage'))
const ClobMatchPage = lazyWithReload(() => import('./pages/ClobMatchPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--text-secondary)]">
      页面加载中...
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<EventsPage />} />
            <Route path="/event/:eventId" element={<EventDetailPage />} />
            <Route path="/game/:eventId" element={<SportsGamePage />} />
            <Route path="/contract/:contractId" element={<ContractDetailPage />} />
            <Route path="/events" element={<EventContractPage />} />
            <Route path="/soccer" element={<SoccerPage />} />
            <Route path="/soccer/match/:matchId" element={<SoccerMatchPage />} />
            <Route path="/soccer/futures/:competitionId" element={<SoccerFuturesPage />} />
            <Route path="/soccer/mybets" element={<SoccerMyBetsPage />} />
            <Route path="/soccer/design-board" element={<SoccerDesignBoardPage />} />
            <Route path="/soccer/design-board/v4.7-delta" element={<SoccerV47DeltaBoardPage />} />
            <Route path="/clob" element={<ClobPage />} />
            <Route path="/clob/match/:matchId" element={<ClobMatchPage />} />
            <Route path="/copy" element={<CopyTradingPage />} />
            <Route path="/copy/my" element={<MyCopyPage />} />
            <Route path="/copy/trader/:id" element={<CopyTraderDetailPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
