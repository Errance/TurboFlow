import { useNavigate } from 'react-router-dom'
import AmmPortfolioPanel from '../components/soccer/AmmPortfolioPanel'
import AmmTradePanel from '../components/soccer/AmmTradePanel'
import SoccerPriceFormatToggle from '../components/soccer/SoccerPriceFormatToggle'

export default function SoccerMyBetsPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <nav className="flex items-center gap-1 text-sm min-h-[44px] mb-4">
        <button
          onClick={() => navigate('/soccer')}
          className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          足球
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="text-[var(--text-primary)] font-medium">Portfolio / 我的持仓</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Portfolio / 我的持仓</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-secondary)]">
            v7.0 主视图展示 RFQ 持仓、可卖份额、平均成本、退出参考价、已实现和未实现盈亏；传统注单历史兼容形态后续待确认。
          </p>
        </div>
        <SoccerPriceFormatToggle />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <AmmPortfolioPanel />
        <AmmTradePanel />
      </div>
    </div>
  )
}
