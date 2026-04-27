import MatchHeader from '../components/soccer/MatchHeader'
import MatchListCard from '../components/soccer/MatchListCard'
import MarketRenderer from '../components/soccer/MarketRenderer'
import MyBetCard from '../components/soccer/MyBetCard'
import { matches } from '../data/soccer/mockData'
import type { Market, MyBetItem, SoccerMatch } from '../data/soccer/types'

const noop = () => {}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const sourceMatch = matches[0]
const liveSourceMatch = matches.find((match) => match.status === 'live') ?? sourceMatch

function matchWith(status: SoccerMatch['status'], overrides: Partial<SoccerMatch> = {}): SoccerMatch {
  const shouldShowScore = status === 'live' || status === 'finished' || status === 'interrupted' || status === 'abandoned' || status === 'corrected'
  return {
    ...clone(sourceMatch),
    id: `board-${status}`,
    status,
    score: shouldShowScore ? (overrides.score ?? { home: 1, away: status === 'finished' ? 2 : 0 }) : undefined,
    currentMinute: status === 'live' ? (overrides.currentMinute ?? 65) : undefined,
    ...overrides,
  }
}

const allMarkets = sourceMatch.tabs.flatMap((tab) => tab.markets)

function marketByTitle(title: string): Market {
  const market = allMarkets.find((item) => item.title === title)
  if (!market) throw new Error(`Design board market not found: ${title}`)
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

function settlementMarket(result: 'win' | 'loss' | 'void' | 'push'): Market {
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
  matchWith('postponed', { id: 'board-list-postponed', date: '待定', time: 'TBD' }),
]

const headerMatches: Array<{ label: string; note: string; match: SoccerMatch }> = [
  { label: '赛前', note: '展示开赛时间，不展示比分。', match: matchWith('scheduled') },
  { label: '直播', note: '展示比分、分钟和直播状态。', match: matchWith('live', { score: { home: 1, away: 0 }, currentMinute: 65 }) },
  { label: '已结束', note: '展示最终比分，不再接受新增投注。', match: matchWith('finished', { score: { home: 0, away: 1 } }) },
  { label: '延期', note: '展示异常状态，不展示比分。', match: matchWith('postponed', { date: '待定', time: 'TBD' }) },
  { label: '取消', note: '展示取消状态，相关盘口按规则作废。', match: matchWith('cancelled', { date: '待定', time: 'TBD' }) },
  { label: '已更正', note: '展示修正状态和修正后的比分。', match: matchWith('corrected', { score: { home: 2, away: 2 } }) },
]

const marketTypeScenarios: Array<{ label: string; note: string; market: Market; selected?: boolean }> = [
  { label: '按钮组', note: '用于胜平负、是否、单双等少量选项。', market: marketByTitle('胜平负'), selected: true },
  { label: '赔率表', note: '用于大小球、让球等带线值盘口。', market: marketByTitle('合计') },
  { label: '比分网格', note: '用于正确比分。', market: marketByTitle('正确进球') },
  { label: '球员列表', note: '用于任意时间、首个、最后进球队员。', market: marketByTitle('任何时间进球队员') },
  { label: '组合网格', note: '用于赛果和总进球等组合判断。', market: marketByTitle('1x2 & 合计') },
  { label: '范围按钮', note: '用于总进球数、进球范围、首球时间。', market: marketByTitle('总进球数') },
]

const marketStateScenarios: Array<{ label: string; note: string; market?: Market; selectedKey?: string; conflict?: boolean }> = [
  { label: '开放', note: '用户可以选择并加入投注单。', market: marketByTitle('胜平负') },
  { label: '选中', note: '同一盘口当前选项高亮。', market: marketByTitle('胜平负'), selectedKey: selectedKeyFor(marketByTitle('胜平负')) },
  { label: '暂停', note: '盘口保留展示，但不可选择。', market: marketWith('合计', { status: 'suspended' }) },
  { label: '即将开放', note: '盘口存在，但尚未开放投注。', market: marketWith('总进球数', { status: 'upcoming' }) },
  { label: '作废', note: '盘口作废，已下注按退款规则处理。', market: marketWith('合计', { status: 'void' }) },
  { label: '取消', note: '盘口取消，不再接受投注。', market: marketWith('胜平负', { status: 'cancelled' }) },
  { label: '已结算赢', note: '展示命中结果。', market: settlementMarket('win') },
  { label: '已结算输', note: '展示未命中。', market: settlementMarket('loss') },
  { label: '退款', note: 'Push 或 void 按退款展示。', market: settlementMarket('push') },
  { label: '结果修正', note: '展示修正后的结果。', market: marketWith('正确进球', { status: 'corrected', winningSelection: '2:1' }) },
  { label: '同场互斥', note: '盘口保留展示，并解释与已选盘口冲突。', market: marketByTitle('正确进球'), conflict: true },
  { label: '隐藏', note: '后台隐藏的盘口不出现在用户列表中。' },
]

const betSlipScenarios = [
  { title: '空单', detail: '没有投注项，只提示用户点击赔率。', state: '点击赔率按钮添加选项' },
  { title: '单关', detail: '1 个投注项，展示金额、赔率、可能返还。', state: 'RJ博塔弗戈 vs 米拉索尔 · 胜平负 · 主胜 @1.83' },
  { title: '串关', detail: '2 个或更多投注项组成一张注单，全部命中才赢。', state: '3 腿 · 总赔率 7.42 · 全部命中才赢' },
  { title: '复式', detail: '按组合拆成多注，展示单注金额、注数和总投注额。', state: 'Yankee · 4 腿 · 11 注 · 总投注额 110 USDT' },
  { title: '报价倒计时', detail: '赔率锁定窗口内可以提交。', state: '报价剩余 00:24' },
  { title: '报价过期', detail: '不清空投注项，但阻止按旧价格提交。', state: '报价已过期，需要接受当前赔率' },
  { title: '赔率变化', detail: '显示原赔率和当前赔率，按接受策略决定是否可提交。', state: '1.83 → 1.91' },
  { title: '含不可用项', detail: '比赛结束、盘口暂停或作废时，整张单不能提交。', state: '合计已暂停，需要移除该投注项' },
  { title: '金额不足', detail: '低于最低投注额时阻止提交。', state: '单注不得低于 1 USDT' },
  { title: '余额不足', detail: '总投注额超过可用余额时阻止提交。', state: '可用余额不足' },
  { title: '提交中', detail: '确认后进入等待状态，不能重复提交。', state: '正在确认投注…' },
  { title: '提交失败', detail: '保留投注单和金额，让用户按原因修正。', state: '盘口已关闭，请移除不可用项后重试' },
  { title: '二次确认', detail: '高金额或多腿串关触发确认弹窗。', state: '确认投注 · 3 腿 · 可能返还 7,420.00 USDT' },
]

const sampleBets: MyBetItem[] = [
  {
    id: 'board-bet-placed',
    betCode: 'TF-DESIGN01',
    matchLabel: 'RJ博塔弗戈 vs 米拉索尔',
    marketTitle: '胜平负',
    selection: 'RJ博塔弗戈',
    odds: 1.83,
    amount: 50,
    stake: 50,
    result: 'win',
    status: 'placed',
    payout: 0,
    potentialReturn: 91.5,
    placedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    cashout: { availablePrice: 45, minutesUntilExpire: 10 },
  },
  {
    id: 'board-bet-live',
    betCode: 'TF-DESIGN02',
    matchLabel: '弗拉门戈 vs 科林蒂安',
    marketTitle: '合计',
    selection: '高于 2.5',
    odds: 2.05,
    amount: 100,
    stake: 100,
    result: 'win',
    status: 'live',
    payout: 0,
    potentialReturn: 205,
    placedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    cashout: { availablePrice: 132.4, minutesUntilExpire: 8 },
  },
  {
    id: 'board-bet-win',
    betCode: 'TF-DESIGN03',
    matchLabel: '瓦斯科达伽马 vs 米内罗竞技',
    marketTitle: '正确进球',
    selection: '0:1',
    odds: 8.4,
    amount: 20,
    stake: 20,
    result: 'win',
    settlementResult: 'win',
    status: 'settled',
    payout: 168,
    placedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'board-bet-push',
    betCode: 'TF-DESIGN04',
    matchLabel: '桑托斯 vs 巴伊亚',
    marketTitle: '亚洲让分盘',
    selection: '0 / 0',
    odds: 1.91,
    amount: 80,
    stake: 80,
    result: 'push',
    settlementResult: 'push',
    status: 'settled',
    payout: 80,
    placedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'board-bet-cashout',
    betCode: 'TF-DESIGN05',
    matchLabel: '阿森纳 vs 切尔西',
    marketTitle: '串关',
    selection: '3 腿',
    odds: 5.62,
    amount: 100,
    stake: 100,
    result: 'win',
    status: 'cashed_out',
    payout: 286.5,
    placedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'board-bet-corrected',
    betCode: 'TF-DESIGN06',
    matchLabel: '巴黎圣日耳曼 vs 拜仁慕尼黑',
    marketTitle: '两队都得分',
    selection: '是',
    odds: 1.83,
    amount: 120,
    stake: 120,
    result: 'loss',
    settlementResult: 'loss',
    status: 'corrected',
    payout: 0,
    placedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    correction: { originalResult: 'win', newResult: 'loss', diffPayout: -99.6 },
  },
]

export default function SoccerDesignBoardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs text-[#2DD4BF] font-semibold mb-2">足球盘口设计状态展板</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">把隐藏在交互里的页面和状态一次性铺开</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--text-secondary)] leading-6">
          这个页面只服务产品和设计评审。它把首页、比赛详情、盘口状态、投注单、注单和异常反馈集中展示，
          设计师不需要逐个点击探索，也能看到需要覆盖的全部关键状态。
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <Metric label="页面模块" value="6" />
          <Metric label="盘口状态" value="12" />
          <Metric label="投注单状态" value="13" />
          <Metric label="注单状态" value="6" />
        </div>
      </header>

      <BoardSection
        title="1. 首页列表"
        description="首页需要同时覆盖赛前、直播、已结束和异常比赛。赛前不显示比分，直播和已结束才显示比分。"
      >
        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[9px] text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
            <span className="w-12 shrink-0 text-center">时间</span>
            <span className="flex-1">比赛</span>
            <span className="hidden sm:block w-[182px] shrink-0 text-center">1x2</span>
            <span className="hidden md:block w-[118px] shrink-0 text-center">总进球</span>
            <span className="hidden lg:block w-[138px] shrink-0 text-center">亚盘</span>
            <span className="w-16 shrink-0 text-right">盘口</span>
          </div>
          {listMatches.map((match) => (
            <MatchListCard key={match.id} match={match} />
          ))}
        </div>
        <StateGrid>
          <SmallState title="空列表" text="筛选后没有比赛时，页面显示“暂无赛事”。" />
          <SmallState title="直播分组" text="侧栏可提示直播数量和进行中的比分。" />
          <SmallState title="即将开赛" text="只展示时间，不展示尚未产生的比分。" />
        </StateGrid>
      </BoardSection>

      <BoardSection
        title="2. 比赛头部"
        description="比赛状态决定用户第一眼看到的是时间、比分、分钟还是异常状态。"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {headerMatches.map((item) => (
            <StateCard key={item.label} title={item.label} description={item.note}>
              <MatchHeader match={item.match} />
            </StateCard>
          ))}
        </div>
      </BoardSection>

      <BoardSection
        title="3. 盘口类型"
        description="盘口类型决定信息密度。展板保留真实组件样式，方便设计师按类型补齐规范。"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {marketTypeScenarios.map((item) => (
            <StateCard key={item.label} title={item.label} description={item.note}>
              <MarketRenderer
                market={item.market}
                displayTitle={item.market.title}
                matchId={liveSourceMatch.id}
                onSelect={noop}
                selectedKey={item.selected ? selectedKeyFor(item.market) : undefined}
              />
            </StateCard>
          ))}
        </div>
      </BoardSection>

      <BoardSection
        title="4. 盘口状态"
        description="盘口不能只靠隐藏或置灰表达。暂停、作废、结算、修正和冲突都要有各自反馈。"
      >
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
      </BoardSection>

      <BoardSection
        title="5. 进球类开关"
        description="开赛后是否继续开放进球类盘口由后台开关控制。角球和红黄牌不是进球类盘口，不受这个开关影响。"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <StateCard title="开关打开" description="直播中，进球类盘口仍可投注。">
            <MarketRenderer market={marketByTitle('合计')} displayTitle="合计" matchId={liveSourceMatch.id} onSelect={noop} />
          </StateCard>
          <StateCard title="开关关闭" description="直播中，进球类盘口保留展示但暂停。">
            <MarketRenderer market={marketWith('合计', { status: 'suspended' })} displayTitle="合计" matchId={liveSourceMatch.id} onSelect={noop} />
          </StateCard>
          <StateCard title="非进球盘口" description="角球总数和红黄牌总数按自身状态处理。">
            <MarketRenderer market={marketByTitle('角球总数')} displayTitle="角球总数" matchId={liveSourceMatch.id} onSelect={noop} />
          </StateCard>
        </div>
      </BoardSection>

      <BoardSection
        title="6. 投注单状态"
        description="这些状态大多藏在金额输入、赔率变化、盘口变更和提交失败之后，展板直接平铺出来。"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {betSlipScenarios.map((item) => (
            <div key={item.title} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] leading-5">{item.detail}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#2DD4BF]/10 px-2 py-1 text-[10px] text-[#2DD4BF]">投注单</span>
              </div>
              <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-control)] p-3">
                <p className="text-xs text-[var(--text-primary)]">{item.state}</p>
              </div>
            </div>
          ))}
        </div>
      </BoardSection>

      <BoardSection
        title="7. 我的注单"
        description="注单状态需要覆盖待结算、进行中、输赢、退款、提前兑付和赛果修正。"
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sampleBets.map((bet) => (
            <MyBetCard key={bet.id} bet={bet} onCashOut={noop} onReplay={noop} onCopyCode={noop} />
          ))}
        </div>
      </BoardSection>
    </div>
  )
}

function BoardSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)] leading-6">{description}</p>
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
  children: React.ReactNode
}) {
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

function StateGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-3">{children}</div>
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
      <p className="text-sm font-medium text-[var(--text-primary)]">用户侧不展示</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">隐藏盘口只保留在展板说明中，不占用户页面位置。</p>
    </div>
  )
}
