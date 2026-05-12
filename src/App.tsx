import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'

const EventsPage = lazy(() => import('./pages/EventsPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const SportsGamePage = lazy(() => import('./pages/SportsGamePage'))
const ContractDetailPage = lazy(() => import('./pages/ContractDetailPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const EventContractPage = lazy(() => import('./pages/EventContractPage'))
const CopyTradingPage = lazy(() => import('./pages/CopyTradingPage'))
const CopyTraderDetailPage = lazy(() => import('./pages/CopyTraderDetailPage'))
const MyCopyPage = lazy(() => import('./pages/MyCopyPage'))
const SoccerPage = lazy(() => import('./pages/SoccerPage'))
const SoccerMatchPage = lazy(() => import('./pages/SoccerMatchPage'))
const SoccerFuturesPage = lazy(() => import('./pages/SoccerFuturesPage'))
const SoccerMyBetsPage = lazy(() => import('./pages/SoccerMyBetsPage'))
const SoccerDesignBoardPage = lazy(() => import('./pages/SoccerDesignBoardPage'))
const SoccerV47DeltaBoardPage = lazy(() => import('./pages/SoccerV47DeltaBoardPage'))
const ClobPage = lazy(() => import('./pages/ClobPage'))
const ClobMatchPage = lazy(() => import('./pages/ClobMatchPage'))

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
