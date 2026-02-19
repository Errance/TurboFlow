import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import PortfolioPage from './pages/PortfolioPage'
import SportsPage from './pages/SportsPage'
import SportsGamePage from './pages/SportsGamePage'
import ContractDetailPage from './pages/ContractDetailPage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<EventsPage />} />
          <Route path="/event/:eventId" element={<EventDetailPage />} />
          <Route path="/sports" element={<SportsPage />} />
          <Route path="/sports/:eventId" element={<SportsGamePage />} />
          <Route path="/contract/:contractId" element={<ContractDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
