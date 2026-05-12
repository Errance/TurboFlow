import { useState } from 'react'
import MatchHeader from '../components/soccer/MatchHeader'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import MatchListCard from '../components/soccer/MatchListCard'
import MarketRenderer from '../components/soccer/MarketRenderer'
import MyBetCard from '../components/soccer/MyBetCard'
import MyBetsPanel from '../components/soccer/MyBetsPanel'
import { SoccerListSkeleton, SoccerMatchSkeleton } from '../components/soccer/SoccerSkeletons'
import { futuresCompetitions } from '../data/soccer/futuresData'
import { matches } from '../data/soccer/mockData'
import type { Market, MyBetItem, SettlementResult, SoccerMatch } from '../data/soccer/types'

const noop = () => {}

const LEAN_MARKET_ORDER = [
  '胜平负',
  '开球权',
  '让球',
  '让球 0:1',
  '总进球数',
  '大小球',
  '波胆',
]

const boardSections = [
  ['coverage', '总览'],
  ['v60-amm-delta', 'A. v6.0 变更差异'],
  ['coverage-matrix', 'B0. 覆盖矩阵'],
  ['page-states', 'B1. 页面覆盖'],
  ['match-states', 'B2. 比赛状态'],
  ['lean-markets', 'B3. 历史单场盘口'],
  ['future-markets', 'B4. 历史冠军与晋级'],
  ['market-states', 'B5. 历史盘口状态'],
  ['goal-toggle', 'B6. 历史封盘规则'],
  ['betslip-states', 'B7. 传统投注单'],
  ['float-states', 'B8. 传统浮动条'],
  ['mybets-states', 'B9. 传统我的注单'],
  ['rule-states', 'B10. 历史报价反馈'],
  ['component-matrix', 'B11. 组件覆盖'],
  ['edge-states', 'B12. 异常边界'],
  ['compliance-degrade', 'B13. 合规降级'],
]

const soccerComponentCoverage = [
  ['MatchHeader', '比赛状态头部'],
  ['MatchInfoPanel', '右栏赛事信息'],
  ['MatchListCard', '首页比赛卡'],
  ['MarketRenderer', '盘口分发器'],
  ['ButtonGroupMarket', '胜平负 / 开球权'],
  ['RangeButtonsMarket', '进球区间 / 离散选项'],
  ['OddsTableMarket', '让球 / 大小球线值卡片'],
  ['ScoreGridMarket', '波胆分组卡片'],
  ['OddsDisplay', '赔率格式'],
  ['MarketCard', '盘口折叠容器'],
  ['SoccerBetSlip', '右栏投注单'],
  ['SoccerBetSlipFloat', '跨页浮动投注单'],
  ['ConfirmBetDialog', '传统投注二次确认'],
  ['BetSlipSettingsMenu', '投注单设置'],
  ['MyBetCard', '我的注单卡'],
  ['MyBetsPanel', '右栏我的注单摘要'],
  ['AmmMarketRenderer', 'AMM outcome 市场卡'],
  ['AmmTradePanel', '买入 / 部分卖出 / 全部卖出交易面板'],
  ['AmmPortfolioPanel', 'Portfolio 持仓与成交摘要'],
  ['SoccerPriceFormatToggle', '份额价格 / 欧洲赔率显示切换'],
  ['SoccerSkeletons', '列表 / 详情骨架'],
  ['KickoffCountdown', '开赛倒计时'],
  ['MatchTimeline', '比赛事件'],
  ['MatchStatsBar', '统计条'],
  ['FormationPitch', '阵型图'],
  ['HeadToHeadPanel', '历史交锋'],
]

const v6ActiveCoverage = [
  ['SoccerPage', '/soccer', '首页 tab、比赛列表、AMM 价格格式切换'],
  ['SoccerMatchPage', '/soccer/match/:matchId', '比赛详情、AmmMarketRenderer、AmmTradePanel、AmmPortfolioPanel'],
  ['SoccerFuturesPage', '/soccer/futures/:competitionId', '冠军与晋级 11 个赛事级市场 AMM 化'],
  ['SoccerMyBetsPage', '/soccer/mybets', 'Portfolio / 我的持仓、成交记录、买入和卖出入口'],
  ['AmmMarketRenderer', 'src/components/soccer/AmmMarketRenderer.tsx', '正式路由中使用的 outcome 市场卡'],
  ['AmmTradePanel', 'src/components/soccer/AmmTradePanel.tsx', '买入、部分卖出、全部卖出和 quote 风险反馈'],
  ['AmmPortfolioPanel', 'src/components/soccer/AmmPortfolioPanel.tsx', '持仓、可卖份额、市值和盈亏'],
  ['SoccerPriceFormatToggle', 'src/components/soccer/SoccerPriceFormatToggle.tsx', '份额价格 / 欧洲赔率显示切换'],
]

const legacyCoverage = [
  ['SoccerV47DeltaBoardPage', '/soccer/design-board/v4.7-delta', 'v4.7 历史变更页，保留作旧设计对照'],
  ['MarketRenderer', 'src/components/soccer/MarketRenderer.tsx', '仅用于 Design Board 和 v4.7 对照，不是 v6 正式足球路由主渲染器'],
  ['SoccerBetSlip', 'src/components/soccer/SoccerBetSlip.tsx', '传统投注单历史覆盖，v6 正式页已由 AmmTradePanel 取代'],
  ['SoccerBetSlipFloat', 'src/components/soccer/SoccerBetSlipFloat.tsx', 'AppShell 仍挂载的传统浮动条残留，需作为遗留边界标注'],
  ['ConfirmBetDialog', 'src/components/soccer/ConfirmBetDialog.tsx', '传统投注二次确认，v6 AMM 交易确认不沿用此语义'],
  ['MyBetCard / MyBetsPanel', 'src/components/soccer', '传统注单卡和摘要，v6 主流程改为 Portfolio'],
]

const excludedCoverage = [
  ['SoccerPredictionPage', '未注册路由', '预测 bracket 不属于本期足球 AMM 主流程'],
  ['SoccerPredictionLeaderboardPage', '未注册路由', '排行榜分享链路不纳入 v6 AMM Design Board 差异区'],
  ['SoccerPredictionShareView', '未注册路由', '分享页不纳入当前足球 tab AMM mock 改造范围'],
  ['CLOB 足球页', '/clob、/clob/match/:matchId', '撮合版本是未来大版本，不在 v6 AMM 本期范围内'],
  ['订单簿 / 限价单 / 撤单', '明确排除', 'v6 只展示 AMM 即时 quote，不展示挂单或部分成交挂起'],
]

const futureMarketCoverage = futuresCompetitions.flatMap((competition) =>
  competition.markets.map((item) => ({
    id: item.id,
    title: `${competition.shortName} · ${item.group} · ${item.market.title}`,
    text: `状态：${item.status}｜${item.description}`,
  })),
)

function futureGroups(competition: (typeof futuresCompetitions)[number]): string[] {
  return Array.from(new Set(competition.markets.map((item) => item.group)))
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const sourceMatch = matches[0]
const liveSourceMatch = matches.find((match) => match.status === 'live') ?? sourceMatch
const finishedSourceMatch = matches.find((match) => match.status === 'finished') ?? sourceMatch

function matchWith(status: SoccerMatch['status'], overrides: Partial<SoccerMatch> = {}): SoccerMatch {
  const shouldShowScore = status === 'live' || status === 'finished' || status === 'interrupted' || status === 'abandoned'
  return {
    ...clone(sourceMatch),
    id: `board-${status}`,
    status,
    score: shouldShowScore ? (overrides.score ?? { home: 1, away: status === 'finished' ? 2 : 0 }) : undefined,
    currentMinute: status === 'live' || status === 'interrupted' || status === 'abandoned' ? (overrides.currentMinute ?? 65) : undefined,
    events: status === 'live' || status === 'finished' || status === 'interrupted' || status === 'abandoned' ? liveSourceMatch.events : sourceMatch.events,
    stats: status === 'live' || status === 'finished' || status === 'interrupted' || status === 'abandoned' ? liveSourceMatch.stats : sourceMatch.stats,
    ...overrides,
  }
}

const allMarkets = sourceMatch.tabs.flatMap((tab) => tab.markets)

function marketByTitle(title: string, fallback?: Market): Market {
  const market = allMarkets.find((item) => item.title === title)
  if (!market && fallback) return clone(fallback)
  if (!market) return clone(marketByTitle('胜平负'))
  return clone(market)
}

function marketWith(title: string, patch: Partial<Market>): Market {
  return { ...marketByTitle(title), ...patch } as Market
}

function selectedKeyFor(market: Market): string | undefined {
  switch (market.type) {
    case 'buttonGroup':
    case 'rangeButtons':
      return `${market.title}|${market.options[0]?.label}`
    case 'oddsTable':
      return `${market.title}|${market.columns[0]} ${market.rows[0]?.line}`
    case 'scoreGrid': {
      const firstScore = Object.keys(market.odds)[0]
      return firstScore ? `${market.title}|${firstScore}` : undefined
    }
    case 'playerList': {
      const firstPlayer = market.players[0]
      if (!firstPlayer) return undefined
      const tier = market.tiers[0] ?? ''
      return `${market.title}|${tier ? `${firstPlayer.name} ${tier}` : firstPlayer.name}`
    }
    case 'comboGrid':
      return `${market.title}|${market.cells[0]?.label}`
  }
}

function settlementMarket(result: SettlementResult): Market {
  return marketWith('波胆', {
    status: 'settled',
    settlementResult: result,
    winningSelection: result === 'win' ? '1:0' : undefined,
  })
}

const listMatches: SoccerMatch[] = [
  matchWith('scheduled', { id: 'board-list-scheduled', date: '04月28日', time: '20:00' }),
  matchWith('live', { id: 'board-list-live', score: { home: 2, away: 1 }, currentMinute: 72 }),
  matchWith('finished', { id: 'board-list-finished', score: { home: 0, away: 1 } }),
  matchWith('postponed', { id: 'board-list-postponed', date: '待定', time: '待定' }),
]

const headerMatches: Array<{ label: string; note: string; match: SoccerMatch }> = [
  { label: '赛前', note: '展示开赛时间，不展示比分。', match: matchWith('scheduled') },
  { label: '进行中', note: '展示比分、比赛分钟和进行中状态。', match: matchWith('live', { score: { home: 1, away: 0 }, currentMinute: 65 }) },
  { label: '已结束', note: '展示最终比分，不再接受新增投注。', match: matchWith('finished', { score: { home: 0, away: 1 } }) },
  { label: '中断', note: '展示已发生比分和中断说明。', match: matchWith('interrupted', { score: { home: 1, away: 1 }, currentMinute: 54 }) },
  { label: '腰斩', note: '展示异常结束状态和结算说明。', match: matchWith('abandoned', { score: { home: 0, away: 2 }, currentMinute: 39 }) },
  { label: '延期', note: '展示延期状态，不展示比分。', match: matchWith('postponed', { date: '待定', time: '待定' }) },
  { label: '取消', note: '展示取消状态，相关盘口作废。', match: matchWith('cancelled', { date: '待定', time: '待定' }) },
]

const leanMarketScenarios = LEAN_MARKET_ORDER.map((title) => ({
  title,
  market: marketByTitle(title),
}))

const marketStateScenarios: Array<{ label: string; note: string; market?: Market; selectedKey?: string; conflict?: boolean }> = [
  { label: '开放', note: '用户可以选择并加入投注单。', market: marketByTitle('胜平负') },
  { label: '选中', note: '同一盘口当前选项高亮。', market: marketByTitle('胜平负'), selectedKey: selectedKeyFor(marketByTitle('胜平负')) },
  { label: '暂停', note: '盘口保留展示，但不可选择。', market: marketWith('大小球', { status: 'suspended' }) },
  { label: '即将开放', note: '盘口存在，但尚未开放投注。', market: marketWith('总进球数', { status: 'upcoming' }) },
  { label: '作废', note: '盘口作废，已下注按退款规则处理。', market: marketWith('大小球', { status: 'void' }) },
  { label: '取消', note: '盘口取消，不再接受投注。', market: marketWith('胜平负', { status: 'cancelled' }) },
  { label: '已结算赢', note: '展示命中结果。', market: settlementMarket('win') },
  { label: '已结算输', note: '展示未命中。', market: settlementMarket('loss') },
  { label: '退款', note: '走盘或盘口作废按退款展示。', market: settlementMarket('push') },
  { label: '串关互斥', note: '仅在串关模式下解释与已选盘口不可组合。', market: marketByTitle('波胆'), conflict: true },
  { label: '隐藏', note: '后台隐藏的盘口不出现在用户列表中。' },
]

const conflictExamples = [
  ['胜平负 × 波胆', '波胆会直接推出胜平负结果。'],
  ['总进球数 × 大小球', '总进球档位会决定大小球结果。'],
  ['让球 × 波胆', '波胆会决定让球结果。'],
]

const rejectReasons = [
  ['赔率已变化', '最新报价与加入投注单时不同，提交前需要确认。'],
  ['报价已过期', '锁价时间已结束，请先接受最新报价。'],
  ['盘口已关闭', '该盘口已暂停、作废或结算，请移除相关选项。'],
  ['该比赛暂不支持投注', '比赛已结束、延期、取消或进入异常处理。'],
  ['余额不足', '可用余额低于本次投注金额，请调整金额后再提交。'],
  ['未达最低投注金额', '投注金额需满足当前最低投注要求。'],
  ['超过单注投注上限', '投注金额高于当前单注上限，请降低金额。'],
  ['预计返还超过限制', '预计返还已超过平台限制，请降低投注金额或减少选项。'],
  ['还需添加投注项', '当前投注方式需要更多选项，请继续添加或切换投注方式。'],
  ['投注项数量超过上限', '当前投注方式不支持这么多选项，请移除部分选项。'],
  ['不可同场串关', '同场强相关盘口不能放入同一张串关，可改为多笔单注。'],
  ['提交未成功', '投注单内容已保留，请稍后重试。'],
  ['投注正在确认中', '请等待当前提交结果返回后再操作。'],
]

function makeBet(id: string, status: MyBetItem['status'], patch: Partial<MyBetItem> = {}): MyBetItem {
  const settlementResult = patch.settlementResult ?? (patch.result === 'loss' ? 'loss' : patch.result === 'push' ? 'push' : 'win')
  return {
    id,
    betCode: `TF-DESIGN${id.slice(-2).toUpperCase()}`,
    matchLabel: 'RJ博塔弗戈 vs 米拉索尔',
    marketTitle: '胜平负',
    selection: 'RJ博塔弗戈',
    odds: 1.83,
    amount: 50,
    stake: 50,
    result: settlementResult === 'loss' || settlementResult === 'half_loss' ? 'loss' : settlementResult === 'push' || settlementResult === 'void' ? 'push' : 'win',
    settlementResult,
    status,
    payout: status === 'settled' ? 91.5 : 0,
    potentialReturn: 91.5,
    placedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    cashout: status === 'placed' || status === 'live' ? { availablePrice: 45, minutesUntilExpire: 10 } : undefined,
    ...patch,
  }
}

const sampleBets: MyBetItem[] = [
  makeBet('bet-pending', 'pending', { betCode: 'TF-PENDING', potentialReturn: 91.5 }),
  makeBet('bet-placed', 'placed', { betCode: 'TF-PLACED' }),
  makeBet('bet-live', 'live', { betCode: 'TF-LIVE01', matchLabel: '弗拉门戈 vs 科林蒂安', marketTitle: '大小球', selection: '大 2.5', odds: 2.05, potentialReturn: 205 }),
  makeBet('bet-win', 'settled', { betCode: 'TF-WIN001', result: 'win', settlementResult: 'win', payout: 168, marketTitle: '波胆', selection: '0:1', odds: 8.4 }),
  makeBet('bet-loss', 'settled', { betCode: 'TF-LOSS01', result: 'loss', settlementResult: 'loss', payout: 0 }),
  makeBet('bet-push', 'settled', { betCode: 'TF-PUSH01', result: 'push', settlementResult: 'push', payout: 50, marketTitle: '让球', selection: '0 / 0' }),
  makeBet('bet-void', 'settled', { betCode: 'TF-VOID01', result: 'push', settlementResult: 'void', payout: 50, marketTitle: '大小球', selection: '大 2.5' }),
  makeBet('bet-halfwin', 'settled', { betCode: 'TF-HALFWN', result: 'win', settlementResult: 'half_win', payout: 70 }),
  makeBet('bet-halfloss', 'settled', { betCode: 'TF-HALFLS', result: 'loss', settlementResult: 'half_loss', payout: 25 }),
  makeBet('bet-cashout', 'cashed_out', { betCode: 'TF-CASH01', payout: 286.5, odds: 5.62, marketTitle: '串关', selection: '3 项' }),
]

const parlayBet: MyBetItem = makeBet('bet-parlay', 'placed', {
  betCode: 'TF-PARLAY',
  betType: 'accumulator',
  odds: 5.62,
  stake: 100,
  amount: 100,
  potentialReturn: 562,
  legs: [
    { id: 'l1', matchId: 'm1', matchLabel: 'RJ博塔弗戈 vs 米拉索尔', marketTitle: '胜平负', selection: 'RJ博塔弗戈', oddsAtPlacement: 1.83 },
    { id: 'l2', matchId: 'm2', matchLabel: '弗拉门戈 vs 科林蒂安', marketTitle: '大小球', selection: '大 2.5', oddsAtPlacement: 2.05 },
    { id: 'l3', matchId: 'm3', matchLabel: '阿森纳 vs 切尔西', marketTitle: '让球', selection: '-0.5', oddsAtPlacement: 1.50 },
  ],
})

function stopBoardInteraction(event: React.SyntheticEvent) {
  event.preventDefault()
  event.stopPropagation()
}

export default function SoccerDesignBoardPage() {
  const [activeBoardTab, setActiveBoardTab] = useState<'v6' | 'delta'>('v6')

  return (
    <div
      className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-10 [&_a]:cursor-default [&_button]:cursor-default"
      onClickCapture={stopBoardInteraction}
      onKeyDownCapture={stopBoardInteraction}
      onSubmitCapture={stopBoardInteraction}
    >
      <header id="coverage" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs text-[#2DD4BF] font-semibold mb-2">足球 AMM 预测市场设计状态展板</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">足球 v6.0 AMM 差异评审 + 全量覆盖检查</h1>
        <p className="mt-3 max-w-4xl text-sm text-[var(--text-secondary)] leading-6">
          本页面拆成两块：A 区是本次从传统投注到 AMM 的 UI 差异，设计评审优先看这里；
          B 区是全量覆盖、历史状态和回归检查，不代表 v6 当前主流程仍沿用传统投注。
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-6">
          <Metric label="变更对比项" value="10+" />
          <Metric label="v6 激活项" value={String(v6ActiveCoverage.length)} />
          <Metric label="历史对照项" value={String(legacyCoverage.length)} />
          <Metric label="本期盘口" value="7" />
          <Metric label="赛事级市场" value={String(futureMarketCoverage.length)} />
          <Metric label="明确排除" value={String(excludedCoverage.length)} />
        </div>
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-4">
          <p className="text-xs font-semibold text-[var(--text-primary)]">v6.0 保持原市场范围，仅替换交易模型</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEAN_MARKET_ORDER.map((title) => (
              <span key={title} className="rounded-full bg-[#2DD4BF]/10 px-2.5 py-1 text-[10px] text-[#2DD4BF]">{title}</span>
            ))}
            {['小组赛', '淘汰赛', '冠军', '晋级', '赛季名次', '两回合系列赛'].map((title) => (
              <span key={title} className="rounded-full bg-[#E85A7E]/10 px-2.5 py-1 text-[10px] text-[#E85A7E]">{title}</span>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-5 text-[var(--text-secondary)]">
            本页以两个 tab 组织：完整 v6.0 展板用于签收当前设计；v5.0 → v6.0 对比用于核对每一处迁移差异。
          </p>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {[
            ['v6', 'v6.0 完整 Design Board', '当前足球 AMM 主流程、完整页面、组件、状态、价格、结算和排除项。'],
            ['delta', 'v5.0 → v6.0 UI 变更对比', '从 v5 同期代码和 PRD 到 v6 当前代码的所有用户可见 UI 变化。'],
          ].map(([id, label, description]) => (
            <button
              key={id}
              onClick={() => setActiveBoardTab(id as 'v6' | 'delta')}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                activeBoardTab === id
                  ? 'border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#2DD4BF]'
                  : 'border-[var(--border)] bg-[var(--bg-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-1 block text-[10px] leading-5 opacity-80">{description}</span>
            </button>
          ))}
        </div>
        <nav className="mt-4 flex flex-wrap gap-2">
          <a href={`${import.meta.env.BASE_URL}soccer/design-board/v4.7-delta`} className="rounded-lg border border-[#E85A7E]/40 bg-[#E85A7E]/10 px-3 py-1.5 text-xs text-[#E85A7E] hover:text-[#E85A7E]">
            v4.7 变更页
          </a>
          {boardSections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[#2DD4BF]">
              {label}
            </a>
          ))}
        </nav>
      </header>

      {activeBoardTab === 'v6' ? (
        <V6FullDesignBoardTab />
      ) : (
        <>
      <BoardSection id="v60-amm-delta" title="v5.0 → v6.0 全量 UI 变更对比" description="本区逐项说明哪些 UI 被改了。覆盖源包括 v5.0 PRD、v5 同期代码 8e53715、v6.0 PRD 和当前 v6 代码。每行左侧是原来的传统投注 UI，右侧是 v6.0 AMM 后的目标 UI。">
        <div className="rounded-2xl border border-[#2DD4BF]/25 bg-[#2DD4BF]/5 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <SmallState title="读法" text="从左到右看：旧 UI → 新 UI。不是全量重做稿，只标注本次 AMM 改动。" />
            <SmallState title="范围" text="只覆盖足球 tab 当前 mock：单场 7 个市场 + 冠军与晋级 11 个市场。" />
            <SmallState title="不展示" text="不展示 CLOB、订单簿、限价单、挂单、撤单或部分成交挂起。" />
            <SmallState title="设计重点" text="份额价格 / implied probability / 欧洲赔率切换、交易面板、Portfolio、流动性和异常状态。" />
          </div>
        </div>

        <div className="space-y-6">
          <ChangeComparisonRow
            index="01"
            title="首页比赛列表价格列"
            scope="SoccerPage / MatchListCard"
            summary="比赛列表仍展示胜平负、大小球、让球列，但数字不再表达平台承诺赔率，而是 AMM outcome 的可切换价格。"
            before={<OldMarketListPreview />}
            after={<NewAmmMarketListPreview />}
            paths={['src/pages/SoccerPage.tsx', 'src/components/soccer/MatchListCard.tsx']}
            statusTags={['正式路由', '价格展示改动']}
            notes={['保留原来的列位置和市场入口。', '价格格式受全局偏好影响：份额价格 / 欧洲赔率。', '点击比赛仍进入详情页，不在列表直接提交交易。']}
          />

          <ChangeComparisonRow
            index="02"
            title="市场卡片和 outcome 按钮"
            scope="MarketRenderer → AmmMarketRenderer"
            summary="原来点击赔率按钮加入投注单；现在点击 outcome 选中可交易份额，并在右栏生成 AMM quote。"
            before={<OldOutcomeButtonsPreview />}
            after={<NewAmmOutcomeButtonsPreview />}
            paths={['src/components/soccer/MarketRenderer.tsx', 'src/components/soccer/AmmMarketRenderer.tsx']}
            statusTags={['组件替换', 'outcome 交易']}
            notes={['每个 outcome 展示价格、24h 变化、流动性深度和状态。', '欧洲赔率仅为展示换算，不改变成交字段。', '多 outcome 市场要展示总概率和互斥结算关系。']}
          />

          <ChangeComparisonRow
            index="03"
            title="7 个单场市场全量 AMM 化"
            scope="SoccerMatchPage / sourceMatch.tabs"
            summary="不是只改胜平负示例；当前足球 tab 可见的 7 个单场市场都要从赔率按钮变成 AMM outcome。"
            before={<OldSingleMarketCoveragePreview />}
            after={<NewAmmSingleMarketCoveragePreview />}
            paths={['src/pages/SoccerMatchPage.tsx', 'src/data/soccer/mockData.ts', 'src/data/soccer/ammData.ts']}
            statusTags={['7/7 单场市场', '不新增不删除']}
            notes={['胜平负、开球权、让球、让球 0:1、总进球数、大小球、波胆全部覆盖。', '市场名称和排序不变，只替换交易语义。', '波胆和区间类市场也必须用 outcome、shares、position 表达。']}
          />

          <ChangeComparisonRow
            index="04"
            title="比赛详情右栏"
            scope="SoccerBetSlip → AmmTradePanel"
            summary="右栏从传统投注单改为 AMM 交易面板。买入和卖出都走即时 quote，支持部分卖出和全部卖出。"
            before={<OldBetSlipPanelPreview />}
            after={<NewAmmTradePanelPreview />}
            paths={['src/pages/SoccerMatchPage.tsx', 'src/components/soccer/AmmTradePanel.tsx']}
            statusTags={['买入', '部分卖出', '全部卖出']}
            notes={['买入确认展示份额、成交均价、价格影响、手续费和最大亏损。', '卖出确认额外展示收回金额、已实现盈亏和卖出后剩余份额。', '部分卖出不是部分成交，也不产生挂单。']}
          />

          <ChangeComparisonRow
            index="05"
            title="交易面板状态矩阵"
            scope="AmmTradePanel / soccerAmmStore"
            summary="v6 不再用投注单的空单、串关、二次确认状态；交易面板要覆盖 AMM quote 生命周期和风险拦截。"
            before={<OldBetSlipStateMatrixPreview />}
            after={<NewAmmTradeStateMatrixPreview />}
            paths={['src/components/soccer/AmmTradePanel.tsx', 'src/stores/soccerAmmStore.ts']}
            statusTags={['quote 生命周期', '风险反馈', '无挂单']}
            notes={['空选择、买入、卖出、部分卖出、全部卖出都要有明确状态。', '余额不足、quote 过期、价格影响过高、流动性不足需要整笔失败并重新询价。', '不出现串关、接受赔率变化、二次确认投注等传统动作。']}
          />

          <ChangeComparisonRow
            index="06"
            title="我的注单页面"
            scope="SoccerMyBetsPage / MyBetsPanel → Portfolio"
            summary="我的注单不再是注单记录中心，而是持仓管理中心。卖出能力依赖 Portfolio。"
            before={<OldMyBetsPreview />}
            after={<NewPortfolioPreview />}
            paths={['src/pages/SoccerMyBetsPage.tsx', 'src/components/soccer/AmmPortfolioPanel.tsx']}
            statusTags={['Portfolio', '持仓管理', '成交记录']}
            notes={['展示当前持仓、可卖份额、平均成本、当前价格和市值。', '区分已实现 / 未实现盈亏。', '提供卖出入口、历史成交和已结算市场。']}
          />

          <ChangeComparisonRow
            index="07"
            title="Portfolio 状态补全"
            scope="AmmPortfolioPanel"
            summary="Portfolio 不只是替换页面标题，还要成为用户管理 AMM position 的中心，覆盖活跃、已结算和 void 场景。"
            before={<OldMyBetsStateMatrixPreview />}
            after={<NewPortfolioStateMatrixPreview />}
            paths={['src/components/soccer/AmmPortfolioPanel.tsx', 'src/stores/soccerAmmStore.ts']}
            statusTags={['可卖份额', '盈亏', 'void / settled']}
            notes={['当前持仓要区分 outcome、份额、均价、当前价格、市值。', '历史成交要区分买入、部分卖出、全部卖出。', '结算和 void 不再按注单记录表达，而按 position 生命周期表达。']}
          />

          <ChangeComparisonRow
            index="08"
            title="冠军与晋级详情页"
            scope="SoccerFuturesPage"
            summary="系列赛对象、阶段分组和 11 个市场保持不变，只把平台报价按钮换成 AMM outcome 交易。"
            before={<OldFuturesMarketPreview />}
            after={<NewAmmFuturesMarketPreview />}
            paths={['src/pages/SoccerFuturesPage.tsx', 'src/data/soccer/futuresData.ts']}
            statusTags={['11/11 赛事级市场', '长期持仓']}
            notes={['世界杯、欧冠、英超等对象不新增、不删除、不重排。', '每个长期市场仍展示关闭时间、预计结算和官方来源。', '长期市场同样支持买入、部分卖出、全部卖出。']}
          />

          <ChangeComparisonRow
            index="09"
            title="价格格式切换和异常反馈"
            scope="全局偏好 / 市场卡 / 交易确认 / Portfolio"
            summary="赔率格式设置变成份额价格 / 欧洲赔率切换；异常从下单拒单转向 AMM quote、流动性和市场暂停反馈。"
            before={<OldSettingsAndErrorPreview />}
            after={<NewPriceAndRiskPreview />}
            paths={['src/components/soccer/SoccerPriceFormatToggle.tsx', 'src/data/soccer/ammData.ts']}
            statusTags={['份额主价格', '欧洲赔率展示', 'AMM 风险态']}
            notes={['交易确认中同时展示份额价格、implied probability 和欧洲赔率。', '报价过期、流动性不足、价格影响过高时整笔交易失败并重新询价。', '关键事件暂停同时影响买入和卖出。']}
          />

          <ChangeComparisonRow
            index="10"
            title="全局残留边界和明确排除"
            scope="AppShell / SoccerBetSlipFloat / SoccerPrediction* / CLOB"
            summary="把仍存在但不属于 v6 主流程的入口明确标成历史或排除项，避免设计评审把它们当作 AMM 需求。"
            before={<OldGlobalResidualPreview />}
            after={<NewV6BoundaryPreview />}
            paths={['src/layouts/AppShell.tsx', 'src/components/soccer/SoccerBetSlipFloat.tsx', 'src/pages/ClobPage.tsx']}
            statusTags={['历史残留', '未路由排除', 'CLOB 延后']}
            notes={['SoccerBetSlipFloat 是传统投注残留，不能作为 v6 AMM 用户主流程。', 'SoccerPrediction* 未注册在当前路由，不纳入本次足球 AMM 差异。', 'CLOB 足球页是未来大版本，不展示订单簿、限价单或撤单。']}
          />

          <ChangeComparisonRow
            index="11"
            title="比赛详情交互细节"
            scope="v5 code 8e53715 SoccerMatchPage → v6 current SoccerMatchPage"
            summary="v5 代码里不只是市场卡，仍有 selectedKeys、同盘口选中、串关互斥、盘口折叠和 odds seed；这些都要在 v6 对比中消失或映射。"
            before={<OldV5MatchInteractionPreview />}
            after={<NewV6MatchInteractionPreview />}
            paths={['git show 8e53715:src/pages/SoccerMatchPage.tsx', 'src/pages/SoccerMatchPage.tsx']}
            statusTags={['v5 代码基线', '交互全覆盖']}
            notes={['selectedKeys 高亮从投注单选择态，改为 selectedOutcome。', 'MARKET_COLLAPSE_THRESHOLD 折叠仍可作为展示能力，但不再服务投注单选项。', '串关冲突提示在 v6 主流程消失。']}
          />

          <ChangeComparisonRow
            index="12"
            title="报价锁定与刷新机制"
            scope="oddsRegistry / oddsTicker → AMM quote"
            summary="v5 通过 oddsRegistry、oddsTicker、接受最新赔率和二次确认保护投注；v6 改为 quote 过期、重新询价和整笔交易失败。"
            before={<OldV5OddsLifecyclePreview />}
            after={<NewAmmQuoteLifecyclePreview />}
            paths={['src/services/oddsRegistry.ts', 'src/services/oddsTicker.ts', 'src/stores/soccerAmmStore.ts']}
            statusTags={['报价生命周期', '交易保护']}
            notes={['v5 第一次点击接受最新赔率只更新快照。', 'v6 暂停后恢复必须重新 quote。', '价格影响和流动性不足不生成等待订单。']}
          />

          <ChangeComparisonRow
            index="13"
            title="我的注单工具区"
            scope="v5 SoccerMyBetsPage → v6 SoccerMyBetsPage"
            summary="v5 同期代码包含状态筛选、日期筛选、分页加载、Cash Out、重投、导出 CSV 和复制注单号；v6 全部要映射到 Portfolio 和 trade history。"
            before={<OldV5MyBetsToolsPreview />}
            after={<NewV6PortfolioToolsPreview />}
            paths={['git show 8e53715:src/pages/SoccerMyBetsPage.tsx', 'src/pages/SoccerMyBetsPage.tsx']}
            statusTags={['Cash Out 移除', 'Portfolio 替代']}
            notes={['Cash Out 被 AMM 卖出替代。', '重投被再次买入相同 outcome 替代。', '导出注单不是 v6 主流程，可后续作为成交导出重新定义。']}
          />

          <ChangeComparisonRow
            index="14"
            title="冠军与晋级代码细节"
            scope="v5 SoccerFuturesPage → v6 SoccerFuturesPage"
            summary="v5 代码中的平台欧洲盘报价、多笔单注、暂不串关、关闭时间和结算来源，都要逐项转换为长期 AMM position 的展示。"
            before={<OldV5FuturesCodePreview />}
            after={<NewV6FuturesCodePreview />}
            paths={['git show 8e53715:src/pages/SoccerFuturesPage.tsx', 'src/pages/SoccerFuturesPage.tsx']}
            statusTags={['11/11 长期市场', '分组不变']}
            notes={['对象卡和阶段分组保留。', '投注方式说明改为 AMM 买入 / 卖出。', '关闭时间和结算来源继续保留，但服务 resolution 而非注单。']}
          />

          <ChangeComparisonRow
            index="15"
            title="术语与按钮文案全替换"
            scope="v5 user copy → v6 AMM copy"
            summary="所有传统投注词都必须在 v6 主流程替换。保留在历史 tab 的词需要明确标注为 v5 对照，不可进入 v6 完整展板。"
            before={<OldV5TerminologyPreview />}
            after={<NewV6TerminologyPreview />}
            paths={['v5.0 PRD', 'v6.0 PRD', 'src/components/soccer']}
            statusTags={['术语全覆盖', '文案验收']}
            notes={['投注项、注单、串关、返还、Cash Out、赔率承诺全部退出 v6 主流程。', 'outcome、shares、position、trade、collateral、sell、settlement 成为主词。', '欧洲赔率只能作为展示换算。']}
          />
        </div>
      </BoardSection>

      <SectionDivider title="B. 全量覆盖 / 历史回归检查区" description="从这里开始是覆盖和回归清单，不代表 v6 当前主流程仍使用传统投注。需要看本次设计改动时，以上方 A 区为准。" />

      <BoardSection id="coverage-matrix" title="B0. 覆盖矩阵" description="把足球相关内容拆成 v6 激活主流程、历史对照和明确排除三类，避免 covered 全绿但语义混淆。">
        <div className="grid gap-4 xl:grid-cols-3">
          <StateCard title="v6 激活主流程" description="当前 /soccer 正式路由和 AMM 核心组件，设计评审优先核对。">
            <CoverageList items={v6ActiveCoverage} status="active" />
          </StateCard>
          <StateCard title="历史 / 对照组件" description="保留用于旧版对照或回归，不代表 v6 当前主流程。">
            <CoverageList items={legacyCoverage} compact status="legacy" />
          </StateCard>
          <StateCard title="未路由 / 明确排除" description="本期不纳入足球 AMM Design Board 差异区的内容。">
            <CoverageList items={excludedCoverage} status="excluded" />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="page-states" title="B1. 页面级覆盖检查" description="全量检查页面骨架、异常入口和历史对照预览；其中传统投注示意只用于回归，不代表 v6 AMM 主流程。">
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <StateCard title="首页左侧导航" description="联赛筛选、全部赛事、进行中数量、进行中比赛和即将开赛。">
            <LeagueSidebarPreview />
          </StateCard>
          <StateCard title="首页比赛列表" description="赛前、进行中、已结束和异常比赛同屏展示；快捷赔率列应正常显示。">
            <ListTablePreview />
          </StateCard>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <StateCard title="比赛详情页历史布局" description="路径导航、比赛头部、所有盘口、盘口列表和传统右栏对照；v6 当前右栏以 A 区 AmmTradePanel 为准。">
            <MatchDetailPreview />
          </StateCard>
          <StateCard title="冠军与晋级首页" description="先展示不同系列赛或赛季对象，再进入对象内部查看预测。">
            <FuturesSeriesPreview />
          </StateCard>
          <StateCard title="冠军与晋级详情页" description="系列赛详情页：头部、阶段分组、官方结算来源和不可串关提示。">
            <FuturesDetailPreview />
          </StateCard>
          <StateCard title="传统我的注单页布局" description="状态筛选、日期筛选、导出、列表、加载更多和空态；v6 当前页面以 Portfolio 为准。">
            <MyBetsPagePreview />
          </StateCard>
          <StateCard title="未找到该场比赛" description="无效比赛入口的异常页面和返回动作。">
            <NotFoundPreview />
          </StateCard>
          <StateCard title="页面骨架" description="列表页和详情页加载中的骨架状态。">
            <div className="space-y-4">
              <div className="max-h-56 overflow-hidden rounded-lg border border-[var(--border)]"><SoccerListSkeleton /></div>
              <div className="max-h-56 overflow-hidden rounded-lg border border-[var(--border)]"><SoccerMatchSkeleton /></div>
            </div>
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="match-states" title="B2. 比赛状态和右栏信息" description="展示赛前、进行中、已结束和异常比赛状态，以及倒计时、事件、阵容、交锋、统计和特殊情况说明。">
        <div className="grid gap-4 lg:grid-cols-2">
          {headerMatches.map((item) => (
            <StateCard key={item.label} title={item.label} description={item.note}>
              <MatchHeader match={item.match} />
            </StateCard>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <StateCard title="赛前信息右栏" description="倒计时、裁判、阵容和交锋。">
            <MatchInfoPanel match={matchWith('scheduled')} />
          </StateCard>
          <StateCard title="进行中信息右栏" description="比分、分钟、事件、统计和阵容。">
            <MatchInfoPanel match={matchWith('live', { score: { home: 1, away: 0 }, currentMinute: 65 })} />
          </StateCard>
          <StateCard title="完赛信息右栏" description="最终比分、统计和完赛事件。">
            <MatchInfoPanel match={matchWith('finished', { score: { home: 0, away: 1 }, events: finishedSourceMatch.events, stats: finishedSourceMatch.stats })} />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="lean-markets" title="B3. 历史单场盘口覆盖（非 v6 交易语义）" description="这里保留 7 个核心盘口的历史渲染和命名回归；v6 当前交易语义已在 A 区改为 AMM outcome。">
        <div className="grid gap-3 md:grid-cols-3">
          <SmallState title="波胆" text="猜具体比分，按主胜比分、平局比分、客胜比分和其他比分分组展示。" />
          <SmallState title="总进球数" text="猜整场准确总进球档位，例如 0、1、2、3、4、5+。" />
          <SmallState title="大小球" text="围绕线值选择大或小，例如大 2.5 / 小 2.5，不等同于总进球数。" />
        </div>
        <StateCard title="盘口命名交付口径" description="设计稿、文案和 mock 必须统一使用这些用户可见名称，旧翻译只作为内部兼容。">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['让球', '亚洲让球 / Asian Handicap，按钮内展示球队与线值。'],
              ['让球 0:1', '欧洲让球胜平负，先加虚拟比分再判断胜平负。'],
              ['大小球', 'Over / Under，例如大 2.5、 小 2.5。'],
              ['总进球数', '准确总进球档位，例如 0、1、2、3、4、5+。'],
              ['波胆', 'Correct Score，分组展示具体比分和其他比分。'],
              ['双重机会', 'Double Chance，扩展盘口中不再使用“双胜彩”。'],
              ['胜平负', '1X2，判断全场主胜、平局、客胜。'],
              ['开球权', '趣味盘，判断哪方先开球。'],
            ].map(([title, text]) => (
              <SmallState key={title} title={title} text={text} />
            ))}
          </div>
        </StateCard>
        <div className="grid gap-4 xl:grid-cols-2">
          {leanMarketScenarios.map((item) => (
            <StateCard key={item.title} title={item.title} description="当前主流程盘口。">
              <MarketRenderer market={item.market} displayTitle={item.market.title} matchId={liveSourceMatch.id} onSelect={noop} />
            </StateCard>
          ))}
        </div>
      </BoardSection>

      <BoardSection id="future-markets" title="B4. 历史冠军与晋级结构覆盖（非 v6 交易语义）" description="这里保留系列赛对象、阶段分组和市场数量回归；v6 当前 11 个赛事级市场已在 A 区改为 AMM outcome。">
        <div className="grid gap-4 xl:grid-cols-2">
          {futuresCompetitions.map((competition) => (
            <StateCard key={competition.id} title={competition.shortName} description={competition.headline}>
              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <SmallState title="系列赛对象" text={`${competition.region} · ${competition.seriesType} · ${competition.phase}`} />
                  <SmallState title="历史投注方式" text="v4.7 对照：支持单注和多笔单注；v6 当前改为 AMM 交易。" />
                  <SmallState title="结算来源" text="按官方赛事结果、积分榜或晋级结果结算。" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {futureGroups(competition).map((group) => (
                    <span key={group} className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[10px] text-[#E85A7E]">{group}</span>
                  ))}
                </div>
                {competition.markets.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[10px] text-[#E85A7E]">{item.group}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">{item.subject.resolutionTimeLabel}</span>
                    </div>
                    <MarketRenderer market={item.market} displayTitle={item.market.title} matchId={item.subject.subjectId} onSelect={noop} />
                    <p className="mt-2 text-[10px] text-[var(--text-secondary)]">结算来源：{item.subject.resolutionSource}</p>
                  </div>
                ))}
              </div>
            </StateCard>
          ))}
        </div>
        <StateCard title={`冠军与晋级 ${futureMarketCoverage.length} 个市场全量覆盖`} description="逐项核对当前 futuresData 中全部赛事级市场，确保系列赛对象、阶段分组、冠军、晋级、赛季结果、系列赛和 upcoming 状态没有遗漏。">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {futureMarketCoverage.map((item) => (
              <SmallState key={item.id} title={item.title} text={item.text} />
            ))}
          </div>
        </StateCard>
        <div className="grid gap-4 md:grid-cols-3">
          <BetSlipPreview title="长期盘多笔单注" lines={['欧冠冠军 · 皇家马德里 @4.20', '晋级决赛 · 曼城 是 @2.55', '每项独立生成注单']} footer="二次确认" />
          <BetSlipPreview title="系列赛预测" lines={['皇家马德里 vs 巴塞罗那 · 两回合系列赛', '选择：皇家马德里晋级 @1.92', '包含加时和点球晋级结果']} footer="按 UEFA 官方结果结算" />
          <BetSlipPreview title="暂不支持串关" lines={['冠军与晋级类强相关边界复杂', '第一版作为多笔单注提交', '串关按钮给出明确说明']} footer="可改为多笔单注" tone="warning" />
        </div>
      </BoardSection>

      <BoardSection id="market-states" title="B5. 历史盘口状态和串关互斥" description="保留暂停、作废、结算、封盘和串关冲突的历史回归；v6 当前不展示串关互斥，改为 AMM 交易可用性和 quote 风险。">
        <div className="grid gap-4 xl:grid-cols-2">
          {marketStateScenarios.map((item) => (
            <StateCard key={item.label} title={item.label} description={item.note}>
              {item.market ? (
                <MarketRenderer
                  market={item.market}
                  displayTitle={item.market.title}
                  matchId={liveSourceMatch.id}
                  onSelect={noop}
                  selectedKey={item.selectedKey}
                  conflictWith={item.conflict ? '胜平负' : undefined}
                  conflictReason={item.conflict ? '波胆会直接推出胜平负结果，不能放进同一张串关。' : undefined}
                  onReplaceConflict={item.conflict ? noop : undefined}
                />
              ) : (
                <HiddenPlaceholder />
              )}
            </StateCard>
          ))}
        </div>
        <StateCard title="串关互斥说明" description="只在串关模式展示冲突对象、原因和可继续操作的方式。">
          <div className="grid gap-3 md:grid-cols-3">
            {conflictExamples.map(([title, reason]) => (
              <SmallState key={title} title={title} text={reason} />
            ))}
          </div>
        </StateCard>
      </BoardSection>

      <BoardSection id="goal-toggle" title="B6. 历史开赛封盘和市场关闭" description="保留传统封盘和市场关闭回归；v6 当前需要映射为 AMM 市场暂停、不可买入和不可卖出状态。">
        <div className="grid gap-4 lg:grid-cols-4">
          <StateCard title="赛前可投注" description="比赛未开始，开放盘口可以选择。">
            <MarketRenderer market={marketByTitle('大小球')} displayTitle="大小球" matchId={liveSourceMatch.id} onSelect={noop} />
          </StateCard>
          <StateCard title="开赛后封盘" description="比赛进行中，盘口保留展示但不可选择。">
            <MarketRenderer market={marketByTitle('大小球')} displayTitle="大小球" matchId={liveSourceMatch.id} onSelect={noop} bettingClosed />
          </StateCard>
          <StateCard title="赔率锁定" description="开赛后赔率停止变化，只保留开赛前最后一次报价。">
            <BetSlipPreview title="盘口已封盘" lines={['弗拉门戈 vs 科林蒂安', '大小球 · 大 2.5 @2.05', '比赛已开始，赔率已锁定']} footer="不可提交" tone="warning" />
          </StateCard>
          <StateCard title="投注单已有该场比赛" description="开赛后，投注单中的相关项不可提交，需要移除。">
            <BetSlipPreview title="含不可用项" lines={['弗拉门戈 vs 科林蒂安', '大小球 · 大 2.5 @2.05', '比赛已开始，盘口已封盘']} footer="移除不可用项后再提交" tone="warning" />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="betslip-states" title="B7. 传统投注单状态（非 v6 主流程）" description="集中展示传统空单、多笔单注、串关、报价、二次确认、提交反馈和设置；v6 当前以 AmmTradePanel 状态为准。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BetSlipPreview title="空单" lines={['投注单', '点击赔率按钮添加选项']} footer="不可提交" />
          <BetSlipPreview title="多笔单注" lines={['2 项 · 独立注单', '每项分别输入或套用金额', '提交后生成多张单腿注单']} footer="二次确认" />
          <BetSlipPreview title="串关" lines={['3 项 · 跨 3 场', '总赔率 7.42', '全部选项命中方可获胜']} footer="确认串关" />
          <BetSlipPreview title="同盘口替换" lines={['已选择：主胜 @1.83', '再选平局时替换原选项', '投注单只保留一个同盘口选项']} footer="替换后重新核对" />
          <BetSlipPreview title="多笔单注同场多盘口" lines={['胜平负 + 波胆', '作为独立单注提交', '不展示串关冲突遮罩']} footer="可继续提交" tone="success" />
          <BetSlipPreview title="串关同场冲突" lines={['胜平负 × 波胆', '波胆会推出胜平负', '不能放入同一张串关']} footer="移除冲突项或改为多笔单注" tone="warning" />
          <BetSlipPreview title="折叠投注单" lines={['投注单已收起', '3 项 · 总赔率 7.42']} footer="点击展开" />
          <BetSlipPreview title="报价倒计时" lines={['报价剩余 00:24', '最新报价 @1.83']} footer="可提交" tone="success" />
          <BetSlipPreview title="报价过期" lines={['报价已过期', '请接受最新报价']} footer="接受最新报价" tone="warning" />
          <BetSlipPreview title="下单区报价变化" lines={['1.83 → 1.76', '主按钮变为接受最新报价', '第一次点击只更新赔率快照']} footer="再次点击才进入确认" tone="warning" />
          <BetSlipPreview title="二次确认" lines={['投注方式、明细、金额、赔率', '核对后提交']} footer="确认投注" />
          <BetSlipPreview title="确认中报价变化" lines={['1.83 → 1.76', '弹窗主按钮变为接受最新报价', '接受后回到确认弹窗复核']} footer="再次确认后提交" tone="warning" />
          <BetSlipPreview title="未达最低投注金额" lines={['投注金额 0.5 USDT', '最低投注金额为 1 USDT']} footer="调整金额" tone="danger" />
          <BetSlipPreview title="余额不足" lines={['总投注额 12,000 USDT', '可用余额 10,000 USDT']} footer="降低金额" tone="danger" />
          <BetSlipPreview title="含开赛封盘项" lines={['比赛已开始', '该比赛盘口已封盘', '关联投注项不可提交']} footer="移除不可用项" tone="warning" />
          <BetSlipPreview title="提交中" lines={['正在确认投注...', '按钮禁用，避免重复提交']} footer="请等待" />
          <BetSlipPreview title="提交失败" lines={['盘口已关闭', '投注单和金额保留']} footer="移除后重试" tone="danger" />
          <SettingsPreview />
          <ConfirmPreview />
          <BetSlipPreview title="提交反馈汇总" lines={['赔率变化 / 盘口关闭 / 比赛暂不支持投注', '金额、余额、投注项数量、选项组合、提交状态']} footer="按提示调整后重新提交" tone="warning" />
        </div>
      </BoardSection>

      <BoardSection id="float-states" title="B8. 传统浮动投注单残留边界" description="AppShell 仍挂载传统足球浮动条，本区只作为遗留边界说明；v6 AMM 主流程不应依赖该浮动条。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SmallState title="无投注项" text="不展示浮动条。" />
          <FloatPreview title="1 项" subtitle="总赔率 1.83" />
          <FloatPreview title="3 项" subtitle="总赔率 7.42 · 跨 3 场" />
          <FloatPreview title="赔率已变动" subtitle="总赔率 6.88 · 赔率已变动" warning />
        </div>
      </BoardSection>

      <BoardSection id="mybets-states" title="B9. 传统我的注单（非 v6 Portfolio）" description="展示传统注单页、右栏摘要、多笔单注卡、串关卡、赛事级注单和结算结果；v6 当前以 Portfolio 为准。">
        <div className="grid gap-4 xl:grid-cols-2">
          <StateCard title="右栏我的注单摘要" description="最近注单、已实现盈亏、未结算本金和前往我的注单。">
            <MyBetsPanel bets={sampleBets.slice(0, 5)} />
          </StateCard>
          <StateCard title="我的注单页筛选和空态" description="状态筛选、日期筛选、导出、加载更多、空列表。">
            <MyBetsPagePreview />
          </StateCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sampleBets.map((bet) => (
            <MyBetCard key={bet.id} bet={bet} onCashOut={noop} onReplay={noop} onCopyCode={noop} />
          ))}
          <MyBetCard bet={parlayBet} onCashOut={noop} onReplay={noop} onCopyCode={noop} />
        </div>
      </BoardSection>

      <BoardSection id="rule-states" title="B10. 历史报价和提交反馈" description="传统投注报价和提交反馈回归；v6 当前对应为 quote 过期、价格影响、流动性不足和市场暂停。">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {rejectReasons.map(([title, text]) => (
            <SmallState key={title} title={title} text={text} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SmallState title="多笔单注" text="一次提交多个投注项，但每笔独立生成注单、独立结算。" />
          <SmallState title="串关" text="多个投注项组成一张注单，全部命中方可获胜。" />
          <SmallState title="开赛封盘" text="比赛开始后所有盘口不可再选，投注单内相关项不可提交。" />
        </div>
      </BoardSection>

      <BoardSection id="component-matrix" title="B11. 足球组件覆盖总表" description="逐个核对足球组件目录；需结合 B0 判断其是 v6 激活、历史对照还是未路由/排除。">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {soccerComponentCoverage.map(([name, text]) => (
            <SmallState key={name} title={name} text={text} />
          ))}
        </div>
      </BoardSection>

      <BoardSection id="edge-states" title="B12. 异常与边界" description="集中展示异常：比赛取消、盘口作废、无数据、骨架和无效入口；v6 AMM 风险反馈以 A 区为准。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BetSlipPreview title="比赛取消" lines={['比赛状态：取消', '相关盘口不再接受选择', '已下注按作废/退款规则处理']} footer="相关盘口作废" tone="warning" />
          <BetSlipPreview title="盘口作废" lines={['盘口状态：void', '注单保留记录', '本金退回或按走盘处理']} footer="退款 / 走盘" tone="warning" />
          <NotFoundPreview />
          <SmallState title="加载骨架" text="列表和详情仍使用 SoccerListSkeleton / SoccerMatchSkeleton。" />
        </div>
      </BoardSection>

      <BoardSection id="compliance-degrade" title="B13. 中国大陆语境合规降级视图" description="仅作为设计状态展示，不实现地区准入、KYC、身份认证或真实拦截逻辑。">
        <ComplianceDegradePreview />
      </BoardSection>
        </>
      )}
    </div>
  )
}

function V6FullDesignBoardTab() {
  const v6PageCoverage = [
    ['足球首页', '/soccer', '单场预测 / 冠军与晋级、联赛导航、进行中/即将开赛、AMM 价格列、份额价格切换、市场数量。'],
    ['比赛详情', '/soccer/match/:matchId', '面包屑、比赛头部、市场 tab、7 个 AMM 单场市场、右栏赛事信息、交易面板、Portfolio 摘要。'],
    ['冠军与晋级详情', '/soccer/futures/:competitionId', '系列赛对象、阶段分组、11 个赛事级 AMM 市场、关闭时间、结算来源、右栏交易与持仓。'],
    ['Portfolio', '/soccer/mybets', '当前持仓、可卖份额、均价、现价、市值、已实现/未实现盈亏、最近成交和卖出入口。'],
    ['Design Board', '/soccer/design-board', '本页两 tab：v6 完整展板 + v5 到 v6 全量 UI 变更对比。'],
  ]
  const v6MarketCoverage = [
    ...LEAN_MARKET_ORDER.map((title) => [title, '单场 7/7', 'v6 使用 AMM outcome、份额价格、隐含概率、流动性深度和交易状态。']),
    ...futureMarketCoverage.map((item) => [item.title, '冠军与晋级 11/11', `${item.text}｜v6 使用长期 AMM position，可买入、部分卖出、全部卖出。`]),
  ]
  const v6StateCoverage = [
    ['市场状态', 'open / paused / closed / settled / void', '分别展示可交易、暂停交易、关闭、已结算、作废退款。'],
    ['交易状态', '未选 / 买入 / 卖出 / 部分卖出 / 全部卖出', '全部通过 AMM quote 即时成交，不产生挂单或部分成交挂起。'],
    ['Quote 风险', '过期 / 余额不足 / 价格影响过高 / 流动性不足', '整笔交易失败并重新询价，不能沿用旧报价。'],
    ['Portfolio 生命周期', '持仓 / 最近成交 / 已实现盈亏 / 未实现盈亏 / settled / void', '以 position 和 trade 为中心，不再以注单为中心。'],
    ['比赛异常映射', 'live / postponed / cancelled / abandoned / interrupted', '从 v5 封盘心智映射为 AMM 市场暂停、关闭或 void。'],
    ['价格显示', '55¢ / $0.55 per share + 55% implied + 欧赔 1.82', '份额价格为主价格，百分比仅为隐含概率说明。'],
  ]

  return (
    <>
      <BoardSection id="v6-overview" title="v6.0 完整 Design Board 总览" description="本 tab 只展示当前足球 AMM 主流程。传统投注单、串关、Cash Out、订单簿和 CLOB 都不作为 v6 主流程出现。">
        <div className="grid gap-4 xl:grid-cols-3">
          <StateCard title="页面覆盖 5/5" description="当前足球 tab 正式路由与设计评审页全部覆盖。">
            <CoverageList items={v6PageCoverage} status="active" />
          </StateCard>
          <StateCard title="核心组件覆盖" description="v6 激活组件直接进入完整展板和变更对比。">
            <CoverageList items={v6ActiveCoverage} compact status="active" />
          </StateCard>
          <StateCard title="明确排除" description="这些内容不能出现在 v6 AMM 主流程中。">
            <CoverageList items={excludedCoverage} status="excluded" />
          </StateCard>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <SmallState title="单场市场" text="7/7 全覆盖：胜平负、开球权、让球、让球 0:1、总进球数、大小球、波胆。" />
          <SmallState title="赛事级市场" text={`11/11 全覆盖：当前 futuresData 中 ${futureMarketCoverage.length} 个冠军与晋级市场。`} />
          <SmallState title="价格主口径" text="交易价格显示为 55¢ 或 $0.55/share；55% 仅作为 implied probability。" />
          <SmallState title="交易模型" text="AMM 即时 quote，买入、部分卖出、全部卖出；不展示挂单和部分成交挂起。" />
        </div>
      </BoardSection>

      <BoardSection id="v6-pages" title="v6.0 页面完整预览" description="按当前正式路由组织，展示设计师需要签收的主流程画面和状态。">
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <StateCard title="/soccer 左侧导航" description="联赛筛选、全部赛事、进行中和即将开赛保持 v5 信息架构。">
            <LeagueSidebarPreview />
          </StateCard>
          <StateCard title="/soccer AMM 比赛列表" description="同一列表位置展示份额价格，不再展示平台承诺赔率。">
            <ListTablePreview />
          </StateCard>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <StateCard title="/soccer/match/:matchId 完整 v6 布局" description="7 个 AMM 单场市场 + 右栏赛事信息、交易面板和 Portfolio 摘要。">
            <V6MatchDetailPreview />
          </StateCard>
          <StateCard title="/soccer/futures/:competitionId 完整 v6 布局" description="系列赛对象、阶段分组、11 个长期 AMM 市场和结算来源。">
            <V6FuturesDetailPreview />
          </StateCard>
          <StateCard title="/soccer/mybets Portfolio" description="以 position/trade 管理持仓，支持卖出入口和历史成交。">
            <NewPortfolioStateMatrixPreview />
          </StateCard>
          <StateCard title="无效入口和骨架" description="无效比赛、加载骨架和空态仍需覆盖。">
            <div className="space-y-4">
              <NotFoundPreview />
              <div className="max-h-40 overflow-hidden rounded-lg border border-[var(--border)]"><SoccerListSkeleton /></div>
            </div>
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="v6-markets" title="v6.0 市场全量覆盖" description="所有 v5 可见市场均切换为 AMM outcome。这里给出 7/7 单场和 11/11 冠军与晋级的覆盖证明。">
        <StateCard title="单场 7 个核心市场" description="保持 v5 名称、入口和排序，只替换价格和交易模型。">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {LEAN_MARKET_ORDER.map((title) => <SmallState key={title} title={title} text="AMM outcome / 份额价格 / implied probability / 流动性深度 / 可交易状态。" />)}
          </div>
        </StateCard>
        <StateCard title={`冠军与晋级 ${futureMarketCoverage.length} 个赛事级市场`} description="保留对象、分组、关闭时间和结算来源；交易改为长期 AMM position。">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {v6MarketCoverage.slice(7).map(([title, scope, detail]) => <SmallState key={title} title={`${scope} · ${title}`} text={detail} />)}
          </div>
        </StateCard>
      </BoardSection>

      <BoardSection id="v6-states" title="v6.0 状态、异常和结算" description="覆盖 AMM 交易生命周期、市场可用性、Portfolio 生命周期、合规结算信息和风险反馈。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {v6StateCoverage.map(([title, pathOrText, detail]) => <SmallState key={title} title={`${title}｜${pathOrText}`} text={detail} />)}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <NewAmmTradeStateMatrixPreview />
          <NewPriceAndRiskPreview />
        </div>
      </BoardSection>

      <BoardSection id="v6-compliance" title="v6.0 合规、结算和边界" description="市场卡和交易确认需要让用户理解 question、结算来源、void、延期和争议处理。">
        <div className="grid gap-4 xl:grid-cols-3">
          <SmallState title="Market question" text="每个 outcome 都必须能表达为清晰问题，例如「RJ博塔弗戈是否全场获胜？」" />
          <SmallState title="Resolution source" text="展示官方赛事结果、积分榜或晋级结果来源，避免平台主观裁定心智。" />
          <SmallState title="Void / dispute" text="延期、腰斩、官方改判、资格递补等进入 void_rule 或 delay/dispute policy。" />
        </div>
      </BoardSection>
    </>
  )
}

function V6MatchDetailPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
        <span>足球</span><span>/</span><span>{sourceMatch.league}</span><span>/</span><span className="text-[var(--text-primary)]">AMM 比赛详情</span>
      </div>
      <MatchHeader match={sourceMatch} />
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
            <span className="rounded-lg bg-[#2DD4BF]/10 px-3 py-1.5 text-xs text-[#2DD4BF]">所有 AMM 市场 · 7/7</span>
          </div>
          <NewAmmOutcomeButtonsPreview />
          <NewAmmSingleMarketCoveragePreview />
        </div>
        <div className="space-y-3">
          <UiPanel title="右栏顺序">
            <div className="space-y-2">
              {['份额价格 / 欧洲赔率切换', 'MatchInfoPanel 赛事信息', 'AmmTradePanel 买入 / 卖出', 'AmmPortfolioPanel compact'].map((item) => (
                <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
              ))}
            </div>
          </UiPanel>
          <NewAmmTradePanelPreview />
        </div>
      </div>
    </div>
  )
}

function V6FuturesDetailPreview() {
  const competition = futuresCompetitions[0]
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-[10px] text-[#E85A7E] uppercase tracking-wider font-semibold">{competition.region} · {competition.seriesType}</p>
        <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">{competition.shortName}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{competition.headline}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <SmallState title="定价方式" text="AMM 份额价格，百分比仅作 implied probability。" />
          <SmallState title="交易方式" text="买入、部分卖出、全部卖出长期 outcome 份额。" />
          <SmallState title="结算来源" text="按官方赛事结果、积分榜或晋级结果结算。" />
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {competition.markets.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-xl border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[10px] text-[#E85A7E]">{item.group}</span>
              <span className="text-[10px] text-[var(--text-secondary)]">{item.subject.resolutionTimeLabel}</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">{item.market.title}</p>
            <p className="mt-1 text-[10px] text-[var(--text-secondary)]">AMM outcome · 份额价格 · 可形成长期 position</p>
            <p className="mt-2 text-[9px] text-[var(--text-secondary)]">结算来源：{item.subject.resolutionSource}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CoverageList({ items, compact, status = 'covered' }: { items: string[][]; compact?: boolean; status?: 'active' | 'legacy' | 'excluded' | 'covered' }) {
  const statusLabel = {
    active: 'active',
    legacy: 'legacy',
    excluded: 'excluded',
    covered: 'covered',
  }[status]
  const statusClass = {
    active: 'bg-[#2DD4BF]/10 text-[#2DD4BF]',
    legacy: 'bg-amber-500/10 text-amber-300',
    excluded: 'bg-red-500/10 text-red-300',
    covered: 'bg-[#2DD4BF]/10 text-[#2DD4BF]',
  }[status]

  return (
    <div className={`grid gap-2 ${compact ? 'md:grid-cols-2' : ''}`}>
      {items.map(([name, pathOrText, detail]) => (
        <div key={name} className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--text-primary)]">{name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] ${statusClass}`}>{statusLabel}</span>
          </div>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)] leading-4">{detail ?? pathOrText}</p>
          {detail && <p className="mt-0.5 text-[9px] font-mono text-[var(--text-secondary)]">{pathOrText}</p>}
        </div>
      ))}
    </div>
  )
}

function ChangeComparisonRow({
  index,
  title,
  scope,
  summary,
  before,
  after,
  paths,
  statusTags,
  notes,
}: {
  index: string
  title: string
  scope: string
  summary: string
  before: React.ReactNode
  after: React.ReactNode
  paths?: string[]
  statusTags?: string[]
  notes: string[]
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2DD4BF]">{index}</span>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{scope}</p>
        </div>
        <span className="rounded-lg bg-[var(--bg-control)] px-3 py-1.5 text-[10px] text-[var(--text-secondary)]">UI 变更对比</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{summary}</p>

      {(paths?.length || statusTags?.length) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {statusTags?.map((tag) => <Pill key={tag} tone="green">{tag}</Pill>)}
          {paths?.map((path) => (
            <span key={path} className="rounded-full bg-[var(--bg-control)] px-2 py-0.5 font-mono text-[9px] text-[var(--text-secondary)]">{path}</span>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="mb-3 text-xs font-semibold text-red-300">原来的 UI</p>
          {before}
        </div>
        <div className="rounded-xl border border-[#2DD4BF]/25 bg-[#2DD4BF]/5 p-4">
          <p className="mb-3 text-xs font-semibold text-[#2DD4BF]">更改后的 UI</p>
          {after}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[var(--bg-control)] p-3">
        <p className="mb-2 text-[10px] font-semibold text-[var(--text-primary)]">设计标注</p>
        <div className="grid gap-2 md:grid-cols-3">
          {notes.map((note) => (
            <p key={note} className="rounded-lg bg-[var(--bg-card)] px-3 py-2 text-[10px] leading-5 text-[var(--text-secondary)]">{note}</p>
          ))}
        </div>
      </div>
    </article>
  )
}

function UiPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
      <p className="mb-3 text-xs font-semibold text-[var(--text-primary)]">{title}</p>
      {children}
    </div>
  )
}

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'pink' | 'amber' }) {
  const cls = {
    neutral: 'bg-[var(--bg-control)] text-[var(--text-secondary)]',
    green: 'bg-[#2DD4BF]/10 text-[#2DD4BF]',
    pink: 'bg-[#E85A7E]/10 text-[#E85A7E]',
    amber: 'bg-amber-500/10 text-amber-300',
  }[tone]
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${cls}`}>{children}</span>
}

function OldMarketListPreview() {
  return (
    <UiPanel title="比赛列表 · 传统赔率列">
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_160px_110px] gap-2 text-[9px] text-[var(--text-secondary)]">
          <span>比赛</span><span className="text-center">胜平负</span><span className="text-center">大小球</span>
        </div>
        <div className="rounded-lg bg-[var(--bg-control)] p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[var(--text-primary)]">RJ博塔弗戈 vs 米拉索尔</span>
            <span className="text-[var(--text-secondary)]">+56 盘口</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {['主 1.83', '平 3.40', '客 4.20', '大 2.05', '小 1.78'].map((item) => (
              <div key={item} className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-center text-[10px] font-mono text-[var(--text-primary)]">{item}</div>
            ))}
          </div>
        </div>
        <p className="text-[10px] leading-5 text-[var(--text-secondary)]">数字含义：欧洲赔率，点击后进入投注单语义。</p>
      </div>
    </UiPanel>
  )
}

function NewAmmMarketListPreview() {
  return (
    <UiPanel title="比赛列表 · AMM 价格列">
      <div className="space-y-2">
        <div className="flex justify-end"><Pill tone="green">份额价格 / 欧洲赔率切换</Pill></div>
        <div className="rounded-lg bg-[var(--bg-control)] p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[var(--text-primary)]">RJ博塔弗戈 vs 米拉索尔</span>
            <span className="text-[#2DD4BF]">AMM +56 市场</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {['主 55¢', '平 29¢', '客 24¢', '大 49¢', '小 56¢'].map((item) => (
              <div key={item} className="rounded border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-2 py-1 text-center text-[10px] font-mono text-[var(--text-primary)]">{item}</div>
            ))}
          </div>
        </div>
        <p className="text-[10px] leading-5 text-[var(--text-secondary)]">数字含义：outcome 当前 AMM 份额价格；55¢ 约等于 55% implied probability，可切换为欧洲赔率展示。</p>
      </div>
    </UiPanel>
  )
}

function OldOutcomeButtonsPreview() {
  return (
    <UiPanel title="盘口卡片 · 赔率按钮">
      <div className="rounded-lg bg-[var(--bg-control)] p-3">
        <p className="mb-2 text-xs font-semibold text-[var(--text-primary)]">胜平负</p>
        <div className="grid grid-cols-3 gap-2">
          {['RJ博塔弗戈 @1.83', '平局 @3.40', '米拉索尔 @4.20'].map((item) => (
            <button key={item} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-3 text-center text-[10px] text-[var(--text-primary)]">{item}</button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">点击：加入投注单。</p>
      </div>
    </UiPanel>
  )
}

function NewAmmOutcomeButtonsPreview() {
  return (
    <UiPanel title="市场卡片 · AMM outcome">
      <div className="rounded-lg bg-[var(--bg-control)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--text-primary)]">胜平负</p>
          <Pill tone="green">总概率 108.0%</Pill>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['RJ博塔弗戈', '55¢', '55% implied · 深度 18k'],
            ['平局', '29¢', '29% implied · 深度 12k'],
            ['米拉索尔', '24¢', '24% implied · 深度 9k'],
          ].map(([label, price, depth]) => (
            <button key={label} className="rounded-lg border border-[#2DD4BF]/25 bg-[#2DD4BF]/5 px-2 py-2 text-left">
              <span className="block text-[10px] text-[var(--text-primary)]">{label}</span>
              <span className="mt-1 block font-mono text-sm font-semibold text-[#2DD4BF]">{price}</span>
              <span className="block text-[9px] text-[var(--text-secondary)]">{depth}</span>
            </button>
          ))}
        </div>
      </div>
    </UiPanel>
  )
}

function OldSingleMarketCoveragePreview() {
  return (
    <UiPanel title="7 个单场市场 · 传统赔率语义">
      <div className="grid gap-2 md:grid-cols-2">
        {LEAN_MARKET_ORDER.map((title) => (
          <div key={title} className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--text-primary)]">{title}</span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">@ odds</span>
            </div>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">点击赔率加入投注单</p>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewAmmSingleMarketCoveragePreview() {
  return (
    <UiPanel title="7 个单场市场 · AMM outcome 语义">
      <div className="grid gap-2 md:grid-cols-2">
        {LEAN_MARKET_ORDER.map((title) => (
          <div key={title} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--text-primary)]">{title}</span>
              <span className="font-mono text-[10px] text-[#2DD4BF]">probability</span>
            </div>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">点击 outcome 打开交易 quote</p>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldBetSlipPanelPreview() {
  return <BetSlipPreview title="右栏投注单" lines={['多笔单注 / 串关', '胜平负 · 主胜 @1.83', '投注金额 100 USDT', '可能返还 183.00 USDT']} footer="确认投注" />
}

function NewAmmTradePanelPreview() {
  return (
    <UiPanel title="右栏 AMM 交易面板">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <span className="rounded-lg bg-[#2DD4BF]/15 px-3 py-2 text-center text-xs text-[#2DD4BF]">买入份额</span>
          <span className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-center text-xs text-[var(--text-secondary)]">卖出份额</span>
        </div>
        {[
          ['预估成交均价', '55¢ / 54.8% implied / 欧赔 1.82'],
          ['价格影响', '1.2%'],
          ['手续费', '0.30 USDT'],
          ['最大亏损', '50.30 USDT'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px]">
            <span className="text-[var(--text-secondary)]">{label}</span><span className="font-mono text-[var(--text-primary)]">{value}</span>
          </div>
        ))}
        <div className="rounded-lg bg-[#2DD4BF] px-3 py-2 text-center text-xs font-semibold text-black">确认买入</div>
      </div>
    </UiPanel>
  )
}

function OldBetSlipStateMatrixPreview() {
  return (
    <UiPanel title="传统投注单状态">
      <div className="grid gap-2 md:grid-cols-2">
        {['空单', '多笔单注', '串关', '报价倒计时', '接受赔率变化', '二次确认', '余额不足', '提交失败'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewAmmTradeStateMatrixPreview() {
  return (
    <UiPanel title="AMM 交易面板状态">
      <div className="grid gap-2 md:grid-cols-2">
        {[
          ['未选择 outcome', '等待选择市场'],
          ['买入 quote', '份额 / 均价 / 最大亏损'],
          ['部分卖出', '输入份额，保留剩余 position'],
          ['全部卖出', '一键清空可卖份额'],
          ['余额不足', '不可确认买入'],
          ['quote 过期', '重新询价'],
          ['价格影响过高', '整笔失败'],
          ['流动性不足', '不生成挂单'],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2">
            <p className="text-[10px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">{text}</p>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldMyBetsPreview() {
  return <BetSlipPreview title="我的注单" lines={['待结算 / 已结算 / 提前结清', '胜平负 · 主胜 @1.83', '本金 100 USDT', 'Cash Out 参考价 92.00']} footer="查看注单详情" />
}

function NewPortfolioPreview() {
  return (
    <UiPanel title="Portfolio / 我的持仓">
      <div className="space-y-2">
        <div className="flex justify-between rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px]">
          <span className="text-[var(--text-secondary)]">持仓市值</span><span className="font-mono text-[var(--text-primary)]">52.40 USDT</span>
        </div>
        <div className="rounded-lg bg-[var(--bg-control)] p-3">
          <p className="text-xs font-semibold text-[var(--text-primary)]">胜平负 · RJ博塔弗戈</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
            <span>份额 84.00</span><span>均价 52¢</span><span className="text-emerald-400">未实现 +4.20</span>
          </div>
          <p className="mt-2 text-right text-[10px] text-[#2DD4BF]">部分卖出 / 全部卖出</p>
        </div>
      </div>
    </UiPanel>
  )
}

function OldMyBetsStateMatrixPreview() {
  return (
    <UiPanel title="传统注单生命周期">
      <div className="space-y-2">
        {['待结算注单', '已结算注单', '提前结清报价', '重投 / 导出记录'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewPortfolioStateMatrixPreview() {
  return (
    <UiPanel title="AMM position 生命周期">
      <div className="space-y-2">
        {[
          ['当前持仓', '份额、均价、当前价格、市值'],
          ['部分卖出后', '剩余份额和已实现盈亏'],
          ['全部卖出后', 'position 关闭，保留成交历史'],
          ['结算 / void', '按 outcome 结果或退款规则更新'],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2">
            <p className="text-[10px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">{text}</p>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldFuturesMarketPreview() {
  return (
    <UiPanel title="冠军与晋级 · 平台报价">
      <div className="space-y-2">
        <Pill tone="pink">世界杯 2026 · 冠军</Pill>
        {['法国 @5.80', '巴西 @6.20', '阿根廷 @7.40'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-xs text-[var(--text-primary)]">{item}</div>
        ))}
        <p className="text-[10px] text-[var(--text-secondary)]">作为多笔单注提交，不支持串关。</p>
      </div>
    </UiPanel>
  )
}

function NewAmmFuturesMarketPreview() {
  return (
    <UiPanel title="冠军与晋级 · 长期 AMM 市场">
      <div className="space-y-2">
        <Pill tone="green">世界杯 2026 · AMM 可交易 outcome</Pill>
        {['法国 17¢ · 17% implied · 深度 24k', '巴西 16¢ · 16% implied · 深度 22k', '阿根廷 14¢ · 14% implied · 深度 19k'].map((item) => (
          <div key={item} className="rounded-lg bg-[#2DD4BF]/5 px-3 py-2 text-xs text-[var(--text-primary)]">{item}</div>
        ))}
        <p className="text-[10px] text-[var(--text-secondary)]">买入后形成长期持仓，可部分卖出、全部卖出或等待官方结算。</p>
      </div>
    </UiPanel>
  )
}

function OldSettingsAndErrorPreview() {
  return (
    <UiPanel title="赔率设置 + 下单反馈">
      <div className="space-y-2">
        <div className="flex gap-1.5">{['欧洲盘', '分数盘', '美式盘'].map((item) => <Pill key={item}>{item}</Pill>)}</div>
        <BetSlipPreview title="提交失败" lines={['赔率已变化', '盘口已封盘', '不可同场串关']} footer="移除后重试" tone="warning" />
      </div>
    </UiPanel>
  )
}

function NewPriceAndRiskPreview() {
  return (
    <UiPanel title="价格切换 + AMM 风险反馈">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <span className="rounded-lg bg-[#2DD4BF]/15 px-3 py-2 text-center text-xs text-[#2DD4BF]">份额价格</span>
          <span className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-center text-xs text-[var(--text-secondary)]">欧洲赔率</span>
        </div>
        {['报价已过期，请重新询价', '流动性不足，整笔交易失败', '关键事件暂停，买入和卖出均不可用'].map((item) => (
          <div key={item} className="rounded-lg bg-amber-500/10 px-3 py-2 text-[10px] text-amber-300">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function SectionDivider({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
      <p className="text-xs font-semibold text-amber-300">{title}</p>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
    </div>
  )
}

function OldGlobalResidualPreview() {
  return (
    <UiPanel title="全局传统投注残留">
      <div className="space-y-2">
        {[
          ['AppShell', '仍挂载 SoccerBetSlipFloat'],
          ['SoccerBetSlipFloat', '读取 soccerBetSlipStore'],
          ['SoccerPrediction*', '历史文件存在但未入当前路由'],
          ['CLOB 足球', '独立 /clob 线，不是 v6 AMM'],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
            <p className="text-[10px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">{text}</p>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6BoundaryPreview() {
  return (
    <UiPanel title="v6 AMM 范围边界">
      <div className="space-y-2">
        {[
          ['主流程', '/soccer、/soccer/match、/soccer/futures、/soccer/mybets'],
          ['历史对照', '传统投注单只在 B 区回归展示'],
          ['明确排除', '订单簿、限价单、撤单、挂单、部分成交挂起'],
          ['未来版本', 'CLOB 足球升级另起大版本'],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2">
            <p className="text-[10px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">{text}</p>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldV5MatchInteractionPreview() {
  return (
    <UiPanel title="v5 比赛详情代码交互">
      <div className="grid gap-2 md:grid-cols-2">
        {['selectedKeys 高亮投注项', 'toggleItem 加入投注单', 'MARKET_COLLAPSE_THRESHOLD 折叠盘口', '串关模式 canCombine 冲突', 'oddsRegistry seedOdds', '进行中/完赛封盘'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6MatchInteractionPreview() {
  return (
    <UiPanel title="v6 比赛详情代码交互">
      <div className="grid gap-2 md:grid-cols-2">
        {['selectedOutcome 选中 outcome', 'selectOutcome 打开交易 quote', 'AmmMarketRenderer 渲染 7/7 市场', 'AmmTradePanel 买入/卖出', 'AmmPortfolioPanel compact', '市场暂停影响买入和卖出'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldV5OddsLifecyclePreview() {
  return (
    <UiPanel title="v5 赔率生命周期">
      <div className="space-y-2">
        {['seedOdds 注册初始赔率', 'oddsTicker 推动赔率变化', '投注单显示报价倒计时', '接受最新赔率只更新快照', '二次确认再次复核金额/赔率/返还'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewAmmQuoteLifecyclePreview() {
  return (
    <UiPanel title="v6 quote 生命周期">
      <div className="space-y-2">
        {['选择 outcome 后即时询价', 'quote 返回 avgPrice / endPrice / priceImpact / fee', '30 秒过期后必须重新询价', '价格影响过高或流动性不足整笔失败', '执行 trade 后更新 position 与 trades'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldV5MyBetsToolsPreview() {
  return (
    <UiPanel title="v5 我的注单工具">
      <div className="grid gap-2 md:grid-cols-2">
        {['状态筛选：全部/待结算/已结算/提前结清', '日期筛选：今天/7天/30天/全部', '分页加载更多', 'Cash Out 模拟报价', '重投加入投注单', '导出 CSV / 复制注单号'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6PortfolioToolsPreview() {
  return (
    <UiPanel title="v6 Portfolio 工具">
      <div className="grid gap-2 md:grid-cols-2">
        {['按单场/冠军与晋级筛选持仓', '查看份额、均价、现价、市值', '卖出入口替代 Cash Out', '最近成交替代注单记录', '已实现/未实现盈亏', 'settled / void 按 position 生命周期处理'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldV5FuturesCodePreview() {
  return (
    <UiPanel title="v5 冠军与晋级代码语义">
      <div className="space-y-2">
        {['InfoPill：报价方式 = 平台欧洲盘报价', 'InfoPill：投注方式 = 多笔单注，暂不串关', 'MarketRenderer 渲染长期市场赔率按钮', '右栏 SoccerBetSlip + MyBetsPanel', '关闭时间和结算来源服务注单复核'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6FuturesCodePreview() {
  return (
    <UiPanel title="v6 冠军与晋级代码语义">
      <div className="space-y-2">
        {['InfoPill：定价方式 = AMM 份额价格', 'InfoPill：交易方式 = 买入/部分卖出/全部卖出', 'AmmMarketRenderer 渲染 11/11 长期市场', '右栏 AmmTradePanel + AmmPortfolioPanel compact', '关闭时间和结算来源服务 resolution / void'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldV5TerminologyPreview() {
  return (
    <UiPanel title="v5 传统投注词">
      <div className="flex flex-wrap gap-1.5">
        {['投注项', '投注单', '注单', '串关', '赔率', '可能返还', 'Cash Out', '重投', '接受最新赔率'].map((item) => <Pill key={item} tone="amber">{item}</Pill>)}
      </div>
    </UiPanel>
  )
}

function NewV6TerminologyPreview() {
  return (
    <UiPanel title="v6 AMM 预测市场词">
      <div className="flex flex-wrap gap-1.5">
        {['outcome', 'shares', 'trade', 'position', 'collateral', 'market value', 'sell', 'settlement', 'quote'].map((item) => <Pill key={item} tone="green">{item}</Pill>)}
      </div>
    </UiPanel>
  )
}

function FuturesSeriesPreview() {
  return (
    <div className="grid gap-3">
      <div className="flex rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
        <span className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)]">单场预测</span>
        <span className="rounded-lg bg-[#2DD4BF]/15 px-3 py-1.5 text-xs font-semibold text-[#2DD4BF]">冠军与晋级</span>
      </div>
      {futuresCompetitions.map((competition) => (
        <div key={competition.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold text-[#E85A7E]">{competition.region} · {competition.seriesType}</p>
              <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{competition.shortName}</h3>
              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{competition.headline}</p>
            </div>
            <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{competition.markets.length} 个预测</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {competition.marketSummary.slice(0, 4).map((item) => (
              <span key={item} className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{item}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FuturesDetailPreview() {
  const competition = futuresCompetitions[0]
  const groups = futureGroups(competition)
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-[10px] text-[#E85A7E] uppercase tracking-wider font-semibold">{competition.region} · {competition.seriesType}</p>
        <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">{competition.shortName}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{competition.headline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['全部', ...groups].map((group, index) => (
            <span key={group} className={`rounded-lg px-2.5 py-1 text-[10px] ${index === 0 ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]' : 'bg-[var(--bg-control)] text-[var(--text-secondary)]'}`}>{group}</span>
          ))}
        </div>
      </div>
      {groups.map((group) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-semibold text-[var(--text-primary)]">{group}</p>
          {competition.markets.filter((item) => item.group === group).slice(0, 2).map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[10px] text-[#E85A7E]">{item.group}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">{item.subject.resolutionTimeLabel}</span>
              </div>
              <MarketRenderer market={item.market} displayTitle={item.market.title} matchId={item.subject.subjectId} onSelect={noop} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ComplianceDegradePreview() {
  const hidden = ['赔率', '投注单', '入场费', '奖金池', '派奖', '抽水', 'Cash Out', '推广 / 邀请返佣']
  const visible = ['赛程', '球队', '比分', '赛事资讯', '免费预测', '非金钱排行榜', '赛后复盘']
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <StateCard title="大陆可见版" description="只展示资讯和免费预测，不展示真钱交易元素。">
        <div className="flex flex-wrap gap-2">
          {visible.map((item) => <span key={item} className="rounded-full bg-[#2DD4BF]/10 px-2.5 py-1 text-[10px] text-[#2DD4BF]">{item}</span>)}
        </div>
      </StateCard>
      <StateCard title="大陆隐藏项" description="设计上需要确认这些元素在大陆语境下不可见。">
        <div className="flex flex-wrap gap-2">
          {hidden.map((item) => <span key={item} className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] text-red-400">{item}</span>)}
        </div>
      </StateCard>
      <StateCard title="非大陆真钱版" description="在合法合规地区继续展示当前 v4.3/v4.4/v4.7 功能。">
        <SmallState title="完整模式" text="保留赔率、下注、赛事级个体盘、cash out 等当前可见能力。" />
      </StateCard>
    </div>
  )
}

function ListTablePreview() {
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[9px] text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
        <span className="w-12 shrink-0 text-center">时间</span>
        <span className="flex-1">比赛</span>
        <span className="hidden sm:block w-[182px] shrink-0 text-center">胜平负</span>
        <span className="hidden md:block w-[118px] shrink-0 text-center">大小球</span>
        <span className="hidden lg:block w-[138px] shrink-0 text-center">让球</span>
        <span className="w-16 shrink-0 text-right">盘口</span>
      </div>
      {listMatches.map((match) => (
        <MatchListCard key={match.id} match={match} />
      ))}
    </div>
  )
}

function LeagueSidebarPreview() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {['全部赛事 · 14 场 · 4 场进行中', 'Brasileiro Serie A · 5 场 · 2 场进行中', 'Premier League · 4 场 · 1 场进行中', 'UEFA Champions League · 2 场 · 1 场进行中', 'La Liga · 3 场'].map((item, index) => (
          <div key={item} className={`rounded-lg px-3 py-2 text-xs ${index === 0 ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]' : 'bg-[var(--bg-control)] text-[var(--text-secondary)]'}`}>
            {item}
          </div>
        ))}
      </div>
      <SmallState title="正在进行" text="展示最多 3 场进行中的比赛和比分。" />
      <SmallState title="即将开赛" text="展示赛前比赛和开赛时间。" />
      <SmallState title="空列表" text="筛选无结果时显示“暂无赛事”。" />
    </div>
  )
}

function MatchDetailPreview() {
  const markets = sourceMatch.tabs[0]?.markets.slice(0, 4) ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
        <span>足球</span><span>/</span><span>{sourceMatch.league}</span><span>/</span><span className="text-[var(--text-primary)]">比赛详情</span>
      </div>
      <MatchHeader match={sourceMatch} />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
        <span className="rounded-lg bg-[#2DD4BF]/10 px-3 py-1.5 text-xs text-[#2DD4BF]">所有盘口</span>
      </div>
      {markets.map((market) => (
        <MarketRenderer key={market.title} market={market} displayTitle={market.title} matchId={sourceMatch.id} onSelect={noop} />
      ))}
      <BetSlipPreview title="右栏投注单" lines={['当前选择：胜平负', '金额、报价、返还、提交状态']} footer="详情页右侧固定展示" />
    </div>
  )
}

function MyBetsPagePreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">我的注单</p>
          <p className="text-[10px] text-[var(--text-secondary)]">提前结清报价为参考报价，刷新后将更新。</p>
        </div>
        <button className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">导出记录</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['全部', '待结算', '已结算', '提前结清'].map((item, index) => (
          <span key={item} className={`rounded-full px-3 py-1.5 text-xs ${index === 0 ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}>{item}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['今天', '7 天', '30 天', '全部'].map((item, index) => (
          <span key={item} className={`rounded-md px-2.5 py-1 text-[10px] ${index === 1 ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}>{item}</span>
        ))}
      </div>
      <div className="rounded-lg border border-dashed border-[var(--border)] p-5 text-center text-xs text-[var(--text-secondary)]">
        当前筛选条件下暂无注单
      </div>
      <button className="w-full rounded-lg bg-[var(--bg-control)] py-2 text-xs text-[#2DD4BF]">加载更多</button>
    </div>
  )
}

function NotFoundPreview() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
      <p className="text-sm text-[var(--text-secondary)]">未找到该场比赛</p>
      <button className="mt-4 rounded-lg bg-[var(--bg-control)] px-4 py-2 text-xs text-[#2DD4BF]">返回赛事列表</button>
    </div>
  )
}

function BetSlipPreview({ title, lines, footer, tone = 'neutral' }: { title: string; lines: string[]; footer: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const toneClass = {
    neutral: 'border-[var(--border)] text-[var(--text-secondary)]',
    success: 'border-emerald-500/25 text-emerald-400',
    warning: 'border-amber-500/25 text-amber-400',
    danger: 'border-red-500/25 text-red-400',
  }[tone]
  return (
    <div className={`rounded-xl border bg-[var(--bg-card)] p-4 ${toneClass}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-1 text-[10px] text-[#2DD4BF]">投注单</span>
      </div>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-xs text-[var(--text-primary)]">{line}</div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-current/20 px-3 py-2 text-xs">{footer}</div>
    </div>
  )
}

function SettingsPreview() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">设置菜单</h3>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">当前只提供赔率格式切换。</p>
      <div className="mt-3 space-y-3">
        <div>
          <p className="mb-2 text-[10px] text-[var(--text-secondary)]">赔率格式</p>
          <div className="flex gap-1.5">{['欧洲盘', '分数盘', '美式盘'].map((item) => <span key={item} className="rounded bg-[var(--bg-control)] px-2 py-1 text-[10px] text-[var(--text-primary)]">{item}</span>)}</div>
        </div>
        <p className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-secondary)]">
          报价变化统一由用户在下单区或二次确认弹窗内手动接受最新报价。
        </p>
      </div>
    </div>
  )
}

function ConfirmPreview() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">二次确认弹窗</h3>
      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-4">
        <div className="flex items-center justify-between text-xs"><span className="text-[var(--text-secondary)]">投注方式</span><span className="text-[var(--text-primary)]">串关 · 3 项</span></div>
        <div className="my-3 space-y-2">
          {['胜平负 · RJ博塔弗戈', '大小球 · 大 2.5', '让球 · -0.5'].map((item) => <div key={item} className="rounded bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-primary)]">{item}</div>)}
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">总赔率</span><span>7.42</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">投注金额</span><span>1,000.00 USDT</span></div>
          <div className="flex justify-between text-[#2DD4BF]"><span>可能返还</span><span>7,420.00 USDT</span></div>
        </div>
      </div>
    </div>
  )
}

function FloatPreview({ title, subtitle, warning }: { title: string; subtitle: string; warning?: boolean }) {
  return (
    <div className="rounded-xl border border-[#E85A7E]/30 bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">足球投注单</span>
        <span className="rounded bg-[#E85A7E]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#E85A7E]">{title}</span>
      </div>
      <p className="mt-1 text-xs font-mono text-[var(--text-secondary)]">{subtitle}</p>
      {warning && <p className="mt-1 text-[10px] text-amber-400">赔率已变动</p>}
      <p className="mt-3 text-xs text-[#E85A7E]">查看</p>
    </div>
  )
}

function BoardSection({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)] leading-6">{description}</p>
      </div>
      {children}
    </section>
  )
}

function StateCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)] leading-5">{description}</p>
      </div>
      {children}
    </div>
  )
}

function SmallState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1 text-xs text-[var(--text-secondary)] leading-5">{text}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-control)] px-4 py-3">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function HiddenPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-control)] p-5 text-center">
      <p className="text-sm font-medium text-[var(--text-primary)]">用户页面不展示</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">该盘口仅用于规则说明，不出现在用户投注页面。</p>
    </div>
  )
}
