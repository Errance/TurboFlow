import { useState } from 'react'
import MatchHeader from '../components/soccer/MatchHeader'
import MatchListCard from '../components/soccer/MatchListCard'
import { SoccerListSkeleton } from '../components/soccer/SoccerSkeletons'
import { futuresCompetitions } from '../data/soccer/futuresData'
import { matches } from '../data/soccer/mockData'
import type { SoccerMatch } from '../data/soccer/types'

const LEAN_MARKET_ORDER = [
  '胜平负',
  '开球权',
  '让球',
  '让球 0:1',
  '总进球数',
  '大小球',
  '波胆',
]

const v6BoardSections = [
  ['coverage', '总览'],
  ['v6-overview', 'v6 总览'],
  ['v6-pages', '页面预览'],
  ['v6-markets', '市场覆盖'],
  ['v6-states', '状态与异常'],
  ['v6-compliance', '结算边界'],
]

const deltaBoardSections = [
  ['coverage', '总览'],
  ['v60-amm-delta', 'UI 变更对比'],
]

const v6ActiveCoverage = [
  ['SoccerPage', '/soccer', '首页 tab、比赛列表、AMM 价格格式切换'],
  ['SoccerMatchPage', '/soccer/match/:matchId', '比赛详情、AmmMarketRenderer、AmmTradePanel、AmmPortfolioPanel'],
  ['SoccerFuturesPage', '/soccer/futures/:competitionId', '冠军与晋级 11 个赛事级市场 AMM 化'],
  ['SoccerMyBetsPage', '/soccer/mybets', 'Portfolio / 我的持仓、成交记录、买入和卖出入口'],
  ['AmmMarketRenderer', 'src/components/soccer/AmmMarketRenderer.tsx', '正式路由中使用的 outcome 市场卡'],
  ['AmmTradePanel', 'src/components/soccer/AmmTradePanel.tsx', '买入、部分卖出、全部卖出和 quote 风险反馈'],
  ['AmmPortfolioPanel', 'src/components/soccer/AmmPortfolioPanel.tsx', '持仓、可卖份额、市值和盈亏'],
  ['SoccerPriceFormatToggle', 'src/components/soccer/SoccerPriceFormatToggle.tsx', '小齿轮入口，弹框切换概率 + 份额价格 / 欧洲赔率'],
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const sourceMatch = matches[0]
const liveSourceMatch = matches.find((match) => match.status === 'live') ?? sourceMatch

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

const listMatches: SoccerMatch[] = [
  matchWith('scheduled', { id: 'board-list-scheduled', date: '04月28日', time: '20:00' }),
  matchWith('live', { id: 'board-list-live', score: { home: 2, away: 1 }, currentMinute: 72 }),
  matchWith('finished', { id: 'board-list-finished', score: { home: 0, away: 1 } }),
  matchWith('postponed', { id: 'board-list-postponed', date: '待定', time: '待定' }),
]

function stopBoardInteraction(event: React.SyntheticEvent) {
  event.preventDefault()
  event.stopPropagation()
}

export default function SoccerDesignBoardPage() {
  const [activeBoardTab, setActiveBoardTab] = useState<'v6' | 'delta'>('v6')
  const currentBoardSections = activeBoardTab === 'v6' ? v6BoardSections : deltaBoardSections

  return (
    <div
      className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-10"
    >
      <header id="coverage" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs text-[#2DD4BF] font-semibold mb-2">足球 AMM 预测市场设计状态展板</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">足球 v6.0 AMM Design Board</h1>
        <p className="mt-3 max-w-4xl text-sm text-[var(--text-secondary)] leading-6">
          本页面拆成两个可切换 tab：完整 v6.0 展板用于签收当前 AMM 主流程；v5.0 → v6.0 对比只展示真实发生变化的 UI。
        </p>
        {activeBoardTab === 'v6' ? (
          <div className="mt-4 grid gap-2 md:grid-cols-6">
            <Metric label="变更对比项" value="15" />
            <Metric label="v6 激活项" value={String(v6ActiveCoverage.length)} />
            <Metric label="历史对照项" value={String(legacyCoverage.length)} />
            <Metric label="本期盘口" value="7" />
            <Metric label="赛事级市场" value={String(futureMarketCoverage.length)} />
            <Metric label="明确排除" value={String(excludedCoverage.length)} />
          </div>
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-6">
            <Metric label="UI 变更项" value="15/15" />
            <Metric label="页面区域" value="5/5" />
            <Metric label="单场市场" value="7/7" />
            <Metric label="赛事级市场" value="11/11" />
            <Metric label="状态变化" value="8/8" />
            <Metric label="移除入口" value="6/6" />
          </div>
        )}
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
            ['delta', 'v5.0 → v6.0 UI 变更对比', '只展示真实变化项，不混入没变更的回归或覆盖内容。'],
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
          {currentBoardSections.map(([id, label]) => (
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
      <BoardSection id="v60-amm-delta" title="v5.0 → v6.0 全量 UI 变更对比" description="本区只展示用户能看到的界面变化。每行左侧是 v5 旧 UI，右侧是 v6 新 UI，下方只写可见变化点。">
        <div className="rounded-2xl border border-[#2DD4BF]/25 bg-[#2DD4BF]/5 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SmallState title="读法" text="从左到右看：v5 旧界面 → v6 新界面。" />
            <SmallState title="覆盖" text="页面 5/5、单场市场 7/7、赛事级市场 11/11、状态 8/8、移除入口 6/6。" />
            <SmallState title="只看 UI" text="只展示按钮、文案、面板、状态、入口和价格显示等可见变化。" />
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
            notes={['保留原来的列位置和市场入口。', '价格格式由小齿轮弹框控制：概率 + 份额价格 / 欧洲赔率。', '点击比赛仍进入详情页，不在列表直接提交交易。']}
          />

          <ChangeComparisonRow
            index="02"
            title="市场卡片和 outcome 按钮"
            scope="MarketRenderer → AmmMarketRenderer"
            summary="原来点击赔率按钮加入投注单；现在点击 outcome 选中可交易份额，并在右栏显示交易预估。"
            before={<OldOutcomeButtonsPreview />}
            after={<NewAmmOutcomeButtonsPreview />}
            paths={['src/components/soccer/MarketRenderer.tsx', 'src/components/soccer/AmmMarketRenderer.tsx']}
            statusTags={['组件替换', 'outcome 交易']}
            notes={['每个 outcome 展示概率、Buy Yes/No 份额价格、24h Vol. 和 24h 涨跌幅。', '开放、暂停、关闭等状态通过卡片视觉状态表达，不占用指标行。', '欧洲赔率只作为另一种显示方式。']}
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
            summary="右栏从传统投注单改为 AMM 交易面板。买入和卖出都显示即时成交预估，支持部分卖出和全部卖出。"
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
            summary="v6 不再用投注单的空单、串关、二次确认状态；交易面板改为覆盖用户能看到的交易状态和风险提示。"
            before={<OldBetSlipStateMatrixPreview />}
            after={<NewAmmTradeStateMatrixPreview />}
            paths={['src/components/soccer/AmmTradePanel.tsx', 'src/stores/soccerAmmStore.ts']}
            statusTags={['quote 生命周期', '风险反馈', '无挂单']}
            notes={['空选择、买入、卖出、部分卖出、全部卖出都要有明确状态。', '余额不足、报价过期、价格影响过高、流动性不足都以用户提示展示。', '不出现串关、接受赔率变化、二次确认投注等传统动作。']}
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
            summary="赔率格式设置从常驻按钮变成小齿轮弹框；异常提示从下单拒单变为报价过期、流动性不足和市场暂停。"
            before={<OldSettingsAndErrorPreview />}
            after={<NewPriceAndRiskPreview />}
            paths={['src/components/soccer/SoccerPriceFormatToggle.tsx', 'src/data/soccer/ammData.ts']}
            statusTags={['份额主价格', '欧洲赔率展示', 'AMM 风险态']}
            notes={['交易确认中同时展示概率、份额价格和欧洲赔率换算。', '报价过期、流动性不足、价格影响过高都展示为明确提示。', '关键事件暂停同时影响买入和卖出按钮。']}
          />

          <ChangeComparisonRow
            index="10"
            title="移除的传统入口"
            scope="AppShell / SoccerBetSlipFloat / SoccerPrediction* / CLOB"
            summary="把 v5 中会误导用户进入传统投注的入口从 v6 主流程中移除或替换。"
            before={<OldGlobalResidualPreview />}
            after={<NewV6BoundaryPreview />}
            paths={['src/layouts/AppShell.tsx', 'src/components/soccer/SoccerBetSlipFloat.tsx', 'src/pages/ClobPage.tsx']}
            statusTags={['历史残留', '未路由排除', 'CLOB 延后']}
            notes={['传统浮动投注条不再作为足球 AMM 入口。', '订单簿、限价单、撤单等入口不在足球 AMM 页面展示。', '历史预测玩法不混入本次 AMM 主流程。']}
          />

          <ChangeComparisonRow
            index="11"
            title="比赛详情选择状态"
            scope="v5 code 8e53715 SoccerMatchPage → v6 current SoccerMatchPage"
            summary="比赛详情从投注项高亮和串关冲突提示，改成 outcome 选中、右栏交易预估和持仓摘要。"
            before={<OldV5MatchInteractionPreview />}
            after={<NewV6MatchInteractionPreview />}
            paths={['git show 8e53715:src/pages/SoccerMatchPage.tsx', 'src/pages/SoccerMatchPage.tsx']}
            statusTags={['v5 代码基线', '交互全覆盖']}
            notes={['旧 UI 高亮的是已加入投注单的赔率按钮。', '新 UI 高亮的是当前选中的 outcome。', '串关冲突提示从比赛详情主流程中移除。']}
          />

          <ChangeComparisonRow
            index="12"
            title="报价变化与交易反馈"
            scope="oddsRegistry / oddsTicker → AMM quote"
            summary="v5 展示赔率变化和接受最新赔率；v6 展示报价过期、重新询价和交易失败提示。"
            before={<OldV5OddsLifecyclePreview />}
            after={<NewAmmQuoteLifecyclePreview />}
            paths={['src/services/oddsRegistry.ts', 'src/services/oddsTicker.ts', 'src/stores/soccerAmmStore.ts']}
            statusTags={['报价生命周期', '交易保护']}
            notes={['旧 UI 在投注单内提示赔率变化。', '新 UI 在交易面板内提示重新询价。', '价格影响和流动性不足都不会展示为等待订单。']}
          />

          <ChangeComparisonRow
            index="13"
            title="我的注单工具区"
            scope="v5 SoccerMyBetsPage → v6 SoccerMyBetsPage"
            summary="旧我的注单页包含状态筛选、日期筛选、Cash Out、重投和导出；新页面改为 Portfolio 和交易历史。"
            before={<OldV5MyBetsToolsPreview />}
            after={<NewV6PortfolioToolsPreview />}
            paths={['git show 8e53715:src/pages/SoccerMyBetsPage.tsx', 'src/pages/SoccerMyBetsPage.tsx']}
            statusTags={['Cash Out 移除', 'Portfolio 替代']}
            notes={['Cash Out 被 AMM 卖出替代。', '重投被再次买入相同 outcome 替代。', '导出注单不是 v6 主流程，可后续作为成交导出重新定义。']}
          />

          <ChangeComparisonRow
            index="14"
            title="冠军与晋级页面信息"
            scope="v5 SoccerFuturesPage → v6 SoccerFuturesPage"
            summary="冠军与晋级页保留系列赛、阶段分组、关闭时间和结算来源，但报价按钮改为长期 AMM 持仓入口。"
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

        </>
      )}
    </div>
  )
}

function V6FullDesignBoardTab() {
  const v6PageCoverage = [
    ['足球首页', '/soccer', '单场预测 / 冠军与晋级、联赛导航、进行中/即将开赛、AMM 价格列、小齿轮价格设置、More 入口。'],
    ['比赛详情', '/soccer/match/:matchId', '面包屑、比赛头部、市场 tab、7 个 AMM 单场市场、右栏赛事信息、交易面板、Portfolio 摘要。'],
    ['冠军与晋级详情', '/soccer/futures/:competitionId', '系列赛对象、阶段分组、11 个赛事级 AMM 市场、关闭时间、结算来源、右栏交易与持仓。'],
    ['Portfolio', '/soccer/mybets', '当前持仓、可卖份额、均价、现价、市值、已实现/未实现盈亏、最近成交和卖出入口。'],
    ['Design Board', '/soccer/design-board', '本页两 tab：v6 完整展板 + v5 到 v6 全量 UI 变更对比。'],
  ]
  const v6MarketCoverage = [
    ...LEAN_MARKET_ORDER.map((title) => [title, '单场 7/7', 'v6 使用 AMM outcome、概率 + 份额价格、24h Vol. 和 24h 涨跌幅；交易状态由卡片视觉表达。']),
    ...futureMarketCoverage.map((item) => [item.title, '冠军与晋级 11/11', `${item.text}｜v6 使用长期 AMM position，可买入、部分卖出、全部卖出。`]),
  ]
  const v6StateCoverage = [
    ['市场状态', 'open / paused / closed / settled / void', '分别展示可交易、暂停交易、关闭、已结算、作废退款。'],
    ['交易状态', '未选 / 买入 / 卖出 / 部分卖出 / 全部卖出', '全部通过 AMM quote 即时成交，不产生挂单或部分成交挂起。'],
    ['Quote 风险', '过期 / 余额不足 / 价格影响过高 / 流动性不足', '整笔交易失败并重新询价，不能沿用旧报价。'],
    ['Portfolio 生命周期', '持仓 / 最近成交 / 已实现盈亏 / 未实现盈亏 / settled / void', '以 position 和 trade 为中心，不再以注单为中心。'],
    ['比赛异常映射', 'live / postponed / cancelled / abandoned / interrupted', '从 v5 封盘心智映射为 AMM 市场暂停、关闭或 void。'],
    ['价格显示', '55% + Buy Yes 55¢ + 欧赔 1.82', '默认同时展示概率和份额价格，欧洲赔率仅为切换展示。'],
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
          <SmallState title="价格主口径" text="默认展示概率 + 份额价格，例如 55% + Buy Yes 55¢；欧洲赔率通过齿轮弹框切换。" />
          <SmallState title="交易模型" text="AMM 即时 quote，买入、部分卖出、全部卖出；不展示挂单和部分成交挂起。" />
        </div>
      </BoardSection>

      <BoardSection id="v6-pages" title="v6.0 页面完整预览" description="按当前正式路由组织，展示设计师需要签收的主流程画面和状态。">
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <StateCard title="/soccer 左侧导航" description="联赛筛选、全部赛事、进行中和即将开赛保持 v5 信息架构。">
            <LeagueSidebarPreview />
          </StateCard>
          <StateCard title="/soccer AMM 比赛列表" description="同一列表位置展示概率 + 份额价格、24h Vol. 和 24h 涨跌幅，不再展示平台承诺赔率。">
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
            {LEAN_MARKET_ORDER.map((title) => <SmallState key={title} title={title} text="AMM outcome / 概率 + 份额价格 / 24h Vol. / 24h 涨跌幅；状态用卡片视觉表达。" />)}
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
              {['价格设置齿轮', 'MatchInfoPanel 赛事信息', 'AmmTradePanel 买入 / 卖出', 'AmmPortfolioPanel compact'].map((item) => (
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
          <SmallState title="定价方式" text="AMM 概率 + 份额价格，欧洲赔率仅作切换展示。" />
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
            <p className="mt-1 text-[10px] text-[var(--text-secondary)]">AMM outcome · 概率 + 份额价格 · 24h Vol. + 涨跌幅</p>
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
  summary,
  before,
  after,
  notes,
}: {
  index: string
  title: string
  scope?: string
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
        </div>
        <span className="rounded-lg bg-[var(--bg-control)] px-3 py-1.5 text-[10px] text-[var(--text-secondary)]">UI 变更对比</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{summary}</p>

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
        <p className="mb-2 text-[10px] font-semibold text-[var(--text-primary)]">可见变化点</p>
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
        <div className="flex justify-end"><Pill tone="green">价格设置</Pill></div>
        <div className="rounded-lg bg-[var(--bg-control)] p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[var(--text-primary)]">RJ博塔弗戈 vs 米拉索尔</span>
            <span className="text-[#2DD4BF]">More</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {['主 55% · Buy 55¢', '平 29% · Buy 29¢', '客 24% · Buy 24¢', '大 49% · Buy 49¢', '小 56% · Buy 56¢'].map((item) => (
              <div key={item} className="rounded border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-2 py-1 text-center text-[10px] font-mono text-[var(--text-primary)]">{item}</div>
            ))}
          </div>
        </div>
        <p className="text-[10px] leading-5 text-[var(--text-secondary)]">数字含义：默认同时展示概率和 Buy 份额价格；欧洲赔率只在齿轮弹框中切换展示。</p>
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
            ['RJ博塔弗戈', '55%', 'Buy Yes 55¢ · 24h Vol. $2.4k · -1.2%'],
            ['平局', '29%', 'Buy Yes 29¢ · 24h Vol. $1.7k · +0.8%'],
            ['米拉索尔', '24%', 'Buy Yes 24¢ · 24h Vol. $1.1k · +0.4%'],
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
              <span className="font-mono text-[10px] text-[#2DD4BF]">概率价格</span>
            </div>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">点击 outcome 后在右栏交易</p>
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
          ['预估成交均价', '55% / 55¢ / 欧赔 1.82'],
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
        <Pill tone="green">世界杯 2026 · AMM outcome</Pill>
        {['法国 17% · Buy Yes 17¢ · 24h Vol. $3.1k · +1.4%', '巴西 16% · Buy Yes 16¢ · 24h Vol. $2.9k · -0.6%', '阿根廷 14% · Buy Yes 14¢ · 24h Vol. $2.4k · +0.2%'].map((item) => (
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
        <div className="rounded-xl border border-[#2DD4BF]/25 bg-[#2DD4BF]/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">价格设置</span>
            <span className="rounded-lg border border-[#2DD4BF]/30 px-2 py-1 text-[10px] text-[#2DD4BF]">gear</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="rounded-lg bg-[#2DD4BF]/15 px-3 py-2 text-xs text-[#2DD4BF]">概率 + 份额价格：96% + Buy Yes 95.9¢</div>
            <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-xs text-[var(--text-secondary)]">欧洲赔率：仅展示换算</div>
          </div>
        </div>
        {['报价已过期，请重新询价', '流动性不足，整笔交易失败', '关键事件暂停，买入和卖出均不可用'].map((item) => (
          <div key={item} className="rounded-lg bg-amber-500/10 px-3 py-2 text-[10px] text-amber-300">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldGlobalResidualPreview() {
  return (
    <UiPanel title="v5 传统入口">
      <div className="space-y-2">
        {[
          ['浮动投注条', '底部常驻，可继续添加投注项'],
          ['右栏投注单', '比赛详情和长期市场共用投注入口'],
          ['预测玩法入口', '与足球交易主流程混在同一设计语境中'],
          ['订单簿玩法', '独立入口展示挂单和限价交易心智'],
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
    <UiPanel title="v6 可见入口">
      <div className="space-y-2">
        {[
          ['足球首页', '只展示 AMM 比赛列表和冠军与晋级入口'],
          ['比赛详情', '只展示 outcome、交易面板和持仓摘要'],
          ['我的页面', '只展示 Portfolio 和交易历史'],
          ['不再展示', '订单簿、限价单、撤单、挂单、部分成交挂起'],
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
    <UiPanel title="v5 比赛详情交互">
      <div className="grid gap-2 md:grid-cols-2">
        {['赔率按钮高亮', '点击加入投注单', '盘口折叠展示', '串关冲突提示', '赔率变化提示', '进行中/完赛封盘'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6MatchInteractionPreview() {
  return (
    <UiPanel title="v6 比赛详情交互">
      <div className="grid gap-2 md:grid-cols-2">
        {['outcome 卡片高亮', '右栏显示交易预估', '7/7 市场全部 outcome 化', '买入/卖出双模式', '右栏展示持仓摘要', '市场暂停影响买入和卖出'].map((item) => (
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
        {['初始赔率展示', '赔率变化提示', '投注单显示报价倒计时', '接受最新赔率', '二次确认复核金额/赔率/返还'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewAmmQuoteLifecyclePreview() {
  return (
    <UiPanel title="v6 交易反馈">
      <div className="space-y-2">
        {['选择 outcome 后显示预估成交', '展示均价、价格影响和手续费', '报价过期后提示重新询价', '价格影响过高或流动性不足整笔失败', '成交后更新持仓和交易历史'].map((item) => (
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
        {['按单场/冠军与晋级筛选持仓', '查看份额、均价、现价、市值', '卖出入口替代 Cash Out', '最近成交替代注单记录', '已实现/未实现盈亏', '已结算 / void 按持仓生命周期处理'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldV5FuturesCodePreview() {
  return (
    <UiPanel title="v5 冠军与晋级页面">
      <div className="space-y-2">
        {['报价方式：平台欧洲盘报价', '投注方式：多笔单注，暂不串关', '长期市场展示赔率按钮', '右栏展示投注单和我的注单摘要', '关闭时间和结算来源用于注单复核'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6FuturesCodePreview() {
  return (
    <UiPanel title="v6 冠军与晋级页面">
      <div className="space-y-2">
        {['定价方式：概率 + 份额价格', '交易方式：买入/部分卖出/全部卖出', '11/11 长期市场都展示 outcome 卡', '右栏展示交易面板和持仓摘要', '关闭时间和结算来源用于结果确认'].map((item) => (
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

function ListTablePreview() {
  return (
    <div
      className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-card)]"
      onClickCapture={stopBoardInteraction}
      onKeyDownCapture={stopBoardInteraction}
    >
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

