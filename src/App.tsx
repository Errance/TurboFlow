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
import SoccerPage from './pages/SoccerPage'
import SoccerMatchPage from './pages/SoccerMatchPage'
import SoccerFuturesPage from './pages/SoccerFuturesPage'
import SoccerMyBetsPage from './pages/SoccerMyBetsPage'
import SoccerDesignBoardPage from './pages/SoccerDesignBoardPage'
import SoccerV47DeltaBoardPage from './pages/SoccerV47DeltaBoardPage'
import SoccerV60AmmDeltaBoardPage from './pages/SoccerV60AmmDeltaBoardPage'
import ClobPage from './pages/ClobPage'
import ClobMatchPage from './pages/ClobMatchPage'

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
          <Route path="/soccer" element={<SoccerPage />} />
          <Route path="/soccer/match/:matchId" element={<SoccerMatchPage />} />
          <Route path="/soccer/futures/:competitionId" element={<SoccerFuturesPage />} />
          <Route path="/soccer/mybets" element={<SoccerMyBetsPage />} />
          <Route path="/soccer/design-board" element={<SoccerDesignBoardPage />} />
          <Route path="/soccer/design-board/v4.7-delta" element={<SoccerV47DeltaBoardPage />} />
          <Route path="/soccer/design-board/v6.0-amm-delta" element={<SoccerV60AmmDeltaBoardPage />} />
          <Route path="/clob" element={<ClobPage />} />
          <Route path="/clob/match/:matchId" element={<ClobMatchPage />} />
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
