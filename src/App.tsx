import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import PortfolioPage from './pages/PortfolioPage'
import SportsGamePage from './pages/SportsGamePage'
import ContractDetailPage from './pages/ContractDetailPage'
import LeaderboardPage from './pages/LeaderboardPage'
import StrategiesPage from './pages/StrategiesPage'
import StrategyDetailPage from './pages/StrategyDetailPage'
import CreateStrategyPage from './pages/CreateStrategyPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<EventsPage />} />
          <Route path="/event/:eventId" element={<EventDetailPage />} />
          <Route path="/game/:eventId" element={<SportsGamePage />} />
          <Route path="/contract/:contractId" element={<ContractDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/strategies" element={<StrategiesPage />} />
          <Route path="/strategy/new" element={<CreateStrategyPage />} />
          <Route path="/strategy/:strategyId" element={<StrategyDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
