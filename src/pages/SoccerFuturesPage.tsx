import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AmmMarketRenderer from '../components/soccer/AmmMarketRenderer'
import AmmTradePanel from '../components/soccer/AmmTradePanel'
import AmmPortfolioPanel from '../components/soccer/AmmPortfolioPanel'
import SoccerPriceFormatToggle from '../components/soccer/SoccerPriceFormatToggle'
import { futuresCompetitions, getFutureCompetitionById } from '../data/soccer/futuresData'
import { subjectFromBetSubject } from '../data/soccer/ammData'

export default function SoccerFuturesPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  const navigate = useNavigate()
  const competition = getFutureCompetitionById(competitionId ?? '') ?? futuresCompetitions[0]
  const [activeGroup, setActiveGroup] = useState<string>('全部')

  const groups = useMemo(
    () => ['全部', ...Array.from(new Set(competition.markets.map((item) => item.group)))],
    [competition.markets],
  )
  const stageGroups = groups.filter((group) => group !== '全部')
  const visibleMarkets = activeGroup === '全部'
    ? competition.markets
    : competition.markets.filter((item) => item.group === activeGroup)
  const groupedMarkets = stageGroups
    .map((group) => ({
      group,
      markets: visibleMarkets.filter((item) => item.group === group),
    }))
    .filter((item) => item.markets.length > 0)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <nav className="flex items-center gap-1 text-sm min-h-[44px] mb-4">
        <button onClick={() => navigate('/soccer')} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
          足球
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <button onClick={() => navigate('/soccer?view=futures')} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
          冠军与晋级
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="text-[var(--text-primary)] font-medium truncate">{competition.shortName}</span>
      </nav>

      <div className="flex flex-row gap-6">
        <div className="flex-1 min-w-0">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[#2DD4BF] font-semibold">冠军与晋级 · {competition.seriesType}</p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{competition.name}</h1>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{competition.headline}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-control)] px-4 py-3 text-right">
                <p className="text-[10px] text-[var(--text-secondary)]">系列状态</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{competition.phase}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoPill label="预测组织" value="系列赛内分组" />
              <InfoPill label="定价方式" value="AMM 概率价格" />
              <InfoPill label="交易方式" value="买入 / 部分卖出 / 全部卖出" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {competition.marketSummary.map((item) => (
                <span key={item} className="rounded-full bg-[#E85A7E]/10 px-2.5 py-1 text-[10px] text-[#E85A7E]">{item}</span>
              ))}
            </div>
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  activeGroup === group
                    ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-5">
            {groupedMarkets.map(({ group, markets }) => (
              <section key={group} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">{group}</h2>
                  <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{markets.length} 个预测</span>
                </div>
                {markets.map((item) => (
                  <section key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[10px] text-[#2DD4BF]">{competition.shortName}</span>
                          <span className="text-[10px] text-[var(--text-secondary)]">{item.subject.resolutionTimeLabel}</span>
                        </div>
                        <p className="mt-2 text-xs text-[var(--text-secondary)] leading-5">{item.description}</p>
                      </div>
                      <div className="text-right text-[10px] text-[var(--text-secondary)]">
                        <p>关闭时间</p>
                        <p className="mt-0.5 font-mono text-[var(--text-primary)]">{formatCloseTime(item.subject.closesAt)}</p>
                      </div>
                    </div>
                    <AmmMarketRenderer
                      market={item.market}
                      displayTitle={item.market.title}
                      subject={subjectFromBetSubject(item.subject)}
                    />
                    <p className="mt-2 text-[10px] text-[var(--text-secondary)]">结算来源：{item.subject.resolutionSource}</p>
                  </section>
                ))}
              </section>
            ))}
          </div>
        </div>

        <aside className="w-[380px] shrink-0 sticky top-20 self-start space-y-4">
          <SoccerPriceFormatToggle />
          <AmmTradePanel />
          <AmmPortfolioPanel compact />
        </aside>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-xs font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function formatCloseTime(iso?: string): string {
  if (!iso) return '按市场规则'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '按市场规则'
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
