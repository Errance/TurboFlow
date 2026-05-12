import { useState, type ReactNode } from 'react'
import {
  AmmMarketCard,
  AmmPortfolioPanel,
  AmmStatusBadge,
  AmmTradePanel,
  PriceFormatToggle,
} from '../components/soccer/AmmMarketComponents'
import {
  ammMarkets,
  estimateAmmQuote,
  type AmmMarket,
  type PriceFormat,
} from '../data/soccer/ammMarkets'

const boardSections = [
  ['coverage', '范围说明'],
  ['routes', '页面覆盖'],
  ['discovery', '发现页'],
  ['single', '单场预测'],
  ['futures', '冠军与晋级'],
  ['trade', '交易面板'],
  ['portfolio', 'Portfolio'],
  ['states', '市场状态'],
  ['risk', '风控与异常'],
  ['audit', '审计清单'],
]

const routeCoverage = [
  ['/soccer', 'AMM 市场发现：首页、单场预测 / 冠军与晋级、价格格式切换、右侧交易面板和 Portfolio 摘要'],
  ['/soccer/match/:matchId', '单场 AMM 市场详情：比赛信息、outcome 卡片、买入 / 卖出交易面板、暂停提示'],
  ['/soccer/futures/:competitionId', '冠军与晋级 AMM 市场组：阶段筛选、长期结算规则、交易面板'],
  ['/soccer/mybets', 'Portfolio：当前持仓、可卖 shares、均价、市值、盈亏、历史成交'],
  ['/soccer/design-board', 'v6.0 AMM Design Board 全状态评审'],
]

const componentCoverage = [
  ['AmmMarketCard', '市场问题、outcome、概率价格、欧洲赔率、流动性、成交量、状态'],
  ['AmmTradePanel', '买入、部分卖出、全部卖出、quote、价格影响、手续费、暂停和无持仓限制'],
  ['AmmPortfolioPanel', '持仓摘要、可卖 shares、平均成本、市值、未实现 / 已实现盈亏'],
  ['PriceFormatToggle', '概率价格 / 欧洲赔率展示切换'],
  ['AmmStatusBadge', '可交易、暂停、只可查看、等待官方结果、已结算、已作废'],
]

const stateCoverage = [
  ['可交易', '外部流动性正常报价，可买入、可卖出。'],
  ['暂停交易', '关键事件、VAR、红牌、报价异常或平台风控触发，买卖都不可执行。'],
  ['只可查看', '市场保留展示但不再接受交易。'],
  ['等待官方结果', '比赛或赛事结束后等待官方确认，持仓不可交易，等待结算。'],
  ['已结算', '正确 outcome 兑付 1，错误 outcome 归 0。'],
  ['已作废', '触发 void rule，按规则退款。'],
]

const riskCoverage = [
  ['价格影响过高', '交易面板展示黄色警示，超过阈值时应阻断确认。'],
  ['quote 过期', '需要重新询价，不能沿用旧价格成交。'],
  ['流动性不足', '整笔交易失败，不产生挂单或部分成交。'],
  ['部分卖出 dust', '卖出后剩余持仓低于阈值时提示全部卖出。'],
  ['外部报价暂停', 'provider_quote_status 非 quoting 时暂停买入和卖出。'],
  ['官方争议', '进入官方待确认，不提前结算。'],
]

const singleMarkets = ammMarkets.filter((market) => market.category === 'single')
const futuresMarkets = ammMarkets.filter((market) => market.category === 'futures')
const selectedOpenMarket = ammMarkets.find((market) => market.status === 'open') ?? ammMarkets[0]
const selectedPositionMarket = ammMarkets.find((market) => market.id === 'amm-world-cup-winner') ?? selectedOpenMarket
const pausedMarket = ammMarkets.find((market) => market.status === 'paused') ?? selectedOpenMarket
const pendingMarket = ammMarkets.find((market) => market.status === 'official_pending') ?? selectedOpenMarket

export default function SoccerDesignBoardPage() {
  const [priceFormat, setPriceFormat] = useState<PriceFormat>('probability')
  const [selectedMarket, setSelectedMarket] = useState<AmmMarket>(selectedOpenMarket)
  const selectedOutcome = selectedMarket.outcomes[0]
  const highImpactQuote = estimateAmmQuote(selectedOpenMarket, selectedOpenMarket.outcomes[0], 'buy', 4500, 'collateral')

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 rounded-3xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2DD4BF]">Soccer v6.0 AMM Design Board</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">足球 AMM 预测市场设计状态总览</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">
          本展板只覆盖 v6.0 AMM 预测市场：市场问题、outcome、预测份额、交易面板、部分卖出、Portfolio、外部流动性和结算异常。不展示 CLOB、挂单、限价单、订单簿、传统投注单或串关。
        </p>
        <a
          href={`${import.meta.env.BASE_URL}soccer/design-board/v6.0-amm-delta`}
          className="mt-4 inline-flex rounded-full border border-[#2DD4BF]/40 bg-[#2DD4BF]/15 px-3 py-1.5 text-xs font-semibold text-[#2DD4BF]"
        >
          查看 v6.0 变更对比板
        </a>
      </header>

      <nav className="sticky top-0 z-10 mb-6 flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/95 p-3 backdrop-blur">
        {boardSections.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full bg-[var(--bg-control)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[#2DD4BF]">
            {label}
          </a>
        ))}
      </nav>

      <BoardSection id="coverage" title="0. 范围说明" description="v6.0 是全量 AMM 化，不是传统盘口 UI 换皮。">
        <div className="grid gap-4 lg:grid-cols-3">
          <StateCard title="产品边界" description="用户与 AMM 池交易 outcome shares，平台不作为交易对手方。">
            <Checklist items={['买入预测份额', '部分卖出', '全部卖出', '等待结算', 'void 退款']} />
          </StateCard>
          <StateCard title="不进入本期" description="这些能力不应出现在页面、mock 或设计稿中。">
            <Checklist items={['CLOB 订单簿', '挂单', '限价单', '部分成交挂起', '传统投注单', '串关']} danger />
          </StateCard>
          <StateCard title="价格体系" description="概率价格是底层价格，欧洲赔率只是展示换算。">
            <PriceFormatToggle value={priceFormat} onChange={setPriceFormat} />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="routes" title="1. 页面覆盖" description="设计与测试需要逐页核对这些路由。">
        <div className="grid gap-3 lg:grid-cols-2">
          {routeCoverage.map(([route, desc]) => (
            <StateCard key={route} title={route} description={desc}>
              <div className="h-2 rounded-full bg-[#2DD4BF]/40" />
            </StateCard>
          ))}
        </div>
      </BoardSection>

      <BoardSection id="discovery" title="2. 发现页状态" description="首页需要同时支持单场预测和冠军与晋级的 AMM 市场发现。">
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="grid gap-4 lg:grid-cols-2">
            {ammMarkets.slice(0, 4).map((market) => (
              <AmmMarketCard
                key={market.id}
                market={market}
                priceFormat={priceFormat}
                selectedOutcomeId={selectedMarket.id === market.id ? selectedOutcome.id : undefined}
                onSelect={(nextMarket) => setSelectedMarket(nextMarket)}
              />
            ))}
          </div>
          <AmmTradePanel market={selectedMarket} outcome={selectedOutcome} priceFormat={priceFormat} />
        </div>
      </BoardSection>

      <BoardSection id="single" title="3. 单场预测 AMM" description="覆盖赛果、大小球、系列赛晋级、球队表现等单场 outcome。">
        <div className="grid gap-4 lg:grid-cols-2">
          {singleMarkets.map((market) => (
            <AmmMarketCard key={market.id} market={market} priceFormat={priceFormat} />
          ))}
        </div>
      </BoardSection>

      <BoardSection id="futures" title="4. 冠军与晋级 AMM" description="覆盖长期赛事级市场，包括多 outcome 冠军和二元晋级 / 资格市场。">
        <div className="grid gap-4 lg:grid-cols-2">
          {futuresMarkets.map((market) => (
            <AmmMarketCard key={market.id} market={market} priceFormat={priceFormat} />
          ))}
        </div>
      </BoardSection>

      <BoardSection id="trade" title="5. 交易面板状态" description="买入、部分卖出、全部卖出、暂停、无持仓和高价格影响都必须能设计。">
        <div className="grid gap-4 xl:grid-cols-3">
          <StateCard title="买入确认" description="展示 shares、成交均价、价格影响、手续费、交易后价格。">
            <AmmTradePanel market={selectedOpenMarket} outcome={selectedOpenMarket.outcomes[0]} priceFormat={priceFormat} />
          </StateCard>
          <StateCard title="已有持仓可部分卖出" description="输入小于可卖 shares 的数量；也可点击全部卖出。">
            <AmmTradePanel market={selectedPositionMarket} outcome={selectedPositionMarket.outcomes[0]} priceFormat={priceFormat} />
          </StateCard>
          <StateCard title="暂停交易" description="关键事件或外部报价暂停时买卖都不可执行。">
            <AmmTradePanel market={pausedMarket} outcome={pausedMarket.outcomes[0]} priceFormat={priceFormat} />
          </StateCard>
        </div>
        <div className="mt-4 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4">
          <p className="text-sm font-semibold text-[#F59E0B]">高价格影响样例</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            大额买入 4500 USDT 的预估价格影响为 {highImpactQuote.priceImpact.toFixed(2)}%，交易后价格 {Math.round(highImpactQuote.nextPrice * 100)}%。超过产品阈值时应阻断确认并提示拆单或降低规模。
          </p>
        </div>
      </BoardSection>

      <BoardSection id="portfolio" title="6. Portfolio" description="Portfolio 是 v6.0 P0，支持用户管理可卖 shares 和盈亏。">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <AmmPortfolioPanel />
          <StateCard title="Portfolio 必须展示" description="没有这些字段，卖出体验不可上线。">
            <Checklist items={['可卖 shares', '平均成本', '当前价格', '持仓市值', '未实现盈亏', '已实现盈亏', '历史成交', '结算状态']} />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="states" title="7. 市场状态" description="每个状态都影响 outcome 卡、交易面板和 Portfolio。">
        <div className="grid gap-3 lg:grid-cols-3">
          {stateCoverage.map(([label, desc]) => {
            const market = label === '暂停交易' ? pausedMarket : label === '等待官方结果' ? pendingMarket : selectedOpenMarket
            return (
              <StateCard key={label} title={label} description={desc}>
                <AmmStatusBadge market={market} />
              </StateCard>
            )
          })}
        </div>
      </BoardSection>

      <BoardSection id="risk" title="8. 风控与异常" description="这些状态不是边角料，而是 AMM 足球市场的核心安全体验。">
        <div className="grid gap-3 lg:grid-cols-2">
          {riskCoverage.map(([label, desc]) => (
            <StateCard key={label} title={label} description={desc}>
              <div className="rounded-xl bg-[var(--bg-control)] p-3 text-[10px] text-[var(--text-secondary)]">
                用户动作：重新询价 / 降低规模 / 等待恢复 / 查看结算规则
              </div>
            </StateCard>
          ))}
        </div>
      </BoardSection>

      <BoardSection id="audit" title="9. 审计清单" description="设计师、研发和测试可以按此清单判断 v6.0 是否完整。">
        <div className="grid gap-4 lg:grid-cols-2">
          <StateCard title="组件覆盖" description="所有 AMM 主组件必须进入设计评审。">
            <Checklist items={componentCoverage.map(([name, desc]) => `${name}：${desc}`)} />
          </StateCard>
          <StateCard title="卖出覆盖" description="部分卖出和全部卖出必须区别于 CLOB 部分成交。">
            <Checklist items={[
              '用户输入卖出 shares',
              '可点击全部卖出',
              '成交后减少持仓',
              '展示本次已实现盈亏',
              '低于 dust threshold 时提示全仓卖出',
              '失败时整笔失败，不生成挂单',
            ]} />
          </StateCard>
        </div>
      </BoardSection>
    </div>
  )
}

function BoardSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section id={id} className="mb-8 scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      {children}
    </section>
  )
}

function StateCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function Checklist({ items, danger = false }: { items: string[]; danger?: boolean }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="flex gap-2 text-xs text-[var(--text-secondary)]">
          <span className={danger ? 'text-[#E85A7E]' : 'text-[#2DD4BF]'}>{danger ? '×' : '✓'}</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}
