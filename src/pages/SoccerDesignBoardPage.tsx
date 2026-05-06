import MatchHeader from '../components/soccer/MatchHeader'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import MatchListCard from '../components/soccer/MatchListCard'
import MarketRenderer from '../components/soccer/MarketRenderer'
import MyBetCard from '../components/soccer/MyBetCard'
import MyBetsPanel from '../components/soccer/MyBetsPanel'
import PredictionEntryCard from '../components/soccer/PredictionEntryCard'
import PredictionReviewView from '../components/soccer/PredictionReviewView'
import { SoccerListSkeleton, SoccerMatchSkeleton } from '../components/soccer/SoccerSkeletons'
import {
  bracketTournaments,
  describeAttribution,
  describeStatus,
  formatLockCountdown,
  sampleEntries,
  sampleLeaderboard,
  sampleSelfRunningRow,
  teamLabel,
  type BracketTournament,
  type UserBracketEntry,
} from '../data/soccer/bracketData'
import { futuresCompetitions } from '../data/soccer/futuresData'
import { matches } from '../data/soccer/mockData'
import type { Market, MyBetItem, SettlementResult, SoccerMatch } from '../data/soccer/types'

const noop = () => {}

const LEAN_MARKET_ORDER = [
  '胜平负',
  '开球权',
  '亚洲让分盘',
  '让分0:1',
  '让分0:2',
  '让分1:0',
  '让分2:0',
  '总进球数',
  '合计',
  '正确进球',
]

const boardSections = [
  ['coverage', '范围说明'],
  ['coverage-matrix', '覆盖矩阵'],
  ['page-states', '页面级状态'],
  ['match-states', '比赛状态'],
  ['lean-markets', '本期盘口'],
  ['future-markets', '冠军与晋级'],
  ['market-states', '盘口状态'],
  ['goal-toggle', '开赛封盘'],
  ['betslip-states', '投注单状态'],
  ['float-states', '浮动投注单'],
  ['mybets-states', '我的注单'],
  ['rule-states', '报价和提交反馈'],
  ['component-matrix', '组件覆盖'],
  ['pool-entry-states', 'v4.5 入口'],
  ['pool-detail-states', 'v4.5 详情'],
  ['pool-dialog-states', 'v4.5 弹窗'],
  ['pool-asset-states', 'v4.5 资产'],
  ['pool-share-states', 'v4.5 榜单分享'],
  ['edge-states', '异常与边界'],
  ['compliance-degrade', '合规降级'],
]

const soccerRouteCoverage = [
  ['SoccerPage', '/soccer', '首页三 tab、左侧导航、比赛列表、预测大赛入口'],
  ['SoccerMatchPage', '/soccer/match/:matchId', '比赛详情、右栏信息、盘口列表、投注单'],
  ['SoccerFuturesPage', '/soccer/futures/:competitionId', '冠军与晋级赛事级详情'],
  ['SoccerPredictionPage', '/soccer/predictions/:tournamentId', '预测大赛详情、对阵树、榜单摘要'],
  ['SoccerPredictionLeaderboardPage', '/soccer/predictions/:tournamentId/leaderboard', '完整榜单、搜索、排序、分页'],
  ['SoccerPredictionShareView', '/soccer/predictions/share/:shareId', '只读分享、归属不覆盖、失效态'],
  ['SoccerMyBetsPage', '/soccer/mybets', '传统注单与我的预测大赛双 tab'],
  ['SoccerDesignBoardPage', '/soccer/design-board', '设计状态总览'],
]

const soccerComponentCoverage = [
  ['MatchHeader', '比赛状态头部'],
  ['MatchInfoPanel', '右栏赛事信息'],
  ['MatchListCard', '首页比赛卡'],
  ['MarketRenderer', '盘口分发器'],
  ['ButtonGroupMarket', '胜平负 / 开球权'],
  ['RangeButtonsMarket', '让分 / 大小球区间'],
  ['OddsTableMarket', '亚盘表格'],
  ['ScoreGridMarket', '正确比分网格'],
  ['ComboGridMarket', '组合盘口网格'],
  ['PlayerListMarket', '球员列表盘口'],
  ['OddsDisplay', '赔率格式'],
  ['MarketCard', '盘口折叠容器'],
  ['SoccerBetSlip', '右栏投注单'],
  ['SoccerBetSlipFloat', '跨页浮动投注单'],
  ['ConfirmBetDialog', '传统投注二次确认'],
  ['BetSlipSettingsMenu', '投注单设置'],
  ['MyBetCard', '我的注单卡'],
  ['MyBetsPanel', '右栏我的注单摘要'],
  ['SoccerSkeletons', '列表 / 详情骨架'],
  ['KickoffCountdown', '开赛倒计时'],
  ['MatchTimeline', '比赛事件'],
  ['MatchStatsBar', '统计条'],
  ['FormationPitch', '阵型图'],
  ['HeadToHeadPanel', '历史交锋'],
  ['PredictionConfirmDialog', '预测大赛确认'],
  ['PredictionShareDialog', '预测大赛分享'],
  ['PredictionEntryCard', '我的预测大赛资产'],
  ['PredictionReviewView', '赛后回顾'],
]

const soccerStateCoverage = [
  ['v4.3 单场', '赛前 / 进行中 / 已结束 / 中断 / 腰斩 / 延期 / 取消'],
  ['盘口状态', '开放 / 选中 / 暂停 / 即将开放 / 作废 / 取消 / 结算 / 串关互斥 / 隐藏'],
  ['投注单', '空单 / 多笔单注 / 串关 / 报价变化 / 余额不足 / 提交失败 / 二次确认'],
  ['v4.4 赛事级', '冠军 / 晋级 / 赛季名次 / 两回合系列赛 / 官方待确认 / 不可串关'],
  ['v4.5 预测大赛', '空表 / 部分填写 / 提交 / 保存 / 锁定 / 进行中 / 已结算 / 退款'],
  ['增长归因', '推广码 / 邀请码 / 分享来源 / 分享不覆盖归属 / 返佣奖池分离'],
  ['合规降级', '大陆只资讯与免费预测 / 非大陆真钱版 / 隐藏赔率派奖返佣'],
]

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
  return marketWith('正确进球', {
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
  { label: '暂停', note: '盘口保留展示，但不可选择。', market: marketWith('合计', { status: 'suspended' }) },
  { label: '即将开放', note: '盘口存在，但尚未开放投注。', market: marketWith('总进球数', { status: 'upcoming' }) },
  { label: '作废', note: '盘口作废，已下注按退款规则处理。', market: marketWith('合计', { status: 'void' }) },
  { label: '取消', note: '盘口取消，不再接受投注。', market: marketWith('胜平负', { status: 'cancelled' }) },
  { label: '已结算赢', note: '展示命中结果。', market: settlementMarket('win') },
  { label: '已结算输', note: '展示未命中。', market: settlementMarket('loss') },
  { label: '退款', note: '走盘或盘口作废按退款展示。', market: settlementMarket('push') },
  { label: '串关互斥', note: '仅在串关模式下解释与已选盘口不可组合。', market: marketByTitle('正确进球'), conflict: true },
  { label: '隐藏', note: '后台隐藏的盘口不出现在用户列表中。' },
]

const conflictExamples = [
  ['胜平负 × 正确比分', '正确比分会直接推出胜平负结果。'],
  ['总进球数 × 合计', '总进球档位会决定大小球结果。'],
  ['亚洲让分盘 × 正确比分', '正确比分会决定让球结果。'],
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
  makeBet('bet-live', 'live', { betCode: 'TF-LIVE01', matchLabel: '弗拉门戈 vs 科林蒂安', marketTitle: '合计', selection: '高于 2.5', odds: 2.05, potentialReturn: 205 }),
  makeBet('bet-win', 'settled', { betCode: 'TF-WIN001', result: 'win', settlementResult: 'win', payout: 168, marketTitle: '正确进球', selection: '0:1', odds: 8.4 }),
  makeBet('bet-loss', 'settled', { betCode: 'TF-LOSS01', result: 'loss', settlementResult: 'loss', payout: 0 }),
  makeBet('bet-push', 'settled', { betCode: 'TF-PUSH01', result: 'push', settlementResult: 'push', payout: 50, marketTitle: '亚洲让分盘', selection: '0 / 0' }),
  makeBet('bet-void', 'settled', { betCode: 'TF-VOID01', result: 'push', settlementResult: 'void', payout: 50, marketTitle: '合计', selection: '高于 2.5' }),
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
    { id: 'l2', matchId: 'm2', matchLabel: '弗拉门戈 vs 科林蒂安', marketTitle: '合计', selection: '高于 2.5', oddsAtPlacement: 2.05 },
    { id: 'l3', matchId: 'm3', matchLabel: '阿森纳 vs 切尔西', marketTitle: '亚洲让分盘', selection: '-0.5', oddsAtPlacement: 1.50 },
  ],
})

function stopBoardInteraction(event: React.SyntheticEvent) {
  event.preventDefault()
  event.stopPropagation()
}

export default function SoccerDesignBoardPage() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-10 [&_a]:cursor-default [&_button]:cursor-default"
      onClickCapture={stopBoardInteraction}
      onKeyDownCapture={stopBoardInteraction}
      onSubmitCapture={stopBoardInteraction}
    >
      <header id="coverage" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs text-[#2DD4BF] font-semibold mb-2">足球盘口设计状态展板</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">足球盘口页面、元素和状态</h1>
        <p className="mt-3 max-w-4xl text-sm text-[var(--text-secondary)] leading-6">
          本页面用于产品和设计评审，集中展示用户会看到的页面状态、盘口、投注单、注单和提交反馈。
          当前覆盖 v4.4 范围内的单场盘口、冠军与晋级、系列赛预测、多笔单注、串关、报价确认和封盘能力，以及 v4.5 新增的淘汰赛对阵树预测大赛（按命中率分奖）。
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-7">
          <Metric label="足球路由" value={String(soccerRouteCoverage.length)} />
          <Metric label="足球组件" value={String(soccerComponentCoverage.length)} />
          <Metric label="比赛状态" value="7" />
          <Metric label="本期盘口" value="10" />
          <Metric label="赛事级市场" value="6" />
          <Metric label="投注单状态" value="20+" />
          <Metric label="预测大赛状态" value="30+" />
        </div>
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-4">
          <p className="text-xs font-semibold text-[var(--text-primary)]">v4.4 盘口范围</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEAN_MARKET_ORDER.map((title) => (
              <span key={title} className="rounded-full bg-[#2DD4BF]/10 px-2.5 py-1 text-[10px] text-[#2DD4BF]">{title}</span>
            ))}
            {['冠军', '晋级', '赛季名次', '两回合系列赛'].map((title) => (
              <span key={title} className="rounded-full bg-[#E85A7E]/10 px-2.5 py-1 text-[10px] text-[#E85A7E]">{title}</span>
            ))}
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2">
          {boardSections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[#2DD4BF]">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <BoardSection id="coverage-matrix" title="0. 覆盖矩阵" description="按页面、组件和状态三条线核对 Design Board 覆盖范围，避免新增功能只停留在文字摘要里。">
        <div className="grid gap-4 xl:grid-cols-3">
          <StateCard title="足球路由页面" description="App.tsx 中所有 /soccer 相关路由都必须能在展板找到对应预览或状态说明。">
            <CoverageList items={soccerRouteCoverage} />
          </StateCard>
          <StateCard title="足球组件清单" description="28 个 soccer 组件按真实组件或说明性状态进入展板。">
            <CoverageList items={soccerComponentCoverage} compact />
          </StateCard>
          <StateCard title="关键状态族" description="跨 v4.3 / v4.4 / v4.5 / 合规降级的状态族。">
            <CoverageList items={soccerStateCoverage} />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="page-states" title="1. 页面级状态" description="先展示页面整体，再展示关键元素状态。这里包含首页、比赛详情、我的注单、异常页和加载骨架。">
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <StateCard title="首页左侧导航" description="联赛筛选、全部赛事、进行中数量、进行中比赛和即将开赛。">
            <LeagueSidebarPreview />
          </StateCard>
          <StateCard title="首页比赛列表" description="赛前、进行中、已结束和异常比赛同屏展示；快捷赔率列应正常显示。">
            <ListTablePreview />
          </StateCard>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <StateCard title="比赛详情页布局" description="路径导航、比赛头部、所有盘口、盘口列表、右栏信息和投注单。">
            <MatchDetailPreview />
          </StateCard>
          <StateCard title="冠军与晋级详情页" description="赛事级详情页：赛事头部、市场分组、官方结算来源和不可串关提示。">
            <FuturesDetailPreview />
          </StateCard>
          <StateCard title="预测大赛详情页" description="v4.5 详情页完整区域：头部、增长归因、对阵树、我的预测、榜单摘要。">
            <PredictionDetailPreview />
          </StateCard>
          <StateCard title="完整榜单页" description="搜索、按得分 / tiebreaker 排序、分页和本人位置。">
            <LeaderboardPagePreview />
          </StateCard>
          <StateCard title="分享只读页" description="分享入口、冠军预测、冻结快照和不覆盖归属说明。">
            <SharePagePreview />
          </StateCard>
          <StateCard title="我的注单页布局" description="状态筛选、日期筛选、导出、列表、加载更多和空态。">
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

      <BoardSection id="match-states" title="2. 比赛状态和右栏信息" description="展示赛前、进行中、已结束和异常比赛状态，以及倒计时、事件、阵容、交锋、统计和特殊情况说明。">
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

      <BoardSection id="lean-markets" title="3. v4.4 单场本期盘口" description="单场比赛仍平铺当前 10 个盘口；冠军与晋级等赛事级盘口在下一节单独展示。">
        <div className="grid gap-4 xl:grid-cols-2">
          {leanMarketScenarios.map((item) => (
            <StateCard key={item.title} title={item.title} description="当前主流程盘口。">
              <MarketRenderer market={item.market} displayTitle={item.market.title} matchId={liveSourceMatch.id} onSelect={noop} />
            </StateCard>
          ))}
        </div>
      </BoardSection>

      <BoardSection id="future-markets" title="4. v4.4 冠军、晋级和系列赛预测" description="赛事级盘口与单场盘口并列展示，借鉴预测市场的问题组织方式，但仍使用平台报价和传统投注单。">
        <div className="grid gap-4 xl:grid-cols-2">
          {futuresCompetitions.map((competition) => (
            <StateCard key={competition.id} title={competition.shortName} description={competition.headline}>
              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <SmallState title="市场粒度" text="赛事、赛季或淘汰赛阶段，不挂在某一场 match 上。" />
                  <SmallState title="投注方式" text="支持单注和多笔单注；第一版暂不支持串关。" />
                  <SmallState title="结算来源" text="按官方赛事结果、积分榜或晋级结果结算。" />
                </div>
                {competition.markets.slice(0, 2).map((item) => (
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
        <div className="grid gap-4 md:grid-cols-3">
          <BetSlipPreview title="长期盘多笔单注" lines={['欧冠冠军 · 皇家马德里 @4.20', '晋级决赛 · 曼城 是 @2.55', '每项独立生成注单']} footer="二次确认" />
          <BetSlipPreview title="系列赛预测" lines={['皇家马德里 vs 巴塞罗那 · 两回合系列赛', '选择：皇家马德里晋级 @1.92', '包含加时和点球晋级结果']} footer="按 UEFA 官方结果结算" />
          <BetSlipPreview title="暂不支持串关" lines={['冠军与晋级类强相关边界复杂', '第一版作为多笔单注提交', '串关按钮给出明确说明']} footer="可改为多笔单注" tone="warning" />
        </div>
      </BoardSection>

      <BoardSection id="market-states" title="5. 盘口状态和串关互斥" description="暂停、作废、结算、封盘和串关冲突都需要给出清晰反馈；多笔单注不做同场组合限制。">
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
                  conflictReason={item.conflict ? '正确比分会直接推出胜平负结果，不能放进同一张串关。' : undefined}
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

      <BoardSection id="goal-toggle" title="6. 开赛封盘和市场关闭" description="单场比赛开始后封盘；冠军、晋级和系列赛类盘口按市场关闭时间、阶段开始、数学确定或官方暂停关闭。">
        <div className="grid gap-4 lg:grid-cols-4">
          <StateCard title="赛前可投注" description="比赛未开始，开放盘口可以选择。">
            <MarketRenderer market={marketByTitle('合计')} displayTitle="合计" matchId={liveSourceMatch.id} onSelect={noop} />
          </StateCard>
          <StateCard title="开赛后封盘" description="比赛进行中，盘口保留展示但不可选择。">
            <MarketRenderer market={marketByTitle('合计')} displayTitle="合计" matchId={liveSourceMatch.id} onSelect={noop} bettingClosed />
          </StateCard>
          <StateCard title="赔率锁定" description="开赛后赔率停止变化，只保留开赛前最后一次报价。">
            <BetSlipPreview title="盘口已封盘" lines={['弗拉门戈 vs 科林蒂安', '合计 · 高于 2.5 @2.05', '比赛已开始，赔率已锁定']} footer="不可提交" tone="warning" />
          </StateCard>
          <StateCard title="投注单已有该场比赛" description="开赛后，投注单中的相关项不可提交，需要移除。">
            <BetSlipPreview title="含不可用项" lines={['弗拉门戈 vs 科林蒂安', '合计 · 高于 2.5 @2.05', '比赛已开始，盘口已封盘']} footer="移除不可用项后再提交" tone="warning" />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="betslip-states" title="7. 投注单状态" description="集中展示空单、多笔单注、串关、报价、二次确认、提交反馈和设置。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BetSlipPreview title="空单" lines={['投注单', '点击赔率按钮添加选项']} footer="不可提交" />
          <BetSlipPreview title="多笔单注" lines={['2 项 · 独立注单', '每项分别输入或套用金额', '提交后生成多张单腿注单']} footer="二次确认" />
          <BetSlipPreview title="串关" lines={['3 项 · 跨 3 场', '总赔率 7.42', '全部选项命中方可获胜']} footer="确认串关" />
          <BetSlipPreview title="同盘口替换" lines={['已选择：主胜 @1.83', '再选平局时替换原选项', '投注单只保留一个同盘口选项']} footer="替换后重新核对" />
          <BetSlipPreview title="多笔单注同场多盘口" lines={['胜平负 + 正确进球', '作为独立单注提交', '不展示串关冲突遮罩']} footer="可继续提交" tone="success" />
          <BetSlipPreview title="串关同场冲突" lines={['胜平负 × 正确进球', '正确比分会推出胜平负', '不能放入同一张串关']} footer="移除冲突项或改为多笔单注" tone="warning" />
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

      <BoardSection id="float-states" title="8. 浮动投注单" description="用户离开比赛详情页或赛事级预测页后，已有足球投注单仍可通过浮动条返回。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SmallState title="无投注项" text="不展示浮动条。" />
          <FloatPreview title="1 项" subtitle="总赔率 1.83" />
          <FloatPreview title="3 项" subtitle="总赔率 7.42 · 跨 3 场" />
          <FloatPreview title="赔率已变动" subtitle="总赔率 6.88 · 赔率已变动" warning />
        </div>
      </BoardSection>

      <BoardSection id="mybets-states" title="9. 我的注单" description="展示注单页、右栏摘要、多笔单注卡、串关卡、赛事级注单和结算结果。">
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

      <BoardSection id="rule-states" title="10. 报价和提交反馈" description="这些状态需要在用户提交前后给出清晰、可操作的提示。">
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

      <BoardSection id="component-matrix" title="11. 足球组件覆盖" description="逐个核对足球组件目录，复杂组件在对应业务 section 中真实展示，基础组件在此说明覆盖位置。">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {soccerComponentCoverage.map(([name, text]) => (
            <SmallState key={name} title={name} text={text} />
          ))}
        </div>
      </BoardSection>

      <BoardSection
        id="pool-entry-states"
        title="12. v4.5 预测大赛入口"
        description="付费入场的淘汰赛对阵树预测大赛（Bracket Pool）。本轮补充 Perp DEX 现有推广码 / 邀请码归因、分享不覆盖归属、赛后下一届承接；不覆盖 KYC、身份认证、地域限制和用户准入筛选状态。"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BetSlipPreview
            title="① 报名中｜空表 + 教学卡片"
            lines={[
              '首次进入弹一次教学卡片',
              '3 步说明：入场 / 填表 / 派奖',
              '附数字示例：得 12 分 → ≈ 21.6 USDT',
            ]}
            footer="知道了，去填表"
            tone="success"
          />
          <BetSlipPreview
            title="② 报名中｜部分填写"
            lines={[
              'R16 已填 3/8',
              '上游未填的 QF / SF / F slot 禁用',
              '禁用 slot 提示：先填上游 slot',
            ]}
            footer="完成度 3 / 15"
          />
          <BetSlipPreview
            title="③ 报名中｜已填满待提交"
            lines={[
              '15 / 15 slot + tiebreaker = 3',
              '右栏：投影派奖 ≈ 21.6 USDT',
              '本人占总分预估 0.32%',
            ]}
            footer="提交预测（10 USDT）"
            tone="success"
          />
          <BetSlipPreview
            title="④ 二次确认弹窗"
            lines={[
              '入场费 10 USDT｜净池 45,000 USDT｜保底池 50,000 USDT',
              '最低 1,000 人成团；未达最低人数全额退款',
              '资金锁定提示：约 8 周',
              '"我已了解上述规则" 勾选',
            ]}
            footer="确认提交"
            tone="warning"
          />
          <BetSlipPreview
            title="⑤ 已提交｜可改可撤回"
            lines={[
              '状态徽标：已提交',
              '资金锁定提示常驻',
              '操作：保存修改 / 锁前撤回 / 分享',
            ]}
            footer="锁定倒计时 2 天 5 小时"
            tone="success"
          />
          <BetSlipPreview
            title="⑥ 分享导出弹窗"
            lines={[
              '预览卡片：冠军预测 + 完成度 + 提交时间',
              '公开链接不显示资金、得分、投影派奖',
              '三个动作：复制链接 / 导出预览 / 复制文案',
              '链接形如 /soccer/predictions/share/:shareId',
            ]}
            footer="只读视图，不显示资金"
          />
          <BetSlipPreview
            title="⑦ 已撤回｜已退款"
            lines={[
              '状态徽标：已退款 · 用户锁前撤回',
              '入场费 10 USDT 已退回钱包',
              '可继续填新表（同赛事不可重复入场）',
            ]}
            footer="查看赛事"
          />
          <BetSlipPreview
            title="⑧ 已锁定｜不可修改"
            lines={[
              '状态徽标：已锁定',
              '锁定时间到达，所有操作禁用',
              '等待第一场开赛',
            ]}
            footer="查看预测"
          />
          <BetSlipPreview
            title="⑨ 进行中｜实时分数"
            lines={[
              'R16 已结算，QF 部分结算',
              '本人当前 16 分｜占总分 0.04%',
              '投影派奖 ≈ 18.90 USDT｜每场结算后刷新',
            ]}
            footer="进行中｜每场结算后刷新"
            tone="success"
          />
          <BetSlipPreview
            title="⑩ 已结算｜含赛后回顾"
            lines={[
              '决赛官方结果出',
              '实得派奖 19.66 USDT 已到账',
              '回顾：R16 6/8 · QF 3/4 · SF 2/2 · F 1/1',
            ]}
            footer="查看回顾"
            tone="success"
          />
          <BetSlipPreview
            title="⑪ 赛事取消｜已退款"
            lines={[
              '运营触发取消',
              '所有 entry 全额退款',
              'refundReason = tournament_cancelled',
            ]}
            footer="赛事取消，已全额退款"
            tone="warning"
          />
          <BetSlipPreview
            title="⑫ aggregateScore = 0 兜底"
            lines={[
              '决赛后全员总分为 0（罕见）',
              '所有 entry 全额退款，抽水降为 0',
              'refundReason = aggregate_zero',
            ]}
            footer="本届无人命中，已全额退款"
            tone="warning"
          />
          <BetSlipPreview
            title="⑬ 保存修改｜不重复扣费"
            lines={[
              '已提交用户锁前修改 bracket 或 tiebreaker',
              '按钮文案：保存修改，而不是再次提交',
              '提示：预测已保存，入场费不重复扣除',
            ]}
            footer="保存成功 toast"
            tone="success"
          />
          <BetSlipPreview
            title="⑭ 未达最低人数｜全额退款"
            lines={[
              '锁定时有效 entry 数低于 minEntrants',
              '本届不进入 locked / running',
              'refundReason = minimum_not_met',
            ]}
            footer="未达最低参赛人数，已全额退款"
            tone="warning"
          />
          <BetSlipPreview
            title="⑮ 分布延迟与冻结"
            lines={[
              '用户预测分布为约 15 分钟延迟快照',
              '锁定前 2 小时冻结 crowds 占比',
              '锁后分享和回顾使用冻结快照',
            ]}
            footer="减少压秒晚交优势"
          />
          <BetSlipPreview
            title="⑯ Perp DEX 站内入口"
            lines={[
              '定位：TurboFlow 预测市场新板块',
              '当前约 500 DAU，先做站内轻量验证',
              '不做独立大型 campaign / 任务中心',
            ]}
            footer="从 Perp 用户自然进入预测大赛"
          />
          <BetSlipPreview
            title="⑰ 代理推广码归因"
            lines={[
              'sourceType = promo_code',
              '展示脱敏推广码 AGT-•••-88',
              '返佣按平台收入口径，不改变奖金池净池',
            ]}
            footer="沿用既有代理 / 伞下 / 无限级返佣体系"
          />
          <BetSlipPreview
            title="⑱ 普通邀请码归因"
            lines={[
              'sourceType = invite_code',
              '普通用户一级邀请，比例不可调整',
              '预测大赛不新增第二套邀请码体系',
            ]}
            footer="沿用平台普通邀请码"
          />
          <BetSlipPreview
            title="⑲ 分享页不覆盖归属"
            lines={[
              '访问 shareId 只记录分享来源',
              '用户已有推广 / 邀请归属保持不变',
              'entry 记录 shareSourceEntryId 用于产品分析',
            ]}
            footer="分享不是返佣链接"
          />
          <BetSlipPreview
            title="⑳ 赛后下一届承接"
            lines={[
              '已结算回顾后展示“查看下届”',
              '世界杯预测大赛作为即将开放承接',
              '不做自动续投，只做轻量跳转 / 预约心智',
            ]}
            footer="从一次性活动过渡到预测市场板块"
            tone="success"
          />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SmallState
            title="信息架构"
            text="足球首页一级 tab 第三项「预测大赛」，每个 tab 顶部加差异化文案带，避免与冠军与晋级混淆。"
          />
          <SmallState
            title="资金锁定提示"
            text="三处常驻：赛事头部 + 二次确认弹窗 + 我的预测大赛卡片。锁前可全额撤回，锁后无法取消。"
          />
          <SmallState
            title="教学卡片"
            text="首次进入弹一次，后续可在头部 「如何派奖」按钮重新打开。3 步 + 数字示例。"
          />
          <SmallState
            title="用户预测分布（wisdom of crowds）"
            text="每个 slot 显示当前候选球队的占比条；报名期为约 15 分钟延迟快照，锁定前 2 小时冻结，锁后永久使用冻结快照。"
          />
          <SmallState
            title="榜单形态"
            text="详情页底部前 100 + 本人置顶；完整榜单页支持搜索、排序和 300+ 名模拟数据。同分时按 tiebreaker 距离排序，派奖仍只看得分占比。"
          />
          <SmallState
            title="不可串关 / 不可组合"
            text="v4.5 预测大赛与 v4.4 个体盘 独立结算、互不冲销、可同时参与，但不可串关 / 不可组合下注。"
          />
          <SmallState
            title="运营配置必须露出"
            text="openAt、lockAt、minEntrants、guaranteedPool、fundLockHint、lateStrategyLabel 都要在首页卡片、详情页或二次确认中有明确用户可见文案。"
          />
          <SmallState
            title="推广 / 邀请归因"
            text="预测大赛不新造 referral 体系。推广码沿用代理和伞下规则；邀请码沿用普通用户一级返佣。UI 只展示归因提示，不展示比例配置。"
          />
          <SmallState
            title="返佣和奖池分离"
            text="返佣按平台预测市场收入口径计算，不从净池二次扣除，也不改变按命中率分奖公式。"
          />
          <SmallState
            title="分享不覆盖归属"
            text="分享页 CTA 可以带来回流，但只记录 shareSourceEntryId；访问者已有推广码或邀请码归属时保持原归属。"
          />
          <SmallState
            title="下一届承接"
            text="赛后回顾和我的预测大赛卡片要有下一届入口。v1 只展示世界杯占位或即将开放状态，不做自动续投。"
          />
        </div>
      </BoardSection>

      <BoardSection id="pool-detail-states" title="13. v4.5 预测大赛详情" description="用 mock 数据呈现对阵树、用户预测分布、tiebreaker、榜单摘要和进行中/结算态，而不是只用文字说明。">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <StateCard title="对阵树与冻结快照" description="R16 到决赛的 slot、当前选择、延迟/冻结分布和下游依赖。">
            <BracketTreePreview tournament={bracketTournaments[0]} entry={sampleEntries.find((entry) => entry.status === 'submitted') ?? sampleEntries[1]} />
          </StateCard>
          <StateCard title="我的预测右栏" description="完成度、tiebreaker、投影派奖、推广/邀请归因、锁前操作。">
            <PredictionSidePanelPreview entry={sampleEntries[1]} tournament={bracketTournaments[0]} />
          </StateCard>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <StateCard title="进行中榜单摘要" description="前 100 + 本人位置，榜单只展示名次，派奖仍按得分占比。">
            <LeaderboardPagePreview compact />
          </StateCard>
          <StateCard title="即将开放赛事" description="世界杯预测大赛占位，只承接预约心智，不开放入场。">
            <PoolTournamentCardPreview tournament={bracketTournaments[1]} />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="pool-dialog-states" title="14. v4.5 预测大赛弹窗" description="弹窗类组件不直接以 fixed modal 打开展板；这里用等价框架展示真实字段和关键状态，避免遮挡整个 Design Board。">
        <div className="grid gap-4 xl:grid-cols-2">
          <PredictionConfirmPreview />
          <PredictionSharePreview />
        </div>
      </BoardSection>

      <BoardSection id="pool-asset-states" title="15. v4.5 预测大赛资产" description="复用真实 PredictionEntryCard 和 PredictionReviewView，覆盖 draft/submitted/locked/settled/refunded 状态。">
        <div className="grid gap-4 xl:grid-cols-2">
          {sampleEntries.map((entry) => (
            <PredictionEntryCard
              key={entry.id}
              entry={entry}
              tournament={bracketTournaments[0]}
              onWithdraw={noop}
              onReplay={noop}
            />
          ))}
        </div>
        {sampleEntries.find((entry) => entry.review)?.review && (
          <StateCard title="独立赛后回顾组件" description="逐轮命中、最终派奖、每个 slot 对错。">
            <PredictionReviewView
              review={sampleEntries.find((entry) => entry.review)!.review!}
              totalScore={sampleEntries.find((entry) => entry.review)!.totalScore ?? 0}
              finalPayout={sampleEntries.find((entry) => entry.review)!.finalPayout}
              scoreShare={sampleEntries.find((entry) => entry.review)!.scoreShare}
            />
          </StateCard>
        )}
      </BoardSection>

      <BoardSection id="pool-share-states" title="16. 完整榜单与分享页" description="展示完整榜单页、分享只读页、分享链接失效态和归属不覆盖说明。">
        <div className="grid gap-4 xl:grid-cols-2">
          <StateCard title="完整榜单页" description="搜索、排序、分页、本人高亮和 tiebreaker 排序口径。">
            <LeaderboardPagePreview />
          </StateCard>
          <StateCard title="分享只读页" description="只展示 bracket 和冻结快照，不展示资金、得分或投影派奖。">
            <SharePagePreview />
          </StateCard>
          <StateCard title="分享链接失效" description="无效 shareId 或已失效链接的返回路径。">
            <ShareExpiredPreview />
          </StateCard>
          <StateCard title="分享不覆盖归属" description="访问者已有推广码/邀请码归属时，分享只记录回流来源。">
            <AttributionPreview />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection id="edge-states" title="17. 异常与边界" description="集中展示所有用户可见异常：赛事取消、全员 0 分兜底、最低人数未达、空数据、骨架和无效入口。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BetSlipPreview title="赛事取消退款" lines={['运营触发取消', '所有 entry 全额退款', 'refundReason = tournament_cancelled']} footer="已全额退款" tone="warning" />
          <BetSlipPreview title="全员 0 分兜底" lines={['aggregateScore = 0', '抽水降为 0', '所有 entry 全额退款']} footer="本届无人命中" tone="warning" />
          <BetSlipPreview title="最低人数未达" lines={['有效 entry < minEntrants', '本届不进入 locked', '展示 minimum_not_met 退款']} footer="未成团退款" tone="warning" />
          <NotFoundPreview />
          <SmallState title="预测大赛空列表" text="无正在报名 / 进行中 / 即将开放赛事时，分段展示“暂无”。" />
          <SmallState title="榜单搜索空态" text="完整榜单页未匹配用户时展示空结果，不影响返回详情页。" />
          <SmallState title="对阵树未确定" text="即将开放赛事 slots 为空时，展示“对阵树尚未确定”。" />
          <SmallState title="加载骨架" text="列表和详情仍使用 SoccerListSkeleton / SoccerMatchSkeleton。" />
        </div>
      </BoardSection>

      <BoardSection id="compliance-degrade" title="18. 中国大陆语境合规降级视图" description="仅作为设计状态展示，不实现地区准入、KYC、身份认证或真实拦截逻辑。">
        <ComplianceDegradePreview />
      </BoardSection>
    </div>
  )
}

function CoverageList({ items, compact }: { items: string[][]; compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? 'md:grid-cols-2' : ''}`}>
      {items.map(([name, pathOrText, detail]) => (
        <div key={name} className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--text-primary)]">{name}</span>
            <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[9px] text-[#2DD4BF]">covered</span>
          </div>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)] leading-4">{detail ?? pathOrText}</p>
          {detail && <p className="mt-0.5 text-[9px] font-mono text-[var(--text-secondary)]">{pathOrText}</p>}
        </div>
      ))}
    </div>
  )
}

function FuturesDetailPreview() {
  const competition = futuresCompetitions[0]
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-[10px] text-[#E85A7E] uppercase tracking-wider font-semibold">{competition.region} · {competition.phase}</p>
        <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">{competition.shortName}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{competition.headline}</p>
      </div>
      {competition.markets.slice(0, 3).map((item) => (
        <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[10px] text-[#E85A7E]">{item.group}</span>
            <span className="text-[10px] text-[var(--text-secondary)]">{item.subject.resolutionTimeLabel}</span>
          </div>
          <MarketRenderer market={item.market} displayTitle={item.market.title} matchId={item.subject.subjectId} onSelect={noop} />
        </div>
      ))}
    </div>
  )
}

function PredictionDetailPreview() {
  return (
    <div className="space-y-4">
      <PoolTournamentCardPreview tournament={bracketTournaments[0]} />
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <BracketTreePreview tournament={bracketTournaments[0]} entry={sampleEntries[1]} compact />
        <PredictionSidePanelPreview entry={sampleEntries[1]} tournament={bracketTournaments[0]} />
      </div>
    </div>
  )
}

function PoolTournamentCardPreview({ tournament }: { tournament: BracketTournament }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">预测市场 · {tournament.region}</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">{tournament.shortName}</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] leading-5">{tournament.headline}</p>
        </div>
        <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[10px] text-[#2DD4BF]">{describeStatus(tournament.status)}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="入场费" value={`${tournament.entryFee} ${tournament.currency}`} />
        <MiniStat label={tournament.status === 'upcoming' ? '开放倒计时' : '净奖池'} value={tournament.status === 'upcoming' ? formatLockCountdown(tournament.openAt) : `${tournament.poolSnapshot.netPool.toLocaleString()} USDT`} highlight />
        <MiniStat label="最低成团" value={`${tournament.minEntrants.toLocaleString()} 人`} />
      </div>
      <p className="mt-2 text-[10px] text-[var(--text-secondary)] leading-4">
        {tournament.affiliatePolicy.label} / {tournament.invitePolicy.label}；分享不覆盖既有归属。
      </p>
    </div>
  )
}

function BracketTreePreview({ tournament, entry, compact }: { tournament: BracketTournament; entry: UserBracketEntry; compact?: boolean }) {
  const rounds = compact ? (['R16', 'QF', 'SF'] as const) : (['R16', 'QF', 'SF', 'F'] as const)
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-fit gap-3">
        {rounds.map((round) => {
          const slots = tournament.slots.filter((slot) => slot.round === round).slice(0, compact ? 3 : undefined)
          return (
            <div key={round} className="w-52 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{round}</span>
                <span className="text-[10px] text-[#2DD4BF]">{tournament.rounds.find((item) => item.id === round)?.weight} pt</span>
              </div>
              {slots.map((slot) => {
                const picked = entry.picks[slot.id]
                const distribution = tournament.distribution.find((snap) => snap.slotId === slot.id)
                const candidates = slot.candidates ?? slot.childSlotIds?.map((id) => entry.picks[id]).filter(Boolean)
                return (
                  <div key={slot.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-control)]/40 p-2">
                    <p className="text-[10px] font-mono text-[var(--text-secondary)]">{slot.id}</p>
                    {distribution && (
                      <p className="mb-1 text-[9px] text-[var(--text-secondary)]">{distribution.frozen ? '已冻结' : '延迟快照'} · {distribution.totalPicks.toLocaleString()} picks</p>
                    )}
                    <div className="space-y-1">
                      {(candidates ?? ['待上游胜者']).slice(0, 2).map((teamId) => {
                        const share = distribution?.shares.find((item) => item.teamId === teamId)?.pickShare
                        return (
                          <div key={teamId} className={`rounded-md px-2 py-1.5 text-xs ${picked === teamId ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]' : 'bg-[var(--bg-card)] text-[var(--text-primary)]'}`}>
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate">{teamId === '待上游胜者' ? teamId : teamLabel(teamId)}</span>
                              {share !== undefined && <span className="text-[9px] text-[var(--text-secondary)]">{(share * 100).toFixed(0)}%</span>}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PredictionSidePanelPreview({ entry, tournament }: { entry: UserBracketEntry; tournament: BracketTournament }) {
  const filled = Object.keys(entry.picks).length
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">我的预测</h3>
      <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{describeAttribution(entry.attribution)}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="完成度" value={`${filled} / ${tournament.slots.length}`} />
        <MiniStat label="tiebreaker" value={String(entry.tiebreakerGuess ?? '—')} />
        <MiniStat label="投影派奖" value={entry.projectedPayout ? `≈ ${entry.projectedPayout}` : '报名期示例'} highlight />
        <MiniStat label="锁定" value={formatLockCountdown(tournament.lockAt)} />
      </div>
      <p className="mt-3 rounded-lg border border-[#FFB347]/30 bg-[#FFB347]/5 px-3 py-2 text-[10px] text-[var(--text-secondary)] leading-4">{tournament.fundLockHint}</p>
      <div className="mt-3 flex gap-2">
        <span className="rounded-lg bg-[#2DD4BF]/10 px-3 py-1.5 text-xs text-[#2DD4BF]">保存修改</span>
        <span className="rounded-lg bg-[var(--bg-control)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">分享</span>
      </div>
    </div>
  )
}

function LeaderboardPagePreview({ compact }: { compact?: boolean }) {
  const rows = [sampleSelfRunningRow, ...sampleLeaderboard.slice(0, compact ? 6 : 12)]
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--bg-control)]/40 p-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">全员得分榜｜欧冠 2026 淘汰赛</h3>
        <p className="mt-1 text-[10px] text-[var(--text-secondary)]">按命中率分奖，名次仅供展示；同分时按 tiebreaker 距离排序。</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {rows.map((row) => (
          <div key={`${row.rankDisplay}-${row.userName}`} className={`flex items-center gap-2 px-3 py-2 text-xs ${row.isSelf ? 'bg-[#2DD4BF]/10' : ''}`}>
            <span className="w-12 font-mono text-[10px] text-[var(--text-secondary)]">#{row.rankDisplay}</span>
            <span className={`flex-1 truncate ${row.isSelf ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'}`}>{row.userName}{row.isSelf ? '（你）' : ''}</span>
            <span className="w-14 text-right font-mono">{row.totalScore} 分</span>
            <span className="w-20 text-right font-mono text-[#2DD4BF]">{row.projectedPayout.toFixed(2)}</span>
          </div>
        ))}
      </div>
      {!compact && <p className="p-3 text-center text-xs text-[#2DD4BF]">加载更多（剩余 348 条）</p>}
    </div>
  )
}

function SharePagePreview() {
  const entry = sampleEntries.find((item) => item.shareId === 'share-self-settled') ?? sampleEntries[4]
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#2DD4BF]/30 bg-[var(--bg-card)] p-4">
        <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">预测大赛｜分享视图</p>
        <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{entry.userName} 的欧冠 2026 预测</h3>
        <p className="mt-1 text-[10px] text-[var(--text-secondary)]">分享页只记录回流来源，不覆盖访问者已有推广 / 邀请归属。</p>
        <p className="mt-2 rounded-lg bg-[#2DD4BF]/10 px-3 py-2 text-xs text-[#2DD4BF]">CTA：加入这届预测大赛</p>
      </div>
      <BracketTreePreview tournament={bracketTournaments[0]} entry={entry} compact />
    </div>
  )
}

function ShareExpiredPreview() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
      <p className="text-sm text-[var(--text-secondary)]">分享链接已失效或不存在。</p>
      <button className="mt-4 rounded-lg bg-[var(--bg-control)] px-4 py-2 text-xs text-[#2DD4BF]">返回足球首页</button>
    </div>
  )
}

function AttributionPreview() {
  const entries = sampleEntries.filter((entry) => entry.attribution).slice(0, 4)
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
          <p className="text-xs font-semibold text-[var(--text-primary)]">{entry.userName} · {entry.status}</p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{describeAttribution(entry.attribution)}</p>
          <p className="text-[10px] text-[var(--text-secondary)]">{entry.attribution?.rebateBasisLabel}</p>
        </div>
      ))}
    </div>
  )
}

function PredictionConfirmPreview() {
  const tournament = bracketTournaments[0]
  return (
    <StateCard title="预测大赛二次确认" description="等价展示 PredictionConfirmDialog 的字段；真实 Modal 不在展板中 fixed 打开。">
      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{tournament.name}</p>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="入场费" value={`${tournament.entryFee} ${tournament.currency}`} highlight />
          <MiniStat label="当前奖金池" value={`${tournament.poolSnapshot.netPool.toLocaleString()} USDT`} />
          <MiniStat label="保底池" value={`${tournament.guaranteedPool.toLocaleString()} USDT`} />
          <MiniStat label="最低成团" value={`${tournament.minEntrants.toLocaleString()} 人`} />
        </div>
        <p className="rounded-lg border border-[#FFB347]/30 bg-[#FFB347]/5 px-3 py-2 text-xs text-[var(--text-secondary)]">{tournament.fundLockHint}</p>
        <p className="text-[10px] text-[var(--text-secondary)]">推广 / 邀请返佣按平台收入口径计算，不改变净池和派奖公式。</p>
      </div>
    </StateCard>
  )
}

function PredictionSharePreview() {
  const entry = sampleEntries[1]
  return (
    <StateCard title="预测大赛分享弹窗" description="复制链接、导出预览、复制文案；公开链接不显示资金、得分或投影派奖。">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">欧冠 2026 淘汰赛</p>
        <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">我预测冠军：{teamLabel(entry.picks['F-1'])}</h3>
        <p className="mt-1 text-[10px] text-[var(--text-secondary)]">决赛总进球数（含加时）：{entry.tiebreakerGuess}</p>
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">来源：{describeAttribution(entry.attribution)}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <span className="rounded-lg bg-[var(--bg-control)] px-2 py-1.5">复制链接</span>
          <span className="rounded-lg bg-[var(--bg-control)] px-2 py-1.5">导出预览</span>
          <span className="rounded-lg bg-[var(--bg-control)] px-2 py-1.5">复制文案</span>
        </div>
      </div>
    </StateCard>
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
      <StateCard title="非大陆真钱版" description="在合法合规地区继续展示完整 v4.3/v4.4/v4.5 功能。">
        <SmallState title="完整模式" text="保留赔率、下注、入场费、奖金池、派奖、推广归因等能力；实际上线需按当地牌照和法务意见执行。" />
      </StateCard>
    </div>
  )
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-[var(--bg-control)] px-2.5 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p className={`mt-1 text-xs font-mono ${highlight ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'}`}>{value}</p>
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
        <span className="hidden lg:block w-[138px] shrink-0 text-center">亚盘</span>
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
        {['今天', '7 天', '全部'].map((item, index) => (
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
          {['胜平负 · RJ博塔弗戈', '合计 · 高于 2.5', '亚洲让分盘 · -0.5'].map((item) => <div key={item} className="rounded bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-primary)]">{item}</div>)}
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
