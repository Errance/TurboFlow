import MatchHeader from '../components/soccer/MatchHeader'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import MatchListCard from '../components/soccer/MatchListCard'
import MarketRenderer from '../components/soccer/MarketRenderer'
import MyBetCard from '../components/soccer/MyBetCard'
import MyBetsPanel from '../components/soccer/MyBetsPanel'
import { SoccerListSkeleton, SoccerMatchSkeleton } from '../components/soccer/SoccerSkeletons'
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
  ['page-states', '页面级状态'],
  ['match-states', '比赛状态'],
  ['lean-markets', '本期盘口'],
  ['market-states', '盘口状态'],
  ['goal-toggle', '开赛封盘'],
  ['betslip-states', '投注单状态'],
  ['float-states', '浮动投注单'],
  ['mybets-states', '我的注单'],
  ['rule-states', '报价和提交反馈'],
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
          当前仅覆盖 v4.3 范围内的多笔单注、串关、报价确认和开赛封盘能力。
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-6">
          <Metric label="页面模块" value="5" />
          <Metric label="比赛状态" value="7" />
          <Metric label="本期盘口" value="10" />
          <Metric label="盘口状态" value="11" />
          <Metric label="投注单状态" value="20" />
          <Metric label="注单样例" value="11" />
        </div>
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-4">
          <p className="text-xs font-semibold text-[var(--text-primary)]">本期盘口范围</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEAN_MARKET_ORDER.map((title) => (
              <span key={title} className="rounded-full bg-[#2DD4BF]/10 px-2.5 py-1 text-[10px] text-[#2DD4BF]">{title}</span>
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

      <BoardSection id="lean-markets" title="3. v4.3 本期盘口" description="仅平铺当前版本可用的 10 个盘口，不展示未进入本期范围的扩展盘口。">
        <div className="grid gap-4 xl:grid-cols-2">
          {leanMarketScenarios.map((item) => (
            <StateCard key={item.title} title={item.title} description="当前主流程盘口。">
              <MarketRenderer market={item.market} displayTitle={item.market.title} matchId={liveSourceMatch.id} onSelect={noop} />
            </StateCard>
          ))}
        </div>
      </BoardSection>

      <BoardSection id="market-states" title="4. 盘口状态和串关互斥" description="暂停、作废、结算、封盘和串关冲突都需要给出清晰反馈；多笔单注不做同场组合限制。">
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

      <BoardSection id="goal-toggle" title="5. 开赛封盘" description="比赛开始后所有盘口封盘，赔率停止变化，不能新增投注或提交未确认投注单。">
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

      <BoardSection id="betslip-states" title="6. 投注单状态" description="集中展示空单、多笔单注、串关、报价、二次确认、提交反馈和设置。">
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

      <BoardSection id="float-states" title="7. 浮动投注单" description="用户离开比赛详情页后，已有足球投注单仍可通过浮动条返回。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SmallState title="无投注项" text="不展示浮动条。" />
          <FloatPreview title="1 项" subtitle="总赔率 1.83" />
          <FloatPreview title="3 项" subtitle="总赔率 7.42 · 跨 3 场" />
          <FloatPreview title="赔率已变动" subtitle="总赔率 6.88 · 赔率已变动" warning />
        </div>
      </BoardSection>

      <BoardSection id="mybets-states" title="8. 我的注单" description="展示注单页、右栏摘要、多笔单注卡、串关卡和结算结果。">
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

      <BoardSection id="rule-states" title="9. 报价和提交反馈" description="这些状态需要在用户提交前后给出清晰、可操作的提示。">
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
