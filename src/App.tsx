import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import PortfolioPage from './pages/PortfolioPage'
import SportsGamePage from './pages/SportsGamePage'
import ContractDetailPage from './pages/ContractDetailPage'
import LeaderboardPage from './pages/LeaderboardPage'
import EventContractPage from './pages/EventContractPage'
import CopyTradingPage from './pages/CopyTradingPage'
import CopyTraderDetailPage from './pages/CopyTraderDetailPage'
import MyCopyPage from './pages/MyCopyPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<EventsPage />} />
          <Route path="/event/:eventId" element={<EventDetailPage />} />
          <Route path="/game/:eventId" element={<SportsGamePage />} />
          <Route path="/contract/:contractId" element={<ContractDetailPage />} />
          <Route path="/events" element={<EventContractPage />} />
          <Route path="/copy" element={<CopyTradingPage />} />
          <Route path="/copy/my" element={<MyCopyPage />} />
          <Route path="/copy/trader/:id" element={<CopyTraderDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
