import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import MarketsPage from './pages/MarketsPage'
import MarketDetailPage from './pages/MarketDetailPage'
import PortfolioPage from './pages/PortfolioPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<MarketsPage />} />
          <Route path="/market/:id" element={<MarketDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
